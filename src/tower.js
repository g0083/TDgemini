// ==========================================
// TOWER ENTITIES & UPGRADE SYSTEM
// ==========================================
import { TOWER_TYPES, COLORS } from './constants.js';
import { Projectile } from './projectile.js';
import { effects } from './particles.js';
import { audio } from './audio.js';
import { state } from './state.js';

export const TARGET_MODES = ['FIRST', 'LAST', 'STRONGEST', 'WEAKEST'];

export class Tower {
  constructor(typeId, col, row, pixelX, pixelY) {
    this.id = Math.random().toString(36).substr(2, 9);
    this.typeId = typeId;
    this.def = TOWER_TYPES[typeId];
    this.col = col;
    this.row = row;
    this.x = pixelX;
    this.y = pixelY;

    // Upgrades
    this.level = 1; // 1: base, 2: Mk-II, 3: Mk-III, 4: Path A or Path B
    this.evolvedPath = null; // 'pathA' or 'pathB'
    this.totalInvested = this.def.cost;

    // Targeting
    this.targetMode = 'FIRST';
    this.currentTarget = null;
    this.multiTargets = [];
    this.angle = 0;

    // Attack cooldowns & stats
    this.fireTimer = 0;
    this.laserChargeTime = 0;

    // Buff multipliers from nearby boosters
    this.buffDamage = 0;
    this.buffRate = 0;
    this.buffRange = 0;
    this.buffCrit = 0;

    // Visual recoil & animation
    this.recoil = 0;
    this.pulseAngle = 0;

    this.recalculateStats();
  }

  recalculateStats() {
    let baseDmg = this.def.damage || 0;
    let baseRate = this.def.fireRate || 1;
    let baseRange = this.def.range || 120;

    // Check level upgrades
    if (this.level === 2 && this.def.upgrades?.[0]) {
      const u = this.def.upgrades[0];
      if (u.damage) baseDmg = u.damage;
      if (u.fireRate) baseRate = u.fireRate;
      if (u.range) baseRange = u.range;
    } else if (this.level === 3 && this.def.upgrades?.[1]) {
      const u = this.def.upgrades[1];
      if (u.damage) baseDmg = u.damage;
      if (u.fireRate) baseRate = u.fireRate;
      if (u.range) baseRange = u.range;
    } else if (this.level >= 4 && this.evolvedPath && this.def.paths?.[this.evolvedPath]) {
      const p = this.def.paths[this.evolvedPath];
      if (p.damage) baseDmg = p.damage;
      if (p.fireRate) baseRate = p.fireRate;
      if (p.range) baseRange = p.range;
    }

    // Apply Tech Tree Research Multipliers
    const techDmg = state.getTechMultiplier('tower_damage');
    const techRate = state.getTechMultiplier('fire_rate');
    const techRange = state.getTechMultiplier('tower_range');

    this.effectiveDamage = baseDmg * (1 + techDmg + this.buffDamage);
    this.effectiveFireRate = baseRate * (1 + techRate + this.buffRate);
    this.effectiveRange = baseRange * (1 + techRange + this.buffRange);
    this.critChance = (this.evolvedData?.critChance || 0) + state.getTechMultiplier('crit_matrix') + this.buffCrit;
  }

  get evolvedData() {
    if (this.level >= 4 && this.evolvedPath) {
      return this.def.paths[this.evolvedPath];
    }
    return null;
  }

  getName() {
    if (this.evolvedData) {
      return this.evolvedData.name;
    }
    if (this.level === 2) return `${this.def.name} Mk-II`;
    if (this.level === 3) return `${this.def.name} Mk-III`;
    return this.def.name;
  }

  getUpgradeCost() {
    if (this.level === 1) return this.def.upgrades[0].cost;
    if (this.level === 2) return this.def.upgrades[1].cost;
    return null;
  }

  getPathACost() {
    return this.def.paths?.pathA?.cost || 0;
  }

  getPathBCost() {
    return this.def.paths?.pathB?.cost || 0;
  }

  upgradeLevel() {
    if (this.level >= 3) return false;
    const cost = this.getUpgradeCost();
    this.level++;
    this.totalInvested += cost;
    this.recalculateStats();
    effects.emitSparks(this.x, this.y, '#00ff9d', 16, 90);
    audio.playUpgrade();
    return true;
  }

  evolve(pathKey) {
    if (this.level !== 3 || this.evolvedPath) return false;
    const pathDef = this.def.paths?.[pathKey];
    if (!pathDef) return false;

    this.level = 4;
    this.evolvedPath = pathKey;
    this.totalInvested += pathDef.cost;
    this.recalculateStats();
    effects.emitExplosion(this.x, this.y, pathDef.color || '#00f0ff', 30, 80);
    audio.playUpgrade();
    state.recordTowerEvolved();
    return true;
  }

  cycleTargetMode() {
    const idx = TARGET_MODES.indexOf(this.targetMode);
    this.targetMode = TARGET_MODES[(idx + 1) % TARGET_MODES.length];
  }

  findTargets(enemies) {
    const inRange = [];
    for (const enemy of enemies) {
      if (enemy.dead) continue;
      // Stealth check: only some towers or close range
      if (enemy.stealthActive && this.def.type !== 'chain') continue;

      const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
      if (dist <= this.effectiveRange) {
        inRange.push(enemy);
      }
    }

    if (inRange.length === 0) {
      this.currentTarget = null;
      this.multiTargets = [];
      return;
    }

    // Sort based on targetMode
    if (this.targetMode === 'FIRST') {
      inRange.sort((a, b) => b.distance - a.distance);
    } else if (this.targetMode === 'LAST') {
      inRange.sort((a, b) => a.distance - b.distance);
    } else if (this.targetMode === 'STRONGEST') {
      inRange.sort((a, b) => (b.hp + b.shield) - (a.hp + a.shield));
    } else if (this.targetMode === 'WEAKEST') {
      inRange.sort((a, b) => (a.hp + a.shield) - (b.hp + b.shield));
    }

    this.currentTarget = inRange[0];

    // For dual prism laser
    if (this.evolvedData?.multiTarget > 1) {
      this.multiTargets = inRange.slice(0, this.evolvedData.multiTarget);
    } else {
      this.multiTargets = [this.currentTarget];
    }
  }

  update(dt, enemies, newProjectiles, overchargeActive = false) {
    this.recalculateStats();

    // Recoil recovery
    if (this.recoil > 0) {
      this.recoil = Math.max(0, this.recoil - dt * 15);
    }
    this.pulseAngle += dt * 3;

    // Booster tower does not shoot directly
    if (this.def.type === 'booster') return;

    this.findTargets(enemies);

    let effectiveRate = this.effectiveFireRate;
    if (overchargeActive) {
      effectiveRate *= 2.0;
    }

    // Continuous Laser Logic
    if (this.def.type === 'continuous_laser') {
      if (this.currentTarget && !this.currentTarget.dead) {
        this.angle = Math.atan2(this.currentTarget.y - this.y, this.currentTarget.x - this.x);
        this.laserChargeTime += dt;

        // Ramp damage calculation
        const rampProgress = Math.min(1.0, this.laserChargeTime / 3.0);
        const maxRamp = this.evolvedData?.maxRampDamage || this.def.maxRampDamage || 120;
        const currentTickDmg = (this.effectiveDamage + (maxRamp - this.effectiveDamage) * rampProgress) * dt;

        for (const target of this.multiTargets) {
          if (!target.dead) {
            target.takeDamage(currentTickDmg, 'pierce');
            if (Math.random() < 0.3) {
              effects.emitSparks(target.x, target.y, this.def.color, 1, 40);
            }
          }
        }
      } else {
        this.laserChargeTime = 0;
      }
      return;
    }

    // Standard Projectile Cooldown
    if (this.fireTimer > 0) {
      this.fireTimer -= dt;
    }

    if (this.fireTimer <= 0 && this.currentTarget) {
      this.fire(newProjectiles, enemies);
      this.fireTimer = 1.0 / effectiveRate;
    }
  }

  fire(newProjectiles, allEnemies) {
    if (!this.currentTarget || this.currentTarget.dead) return;

    this.angle = Math.atan2(this.currentTarget.y - this.y, this.currentTarget.x - this.x);
    this.recoil = 6;

    const isCrit = Math.random() < this.critChance;
    let finalDmg = this.effectiveDamage;
    if (isCrit) finalDmg *= 2.0;

    const color = this.evolvedData?.color || this.def.color;

    // --- Tower Specific Weapon Logic ---
    switch (this.def.type) {
      case 'sniper': {
        audio.playShoot('sniper');
        effects.shake(isCrit ? 4 : 2, 0.15);

        if (this.evolvedData?.piercingLine) {
          // Railgun straight beam that penetrates all
          newProjectiles.push(new Projectile({
            x: this.x,
            y: this.y,
            angle: this.angle,
            damage: finalDmg,
            speed: 1200,
            type: 'piercing',
            pierceCount: 12,
            damageType: 'pierce',
            color: '#76ff03',
            isCrit
          }));
        } else {
          // Anti-titan HP percent bonus
          let dmg = finalDmg;
          if (this.evolvedData?.percentHpDamage && this.currentTarget.maxHp) {
            dmg += this.currentTarget.maxHp * this.evolvedData.percentHpDamage;
          }
          if (this.evolvedData?.bossBonus && this.currentTarget.isBoss) {
            dmg *= this.evolvedData.bossBonus;
          }
          newProjectiles.push(new Projectile({
            x: this.x,
            y: this.y,
            target: this.currentTarget,
            damage: dmg,
            speed: 980,
            damageType: 'pierce',
            color,
            isCrit
          }));
        }
        break;
      }

      case 'splash': {
        // Cannon / Mortar
        audio.playShoot('cannon');
        newProjectiles.push(new Projectile({
          x: this.x,
          y: this.y,
          targetPos: { x: this.currentTarget.x, y: this.currentTarget.y },
          damage: finalDmg,
          splashRadius: this.evolvedData?.splashRadius || this.def.splashRadius || 60,
          clusterCount: this.evolvedData?.clusterCount || 0,
          burnDuration: this.evolvedData?.burnDuration || 0,
          speed: 400,
          color,
          isArc: true,
          damageType: 'explosive',
          isCrit
        }));
        break;
      }

      case 'beam_slow': {
        // Cryo
        audio.playShoot('cryo');
        newProjectiles.push(new Projectile({
          x: this.x,
          y: this.y,
          target: this.currentTarget,
          damage: finalDmg,
          speed: 460,
          color,
          slowAmount: this.evolvedData?.slowAmount || this.def.slowAmount,
          slowDuration: this.def.slowDuration || 2.5,
          isCrit
        }));

        if (this.evolvedData?.freezeChance && Math.random() < this.evolvedData.freezeChance) {
          this.currentTarget.applyFreeze(1.5);
          effects.addText(this.currentTarget.x, this.currentTarget.y - 15, 'FROZEN', '#60d5ff');
        }
        break;
      }

      case 'chain': {
        // Tesla Chain Arc
        audio.playShoot('tesla');
        const chainCount = this.evolvedData?.chainCount || this.def.chainCount || 3;
        const chainRange = this.evolvedData?.chainRange || this.def.chainRange || 80;
        const stunDuration = this.evolvedData?.stunDuration || 0;

        let curSource = { x: this.x, y: this.y };
        let curTarget = this.currentTarget;
        const hitSet = new Set();

        for (let i = 0; i < chainCount && curTarget; i++) {
          hitSet.add(curTarget.id);
          curTarget.takeDamage(finalDmg * Math.pow(0.85, i), 'electric', isCrit);

          if (stunDuration > 0) {
            curTarget.applyStun(stunDuration);
          }

          // Emit visual arc line
          effects.addShockwave(curTarget.x, curTarget.y, 20, color, 0.15, 2);

          // Find next closest unhit target
          curSource = { x: curTarget.x, y: curTarget.y };
          let nextTarget = null;
          let minDist = chainRange;

          for (const other of allEnemies) {
            if (!other.dead && !hitSet.has(other.id)) {
              const d = Math.hypot(other.x - curSource.x, other.y - curSource.y);
              if (d <= minDist) {
                minDist = d;
                nextTarget = other;
              }
            }
          }
          curTarget = nextTarget;
        }
        break;
      }

      default: {
        // Pulse & Gatling
        audio.playShoot(this.typeId);
        newProjectiles.push(new Projectile({
          x: this.x,
          y: this.y,
          target: this.currentTarget,
          damage: finalDmg,
          speed: this.def.bulletSpeed || 550,
          color,
          shredArmor: this.evolvedData?.shredArmor || 0,
          knockback: this.evolvedData?.knockback || 0,
          isCrit
        }));
        break;
      }
    }
  }

  draw(ctx, isSelected = false) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const color = this.evolvedData?.color || this.def.color;

    // 1. Draw Range Circle if selected
    if (isSelected) {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.08;
      ctx.beginPath();
      ctx.arc(0, 0, this.effectiveRange, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.restore();
    }

    // 2. Booster Aura
    if (this.def.type === 'booster') {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.3 + 0.15 * Math.sin(this.pulseAngle);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, this.effectiveRange, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 3. Continuous Laser Visuals
    if (this.def.type === 'continuous_laser' && this.currentTarget && !this.currentTarget.dead) {
      for (const target of this.multiTargets) {
        if (!target.dead) {
          ctx.save();
          const targetRelX = target.x - this.x;
          const targetRelY = target.y - this.y;

          // Outer Glow Beam
          ctx.strokeStyle = color;
          ctx.shadowColor = color;
          ctx.shadowBlur = 12;
          ctx.lineWidth = 4 + Math.sin(this.pulseAngle * 4) * 1.5;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(targetRelX, targetRelY);
          ctx.stroke();

          // Inner White Core
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(targetRelX, targetRelY);
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    // 4. Base Pedestal (Cyber Octagon / Hex)
    ctx.save();
    ctx.fillStyle = '#0d1527';
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = isSelected ? 12 : 5;
    ctx.lineWidth = 2;

    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const px = Math.cos(a) * 18;
      const py = Math.sin(a) * 18;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 5. Turret Barrel (Rotates toward target)
    ctx.rotate(this.angle);

    ctx.fillStyle = color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;

    if (this.def.type === 'booster') {
      // Rotating Tech Prism
      ctx.rotate(this.pulseAngle);
      ctx.fillRect(-6, -6, 12, 12);
      ctx.strokeRect(-6, -6, 12, 12);
    } else if (this.def.type === 'sniper') {
      // Long high tech barrel with recoil
      const barrelLen = 24 - this.recoil;
      ctx.fillRect(0, -2.5, barrelLen, 5);
      ctx.strokeRect(0, -2.5, barrelLen, 5);
    } else if (this.def.type === 'gatling') {
      // Multi-barrel
      ctx.fillRect(0, -5, 15 - this.recoil, 3);
      ctx.fillRect(0, 2, 15 - this.recoil, 3);
    } else if (this.def.type === 'cannon') {
      // Heavy wide barrel
      ctx.fillRect(0, -4.5, 14 - this.recoil, 9);
      ctx.strokeRect(0, -4.5, 14 - this.recoil, 9);
    } else {
      // Standard Turret
      ctx.fillRect(0, -3, 16 - this.recoil, 6);
      ctx.strokeRect(0, -3, 16 - this.recoil, 6);
    }

    // Turret Center Dome
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // 6. Level Stars / Badges (unrotated)
    if (this.level > 1) {
      ctx.save();
      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = this.level === 4 ? '#ffd000' : '#00ff9d';
      ctx.textAlign = 'center';
      const label = this.level === 4 ? (this.evolvedPath === 'pathA' ? '✦A' : '✦B') : `Lv${this.level}`;
      ctx.fillText(label, 0, -22);
      ctx.restore();
    }

    ctx.restore();
  }
}
