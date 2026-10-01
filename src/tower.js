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
  constructor(typeId, col, row, pixelX, pixelY, mapScale = 1.0) {
    this.id = Math.random().toString(36).substr(2, 9);
    this.typeId = typeId;
    this.def = TOWER_TYPES[typeId];
    this.col = col;
    this.row = row;
    this.x = pixelX;
    this.y = pixelY;
    this.mapScale = mapScale || 1.0;

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
    this.effectiveRange = baseRange * (1 + techRange + this.buffRange) * (this.mapScale || 1.0);
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

  update(dt, enemies, newProjectiles, overchargeActive = false, mapScale = null) {
    if (mapScale && mapScale !== this.mapScale) {
      this.mapScale = mapScale;
    }
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
    const scale = this.mapScale || 1.0;

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
            speed: 1200 * scale,
            type: 'piercing',
            pierceCount: 12,
            damageType: 'pierce',
            color: '#76ff03',
            isCrit,
            mapScale: scale
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
            speed: 980 * scale,
            damageType: 'pierce',
            color,
            isCrit,
            mapScale: scale
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
          splashRadius: (this.evolvedData?.splashRadius || this.def.splashRadius || 60) * scale,
          clusterCount: this.evolvedData?.clusterCount || 0,
          burnDuration: this.evolvedData?.burnDuration || 0,
          speed: 400 * scale,
          color,
          isArc: true,
          damageType: 'explosive',
          isCrit,
          mapScale: scale
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
          speed: 460 * scale,
          color,
          slowAmount: this.evolvedData?.slowAmount || this.def.slowAmount,
          slowDuration: this.def.slowDuration || 2.5,
          isCrit,
          mapScale: scale
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
        const chainRange = (this.evolvedData?.chainRange || this.def.chainRange || 80) * scale;
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
          effects.addShockwave(curTarget.x, curTarget.y, 20 * scale, color, 0.15, 2);

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
          speed: (this.def.bulletSpeed || 550) * scale,
          color,
          shredArmor: this.evolvedData?.shredArmor || 0,
          knockback: this.evolvedData?.knockback || 0,
          isCrit,
          mapScale: scale
        }));
        break;
      }
    }
  }

  draw(ctx, isSelected = false) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const color = this.evolvedData?.color || this.def.color;

    // 1. Draw Range Circle if selected (in pixel world coordinates)
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

    // 4. Base Pedestal, Turret Barrel & Badges scaled by mapScale
    const s = this.mapScale || 1.0;
    ctx.save();
    ctx.scale(s, s);

    // --- A. Base Pedestal (Unique silhouette per tower type) ---
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = isSelected ? 14 : 6;

    switch (this.typeId) {
      case 'gatling': {
        // Heavy Circular Gear Base
        ctx.fillStyle = '#0b1424';
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 16.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Perimeter gear notches (6 teeth)
        ctx.fillStyle = color;
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          ctx.fillRect(Math.cos(a) * 16 - 2, Math.sin(a) * 16 - 2, 4, 4);
        }
        break;
      }

      case 'sniper': {
        // Sleek Diamond Aerodynamic Base with lateral heat-sink fins
        ctx.fillStyle = '#08111e';
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.lineTo(16, 0);
        ctx.lineTo(0, 18);
        ctx.lineTo(-16, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Lateral radiator cooling fins
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-11, -5); ctx.lineTo(-15, -5);
        ctx.moveTo(-11, 0); ctx.lineTo(-16, 0);
        ctx.moveTo(-11, 5); ctx.lineTo(-15, 5);
        ctx.moveTo(11, -5); ctx.lineTo(15, -5);
        ctx.moveTo(11, 0); ctx.lineTo(16, 0);
        ctx.moveTo(11, 5); ctx.lineTo(15, 5);
        ctx.stroke();
        break;
      }

      case 'cannon': {
        // Heavy Reinforced Square Bunker Fortress Base
        ctx.fillStyle = '#101728';
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.2;
        ctx.strokeRect(-16, -16, 32, 32);
        ctx.fillRect(-16, -16, 32, 32);

        // 4 Corner Hydraulic Stabilizer Studs
        ctx.fillStyle = color;
        ctx.fillRect(-18, -18, 5, 5);
        ctx.fillRect(13, -18, 5, 5);
        ctx.fillRect(-18, 13, 5, 5);
        ctx.fillRect(13, 13, 5, 5);
        break;
      }

      case 'tesla': {
        // High-Voltage Tripod Pylon Base
        ctx.fillStyle = '#120f26';
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
          const a = (i * Math.PI * 2) / 3 - Math.PI / 2;
          const px = Math.cos(a) * 18;
          const py = Math.sin(a) * 18;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 3 Glowing Capacitor Spheres on Tripod Feet
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 3; i++) {
          const a = (i * Math.PI * 2) / 3 - Math.PI / 2;
          ctx.beginPath();
          ctx.arc(Math.cos(a) * 14, Math.sin(a) * 14, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }

      case 'laser': {
        // Precision Pentagonal Optical Platform
        ctx.fillStyle = '#190e24';
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
          const px = Math.cos(a) * 17.5;
          const py = Math.sin(a) * 17.5;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inner Calibration Ring
        ctx.strokeStyle = 'rgba(255, 0, 119, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }

      case 'cryo': {
        // Hexagonal Cryo-Vat with 3 Coolant Exhaust Vents
        ctx.fillStyle = '#0a1824';
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          const px = Math.cos(a) * 17;
          const py = Math.sin(a) * 17;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 3 Frost Nozzle Vents
        ctx.fillStyle = '#60d5ff';
        for (let i = 0; i < 3; i++) {
          const a = (i * Math.PI * 2) / 3;
          ctx.beginPath();
          ctx.arc(Math.cos(a) * 12.5, Math.sin(a) * 12.5, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }

      case 'booster': {
        // Concentric Quantum Holographic Circuit Rings
        ctx.fillStyle = '#081c14';
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(0, 0, 16.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = 'rgba(123, 255, 0, 0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(0, 0, 11, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        break;
      }

      default: {
        // Pulse: Classic Military Octagonal Chassis
        ctx.fillStyle = '#0d1527';
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4;
          const px = Math.cos(a) * 17;
          const py = Math.sin(a) * 17;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 4 Corner Bolt Studs
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillRect(-12, -12, 2.5, 2.5);
        ctx.fillRect(9.5, -12, 2.5, 2.5);
        ctx.fillRect(-12, 9.5, 2.5, 2.5);
        ctx.fillRect(9.5, 9.5, 2.5, 2.5);
        break;
      }
    }
    ctx.restore();

    // --- B. Turret Weapon Architecture & Articulated Mechanisms ---
    ctx.save();
    ctx.rotate(this.angle);

    ctx.fillStyle = color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;

    switch (this.typeId) {
      case 'gatling': {
        // Rotary Minigun: Rear Cylindrical Ammo Drum + 3-Barrel Cluster + Muzzle Ring
        // Ammo Drum at rear
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.fillRect(-11, -6, 6, 12);
        ctx.strokeRect(-11, -6, 6, 12);

        // Ammo Feeding Belt line
        ctx.strokeStyle = '#ffd000';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-5, -3); ctx.lineTo(-1, -3);
        ctx.moveTo(-5, 0); ctx.lineTo(-1, 0);
        ctx.moveTo(-5, 3); ctx.lineTo(-1, 3);
        ctx.stroke();

        // 3 Barrels Spinning
        const spin = Math.sin(this.pulseAngle * 12) * 1.2;
        ctx.fillStyle = color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.8;
        // Top barrel
        ctx.fillRect(2, -5.5 + spin * 0.4, 14, 2.5);
        ctx.strokeRect(2, -5.5 + spin * 0.4, 14, 2.5);
        // Middle barrel (with recoil)
        ctx.fillRect(2, -1.2, 16 - this.recoil * 0.6, 2.5);
        ctx.strokeRect(2, -1.2, 16 - this.recoil * 0.6, 2.5);
        // Bottom barrel
        ctx.fillRect(2, 3 - spin * 0.4, 14, 2.5);
        ctx.strokeRect(2, 3 - spin * 0.4, 14, 2.5);

        // Muzzle Barrel Bracket Collar
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#ffffff';
        ctx.fillRect(12, -6.5, 2.5, 13);
        ctx.strokeRect(12, -6.5, 2.5, 13);

        // Turret Rotor Hub
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'sniper': {
        // Railgun: Massive Twin Electromagnetic Rails + Neon Plasma Core Accelerator
        // Rear Hydraulic Breach
        ctx.fillStyle = '#0d1829';
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.fillRect(-8, -5, 8, 10);
        ctx.strokeRect(-8, -5, 8, 10);

        // Top Rail
        const railLen = 27 - this.recoil;
        ctx.fillStyle = color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.fillRect(0, -4.2, railLen, 2.6);
        ctx.strokeRect(0, -4.2, railLen, 2.6);

        // Bottom Rail
        ctx.fillRect(0, 1.6, railLen, 2.6);
        ctx.strokeRect(0, 1.6, railLen, 2.6);

        // Glowing High-Energy Plasma Conduit running between rails
        ctx.fillStyle = '#00ffcc';
        ctx.shadowColor = '#00ffcc';
        ctx.shadowBlur = 8;
        ctx.fillRect(1, -1.2, railLen - 3, 2.4);
        ctx.shadowBlur = 0;

        // Electromagnetic Capacitor Rings
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(8, -5.5, 2, 11);
        ctx.fillRect(17, -5.5, 2, 11);

        // Sleek Sniper Sensor Dome
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'cannon': {
        // Heavy Siege Howitzer: Massive Thick Mortar Tube + Rear Counterweight + Reinforced Muzzle Ring
        // Rear Counterweight
        ctx.fillStyle = '#0d1322';
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.fillRect(-10, -7, 9, 14);
        ctx.strokeRect(-10, -7, 9, 14);

        // Main Heavy Mortar Tube (with recoil)
        const tubeLen = 15 - this.recoil;
        ctx.fillStyle = color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.fillRect(-1, -5.5, tubeLen, 11);
        ctx.strokeRect(-1, -5.5, tubeLen, 11);

        // Reinforced Heavy Muzzle Ring Collar
        ctx.fillStyle = '#ff6200';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.fillRect(tubeLen - 1, -7.5, 4, 15);
        ctx.strokeRect(tubeLen - 1, -7.5, 4, 15);

        // Bore Hole
        ctx.fillStyle = '#000000';
        ctx.fillRect(tubeLen + 2.5, -4, 1.5, 8);

        // Heavy Elevation Pivot Bolts
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, -6, 2, 0, Math.PI * 2);
        ctx.arc(0, 6, 2, 0, Math.PI * 2);
        ctx.fill();

        // Center Dome
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'cryo': {
        // Cryogenic Projector: Nitrogen Pressure Vessel + Flared Frost Nozzle + Condensation Rings
        // Spherical Cryo Core Vessel
        ctx.fillStyle = '#0f2738';
        ctx.strokeStyle = '#60d5ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Flared Frost Emitter Nozzle
        ctx.fillStyle = color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(5, -4);
        ctx.lineTo(16, -7);
        ctx.lineTo(16, 7);
        ctx.lineTo(5, 4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Cryo Condensation Emission Rings
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(15, 0, 4.5, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();

        // Glowing Frost Core
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#60d5ff';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        break;
      }

      case 'tesla': {
        // High-Voltage Resonant Tesla Coil: Vertical Transformer Column + 3 Toroidal Induction Rings + Plasma Orb
        // Base Conduit Hub
        ctx.fillStyle = '#1c1333';
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 3 Stacked Toroidal Induction Rings
        ctx.strokeStyle = '#d500f9';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 4.8, 0, Math.PI * 2);
        ctx.stroke();

        // 3 Rotating Discharge Probes
        const rot = this.pulseAngle * 2;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          const a = rot + (i * Math.PI * 2) / 3;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a) * 14, Math.sin(a) * 14);
          ctx.stroke();

          // Electrode tip
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(Math.cos(a) * 14 - 1.5, Math.sin(a) * 14 - 1.5, 3, 3);
        }

        // Top Plasma Discharge Orb
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#b84dff';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        break;
      }

      case 'laser': {
        // Thermal Beam Projector: Optical Focus Chamber + Twin Wing Prisms + Exposed Ruby Crystal
        // Optical Core Chamber
        ctx.fillStyle = '#22081f';
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.fillRect(-6, -6, 12, 12);
        ctx.strokeRect(-6, -6, 12, 12);

        // Center Beam Emitter Tube
        ctx.fillStyle = color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.fillRect(4, -3, 14, 6);
        ctx.strokeRect(4, -3, 14, 6);

        // Twin Optical Focus Wings (Angled Prisms)
        ctx.fillStyle = 'rgba(255, 0, 119, 0.4)';
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        // Top Wing
        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.lineTo(16, -8.5);
        ctx.lineTo(12, -3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Bottom Wing
        ctx.beginPath();
        ctx.moveTo(0, 6);
        ctx.lineTo(16, 8.5);
        ctx.lineTo(12, 3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Forward Optical Lens Aperture
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(17, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Exposed Glowing Ruby Laser Core Gem
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ff0077';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        break;
      }

      case 'booster': {
        // Quantum Levitating Core: Rotating Crystal Octahedron + 3 Orbiting Satellite Nodes
        ctx.rotate(this.pulseAngle);

        // Central Quantum Octahedron Crystal
        ctx.fillStyle = color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.fillRect(-6.5, -6.5, 13, 13);
        ctx.strokeRect(-6.5, -6.5, 13, 13);
        ctx.shadowBlur = 0;

        // Inner White Core
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-3, -3, 6, 6);

        // 3 Orbiting Satellite Data Nodes
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
          const a = (i * Math.PI * 2) / 3 - this.pulseAngle * 2.5;
          const sx = Math.cos(a) * 13.5;
          const sy = Math.sin(a) * 13.5;
          ctx.beginPath();
          ctx.arc(sx, sy, 2.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        break;
      }

      default: {
        // Pulse: Double-Stepped Combat Assault Cannon + Muzzle Brake
        // Base Turret Housing Block
        ctx.fillStyle = '#101c33';
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.fillRect(-5, -5.5, 10, 11);
        ctx.strokeRect(-5, -5.5, 10, 11);

        // Stepped Forward Barrel (with recoil)
        const barrelLen = 14 - this.recoil;
        ctx.fillStyle = color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.fillRect(4, -3.2, barrelLen, 6.4);
        ctx.strokeRect(4, -3.2, barrelLen, 6.4);

        // Heavy Muzzle Brake
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(4 + barrelLen - 2, -4.5, 3.5, 9);

        // Center Glowing Energy Line
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, -1, 10, 2);

        // Turret Center Dome
        ctx.beginPath();
        ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
        ctx.fill();

        // Cyan Sensor Dot
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
    }

    ctx.restore(); // restores barrel rotation & weapon state

    // 6. Level Stars / Badges (unrotated)
    if (this.level > 1) {
      ctx.save();
      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = this.level === 4 ? '#ffd000' : '#00ff9d';
      ctx.textAlign = 'center';
      const label = this.level === 4 ? (this.evolvedPath === 'pathA' ? 'EX-A' : 'EX-B') : `Lv${this.level}`;
      ctx.fillText(label, 0, -22);
      ctx.restore();
    }

    ctx.restore(); // restores ctx.scale(s, s)

    ctx.restore(); // restores ctx.translate
  }
}
