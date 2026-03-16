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

interface ServerEvent {
  type: "zone-event";
  zone: string;
  event: string;
  data?: any;
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
          // Position validation - prevent teleporting
          const maxTeleport = 100;
          const dx = Math.abs(x - player.x);
          const dy = Math.abs(y - player.y);
          if (dx > maxTeleport || dy > maxTeleport) {
            console.log(`[Server] ${player.name}: Position validation failed (teleport attempt)`);
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
        }
      },

      attack: (conn, { facing, weapon, damage }) => {
        const player = this.players.get(conn.id);
        if (player) {
          // Rate limiting - max 10 attacks per second
          const now = Date.now();
          const lastAttack = player.lastAttack || 0;
          if (now - lastAttack < 100) {
            console.log(`[Server] ${player.name}: Attack rate limited`);
            return;
          }
          player.lastAttack = now;

          this.broadcast({
            type: "player-attack",
            id: player.id,
            facing,
            weapon,
          });
        }
      },

      projectile: (conn, { proj }) => {
        const player = this.players.get(conn.id);
        if (player) {
          this.broadcast({
            type: "projectile",
            proj,
          });
        }
      },

      "hit-player": (conn, { targetId, damage }) => {
        const player = this.players.get(conn.id);
        if (player) {
          const target = this.players.get(targetId);
          if (target) {
            // Server-authoritative damage validation
            const maxDamage = target.maxHp * 0.5; // Can't deal more than 50% of max HP
            if (damage > maxDamage) {
              console.log(`[Server] ${player.name}: Damage validation failed (exceeded ${maxDamage})`);
              return;
            }

            // Apply damage
            target.hp = Math.max(0, target.hp - damage);
            target.stats.damageTaken += damage;

            if (target.hp <= 0) {
              // Player died
              this.broadcast({
                type: "player-death",
                id: target.id,
                killerId: player.id,
              });

              // Update killer stats
              player.stats.kills += 1;
              player.stats.damageDealt += damage;
              player.stats.lastKillTime = Date.now();

              this.broadcast({
                type: "player-kill",
                id: player.id,
                killerId: player.id,
                damage,
              });

              // Reset dead player
              target.hp = target.maxHp;
              target.stats.deaths += 1;
              target.stats.lastDeathTime = Date.now();
            } else {
              this.broadcast({
                type: "player-damage",
                id: target.id,
                damage,
                hp: target.hp,
              });
            }
          }
        }
      },

      chat: (conn, { text }) => {
        const player = this.players.get(conn.id);
        if (player) {
          // Message length validation
          if (text.length > 200) {
            console.log(`[Server] ${player.name}: Chat message too long`);
            return;
          }

          this.broadcast({
            type: "chat",
            id: player.id,
            name: player.name,
            text,
          });
        }
      },

      ping: (conn, {}) => {
        const ctx = this.getCtx(conn);
        this.sendPong(conn);
      },
    };

    // Handle message
    if (message && message.type) {
      const handler = handlers[message.type as keyof typeof handlers];
      if (handler) {
        try {
          handler(conn, message);
        } catch (error) {
          console.error(`[Server] ${roomId}: Handler error for ${message.type}`, error);
        }
      } else {
        console.log(`[Server] ${roomId}: Unknown message type ${message.type}`);
      }
    }
  }

  getCtx(conn: Connection): { roomId: string } {
    const roomId = this.playerConnMap.get(conn.id);
    return { roomId: roomId || "default-room" };
  }

  getRoomId(ctx: ConnectionContext): string {
    return ctx.roomId || "default-room";
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

  sendPong(conn: Connection): void {
    const ctx = this.getCtx(conn);
    const playerCount = this.players.size;
    conn.send({
      type: "pong",
      serverTime: Date.now(),
      playerCount,
    });
  }

  broadcastEvent(event: ServerEvent): void {
    const msg: ServerMessage = {
      type: "zone-event",
      zone: event.zone,
      event: event.event,
      data: event.data,
    };
    this.broadcast(msg);
  }
}
