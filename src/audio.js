// ==========================================
// PROCEDURAL AUDIO SYNTHESIZER (WEB AUDIO API)
// ==========================================
import { state } from './state.js';

class AudioManager {
  constructor() {
    this.ctx = null;
    this.bgmGain = null;
    this.sfxGain = null;
    this.isBgmPlaying = false;
    this.bgmStep = 0;
    this.bgmTimer = null;
    this.isMuted = false;
    this.lastSoundTimes = {};
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master Gains
      this.bgmGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      const bgmVol = (state.data.settings.bgmEnabled !== false) ? state.data.settings.bgmVolume : 0;
      this.bgmGain.gain.setValueAtTime(bgmVol, this.ctx.currentTime);
      this.sfxGain.gain.setValueAtTime(state.data.settings.sfxVolume, this.ctx.currentTime);

      this.bgmGain.connect(this.ctx.destination);
      this.sfxGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
    }
  }

  ensureContext() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  canPlaySound(key, minIntervalMs = 35) {
    const now = performance.now();
    const last = this.lastSoundTimes[key] || 0;
    if (now - last < minIntervalMs) return false;
    this.lastSoundTimes[key] = now;
    return true;
  }

  setBgmVolume(val) {
    state.data.settings.bgmVolume = val;
    state.save();
    if (this.bgmGain && this.ctx) {
      const effective = (state.data.settings.bgmEnabled !== false) ? val : 0;
      this.bgmGain.gain.setValueAtTime(effective, this.ctx.currentTime);
    }
    if (state.data.settings.bgmEnabled !== false && val > 0 && !this.isBgmPlaying) {
      this.startBgm();
    }
  }

  setSfxVolume(val) {
    state.data.settings.sfxVolume = val;
    state.save();
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(val, this.ctx.currentTime);
    }
  }

  setBgmEnabled(enabled) {
    state.data.settings.bgmEnabled = enabled;
    state.save();
    if (this.bgmGain && this.ctx) {
      const effective = enabled ? state.data.settings.bgmVolume : 0;
      this.bgmGain.gain.setValueAtTime(effective, this.ctx.currentTime);
    }
    if (enabled) {
      if (!this.isBgmPlaying) this.startBgm();
    } else {
      this.stopBgm();
    }
  }

  // --- Sound Effects ---

  playShoot(type = 'pulse') {
    if (!this.ctx || state.data.settings.sfxVolume <= 0) return;
    if (!this.canPlaySound('shoot_' + type, 35)) return;
    this.ensureContext();
    const now = this.ctx.currentTime;

    switch (type) {
      case 'gatling': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(380, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.06);
        break;
      }
      case 'sniper': {
        // High energy railgun whip
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1800, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.22);

        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.26);
        break;
      }
      case 'cannon': {
        // Heavy boom pop
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);

        gain.gain.setValueAtTime(0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.23);
        break;
      }
      case 'cryo': {
        // Chilly pitch drop
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(650, now);
        osc.frequency.linearRampToValueAtTime(450, now + 0.12);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.13);
        break;
      }
      case 'tesla': {
        // Electric zap
        this.playNoise(0.08, 0.4, 3000);
        break;
      }
      case 'laser': {
        // Soft continuous buzz
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.08);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.09);
        break;
      }
      default: {
        // Pulse
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.09);
        break;
      }
    }
  }

  playExplosion(intensity = 1.0) {
    if (!this.ctx || state.data.settings.sfxVolume <= 0) return;
    if (!this.canPlaySound('explosion', 45)) return;
    this.ensureContext();
    const duration = 0.25 * intensity;
    this.playNoise(duration, 0.5 * intensity, 800);

    // Sub bass drop
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + duration);

    gain.gain.setValueAtTime(0.6 * intensity, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playHit() {
    if (!this.ctx || state.data.settings.sfxVolume <= 0) return;
    if (!this.canPlaySound('hit', 40)) return;
    this.ensureContext();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.05);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  playNoise(duration, volume, cutoff = 1500) {
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start();
  }

  playUpgrade() {
    if (!this.ctx || state.data.settings.sfxVolume <= 0) return;
    this.ensureContext();
    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880]; // A major chord
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.3, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.16);
    });
  }

  playSell() {
    if (!this.ctx || state.data.settings.sfxVolume <= 0) return;
    this.ensureContext();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.setValueAtTime(1200, now + 0.08);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.19);
  }

  playSkill(skillId) {
    if (!this.ctx || state.data.settings.sfxVolume <= 0) return;
    this.ensureContext();
    const now = this.ctx.currentTime;
    if (skillId === 'emp') {
      this.playNoise(0.5, 0.6, 5000);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.4);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.5);
    } else {
      this.playExplosion(1.5);
    }
  }

  playDefeat() {
    if (!this.ctx || state.data.settings.sfxVolume <= 0) return;
    this.ensureContext();
    const now = this.ctx.currentTime;
    const notes = [300, 280, 240, 180];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.18);

      gain.gain.setValueAtTime(0.4, now + idx * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.18 + 0.28);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.18);
      osc.stop(now + idx * 0.18 + 0.3);
    });
  }

  playVictory() {
    if (!this.ctx || state.data.settings.sfxVolume <= 0) return;
    this.ensureContext();
    const now = this.ctx.currentTime;
    const notes = [440, 554, 659, 880, 1108];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(0.35, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.4);
    });
  }

  // --- Procedural Cyberpunk BGM Engine ---
  startBgm() {
    this.ensureContext();
    if (!this.ctx || this.isBgmPlaying || state.data.settings.bgmEnabled === false) return;
    this.isBgmPlaying = true;
    this.bgmStep = 0;

    const tempo = 128; // BPM
    const stepDuration = 60 / tempo / 4; // 16th note in seconds

    // Cyberpunk Synth Bassline & Arp
    const bassNotes = [55, 55, 55, 55, 65.41, 65.41, 73.42, 82.41]; // A1, C2, D2, E2
    const leadNotes = [220, 261.63, 293.66, 329.63, 392, 440, 523.25, 587.33];

    const playStep = () => {
      if (!this.isBgmPlaying || !this.ctx) return;
      const now = this.ctx.currentTime;
      const step16 = this.bgmStep % 16;
      const step32 = this.bgmStep % 32;

      // 1. Kick on beat 0, 4, 8, 12
      if (step16 % 4 === 0 && state.data.settings.bgmVolume > 0) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(110, now);
        kickOsc.frequency.exponentialRampToValueAtTime(35, now + 0.1);
        kickGain.gain.setValueAtTime(0.45, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        kickOsc.connect(kickGain);
        kickGain.connect(this.bgmGain);
        kickOsc.start(now);
        kickOsc.stop(now + 0.13);
      }

      // 2. Hi-hat on offbeats
      if (step16 % 2 === 1 && state.data.settings.bgmVolume > 0) {
        this.playNoise(0.03, 0.12, 8000);
      }

      // 3. Synth Bass (16th note drive)
      if (state.data.settings.bgmVolume > 0) {
        const bassFreq = bassNotes[Math.floor(step32 / 4) % bassNotes.length];
        const bassOsc = this.ctx.createOscillator();
        const bassFilter = this.ctx.createBiquadFilter();
        const bassGain = this.ctx.createGain();

        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(bassFreq, now);

        bassFilter.type = 'lowpass';
        bassFilter.frequency.setValueAtTime(450, now);
        bassFilter.frequency.exponentialRampToValueAtTime(150, now + stepDuration * 0.9);

        bassGain.gain.setValueAtTime(0.25, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 0.9);

        bassOsc.connect(bassFilter);
        bassFilter.connect(bassGain);
        bassGain.connect(this.bgmGain);

        bassOsc.start(now);
        bassOsc.stop(now + stepDuration);
      }

      // 4. Arpeggiator Lead
      if (step16 % 2 === 0 && state.data.settings.bgmVolume > 0) {
        const arpIndex = (this.bgmStep * 3) % leadNotes.length;
        const leadFreq = leadNotes[arpIndex];

        const leadOsc = this.ctx.createOscillator();
        const leadGain = this.ctx.createGain();
        leadOsc.type = 'square';
        leadOsc.frequency.setValueAtTime(leadFreq, now);

        leadGain.gain.setValueAtTime(0.1, now);
        leadGain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 1.5);

        leadOsc.connect(leadGain);
        leadGain.connect(this.bgmGain);

        leadOsc.start(now);
        leadOsc.stop(now + stepDuration * 1.6);
      }

      this.bgmStep++;
      this.bgmTimer = setTimeout(playStep, stepDuration * 1000);
    };

    playStep();
  }

  stopBgm() {
    this.isBgmPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  toggleBgm() {
    if (this.isBgmPlaying) {
      this.stopBgm();
      return false;
    } else {
      this.startBgm();
      return true;
    }
  }
}

export const audio = new AudioManager();
