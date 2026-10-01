// ==========================================
// PROJECTILES & WEAPON EFFECTS
// ==========================================
import { effects } from './particles.js';
import { audio } from './audio.js';

export class Projectile {
  constructor(options) {
    this.x = options.x;
    this.y = options.y;
    this.target = options.target; // Enemy ref
    this.damage = options.damage;
    this.speed = options.speed || 500;
    this.color = options.color || '#00f0ff';
    this.type = options.type || 'bullet'; // bullet, missile, splash, piercing
    this.damageType = options.damageType || 'physical';
    this.isCrit = options.isCrit || false;

    // Splash
    this.splashRadius = options.splashRadius || 0;
    this.clusterCount = options.clusterCount || 0;
    this.burnDuration = options.burnDuration || 0;

    // Piercing
    this.pierceCount = options.pierceCount || 1;
    this.hitEnemies = new Set();
    this.angle = options.angle !== undefined ? options.angle : (options.target ? Math.atan2(options.target.y - options.y, options.target.x - options.x) : 0);

    // Arc trajectory for Mortar/Cannon
    this.isArc = options.isArc || false;
    this.targetPos = options.targetPos || (options.target ? { x: options.target.x, y: options.target.y } : { x: this.x, y: this.y });
    this.startPos = { x: this.x, y: this.y };
    this.totalDist = Math.hypot(this.targetPos.x - this.startPos.x, this.targetPos.y - this.startPos.y);
    this.travelDist = 0;
    this.arcHeight = Math.min(80, this.totalDist * 0.4);

    // Debuff payloads
    this.slowAmount = options.slowAmount || 0;
    this.slowDuration = options.slowDuration || 0;
    this.shredArmor = options.shredArmor || 0;
    this.knockback = options.knockback || 0;

    this.dead = false;
  }

  update(dt, allEnemies, newProjectiles) {
    if (this.dead) return;

    if (this.isArc) {
      // Cannon Arc Trajectory
      const step = this.speed * dt;
      this.travelDist += step;
      const progress = Math.min(1, this.travelDist / this.totalDist);

      this.x = this.startPos.x + (this.targetPos.x - this.startPos.x) * progress;
      const linearY = this.startPos.y + (this.targetPos.y - this.startPos.y) * progress;
      const heightOffset = Math.sin(progress * Math.PI) * this.arcHeight;
      this.y = linearY - heightOffset;

      if (progress >= 1) {
        this.explode(allEnemies, newProjectiles);
      }
      return;
    }

    if (this.type === 'piercing') {
      // Moves straight through the map
      this.x += Math.cos(this.angle) * this.speed * dt;
      this.y += Math.sin(this.angle) * this.speed * dt;

      // Check collision with enemies
      for (const enemy of allEnemies) {
        if (!enemy.dead && !this.hitEnemies.has(enemy.id)) {
          const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
          if (dist <= enemy.size + 8) {
            this.hitEnemies.add(enemy.id);
            this.applyDamage(enemy);
            if (this.hitEnemies.size >= this.pierceCount) {
              this.dead = true;
              break;
            }
          }
        }
      }

      // Check out of bounds
      if (this.x < -100 || this.x > 2000 || this.y < -100 || this.y > 2000) {
        this.dead = true;
      }
      return;
    }

    // Standard Direct Bullet
    if (this.target && !this.target.dead) {
      this.angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
    }

    const vx = Math.cos(this.angle) * this.speed * dt;
    const vy = Math.sin(this.angle) * this.speed * dt;
    this.x += vx;
    this.y += vy;

    // Check hit
    if (this.target && !this.target.dead) {
      const dist = Math.hypot(this.target.x - this.x, this.target.y - this.y);
      if (dist <= this.target.size + 6) {
        this.applyDamage(this.target);
        this.dead = true;
      }
    } else {
      // Find nearest enemy if target died
      for (const enemy of allEnemies) {
        if (!enemy.dead) {
          const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
          if (dist <= enemy.size + 6) {
            this.applyDamage(enemy);
            this.dead = true;
            break;
          }
        }
      }
      // Dead after moving too long
      this.travelDist += Math.hypot(vx, vy);
      if (this.travelDist > 1200) {
        this.dead = true;
      }
    }
  }

  applyDamage(enemy) {
    enemy.takeDamage(this.damage, this.damageType, this.isCrit);

    if (this.slowAmount > 0) {
      enemy.applySlow(this.slowAmount, this.slowDuration);
    }
    if (this.shredArmor > 0) {
      enemy.applyArmorShred(this.shredArmor);
    }
    if (this.knockback > 0) {
      enemy.distance = Math.max(0, enemy.distance - this.knockback * 0.05);
    }

    effects.emitSparks(this.x, this.y, this.color, 4, 60);
  }

  explode(allEnemies, newProjectiles) {
    this.dead = true;
    effects.emitExplosion(this.x, this.y, this.color, 24, this.splashRadius);
    audio.playExplosion(1.0);

    for (const enemy of allEnemies) {
      if (!enemy.dead) {
        const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
        if (dist <= this.splashRadius) {
          const falloff = 1 - (dist / this.splashRadius) * 0.4;
          enemy.takeDamage(this.damage * falloff, 'explosive', this.isCrit);
        }
      }
    }

    // Cluster sub-munitions
    if (this.clusterCount > 0 && newProjectiles) {
      for (let i = 0; i < this.clusterCount; i++) {
        const offsetAngle = (i * Math.PI * 2) / this.clusterCount;
        const targetX = this.x + Math.cos(offsetAngle) * 50;
        const targetY = this.y + Math.sin(offsetAngle) * 50;
        newProjectiles.push(new Projectile({
          x: this.x,
          y: this.y,
          targetPos: { x: targetX, y: targetY },
          damage: this.damage * 0.45,
          splashRadius: 35,
          speed: 300,
          color: '#ff9100',
          isArc: true,
          damageType: 'explosive'
        }));
      }
    }

    // Radiation zone
    if (this.burnDuration > 0 && newProjectiles) {
      newProjectiles.push(new DamageZone(this.x, this.y, this.splashRadius * 0.9, this.damage * 0.35, this.burnDuration));
    }
  }

  draw(ctx) {
    if (this.dead) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;

    if (this.type === 'piercing') {
      // Long bright energy needle
      ctx.fillRect(-16, -2, 32, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-10, -1, 20, 2);
    } else if (this.isArc) {
      // Glowing shell
      ctx.beginPath();
      ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Sharp bullet
      ctx.beginPath();
      ctx.ellipse(0, 0, 6, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

// Persistent ground hazard zone (e.g. Atomic Mortar)
export class DamageZone {
  constructor(x, y, radius, dps, duration) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.dps = dps;
    this.duration = duration;
    this.life = duration;
    this.dead = false;
    this.pulse = 0;
  }

  update(dt, allEnemies) {
    this.life -= dt;
    this.pulse += dt * 5;
    if (this.life <= 0) {
      this.dead = true;
      return;
    }

    for (const enemy of allEnemies) {
      if (!enemy.dead) {
        const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
        if (dist <= this.radius) {
          enemy.applyBurn(this.dps, 0.5);
        }
      }
    }
  }

  draw(ctx) {
    if (this.dead) return;
    const alpha = (this.life / this.duration) * 0.35;
    ctx.save();
    ctx.fillStyle = `rgba(255, 98, 0, ${alpha})`;
    ctx.strokeStyle = '#ff9100';
    ctx.shadowColor = '#ff9100';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius + Math.sin(this.pulse) * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}
