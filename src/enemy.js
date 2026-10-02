// ==========================================
// ENEMY ENTITIES & BOSS BEHAVIORS
// ==========================================
import { ENEMY_TYPES, COLORS } from './constants.js';
import { effects } from './particles.js';
import { audio } from './audio.js';
import { state } from './state.js';

export class Enemy {
  constructor(typeId, pathIndex, wave = 1, scaling = {}) {
    const def = ENEMY_TYPES[typeId] || ENEMY_TYPES.trooper;
    this.id = Math.random().toString(36).substr(2, 9);
    this.typeId = typeId;
    this.def = def;
    this.pathIndex = pathIndex;

    // Difficulty & Mutator scalers
    const diffHpMult = scaling.hpMult || 1.0;
    const diffSpeedMult = scaling.speedMult || 1.0;
    const diffRewardMult = scaling.rewardMult || 1.0;
    const diffShieldAdd = scaling.shieldBonus || 0;
    const diffArmorAdd = scaling.armorBonus || 0;

    // Scaling by wave: exponential curve for campaign (<=30), smooth progressive curve for endless mode (>30)
    let waveHpMult = 1.0;
    if (wave <= 30) {
      waveHpMult = Math.pow(1.08, wave - 1);
    } else {
      const base30 = Math.pow(1.08, 29); // ~9.317 at wave 30
      const extra = wave - 30;
      waveHpMult = base30 * (1 + extra * 0.10 + Math.pow(extra, 1.22) * 0.02);
    }
    this.maxHp = Math.round(def.hp * waveHpMult * diffHpMult);
    this.hp = this.maxHp;

    const baseShield = def.shield ? Math.round(def.shield * waveHpMult) : 0;
    this.maxShield = Math.round((baseShield + (def.shield ? diffShieldAdd : 0)) * (def.shield ? diffHpMult : 1.0));
    this.shield = this.maxShield;

    this.armor = Math.min(0.75, (def.armor || 0) + diffArmorAdd); // % damage reduction
    this.baseSpeed = def.speed * diffSpeedMult;
    this.speed = this.baseSpeed;
    this.reward = Math.max(1, Math.round(def.reward * diffRewardMult));
    this.score = Math.round((def.score || 10) * (scaling.scoreMult || 1.0));
    this.size = def.size || 12;
    this.shape = def.shape || 'circle';
    this.color = def.color || '#ff0055';
    this.isBoss = def.isBoss || false;
    this.coreDrop = def.coreDrop || 0;
    this.nexusDamage = def.nexusDamage || (this.isBoss ? 5 : 1);

    // Path progress
    this.distance = 0;
    this.x = 0;
    this.y = 0;
    this.angle = 0;
    this.dead = false;
    this.reachedNexus = false;

    // Debuffs & Status
    this.slowTimer = 0;
    this.slowFactor = 0;
    this.freezeTimer = 0;
    this.stunTimer = 0;
    this.burnTimer = 0;
    this.burnDps = 0;
    this.armorShred = 0; // increased damage taken %

    // Special flags
    this.isStealth = def.isStealth || false;
    this.stealthCycle = 0;
    this.stealthActive = false;
    this.regen = def.regen || 0;
    this.healCooldown = 0;
    this.bossEmpTimer = 0;
    this.bossShieldRegenDone = false;

    // Advanced & Endless Behavior Timers
    this.towerAttackCooldown = Math.random() * 2.0; // Desynchronize attacks
    this.warpTimer = 0;
    this.spawnMinionTimer = 0;
    this.shieldAuraCooldown = 0;
    this.targetTower = null;
    this.towersCache = [];

    // Visual rotation
    this.rotation = 0;
  }

  takeDamage(amount, damageType = 'normal', isCrit = false, protocols = []) {
    if (this.dead) return;

    // 1. Check Tactical Protocols on incoming damage
    let finalDmg = amount;
    const hasProtocol = (id) => protocols && protocols.some((p) => p.id === id);

    // Reflector Armor Mechanics: Resist energy/electric/lasers by 40%, but 1.8x vulnerable to physical/explosive
    if (this.def.reflectEnergy) {
      if (damageType === 'electric' || damageType === 'normal' || damageType === 'laser') {
        finalDmg *= (1 - (this.def.energyDamageReduction || 0.40));
        if (Math.random() < 0.25) {
          effects.emitSparks(this.x, this.y, '#e040fb', 3, 50);
        }
      } else if (damageType === 'physical' || damageType === 'pierce') {
        finalDmg *= (this.def.explosiveVulnerability || 1.8);
        effects.addText(this.x, this.y - 14, 'SHATTER!', '#ffea00', { isCrit: true, size: 12 });
      }
    }

    // Frostbite Shatter: +35% damage to slowed/frozen enemies
    if ((this.freezeTimer > 0 || this.slowTimer > 0) && hasProtocol('frostbite_shatter')) {
      finalDmg *= 1.35;
    }

    // Titan Slayer: +40% damage to bosses or enemies with >= 1000 max HP
    if ((this.isBoss || this.maxHp >= 1000) && hasProtocol('titan_slayer')) {
      finalDmg *= 1.40;
    }

    // Tech Research: Heavy Ordnance (+6% per level against boss/heavy/dreadnought)
    const heavyTech = state.getTechMultiplier('heavy_ordnance');
    if (heavyTech > 0 && (this.isBoss || this.typeId === 'heavy' || this.typeId === 'dreadnought')) {
      finalDmg *= (1 + heavyTech);
    }

    // Armor & Shred Calculation
    let effectiveArmor = Math.max(0, this.armor - this.armorShred);
    if (hasProtocol('armor_melter')) {
      effectiveArmor = Math.max(0, effectiveArmor - 0.18);
    }

    if (damageType === 'physical') {
      finalDmg *= (1 - effectiveArmor);
    } else if (damageType === 'pierce') {
      // ignores armor
    }

    // Shield absorption
    if (this.shield > 0) {
      let shieldMult = damageType === 'electric' ? 2.5 : 1.0;
      if (hasProtocol('tesla_storm') && damageType === 'electric') {
        shieldMult = 3.5;
      }
      const shieldDmg = finalDmg * shieldMult;
      if (this.shield >= shieldDmg) {
        this.shield -= shieldDmg;
        finalDmg = 0;
        effects.emitSparks(this.x, this.y, '#3d84ff', 4, 60);
      } else {
        finalDmg -= this.shield / shieldMult;
        this.shield = 0;
        effects.addShockwave(this.x, this.y, 35, '#3d84ff', 0.25, 2);
      }
    }

    if (finalDmg > 0) {
      this.hp -= finalDmg;
      const displayDmg = Math.round(finalDmg);
      if (isCrit) {
        effects.addText(this.x, this.y - 12, `${displayDmg}!`, '#ff2e63', { isCrit: true });
        effects.emitSparks(this.x, this.y, '#ffd000', 7, 100);
      } else {
        effects.addText(this.x, this.y - 8, `${displayDmg}`, '#ffffff');
      }

      // Hyper Execute Protocol: instant kill low HP enemies
      if (hasProtocol('hyper_execute') && this.hp > 0) {
        const threshold = this.isBoss ? 0.08 : 0.15;
        if (this.hp <= this.maxHp * threshold) {
          this.hp = 0;
          effects.addText(this.x, this.y - 20, 'EXECUTE!', '#ff2e63', { isCrit: true, size: 18 });
          effects.emitExplosion(this.x, this.y, '#ff0055', 25, 60);
        }
      }
    }

    if (this.hp <= 0) {
      this.die(this.towersCache);
    }
  }

  applySlow(factor, duration) {
    if (this.isBoss) factor *= 0.6; // bosses resist slow
    if (factor > this.slowFactor || this.slowTimer <= 0) {
      this.slowFactor = factor;
      this.slowTimer = duration;
    }
  }

  applyFreeze(duration) {
    if (this.isBoss) return; // bosses immune to full freeze
    this.freezeTimer = Math.max(this.freezeTimer, duration);
  }

  applyStun(duration) {
    if (this.isBoss) duration *= 0.35;
    this.stunTimer = Math.max(this.stunTimer, duration);
  }

  applyBurn(dps, duration) {
    this.burnDps = Math.max(this.burnDps, dps);
    this.burnTimer = Math.max(this.burnTimer, duration);
  }

  applyArmorShred(amount) {
    this.armorShred = Math.min(0.5, this.armorShred + amount);
  }

  die(towers = []) {
    this.dead = true;

    // Kamikaze suicide explosion on death (if killed mid-flight)
    if (this.def.suicideOnTowers && towers && towers.length > 0) {
      for (const t of towers) {
        const dist = Math.hypot(t.x - this.x, t.y - this.y);
        if (dist <= (this.def.stunBlastRadius || 80)) {
          t.disable(this.def.stunDuration || 4.0, 'EMP STUN');
        }
      }
      effects.addShockwave(this.x, this.y, this.def.stunBlastRadius || 80, '#ff3b30', 0.35, 4);
    }

    effects.emitExplosion(this.x, this.y, this.color, this.isBoss ? 45 : 16, this.size * 2.5);
    audio.playHit();
    if (this.isBoss) {
      audio.playExplosion(2.0);
      effects.shake(12, 0.4);
    }
  }

  update(dt, gameMap, allEnemies, towers = [], spawnCallback = null) {
    if (this.dead) return;
    if (towers && towers.length > 0) this.towersCache = towers;

    // 1. Status effects
    if (this.freezeTimer > 0) {
      this.freezeTimer -= dt;
      return; // Cannot move while frozen
    }

    if (this.stunTimer > 0) {
      this.stunTimer -= dt;
      return; // Cannot move while stunned
    }

    if (this.burnTimer > 0) {
      this.burnTimer -= dt;
      this.hp -= this.burnDps * dt;
      if (Math.random() < 0.2) {
        effects.emitSparks(this.x, this.y, '#ff6200', 2, 40);
      }
      if (this.hp <= 0) {
        this.die(towers);
        return;
      }
    }

    let speedMult = 1.0;
    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      speedMult -= this.slowFactor;
    }

    // 2. Regeneration
    if (this.regen > 0 && this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + this.regen * dt);
    }

    // 3. Boss & Elite Special Mechanics
    if (this.isBoss) {
      // Colossus: Regain shield once at 40% HP
      if (this.typeId === 'boss_colossus' && !this.bossShieldRegenDone && this.hp < this.maxHp * 0.4) {
        this.bossShieldRegenDone = true;
        this.shield = this.maxShield;
        effects.addShockwave(this.x, this.y, 80, '#00f0ff', 0.5, 4);
        effects.addText(this.x, this.y - 25, 'SHIELD RECHARGED', '#00f0ff', { isCrit: true });
        audio.playUpgrade();
      }

      // Overlord: Periodic EMP Pulse (disable nearby towers)
      if (this.typeId === 'boss_overlord') {
        this.bossEmpTimer += dt;
        if (this.bossEmpTimer >= 8.0) {
          this.bossEmpTimer = 0;
          effects.addShockwave(this.x, this.y, 160, '#ff0077', 0.6, 5);
          audio.playSkill('emp');
          if (towers) {
            for (const t of towers) {
              if (Math.hypot(t.x - this.x, t.y - this.y) <= 160) {
                t.disable(3.0, 'EMP PULSE');
              }
            }
          }
        }
      }

      // Leviathan: Minion Deployment (Spawns Kamikaze Drones)
      if (this.def.spawnsMinions && spawnCallback) {
        this.spawnMinionTimer += dt;
        if (this.spawnMinionTimer >= (this.def.spawnMinionCooldown || 7.0)) {
          this.spawnMinionTimer = 0;
          effects.addShockwave(this.x, this.y, 60, '#76ff03', 0.35, 3);
          audio.playSkill('overcharge');
          spawnCallback(this.def.spawnsMinions, this.pathIndex, this.distance - 0.2);
          spawnCallback(this.def.spawnsMinions, this.pathIndex, this.distance + 0.2);
          effects.addText(this.x, this.y - 25, 'DRONES LAUNCHED!', '#76ff03', { isCrit: true });
        }
      }
    }

    // 4. Tower Attackers (Disruptor, Dreadnought, Boss Leviathan)
    if (this.def.attacksTowers && towers && towers.length > 0) {
      this.towerAttackCooldown += dt;
      if (this.towerAttackCooldown >= (this.def.attackCooldown || 4.5)) {
        // Find nearest operational tower in attack range
        let bestTower = null;
        let bestDist = Infinity;
        for (const t of towers) {
          if (t.disabledTimer <= 0) {
            const dist = Math.hypot(t.x - this.x, t.y - this.y);
            if (dist <= (this.def.attackRange || 140) && dist < bestDist) {
              bestDist = dist;
              bestTower = t;
            }
          }
        }

        if (bestTower) {
          this.towerAttackCooldown = 0;
          bestTower.disable(this.def.empDuration || 3.5, 'HACKED');
          effects.addShockwave(this.x, this.y, 20, '#ff00aa', 0.25, 2);
          effects.emitSparks(bestTower.x, bestTower.y, '#ff00aa', 8, 40);
          audio.playSkill('emp');
        }
      }
    }

    // 5. Shield Aura (Dreadnought buffs nearby allies)
    if (this.def.shieldAura && allEnemies) {
      this.shieldAuraCooldown += dt;
      if (this.shieldAuraCooldown >= 0.5) {
        this.shieldAuraCooldown = 0;
        for (const other of allEnemies) {
          if (other !== this && !other.dead && !other.isBoss) {
            const dist = Math.hypot(other.x - this.x, other.y - this.y);
            if (dist <= (this.def.shieldAuraRange || 85)) {
              other.shield = Math.min(250, (other.shield || 0) + 18);
              if (other.maxShield === 0) other.maxShield = 250;
              if (Math.random() < 0.2) effects.emitSparks(other.x, other.y, '#ff9100', 1, 20);
            }
          }
        }
      }
    }

    // 6. Warper Jump / Quantum Teleportation
    if (this.def.canWarp) {
      this.warpTimer += dt;
      if (this.warpTimer >= (this.def.warpCooldown || 3.2)) {
        this.warpTimer = 0;
        effects.addShockwave(this.x, this.y, 25, '#00e5ff', 0.2, 3);
        this.distance += (this.def.warpDistance || 2.4);
        effects.emitSparks(this.x, this.y, '#00e5ff', 8, 50);
        audio.playHit();
      }
    }

    // 7. Healer Support Logic
    if (this.def.healRate && allEnemies) {
      this.healCooldown += dt;
      if (this.healCooldown >= 0.5) {
        this.healCooldown = 0;
        for (const other of allEnemies) {
          if (other !== this && !other.dead) {
            const dist = Math.hypot(other.x - this.x, other.y - this.y);
            if (dist <= this.def.healRange && other.hp < other.maxHp) {
              other.hp = Math.min(other.maxHp, other.hp + this.def.healRate * 0.5);
              effects.emitSparks(other.x, other.y, '#00ff9d', 2, 30);
            }
          }
        }
      }
    }

    // 8. Stealth Cycle
    if (this.isStealth) {
      this.stealthCycle += dt;
      this.stealthActive = Math.sin(this.stealthCycle * 2.0) > 0.2;
    }

    // 9. Movement along path OR Kamikaze Target Tower Rush
    this.mapScale = gameMap ? (gameMap.scale || 1) : 1;
    this.speed = Math.max(15, this.baseSpeed * speedMult);
    const baseCell = gameMap?.BASE_CELL_SIZE || 40;

    // Check Kamikaze direct target divergence
    if (this.def.suicideOnTowers && towers && towers.length > 0) {
      let nearestTower = null;
      let nearDist = Infinity;
      for (const t of towers) {
        const d = Math.hypot(t.x - this.x, t.y - this.y);
        if (d <= (this.def.targetTowerRange || 95) && d < nearDist) {
          nearDist = d;
          nearestTower = t;
        }
      }

      if (nearestTower) {
        // Rush straight towards the tower!
        const dx = nearestTower.x - this.x;
        const dy = nearestTower.y - this.y;
        this.angle = Math.atan2(dy, dx);
        const rushSpeed = this.speed * 1.4;
        this.x += Math.cos(this.angle) * rushSpeed * dt;
        this.y += Math.sin(this.angle) * rushSpeed * dt;

        // Spark trail
        if (Math.random() < 0.4) {
          effects.emitSparks(this.x, this.y, '#ff3b30', 2, 35);
        }

        // Contact Detonation
        if (nearDist <= 22) {
          this.die(towers);
          return;
        }
        return; // Diverted to rush tower
      }
    }

    // Normal movement along track
    this.distance += (this.speed * dt) / baseCell; // distance in grid units
    const point = gameMap.getPointOnPath(this.pathIndex, this.distance);
    this.x = point.x;
    this.y = point.y;
    this.angle = point.angle;
    this.rotation += dt * 2.5;

    if (point.reachedEnd) {
      this.reachedNexus = true;
      this.dead = true;
    }
  }

  draw(ctx) {
    if (this.dead) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    const scale = this.mapScale || 1.0;
    const s = this.size * scale;

    // Stealth transparency
    if (this.stealthActive) {
      ctx.globalAlpha = 0.25;
    }

    // Status Auras
    if (this.freezeTimer > 0) {
      ctx.strokeStyle = '#60d5ff';
      ctx.shadowColor = '#60d5ff';
      ctx.shadowBlur = 12 * scale;
      ctx.lineWidth = 3 * scale;
      ctx.beginPath();
      ctx.arc(0, 0, s + 4 * scale, 0, Math.PI * 2);
      ctx.stroke();
    } else if (this.slowTimer > 0) {
      ctx.strokeStyle = 'rgba(96, 213, 255, 0.5)';
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(0, 0, s + 3 * scale, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Shield Ring
    if (this.shield > 0) {
      const shieldRatio = this.shield / this.maxShield;
      ctx.save();
      ctx.strokeStyle = '#3d84ff';
      ctx.shadowColor = '#3d84ff';
      ctx.shadowBlur = 10 * scale;
      ctx.lineWidth = 2.5 * scale;
      ctx.globalAlpha = 0.4 + 0.5 * shieldRatio;
      ctx.beginPath();
      ctx.arc(0, 0, s + 6 * scale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Rotate enemy shape
    ctx.rotate(this.isBoss ? this.rotation : this.angle);

    // Draw Main Shape
    ctx.fillStyle = this.color;
    ctx.strokeStyle = '#ffffff';
    ctx.shadowColor = this.color;
    ctx.shadowBlur = (this.isBoss ? 16 : 8) * scale;
    ctx.lineWidth = 1.5 * scale;

    switch (this.shape) {
      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(s, 0);
        ctx.lineTo(-s * 0.7, -s * 0.7);
        ctx.lineTo(-s * 0.4, 0);
        ctx.lineTo(-s * 0.7, s * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;

      case 'square':
        ctx.fillRect(-s * 0.65, -s * 0.65, s * 1.3, s * 1.3);
        ctx.strokeRect(-s * 0.65, -s * 0.65, s * 1.3, s * 1.3);
        break;

      case 'hexagon':
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          const px = Math.cos(a) * s;
          const py = Math.sin(a) * s;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;

      case 'diamond':
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(s, 0);
        ctx.lineTo(0, s);
        ctx.lineTo(-s, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;

      case 'cross':
        const w = s * 0.35;
        ctx.beginPath();
        ctx.rect(-w, -s, w * 2, s * 2);
        ctx.rect(-s, -w, s * 2, w * 2);
        ctx.fill();
        ctx.stroke();
        break;

      case 'disruptor': {
        // Magenta EMP hacker diamond with rotating antenna spikes
        ctx.beginPath();
        ctx.moveTo(s * 1.1, 0);
        ctx.lineTo(0, -s * 0.7);
        ctx.lineTo(-s * 1.1, 0);
        ctx.lineTo(0, s * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 3 Electric Antennas
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 3; i++) {
          const a = (i * Math.PI * 2) / 3 + this.rotation * 3;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a) * (s * 1.3), Math.sin(a) * (s * 1.3));
          ctx.stroke();
        }
        break;
      }

      case 'kamikaze': {
        // Red rocket spear with flashing core
        ctx.beginPath();
        ctx.moveTo(s * 1.3, 0);
        ctx.lineTo(-s * 0.8, -s * 0.7);
        ctx.lineTo(-s * 0.4, 0);
        ctx.lineTo(-s * 0.8, s * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Flashing Detonation Core
        const flash = Math.sin(Date.now() * 0.02) > 0;
        ctx.fillStyle = flash ? '#ffffff' : '#ffd000';
        ctx.beginPath();
        ctx.arc(-s * 0.1, 0, s * 0.35, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'warper': {
        // Concentric warp squares
        ctx.save();
        ctx.rotate(this.rotation * 2);
        ctx.fillRect(-s * 0.6, -s * 0.6, s * 1.2, s * 1.2);
        ctx.strokeRect(-s * 0.6, -s * 0.6, s * 1.2, s * 1.2);
        ctx.rotate(Math.PI / 4);
        ctx.strokeStyle = '#00f0ff';
        ctx.strokeRect(-s * 0.4, -s * 0.4, s * 0.8, s * 0.8);
        ctx.restore();
        break;
      }

      case 'reflector': {
        // Prism facet crystal
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          const px = Math.cos(a) * s;
          const py = Math.sin(a) * s;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Crystal facet reflections
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.moveTo(-s * 0.5, -s * 0.5);
        ctx.lineTo(s * 0.5, s * 0.5);
        ctx.moveTo(s * 0.5, -s * 0.5);
        ctx.lineTo(-s * 0.5, s * 0.5);
        ctx.stroke();
        break;
      }

      case 'dreadnought': {
        // Heavy floating fortress
        ctx.beginPath();
        ctx.moveTo(s * 1.4, 0);
        ctx.lineTo(s * 0.6, -s * 0.8);
        ctx.lineTo(-s * 1.2, -s * 0.9);
        ctx.lineTo(-s * 0.8, 0);
        ctx.lineTo(-s * 1.2, s * 0.9);
        ctx.lineTo(s * 0.6, s * 0.8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Armor Plating Lines
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(-s * 0.5, -s * 0.4, s, s * 0.8);

        // Core
        ctx.fillStyle = '#ff0055';
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.3, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'boss_leviathan': {
        // Massive 12-point Leviathan Dreadnought
        ctx.beginPath();
        for (let i = 0; i < 12; i++) {
          const a = (i * Math.PI) / 6;
          const r = i % 2 === 0 ? s * 1.1 : s * 0.7;
          const px = Math.cos(a) * r;
          const py = Math.sin(a) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inner glowing reactor
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#76ff03';
        ctx.lineWidth = 3;
        ctx.stroke();
        break;
      }

      case 'boss_octagon':
      case 'boss_star':
      case 'boss_omega':
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4;
          const r = i % 2 === 0 ? s : s * 0.65;
          const px = Math.cos(a) * r;
          const py = Math.sin(a) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inner glowing core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.35, 0, Math.PI * 2);
        ctx.fill();
        break;

      default:
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;
    }

    ctx.restore();

    // HP Bar (Above Enemy, unrotated)
    if (this.hp < this.maxHp || this.shield > 0 || this.isBoss) {
      const barW = Math.max(22 * scale, s * 2);
      const barH = (this.isBoss ? 5 : 3.5) * scale;
      const barX = this.x - barW / 2;
      const barY = this.y - s - (this.shield > 0 ? 14 : 10) * scale;

      // Background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

      // HP Fill
      const hpRatio = Math.max(0, this.hp / this.maxHp);
      ctx.fillStyle = hpRatio > 0.5 ? COLORS.success : hpRatio > 0.25 ? COLORS.warning : COLORS.danger;
      ctx.fillRect(barX, barY, barW * hpRatio, barH);

      // Shield Mini Bar
      if (this.shield > 0) {
        const shieldRatio = Math.max(0, this.shield / this.maxShield);
        ctx.fillStyle = '#3d84ff';
        ctx.fillRect(barX, barY - 3, barW * shieldRatio, 2);
      }

      // Boss Name tag
      if (this.isBoss) {
        ctx.save();
        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = '#ff2e63';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#ff2e63';
        ctx.shadowBlur = 6;
        ctx.fillText(this.def.name, this.x, barY - 6);
        ctx.restore();
      }
    }
  }
}
