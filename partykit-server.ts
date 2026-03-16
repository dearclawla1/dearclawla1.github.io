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
// GAME ROOM
// ============================================================

export default class GameRoom implements Server {
  players = new Map<string, PlayerState>();
  playerConnMap = new Map<string, Connection>();
  connectionMap = new Map<Connection, string>();

  onConnect(conn: Connection, context: ConnectionContext) {
    console.log("Player connected:", conn.id);
    this.connectionMap.set(conn, context.room.id);

    // Send initial state to new player
    const you = this.players.get(conn.id);
    if (you) {
      this.broadcast({
        type: "state",
        players: Array.from(this.players.values()),
        you,
      });
    }
  }

  onClose(conn: Connection) {
    console.log("Player disconnected:", conn.id);
    const roomId = this.connectionMap.get(conn);
    const playerId = this.players.get(conn.id)?.id;

    if (roomId && playerId) {
      this.broadcastExcept(
        {
          type: "player-leave",
          id: playerId,
        },
        conn,
      );
    }

    this.connectionMap.delete(conn);
    this.players.delete(conn.id);
    this.playerConnMap.delete(conn.id);
  }

  onMessage(conn: Connection, message: any) {
    console.log("Message from", conn.id, message);

    const roomId = this.connectionMap.get(conn);
    if (!roomId) return;

    const player = this.players.get(conn.id);
    if (!player) return;

    try {
      switch (message.type) {
        case "join": {
          const { player: newPlayer } = message;
          this.players.set(conn.id, newPlayer);
          this.playerConnMap.set(conn.id, conn);

          // Broadcast player join to others
          this.broadcastExcept(
            {
              type: "player-join",
              player: newPlayer,
            },
            conn,
          );

          // Send full state to new player
          this.broadcast({
            type: "state",
            players: Array.from(this.players.values()),
            you: newPlayer,
          });
          break;
        }

        case "move": {
          const { x, y, facing } = message;
          player.x = x;
          player.y = y;
          player.facing = facing;
          player.lastUpdate = Date.now();

          this.broadcast({
            type: "player-move",
            id: conn.id,
            x,
            y,
            facing,
          });
          break;
        }

        case "attack": {
          const { facing, weapon } = message;
          this.broadcast({
            type: "player-attack",
            id: conn.id,
            facing,
            weapon,
          });
          break;
        }

        case "projectile": {
          const { proj } = message;

          // Validate projectile properties
          if (proj.damage < 0 || proj.range < 0) {
            console.warn("Invalid projectile properties:", proj);
            return;
          }

          this.broadcast({
            type: "projectile",
            proj,
          });
          break;
        }

        case "hit-player": {
          const { targetId, damage } = message;

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
            this.broadcastExcept(
              {
                type: "player-death",
                id: targetId,
                killerId: attacker.id,
              },
              killer,
            );
            this.players.delete(targetId);
            this.playerConnMap.delete(targetId);
          }

          this.broadcastExcept(
            {
              type: "player-damage",
              id: targetId,
              damage: validatedDamage,
              hp: target.hp,
            },
            conn,
          );
          break;
        }

        case "chat": {
          const text = message.text;
          const player = this.players.get(conn.id);
          if (!player) return;

          this.broadcast({
            type: "chat",
            id: conn.id,
            name: player.name,
            text,
          });
          break;
        }

        case "ping": {
          this.broadcast({
            type: "pong",
            serverTime: Date.now(),
            playerCount: this.players.size,
          });
          break;
        }

        default: {
          console.log("Unknown message type:", message.type);
          break;
        }
      }
    } catch (error) {
      console.error("Error handling message:", error);
    }
  }
}
