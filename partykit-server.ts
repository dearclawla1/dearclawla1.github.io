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

interface KillFeedEntry {
  id: string;
  killerId: string;
  killerName: string;
  victimId: string;
  victimName: string;
  weapon: string;
  timestamp: number;
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
  "kill-feed": { kills: KillFeedEntry[] };
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

  // Kill feed tracking
  private killFeed = new Map<string, KillFeedEntry[]>();

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

    // Initialize kill feed for this room
    this.killFeed.set(roomId, []);
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
          const multiplier = this.weaponDamageMultipliers.get(player.weapon) || 1.0;
          const cappedDamage = Math.min(damage * multiplier, this.damageCaps.get(player.weapon) || 100);
          const actualDamage = Math.max(0, cappedDamage);

          target.hp = Math.max(0, target.hp - actualDamage);
          target.stats.damageTaken += actualDamage;
          target.lastUpdate = Date.now();

          this.broadcast({
            type: "state",
            players: Array.from(this.players.values()),
            you: target,
          });

          // Check for death
          if (target.hp <= 0) {
            this.handleDeath(target, conn.id);
          }
        }
      },

      chat: (conn, text) => {
        const player = this.players.get(conn.id);
        if (player) {
          this.broadcast({
            type: "chat",
            id: conn.id,
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
    };

    // Dispatch message handler
    if (message && typeof message === "object" && message.type) {
      const handler = handlers[message.type];
      if (handler) {
        try {
          handler(conn, message);
        } catch (error) {
          console.error(`[Server] ${roomId}: Error in ${message.type} handler`, error);
        }
      }
    }
  },

  handleDeath(deceased: PlayerState, killerId: string): void {
    const roomId = this.getRoomId(this.getCtx(this.connectionMap.get(deceased.id)));
    if (!roomId) return;

    // Update killer stats
    const killer = this.players.get(killerId);
    if (killer) {
      killer.stats.kills++;
      killer.stats.damageDealt += deceased.stats.damageDealt;
      killer.stats.lastKillTime = Date.now();
    }

    // Update deceased stats
    deceased.stats.deaths++;
    deceased.stats.damageTaken += deceased.stats.damageDealt;
    deceased.stats.lastDeathTime = Date.now();

    // Add to kill feed
    const killFeed = this.killFeed.get(roomId);
    if (killFeed) {
      const killEntry: KillFeedEntry = {
        id: `${deceased.id}-${Date.now()}`,
        killerId,
        killerName: killer?.name || "Unknown",
        victimId: deceased.id,
        victimName: deceased.name,
        weapon: killer?.weapon || "Unknown",
        timestamp: Date.now(),
      };
      killFeed.push(killEntry);
      // Keep only last 10 kills
      if (killFeed.length > 10) {
        killFeed.splice(0, killFeed.length - 10);
      }
      this.killFeed.set(roomId, killFeed);
    }

    // Broadcast kill
    this.broadcast({
      type: "player-death",
      id: deceased.id,
      killerId,
    });

    // Broadcast kill feed
    this.broadcast({
      type: "kill-feed",
      kills: killFeed,
    });
  },

  broadcast(data: any, except?: string[]): void {
    const roomId = this.getRoomId(this.getCtx(this.connectionMap.values().next().value));
    const filteredData = except?.includes(data.type) ? data : { ...data, type: data.type };
    this.connectionMap.forEach((conn) => {
      try {
        conn.send(JSON.stringify(filteredData));
      } catch (error) {
        console.error(`[Server] Error sending to ${conn.id}`, error);
      }
    });
  },

  broadcastExcept(data: any, exceptIds: string[]): void {
    const filteredData = exceptIds.length ? data : { ...data, type: data.type };
    this.connectionMap.forEach((conn, connId) => {
      if (!exceptIds.includes(connId)) {
        try {
          conn.send(JSON.stringify(filteredData));
        } catch (error) {
          console.error(`[Server] Error sending to ${connId}`, error);
        }
      }
    });
  },

  getRoomId(ctx: ConnectionContext): string {
    return ctx.roomId;
  },

  getCtx(conn: Connection): ConnectionContext {
    // This is a simplified implementation
    // In real PartyKit, this would be available from the connection context
    return {} as ConnectionContext;
  },
};