// ==========================================
// USER INTERFACE & MOBILE CONTROLLER
// ==========================================
import { TOWER_TYPES, MAPS, TECH_TREE, ACHIEVEMENTS, SKILLS, SKILLS_GUIDE, COMBAT_GUIDE, ENEMY_TYPES, DIFFICULTIES, MODIFIERS, PROTOCOLS, TOWER_MASTERY_LEVELS } from './constants.js';
import { ICONS, getTowerVisualSvg, getEnemyVisualSvg } from './icons.js';
import { state } from './state.js';
import { audio } from './audio.js';

export class UIManager {
  constructor(gameEngine) {
    this.game = gameEngine;
    this.deferredInstallPrompt = null;
    this.selectedShopType = null;
    this.selectedDifficulty = 'NORMAL';
    this.selectedModifiers = new Set();

    // Cache DOM Elements
    this.dom = {
      // HUD
      baseHp: document.getElementById('hud-hp'),
      baseHpMax: document.getElementById('hud-hp-max'),
      gold: document.getElementById('hud-gold'),
      cores: document.getElementById('hud-cores'),
      wave: document.getElementById('hud-wave'),
      waveMax: document.getElementById('hud-wave-max'),
      waveTimer: document.getElementById('hud-wave-timer'),
      menuBtn: document.getElementById('btn-open-menu'),
      installBtn: document.getElementById('btn-install-pwa'),

      // Floating Controls Overlay (on canvas)
      speedBtn: document.getElementById('btn-speed'),
      pauseBtn: document.getElementById('btn-pause'),
      audioBtn: document.getElementById('btn-audio'),
      guideQuickBtn: document.getElementById('btn-open-guide-quick'),
      protocolsQuickBtn: document.getElementById('btn-open-protocols-quick'),
      hudProtoBadge: document.getElementById('hud-proto-badge'),

      // Boss Encounter Global Health Bar
      bossHudBar: document.getElementById('boss-hud-bar'),
      bossHudName: document.getElementById('boss-hud-name'),
      bossHudStatusTags: document.getElementById('boss-hud-status-tags'),
      bossShieldTrack: document.getElementById('boss-shield-track'),
      bossShieldFill: document.getElementById('boss-shield-fill'),
      bossShieldText: document.getElementById('boss-shield-text'),
      bossHpFill: document.getElementById('boss-hp-fill'),
      bossHpText: document.getElementById('boss-hp-text'),

      // Bottom control area
      towerShop: document.getElementById('tower-shop'),
      towerPreviewCard: document.getElementById('tower-preview-card'),
      towerInspector: document.getElementById('tower-inspector'),
      skillsBar: document.getElementById('skills-bar'),
      waveActionBtn: document.getElementById('btn-start-wave'),
      waveActionText: document.getElementById('start-wave-text'),

      // Tower Preview Elements (Before Buying)
      prevIcon: document.getElementById('prev-icon'),
      prevName: document.getElementById('prev-name'),
      prevRole: document.getElementById('prev-role'),
      prevDesc: document.getElementById('prev-desc'),
      prevStrengths: document.getElementById('prev-strengths'),
      prevWeaknesses: document.getElementById('prev-weaknesses'),
      prevStatDmg: document.getElementById('prev-stat-dmg'),
      prevStatRate: document.getElementById('prev-stat-rate'),
      prevStatRange: document.getElementById('prev-stat-range'),
      prevCostText: document.getElementById('prev-cost-text'),
      btnConfirmBuild: document.getElementById('btn-confirm-build'),
      btnClosePreview: document.getElementById('btn-close-preview'),

      // Inspector Elements (After Placement)
      inspectorTitle: document.getElementById('insp-title'),
      inspectorMasteryTag: document.getElementById('insp-mastery-tag'),
      inspectorStats: document.getElementById('insp-stats'),
      targetModeBtn: document.getElementById('btn-target-mode'),
      upgradeBtn: document.getElementById('btn-upgrade-tower'),
      upgradeCost: document.getElementById('upgrade-cost-text'),
      evolveSection: document.getElementById('evolve-section'),
      evolveBtnA: document.getElementById('btn-evolve-a'),
      evolveBtnB: document.getElementById('btn-evolve-b'),
      sellBtn: document.getElementById('btn-sell-tower'),
      sellRefund: document.getElementById('sell-refund-text'),
      closeInspectorBtn: document.getElementById('btn-close-inspector'),

      // Modals
      modalBackdrop: document.getElementById('modal-backdrop'),
      mainMenuModal: document.getElementById('modal-main-menu'),
      settingsModal: document.getElementById('modal-settings'),
      guideModal: document.getElementById('modal-guide'),
      techModal: document.getElementById('modal-tech'),
      techList: document.getElementById('tech-list'),
      techCoresDisplay: document.getElementById('tech-cores-display'),
      achieveModal: document.getElementById('modal-achieve'),
      achieveList: document.getElementById('achieve-list'),

      // Stage Selection & Difficulty
      stageModal: document.getElementById('modal-stage'),
      stageList: document.getElementById('stage-list'),
      difficultySelector: document.getElementById('difficulty-selector'),
      mutatorsGrid: document.getElementById('mutators-grid'),
      mutatorsBadge: document.getElementById('mutators-badge'),
      stageCoreMult: document.getElementById('stage-core-mult'),
      stageScoreMult: document.getElementById('stage-score-mult'),

      // Protocol Selection & Active Drawer
      protocolModal: document.getElementById('modal-protocol'),
      protocolCardsContainer: document.getElementById('protocol-cards-container'),
      btnProtocolReroll: document.getElementById('btn-protocol-reroll'),
      protocolRerollCount: document.getElementById('protocol-reroll-count'),
      activeProtocolsModal: document.getElementById('modal-active-protocols'),
      activeProtocolsList: document.getElementById('active-protocols-list'),

      // Mastery & Records Modals
      masteryModal: document.getElementById('modal-mastery'),
      masteryList: document.getElementById('mastery-list'),
      recordsModal: document.getElementById('modal-records'),
      recordsContent: document.getElementById('records-content'),
      menuBtnMastery: document.getElementById('menu-btn-mastery'),
      menuBtnRecords: document.getElementById('menu-btn-records'),

      // Result Modal
      resultModal: document.getElementById('modal-result'),
      resultTitle: document.getElementById('result-title'),
      resultDesc: document.getElementById('result-desc'),
      resultStats: document.getElementById('result-stats'),
      resultRetryBtn: document.getElementById('btn-result-retry'),
      resultGuideBtn: document.getElementById('btn-result-guide'),
      resultSelectBtn: document.getElementById('btn-result-select'),
      resultTechBtn: document.getElementById('btn-result-tech'),

      // Settings Controls
      settingBgmToggle: document.getElementById('setting-bgm-toggle'),
      settingBgmSlider: document.getElementById('setting-bgm-slider'),
      settingBgmVal: document.getElementById('setting-bgm-val'),
      settingSfxSlider: document.getElementById('setting-sfx-slider'),
      settingSfxVal: document.getElementById('setting-sfx-val'),
      settingShakeToggle: document.getElementById('setting-shake-toggle'),
      settingDmgToggle: document.getElementById('setting-dmg-toggle'),
      settingAutoToggle: document.getElementById('setting-auto-toggle'),
      btnBackFromSettings: document.getElementById('btn-back-from-settings'),

      // Toast
      toastNotification: document.getElementById('toast-notification')
    };

    // Link game engine callbacks
    this.game.onSelectProtocol = (protocols, rerollsLeft) => {
      this.showProtocolModal(protocols, rerollsLeft);
    };

    state.onMastery((towerId, levelInfo) => {
      const tower = TOWER_TYPES[towerId];
      this.showToast(`${tower?.name || towerId} が熟練度【Lv.${levelInfo.level} ${levelInfo.title}】に到達！ (${levelInfo.bonusDesc})`, 'TOWER MASTERY UPGRADE');
    });

    this.initPWA();
    this.renderTowerShop();
    this.renderSkills();
    this.bindEvents();
    this.bindState();
  }

  initPWA() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredInstallPrompt = e;
      if (this.dom.installBtn) {
        this.dom.installBtn.classList.remove('hidden');
      }
    });

    window.addEventListener('appinstalled', () => {
      this.deferredInstallPrompt = null;
      if (this.dom.installBtn) {
        this.dom.installBtn.classList.add('hidden');
      }
      this.showToast('インストール完了！ホーム画面からいつでもプレイできます');
    });
  }

  showToast(message, title = 'ACHIEVEMENT UNLOCKED') {
    if (!this.dom.toastNotification) return;
    this.dom.toastNotification.innerHTML = `
      <div class="toast-title">${title}</div>
      <div class="toast-body">${message}</div>
    `;
    this.dom.toastNotification.classList.add('show');
    audio.playUpgrade();
    setTimeout(() => {
      this.dom.toastNotification.classList.remove('show');
    }, 3800);
  }

  bindState() {
    state.onChange((data) => {
      if (this.dom.cores) this.dom.cores.innerText = data.quantumCores;
      if (this.dom.techCoresDisplay) this.dom.techCoresDisplay.innerText = data.quantumCores;
    });

    state.onAchievement((ach) => {
      this.showToast(`${ach.title}: ${ach.desc} (+${ach.reward} CORES)`, 'ACHIEVEMENT UNLOCKED');
    });
  }

  renderTowerShop() {
    if (!this.dom.towerShop) return;
    this.dom.towerShop.innerHTML = '';

    for (const key in TOWER_TYPES) {
      const tower = TOWER_TYPES[key];
      const card = document.createElement('button');
      card.className = 'tower-card';
      card.dataset.type = tower.id;
      card.innerHTML = `
        <div class="tower-icon">
          ${getTowerVisualSvg(tower.id, tower.color, 32)}
        </div>
        <div class="tower-name">${tower.name}</div>
        <div class="tower-role-mini">${tower.role.split('・')[0]}</div>
        <div class="tower-cost">${ICONS.gold} ${tower.cost}</div>
      `;
      card.addEventListener('click', (e) => {
        e.stopPropagation();
        audio.ensureContext();
        this.selectTowerForPurchase(tower.id);
      });
      this.dom.towerShop.appendChild(card);
    }
  }

  getTowerSymbol(typeId) {
    const def = TOWER_TYPES[typeId];
    return getTowerVisualSvg(typeId, def?.color || '#00f0ff', 24);
  }

  selectTowerForPurchase(typeId) {
    if (this.selectedShopType === typeId && this.game.buildingType === typeId) {
      // Toggle off
      this.closeTowerPreview();
      return;
    }

    this.selectedShopType = typeId;
    this.game.setBuildingType(typeId);
    this.showTowerPreview(typeId);
  }

  showTowerPreview(typeId) {
    const def = TOWER_TYPES[typeId];
    if (!def) return;

    if (this.dom.prevIcon) {
      this.dom.prevIcon.innerHTML = getTowerVisualSvg(def.id, def.color, 44);
    }
    if (this.dom.prevName) this.dom.prevName.innerText = def.name;
    if (this.dom.prevRole) {
      this.dom.prevRole.innerText = def.role;
      this.dom.prevRole.style.borderColor = def.color;
      this.dom.prevRole.style.color = def.color;
    }
    if (this.dom.prevDesc) this.dom.prevDesc.innerText = def.desc;
    if (this.dom.prevStrengths) this.dom.prevStrengths.innerText = def.strengths || '万能';
    if (this.dom.prevWeaknesses) this.dom.prevWeaknesses.innerText = def.weaknesses || '特になし';

    if (this.dom.prevStatDmg) this.dom.prevStatDmg.innerText = def.damage || '-';
    if (this.dom.prevStatRate) this.dom.prevStatRate.innerText = def.fireRate ? `${def.fireRate}/s` : '-';
    if (this.dom.prevStatRange) this.dom.prevStatRange.innerText = def.range ? `${(def.range / 40).toFixed(1)}マス` : '-';
    if (this.dom.prevCostText) this.dom.prevCostText.innerHTML = `${ICONS.gold} ${def.cost}`;

    this.dom.towerPreviewCard?.classList.remove('hidden');
    this.dom.towerInspector?.classList.add('hidden');
  }

  closeTowerPreview() {
    this.selectedShopType = null;
    this.game.setBuildingType(null);
    this.dom.towerPreviewCard?.classList.add('hidden');
  }

  renderSkills() {
    if (!this.dom.skillsBar) return;
    this.dom.skillsBar.innerHTML = '';

    for (const key in SKILLS) {
      const skill = SKILLS[key];
      const btn = document.createElement('button');
      btn.className = 'skill-btn';
      btn.id = `skill-${skill.id}`;
      btn.innerHTML = `
        <span class="skill-icon">${ICONS[skill.icon] || ICONS.zap}</span>
        <span class="skill-name">${skill.name}</span>
        <div class="skill-overlay" id="skill-overlay-${skill.id}"></div>
        <span class="skill-cd-text" id="skill-cd-${skill.id}"></span>
      `;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        audio.ensureContext();
        this.closeTowerPreview();
        this.game.activateSkill(skill.id);
      });
      this.dom.skillsBar.appendChild(btn);
    }
  }

  bindEvents() {
    // 1. Floating Controls (Speed, Pause, Guide)
    const SPEEDS = [1.0, 2.0, 3.0, 5.0, 8.0];
    this.dom.speedBtn?.addEventListener('click', () => {
      audio.ensureContext();
      const currentIndex = SPEEDS.indexOf(this.game.gameSpeed);
      const nextIndex = (currentIndex + 1) % SPEEDS.length;
      this.game.gameSpeed = SPEEDS[nextIndex];
      this.dom.speedBtn.innerText = `${this.game.gameSpeed}x`;

      this.dom.speedBtn.classList.remove('hyper', 'ultra');
      if (this.game.gameSpeed === 5.0) {
        this.dom.speedBtn.classList.add('hyper');
      } else if (this.game.gameSpeed === 8.0) {
        this.dom.speedBtn.classList.add('ultra');
      }
    });

    this.dom.pauseBtn?.addEventListener('click', () => {
      audio.ensureContext();
      this.game.isPaused = !this.game.isPaused;
      this.dom.pauseBtn.innerHTML = this.game.isPaused ? ICONS.play : ICONS.pause;
    });

    this.dom.guideQuickBtn?.addEventListener('click', () => {
      this.openGuideModal();
    });

    // 2. Main Menu Button in Header
    this.dom.menuBtn?.addEventListener('click', () => {
      this.openMainMenuModal();
    });

    this.dom.installBtn?.addEventListener('click', async () => {
      if (this.deferredInstallPrompt) {
        this.deferredInstallPrompt.prompt();
        const { outcome } = await this.deferredInstallPrompt.userChoice;
        if (outcome === 'accepted') {
          this.dom.installBtn.classList.add('hidden');
        }
        this.deferredInstallPrompt = null;
      } else {
        alert('ブラウザメニューの「ホーム画面に追加」または「インストール」からアプリ化できます。');
      }
    });

    // 3. Wave start button
    this.dom.waveActionBtn?.addEventListener('click', () => {
      audio.ensureContext();
      this.game.startNextWaveImmediately();
    });

    // 4. Tower Preview Card Buttons
    this.dom.btnClosePreview?.addEventListener('click', () => {
      this.closeTowerPreview();
    });

    // 5. Main Menu Hub Buttons
    document.getElementById('menu-btn-stages')?.addEventListener('click', () => {
      this.openStageModal();
    });
    document.getElementById('menu-btn-tech')?.addEventListener('click', () => {
      this.openTechModal();
    });
    document.getElementById('menu-btn-guide')?.addEventListener('click', () => {
      this.openGuideModal();
    });
    document.getElementById('menu-btn-achieve')?.addEventListener('click', () => {
      this.openAchieveModal();
    });
    document.getElementById('menu-btn-settings')?.addEventListener('click', () => {
      this.openSettingsModal();
    });
    document.getElementById('menu-btn-resume')?.addEventListener('click', () => {
      this.closeModals();
    });
    document.getElementById('menu-btn-restart')?.addEventListener('click', () => {
      this.closeModals();
      this.game.loadStage(this.game.currentMapId, this.game.isEndless);
    });

    // Settings Modal Events
    this.dom.btnBackFromSettings?.addEventListener('click', () => {
      this.openMainMenuModal();
    });

    this.dom.settingBgmToggle?.addEventListener('change', (e) => {
      audio.setBgmEnabled(e.target.checked);
    });

    this.dom.settingBgmSlider?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value) / 100;
      audio.setBgmVolume(val);
      if (this.dom.settingBgmVal) {
        this.dom.settingBgmVal.innerText = `${e.target.value}%`;
      }
    });

    this.dom.settingSfxSlider?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value) / 100;
      audio.setSfxVolume(val);
      if (this.dom.settingSfxVal) {
        this.dom.settingSfxVal.innerText = `${e.target.value}%`;
      }
    });

    this.dom.settingSfxSlider?.addEventListener('change', () => {
      audio.ensureContext();
      audio.playHit();
    });

    this.dom.settingShakeToggle?.addEventListener('change', (e) => {
      state.data.settings.screenShake = e.target.checked;
      state.save();
    });

    this.dom.settingDmgToggle?.addEventListener('change', (e) => {
      state.data.settings.damageNumbers = e.target.checked;
      state.save();
    });

    this.dom.settingAutoToggle?.addEventListener('change', (e) => {
      state.data.settings.autoWave = e.target.checked;
      state.save();
    });

    this.syncSettingsUI();

    // 6. Modal Close Buttons
    document.querySelectorAll('.btn-close-modal').forEach((btn) => {
      btn.addEventListener('click', () => this.closeModals());
    });
    this.dom.modalBackdrop?.addEventListener('click', (e) => {
      if (e.target === this.dom.modalBackdrop) this.closeModals();
    });

    // 7. Guide Modal Tabs
    document.querySelectorAll('.guide-tab-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.guide-tab-btn').forEach((b) => b.classList.remove('active'));
        document.querySelectorAll('.guide-tab-content').forEach((c) => c.classList.add('hidden'));
        btn.classList.add('active');
        const targetId = btn.dataset.tab;
        document.getElementById(targetId)?.classList.remove('hidden');
      });
    });

    // 8. Inspector Actions
    this.dom.targetModeBtn?.addEventListener('click', () => {
      if (this.game.selectedTower) {
        this.game.selectedTower.cycleTargetMode();
        this.updateInspector(this.game.selectedTower);
      }
    });

    this.dom.upgradeBtn?.addEventListener('click', () => {
      this.game.upgradeSelectedTower();
    });

    this.dom.evolveBtnA?.addEventListener('click', () => {
      this.game.evolveSelectedTower('pathA');
    });

    this.dom.evolveBtnB?.addEventListener('click', () => {
      this.game.evolveSelectedTower('pathB');
    });

    this.dom.sellBtn?.addEventListener('click', () => {
      this.game.sellSelectedTower();
    });

    this.dom.closeInspectorBtn?.addEventListener('click', () => {
      this.game.selectTower(null);
    });

    // 8.5 Endgame & Mastery Navigation
    this.dom.menuBtnMastery?.addEventListener('click', () => {
      this.openMasteryModal();
    });

    this.dom.menuBtnRecords?.addEventListener('click', () => {
      this.openRecordsModal();
    });

    this.dom.protocolsQuickBtn?.addEventListener('click', () => {
      this.openActiveProtocolsModal();
    });

    this.dom.btnProtocolReroll?.addEventListener('click', () => {
      this.game.rerollProtocols();
    });

    // 9. Result Modal Buttons
    this.dom.resultRetryBtn?.addEventListener('click', () => {
      this.closeModals();
      this.game.loadStage(this.game.currentMapId, this.game.isEndless, this.selectedDifficulty, Array.from(this.selectedModifiers));
    });
    this.dom.resultGuideBtn?.addEventListener('click', () => {
      this.openGuideModal();
    });
    this.dom.resultSelectBtn?.addEventListener('click', () => {
      this.closeModals();
      this.openStageModal();
    });
    this.dom.resultTechBtn?.addEventListener('click', () => {
      this.closeModals();
      this.openTechModal();
    });

    // 10. Game Engine Callbacks
    this.game.onStateChange = (gameState) => this.onGameStateUpdate(gameState);
    this.game.onGameOver = (wave, score) => this.showGameOverModal(wave, score);
    this.game.onVictory = (wave, isFlawless, coreReward, score) => this.showVictoryModal(wave, isFlawless, coreReward, score);
  }

  onGameStateUpdate(gameState) {
    const { gold, baseHp, maxBaseHp, wave, maxWaves, waveState, waveTimer, selectedTower, buildingType, skillCooldowns, skillsConfig, isEndless } = gameState;

    // HUD Update
    if (this.dom.gold) this.dom.gold.innerText = gold;
    if (this.dom.baseHp) this.dom.baseHp.innerText = baseHp;
    if (this.dom.baseHpMax) this.dom.baseHpMax.innerText = maxBaseHp;
    if (this.dom.wave) this.dom.wave.innerText = wave;
    if (this.dom.waveMax) this.dom.waveMax.innerText = isEndless ? '∞' : maxWaves;

    // Update Protocol Badge in Floating controls
    if (this.dom.hudProtoBadge) {
      const pCount = this.game.activeProtocols?.length || 0;
      this.dom.hudProtoBadge.innerText = pCount;
      if (pCount > 0) {
        this.dom.hudProtoBadge.classList.add('active');
      } else {
        this.dom.hudProtoBadge.classList.remove('active');
      }
    }

    // Wave Action Button
    if (waveState === 'INTERMISSION') {
      this.dom.waveActionBtn?.classList.remove('busy');
      if (this.dom.waveActionText) {
        this.dom.waveActionText.innerText = `NEXT WAVE IN ${waveTimer}s (TAP TO RUSH)`;
      }
    } else {
      this.dom.waveActionBtn?.classList.add('busy');
      if (this.dom.waveActionText) {
        this.dom.waveActionText.innerText = waveState === 'SPAWNING' ? 'HOSTILES INCOMING...' : 'DEFENDING CORE...';
      }
    }

    // Tower Shop highlights & affordability
    document.querySelectorAll('.tower-card').forEach((card) => {
      const typeId = card.dataset.type;
      const def = TOWER_TYPES[typeId];
      if (buildingType === typeId) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
      if (def && gold < def.cost) {
        card.classList.add('disabled');
      } else {
        card.classList.remove('disabled');
      }
    });

    // Skill Cooldown Overlays
    for (const key in skillCooldowns) {
      const cd = skillCooldowns[key];
      const maxCd = skillsConfig[key].cooldown;
      const overlay = document.getElementById(`skill-overlay-${key}`);
      const cdText = document.getElementById(`skill-cd-${key}`);
      const btn = document.getElementById(`skill-${key}`);

      if (cd > 0) {
        btn?.classList.add('cooldown');
        if (overlay) overlay.style.height = `${(cd / maxCd) * 100}%`;
        if (cdText) cdText.innerText = `${Math.ceil(cd)}s`;
      } else {
        btn?.classList.remove('cooldown');
        if (overlay) overlay.style.height = '0%';
        if (cdText) cdText.innerText = '';
      }
    }

    // If a tower was built or deselected, close preview
    if (!buildingType) {
      this.dom.towerPreviewCard?.classList.add('hidden');
    }

    // Inspector Bottom Sheet (placed tower selected)
    if (selectedTower) {
      this.dom.towerInspector?.classList.remove('hidden');
      this.dom.towerShop?.classList.add('hidden');
      this.dom.towerPreviewCard?.classList.add('hidden');
      this.updateInspector(selectedTower);
    } else {
      this.dom.towerInspector?.classList.add('hidden');
      this.dom.towerShop?.classList.remove('hidden');
    }

    // Boss Encounter Global Health Bar Update
    const activeBoss = this.game.enemies?.find((e) => e.isBoss && !e.dead);
    if (activeBoss && this.dom.bossHudBar) {
      this.dom.bossHudBar.classList.remove('hidden');
      if (this.dom.bossHudName) {
        this.dom.bossHudName.innerText = activeBoss.def?.name || 'BOSS ENCOUNTER';
      }

      // HP Bar
      const hpRatio = Math.max(0, Math.min(1, activeBoss.hp / activeBoss.maxHp));
      if (this.dom.bossHpFill) {
        this.dom.bossHpFill.style.width = `${(hpRatio * 100).toFixed(1)}%`;
      }
      if (this.dom.bossHpText) {
        this.dom.bossHpText.innerText = `${Math.ceil(activeBoss.hp).toLocaleString()} / ${activeBoss.maxHp.toLocaleString()} (${(hpRatio * 100).toFixed(0)}%)`;
      }

      // Shield Bar
      if (activeBoss.maxShield && activeBoss.maxShield > 0) {
        this.dom.bossShieldTrack?.classList.remove('hidden');
        const sRatio = Math.max(0, Math.min(1, activeBoss.shield / activeBoss.maxShield));
        if (this.dom.bossShieldFill) {
          this.dom.bossShieldFill.style.width = `${(sRatio * 100).toFixed(1)}%`;
        }
        if (this.dom.bossShieldText) {
          this.dom.bossShieldText.innerText = `SHIELD: ${Math.ceil(activeBoss.shield).toLocaleString()} / ${activeBoss.maxShield.toLocaleString()} (${(sRatio * 100).toFixed(0)}%)`;
        }
      } else {
        this.dom.bossShieldTrack?.classList.add('hidden');
      }

      // Status tags
      if (this.dom.bossHudStatusTags) {
        const tags = [];
        if (activeBoss.freezeTimer > 0) tags.push('<span class="boss-tag tag-freeze">FROZEN</span>');
        else if (activeBoss.slowTimer > 0) tags.push(`<span class="boss-tag tag-slow">SLOW -${Math.round(activeBoss.slowFactor * 100)}%</span>`);
        if (activeBoss.stunTimer > 0) tags.push('<span class="boss-tag tag-stun">STUNNED</span>');
        if (activeBoss.armorShred > 0) tags.push(`<span class="boss-tag tag-shred">SHRED -${Math.round(activeBoss.armorShred * 100)}%</span>`);
        if (activeBoss.burnTimer > 0) tags.push('<span class="boss-tag tag-burn">BURNING</span>');
        this.dom.bossHudStatusTags.innerHTML = tags.join('');
      }
    } else if (this.dom.bossHudBar) {
      this.dom.bossHudBar.classList.add('hidden');
    }
  }

  updateInspector(tower) {
    if (!tower) return;

    if (this.dom.inspectorTitle) {
      this.dom.inspectorTitle.innerText = `${tower.getName()} [${tower.targetMode}]`;
    }

    if (this.dom.inspectorMasteryTag) {
      const mastery = state.getTowerMastery(tower.typeId);
      const lvlInfo = TOWER_MASTERY_LEVELS[mastery.level] || TOWER_MASTERY_LEVELS[0];
      this.dom.inspectorMasteryTag.innerText = `Mastery Lv.${mastery.level} [${lvlInfo.title}]`;
      this.dom.inspectorMasteryTag.title = `撃破数: ${mastery.kills} | ${lvlInfo.bonusDesc}`;
      if (mastery.level >= 5) {
        this.dom.inspectorMasteryTag.classList.add('master-max');
      } else {
        this.dom.inspectorMasteryTag.classList.remove('master-max');
      }
    }

    if (this.dom.inspectorStats) {
      const dmg = Math.round(tower.effectiveDamage);
      const rate = tower.effectiveFireRate.toFixed(1);
      const cellW = this.game.map?.cellWidth || 40;
      const rngTiles = (tower.effectiveRange / cellW).toFixed(1);
      const role = tower.def.role;
      this.dom.inspectorStats.innerHTML = `
        <div class="stat-pill role">${role}</div>
        <div class="stat-pill">${ICONS.damage} 威力: <span>${dmg}</span></div>
        <div class="stat-pill">${ICONS.rate} 速度: <span>${rate}/s</span></div>
        <div class="stat-pill">${ICONS.range} 射程: <span>${rngTiles}マス</span></div>
      `;
    }

    if (this.dom.targetModeBtn) {
      this.dom.targetModeBtn.innerText = `標的: ${tower.targetMode}`;
    }

    // Upgrades or Branching Evolution
    const upgradeCost = tower.getUpgradeCost();
    if (tower.level < 3 && upgradeCost) {
      this.dom.upgradeBtn?.classList.remove('hidden');
      this.dom.evolveSection?.classList.add('hidden');
      if (this.dom.upgradeCost) this.dom.upgradeCost.innerHTML = `${ICONS.gold} ${upgradeCost}`;
      if (this.game.gold < upgradeCost) {
        this.dom.upgradeBtn?.classList.add('disabled');
      } else {
        this.dom.upgradeBtn?.classList.remove('disabled');
      }
    } else if (tower.level === 3 && !tower.evolvedPath) {
      // Show Branching Options
      this.dom.upgradeBtn?.classList.add('hidden');
      this.dom.evolveSection?.classList.remove('hidden');

      const pathA = tower.def.paths.pathA;
      const pathB = tower.def.paths.pathB;

      if (this.dom.evolveBtnA) {
        this.dom.evolveBtnA.innerHTML = `
          <strong>${pathA.name}</strong>
          <small>${pathA.desc}</small>
          <span class="cost">${ICONS.gold} ${pathA.cost}</span>
        `;
        if (this.game.gold < pathA.cost) this.dom.evolveBtnA.classList.add('disabled');
        else this.dom.evolveBtnA.classList.remove('disabled');
      }

      if (this.dom.evolveBtnB) {
        this.dom.evolveBtnB.innerHTML = `
          <strong>${pathB.name}</strong>
          <small>${pathB.desc}</small>
          <span class="cost">${ICONS.gold} ${pathB.cost}</span>
        `;
        if (this.game.gold < pathB.cost) this.dom.evolveBtnB.classList.add('disabled');
        else this.dom.evolveBtnB.classList.remove('disabled');
      }
    } else {
      // Max Level
      this.dom.upgradeBtn?.classList.add('hidden');
      this.dom.evolveSection?.classList.add('hidden');
    }

    // Sell Refund
    const refund = Math.floor(tower.totalInvested * 0.7);
    if (this.dom.sellRefund) {
      this.dom.sellRefund.innerHTML = `${ICONS.gold} +${refund}`;
    }
  }

  // --- Modals ---

  closeModals() {
    this.dom.modalBackdrop?.classList.add('hidden');
    this.dom.mainMenuModal?.classList.add('hidden');
    this.dom.settingsModal?.classList.add('hidden');
    this.dom.guideModal?.classList.add('hidden');
    this.dom.techModal?.classList.add('hidden');
    this.dom.achieveModal?.classList.add('hidden');
    this.dom.stageModal?.classList.add('hidden');
    this.dom.protocolModal?.classList.add('hidden');
    this.dom.activeProtocolsModal?.classList.add('hidden');
    this.dom.masteryModal?.classList.add('hidden');
    this.dom.recordsModal?.classList.add('hidden');
    this.dom.resultModal?.classList.add('hidden');
  }

  openMainMenuModal() {
    audio.ensureContext();
    this.dom.modalBackdrop?.classList.remove('hidden');
    this.dom.mainMenuModal?.classList.remove('hidden');
    this.dom.settingsModal?.classList.add('hidden');
    this.dom.guideModal?.classList.add('hidden');
    this.dom.techModal?.classList.add('hidden');
    this.dom.stageModal?.classList.add('hidden');
    this.dom.achieveModal?.classList.add('hidden');
  }

  openSettingsModal() {
    audio.ensureContext();
    this.dom.modalBackdrop?.classList.remove('hidden');
    this.dom.mainMenuModal?.classList.add('hidden');
    this.dom.settingsModal?.classList.remove('hidden');
    this.dom.guideModal?.classList.add('hidden');
    this.dom.techModal?.classList.add('hidden');
    this.dom.stageModal?.classList.add('hidden');
    this.dom.achieveModal?.classList.add('hidden');
    this.syncSettingsUI();
  }

  syncSettingsUI() {
    const s = state.data.settings;
    if (!s) return;
    if (this.dom.settingBgmToggle) {
      this.dom.settingBgmToggle.checked = s.bgmEnabled !== false;
    }
    if (this.dom.settingBgmSlider) {
      const bgmPct = Math.round((s.bgmVolume ?? 0.4) * 100);
      this.dom.settingBgmSlider.value = bgmPct;
      if (this.dom.settingBgmVal) this.dom.settingBgmVal.innerText = `${bgmPct}%`;
    }
    if (this.dom.settingSfxSlider) {
      const sfxPct = Math.round((s.sfxVolume ?? 0.6) * 100);
      this.dom.settingSfxSlider.value = sfxPct;
      if (this.dom.settingSfxVal) this.dom.settingSfxVal.innerText = `${sfxPct}%`;
    }
    if (this.dom.settingShakeToggle) {
      this.dom.settingShakeToggle.checked = !!s.screenShake;
    }
    if (this.dom.settingDmgToggle) {
      this.dom.settingDmgToggle.checked = !!s.damageNumbers;
    }
    if (this.dom.settingAutoToggle) {
      this.dom.settingAutoToggle.checked = !!s.autoWave;
    }
  }

  openGuideModal() {
    audio.ensureContext();
    this.dom.modalBackdrop?.classList.remove('hidden');
    this.dom.mainMenuModal?.classList.add('hidden');
    this.dom.settingsModal?.classList.add('hidden');
    this.dom.guideModal?.classList.remove('hidden');
    this.renderTacticalGuide();
  }

  renderTacticalGuide() {
    // 1. Tab 1: Combat system & Shield breaking
    const combatContainer = document.querySelector('#tab-combat .guide-cards-list');
    if (combatContainer) {
      combatContainer.innerHTML = '';
      for (const guide of COMBAT_GUIDE) {
        const card = document.createElement('div');
        card.className = 'guide-card';
        card.style.borderColor = guide.color;
        card.innerHTML = `
          <div class="guide-card-title" style="color: ${guide.color};">${guide.category}</div>
          <div class="guide-card-desc">${guide.desc}</div>
          <ul class="guide-tips-list">
            ${guide.tips.map((t) => `<li>${t}</li>`).join('')}
          </ul>
        `;
        combatContainer.appendChild(card);
      }
    }

    // 2. Tab 2: Commander Skills Guide
    const skillsContainer = document.querySelector('#tab-skills .guide-skills-list');
    if (skillsContainer) {
      skillsContainer.innerHTML = '';
      for (const skill of SKILLS_GUIDE) {
        const card = document.createElement('div');
        card.className = 'guide-skill-card';
        card.style.borderColor = skill.color;
        card.innerHTML = `
          <div class="guide-skill-header">
            <div class="guide-unit-preview" style="border-color: ${skill.color}; color: ${skill.color};">
              ${ICONS[skill.icon] || ICONS.zap}
            </div>
            <div class="guide-skill-title-box">
              <strong style="color: ${skill.color}; font-size: 15px;">${skill.name}</strong>
              <div class="guide-skill-badges">
                <span class="badge" style="background: rgba(0, 240, 255, 0.15); border-color: ${skill.color}; color: ${skill.color};">${skill.targetType}</span>
                <span class="badge" style="background: rgba(255, 208, 0, 0.15); color: #ffd000;">リロード: ${skill.cooldown}秒</span>
              </div>
            </div>
          </div>
          <div class="guide-skill-effect" style="border-left-color: ${skill.color};">
            <strong>主要効果:</strong> ${skill.effect}
          </div>
          <div class="guide-skill-desc">${skill.desc}</div>
          <div class="guide-skill-usage">
            <div class="guide-usage-label">発動手順・操作方法:</div>
            <div class="guide-usage-text">${skill.usage.replace(/\n/g, '<br>')}</div>
          </div>
          <div class="guide-skill-tactics">
            <div class="guide-tactics-label">戦術活用アドバイス:</div>
            <ul class="guide-tips-list">
              ${skill.tips.map((t) => `<li>${t}</li>`).join('')}
            </ul>
          </div>
        `;
        skillsContainer.appendChild(card);
      }
    }

    // 3. Tab 3: Towers and Evolution list (With Map-accurate Turret Blueprints)
    const towersContainer = document.querySelector('#tab-towers .guide-towers-list');
    if (towersContainer) {
      towersContainer.innerHTML = '';
      for (const key in TOWER_TYPES) {
        const tower = TOWER_TYPES[key];
        const card = document.createElement('div');
        card.className = 'guide-tower-card';
        card.style.borderColor = tower.color;
        card.innerHTML = `
          <div class="guide-tower-header">
            <div class="guide-unit-preview" style="border-color: ${tower.color};">
              ${getTowerVisualSvg(tower.id, tower.color, 38)}
            </div>
            <div class="guide-tower-title-box">
              <div style="display: flex; align-items: center; gap: 6px;">
                <strong style="color: ${tower.color}; font-size: 15px;">${tower.name}</strong>
                <span class="guide-real-tag">実機外観</span>
              </div>
              <span class="guide-role-tag">${tower.role}</span>
            </div>
            <span class="guide-tower-cost">${ICONS.gold} ${tower.cost}</span>
          </div>
          <div class="guide-tower-desc">${tower.desc}</div>
          <div class="guide-tower-matchups">
            <div class="match-item pro"><strong>得意:</strong> ${tower.strengths}</div>
            <div class="match-item con"><strong>苦手:</strong> ${tower.weaknesses}</div>
          </div>
          <div class="guide-evolve-box">
            <div class="evolve-header">特化分岐 (Lv.3 → Lv.4)</div>
            <div class="evolve-dual">
              <div class="evolve-mini">
                <strong>Path A: ${tower.paths.pathA.name}</strong>
                <p>${tower.paths.pathA.desc}</p>
              </div>
              <div class="evolve-mini">
                <strong>Path B: ${tower.paths.pathB.name}</strong>
                <p>${tower.paths.pathB.desc}</p>
              </div>
            </div>
          </div>
        `;
        towersContainer.appendChild(card);
      }
    }

    // 4. Tab 4: Enemy compendium (With Map-accurate Geometry Blueprints & Shield Rings)
    const enemiesContainer = document.querySelector('#tab-enemies .guide-enemies-list');
    if (enemiesContainer) {
      enemiesContainer.innerHTML = '';
      for (const key in ENEMY_TYPES) {
        const enemy = ENEMY_TYPES[key];
        const card = document.createElement('div');
        card.className = `guide-enemy-card ${enemy.isBoss ? 'boss-card' : ''}`;
        card.innerHTML = `
          <div class="guide-enemy-header">
            <div class="guide-unit-preview" style="border-color: ${enemy.color};">
              ${getEnemyVisualSvg(enemy, 38)}
            </div>
            <div class="guide-enemy-name-box">
              <div style="display: flex; align-items: center; gap: 6px;">
                <strong style="color: ${enemy.color}; font-size: 14px;">${enemy.name}</strong>
                <span class="guide-real-tag">実機ポリゴン</span>
              </div>
              <div class="guide-enemy-badges">
                ${enemy.shield ? `<span class="badge shield">SHIELD: ${enemy.shield}</span>` : ''}
                ${enemy.armor ? `<span class="badge armor">ARMOR: -${Math.round(enemy.armor * 100)}%</span>` : ''}
                ${enemy.isStealth ? `<span class="badge stealth">STEALTH</span>` : ''}
                ${enemy.splitsInto ? `<span class="badge split">SPLIT</span>` : ''}
                ${enemy.healRate ? `<span class="badge heal">REPAIR</span>` : ''}
                ${enemy.attacksTowers ? `<span class="badge alert">TOWER HACK</span>` : ''}
                ${enemy.suicideOnTowers ? `<span class="badge alert">KAMIKAZE</span>` : ''}
                ${enemy.canWarp ? `<span class="badge warp">WARP</span>` : ''}
                ${enemy.reflectEnergy ? `<span class="badge reflect">REFLECT</span>` : ''}
                ${enemy.shieldAura ? `<span class="badge aura">AURA</span>` : ''}
              </div>
            </div>
            <div class="guide-enemy-stats">
              <div>HP: <strong>${enemy.hp}</strong></div>
              <div>速度: <strong>${enemy.speed}</strong></div>
              <div>拠点被害: <strong style="color: #ff2e63;">-${enemy.nexusDamage || 1} HP</strong></div>
            </div>
          </div>
          <div class="guide-enemy-counter">
            <strong>対策方針:</strong>
            ${enemy.attacksTowers ? 'タワーを遠距離からEMPハッキングし機能停止させる。スナイパーで射程外から即刻排除せよ！' : ''}
            ${enemy.suicideOnTowers ? 'タワーに特攻して大爆発を起こす。クライオの凍結で足を止め、バルカンで空中撃墜せよ！' : ''}
            ${enemy.canWarp ? '空間跳躍で前進する。レーザーの継続照射や迫撃砲の広域爆破でワープ先を焼き払え！' : ''}
            ${enemy.reflectEnergy ? 'エネルギー兵器を40%反射！迫撃砲やスナイパーの実体爆破・徹甲弾で粉砕せよ！' : ''}
            ${enemy.shieldAura ? '周囲の敵にシールドを常時給電する。EMPサージで一網打尽にせよ！' : ''}
            ${!enemy.attacksTowers && !enemy.suicideOnTowers && !enemy.canWarp && !enemy.reflectEnergy && !enemy.shieldAura && enemy.shield ? 'テスラコイルやEMPサージでシールドを一瞬で破砕せよ。' : ''}
            ${!enemy.attacksTowers && !enemy.suicideOnTowers && !enemy.canWarp && !enemy.reflectEnergy && !enemy.shieldAura && enemy.armor ? '迫撃砲の爆発やレーザー熱線で装甲を突破せよ。' : ''}
            ${!enemy.attacksTowers && !enemy.suicideOnTowers && !enemy.canWarp && !enemy.reflectEnergy && !enemy.shieldAura && enemy.isStealth ? 'テスラの連鎖電撃や迫撃砲の爆風で炙り出せ。' : ''}
            ${!enemy.attacksTowers && !enemy.suicideOnTowers && !enemy.canWarp && !enemy.reflectEnergy && !enemy.shieldAura && enemy.splitsInto ? '分裂直後にバルカンの連射や迫撃砲で一掃せよ。' : ''}
            ${!enemy.attacksTowers && !enemy.suicideOnTowers && !enemy.canWarp && !enemy.reflectEnergy && !enemy.shieldAura && enemy.healRate ? 'スナイパーの標的を【LAST】にして背後から最優先狙撃！' : ''}
            ${!enemy.attacksTowers && !enemy.suicideOnTowers && !enemy.canWarp && !enemy.reflectEnergy && !enemy.shieldAura && !enemy.shield && !enemy.armor && !enemy.isStealth && !enemy.splitsInto && !enemy.healRate ? 'パルス砲やバルカンの集中砲火で早期撃破。' : ''}
          </div>
        `;
        enemiesContainer.appendChild(card);
      }
    }
  }

  openTechModal() {
    audio.ensureContext();
    this.dom.modalBackdrop?.classList.remove('hidden');
    this.dom.mainMenuModal?.classList.add('hidden');
    this.dom.settingsModal?.classList.add('hidden');
    this.dom.techModal?.classList.remove('hidden');
    if (this.dom.techCoresDisplay) {
      this.dom.techCoresDisplay.innerText = state.data.quantumCores;
    }
    this.renderTechTree();
  }

  renderTechTree() {
    if (!this.dom.techList) return;
    this.dom.techList.innerHTML = '';

    for (const tech of TECH_TREE) {
      const lvl = state.getTechLevel(tech.id);
      const isMax = lvl >= tech.maxLevel;
      const cost = isMax ? null : tech.costPerLevel(lvl);
      const canAfford = !isMax && state.data.quantumCores >= cost;

      const item = document.createElement('div');
      item.className = 'tech-item';
      item.innerHTML = `
        <div class="tech-icon">${ICONS[tech.icon] || ICONS.wrench}</div>
        <div class="tech-info">
          <div class="tech-title">${tech.name} <span class="tech-level">Lv.${lvl}/${tech.maxLevel}</span></div>
          <div class="tech-desc">${tech.desc}</div>
          <div class="tech-current">効果: <strong>${tech.format(lvl * tech.effectPerLevel)}</strong></div>
        </div>
        <div class="tech-action">
          ${isMax ? '<span class="max-badge">MAX</span>' : `
            <button class="btn-tech-buy ${canAfford ? '' : 'disabled'}" data-tech="${tech.id}">
              ${ICONS.core} ${cost}
            </button>
          `}
        </div>
      `;

      item.querySelector('.btn-tech-buy')?.addEventListener('click', () => {
        if (state.upgradeTech(tech.id)) {
          audio.playUpgrade();
          this.renderTechTree();
        }
      });

      this.dom.techList.appendChild(item);
    }
  }

  openAchieveModal() {
    audio.ensureContext();
    this.dom.modalBackdrop?.classList.remove('hidden');
    this.dom.mainMenuModal?.classList.add('hidden');
    this.dom.settingsModal?.classList.add('hidden');
    this.dom.achieveModal?.classList.remove('hidden');
    this.renderAchievements();
  }

  renderAchievements() {
    if (!this.dom.achieveList) return;
    this.dom.achieveList.innerHTML = '';

    for (const ach of ACHIEVEMENTS) {
      const isUnlocked = state.data.unlockedAchievements.includes(ach.id);
      const item = document.createElement('div');
      item.className = `achieve-item ${isUnlocked ? 'unlocked' : 'locked'}`;
      item.innerHTML = `
        <div class="achieve-status">${isUnlocked ? ICONS.check : ICONS.lock}</div>
        <div class="achieve-details">
          <div class="achieve-title">${ach.title}</div>
          <div class="achieve-desc">${ach.desc}</div>
        </div>
        <div class="achieve-reward">
          ${ICONS.core} +${ach.reward}
        </div>
      `;
      this.dom.achieveList.appendChild(item);
    }
  }

  openStageModal() {
    audio.ensureContext();
    this.dom.modalBackdrop?.classList.remove('hidden');
    this.dom.mainMenuModal?.classList.add('hidden');
    this.dom.settingsModal?.classList.add('hidden');
    this.dom.stageModal?.classList.remove('hidden');
    this.renderStageDifficultyAndMutators();
    this.renderStages();
  }

  renderStageDifficultyAndMutators() {
    // 1. Difficulty Buttons
    const diffBtns = this.dom.difficultySelector?.querySelectorAll('.btn-diff');
    diffBtns?.forEach((btn) => {
      const diffKey = btn.dataset.diff;
      if (diffKey === this.selectedDifficulty) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
      btn.onclick = () => {
        audio.ensureContext();
        audio.playHit();
        this.selectedDifficulty = diffKey;
        this.renderStageDifficultyAndMutators();
      };
    });

    // 2. Mutators Grid
    if (this.dom.mutatorsGrid) {
      this.dom.mutatorsGrid.innerHTML = '';
      for (const mod of MODIFIERS) {
        const isSelected = this.selectedModifiers.has(mod.id);
        const card = document.createElement('div');
        card.className = `mutator-card ${isSelected ? 'active' : ''}`;
        const corePercent = Math.round((mod.coreBonus ?? mod.coreMultBonus ?? 0) * 100);
        const scorePercent = Math.round((mod.scoreBonus ?? mod.scoreMultBonus ?? 0) * 100);
        card.innerHTML = `
          <div class="mutator-head">
            <span class="mutator-icon">${ICONS[mod.icon] || ICONS.danger}</span>
            <strong class="mutator-name">${mod.name}</strong>
            <span class="mutator-check">${isSelected ? 'ON' : 'OFF'}</span>
          </div>
          <div class="mutator-desc">${mod.desc}</div>
          <div class="mutator-bonus">
            <span class="badge bonus">+${corePercent}% コア</span>
            <span class="badge bonus">+${scorePercent}% スコア</span>
          </div>
        `;

        card.onclick = () => {
          audio.ensureContext();
          audio.playHit();
          if (this.selectedModifiers.has(mod.id)) {
            this.selectedModifiers.delete(mod.id);
          } else {
            this.selectedModifiers.add(mod.id);
          }
          this.renderStageDifficultyAndMutators();
        };

        this.dom.mutatorsGrid.appendChild(card);
      }
    }

    // 3. Multiplier Summary Calculation
    const baseCoreMult = DIFFICULTIES[this.selectedDifficulty]?.coreMult || 1.0;
    const baseScoreMult = DIFFICULTIES[this.selectedDifficulty]?.scoreMult || 1.0;

    let bonusCoreMult = 0;
    let bonusScoreMult = 0;
    this.selectedModifiers.forEach((mId) => {
      const mod = MODIFIERS.find((m) => m.id === mId);
      if (mod) {
        bonusCoreMult += (mod.coreBonus ?? mod.coreMultBonus ?? 0);
        bonusScoreMult += (mod.scoreBonus ?? mod.scoreMultBonus ?? 0);
      }
    });

    const totalCoreMult = (baseCoreMult + bonusCoreMult).toFixed(2);
    const totalScoreMult = (baseScoreMult + bonusScoreMult).toFixed(2);

    if (this.dom.stageCoreMult) this.dom.stageCoreMult.innerText = `${totalCoreMult}x`;
    if (this.dom.stageScoreMult) this.dom.stageScoreMult.innerText = `${totalScoreMult}x`;
    if (this.dom.mutatorsBadge) {
      this.dom.mutatorsBadge.innerText = `${this.selectedModifiers.size} / ${MODIFIERS.length} 適用中`;
    }
  }

  renderStages() {
    if (!this.dom.stageList) return;
    this.dom.stageList.innerHTML = '';

    for (const map of MAPS) {
      const record = state.data.stageRecords[map.id] || { highestWave: 0, stars: 0, cleared: false };
      const card = document.createElement('div');
      card.className = `stage-card ${record.cleared ? 'cleared' : ''}`;

      // Star display
      const starsCount = record.stars || 0;
      const starsHtml = '★'.repeat(starsCount) + '☆'.repeat(Math.max(0, 3 - starsCount));

      // Highest difficulty clear tag
      const diffTag = record.highestDifficulty ? `<span class="stage-diff-badge diff-${record.highestDifficulty.toLowerCase()}">${record.highestDifficulty}</span>` : '';

      card.innerHTML = `
        <div class="stage-header">
          <div class="stage-title-wrap">
            <span class="stage-id-pill">STAGE ${map.id}</span>
            <span class="stage-name">${map.name}</span>
          </div>
          <div class="stage-ratings">
            <span class="stage-stars">${starsHtml}</span>
            ${diffTag}
          </div>
        </div>
        <div class="stage-desc">${map.desc}</div>
        <div class="stage-footer">
          <div class="stage-meta-info">
            <span class="stage-waves">WAVES: ${map.wavesCount}</span>
            <span class="stage-reward">初クリア: ${ICONS.core} ${map.coreReward}</span>
          </div>
          <div class="stage-btns">
            <button class="btn-play-stage" data-map="${map.id}">
              <svg class="icon" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              CAMPAIGN
            </button>
            <button class="btn-play-endless" data-map="${map.id}">
              <svg class="icon icon-zap" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              ENDLESS (∞)
            </button>
          </div>
        </div>
      `;

      card.querySelector('.btn-play-stage')?.addEventListener('click', () => {
        this.closeModals();
        this.game.loadStage(map.id, false, this.selectedDifficulty, Array.from(this.selectedModifiers));
      });

      card.querySelector('.btn-play-endless')?.addEventListener('click', () => {
        this.closeModals();
        this.game.loadStage(map.id, true, this.selectedDifficulty, Array.from(this.selectedModifiers));
      });

      this.dom.stageList.appendChild(card);
    }
  }

  // --- Tactical Roguelike Protocols ---

  showProtocolModal(protocols, rerollsLeft = 0) {
    audio.ensureContext();
    audio.playVictory(); // Celebratory sound for unlocking draft

    this.dom.modalBackdrop?.classList.remove('hidden');
    this.dom.protocolModal?.classList.remove('hidden');

    if (this.dom.protocolRerollCount) {
      this.dom.protocolRerollCount.innerText = `残り: ${rerollsLeft}回`;
    }
    if (this.dom.btnProtocolReroll) {
      if (rerollsLeft <= 0) {
        this.dom.btnProtocolReroll.classList.add('disabled');
      } else {
        this.dom.btnProtocolReroll.classList.remove('disabled');
      }
    }

    if (!this.dom.protocolCardsContainer) return;
    this.dom.protocolCardsContainer.innerHTML = '';

    protocols.forEach((proto) => {
      const card = document.createElement('div');
      card.className = `protocol-card rarity-${proto.rarity.toLowerCase()}`;
      card.innerHTML = `
        <div class="protocol-card-glow"></div>
        <div class="protocol-header">
          <span class="protocol-rarity-badge ${proto.rarity.toLowerCase()}">${proto.rarity}</span>
          <span class="protocol-icon">${ICONS[proto.icon] || ICONS.zap}</span>
        </div>
        <div class="protocol-title">${proto.name}</div>
        <div class="protocol-desc">${proto.desc}</div>
        <div class="protocol-flavor">${proto.flavor || 'NEXUS TACTICAL OVERRIDE'}</div>
        <button class="btn-select-protocol">戦術投入 (ACTIVATE)</button>
      `;

      card.onclick = () => {
        audio.ensureContext();
        audio.playUpgrade();
        this.game.applyProtocol(proto);
        this.closeModals();
        this.showToast(`戦術プロトコル【${proto.name}】が起動しました！`, 'TACTICAL PROTOCOL ACTIVATED');
      };

      this.dom.protocolCardsContainer.appendChild(card);
    });
  }

  openActiveProtocolsModal() {
    audio.ensureContext();
    this.dom.modalBackdrop?.classList.remove('hidden');
    this.dom.activeProtocolsModal?.classList.remove('hidden');

    if (!this.dom.activeProtocolsList) return;
    this.dom.activeProtocolsList.innerHTML = '';

    const activeList = this.game.activeProtocols || [];
    if (activeList.length === 0) {
      this.dom.activeProtocolsList.innerHTML = `
        <div class="protocols-empty-msg">
          <svg class="icon icon-zap" viewBox="0 0 24 24" style="width: 48px; height: 48px; color: var(--color-neon-blue); opacity: 0.5; margin-bottom: 12px;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          <p>現在発動中の戦術プロトコルはありません。</p>
          <small>ウェーブ 5 / 10 / 15 / 20... クリア時に戦術プロトコルが起動します。</small>
        </div>
      `;
      return;
    }

    activeList.forEach((proto) => {
      const card = document.createElement('div');
      card.className = `active-proto-item rarity-${proto.rarity.toLowerCase()}`;
      card.innerHTML = `
        <div class="proto-mini-header">
          <span class="protocol-rarity-badge ${proto.rarity.toLowerCase()}">${proto.rarity}</span>
          <strong class="proto-name">${proto.name}</strong>
        </div>
        <div class="proto-desc">${proto.desc}</div>
      `;
      this.dom.activeProtocolsList.appendChild(card);
    });
  }

  // --- Tower Mastery Modal ---

  openMasteryModal() {
    audio.ensureContext();
    this.dom.modalBackdrop?.classList.remove('hidden');
    this.dom.mainMenuModal?.classList.add('hidden');
    this.dom.settingsModal?.classList.add('hidden');
    this.dom.masteryModal?.classList.remove('hidden');
    this.renderMastery();
  }

  renderMastery() {
    if (!this.dom.masteryList) return;
    this.dom.masteryList.innerHTML = '';

    for (const key in TOWER_TYPES) {
      const tower = TOWER_TYPES[key];
      const mData = state.getTowerMastery(tower.id);
      const lvl = mData.level || 0;
      const kills = mData.kills || 0;
      const currentLvlInfo = TOWER_MASTERY_LEVELS[lvl] || TOWER_MASTERY_LEVELS[0];
      const nextLvlInfo = TOWER_MASTERY_LEVELS[lvl + 1];

      let progressPct = 100;
      let reqKillsText = 'MAX';
      if (nextLvlInfo) {
        const prevReq = currentLvlInfo.reqKills || 0;
        const nextReq = nextLvlInfo.reqKills;
        const currentProgress = Math.max(0, kills - prevReq);
        const needed = nextReq - prevReq;
        progressPct = Math.min(100, Math.max(0, (currentProgress / needed) * 100));
        reqKillsText = `${kills} / ${nextReq} KILLS`;
      }

      const card = document.createElement('div');
      card.className = `mastery-card-item ${lvl >= 5 ? 'master-max' : ''}`;
      card.innerHTML = `
        <div class="mastery-card-head">
          <div class="mastery-icon-box" style="border-color: ${tower.color};">
            ${getTowerVisualSvg(tower.id, tower.color, 36)}
          </div>
          <div class="mastery-title-box">
            <div class="mastery-tower-name">${tower.name}</div>
            <div class="mastery-rank-badge">Lv.${lvl} ${currentLvlInfo.title}</div>
          </div>
          <div class="mastery-kills-display">${kills.toLocaleString()} 撃破</div>
        </div>

        <div class="mastery-progress-track">
          <div class="mastery-progress-fill" style="width: ${progressPct.toFixed(1)}%;"></div>
        </div>
        <div class="mastery-progress-label">
          <span>次のレベルまで</span>
          <strong>${reqKillsText}</strong>
        </div>

        <div class="mastery-perks-box">
          <div class="perks-label">適用中のマスタリーボーナス:</div>
          <div class="perks-desc">${currentLvlInfo.bonusDesc}</div>
          ${nextLvlInfo ? `<div class="perks-next">次: Lv.${nextLvlInfo.level} ${nextLvlInfo.title} (${nextLvlInfo.bonusDesc})</div>` : '<div class="perks-next max">★ MASTER SPECIALIZATION COMPLETED (-10% コスト割引解禁)</div>'}
        </div>
      `;

      this.dom.masteryList.appendChild(card);
    }
  }

  // --- Commander Dossier / Records Modal ---

  openRecordsModal() {
    audio.ensureContext();
    this.dom.modalBackdrop?.classList.remove('hidden');
    this.dom.mainMenuModal?.classList.add('hidden');
    this.dom.settingsModal?.classList.add('hidden');
    this.dom.recordsModal?.classList.remove('hidden');
    this.renderRecords();
  }

  renderRecords() {
    if (!this.dom.recordsContent) return;

    // Calculate aggregate statistics
    let totalKills = 0;
    for (const tId in state.data.towerMastery) {
      totalKills += state.data.towerMastery[tId].kills || 0;
    }

    let clearedStagesCount = 0;
    let flawlessCount = 0;
    for (const sId in state.data.stageRecords) {
      const rec = state.data.stageRecords[sId];
      if (rec.cleared) clearedStagesCount++;
      if (rec.stars >= 3) flawlessCount++;
    }

    const achieveCount = state.data.unlockedAchievements?.length || 0;
    const endlessRecords = state.data.endlessRecords || {};

    let highestEndlessWave = 0;
    let highestEndlessScore = 0;
    for (const sId in endlessRecords) {
      if (endlessRecords[sId].highestWave > highestEndlessWave) {
        highestEndlessWave = endlessRecords[sId].highestWave;
      }
      if (endlessRecords[sId].score > highestEndlessScore) {
        highestEndlessScore = endlessRecords[sId].score;
      }
    }

    this.dom.recordsContent.innerHTML = `
      <div class="dossier-stats-grid">
        <div class="dossier-stat-card">
          <div class="dossier-stat-num highlight">${totalKills.toLocaleString()}</div>
          <div class="dossier-stat-lbl">敵性体 累計殲滅数</div>
        </div>
        <div class="dossier-stat-card">
          <div class="dossier-stat-num">${clearedStagesCount} / 8</div>
          <div class="dossier-stat-lbl">制圧済み作戦区域</div>
        </div>
        <div class="dossier-stat-card">
          <div class="dossier-stat-num gold">${flawlessCount}</div>
          <div class="dossier-stat-lbl">パーフェクト防衛 (★3)</div>
        </div>
        <div class="dossier-stat-card">
          <div class="dossier-stat-num cyan">${achieveCount} / ${ACHIEVEMENTS.length}</div>
          <div class="dossier-stat-lbl">解禁済み軍事実績</div>
        </div>
        <div class="dossier-stat-card">
          <div class="dossier-stat-num purple">Wave ${highestEndlessWave}</div>
          <div class="dossier-stat-lbl">エンドレス最高到達</div>
        </div>
        <div class="dossier-stat-card">
          <div class="dossier-stat-num green">${highestEndlessScore.toLocaleString()}</div>
          <div class="dossier-stat-lbl">エンドレス最高スコア</div>
        </div>
      </div>

      <div class="dossier-section-title">作戦区域別 防衛記録マトリクス</div>
      <div class="dossier-stages-table-wrap">
        <table class="dossier-table">
          <thead>
            <tr>
              <th>ステージ</th>
              <th>クリア状況</th>
              <th>防衛評価</th>
              <th>最高難易度</th>
              <th>エンドレス到達</th>
            </tr>
          </thead>
          <tbody>
            ${MAPS.map((map) => {
              const rec = state.data.stageRecords[map.id] || { cleared: false, stars: 0 };
              const eRec = endlessRecords[map.id] || { highestWave: 0, score: 0 };
              const stars = '★'.repeat(rec.stars || 0) + '☆'.repeat(Math.max(0, 3 - (rec.stars || 0)));
              return `
                <tr>
                  <td><strong>${map.name}</strong></td>
                  <td>${rec.cleared ? '<span class="status-cleared">制圧済</span>' : '<span class="status-unclear">未制圧</span>'}</td>
                  <td class="stars-cell">${stars}</td>
                  <td>${rec.highestDifficulty ? `<span class="badge diff-${rec.highestDifficulty.toLowerCase()}">${rec.highestDifficulty}</span>` : '-'}</td>
                  <td>${eRec.highestWave > 0 ? `Wave ${eRec.highestWave} (${eRec.score.toLocaleString()}pt)` : '-'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // --- Result Modals ---

  showGameOverModal(wave, score = 0) {
    this.dom.modalBackdrop?.classList.remove('hidden');
    this.dom.resultModal?.classList.remove('hidden');
    if (this.dom.resultTitle) {
      this.dom.resultTitle.innerText = 'MISSION FAILED';
      this.dom.resultTitle.className = 'result-title defeat';
    }
    if (this.dom.resultDesc) {
      this.dom.resultDesc.innerText = '防衛ラインが突破されました。敵の弱点に応じた兵科配置や、量子研究所での永続強化、戦術プロトコルを見直して再挑戦せよ。';
    }
    if (this.dom.resultStats) {
      this.dom.resultStats.innerHTML = `
        <div class="res-stat">作戦難易度: <strong>${this.selectedDifficulty}</strong></div>
        <div class="res-stat">到達ウェーブ: <strong>${wave}</strong></div>
        <div class="res-stat">獲得スコア: <strong>${(score || 0).toLocaleString()} pt</strong></div>
        <div class="res-stat">所持コア: <strong>${ICONS.core} ${state.data.quantumCores}</strong></div>
      `;
    }
  }

  showVictoryModal(wave, isFlawless, coreReward = 0, score = 0) {
    this.dom.modalBackdrop?.classList.remove('hidden');
    this.dom.resultModal?.classList.remove('hidden');
    if (this.dom.resultTitle) {
      this.dom.resultTitle.innerText = isFlawless ? 'PERFECT VICTORY (FLAWLESS ★★★)' : 'MISSION ACCOMPLISHED';
      this.dom.resultTitle.className = 'result-title victory';
    }
    if (this.dom.resultDesc) {
      this.dom.resultDesc.innerText = isFlawless
        ? '拠点HPの無傷防衛を達成！追加のクォンタムコアと最高評価を獲得しました。'
        : 'すべての敵性勢力を殲滅し作戦区域を制圧しました！新たなクォンタムコアを獲得しました。';
    }
    if (this.dom.resultStats) {
      this.dom.resultStats.innerHTML = `
        <div class="res-stat">作戦難易度: <strong>${this.selectedDifficulty}</strong></div>
        <div class="res-stat">クリアウェーブ: <strong>${wave}</strong></div>
        <div class="res-stat">獲得コア: <strong>${ICONS.core} +${coreReward}</strong></div>
        <div class="res-stat">最終スコア: <strong>${(score || 0).toLocaleString()} pt</strong></div>
        <div class="res-stat">防衛評価: <strong>${isFlawless ? 'FLAWLESS (完全防衛)' : 'CLEAR'}</strong></div>
      `;
    }
  }
}

