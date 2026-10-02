// ==========================================
// CORE GAME ENGINE & WAVE MANAGER
// ==========================================
import { MAPS, SKILLS, ENEMY_TYPES, TOWER_TYPES, DIFFICULTIES, MODIFIERS, PROTOCOLS } from './constants.js';
import { GameMap } from './map.js';
import { Tower } from './tower.js';
import { Enemy } from './enemy.js';
import { effects } from './particles.js';
import { audio } from './audio.js';
import { state } from './state.js';

export class GameEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.currentMapId = 'nexus_prime';
    this.isEndless = false;
    this.difficulty = 'NORMAL';
    this.activeModifiers = [];
    this.activeProtocols = [];
    this.protocolRerollsLeft = 0;
    this.emergencyBarrierUsed = false;
    this.score = 0;
    this.map = null;

    // Entities
    this.towers = [];
    this.enemies = [];
    this.projectiles = [];

    // Game variables
    this.gold = 350;
    this.baseHp = 20;
    this.maxBaseHp = 20;
    this.wave = 0;
    this.maxWaves = 30;
    this.isFlawless = true;

    this.waveState = 'INTERMISSION'; // INTERMISSION, SPAWNING, DEFENDING, SELECTING_PROTOCOL
    this.waveTimer = 0;
    this.spawnQueue = [];
    this.spawnInterval = 0;
    this.spawnTimer = 0;

    // Controls & Settings
    this.gameSpeed = 1.0;
    this.isPaused = false;
    this.isGameOver = false;
    this.isVictory = false;

    // Skill cooldown timers
    this.skillCooldowns = {
      orbital: 0,
      emp: 0,
      overcharge: 0,
      supply: 0
    };
    this.overchargeTimer = 0;

    // Selection
    this.selectedTower = null;
    this.buildingType = null;
    this.pointerGrid = null;
    this.activeSkillTargeting = null; // 'orbital' etc.

    // Callbacks for UI updates
    this.onStateChange = null;
    this.onGameOver = null;
    this.onVictory = null;
    this.onSelectProtocol = null; // (protocols, rerollsLeft) => void

    this.viewportWidth = 0;
    this.viewportHeight = 0;

    this.lastTime = performance.now();
  }

  loadStage(mapId, isEndless = false, difficulty = 'NORMAL', activeModifiers = []) {
    this.currentMapId = mapId;
    this.isEndless = isEndless;
    this.difficulty = difficulty || 'NORMAL';
    this.activeModifiers = activeModifiers || [];
    this.activeProtocols = [];
    this.protocolRerollsLeft = state.getTechMultiplier('protocol_reroll') || 0;
    this.emergencyBarrierUsed = false;
    this.score = 0;

    const mapData = MAPS.find((m) => m.id === mapId) || MAPS[0];
    this.map = new GameMap(mapData);

    // Compute Difficulty and Mutators Scaling Factors
    const diffDef = DIFFICULTIES[this.difficulty] || DIFFICULTIES.NORMAL;
    const hasMod = (id) => this.activeModifiers.includes(id);

    let hpMult = diffDef.hpMult;
    let speedMult = diffDef.speedMult;
    let rewardMult = diffDef.rewardMult;
    let scoreMult = diffDef.scoreMult;
    let coreMult = diffDef.coreMult;

    let shieldBonus = 0;
    let armorBonus = 0;

    if (hasMod('fast_enemies')) {
      speedMult *= 1.25;
      scoreMult += 0.25;
      coreMult += 0.25;
    }
    if (hasMod('hardened_armor')) {
      armorBonus += 0.15;
      shieldBonus += 60;
      scoreMult += 0.30;
      coreMult += 0.30;
    }
    if (hasMod('budget_cut')) {
      rewardMult *= 0.75;
      scoreMult += 0.35;
      coreMult += 0.35;
    }
    if (hasMod('no_skills')) {
      scoreMult += 0.40;
      coreMult += 0.40;
    }
    if (hasMod('swarm_surge')) {
      scoreMult += 0.45;
      coreMult += 0.45;
    }
    if (hasMod('boss_frenzy')) {
      scoreMult += 0.50;
      coreMult += 0.50;
    }

    this.scaling = {
      hpMult,
      speedMult,
      rewardMult,
      scoreMult,
      coreMult,
      shieldBonus,
      armorBonus,
      hasBossFrenzy: hasMod('boss_frenzy'),
      hasSwarmSurge: hasMod('swarm_surge')
    };

    // Apply viewport dimensions immediately so map is sized and rendered
    if (this.viewportWidth > 0 && this.viewportHeight > 0) {
      this.map.resize(this.viewportWidth, this.viewportHeight);
    } else if (this.canvas) {
      const rect = this.canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        this.viewportWidth = rect.width;
        this.viewportHeight = rect.height;
        this.map.resize(rect.width, rect.height);
      }
    }

    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    effects.clear();

    // Calculate starting gold with tech bonuses
    const bonusGold = state.getTechMultiplier('starting_gold');
    this.gold = mapData.startGold + bonusGold;

    // Calculate base HP with tech bonuses
    const bonusHp = state.getTechMultiplier('base_nanites');
    this.maxBaseHp = mapData.baseHp + bonusHp;
    this.baseHp = this.maxBaseHp;

    this.wave = 0;
    this.maxWaves = isEndless ? 9999 : mapData.wavesCount;
    this.isFlawless = true;

    this.waveState = 'INTERMISSION';
    this.waveTimer = 5.0; // 5s before first wave
    this.spawnQueue = [];

    this.isGameOver = false;
    this.isVictory = false;
    this.selectedTower = null;
    this.buildingType = null;
    this.activeSkillTargeting = null;

    // Reset skill cooldowns
    for (const key in this.skillCooldowns) {
      this.skillCooldowns[key] = 0;
    }
    this.overchargeTimer = 0;

    this.updateBoosterAuras();
    this.notifyUI();
  }

  resize(w, h) {
    this.viewportWidth = w;
    this.viewportHeight = h;
    if (this.map) {
      this.map.resize(w, h);
      // Reposition and scale existing towers to match resized grid cells
      for (const t of this.towers) {
        const p = this.map.gridToPixel(t.col, t.row);
        t.x = p.x;
        t.y = p.y;
        t.mapScale = this.map.scale;
        t.recalculateStats();
      }
    }
  }

  notifyUI() {
    if (this.onStateChange) {
      this.onStateChange({
        gold: this.gold,
        baseHp: this.baseHp,
        maxBaseHp: this.maxBaseHp,
        wave: this.wave,
        maxWaves: this.maxWaves,
        waveState: this.waveState,
        waveTimer: Math.ceil(this.waveTimer),
        selectedTower: this.selectedTower,
        buildingType: this.buildingType,
        skillCooldowns: this.skillCooldowns,
        skillsConfig: SKILLS,
        gameSpeed: this.gameSpeed,
        isPaused: this.isPaused,
        isEndless: this.isEndless,
        activeSkillTargeting: this.activeSkillTargeting
      });
    }
  }

  // --- Building & Tower Interactions ---

  setBuildingType(typeId) {
    this.activeSkillTargeting = null;
    if (this.buildingType === typeId) {
      this.buildingType = null;
    } else {
      this.buildingType = typeId;
      this.selectedTower = null;
    }
    this.notifyUI();
  }

  selectTower(tower) {
    this.buildingType = null;
    this.activeSkillTargeting = null;
    this.selectedTower = tower;
    this.notifyUI();
  }

  buildTower(col, row) {
    if (!this.buildingType || !this.map.canBuild(col, row)) return false;
    const def = TOWER_TYPES[this.buildingType];
    if (this.gold < def.cost) return false;

    this.gold -= def.cost;
    const pixel = this.map.gridToPixel(col, row);
    const tower = new Tower(this.buildingType, col, row, pixel.x, pixel.y, this.map.scale);
    this.towers.push(tower);
    this.map.occupyCell(col, row);

    audio.playUpgrade();
    effects.emitSparks(pixel.x, pixel.y, def.color, 12, 70);
    state.recordTowerBuilt();

    this.updateBoosterAuras();
    this.selectedTower = tower;
    this.buildingType = null;
    this.notifyUI();
    return true;
  }

  upgradeSelectedTower() {
    if (!this.selectedTower) return;
    const cost = this.selectedTower.getUpgradeCost();
    if (cost && this.gold >= cost) {
      this.gold -= cost;
      this.selectedTower.upgradeLevel();
      this.updateBoosterAuras();
      this.notifyUI();
    }
  }

  evolveSelectedTower(pathKey) {
    if (!this.selectedTower) return;
    const cost = pathKey === 'pathA' ? this.selectedTower.getPathACost() : this.selectedTower.getPathBCost();
    if (cost && this.gold >= cost) {
      this.gold -= cost;
      this.selectedTower.evolve(pathKey);
      this.updateBoosterAuras();
      this.notifyUI();
    }
  }

  sellSelectedTower() {
    if (!this.selectedTower) return;
    const refund = Math.floor(this.selectedTower.totalInvested * 0.7);
    this.gold += refund;

    const idx = this.towers.indexOf(this.selectedTower);
    if (idx !== -1) {
      this.towers.splice(idx, 1);
      this.map.freeCell(this.selectedTower.col, this.selectedTower.row);
      audio.playSell();
      effects.emitExplosion(this.selectedTower.x, this.selectedTower.y, '#ffd000', 10, 40);
    }
    this.selectedTower = null;
    this.updateBoosterAuras();
    this.notifyUI();
  }

  updateBoosterAuras() {
    // Reset all buffs first
    for (const t of this.towers) {
      t.buffDamage = 0;
      t.buffRate = 0;
      t.buffRange = 0;
      t.buffCrit = 0;
    }

    // Apply booster synergies
    for (const b of this.towers) {
      if (b.def.type === 'booster') {
        if (b.disabledTimer > 0) continue; // Disabled booster cannot provide auras
        const p = b.evolvedData;
        const bDmg = p?.buffDamage || b.def.buffDamage || 0;
        const bRate = p?.buffRate || b.def.buffRate || 0;
        const bCrit = p?.buffCrit || 0;
        const bRange = p?.buffRange || 0;

        for (const t of this.towers) {
          if (t !== b && t.def.type !== 'booster') {
            const dist = Math.hypot(t.x - b.x, t.y - b.y);
            if (dist <= b.effectiveRange) {
              t.buffDamage = Math.max(t.buffDamage, bDmg);
              t.buffRate = Math.max(t.buffRate, bRate);
              t.buffCrit = Math.max(t.buffCrit, bCrit);
              t.buffRange = Math.max(t.buffRange, bRange);
            }
          }
        }
      }
    }

    for (const t of this.towers) {
      t.recalculateStats();
    }
  }

  // --- Commander Skills ---

  activateSkill(skillId, targetPos = null) {
    if (this.activeModifiers.includes('no_skills')) {
      effects.addText(this.map.width / 2 + this.map.offsetX, 75, '通信途絶: スキル使用不可 (JAMMED)', '#ff2e63', { isCrit: true, size: 16 });
      audio.playDefeat();
      return;
    }

    const skill = SKILLS[skillId];
    if (!skill || this.skillCooldowns[skillId] > 0) return;

    if (skill.needsTarget && !targetPos) {
      this.activeSkillTargeting = skillId;
      this.buildingType = null;
      this.selectedTower = null;
      this.notifyUI();
      return;
    }

    // Cooldown reduction calculation (Tech + Orbital Overdrive Protocol)
    let cdReduction = state.getTechMultiplier('skill_cooldown');
    if (this.activeProtocols.some((p) => p.id === 'orbital_overdrive')) {
      cdReduction = Math.min(0.65, cdReduction + 0.25);
    }
    this.skillCooldowns[skillId] = skill.cooldown * (1 - cdReduction);
    this.activeSkillTargeting = null;
    state.recordSkillUse();

    switch (skillId) {
      case 'orbital': {
        const scale = this.map ? (this.map.scale || 1) : 1;
        const radius = skill.radius * scale;
        audio.playSkill('orbital');
        effects.shake(14, 0.5);
        effects.addShockwave(targetPos.x, targetPos.y, radius * 1.2, '#00f0ff', 0.6, 6);
        effects.emitExplosion(targetPos.x, targetPos.y, '#00f0ff', 50, radius);

        for (const enemy of this.enemies) {
          if (!enemy.dead) {
            const dist = Math.hypot(enemy.x - targetPos.x, enemy.y - targetPos.y);
            if (dist <= radius) {
              enemy.takeDamage(skill.damage, 'pierce', true, this.activeProtocols);
            }
          }
        }
        break;
      }

      case 'emp': {
        audio.playSkill('emp');
        effects.shake(8, 0.4);
        effects.addShockwave(this.map.width / 2 + this.map.offsetX, this.map.height / 2 + this.map.offsetY, 600, '#b84dff', 0.8, 8);

        const duration = skill.duration + (this.activeProtocols.some((p) => p.id === 'orbital_overdrive') ? 3 : 0);
        for (const enemy of this.enemies) {
          if (!enemy.dead) {
            enemy.applyStun(duration);
            if (enemy.shield > 0) {
              enemy.shield *= (1 - skill.shieldDamagePercent);
            }
          }
        }
        break;
      }

      case 'overcharge': {
        audio.playUpgrade();
        const duration = skill.duration + (this.activeProtocols.some((p) => p.id === 'orbital_overdrive') ? 5 : 0);
        this.overchargeTimer = duration;
        effects.addText(this.map.width / 2 + this.map.offsetX, this.map.height / 2 + this.map.offsetY, 'HYPERDRIVE ENGAGED!', '#ffd000', { isCrit: true, size: 24 });
        break;
      }

      case 'supply': {
        audio.playSell();
        this.gold += skill.goldAmount;
        effects.addText(this.map.width / 2 + this.map.offsetX, this.map.height / 2 + this.map.offsetY, `+${skill.goldAmount} CREDITS`, '#00ff9d', { isCrit: true });
        break;
      }
    }

    this.notifyUI();
  }

  // --- Wave Generation & Spawning ---

  startNextWaveImmediately() {
    if (this.waveState === 'INTERMISSION') {
      // Early wave start bonus
      const bonus = Math.floor(this.waveTimer * 4);
      if (bonus > 0) {
        this.gold += bonus;
        effects.addText(this.map.width / 2 + this.map.offsetX, 60, `+${bonus} G (SPEED BONUS)`, '#ffd000');
      }
      this.startWave();
    }
  }

  startWave() {
    this.wave++;
    state.recordWave(this.wave);

    this.waveState = 'SPAWNING';
    this.spawnQueue = this.generateWaveQueue(this.wave);
    this.spawnInterval = Math.max(0.20, 1.2 - this.wave * 0.02);
    this.spawnTimer = 0;

    // Check boss wave
    const hasBoss = this.spawnQueue.some((item) => ENEMY_TYPES[item.type]?.isBoss);
    if (hasBoss) {
      effects.shake(12, 0.4);
      audio.playDefeat(); // ominous alert
    }

    this.notifyUI();
  }

  generateWaveQueue(wave) {
    const queue = [];
    const numPaths = this.map.data.paths.length;

    // Boss Waves
    if (wave === 10) {
      queue.push({ type: 'boss_colossus', path: 0 });
      return queue;
    }
    if (wave === 20) {
      queue.push({ type: 'boss_reaper', path: 0 });
      for (let i = 0; i < 8; i++) queue.push({ type: 'scout', path: i % numPaths });
      return queue;
    }
    if (wave === 30) {
      queue.push({ type: 'boss_overlord', path: 0 });
      for (let i = 0; i < 12; i++) queue.push({ type: 'shielded', path: i % numPaths });
      return queue;
    }

    // Endless Mode Boss Encounters (Wave 40, 50, 60... = Leviathan, others = Overlord / Reaper)
    if (this.isEndless && wave > 30) {
      if (wave % 10 === 0) {
        queue.push({ type: 'boss_leviathan', path: 0 });
        for (let i = 0; i < 6; i++) queue.push({ type: 'dreadnought', path: i % numPaths });
        return queue;
      }
      if (wave % 5 === 0) {
        queue.push({ type: wave % 10 === 5 ? 'boss_overlord' : 'boss_reaper', path: 0 });
        for (let i = 0; i < 8; i++) queue.push({ type: 'kamikaze', path: i % numPaths });
        return queue;
      }
    }

    // Standard & Advanced Mix Waves (with Swarm Surge Mutator support)
    const baseCount = Math.min(75, 8 + Math.floor(wave * 2.2));
    const count = this.scaling?.hasSwarmSurge ? Math.round(baseCount * 1.35) : baseCount;

    for (let i = 0; i < count; i++) {
      const pathIdx = i % numPaths;
      let enemyType = 'trooper';

      if (!this.isEndless || wave <= 25) {
        // --- CAMPAIGN & EARLY ENDLESS POOL ---
        if (wave < 3) {
          enemyType = Math.random() < 0.7 ? 'scout' : 'trooper';
        } else if (wave < 7) {
          const r = Math.random();
          enemyType = r < 0.4 ? 'scout' : r < 0.75 ? 'trooper' : 'heavy';
        } else if (wave < 12) {
          const r = Math.random();
          enemyType = r < 0.3 ? 'swarm' : r < 0.6 ? 'shielded' : r < 0.85 ? 'splitter' : 'heavy';
        } else if (wave < 18) {
          const r = Math.random();
          enemyType = r < 0.25 ? 'stealth' : r < 0.5 ? 'healer' : r < 0.75 ? 'shielded' : 'splitter';
        } else {
          // Late campaign: Introduce occasional Disruptors and Kamikazes for tactical tower threat
          const r = Math.random();
          if (r < 0.12) enemyType = 'disruptor';
          else if (r < 0.24) enemyType = 'kamikaze';
          else if (r < 0.44) enemyType = 'heavy';
          else if (r < 0.64) enemyType = 'shielded';
          else if (r < 0.82) enemyType = 'splitter';
          else enemyType = 'stealth';
        }
      } else {
        // --- ENDLESS MODE EXCLUSIVE DEEP THREAT POOL (Wave 26+) ---
        // Unleash Warpers, Reflectors, Dreadnoughts, Disruptors, Kamikazes in force!
        const r = Math.random();
        if (r < 0.18) {
          enemyType = 'warper'; // Quantum teleportation rush
        } else if (r < 0.34) {
          enemyType = 'reflector'; // Energy reflect crystal
        } else if (r < 0.48) {
          enemyType = 'dreadnought'; // Tower hacker + shield aura
        } else if (r < 0.62) {
          enemyType = 'disruptor'; // EMP hacker
        } else if (r < 0.78) {
          enemyType = 'kamikaze'; // Suicide tower diving
        } else if (r < 0.90) {
          enemyType = 'splitter';
        } else {
          enemyType = 'healer';
        }
      }

      queue.push({ type: enemyType, path: pathIdx });
    }

    return queue;
  }

  // --- Main Update Loop ---

  update(dt) {
    if (this.isPaused || this.isGameOver || this.isVictory || this.waveState === 'SELECTING_PROTOCOL') return;

    // Synchronize gameSpeed with effects manager for particle throttling
    effects.gameSpeed = this.gameSpeed;

    const totalDt = dt * this.gameSpeed;
    const steps = this.gameSpeed >= 8.0 ? 3 : (this.gameSpeed >= 5.0 ? 2 : 1);
    const subDt = totalDt / steps;

    for (let s = 0; s < steps; s++) {
      this.stepSimulation(subDt);
      if (this.isGameOver || this.isVictory || this.waveState === 'SELECTING_PROTOCOL') break;
    }

    effects.update(totalDt);
    this.notifyUI();
  }

  stepSimulation(effectiveDt) {
    // Map pulse & visual updates
    this.map.update(effectiveDt);

    // Overcharge timer
    if (this.overchargeTimer > 0) {
      this.overchargeTimer = Math.max(0, this.overchargeTimer - effectiveDt);
    }

    // Skills cooldown tick
    for (const key in this.skillCooldowns) {
      if (this.skillCooldowns[key] > 0) {
        this.skillCooldowns[key] = Math.max(0, this.skillCooldowns[key] - effectiveDt);
      }
    }

    // 1. Spawning / Wave state logic
    if (this.waveState === 'INTERMISSION') {
      this.waveTimer -= effectiveDt;
      if (this.waveTimer <= 0) {
        this.startWave();
      }
    } else if (this.waveState === 'SPAWNING') {
      this.spawnTimer += effectiveDt;
      if (this.spawnTimer >= this.spawnInterval) {
        this.spawnTimer = 0;
        if (this.spawnQueue.length > 0) {
          const spawnData = this.spawnQueue.shift();
          const spawnScaling = { ...(this.scaling || {}) };
          if (spawnScaling.hasBossFrenzy && ENEMY_TYPES[spawnData.type]?.isBoss) {
            spawnScaling.hpMult = (spawnScaling.hpMult || 1.0) * 1.5;
            spawnScaling.speedMult = (spawnScaling.speedMult || 1.0) * 1.2;
          }
          this.enemies.push(new Enemy(spawnData.type, spawnData.path, this.wave, spawnScaling));
        } else {
          this.waveState = 'DEFENDING';
        }
      }
    } else if (this.waveState === 'DEFENDING') {
      if (this.enemies.length === 0) {
        // Wave complete!
        this.onWaveCleared();
      }
    }

    // 2. Update Towers with Protocols
    for (const tower of this.towers) {
      tower.update(effectiveDt, this.enemies, this.projectiles, this.overchargeTimer > 0, this.map?.scale, this.activeProtocols);
    }

    // 3. Update Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(effectiveDt, this.map, this.enemies, this.towers, (type, pathIdx, dist) => {
        const minion = new Enemy(type, pathIdx, this.wave, this.scaling);
        minion.distance = Math.max(0, dist);
        const p = this.map.getPointOnPath(minion.pathIndex, minion.distance);
        minion.x = p.x;
        minion.y = p.y;
        this.enemies.push(minion);
      });

      if (enemy.reachedNexus) {
        // Reached base: damage player based on enemy threat tier
        const dmg = enemy.nexusDamage || enemy.def?.nexusDamage || 1;
        this.baseHp = Math.max(0, this.baseHp - dmg);
        this.isFlawless = false;

        // Dynamic impact effects
        const shakeIntensity = enemy.isBoss ? 18 : (dmg > 1 ? 10 : 6);
        effects.shake(shakeIntensity, enemy.isBoss ? 0.5 : 0.25);
        effects.emitExplosion(enemy.x, enemy.y, '#ff2e63', enemy.isBoss ? 35 : 20, enemy.isBoss ? 65 : 45);

        // Floating damage number
        const nexusPixel = this.map.gridToPixel(this.map.data.nexus.x, this.map.data.nexus.y);
        effects.addText(
          nexusPixel.x,
          nexusPixel.y - 18,
          `-${dmg} HP!`,
          '#ff2e63',
          { isCrit: true, size: enemy.isBoss ? 22 : (dmg > 1 ? 17 : 14) }
        );

        audio.playHit();

        // Protocol: Quantum Barrier (Emergency 6s Full Stun once per game when HP <= 35%)
        if (
          !this.emergencyBarrierUsed &&
          this.baseHp > 0 &&
          this.baseHp <= this.maxBaseHp * 0.35 &&
          this.activeProtocols.some((p) => p.id === 'quantum_barrier')
        ) {
          this.emergencyBarrierUsed = true;
          effects.shake(20, 0.6);
          audio.playSkill('emp');
          effects.addShockwave(this.map.width / 2 + this.map.offsetX, this.map.height / 2 + this.map.offsetY, 800, '#ffd000', 1.0, 10);
          effects.addText(this.map.width / 2 + this.map.offsetX, 90, 'EMERGENCY QUANTUM BARRIER ACTIVATED!', '#ffd000', { isCrit: true, size: 22 });
          for (const e of this.enemies) {
            if (!e.dead) e.applyStun(6.0);
          }
        }

        if (this.baseHp <= 0) {
          this.triggerGameOver();
          return;
        }
      }

      if (enemy.dead) {
        if (!enemy.reachedNexus) {
          const killBonus = state.getTechMultiplier('core_scrapper');
          const hasSalvageProto = this.activeProtocols.some((p) => p.id === 'salvage_protocol');
          const protoKillBonus = hasSalvageProto ? 0.15 : 0;

          const reward = Math.round(enemy.reward * (1 + killBonus + protoKillBonus));
          this.gold += reward;
          this.score += enemy.score || 10;
          state.recordGoldHold(this.gold);
          state.recordKill(enemy.isBoss);

          // Core drop (Normal + Bounty Harvest Protocol)
          let cores = enemy.coreDrop || 0;
          if (enemy.isBoss && this.activeProtocols.some((p) => p.id === 'bounty_harvest')) {
            cores += 8;
          }
          if (cores > 0) {
            state.addCores(cores);
            effects.addText(enemy.x, enemy.y - 20, `+${cores} CORES!`, '#00f0ff', { isCrit: true });
          }

          // Handle Splitter enemy death spawns
          if (enemy.def.splitsInto && enemy.def.splitCount) {
            for (let s = 0; s < enemy.def.splitCount; s++) {
              const mini = new Enemy(enemy.def.splitsInto, enemy.pathIndex, this.wave, this.scaling);
              mini.distance = Math.max(0, enemy.distance - (s * 0.4));
              this.enemies.push(mini);
            }
          }
        }
        this.enemies.splice(i, 1);
      }
    }

    // 4. Update Projectiles
    const newProjectiles = [];
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.update(effectiveDt, this.enemies, newProjectiles);
      if (proj.dead) {
        this.projectiles.splice(i, 1);
      }
    }
    if (newProjectiles.length > 0) {
      this.projectiles.push(...newProjectiles);
    }
  }

  onWaveCleared() {
    // Stage victory check
    if (!this.isEndless && this.wave >= this.maxWaves) {
      this.triggerVictory();
      return;
    }

    // Auto nanites repair (Tech Tree)
    const repairAmount = state.getTechMultiplier('base_nanites');
    if (repairAmount > 0 && this.baseHp < this.maxBaseHp) {
      this.baseHp = Math.min(this.maxBaseHp, this.baseHp + 1);
    }

    // Protocol: Nano Swarm Healer (Repair +2 HP every wave)
    if (this.activeProtocols.some((p) => p.id === 'nano_swarm_healer') && this.baseHp < this.maxBaseHp) {
      this.baseHp = Math.min(this.maxBaseHp, this.baseHp + 2);
    }

    // Wave bonus gold
    const waveBonus = 20 + Math.floor(this.wave * 3.5);
    this.gold += waveBonus;

    // Banking Interest (Tech interest_banking + Protocol compound_interest)
    const techInterestRate = state.getTechMultiplier('interest_banking');
    const hasInterestProtocol = this.activeProtocols.some((p) => p.id === 'compound_interest');
    const protoInterestRate = hasInterestProtocol ? 0.06 : 0;
    const totalInterestRate = techInterestRate + protoInterestRate;

    if (totalInterestRate > 0 && this.gold > 0) {
      const maxInterest = hasInterestProtocol ? 200 : 120;
      const earnedInterest = Math.min(maxInterest, Math.floor(this.gold * totalInterestRate));
      if (earnedInterest > 0) {
        this.gold += earnedInterest;
        effects.addText(this.map.width / 2 + this.map.offsetX, 85, `+${earnedInterest} G (INTEREST)`, '#00ff9d');
      }
    }

    // Core reward per wave milestone
    if (this.wave % 5 === 0) {
      const milestoneCores = Math.round(3 * (this.scaling?.coreMult || 1.0));
      state.addCores(milestoneCores);
    }

    // Endless Mode Milestones (Wave 25, 50, 75, 100...)
    if (this.isEndless && this.wave % 25 === 0) {
      const bonusEndlessCores = Math.round(25 * (this.scaling?.coreMult || 1.0));
      state.addCores(bonusEndlessCores);
      effects.addText(this.map.width / 2 + this.map.offsetX, 110, `MILESTONE: WAVE ${this.wave}! +${bonusEndlessCores} CORES!`, '#ffd000', { isCrit: true, size: 20 });
    }

    audio.playUpgrade();

    // Roguelike Protocol Selection Trigger (Every 5 waves)
    if (this.wave % 5 === 0) {
      this.triggerProtocolSelection();
      return;
    }

    this.waveState = 'INTERMISSION';
    this.waveTimer = state.data.settings.autoNextWave ? 2.0 : 7.0;
  }

  // --- Tactical Protocol Selection System ---
  triggerProtocolSelection() {
    this.waveState = 'SELECTING_PROTOCOL';
    audio.playVictory();

    // Pick 3 random protocols not already acquired
    const acquiredIds = new Set(this.activeProtocols.map((p) => p.id));
    let pool = PROTOCOLS.filter((p) => !acquiredIds.has(p.id));

    if (pool.length < 3) {
      // Fallback: allow common repeat if pool exhausted
      pool = PROTOCOLS.slice();
    }

    // Weighted selection by rarity
    const pickOne = (available) => {
      const r = Math.random();
      let targetRarity = 'COMMON';
      if (r < 0.15) targetRarity = 'EPIC';
      else if (r < 0.50) targetRarity = 'RARE';

      const matched = available.filter((p) => p.rarity === targetRarity);
      if (matched.length > 0) {
        return matched[Math.floor(Math.random() * matched.length)];
      }
      return available[Math.floor(Math.random() * available.length)];
    };

    const offered = [];
    const tempPool = [...pool];
    while (offered.length < 3 && tempPool.length > 0) {
      const picked = pickOne(tempPool);
      offered.push(picked);
      const idx = tempPool.indexOf(picked);
      if (idx !== -1) tempPool.splice(idx, 1);
    }

    if (this.onSelectProtocol) {
      this.onSelectProtocol(offered, this.protocolRerollsLeft);
    }
  }

  rerollProtocols() {
    if (this.protocolRerollsLeft > 0) {
      this.protocolRerollsLeft--;
      audio.playUpgrade();
      this.triggerProtocolSelection();
      return true;
    }
    return false;
  }

  applyProtocol(protocol) {
    this.activeProtocols.push(protocol);
    state.recordProtocolChosen(protocol);

    if (protocol.maxHpBonus) {
      this.maxBaseHp += protocol.maxHpBonus;
      this.baseHp += protocol.maxHpBonus;
    }

    // Recalculate stats for all towers
    for (const t of this.towers) {
      t.recalculateStats();
    }

    effects.addText(
      this.map.width / 2 + this.map.offsetX,
      100,
      `PROTOCOL: ${protocol.name}`,
      protocol.color,
      { isCrit: true, size: 20 }
    );
    audio.playUpgrade();

    this.waveState = 'INTERMISSION';
    this.waveTimer = state.data.settings.autoNextWave ? 2.0 : 7.0;
    this.notifyUI();
  }

  triggerGameOver() {
    this.isGameOver = true;
    audio.playDefeat();
    if (this.isEndless) {
      state.recordEndlessScore(this.currentMapId, this.wave, this.score);
    } else {
      state.recordWave(this.wave);
    }
    if (this.onGameOver) this.onGameOver(this.wave, this.score);
  }

  triggerVictory() {
    this.isVictory = true;
    audio.playVictory();
    const mapData = MAPS.find((m) => m.id === this.currentMapId);
    let rewardCores = mapData?.coreReward || 20;

    // Apply difficulty & mutator core multiplier
    const coreMult = this.scaling?.coreMult || 1.0;
    rewardCores = Math.round(rewardCores * coreMult);
    state.addCores(rewardCores);

    state.recordStageClear(this.currentMapId, this.wave, this.isFlawless, this.difficulty, this.activeModifiers);
    if (this.onVictory) this.onVictory(this.wave, this.isFlawless, rewardCores, this.score);
  }

  // --- Render ---

  render() {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Failsafe: Ensure map is properly sized if somehow zero
    if (this.map && (!this.map.width || !this.map.height)) {
      const w = this.viewportWidth || canvas.clientWidth || 400;
      const h = this.viewportHeight || canvas.clientHeight || 600;
      this.resize(w, h);
    }

    ctx.save();
    // Apply Screen Shake
    const shake = effects.getShakeOffset();
    ctx.translate(shake.x, shake.y);

    // 1. Draw Map & Grid
    let previewCanBuild = false;
    if (this.pointerGrid && this.buildingType) {
      previewCanBuild = this.map.canBuild(this.pointerGrid.col, this.pointerGrid.row) && this.gold >= TOWER_TYPES[this.buildingType].cost;
    }
    this.map.draw(ctx, this.baseHp, this.maxBaseHp, this.buildingType ? this.pointerGrid : null, previewCanBuild);

    // 2. Draw Towers
    for (const tower of this.towers) {
      tower.draw(ctx, tower === this.selectedTower);
    }

    // 3. Draw Building Preview Range Circle
    if (this.buildingType && this.pointerGrid && this.map.isValidGrid(this.pointerGrid.col, this.pointerGrid.row)) {
      const p = this.map.gridToPixel(this.pointerGrid.col, this.pointerGrid.row);
      const def = TOWER_TYPES[this.buildingType];
      const techRange = state.getTechMultiplier('tower_range');
      const scale = this.map ? (this.map.scale || 1) : 1;
      const previewRange = def.range * (1 + techRange) * scale;

      ctx.save();
      ctx.strokeStyle = previewCanBuild ? def.color : '#ff2e63';
      ctx.fillStyle = ctx.strokeStyle;
      ctx.globalAlpha = 0.12;
      ctx.beginPath();
      ctx.arc(p.x, p.y, previewRange, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.restore();
    }

    // 4. Draw Orbital Strike Targeting Reticle
    if (this.activeSkillTargeting === 'orbital' && this.pointerGrid) {
      const p = this.map.gridToPixel(this.pointerGrid.col, this.pointerGrid.row);
      const scale = this.map ? (this.map.scale || 1) : 1;
      const strikeRadius = SKILLS.orbital.radius * scale;

      ctx.save();
      ctx.strokeStyle = '#00f0ff';
      ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, strikeRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(p.x - strikeRadius - 10 * scale, p.y);
      ctx.lineTo(p.x + strikeRadius + 10 * scale, p.y);
      ctx.moveTo(p.x, p.y - strikeRadius - 10 * scale);
      ctx.lineTo(p.x, p.y + strikeRadius + 10 * scale);
      ctx.stroke();
      ctx.restore();
    }

    // 5. Draw Projectiles
    for (const proj of this.projectiles) {
      proj.draw(ctx);
    }

    // 6. Draw Enemies
    for (const enemy of this.enemies) {
      enemy.draw(ctx);
    }

    // 7. Draw Visual Effects (Particles, Numbers, Shockwaves)
    effects.draw(ctx);

    ctx.restore();
  }
}
