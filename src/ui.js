// ==========================================
// USER INTERFACE & MOBILE CONTROLLER
// ==========================================
import { TOWER_TYPES, MAPS, TECH_TREE, ACHIEVEMENTS, SKILLS, SKILLS_GUIDE, COMBAT_GUIDE, ENEMY_TYPES } from './constants.js';
import { ICONS, getTowerVisualSvg, getEnemyVisualSvg } from './icons.js';
import { state } from './state.js';
import { audio } from './audio.js';

export class UIManager {
  constructor(gameEngine) {
    this.game = gameEngine;
    this.deferredInstallPrompt = null;
    this.selectedShopType = null;

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
      guideModal: document.getElementById('modal-guide'),
      techModal: document.getElementById('modal-tech'),
      techList: document.getElementById('tech-list'),
      techCoresDisplay: document.getElementById('tech-cores-display'),
      achieveModal: document.getElementById('modal-achieve'),
      achieveList: document.getElementById('achieve-list'),
      stageModal: document.getElementById('modal-stage'),
      stageList: document.getElementById('stage-list'),
      resultModal: document.getElementById('modal-result'),
      resultTitle: document.getElementById('result-title'),
      resultDesc: document.getElementById('result-desc'),
      resultStats: document.getElementById('result-stats'),
      resultRetryBtn: document.getElementById('btn-result-retry'),
      resultGuideBtn: document.getElementById('btn-result-guide'),
      resultSelectBtn: document.getElementById('btn-result-select'),
      resultTechBtn: document.getElementById('btn-result-tech'),

      // Toast
      toastNotification: document.getElementById('toast-notification')
    };

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
    // 1. Floating Controls (Speed, Pause, Audio, Guide)
    this.dom.speedBtn?.addEventListener('click', () => {
      audio.ensureContext();
      if (this.game.gameSpeed === 1.0) this.game.gameSpeed = 2.0;
      else if (this.game.gameSpeed === 2.0) this.game.gameSpeed = 3.0;
      else this.game.gameSpeed = 1.0;
      this.dom.speedBtn.innerText = `${this.game.gameSpeed}x`;
    });

    this.dom.pauseBtn?.addEventListener('click', () => {
      audio.ensureContext();
      this.game.isPaused = !this.game.isPaused;
      this.dom.pauseBtn.innerHTML = this.game.isPaused ? ICONS.play : ICONS.pause;
    });

    this.dom.audioBtn?.addEventListener('click', () => {
      audio.ensureContext();
      const isPlaying = audio.toggleBgm();
      this.dom.audioBtn.innerHTML = isPlaying ? ICONS.audio : ICONS.audioMute;
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
    document.getElementById('menu-btn-resume')?.addEventListener('click', () => {
      this.closeModals();
    });
    document.getElementById('menu-btn-restart')?.addEventListener('click', () => {
      this.closeModals();
      this.game.loadStage(this.game.currentMapId, this.game.isEndless);
    });

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

    // 9. Result Modal Buttons
    this.dom.resultRetryBtn?.addEventListener('click', () => {
      this.closeModals();
      this.game.loadStage(this.game.currentMapId, this.game.isEndless);
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
    this.game.onGameOver = (wave) => this.showGameOverModal(wave);
    this.game.onVictory = (wave, isFlawless, coreReward) => this.showVictoryModal(wave, isFlawless, coreReward);
  }

  onGameStateUpdate(gameState) {
    const { gold, baseHp, maxBaseHp, wave, maxWaves, waveState, waveTimer, selectedTower, buildingType, skillCooldowns, skillsConfig, isEndless } = gameState;

    // HUD Update
    if (this.dom.gold) this.dom.gold.innerText = gold;
    if (this.dom.baseHp) this.dom.baseHp.innerText = baseHp;
    if (this.dom.baseHpMax) this.dom.baseHpMax.innerText = maxBaseHp;
    if (this.dom.wave) this.dom.wave.innerText = wave;
    if (this.dom.waveMax) this.dom.waveMax.innerText = isEndless ? '∞' : maxWaves;

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
    this.dom.guideModal?.classList.add('hidden');
    this.dom.techModal?.classList.add('hidden');
    this.dom.achieveModal?.classList.add('hidden');
    this.dom.stageModal?.classList.add('hidden');
    this.dom.resultModal?.classList.add('hidden');
  }

  openMainMenuModal() {
    audio.ensureContext();
    this.dom.modalBackdrop?.classList.remove('hidden');
    this.dom.mainMenuModal?.classList.remove('hidden');
    this.dom.guideModal?.classList.add('hidden');
    this.dom.techModal?.classList.add('hidden');
    this.dom.stageModal?.classList.add('hidden');
    this.dom.achieveModal?.classList.add('hidden');
  }

  openGuideModal() {
    audio.ensureContext();
    this.dom.modalBackdrop?.classList.remove('hidden');
    this.dom.mainMenuModal?.classList.add('hidden');
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
            ${enemy.shield ? 'テスラコイルやEMPサージでシールドを一瞬で破砕せよ。' : ''}
            ${enemy.armor ? '迫撃砲の爆発やレーザー熱線で装甲を突破せよ。' : ''}
            ${enemy.isStealth ? 'テスラの連鎖電撃や迫撃砲の爆風で炙り出せ。' : ''}
            ${enemy.splitsInto ? '分裂直後にバルカンの連射や迫撃砲で一掃せよ。' : ''}
            ${enemy.healRate ? 'スナイパーの標的を【LAST】にして背後から最優先狙撃！' : ''}
            ${!enemy.shield && !enemy.armor && !enemy.isStealth && !enemy.splitsInto && !enemy.healRate ? 'パルス砲やバルカンの集中砲火で早期撃破。' : ''}
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
    this.dom.stageModal?.classList.remove('hidden');
    this.renderStages();
  }

  renderStages() {
    if (!this.dom.stageList) return;
    this.dom.stageList.innerHTML = '';

    for (const map of MAPS) {
      const record = state.data.stageRecords[map.id] || { highestWave: 0, stars: 0, cleared: false };
      const card = document.createElement('div');
      card.className = `stage-card ${record.cleared ? 'cleared' : ''}`;
      card.innerHTML = `
        <div class="stage-header">
          <span class="stage-name">${map.name}</span>
          <span class="stage-diff">${map.difficulty}</span>
        </div>
        <div class="stage-desc">${map.desc}</div>
        <div class="stage-footer">
          <span class="stage-waves">WAVES: ${map.wavesCount}</span>
          <span class="stage-reward">初クリア: ${ICONS.core} ${map.coreReward}</span>
          <div class="stage-btns">
            <button class="btn-play-stage" data-map="${map.id}">CAMPAIGN</button>
            <button class="btn-play-endless" data-map="${map.id}">ENDLESS</button>
          </div>
        </div>
      `;

      card.querySelector('.btn-play-stage')?.addEventListener('click', () => {
        this.closeModals();
        this.game.loadStage(map.id, false);
      });

      card.querySelector('.btn-play-endless')?.addEventListener('click', () => {
        this.closeModals();
        this.game.loadStage(map.id, true);
      });

      this.dom.stageList.appendChild(card);
    }
  }

  showGameOverModal(wave) {
    this.dom.modalBackdrop?.classList.remove('hidden');
    this.dom.resultModal?.classList.remove('hidden');
    if (this.dom.resultTitle) {
      this.dom.resultTitle.innerText = 'MISSION FAILED';
      this.dom.resultTitle.className = 'result-title defeat';
    }
    if (this.dom.resultDesc) {
      this.dom.resultDesc.innerText = '拠点の防衛ラインが突破されました。戦術マニュアルで敵の弱点を確認し、研究所でタワーを強化して再挑戦しましょう。';
    }
    if (this.dom.resultStats) {
      this.dom.resultStats.innerHTML = `
        <div class="res-stat">到達ウェーブ: <strong>${wave}</strong></div>
        <div class="res-stat">所持コア: <strong>${ICONS.core} ${state.data.quantumCores}</strong></div>
      `;
    }
  }

  showVictoryModal(wave, isFlawless, coreReward = 0) {
    this.dom.modalBackdrop?.classList.remove('hidden');
    this.dom.resultModal?.classList.remove('hidden');
    if (this.dom.resultTitle) {
      this.dom.resultTitle.innerText = isFlawless ? 'PERFECT VICTORY (FLAWLESS)' : 'MISSION ACCOMPLISHED';
      this.dom.resultTitle.className = 'result-title victory';
    }
    if (this.dom.resultDesc) {
      this.dom.resultDesc.innerText = 'すべての侵略軍を殲滅しました！新たなクォンタムコアを獲得しました。';
    }
    if (this.dom.resultStats) {
      this.dom.resultStats.innerHTML = `
        <div class="res-stat">クリアウェーブ: <strong>${wave}</strong></div>
        <div class="res-stat">獲得コア: <strong>${ICONS.core} +${coreReward}</strong></div>
        <div class="res-stat">拠点完全防衛: <strong>${isFlawless ? 'PERFECT (FLAWLESS)' : 'CLEARED'}</strong></div>
      `;
    }
  }
}
