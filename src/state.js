// ==========================================
// STATE & PERSISTENCE MANAGER
// ==========================================
import { TECH_TREE, ACHIEVEMENTS, TOWER_MASTERY_LEVELS, TOWER_TYPES } from './constants.js';

const STORAGE_KEY = 'cyber_td_save_v1';

class StateManager {
  constructor() {
    this.data = this.getDefaultData();
    this.listeners = [];
    this.achievementListeners = [];
    this.masteryListeners = [];
    this.load();
  }

  getDefaultData() {
    const defaultMastery = {};
    for (const key of Object.keys(TOWER_TYPES)) {
      defaultMastery[key] = { kills: 0, level: 0 };
    }

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
        base_nanites: 0,
        interest_banking: 0,
        crit_devastation: 0,
        heavy_ordnance: 0,
        protocol_reroll: 0
      },
      towerMastery: defaultMastery,
      selectedDifficulty: 'NORMAL',
      activeModifiers: [],
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
        stagesCleared: [],
        hardClears: 0,
        nightmareClears: 0,
        maxModifiersCleared: 0,
        protocolsChosen: 0,
        epicProtocolsFound: 0,
        maxMasteryLevel: 0,
        allTowersMastery1: false
      },
      unlockedAchievements: [],
      stageRecords: {}, // { stageId: { highestWave: 0, stars: 0, cleared: false, difficulties: { NORMAL: {...}, HARD: {...}, NIGHTMARE: {...} } } }
      endlessRecords: {}, // { stageId: { highestWave: 0, bestScore: 0 } }
      settings: {
        bgmEnabled: true,
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
        const defaults = this.getDefaultData();
        this.data = {
          ...defaults,
          ...parsed,
          techLevels: { ...defaults.techLevels, ...(parsed.techLevels || {}) },
          towerMastery: { ...defaults.towerMastery, ...(parsed.towerMastery || {}) },
          stats: { ...defaults.stats, ...(parsed.stats || {}) },
          settings: { ...defaults.settings, ...(parsed.settings || {}) },
          unlockedAchievements: parsed.unlockedAchievements || [],
          stageRecords: parsed.stageRecords || {},
          endlessRecords: parsed.endlessRecords || {}
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

  onMastery(callback) {
    this.masteryListeners.push(callback);
  }

  // --- Tower Mastery Tracking ---
  recordTowerKill(towerId) {
    if (!this.data.towerMastery) this.data.towerMastery = {};
    if (!this.data.towerMastery[towerId]) {
      this.data.towerMastery[towerId] = { kills: 0, level: 0 };
    }

    const mastery = this.data.towerMastery[towerId];
    mastery.kills++;

    // Check level up
    let newLevel = mastery.level;
    for (let i = TOWER_MASTERY_LEVELS.length - 1; i >= 0; i--) {
      if (mastery.kills >= TOWER_MASTERY_LEVELS[i].killsReq) {
        newLevel = TOWER_MASTERY_LEVELS[i].level;
        break;
      }
    }

    if (newLevel > mastery.level) {
      mastery.level = newLevel;
      const levelInfo = TOWER_MASTERY_LEVELS.find((l) => l.level === newLevel);
      this.masteryListeners.forEach((cb) => cb(towerId, levelInfo));
      this.addCores(newLevel * 5); // Reward cores on mastery level up!
    }

    // Update global mastery stats
    let maxLvl = 0;
    let allLvl1 = true;
    const towerKeys = Object.keys(TOWER_TYPES);
    for (const key of towerKeys) {
      const lvl = this.data.towerMastery[key]?.level || 0;
      if (lvl > maxLvl) maxLvl = lvl;
      if (lvl < 1) allLvl1 = false;
    }
    this.data.stats.maxMasteryLevel = maxLvl;
    this.data.stats.allTowersMastery1 = allLvl1;

    this.checkAchievements();
  }

  getTowerMastery(towerId) {
    const data = this.data.towerMastery?.[towerId] || { kills: 0, level: 0 };
    const currentLevelInfo = TOWER_MASTERY_LEVELS.find((l) => l.level === data.level) || TOWER_MASTERY_LEVELS[0];
    const nextLevelInfo = TOWER_MASTERY_LEVELS.find((l) => l.level === data.level + 1) || null;

    // Cumulative bonuses
    const combinedBonus = { range: 0, damage: 0, fireRate: 0, critChance: 0, costReduction: 0 };
    for (const info of TOWER_MASTERY_LEVELS) {
      if (info.level <= data.level && info.bonus) {
        if (info.bonus.range) combinedBonus.range += info.bonus.range;
        if (info.bonus.damage) combinedBonus.damage += info.bonus.damage;
        if (info.bonus.fireRate) combinedBonus.fireRate += info.bonus.fireRate;
        if (info.bonus.critChance) combinedBonus.critChance += info.bonus.critChance;
        if (info.bonus.costReduction) combinedBonus.costReduction += info.bonus.costReduction;
      }
    }

    return {
      kills: data.kills,
      level: data.level,
      currentLevelInfo,
      nextLevelInfo,
      bonus: combinedBonus
    };
  }

  recordProtocolChosen(protocol) {
    this.data.stats.protocolsChosen = (this.data.stats.protocolsChosen || 0) + 1;
    if (protocol.rarity === 'EPIC') {
      this.data.stats.epicProtocolsFound = (this.data.stats.epicProtocolsFound || 0) + 1;
    }
    this.checkAchievements();
    this.save();
  }

  recordEndlessScore(stageId, wave, score = 0) {
    if (!this.data.endlessRecords) this.data.endlessRecords = {};
    const cur = this.data.endlessRecords[stageId] || { highestWave: 0, bestScore: 0 };
    cur.highestWave = Math.max(cur.highestWave, wave);
    cur.bestScore = Math.max(cur.bestScore, score);
    this.data.endlessRecords[stageId] = cur;

    this.recordWave(wave);
    this.save();
  }

  recordStageClear(stageId, wave, isFlawless, difficulty = 'NORMAL', activeModifiers = []) {
    if (!this.data.stats.stagesCleared.includes(stageId)) {
      this.data.stats.stagesCleared.push(stageId);
    }
    if (isFlawless) {
      this.data.stats.flawlessVictory = true;
    }

    if (difficulty === 'HARD' || difficulty === 'NIGHTMARE') {
      this.data.stats.hardClears = (this.data.stats.hardClears || 0) + 1;
    }
    if (difficulty === 'NIGHTMARE') {
      this.data.stats.nightmareClears = (this.data.stats.nightmareClears || 0) + 1;
    }
    const modCount = activeModifiers ? activeModifiers.length : 0;
    this.data.stats.maxModifiersCleared = Math.max(this.data.stats.maxModifiersCleared || 0, modCount);

    const currentRecord = this.data.stageRecords[stageId] || {
      highestWave: 0,
      stars: 0,
      cleared: false,
      difficulties: {}
    };
    currentRecord.cleared = true;
    currentRecord.highestWave = Math.max(currentRecord.highestWave, wave);

    const starsEarned = isFlawless ? 3 : 2;
    currentRecord.stars = Math.max(currentRecord.stars || 0, starsEarned);

    if (!currentRecord.difficulties) currentRecord.difficulties = {};
    currentRecord.difficulties[difficulty] = {
      cleared: true,
      stars: starsEarned,
      highestWave: wave,
      modifiersCount: modCount
    };

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
