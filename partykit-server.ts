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
          // Calculate attack position
          const attackX = player.x + facing.x * 50;
          const attackY = player.y + facing.y * 50;
          
          // Create projectile
          const projectile: ProjectileState = {
            id: `proj-${Date.now()}`,
            ownerId: conn.id,
            x: player.x,
            y: player.y,
            vx: facing.x * 10,
            vy: facing.y * 10,
            damage: damage,
            range: 200,
            traveled: 0,
            color: "#ff0000",
            size: 5,
          };
          
          this.broadcast({
            type: "projectile",
            proj: projectile,
          });
        }
      },

      projectile: (conn, projData) => {
        const player = this.players.get(conn.id);
        if (player) {
          const projectile: ProjectileState = {
            id: projData.id,
            ownerId: projData.ownerId,
            x: projData.x,
            y: projData.y,
            vx: projData.vx,
            vy: projData.vy,
            damage: projData.damage,
            range: projData.range,
            traveled: projData.traveled,
            color: projData.color,
            size: projData.size,
          };
          
          this.broadcast({
            type: "projectile",
            proj: projectile,
          });
        }
      },

      "hit-player": (conn, { targetId, damage }) => {
        const target = this.players.get(targetId);
        if (target) {
          const player = this.players.get(conn.id);
          if (player) {
            target.hp -= damage;
            target.lastUpdate = Date.now();
            
            // Check death
            if (target.hp <= 0) {
              target.hp = 0;
              this.broadcast({
                type: "player-death",
                id: targetId,
                killerId: conn.id,
              });
              
              // Update killer stats
              player.stats.kills++;
              player.stats.lastKillTime = Date.now();
            } else {
              // Update damage stats
              player.stats.damageDealt += damage;
              target.stats.damageTaken += damage;
            }
            
            this.broadcast({
              type: "player-damage",
              id: targetId,
              damage: damage,
              hp: target.hp,
            });
          }
        }
      },

      chat: (conn, { text }) => {
        const player = this.players.get(conn.id);
        if (player) {
          this.broadcast({
            type: "chat",
            text: text,
            from: player.name,
          });
        }
      },

      ping: (conn, {}) => {
        // Handle ping from client - FIX: Added ping handler
        this.broadcast({
          type: "ping",
          pong: Date.now(),
        });
      },
    };

    // Dispatch message
    if (handlers[message.type]) {
      handlers[message.type](conn, message);
    } else {
      console.log(`[Server] ${roomId}: Unknown message type ${message.type}`);
    }
  }

  broadcast(message: any): void {
    const roomId = Object.keys(this.playerConnMap).find(id => this.playerConnMap.get(id) !== null);
    if (roomId) {
      const conn = this.connectionMap.get(this.playerConnMap.get(roomId));
      if (conn) {
        conn.send(message);
      }
    }
  }

  getRoomId(ctx: ConnectionContext): string {
    return ctx.roomId || "default";
  }

  getCtx(conn: Connection): ConnectionContext {
    return {
      roomId: "default",
    };
  }
}