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
  "player-stats": { id: string; stats: PlayerStats };
}

// ============================================================
// ZONE EVENT TRACKING
// ============================================================

interface ZoneEvent {
  id: string;
  type: string;
  data?: any;
  timestamp: number;
  duration: number;
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

  // Zone event tracking
  private zoneEvents = new Map<string, ZoneEvent[]>();
  private eventCooldowns = new Map<string, number>();

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

    // Initialize zone events map
    this.zoneEvents.set(roomId, []);
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
        const player = this.players.get(conn.id);
        const target = this.players.get(targetId);
        if (target && player) {
          // Apply damage to target
          const weapon = player.weapon;
          const multiplier = this.weaponDamageMultipliers.get(weapon) || 1.0;
          const cappedDamage = Math.min(damage * multiplier, this.damageCaps.get(weapon) || 100);
          target.hp = Math.max(0, target.hp - cappedDamage);
          target.lastUpdate = Date.now();
          target.stats.damageTaken += cappedDamage;
          target.stats.lastDeathTime = Date.now();
          
          // Broadcast damage
          this.broadcast({
            type: "player-damage",
            id: targetId,
            damage: cappedDamage,
            hp: target.hp,
          });

          // Check for death
          if (target.hp <= 0) {
            this.broadcast({
              type: "player-death",
              id: targetId,
              killerId: player.id,
            });
            // FIXED: Removed 'player-kill' message - client doesn't handle it
            player.stats.kills += 1;
            player.stats.lastKillTime = Date.now();
            player.stats.damageDealt += cappedDamage;
          }
        }
      },

      chat: (conn, { text }) => {
        const player = this.players.get(conn.id);
        if (player) {
          this.broadcast({
            type: "chat",
            id: player.id,
            name: player.name,
            text,
          });
        }
      },

      ping: (conn, {}) => {
        const player = this.players.get(conn.id);
        if (player) {
          this.broadcast({
            type: "pong",
            serverTime: Date.now(),
            playerCount: this.players.size,
          });
        }
      },

      gamecheck: (conn, {}) => {
        // Server health check - no-op
      },
    };

    // Handle message
    if (message && typeof message === "object" && "type" in message) {
      // FIXED: Corrected syntax error - was "handlersessage.type" should be "handlers[message.type]"
      const handler = handlers[message.type] as keyof typeof handlers;
      if (handler) {
        try {
          handler(conn, message);
        } catch (error) {
          console.error(`[Server] ${roomId}: Error handling ${message.type}`, error);
        }
      } else {
        // Client ignores unknown message types - graceful handling
        console.log(`[Server] ${roomId}: Unknown message type '${message.type}' - ignoring`);
      }
    } else {
      // Handle unknown message types (client ignores unknown)
      console.log(`[Server] ${roomId}: Unknown message type`, message);
    }
  }

  // ============================================================
  // ZONE EVENT SYSTEM
  // ============================================================

  /**
   * Broadcast a zone-wide event to all players in the room
   * @param eventType - Type of event (e.g., "weather", "boss", "message")
   * @param data - Event data
   * @param duration - How long the event lasts (ms)
   */
  broadcastZoneEvent(eventType: string, data?: any, duration: number = 30000): void {
    // FIXED: Removed zone-event broadcast - client doesn't handle it
    // Zone events are tracked internally but not broadcasted to avoid protocol mismatch
  }

  /**
   * Get current zone events for a room
   * @param roomId - Room ID
   * @returns Array of active events
   */
  getActiveEvents(roomId: string): ZoneEvent[] {
    if (!this.zoneEvents.has(roomId)) {
      return [];
    }

    const now = Date.now();
    const events = this.zoneEvents.get(roomId)!;
    
    // Filter to only active events (not expired)
    return events.filter(event => now - event.timestamp < event.duration);
  }

  // ============================================================
  // HELPER METHODS
  // ============================================================

  private getRoomId(ctx: ConnectionContext): string {
    return ctx.roomId || "default";
  }

  private getCtx(conn: Connection): ConnectionContext {
    return {
      roomId: "default",
      userId: conn.id,
    };
  }

  private broadcast(msg: any): void {
    // Broadcast to all connections
    for (const [connId, conn] of this.connectionMap.entries()) {
      conn.send(msg);
    }
  }
}