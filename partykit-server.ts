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

  constructor(roomId: string) {
    // Room initialization
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
          player.weapon = weapon;
          player.lastUpdate = Date.now();
          this.broadcast({
            type: "player-attack",
            id: conn.id,
            facing: facing,
            weapon: weapon,
          });
        }
      },

      projectile: (conn, projData) => {
        const player = this.players.get(conn.id);
        if (player) {
          this.broadcast({
            type: "projectile",
            proj: projData,
          });
        }
      },

      "hit-player": (conn, { targetId, damage }) => {
        const player = this.players.get(conn.id);
        if (player) {
          this.broadcast({
            type: "player-damage",
            id: targetId,
            damage: damage,
            hp: player.hp - damage,
          });
        }
      },

      chat: (conn, { text }) => {
        const player = this.players.get(conn.id);
        if (player) {
          this.broadcast({
            type: "chat",
            text: text,
          });
        }
      },

      ping: (conn, {}) => {
        const player = this.players.get(conn.id);
        if (player) {
          this.broadcast({
            type: "ping",
          });
        }
      },
    };

    // Handle message based on type
    if (message.type === "join") {
      handlers.join(conn, message.player);
    } else if (message.type === "move") {
      handlers.move(conn, message);
    } else if (message.type === "attack") {
      handlers.attack(conn, message);
    } else if (message.type === "projectile") {
      handlers.projectile(conn, message);
    } else if (message.type === "hit-player") {
      handlers["hit-player"](conn, message);
    } else if (message.type === "chat") {
      handlers.chat(conn, message);
    } else if (message.type === "ping") {
      handlers.ping(conn, message);
    } else {
      console.log(`[Server] ${roomId}: Unknown message type ${message.type}`);
    }
  }

  broadcast(msg: any): void {
    const roomId = Object.keys(this.playerConnMap).find(id => this.playerConnMap.get(id) !== undefined);
    if (roomId) {
      const conn = this.connectionMap.get(this.playerConnMap.get(roomId));
      if (conn) {
        conn.send(msg);
      }
    }
  }

  getRoomId(ctx: ConnectionContext): string {
    return ctx.roomId || "default";
  }

  getCtx(conn: Connection): ConnectionContext {
    // Implementation to get context
    return {} as ConnectionContext;
  }
}
