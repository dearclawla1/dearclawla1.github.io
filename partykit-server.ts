import type { Party, Connection, Server, ConnectionContext } from "partykit/server";

// ============================================================
// TYPES
// ============================================================

interface PlayerStats {
  kills: number;
  deaths: number;
  damageDealt: number;
  damageTaken: number;
  lastKillTime: number;
  lastDeathTime: number;
}

interface PlayerState {
  id: string;
  name: string;
  className: string;
  level: number;
  hp: number;
  maxHp: number;
  x: number;
  y: number;
  facing: { x: number; y: number };
  color: string;
  weapon: string;
  zone: string;
  lastUpdate: number;
  stats: PlayerStats;
}

interface ProjectileState {
  id: string;
  ownerId: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  range: number;
  traveled: number;
  color: string;
  size: number;
}

interface ClientMessage {
  join: { player: PlayerState };
  move: { x: number; y: number; facing: { x: number; y: number } };
  attack: { facing: { x: number; y: number }; weapon: string; damage: number };
  projectile: { proj: ProjectileState };
  "hit-player": { targetId: string; damage: number };
  chat: { text: string };
  ping: {};
  gamecheck: {};
}

interface ServerMessage {
  state: { players: PlayerState[]; you: PlayerState };
  "player-join": { player: PlayerState };
  "player-leave": { id: string };
  "player-move": { id: string; x: number; y: number; facing: { x: number; y: number } };
  "player-attack": { id: string; facing: { x: number; y: number }; weapon: string };
  projectile: { proj: ProjectileState };
  "player-damage": { id: string; damage: number; hp: number };
  "player-death": { id: string; killerId: string };
  "player-kill": { id: string; killerId: string; damage: number };
  "player-stats": { id: string; stats: PlayerStats };
}

// ============================================================
// SERVER CLASS
// ============================================================

export default class GameRoom implements Server {
  private players = new Map<string, PlayerState>();
  private connectionMap = new Map<string, Connection>();
  private playerConnMap = new Map<string, string>();

  // Damage validation tracking
  private damageCooldowns = new Map<string, number>();
  private damageCaps = new Map<string, number>();
  private weaponDamageMultipliers = new Map<string, number>();

  constructor(roomId: string) {
    // Initialize weapon damage caps and multipliers
    this.weaponDamageMultipliers.set("sword", 1.0);
    this.weaponDamageMultipliers.set("axe", 1.2);
    this.weaponDamageMultipliers.set("bow", 0.8);
    this.weaponDamageMultipliers.set("staff", 1.1);
    this.weaponDamageMultipliers.set("dagger", 0.9);
    this.damageCaps.set("sword", 50);
    this.damageCaps.set("axe", 75);
    this.damageCaps.set("bow", 40);
    this.damageCaps.set("staff", 60);
    this.damageCaps.set("dagger", 35);
  }

  onConnect(conn: Connection, ctx: ConnectionContext): void {
    this.connectionMap.set(conn.id, conn);
    const roomId = this.getRoomId(ctx);
    this.playerConnMap.set(roomId, conn.id);

    // Initialize player stats for new connections
    const player = this.players.get(conn.id);
    if (player) {
      player.stats = player.stats || {
        kills: 0,
        deaths: 0,
        damageDealt: 0,
        damageTaken: 0,
        lastKillTime: 0,
        lastDeathTime: 0,
      };
    }

    // Send full state to new player
    this.broadcast({
      type: "state",
      players: Array.from(this.players.values()),
      you: player || null,
    });
  }

  onClose(conn: Connection): void {
    this.connectionMap.delete(conn.id);
    const roomId = Object.keys(this.playerConnMap).find(id => this.playerConnMap.get(id) === conn.id);
    if (roomId) {
      this.playerConnMap.delete(roomId);
    }

    // Broadcast player leave
    this.broadcast({
      type: "player-leave",
      id: conn.id,
    });
  }

  onMessage(conn: Connection, message: any): void {
    const roomId = this.getRoomId(this.getCtx(conn));
    const player = this.players.get(conn.id);

    // Validate connection
    if (!player) {
      console.log(`[Server] ${roomId}: Unknown connection ${conn.id} received message`);
      return;
    }

    const handlers = {
      join: (conn, playerData) => {
        const player = this.players.get(conn.id);
        if (player) {
          // Update existing player
          player.name = playerData.name;
          player.className = playerData.className;
          player.level = playerData.level;
          player.hp = playerData.hp;
          player.maxHp = playerData.maxHp;
          player.x = playerData.x;
          player.y = playerData.y;
          player.facing = playerData.facing;
          player.color = playerData.color;
          player.weapon = playerData.weapon;
          player.zone = playerData.zone;
          player.lastUpdate = Date.now();
          player.stats = player.stats || {
            kills: 0,
            deaths: 0,
            damageDealt: 0,
            damageTaken: 0,
            lastKillTime: 0,
            lastDeathTime: 0,
          };
          this.broadcast({
            type: "state",
            players: Array.from(this.players.values()),
            you: player,
          });
        }
      },

      move: (conn, { x, y, facing }) => {
        const player = this.players.get(conn.id);
        if (player) {
          // Position valid
          player.x = x;
          player.y = y;
          player.facing = facing;
          player.lastUpdate = Date.now();
          this.broadcast({
            type: "state",
            players: Array.from(this.players.values()),
            you: player,
          });
        }
      },

      attack: (conn, { facing, weapon, damage }) => {
        const player = this.players.get(conn.id);
        if (player) {
          // Record attack
          player.lastUpdate = Date.now();
          this.broadcast({
            type: "state",
            players: Array.from(this.players.values()),
            you: player,
          });
        }
      },

      projectile: (conn, { proj }) => {
        const player = this.players.get(conn.id);
        if (player) {
          // Add projectile
          this.broadcast({
            type: "projectile",
            proj,
          });
        }
      },

      "hit-player": (conn, { targetId, damage }) => {
        const target = this.players.get(targetId);
        if (target) {
          // Apply damage to target
          target.hp = Math.max(0, target.hp - damage);
          target.lastUpdate = Date.now();
          
          // Check for death
          if (target.hp <= 0) {
            // Record kill
            this.broadcast({
              type: "player-death",
              id: targetId,
              killerId: conn.id,
            });
            
            // Update killer stats
            const killer = this.players.get(conn.id);
            if (killer) {
              killer.stats.kills += 1;
              killer.stats.lastKillTime = Date.now();
            }
            
            // Update victim stats
            target.stats.deaths += 1;
            target.stats.lastDeathTime = Date.now();
          }
          
          // Broadcast damage
          this.broadcast({
            type: "player-damage",
            id: targetId,
            damage: damage,
            hp: target.hp,
          });
        }
      },

      chat: (conn, { text }) => {
        const player = this.players.get(conn.id);
        if (player) {
          this.broadcast({
            type: "chat",
            id: conn.id,
            name: player.name,
            text: text,
          });
        }
      },

      ping: (conn, {}) => {
        const serverTime = Date.now();
        const playerCount = this.players.size;
        this.broadcast({
          type: "pong",
          serverTime: serverTime,
          playerCount: playerCount,
        });
      },

      gamecheck: (conn, {}) => {
        // Handle game check message
        const serverTime = Date.now();
        this.broadcast({
          type: "pong",
          serverTime: serverTime,
          playerCount: this.players.size,
        });
      },
    };

    // Dispatch handler
    if (handlers[message.type]) {
      try {
        handlers[message.type](conn, message);
      } catch (error) {
        console.error(`[Server] ${roomId}: Handler error for ${message.type}`, error);
      }
    } else {
      console.log(`[Server] ${roomId}: Unknown message type ${message.type}`);
    }
  }

  // ============================================================
  // DAMAGE VALIDATION SYSTEM
  // ============================================================

  /**
   * Validates damage request from client
   * Returns true if damage is authorized, false otherwise
   */
  validateDamageRequest(conn: Connection, targetId: string, damage: number, weapon: string): boolean {
    const attacker = this.players.get(conn.id);
    const target = this.players.get(targetId);

    if (!attacker || !target) {
      return false;
    }

    // Check cooldown
    const now = Date.now();
    const cooldownEnd = this.damageCooldowns.get(conn.id) || 0;
    if (now < cooldownEnd) {
      console.log(`[Server] ${this.getRoomId(this.getCtx(conn))}: Damage request rejected - cooldown active`);
      return false;
    }

    // Set new cooldown (2 seconds between damage requests)
    this.damageCooldowns.set(conn.id, now + 2000);

    // Check damage cap based on weapon
    const cap = this.damageCaps.get(weapon) || 50;
    const multiplier = this.weaponDamageMultipliers.get(weapon) || 1.0;
    const adjustedDamage = Math.floor(damage * multiplier);

    if (adjustedDamage > cap) {
      console.log(`[Server] ${this.getRoomId(this.getCtx(conn))}: Damage request rejected - exceeds cap ${cap}`);
      return false;
    }

    // Check distance (must be within range)
    const distance = this.calculateDistance(attacker.x, attacker.y, target.x, target.y);
    if (distance > 100) {
      console.log(`[Server] ${this.getRoomId(this.getCtx(conn))}: Damage request rejected - out of range`);
      return false;
    }

    // Check if target is alive
    if (target.hp <= 0) {
      console.log(`[Server] ${this.getRoomId(this.getCtx(conn))}: Damage request rejected - target dead`);
      return false;
    }

    return true;
  }

  /**
   * Apply damage authoritatively
   */
  applyDamage(conn: Connection, targetId: string, damage: number, weapon: string): void {
    const attacker = this.players.get(conn.id);
    const target = this.players.get(targetId);

    if (!attacker || !target) {
      return;
    }

    // Validate damage request
    if (!this.validateDamageRequest(conn, targetId, damage, weapon)) {
      return;
    }

    // Apply damage
    const adjustedDamage = Math.floor(damage * (this.weaponDamageMultipliers.get(weapon) || 1.0));
    target.hp = Math.max(0, target.hp - adjustedDamage);
    target.lastUpdate = Date.now();

    // Check for death
    if (target.hp <= 0) {
      // Record kill
      this.broadcast({
        type: "player-death",
        id: targetId,
        killerId: conn.id,
      });

      // Update killer stats
      const killer = this.players.get(conn.id);
      if (killer) {
        killer.stats.kills += 1;
        killer.stats.lastKillTime = Date.now();
      }

      // Update victim stats
      target.stats.deaths += 1;
      target.stats.lastDeathTime = Date.now();
    }

    // Broadcast damage
    this.broadcast({
      type: "player-damage",
      id: targetId,
      damage: adjustedDamage,
      hp: target.hp,
    });
  }

  /**
   * Calculate Euclidean distance between two points
   */
  calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Get room ID from context
   */
  getRoomId(ctx: ConnectionContext): string {
    return ctx.roomId || "default-room";
  }

  /**
   * Get context from connection
   */
  getCtx(conn: Connection): ConnectionContext {
    const context = conn.context as any;
    return context || { roomId: "default-room" };
  }

  /**
   * Broadcast message to all clients
   */
  broadcast(message: ServerMessage): void {
    const roomId = this.getRoomId(this.getCtx(this.connectionMap.values().next().value));
    const roomIdKey = Object.keys(this.playerConnMap).find(key => this.playerConnMap.get(key) === this.connectionMap.values().next().value.id);
    
    // Find all connections in this room
    const roomConnections: Connection[] = [];
    for (const [key, connId] of this.playerConnMap.entries()) {
      if (this.connectionMap.has(connId)) {
        roomConnections.push(this.connectionMap.get(connId)!);
      }
    }

    for (const conn of roomConnections) {
      try {
        conn.send(message);
      } catch (error) {
        console.error(`[Server] ${roomId}: Broadcast error`, error);
      }
    }
  }

  /**
   * Broadcast message to all clients except sender
   */
  broadcastExcept(message: ServerMessage, exceptConn: Connection): void {
    const roomId = this.getRoomId(this.getCtx(this.connectionMap.values().next().value));
    const exceptId = exceptConn.id;

    // Find all connections in this room except sender
    const roomConnections: Connection[] = [];
    for (const [key, connId] of this.playerConnMap.entries()) {
      if (this.connectionMap.has(connId) && connId !== exceptId) {
        roomConnections.push(this.connectionMap.get(connId)!);
      }
    }

    for (const conn of roomConnections) {
      try {
        conn.send(message);
      } catch (error) {
        console.error(`[Server] ${roomId}: BroadcastExcept error`, error);
      }
    }
  }
}
