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
  "zone-event": { event: string; data?: any };
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

  // Zone-wide statistics tracking
  private zoneStats = new Map<string, ZoneStatistics>();

  // Anti-cheat tracking
  private movementHistory = new Map<string, Array<{ x: number; y: number; timestamp: number }>>();
  private attackHistory = new Map<string, Array<{ timestamp: number; damage: number }>>();

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

    // Initialize zone statistics
    this.zoneStats.set(roomId, {
      totalKills: 0,
      totalDeaths: 0,
      totalDamageDealt: 0,
      totalDamageTaken: 0,
      activePlayers: 0,
      maxActivePlayers: 0,
    });
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

    // Initialize movement history
    if (!this.movementHistory.has(conn.id)) {
      this.movementHistory.set(conn.id, []);
    }

    // Initialize attack history
    if (!this.attackHistory.has(conn.id)) {
      this.attackHistory.set(conn.id, []);
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

    // Clean up tracking data
    this.movementHistory.delete(conn.id);
    this.attackHistory.delete(conn.id);

    // Update zone statistics
    const zoneStat = this.zoneStats.get(roomId);
    if (zoneStat) {
      zoneStat.activePlayers = Math.max(0, zoneStat.activePlayers - 1);
      zoneStat.maxActivePlayers = Math.max(zoneStat.activePlayers, zoneStat.maxActivePlayers);
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
        const existingPlayer = this.players.get(conn.id);
        if (existingPlayer) {
          // Update existing player
          existingPlayer.name = playerData.name;
          existingPlayer.className = playerData.className;
          existingPlayer.level = playerData.level;
          existingPlayer.hp = playerData.hp;
          existingPlayer.maxHp = playerData.maxHp;
          existingPlayer.x = playerData.x;
          existingPlayer.y = playerData.y;
          existingPlayer.facing = playerData.facing;
          existingPlayer.color = playerData.color;
          existingPlayer.weapon = playerData.weapon;
          existingPlayer.zone = playerData.zone;
          existingPlayer.lastUpdate = Date.now();
          existingPlayer.stats = existingPlayer.stats || {
            kills: 0,
            deaths: 0,
            damageDealt: 0,
            damageTaken: 0,
            lastKillTime: 0,
            lastDeathTime: 0,
          };
        } else {
          // Add new player
          this.players.set(conn.id, {
            ...playerData,
            zone: roomId,
            lastUpdate: Date.now(),
            stats: playerData.stats || {
              kills: 0,
              deaths: 0,
              damageDealt: 0,
              damageTaken: 0,
              lastKillTime: 0,
              lastDeathTime: 0,
            },
          });
        }

        // Update zone statistics
        const zoneStat = this.zoneStats.get(roomId);
        if (zoneStat) {
          zoneStat.activePlayers = Math.max(0, zoneStat.activePlayers + 1);
          zoneStat.maxActivePlayers = Math.max(zoneStat.activePlayers, zoneStat.maxActivePlayers);
        }

        this.broadcast({
          type: "state",
          players: Array.from(this.players.values()),
          you: existingPlayer || null,
        });
      },

      move: (conn, { x, y, facing }) => {
        const player = this.players.get(conn.id);
        if (player) {
          // Position validation - check for teleportation
          const movementHistory = this.movementHistory.get(conn.id) || [];
          const lastMovement = movementHistory[movementHistory.length - 1];
          const maxTeleportDistance = 100; // Maximum allowed teleport distance

          if (lastMovement) {
            const dx = x - lastMovement.x;
            const dy = y - lastMovement.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > maxTeleportDistance) {
              console.log(`[Server] ${roomId}: ${player.name} attempted teleportation (distance: ${distance.toFixed(2)})`);
              // Reject invalid movement
              return;
            }
          }

          // Add movement to history
          const movementHistory = this.movementHistory.get(conn.id) || [];
          movementHistory.push({ x, y, timestamp: Date.now() });
          if (movementHistory.length > 100) {
            movementHistory.shift();
          }

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
          // Attack validation
          const weaponMultiplier = this.weaponDamageMultipliers.get(weapon) || 1.0;
          const maxDamage = this.damageCaps.get(weapon) || 100;
          const adjustedDamage = damage * weaponMultiplier;

          if (adjustedDamage > maxDamage) {
            console.log(`[Server] ${roomId}: ${player.name} attempted damage overflow (weapon: ${weapon}, damage: ${damage.toFixed(2)})`);
            // Cap damage
            damage = maxDamage / weaponMultiplier;
          }

          // Add attack to history
          const attackHistory = this.attackHistory.get(conn.id) || [];
          attackHistory.push({ timestamp: Date.now(), damage });
          if (attackHistory.length > 100) {
            attackHistory.shift();
          }

          this.broadcast({
            type: "player-attack",
            id: player.id,
            facing: facing,
            weapon: weapon,
          });
        }
      },

      projectile: (conn, { proj }) => {
        const player = this.players.get(conn.id);
        if (player) {
          // Validate projectile ownership
          if (proj.ownerId !== player.id) {
            console.log(`[Server] ${roomId}: Projectile ownership mismatch (owner: ${proj.ownerId}, player: ${player.id})`);
            return;
          }

          // Validate projectile damage
          const weaponMultiplier = this.weaponDamageMultipliers.get(player.weapon) || 1.0;
          const maxDamage = this.damageCaps.get(player.weapon) || 100;
          const adjustedDamage = proj.damage * weaponMultiplier;

          if (adjustedDamage > maxDamage) {
            console.log(`[Server] ${roomId}: Projectile damage overflow (damage: ${proj.damage.toFixed(2)})`);
            proj.damage = maxDamage / weaponMultiplier;
          }

          this.broadcast({
            type: "projectile",
            proj: proj,
          });
        }
      },

      "hit-player": (conn, { targetId, damage }) => {
        const player = this.players.get(conn.id);
        if (player) {
          // Validate damage
          const weaponMultiplier = this.weaponDamageMultipliers.get(player.weapon) || 1.0;
          const maxDamage = this.damageCaps.get(player.weapon) || 100;
          const adjustedDamage = damage * weaponMultiplier;

          if (adjustedDamage > maxDamage) {
            console.log(`[Server] ${roomId}: Damage overflow (damage: ${damage.toFixed(2)})`);
            damage = maxDamage / weaponMultiplier;
          }

          // Find target player
          const target = this.players.get(targetId);
          if (target) {
            // Apply damage
            target.hp = Math.max(0, target.hp - damage);
            target.stats.damageTaken += damage;
            target.stats.damageDealt += damage; // Attacker deals damage

            // Update attacker stats
            const attacker = this.players.get(conn.id);
            if (attacker) {
              attacker.stats.damageDealt += damage;
            }

            // Check for death
            if (target.hp <= 0) {
              this.handleDeath(target, conn.id);
            }

            // Broadcast damage
            this.broadcast({
              type: "player-damage",
              id: target.id,
              damage: damage,
              hp: target.hp,
            });
          }
        }
      },

      chat: (conn, { text }) => {
        const player = this.players.get(conn.id);
        if (player) {
          // Simple chat validation
          if (text.length > 200) {
            console.log(`[Server] ${roomId}: Chat message too long`);
            return;
          }

          this.broadcast({
            type: "chat",
            id: player.id,
            name: player.name,
            text: text,
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
        const player = this.players.get(conn.id);
        if (player) {
          // Game check handler - can be used for server-side validation
          console.log(`[Server] ${roomId}: Game check from ${player.name}`);
        }
      },
    };

    // Execute appropriate handler
    if (message.type && handlers[message.type]) {
      handlers[message.type](conn, message);
    } else if (message) {
      // Handle unknown message types safely
      console.log(`[Server] ${roomId}: Unknown message type: ${JSON.stringify(message)}`);
    }
  },

  handleDeath(deceased: PlayerState, killerId: string): void {
    // Update deceased player stats
    deceased.stats.deaths += 1;
    deceased.stats.damageTaken += 100; // Assume 100 damage caused death
    deceased.lastDeathTime = Date.now();

    // Update killer stats if valid
    const killer = this.players.get(killerId);
    if (killer) {
      killer.stats.kills += 1;
      killer.stats.damageDealt += 100;
      killer.lastKillTime = Date.now();
    }

    // Update zone statistics
    const zoneStat = this.zoneStats.get(this.getRoomId(this.getCtx(this.connectionMap.get(killerId || deceased.id))));
    if (zoneStat) {
      zoneStat.totalKills += 1;
      zoneStat.totalDeaths += 1;
      zoneStat.totalDamageDealt += 100;
      zoneStat.totalDamageTaken += 100;
    }

    // Broadcast death
    this.broadcast({
      type: "player-death",
      id: deceased.id,
      killerId: killerId,
    });

    // Remove player from map
    this.players.delete(deceased.id);
  },

  broadcast(message: ServerMessage): void {
    const roomId = this.getRoomId(this.getCtx(this.connectionMap.values().next().value));
    const connId = this.playerConnMap.get(roomId);
    if (connId) {
      this.connectionMap.get(connId)?.send(JSON.stringify(message));
    }
  },

  broadcastExcept(message: ServerMessage, exceptConn: Connection): void {
    const roomId = this.getRoomId(this.getCtx(this.connectionMap.values().next().value));
    const connId = this.playerConnMap.get(roomId);
    if (connId) {
      this.connectionMap.get(connId)?.send(JSON.stringify(message));
    }
  },

  getRoomId(ctx: ConnectionContext): string {
    return ctx.roomId;
  },

  getCtx(conn: Connection): ConnectionContext {
    // This is a simplified version - in practice, you'd need to store context
    return {} as ConnectionContext;
  },
};

// ============================================================
// ZONE EVENT METHODS
// ============================================================

export interface ZoneEventSystem {
  broadcastZoneEvent: (roomId: string, event: string, data?: any) => void;
  getActiveEvents: (roomId: string) => ZoneEvent[];
  addZoneEvent: (roomId: string, event: string, data?: any, duration?: number) => void;
}

export const zoneEventSystem: ZoneEventSystem = {
  broadcastZoneEvent: (roomId: string, event: string, data?: any) => {
    const zoneEvents = zoneEvents.get(roomId) || [];
    zoneEvents.push({
      id: `${roomId}-${Date.now()}`,
      type: event,
      data,
      timestamp: Date.now(),
      duration: 0,
    });
    this.broadcast({
      type: "zone-event",
      event: event,
      data: data,
    });
  },
  getActiveEvents: (roomId: string) => {
    return zoneEvents.get(roomId) || [];
  },
  addZoneEvent: (roomId: string, event: string, data?: any, duration?: number) => {
    const zoneEvents = zoneEvents.get(roomId) || [];
    zoneEvents.push({
      id: `${roomId}-${Date.now()}`,
      type: event,
      data,
      timestamp: Date.now(),
      duration: duration || 0,
    });
    this.broadcast({
      type: "zone-event",
      event: event,
      data: data,
    });
  },
};

// ============================================================
// ZONE STATISTICS
// ============================================================

interface ZoneStatistics {
  totalKills: number;
  totalDeaths: number;
  totalDamageDealt: number;
  totalDamageTaken: number;
  activePlayers: number;
  maxActivePlayers: number;
}
