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
// SERVER CONSTANTS
// ============================================================

const DAMAGE_CAPS = {
  melee: 50,
  ranged: 30,
  magic: 40,
};

const RATE_LIMITS = {
  attacks: 1000, // ms between attacks
  moves: 500, // ms between moves
};

const POSITION_VALIDATION = {
  maxDistance: 100, // max movement per tick
  minDistance: 1, // min movement to prevent teleporting
};

// ============================================================
// SERVER CLASS
// ============================================================

export default class GameRoom implements Server {
  players = new Map<string, PlayerState>();
  connectionMap = new Map<string, Connection>();
  playerConnMap = new Map<string, Connection>();

  constructor(public room: Party) {}

  // ===========================================================
  // CONNECTION HANDLERS
  // ===========================================================

  async onConnect(conn: Connection, ctx: ConnectionContext) {
    console.log(`[${ctx.room.id}] Player connected: ${conn.id}`);
    this.connectionMap.set(conn.id, conn);
  }

  async onClose(conn: Connection) {
    console.log(`[${ctx.room.id}] Player disconnected: ${conn.id}`);
    this.connectionMap.delete(conn.id);
    const player = this.players.get(conn.id);
    if (player) {
      this.broadcastExcept({ type: "player-leave", id: player.id }, conn);
      this.players.delete(conn.id);
    }
  }

  // ===========================================================
  // MESSAGE HANDLERS
  // ===========================================================

  async onMessage(conn: Connection, msg: any) {
    try {
      const type = msg.type;
      const payload = msg.payload;

      switch (type) {
        case "join":
          await this.handleJoin(conn, payload);
          break;

        case "move":
          await this.handleMove(conn, payload);
          break;

        case "attack":
          await this.handleAttack(conn, payload);
          break;

        case "projectile":
          await this.handleProjectile(conn, payload);
          break;

        case "hit-player":
          await this.handleHitPlayer(conn, payload);
          break;

        case "chat":
          await this.handleChat(conn, payload);
          break;

        case "ping":
          await this.handlePing(conn);
          break;

        default:
          console.log(`[${this.room.id}] Unknown message type: ${type}`);
      }
    } catch (error) {
      console.error(`[${this.room.id}] Error handling message:`, error);
    }
  }

  // ===========================================================
  // MESSAGE HANDLER IMPLEMENTATIONS
  // ===========================================================

  async handleJoin(conn: Connection, payload: { player: PlayerState }) {
    const player = payload.player;
    
    // Validate player data
    if (!player.id || !player.name || !player.zone) {
      throw new Error("Invalid player data");
    }

    // Check if player already exists (prevent duplicate join)
    if (this.players.has(player.id)) {
      console.log(`[${this.room.id}] Player ${player.id} already in zone`);
      return;
    }

    // Set last update time
    player.lastUpdate = Date.now();

    // Add player to server
    this.players.set(player.id, player);
    this.playerConnMap.set(player.id, conn);

    // Broadcast state to all except joining player
    const state: ServerMessage["state"] = {
      players: Array.from(this.players.values()),
      you: player,
    };
    this.broadcastExcept(state, conn);

    // Broadcast player join
    this.broadcast({ type: "player-join", player });

    console.log(`[${this.room.id}] Player joined: ${player.name} (${player.id})`);
  }

  async handleMove(conn: Connection, payload: { x: number; y: number; facing: { x: number; y: number } }) {
    const player = this.playerConnMap.get(conn.id);
    if (!player) return;

    // Validate movement
    const dx = payload.x - player.x;
    const dy = payload.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > POSITION_VALIDATION.maxDistance) {
      console.log(`[${this.room.id}] Movement too far: ${distance.toFixed(2)} > ${POSITION_VALIDATION.maxDistance}`);
      return;
    }

    if (distance < POSITION_VALIDATION.minDistance) {
      console.log(`[${this.room.id}] Movement too small (possible teleport): ${distance.toFixed(2)}`);
      return;
    }

    // Update player position
    player.x = payload.x;
    player.y = payload.y;
    player.facing = payload.facing;
    player.lastUpdate = Date.now();

    // Broadcast movement
    this.broadcast({
      type: "player-move",
      id: player.id,
      x: player.x,
      y: player.y,
      facing: player.facing,
    });

    console.log(`[${this.room.id}] Player moved: ${player.name} to (${player.x.toFixed(1)}, ${player.y.toFixed(1)})`);
  }

  async handleAttack(conn: Connection, payload: { facing: { x: number; y: number }; weapon: string; damage: number }) {
    const player = this.playerConnMap.get(conn.id);
    if (!player) return;

    // Rate limit attacks
    const now = Date.now();
    const lastAttack = player.lastAttack || 0;
    if (now - lastAttack < RATE_LIMITS.attacks) {
      console.log(`[${this.room.id}] Attack rate limited: ${player.name}`);
      return;
    }
    player.lastAttack = now;

    // Cap damage by weapon type
    let cappedDamage = payload.damage;
    const weaponType = payload.weapon.toLowerCase();
    if (weaponType.includes("melee") || weaponType.includes("sword") || weaponType.includes("axe")) {
      cappedDamage = Math.min(cappedDamage, DAMAGE_CAPS.melee);
    } else if (weaponType.includes("bow") || weaponType.includes("arrow") || weaponType.includes("gun")) {
      cappedDamage = Math.min(cappedDamage, DAMAGE_CAPS.ranged);
    } else if (weaponType.includes("spell") || weaponType.includes("fireball") || weaponType.includes("magic")) {
      cappedDamage = Math.min(cappedDamage, DAMAGE_CAPS.magic);
    }

    // Broadcast attack
    this.broadcast({
      type: "player-attack",
      id: player.id,
      facing: payload.facing,
      weapon: payload.weapon,
    });

    console.log(`[${this.room.id}] Attacked: ${player.name} with ${payload.weapon} (damage: ${cappedDamage})`);
  }

  async handleProjectile(conn: Connection, payload: { proj: ProjectileState }) {
    const player = this.playerConnMap.get(conn.id);
    if (!player) return;

    // Validate projectile owner
    if (payload.proj.ownerId !== player.id) {
      console.log(`[${this.room.id}] Invalid projectile owner: ${payload.proj.ownerId} vs ${player.id}`);
      return;
    }

    // Cap projectile damage
    let cappedDamage = payload.proj.damage;
    const weaponType = player.weapon.toLowerCase();
    if (weaponType.includes("spell") || weaponType.includes("fireball") || weaponType.includes("magic")) {
      cappedDamage = Math.min(cappedDamage, DAMAGE_CAPS.magic);
    } else if (weaponType.includes("bow") || weaponType.includes("arrow") || weaponType.includes("gun")) {
      cappedDamage = Math.min(cappedDamage, DAMAGE_CAPS.ranged);
    }

    // Update projectile damage
    payload.proj.damage = cappedDamage;

    // Broadcast projectile
    this.broadcast({
      type: "projectile",
      proj: payload.proj,
    });

    console.log(`[${this.room.id}] Projectile fired: ${player.name} (damage: ${cappedDamage})`);
  }

  async handleHitPlayer(conn: Connection, payload: { targetId: string; damage: number }) {
    const attacker = this.playerConnMap.get(conn.id);
    if (!attacker) return;

    const target = this.players.get(payload.targetId);
    if (!target) {
      console.log(`[${this.room.id}] Target not found: ${payload.targetId}`);
      return;
    }

    // Server-side damage validation (anti-cheat)
    // Only allow damage if attacker is within reasonable range
    const dx = attacker.x - target.x;
    const dy = attacker.y - target.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Cap damage by weapon type
    let cappedDamage = payload.damage;
    const weaponType = attacker.weapon.toLowerCase();
    if (weaponType.includes("melee") || weaponType.includes("sword") || weaponType.includes("axe")) {
      cappedDamage = Math.min(cappedDamage, DAMAGE_CAPS.melee);
    } else if (weaponType.includes("bow") || weaponType.includes("arrow") || weaponType.includes("gun")) {
      cappedDamage = Math.min(cappedDamage, DAMAGE_CAPS.ranged);
    } else if (weaponType.includes("spell") || weaponType.includes("fireball") || weaponType.includes("magic")) {
      cappedDamage = Math.min(cappedDamage, DAMAGE_CAPS.magic);
    }

    // Validate damage is not excessive (anti-cheat)
    if (cappedDamage > 100) {
      console.log(`[${this.room.id}] Excessive damage blocked: ${cappedDamage} > 100`);
      cappedDamage = 100;
    }

    // Apply damage (authoritative)
    const newHp = target.hp - cappedDamage;
    target.hp = newHp;
    target.lastUpdate = Date.now();

    // Broadcast damage
    this.broadcast({
      type: "player-damage",
      id: target.id,
      damage: cappedDamage,
      hp: newHp,
    });

    // Check for death
    if (newHp <= 0) {
      // Find killer for death broadcast
      const killerId = conn.id;
      this.broadcast({
        type: "player-death",
        id: target.id,
        killerId: killerId,
      });
      console.log(`[${this.room.id}] Player died: ${target.name} killed by ${attacker.name}`);
    }

    console.log(`[${this.room.id}] Damage applied: ${attacker.name} dealt ${cappedDamage} to ${target.name} (hp: ${newHp})`);
  }

  async handleChat(conn: Connection, payload: { text: string }) {
    const player = this.playerConnMap.get(conn.id);
    if (!player) return;

    // Basic chat validation
    if (payload.text.length > 200) {
      console.log(`[${this.room.id}] Chat message too long: ${payload.text.length}`);
      return;
    }

    // Broadcast chat
    this.broadcast({
      type: "chat",
      id: player.id,
      name: player.name,
      text: payload.text,
    });

    console.log(`[${this.room.id}] Chat: ${player.name}: ${payload.text}`);
  }

  async handlePing(conn: Connection) {
    const now = Date.now();
    const playerCount = this.players.size;

    this.broadcast({
      type: "pong",
      serverTime: now,
      playerCount,
    });

    console.log(`[${this.room.id}] Ping response: ${playerCount} players`);
  }

  // ===========================================================
  // BROADCAST UTILITIES
  // ===========================================================

  broadcast(msg: ServerMessage) {
    const allConns = Array.from(this.connectionMap.values());
    allConns.forEach((conn) => {
      conn.send(msg);
    });
  }

  broadcastExcept(msg: ServerMessage, exceptConn: Connection) {
    const allConns = Array.from(this.connectionMap.values());
    allConns.forEach((conn) => {
      if (conn !== exceptConn) {
        conn.send(msg);
      }
    });
  }
}
