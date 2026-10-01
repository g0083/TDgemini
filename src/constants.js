// ==========================================
// CYBER DEFENSE: NEXUS - CONSTANTS & CONFIG
// ==========================================

export const GRID_COLS = 16;
export const GRID_ROWS = 10;

// Color Palette (Cyberpunk Neon)
export const COLORS = {
  bg: '#070b14',
  bgGrid: '#0d1527',
  gridLine: '#14223d',
  pathBase: '#101d36',
  pathGlow: '#00f0ff',
  nexus: '#00f0ff',
  nexusCore: '#ffffff',
  text: '#e2f1ff',
  textDim: '#7088a8',
  danger: '#ff2e63',
  warning: '#ffd000',
  success: '#00ff9d',
  energy: '#b84dff',
  freeze: '#60d5ff'
};

// Tower Definitions
export const TOWER_TYPES = {
  pulse: {
    id: 'pulse',
    name: 'パルス砲',
    desc: '標準的な連射エネルギー砲。低コストで信頼性が高い。',
    cost: 100,
    range: 135,
    damage: 26,
    fireRate: 1.8, // attacks per second
    color: '#00f0ff',
    bulletSpeed: 550,
    type: 'single',
    upgrades: [
      { name: 'Mk-II', cost: 75, damage: 38, fireRate: 2.1, range: 145 },
      { name: 'Mk-III', cost: 130, damage: 56, fireRate: 2.5, range: 160 }
    ],
    paths: {
      pathA: {
        name: 'ヘビーパルサー',
        desc: '大口径高出力弾。敵を貫通しノックバックさせる。',
        cost: 260,
        damage: 130,
        fireRate: 1.8,
        range: 175,
        pierce: 3,
        knockback: 18,
        color: '#00bfff'
      },
      pathB: {
        name: 'ハイパーガトリング',
        desc: '超高速連射パルス。圧倒的な手数で敵を蜂の巣にする。',
        cost: 240,
        damage: 38,
        fireRate: 5.5,
        range: 150,
        color: '#38ef7d'
      }
    }
  },
  gatling: {
    id: 'gatling',
    name: 'バルカン',
    desc: '至近距離の群れに強い超高速機関砲。',
    cost: 130,
    range: 105,
    damage: 11,
    fireRate: 4.2,
    color: '#ffd000',
    bulletSpeed: 600,
    type: 'single',
    upgrades: [
      { name: 'Mk-II', cost: 90, damage: 17, fireRate: 5.2, range: 115 },
      { name: 'Mk-III', cost: 160, damage: 26, fireRate: 6.5, range: 125 }
    ],
    paths: {
      pathA: {
        name: 'ミニガンアレイ',
        desc: '回転数極大。クリティカル率+30%の弾幕を展開。',
        cost: 280,
        damage: 40,
        fireRate: 9.5,
        range: 135,
        critChance: 0.35,
        color: '#ff9900'
      },
      pathB: {
        name: 'シュレッダー',
        desc: '敵の装甲を削り取り、被ダメージを最大+50%増加させる。',
        cost: 290,
        damage: 32,
        fireRate: 6.0,
        range: 130,
        shredArmor: 0.05, // 5% per hit up to 50%
        color: '#ff4d4d'
      }
    }
  },
  sniper: {
    id: 'sniper',
    name: 'レールガン',
    desc: '長距離単発高威力。高HPの敵を遠方から狙撃する。',
    cost: 160,
    range: 220,
    damage: 90,
    fireRate: 0.6,
    color: '#00ff9d',
    bulletSpeed: 950,
    type: 'sniper',
    upgrades: [
      { name: 'Mk-II', cost: 120, damage: 155, fireRate: 0.75, range: 250 },
      { name: 'Mk-III', cost: 210, damage: 260, fireRate: 0.9, range: 280 }
    ],
    paths: {
      pathA: {
        name: '対タイタン砲',
        desc: 'ボス・重装甲特効。ターゲットの最大HPの6%を追加ダメージ。',
        cost: 380,
        damage: 540,
        fireRate: 0.85,
        range: 320,
        bossBonus: 2.0,
        percentHpDamage: 0.06,
        color: '#00ffcc'
      },
      pathB: {
        name: '貫通ビーム砲',
        desc: '射線上のすべての敵を一撃で貫通・粉砕する超高密度光線。',
        cost: 360,
        damage: 420,
        fireRate: 0.7,
        range: 340,
        piercingLine: true,
        color: '#76ff03'
      }
    }
  },
  cryo: {
    id: 'cryo',
    name: 'クライオ',
    desc: '絶対零度の冷気光線。敵を減速させ足止めする。',
    cost: 125,
    range: 115,
    damage: 12,
    fireRate: 2.2,
    slowAmount: 0.35,
    slowDuration: 2.5,
    color: '#60d5ff',
    bulletSpeed: 450,
    type: 'beam_slow',
    upgrades: [
      { name: 'Mk-II', cost: 85, damage: 20, slowAmount: 0.45, range: 125 },
      { name: 'Mk-III', cost: 150, damage: 32, slowAmount: 0.55, range: 140 }
    ],
    paths: {
      pathA: {
        name: 'アブソリュートゼロ',
        desc: '極低温フィールド。減速が最大80%になり、周期的に完全凍結。',
        cost: 310,
        damage: 55,
        slowAmount: 0.75,
        freezeChance: 0.35,
        range: 165,
        color: '#b3ecff'
      },
      pathB: {
        name: 'フロストシャッター',
        desc: '減速状態の敵が倒れると氷破片が爆発し、周囲にダメージと凍結を拡散。',
        cost: 290,
        damage: 60,
        slowAmount: 0.55,
        shatterAoe: 90,
        range: 150,
        color: '#80d8ff'
      }
    }
  },
  cannon: {
    id: 'cannon',
    name: '迫撃砲',
    desc: '放物線を描いて榴弾を発射し、広範囲を爆破する。',
    cost: 175,
    range: 160,
    damage: 65,
    splashRadius: 55,
    fireRate: 0.75,
    color: '#ff6200',
    bulletSpeed: 380,
    type: 'splash',
    upgrades: [
      { name: 'Mk-II', cost: 110, damage: 105, splashRadius: 65, fireRate: 0.85 },
      { name: 'Mk-III', cost: 190, damage: 170, splashRadius: 75, fireRate: 0.95 }
    ],
    paths: {
      pathA: {
        name: 'クラスターボム',
        desc: '着弾時に3つの子爆弾を周囲にばら撒き、広範囲を殲滅する。',
        cost: 370,
        damage: 280,
        splashRadius: 85,
        clusterCount: 3,
        range: 190,
        color: '#ff3d00'
      },
      pathB: {
        name: 'アトミックフォールアウト',
        desc: '着弾地点に汚染フィールドを5秒間残し、通過する敵に持続ダメージ。',
        cost: 390,
        damage: 240,
        splashRadius: 90,
        burnDuration: 5.0,
        range: 185,
        color: '#ff9100'
      }
    }
  },
  tesla: {
    id: 'tesla',
    name: 'テスラ',
    desc: '高圧電撃を放ち、周囲の敵へ次々と連鎖放電する。',
    cost: 190,
    range: 130,
    damage: 38,
    fireRate: 1.1,
    chainCount: 3,
    chainRange: 80,
    color: '#b84dff',
    type: 'chain',
    upgrades: [
      { name: 'Mk-II', cost: 130, damage: 60, chainCount: 4, range: 140 },
      { name: 'Mk-III', cost: 220, damage: 95, chainCount: 5, range: 155 }
    ],
    paths: {
      pathA: {
        name: 'チェインアーク',
        desc: '最大8体まで威力を減衰させずに電撃が跳躍し、電磁ネットを形成。',
        cost: 390,
        damage: 175,
        chainCount: 8,
        chainRange: 110,
        range: 180,
        color: '#d500f9'
      },
      pathB: {
        name: 'オーバーロードEMP',
        desc: '電撃ヒット時に敵を0.8秒スタンさせ、シールドを即座に破砕。',
        cost: 410,
        damage: 190,
        chainCount: 4,
        stunDuration: 0.8,
        shieldMultiplier: 3.5,
        range: 165,
        color: '#7c4dff'
      }
    }
  },
  laser: {
    id: 'laser',
    name: 'レーザー',
    desc: '持続照射ビーム。同じ敵を狙い続けるほどダメージが急増する。',
    cost: 210,
    range: 145,
    damage: 18, // base per tick
    maxRampDamage: 90,
    fireRate: 10, // tick rate
    color: '#ff0077',
    type: 'continuous_laser',
    upgrades: [
      { name: 'Mk-II', cost: 140, damage: 28, maxRampDamage: 140, range: 160 },
      { name: 'Mk-III', cost: 240, damage: 45, maxRampDamage: 230, range: 175 }
    ],
    paths: {
      pathA: {
        name: 'サーマルメルター',
        desc: '最大倍率600%！極太の熱線で高耐久の巨体を瞬時に融解する。',
        cost: 440,
        damage: 75,
        maxRampDamage: 450,
        range: 195,
        color: '#ff1744'
      },
      pathB: {
        name: 'デュアルプリズム',
        desc: '2本の集束レーザーを同時に照射し、2体の敵を並行して焼き払う。',
        cost: 430,
        damage: 55,
        maxRampDamage: 280,
        multiTarget: 2,
        range: 185,
        color: '#ff4081'
      }
    }
  },
  booster: {
    id: 'booster',
    name: 'シナジーコア',
    desc: '攻撃は行わないが、範囲内の味方タワーの能力を大幅強化する。',
    cost: 180,
    range: 135,
    buffDamage: 0.20,
    buffRate: 0.20,
    color: '#7bff00',
    type: 'booster',
    upgrades: [
      { name: 'Mk-II', cost: 120, buffDamage: 0.28, buffRate: 0.28, range: 150 },
      { name: 'Mk-III', cost: 210, buffDamage: 0.38, buffRate: 0.38, range: 165 }
    ],
    paths: {
      pathA: {
        name: 'コンバットオーバードライブ',
        desc: '範囲内の全タワーの攻撃力+50%、クリティカル率+25%。',
        cost: 420,
        buffDamage: 0.50,
        buffRate: 0.30,
        buffCrit: 0.25,
        range: 180,
        color: '#aeea00'
      },
      pathB: {
        name: 'クロノフィールド',
        desc: '範囲内の全タワーの攻撃速度+55%、射程+30%。',
        cost: 410,
        buffDamage: 0.25,
        buffRate: 0.55,
        buffRange: 0.30,
        range: 190,
        color: '#64dd17'
      }
    }
  }
};

// Enemy Definitions
export const ENEMY_TYPES = {
  scout: {
    id: 'scout',
    name: 'スカウト',
    hp: 36,
    speed: 105,
    reward: 10,
    color: '#00f0ff',
    size: 10,
    shape: 'triangle',
    score: 15
  },
  trooper: {
    id: 'trooper',
    name: 'トルーパー',
    hp: 95,
    speed: 85,
    reward: 12,
    color: '#39ff14',
    size: 13,
    shape: 'square',
    score: 25
  },
  heavy: {
    id: 'heavy',
    name: 'ヘビータンク',
    hp: 310,
    armor: 0.25,
    speed: 55,
    reward: 25,
    color: '#ff9900',
    size: 18,
    shape: 'hexagon',
    score: 50
  },
  shielded: {
    id: 'shielded',
    name: 'シールドドローン',
    hp: 140,
    shield: 160,
    speed: 75,
    reward: 22,
    color: '#3d84ff',
    size: 14,
    shape: 'circle',
    score: 45
  },
  swarm: {
    id: 'swarm',
    name: 'スウォーマー',
    hp: 30,
    speed: 135,
    reward: 5,
    color: '#ffea00',
    size: 8,
    shape: 'diamond',
    score: 10
  },
  splitter: {
    id: 'splitter',
    name: 'スプリッター',
    hp: 200,
    speed: 68,
    reward: 20,
    color: '#ff007f',
    size: 16,
    shape: 'star',
    splitsInto: 'mini_swarm',
    splitCount: 3,
    score: 40
  },
  mini_swarm: {
    id: 'mini_swarm',
    name: 'ミニドローン',
    hp: 25,
    speed: 140,
    reward: 3,
    color: '#ff4081',
    size: 7,
    shape: 'diamond',
    score: 8
  },
  healer: {
    id: 'healer',
    name: 'リペアドローン',
    hp: 175,
    speed: 70,
    reward: 24,
    color: '#00e676',
    size: 14,
    shape: 'cross',
    healRate: 20, // HP per sec to nearby
    healRange: 75,
    score: 45
  },
  stealth: {
    id: 'stealth',
    name: 'ファントム',
    hp: 150,
    speed: 95,
    reward: 25,
    color: '#9c27b0',
    size: 13,
    shape: 'chevron',
    isStealth: true,
    score: 50
  },
  // Bosses
  boss_colossus: {
    id: 'boss_colossus',
    name: 'GIGA コロッサス',
    isBoss: true,
    hp: 3200,
    shield: 1200,
    armor: 0.35,
    speed: 40,
    reward: 180,
    color: '#ff1744',
    size: 26,
    shape: 'boss_octagon',
    score: 500,
    coreDrop: 12
  },
  boss_reaper: {
    id: 'boss_reaper',
    name: 'ヴォイド リーパー',
    isBoss: true,
    hp: 5800,
    shield: 1800,
    speed: 46,
    reward: 300,
    color: '#d500f9',
    size: 28,
    shape: 'boss_star',
    regen: 45, // HP regen per second
    score: 900,
    coreDrop: 20
  },
  boss_overlord: {
    id: 'boss_overlord',
    name: 'クォンタム オーバーロード',
    isBoss: true,
    hp: 11000,
    shield: 3500,
    armor: 0.40,
    speed: 44,
    reward: 500,
    color: '#00f0ff',
    size: 32,
    shape: 'boss_omega',
    score: 2000,
    coreDrop: 40
  }
};

// Maps Definition
export const MAPS = [
  {
    id: 'nexus_prime',
    name: '01. ALPHA CIRCUIT',
    desc: '標準的なS字防衛ライン。基本配置とシナジーを学ぶのに最適。',
    difficulty: '★☆☆☆☆',
    wavesCount: 30,
    baseHp: 20,
    startGold: 450,
    coreReward: 20,
    gridWidth: 16,
    gridHeight: 10,
    paths: [
      [
        { x: 0, y: 2 },
        { x: 5, y: 2 },
        { x: 5, y: 7 },
        { x: 10, y: 7 },
        { x: 10, y: 3 },
        { x: 15, y: 3 }
      ]
    ],
    nexus: { x: 15, y: 3 },
    spawnPoints: [{ x: 0, y: 2 }]
  },
  {
    id: 'dual_cross',
    name: '02. TWIN CROSS',
    desc: '2方向から敵が侵入し、中央の交差点で合流する高難度ルート。',
    difficulty: '★★☆☆☆',
    wavesCount: 35,
    baseHp: 20,
    startGold: 400,
    coreReward: 25,
    gridWidth: 16,
    gridHeight: 10,
    paths: [
      [
        { x: 0, y: 1 },
        { x: 8, y: 1 },
        { x: 8, y: 8 },
        { x: 15, y: 8 }
      ],
      [
        { x: 0, y: 8 },
        { x: 8, y: 8 },
        { x: 8, y: 1 },
        { x: 15, y: 1 },
        { x: 15, y: 8 }
      ]
    ],
    nexus: { x: 15, y: 8 },
    spawnPoints: [{ x: 0, y: 1 }, { x: 0, y: 8 }]
  },
  {
    id: 'silicon_maze',
    name: '03. SILICON MAZE',
    desc: '入り組んだ蛇行迷路。スナイパーやキャノンの配置が勝敗を分ける。',
    difficulty: '★★★☆☆',
    wavesCount: 40,
    baseHp: 25,
    startGold: 450,
    coreReward: 40,
    gridWidth: 16,
    gridHeight: 10,
    paths: [
      [
        { x: 0, y: 1 },
        { x: 13, y: 1 },
        { x: 13, y: 4 },
        { x: 2, y: 4 },
        { x: 2, y: 7 },
        { x: 14, y: 7 },
        { x: 14, y: 9 },
        { x: 15, y: 9 }
      ]
    ],
    nexus: { x: 15, y: 9 },
    spawnPoints: [{ x: 0, y: 1 }]
  },
  {
    id: 'vortex_core',
    name: '04. VORTEX CORE',
    desc: '上下左右から中央のクォンタムコアへ敵が侵攻する最終防衛拠点。',
    difficulty: '★★★★★',
    wavesCount: 50,
    baseHp: 30,
    startGold: 550,
    coreReward: 80,
    gridWidth: 16,
    gridHeight: 10,
    paths: [
      [
        { x: 0, y: 5 },
        { x: 8, y: 5 }
      ],
      [
        { x: 15, y: 5 },
        { x: 8, y: 5 }
      ],
      [
        { x: 8, y: 0 },
        { x: 8, y: 5 }
      ],
      [
        { x: 8, y: 9 },
        { x: 8, y: 5 }
      ]
    ],
    nexus: { x: 8, y: 5 },
    spawnPoints: [
      { x: 0, y: 5 },
      { x: 15, y: 5 },
      { x: 8, y: 0 },
      { x: 8, y: 9 }
    ]
  }
];

// Commander Skills
export const SKILLS = {
  orbital: {
    id: 'orbital',
    name: '軌道爆撃',
    icon: '🛰️',
    desc: '指定座標に超高出力の衛星レーザーを投下し、広範囲の敵に大打撃を与える。',
    cooldown: 35,
    damage: 950,
    radius: 95,
    needsTarget: true
  },
  emp: {
    id: 'emp',
    name: 'EMPサージ',
    icon: '⚡',
    desc: '画面内の全敵を4秒間完全に麻痺させ、シールドを半減させる。',
    cooldown: 45,
    duration: 4.0,
    shieldDamagePercent: 0.5,
    needsTarget: false
  },
  overcharge: {
    id: 'overcharge',
    name: 'オーバードライブ',
    icon: '🚀',
    desc: '10秒間、すべてのタワーの攻撃速度を+100%増加させる。',
    cooldown: 50,
    duration: 10.0,
    speedBoost: 1.0,
    needsTarget: false
  },
  supply: {
    id: 'supply',
    name: '緊急補給',
    icon: '💎',
    desc: '緊急支援クレジットを即座に投下し、資金を獲得する。',
    cooldown: 60,
    goldAmount: 250,
    needsTarget: false
  }
};

// Permanent Tech Tree / Laboratory
export const TECH_TREE = [
  {
    id: 'starting_gold',
    name: '初期予算増強',
    icon: '💰',
    desc: 'ステージ開始時の初期所持クレジットを増加。',
    maxLevel: 10,
    costPerLevel: (lvl) => Math.floor(10 * Math.pow(1.4, lvl)),
    effectPerLevel: 30, // +30 gold per level
    format: (val) => `+${val} G`
  },
  {
    id: 'tower_damage',
    name: '高密度エネルギー弾頭',
    icon: '⚔️',
    desc: 'すべてのタワーの基本攻撃力を永続強化。',
    maxLevel: 10,
    costPerLevel: (lvl) => Math.floor(15 * Math.pow(1.45, lvl)),
    effectPerLevel: 0.05, // +5% damage per level
    format: (val) => `+${Math.round(val * 100)}%`
  },
  {
    id: 'fire_rate',
    name: '超伝導サーボモーター',
    icon: '⚡',
    desc: 'すべてのタワーの攻撃速度を向上。',
    maxLevel: 10,
    costPerLevel: (lvl) => Math.floor(15 * Math.pow(1.45, lvl)),
    effectPerLevel: 0.04, // +4% attack speed per level
    format: (val) => `+${Math.round(val * 100)}%`
  },
  {
    id: 'tower_range',
    name: '長距離センサー網',
    icon: '📡',
    desc: 'すべてのタワーの射程範囲を拡大。',
    maxLevel: 8,
    costPerLevel: (lvl) => Math.floor(20 * Math.pow(1.5, lvl)),
    effectPerLevel: 0.04, // +4% range per level
    format: (val) => `+${Math.round(val * 100)}%`
  },
  {
    id: 'crit_matrix',
    name: 'クリティカルマトリクス',
    icon: '🎯',
    desc: '全タワーにクリティカル発動チャンスを付与。',
    maxLevel: 8,
    costPerLevel: (lvl) => Math.floor(25 * Math.pow(1.55, lvl)),
    effectPerLevel: 0.03, // +3% crit chance per level
    format: (val) => `+${Math.round(val * 100)}%`
  },
  {
    id: 'skill_cooldown',
    name: '指令部冷却システム',
    icon: '⏱️',
    desc: '全司令官スキルのクールダウン時間を短縮。',
    maxLevel: 6,
    costPerLevel: (lvl) => Math.floor(30 * Math.pow(1.6, lvl)),
    effectPerLevel: 0.05, // -5% CD per level
    format: (val) => `-${Math.round(val * 100)}%`
  },
  {
    id: 'core_scrapper',
    name: 'スクラップ還元装置',
    icon: '🔩',
    desc: '敵撃破時に得られるクレジットが上昇。',
    maxLevel: 8,
    costPerLevel: (lvl) => Math.floor(18 * Math.pow(1.5, lvl)),
    effectPerLevel: 0.05, // +5% gold per kill
    format: (val) => `+${Math.round(val * 100)}%`
  },
  {
    id: 'base_nanites',
    name: 'ナノ修復フィールド',
    icon: '🛡️',
    desc: '拠点HPを増加させ、ウェーブ終了時にHPを自動修復。',
    maxLevel: 6,
    costPerLevel: (lvl) => Math.floor(20 * Math.pow(1.5, lvl)),
    effectPerLevel: 3, // +3 max hp & repair
    format: (val) => `HP +${val}`
  }
];

// Achievements
export const ACHIEVEMENTS = [
  { id: 'first_kill', title: '初陣', desc: '初めて敵を1体撃破する。', reward: 5, check: (s) => s.totalKills >= 1 },
  { id: 'kills_100', title: '殲滅部隊', desc: '累計100体の敵を撃破する。', reward: 15, check: (s) => s.totalKills >= 100 },
  { id: 'kills_1000', title: 'サイバーウォーロード', desc: '累計1000体の敵を撃破する。', reward: 50, check: (s) => s.totalKills >= 1000 },
  { id: 'wave_10', title: '初期防衛線', desc: 'ウェーブ10に到達する。', reward: 10, check: (s) => s.highestWave >= 10 },
  { id: 'wave_30', title: 'ベテラン司令官', desc: 'ウェーブ30に到達する。', reward: 30, check: (s) => s.highestWave >= 30 },
  { id: 'wave_50', title: '不落の要塞', desc: 'ウェーブ50に到達する。', reward: 80, check: (s) => s.highestWave >= 50 },
  { id: 'boss_kill', title: '巨兵落とし', desc: '初めてボス敵を撃破する。', reward: 25, check: (s) => s.bossesDefeated >= 1 },
  { id: 'boss_10', title: 'タイタンバスター', desc: '累計10体のボスを撃破する。', reward: 60, check: (s) => s.bossesDefeated >= 10 },
  { id: 'stage_clear_1', title: 'Alpha制覇', desc: 'Stage 01 をクリアする。', reward: 20, check: (s) => s.stagesCleared?.includes('nexus_prime') },
  { id: 'stage_clear_2', title: 'Twin Cross制覇', desc: 'Stage 02 をクリアする。', reward: 35, check: (s) => s.stagesCleared?.includes('dual_cross') },
  { id: 'stage_clear_3', title: 'Maze走破', desc: 'Stage 03 をクリアする。', reward: 50, check: (s) => s.stagesCleared?.includes('silicon_maze') },
  { id: 'stage_clear_4', title: 'Vortex完全防衛', desc: 'Stage 04 をクリアする。', reward: 100, check: (s) => s.stagesCleared?.includes('vortex_core') },
  { id: 'all_towers', title: '技術の結晶', desc: '全8種類のタワーを1度以上建設する。', reward: 30, check: (s) => s.towersBuiltCount >= 8 },
  { id: 'upgrade_path', title: '特化進化', desc: 'タワーの分岐進化（Path A / B）を実行する。', reward: 15, check: (s) => s.evolvedTowers >= 1 },
  { id: 'skill_master', title: '戦略支援', desc: '司令官スキルを累計20回使用する。', reward: 25, check: (s) => s.skillsUsed >= 20 },
  { id: 'rich_commander', title: '大富豪', desc: 'ゲーム中に一度に1500クレジット以上所持する。', reward: 30, check: (s) => s.maxGoldHold >= 1500 },
  { id: 'researcher', title: '研究開発', desc: '研究所でアップグレードを累計10回購入する。', reward: 30, check: (s) => s.totalTechBought >= 10 },
  { id: 'flawless', title: '完全防衛 (Flawless)', desc: 'ノーダメージ（拠点HPMAXのまま）でステージをクリア。', reward: 50, check: (s) => s.flawlessVictory }
];
