import type { Party, Connection, Server, ConnectionContext } from "partykit/server";

// ============================================================
// TYPES
// ============================================================

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
  hit-player: { targetId: string; damage: number };
  chat: { text: string };
  ping: {};
}

interface ServerMessage {
  state: { players: PlayerState[]; you: PlayerState };
  player-join: { player: PlayerState };
  player-leave: { id: string };
  player-move: { id: string; x: number; y: number; facing: { x: number; y: number } };
  player-attack: { id: string; facing: { x: number; y: number }; weapon: string };
  projectile: { proj: ProjectileState };
  player-damage: { id: string; damage: number; hp: number };
  player-death: { id: string; killerId: string };
  chat: { id: string; name: string; text: string };
  pong: { serverTime: number; playerCount: number };
}

// ============================================================
// SERVER IMPLEMENTATION
// ============================================================

export default class GameRoom implements Server {
  players: Map<string, PlayerState> = new Map();
  connectionMap: Map<string, Connection> = new Map();
  playerConnMap: Map<string, Connection> = new Map();

  onConnect(ctx: ConnectionContext): void {
    const conn = ctx.connection;
    this.connectionMap.set(conn.id, conn);

    conn.send({
      type: "connect",
      zone: ctx.roomId,
    });
  }

  onClose(conn: Connection): void {
    this.connectionMap.delete(conn.id);
    for (const [id, conn] of this.playerConnMap) {
      if (conn.id === conn.id) {
        this.playerConnMap.delete(id);
        this.broadcastExcept({
          type: "player-leave",
          id,
        }, conn);
        break;
      }
    }
  }

  onMessage(conn: Connection, msg: any): void {
    try {
      const parsed = this.parseMessage(msg);
      if (!parsed) return;

      const handler = this.handlers[parsed.type];
      if (handler) {
        handler(conn, parsed.payload);
      }
    } catch (err) {
      console.error("Error handling message:", err);
    }
  }

  parseMessage(msg: any): { type: keyof ClientMessage; payload: any } | null {
    if (!msg) return null;
    const type = Object.keys(msg)[0] as keyof ClientMessage;
    if (!type) return null;
    try {
      return { type, payload: msg[type] };
    } catch {
      return null;
    }
  }

  handlers: Record<string, (conn: Connection, payload: any) => void> = {
    join: (conn, player) => {
      const playerState = {
        ...player,
        zone: ctx.roomId,
        lastUpdate: Date.now(),
      };

      this.players.set(player.id, playerState);
      this.playerConnMap.set(player.id, conn);
      this.connectionMap.set(conn.id, conn);

      this.broadcast({
        type: "state",
        players: Array.from(this.players.values()),
        you: playerState,
      });

      this.broadcastExcept({
        type: "player-join",
        player: playerState,
      }, conn);

      this.sendPong(conn);
    },

    move: (conn, { x, y, facing }) => {
      const player = this.players.get(conn.id);
      if (!player) return;

      // Validate position bounds (prevent teleporting)
      const maxBound = 10000;
      if (x < -maxBound || x > maxBound || y < -maxBound || y > maxBound) {
        console.warn("Invalid position detected:", { x, y });
        return;
      }

      player.x = x;
      player.y = y;
      player.facing = facing;
      player.lastUpdate = Date.now();

      this.broadcast({
        type: "player-move",
        id: player.id,
        x,
        y,
        facing,
      });
    },

    attack: (conn, { facing, weapon, damage }) => {
      const player = this.players.get(conn.id);
      if (!player) return;

      this.broadcast({
        type: "player-attack",
        id: player.id,
        facing,
        weapon,
      });
    },

    projectile: (conn, { proj }) => {
      const player = this.players.get(conn.id);
      if (!player) return;

      // Validate projectile properties
      if (proj.damage < 0 || proj.range < 0) {
        console.warn("Invalid projectile properties:", proj);
        return;
      }

      this.broadcast({
        type: "projectile",
        proj,
      });
    },

    "hit-player": (conn, { targetId, damage }) => {
      const attacker = this.players.get(conn.id);
      if (!attacker) return;

      const target = this.players.get(targetId);
      if (!target) {
        console.warn("Target not found:", targetId);
        return;
      }

      // Server-side damage validation (anti-cheat)
      const maxDamage = 1000; // Cap damage to prevent exploits
      const validatedDamage = Math.min(damage, maxDamage);

      // Apply damage to target
      target.hp = Math.max(0, target.hp - validatedDamage);

      // Check for death
      if (target.hp <= 0) {
        const killer = this.playerConnMap.get(targetId);
        this.broadcastExcept({
          type: "player-death",
          id: targetId,
          killerId: attacker.id,
        }, killer);
        this.players.delete(targetId);
        this.playerConnMap.delete(targetId);
      }

      this.broadcastExcept({
        type: "player-damage",
        id: targetId,
        damage: validatedDamage,
        hp: target.hp,
      }, conn);
    },

    chat: (conn, text) => {
      const player = this.players.get(conn.id);
      if (!player) return;

      this.broadcast({
        type: "chat",
        id: player.id,
        name: player.name,
        text,
      });
    },

    ping: (conn, {}) => {
      this.sendPong(conn);
    },
  };

  sendPong(conn: Connection): void {
    const playerCount = this.players.size;
    this.broadcastExcept({
      type: "pong",
      serverTime: Date.now(),
      playerCount,
    }, conn);
  }

  broadcast(msg: ServerMessage): void {
    for (const conn of this.connectionMap.values()) {
      conn.send(msg);
    }
  }

  broadcastExcept(msg: ServerMessage, exceptConn: Connection): void {
    for (const conn of this.connectionMap.values()) {
      if (conn.id !== exceptConn.id) {
        conn.send(msg);
      }
    }
  }

  send(msg: ServerMessage, conn: Connection): void {
    conn.send(msg);
  }
}

// ============================================================
// SERVER CONTEXT
// ============================================================

const ctx = {} as ConnectionContext;
