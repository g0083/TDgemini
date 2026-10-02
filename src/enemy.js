// ==========================================
// ENEMY ENTITIES & BOSS BEHAVIORS
// ==========================================
import { ENEMY_TYPES, COLORS } from './constants.js';
import { effects } from './particles.js';
import { audio } from './audio.js';

export class Enemy {
  constructor(typeId, pathIndex, wave = 1) {
    const def = ENEMY_TYPES[typeId] || ENEMY_TYPES.trooper;
    this.id = Math.random().toString(36).substr(2, 9);
    this.typeId = typeId;
    this.def = def;
    this.pathIndex = pathIndex;

    // Scaling by wave: exponential curve for campaign (<=30), smooth progressive curve for endless mode (>30)
    let waveHpMult = 1.0;
    if (wave <= 30) {
      waveHpMult = Math.pow(1.08, wave - 1);
    } else {
      const base30 = Math.pow(1.08, 29); // ~9.317 at wave 30
      const extra = wave - 30;
      waveHpMult = base30 * (1 + extra * 0.10 + Math.pow(extra, 1.22) * 0.02);
    }
    this.maxHp = Math.round(def.hp * waveHpMult);
    this.hp = this.maxHp;

    this.maxShield = def.shield ? Math.round(def.shield * waveHpMult) : 0;
    this.shield = this.maxShield;

    this.armor = def.armor || 0; // % damage reduction
    this.baseSpeed = def.speed;
    this.speed = this.baseSpeed;
    this.reward = def.reward;
    this.score = def.score || 10;
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

    // Visual rotation
    this.rotation = 0;
  }

  takeDamage(amount, damageType = 'normal', isCrit = false) {
    if (this.dead) return;

    // Armor & Shred Calculation
    const effectiveArmor = Math.max(0, this.armor - this.armorShred);
    let finalDmg = amount;
    if (damageType === 'physical') {
      finalDmg *= (1 - effectiveArmor);
    } else if (damageType === 'pierce') {
      // ignores armor
    }

    // Shield absorption
    if (this.shield > 0) {
      const shieldMult = damageType === 'electric' ? 2.5 : 1.0;
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
    }

    if (this.hp <= 0) {
      this.die();
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

  die() {
    this.dead = true;
    effects.emitExplosion(this.x, this.y, this.color, this.isBoss ? 45 : 16, this.size * 2.5);
    audio.playHit();
    if (this.isBoss) {
      audio.playExplosion(2.0);
      effects.shake(12, 0.4);
    }
  }

  update(dt, gameMap, allEnemies) {
    if (this.dead) return;

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
        this.die();
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

    // 3. Boss Mechanics
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
        }
      }
    }

    // 4. Healer Support Logic
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

    // 5. Stealth Cycle
    if (this.isStealth) {
      this.stealthCycle += dt;
      this.stealthActive = Math.sin(this.stealthCycle * 2.0) > 0.2;
    }

    // 6. Movement along path
    this.mapScale = gameMap ? (gameMap.scale || 1) : 1;
    this.speed = Math.max(15, this.baseSpeed * speedMult);
    const baseCell = gameMap?.BASE_CELL_SIZE || 40;
    this.distance += (this.speed * dt) / baseCell; // distance in grid units (constant velocity across all devices)

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
