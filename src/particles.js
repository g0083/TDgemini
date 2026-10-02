// ==========================================
// VISUAL EFFECTS & PARTICLE SYSTEM
// ==========================================
import { state } from './state.js';

export class Particle {
  constructor(x, y, color, options = {}) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = options.size || Math.random() * 3 + 2;
    this.maxLife = options.life || 0.5 + Math.random() * 0.4;
    this.life = this.maxLife;

    const angle = options.angle !== undefined ? options.angle : Math.random() * Math.PI * 2;
    const speed = options.speed !== undefined ? options.speed : Math.random() * 120 + 30;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.friction = options.friction || 0.94;
    this.shape = options.shape || 'circle'; // circle, square, spark
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= this.friction;
    this.vy *= this.friction;
    this.life -= dt;
  }

  draw(ctx) {
    if (this.life <= 0) return;
    const progress = this.life / this.maxLife;
    ctx.save();
    ctx.globalAlpha = Math.max(0, progress);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;

    if (this.shape === 'square') {
      const s = this.size * progress;
      ctx.fillRect(this.x - s / 2, this.y - s / 2, s, s);
    } else {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * progress, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

export class Shockwave {
  constructor(x, y, maxRadius, color = '#00f0ff', duration = 0.4, lineWidth = 3) {
    this.x = x;
    this.y = y;
    this.maxRadius = maxRadius;
    this.color = color;
    this.duration = duration;
    this.life = duration;
    this.lineWidth = lineWidth;
  }

  update(dt) {
    this.life -= dt;
  }

  draw(ctx) {
    if (this.life <= 0) return;
    const progress = 1 - (this.life / this.duration);
    const radius = this.maxRadius * Math.sin((progress * Math.PI) / 2);
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - progress);
    ctx.strokeStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    ctx.lineWidth = this.lineWidth * (1 - progress * 0.5);
    ctx.beginPath();
    ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

export class FloatingText {
  constructor(x, y, text, color = '#ffffff', options = {}) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.life = options.duration || 0.7;
    this.maxLife = this.life;
    this.vy = options.vy || -40;
    this.vx = (Math.random() - 0.5) * 15;
    this.fontSize = options.size || (options.isCrit ? 18 : 13);
    this.isCrit = options.isCrit || false;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
  }

  draw(ctx) {
    if (this.life <= 0) return;
    const progress = this.life / this.maxLife;
    ctx.save();
    ctx.globalAlpha = Math.min(1, progress * 1.5);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = this.isCrit ? 12 : 6;
    ctx.font = `${this.isCrit ? '900' : '700'} ${this.fontSize}px 'Outfit', 'Inter', monospace, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

export class EffectsManager {
  constructor() {
    this.particles = [];
    this.shockwaves = [];
    this.texts = [];
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.gameSpeed = 1.0;
  }

  clear() {
    this.particles = [];
    this.shockwaves = [];
    this.texts = [];
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
  }

  shake(intensity = 6, duration = 0.25) {
    if (!state.data.settings.screenShake) return;
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeDuration = Math.max(this.shakeDuration, duration);
  }

  getShakeOffset() {
    if (this.shakeDuration <= 0) return { x: 0, y: 0 };
    const factor = this.shakeIntensity;
    return {
      x: (Math.random() * 2 - 1) * factor,
      y: (Math.random() * 2 - 1) * factor
    };
  }

  addText(x, y, text, color = '#ffffff', options = {}) {
    if (!state.data.settings.damageNumbers) return;
    // At high speeds (5x, 8x), skip non-critical spam text to save CPU and canvas draw calls
    if (this.gameSpeed >= 5.0 && !options.isCrit && Math.random() > 0.15) {
      return;
    }
    // Hard ceiling on active floating text
    if (this.texts.length > 25 && !options.isCrit) {
      return;
    }
    this.texts.push(new FloatingText(x, y, text, color, options));
  }

  addShockwave(x, y, radius, color = '#00f0ff', duration = 0.4, lineWidth = 3) {
    if (this.shockwaves.length > 10) return;
    this.shockwaves.push(new Shockwave(x, y, radius, color, duration, lineWidth));
  }

  emitExplosion(x, y, color = '#ff5500', count = 18, radius = 55) {
    this.addShockwave(x, y, radius, color, 0.35, 4);
    // Throttle particles if at 5x or 8x speed
    let actualCount = count;
    if (this.gameSpeed >= 8.0) actualCount = Math.max(4, Math.round(count * 0.35));
    else if (this.gameSpeed >= 5.0) actualCount = Math.max(6, Math.round(count * 0.55));

    if (this.particles.length > 90) actualCount = Math.min(actualCount, 4);

    for (let i = 0; i < actualCount; i++) {
      this.particles.push(new Particle(x, y, color, {
        speed: Math.random() * 160 + 40,
        size: Math.random() * 4 + 2,
        life: Math.random() * 0.35 + 0.25,
        shape: Math.random() > 0.4 ? 'square' : 'circle'
      }));
    }
  }

  emitSparks(x, y, color = '#00f0ff', count = 8, speed = 80) {
    // If pool is near budget or high speed, throttle heavily
    if (this.particles.length > 80) return;
    let actualCount = count;
    if (this.gameSpeed >= 8.0) actualCount = Math.max(1, Math.round(count * 0.25));
    else if (this.gameSpeed >= 5.0) actualCount = Math.max(2, Math.round(count * 0.45));

    for (let i = 0; i < actualCount; i++) {
      this.particles.push(new Particle(x, y, color, {
        speed: Math.random() * speed + 20,
        size: Math.random() * 2.5 + 1.5,
        life: Math.random() * 0.2 + 0.12
      }));
    }
  }

  update(dt) {
    // Screen shake
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      if (this.shakeDuration <= 0) {
        this.shakeIntensity = 0;
      }
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update(dt);
      if (this.particles[i].life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      this.shockwaves[i].update(dt);
      if (this.shockwaves[i].life <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }

    // Update Floating Texts
    for (let i = this.texts.length - 1; i >= 0; i--) {
      this.texts[i].update(dt);
      if (this.texts[i].life <= 0) {
        this.texts.splice(i, 1);
      }
    }

    // Hard safety caps to avoid GC spikes
    if (this.particles.length > 100) {
      this.particles.splice(0, this.particles.length - 100);
    }
    if (this.texts.length > 30) {
      this.texts.splice(0, this.texts.length - 30);
    }
  }

  draw(ctx) {
    // Draw shockwaves first (beneath particles)
    for (const sw of this.shockwaves) {
      sw.draw(ctx);
    }
    // Draw particles
    for (const p of this.particles) {
      p.draw(ctx);
    }
    // Draw texts on top
    for (const t of this.texts) {
      t.draw(ctx);
    }
  }
}

export const effects = new EffectsManager();
