// ==========================================
// STATE & PERSISTENCE MANAGER
// ==========================================
import { TECH_TREE, ACHIEVEMENTS } from './constants.js';

const STORAGE_KEY = 'cyber_td_save_v1';

class StateManager {
  constructor() {
    this.data = this.getDefaultData();
    this.listeners = [];
    this.achievementListeners = [];
    this.load();
  }

  getDefaultData() {
    return {
      quantumCores: 20, // Initial free cores to try first upgrade
      techLevels: {
        starting_gold: 0,
        tower_damage: 0,
        fire_rate: 0,
        tower_range: 0,
        crit_matrix: 0,
        skill_cooldown: 0,
        core_scrapper: 0,
        base_nanites: 0
      },
      stats: {
        totalKills: 0,
        bossesDefeated: 0,
        highestWave: 0,
        skillsUsed: 0,
        towersBuiltCount: 0,
        evolvedTowers: 0,
        maxGoldHold: 0,
        totalTechBought: 0,
        flawlessVictory: false,
        stagesCleared: []
      },
      unlockedAchievements: [],
      stageRecords: {}, // { stageId: { highestWave: 0, stars: 0, cleared: false } }
      settings: {
        bgmVolume: 0.4,
        sfxVolume: 0.6,
        screenShake: true,
        autoNextWave: false,
        damageNumbers: true
      }
    };
  }

  load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.data = {
          ...this.getDefaultData(),
          ...parsed,
          techLevels: { ...this.getDefaultData().techLevels, ...(parsed.techLevels || {}) },
          stats: { ...this.getDefaultData().stats, ...(parsed.stats || {}) },
          settings: { ...this.getDefaultData().settings, ...(parsed.settings || {}) },
          unlockedAchievements: parsed.unlockedAchievements || [],
          stageRecords: parsed.stageRecords || {}
        };
      }
    } catch (e) {
      console.warn('Failed to load save data:', e);
    }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      this.notify();
    } catch (e) {
      console.warn('Failed to save data:', e);
    }
  }

  reset() {
    this.data = this.getDefaultData();
    this.save();
  }

  onChange(callback) {
    this.listeners.push(callback);
  }

  onAchievement(callback) {
    this.achievementListeners.push(callback);
  }

  notify() {
    this.listeners.forEach((cb) => cb(this.data));
  }

  // Cores
  addCores(amount) {
    this.data.quantumCores = Math.max(0, this.data.quantumCores + amount);
    this.save();
  }

  spendCores(amount) {
    if (this.data.quantumCores >= amount) {
      this.data.quantumCores -= amount;
      this.save();
      return true;
    }
    return false;
  }

  // Tech Tree
  getTechLevel(techId) {
    return this.data.techLevels[techId] || 0;
  }

  getTechMultiplier(techId) {
    const tech = TECH_TREE.find((t) => t.id === techId);
    if (!tech) return 0;
    const level = this.getTechLevel(techId);
    return level * tech.effectPerLevel;
  }

  upgradeTech(techId) {
    const tech = TECH_TREE.find((t) => t.id === techId);
    if (!tech) return false;
    const currentLevel = this.getTechLevel(techId);
    if (currentLevel >= tech.maxLevel) return false;

    const cost = tech.costPerLevel(currentLevel);
    if (this.spendCores(cost)) {
      this.data.techLevels[techId] = currentLevel + 1;
      this.data.stats.totalTechBought = (this.data.stats.totalTechBought || 0) + 1;
      this.checkAchievements();
      this.save();
      return true;
    }
    return false;
  }

  // Stats & Progress tracking
  recordKill(isBoss = false) {
    this.data.stats.totalKills++;
    if (isBoss) {
      this.data.stats.bossesDefeated++;
    }
    this.checkAchievements();
  }

  recordWave(wave) {
    if (wave > this.data.stats.highestWave) {
      this.data.stats.highestWave = wave;
      this.checkAchievements();
      this.save();
    }
  }

  recordSkillUse() {
    this.data.stats.skillsUsed++;
    this.checkAchievements();
    this.save();
  }

  recordTowerBuilt() {
    this.data.stats.towersBuiltCount++;
    this.checkAchievements();
  }

  recordTowerEvolved() {
    this.data.stats.evolvedTowers++;
    this.checkAchievements();
  }

  recordGoldHold(gold) {
    if (gold > (this.data.stats.maxGoldHold || 0)) {
      this.data.stats.maxGoldHold = gold;
      this.checkAchievements();
    }
  }

  recordStageClear(stageId, wave, isFlawless) {
    if (!this.data.stats.stagesCleared.includes(stageId)) {
      this.data.stats.stagesCleared.push(stageId);
    }
    if (isFlawless) {
      this.data.stats.flawlessVictory = true;
    }
    const currentRecord = this.data.stageRecords[stageId] || { highestWave: 0, stars: 0, cleared: false };
    currentRecord.cleared = true;
    currentRecord.highestWave = Math.max(currentRecord.highestWave, wave);
    currentRecord.stars = isFlawless ? 3 : 2;
    this.data.stageRecords[stageId] = currentRecord;

    this.checkAchievements();
    this.save();
  }

  // Achievement Check
  checkAchievements() {
    let newlyUnlocked = [];
    for (const ach of ACHIEVEMENTS) {
      if (!this.data.unlockedAchievements.includes(ach.id)) {
        if (ach.check(this.data.stats)) {
          this.data.unlockedAchievements.push(ach.id);
          this.addCores(ach.reward);
          newlyUnlocked.push(ach);
        }
      }
    }

    if (newlyUnlocked.length > 0) {
      this.save();
      newlyUnlocked.forEach((ach) => {
        this.achievementListeners.forEach((cb) => cb(ach));
      });
    }
  }
}

export const state = new StateManager();
