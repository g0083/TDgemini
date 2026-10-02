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

// ==========================================
// GAME MODES, DIFFICULTIES & MUTATORS
// ==========================================
export const DIFFICULTIES = {
  NORMAL: {
    id: 'NORMAL',
    name: 'NORMAL',
    color: '#00f0ff',
    desc: '標準脅威レベル。通常編成の侵略軍を迎撃せよ。',
    hpMult: 1.0,
    speedMult: 1.0,
    rewardMult: 1.0,
    coreMult: 1.0,
    scoreMult: 1.0,
    badge: '★'
  },
  HARD: {
    id: 'HARD',
    name: 'HARD',
    color: '#ffd000',
    desc: '強化部隊強襲。敵HP+35%、移動速度+10%、撃破資金-10%。コア獲得1.8倍！',
    hpMult: 1.35,
    speedMult: 1.10,
    rewardMult: 0.90,
    coreMult: 1.8,
    scoreMult: 1.5,
    badge: '★★'
  },
  NIGHTMARE: {
    id: 'NIGHTMARE',
    name: 'NIGHTMARE',
    color: '#ff2e63',
    desc: '地獄の殲滅戦。敵HP+80%、移動速度+25%、撃破資金-20%、全敵装甲強化。コア獲得3.0倍！',
    hpMult: 1.80,
    speedMult: 1.25,
    rewardMult: 0.80,
    coreMult: 3.0,
    scoreMult: 2.5,
    badge: '★★★'
  }
};

// Danger Modifiers (Mutators)
export const MODIFIERS = [
  {
    id: 'fast_enemies',
    name: '超高速侵攻',
    icon: 'rocket',
    desc: 'すべての敵ユニットの移動速度 +25%',
    scoreBonus: 0.25,
    coreBonus: 0.25,
    color: '#00f0ff'
  },
  {
    id: 'hardened_armor',
    name: 'ナノ装甲硬化',
    icon: 'shield',
    desc: '全敵の基本装甲 +15% ＆ シールド耐久値 +40%',
    scoreBonus: 0.30,
    coreBonus: 0.30,
    color: '#ff9900'
  },
  {
    id: 'budget_cut',
    name: '予算削減',
    icon: 'gold',
    desc: '敵撃破時に得られるクレジット -25%',
    scoreBonus: 0.35,
    coreBonus: 0.35,
    color: '#ff4d4d'
  },
  {
    id: 'no_skills',
    name: '通信途絶',
    icon: 'zap',
    desc: '全司令官スキル（爆撃・EMP・過負荷・補給）が使用不可',
    scoreBonus: 0.40,
    coreBonus: 0.40,
    color: '#b84dff'
  },
  {
    id: 'swarm_surge',
    name: '大軍団強襲',
    icon: 'target',
    desc: '各ウェーブの敵の総出現数が +35% 増加',
    scoreBonus: 0.45,
    coreBonus: 0.45,
    color: '#ffea00'
  },
  {
    id: 'boss_frenzy',
    name: '変異暴走ボス',
    icon: 'wrench',
    desc: 'ボスの最大HP +50% ＆ ボスの移動速度 +20%',
    scoreBonus: 0.50,
    coreBonus: 0.50,
    color: '#ff0055'
  }
];

// ==========================================
// ROGUELIKE TACTICAL PROTOCOLS
// ==========================================
export const PROTOCOLS = [
  // COMMON
  {
    id: 'overclock_rotors',
    name: '高周波ローター',
    rarity: 'COMMON',
    icon: 'rate',
    color: '#00f0ff',
    desc: '全タワーの攻撃速度が永続で +12% 上昇する。',
    statBonus: { fireRate: 0.12 }
  },
  {
    id: 'dense_plasma',
    name: '高密度荷電セル',
    rarity: 'COMMON',
    icon: 'damage',
    color: '#00f0ff',
    desc: '全タワーの基本攻撃力が永続で +15% 上昇する。',
    statBonus: { damage: 0.15 }
  },
  {
    id: 'targeting_optics',
    name: '量子焦点レンズ',
    rarity: 'COMMON',
    icon: 'range',
    color: '#00f0ff',
    desc: '全タワーの射程範囲が永続で +12% 拡大する。',
    statBonus: { range: 0.12 }
  },
  {
    id: 'critical_matrix_card',
    name: '精密照準回路',
    rarity: 'COMMON',
    icon: 'target',
    color: '#00f0ff',
    desc: '全タワーのクリティカル率が +8% 増加する。',
    statBonus: { critChance: 0.08 }
  },
  {
    id: 'salvage_protocol',
    name: 'スクラップ採集ナノボット',
    rarity: 'COMMON',
    icon: 'gold',
    color: '#00f0ff',
    desc: '敵撃破時に得られるクレジットが +15% 増加する。',
    killBonus: 0.15
  },
  {
    id: 'kinetic_shock',
    name: '衝撃反動フレーム',
    rarity: 'COMMON',
    icon: 'rocket',
    color: '#00f0ff',
    desc: '実弾兵器（パルス砲・バルカン・迫撃砲）の弾速+30%＆微小ノックバックを付与。',
    kineticBoost: true
  },

  // RARE
  {
    id: 'chain_lightning',
    name: '過負荷放電チェイン',
    rarity: 'RARE',
    icon: 'zap',
    color: '#b84dff',
    desc: 'クリティカル発生時、45%の確率で標的から最大3体の敵へ連鎖雷撃を放つ。',
    chainLightning: true
  },
  {
    id: 'frostbite_shatter',
    name: '絶対零度粉砕',
    rarity: 'RARE',
    icon: 'satellite',
    color: '#60d5ff',
    desc: '減速または凍結中の敵に対する全タワーの与ダメージが +35% 増加する。',
    freezeBonusDmg: 0.35
  },
  {
    id: 'armor_melter',
    name: 'テルミット侵食弾',
    rarity: 'RARE',
    icon: 'wrench',
    color: '#ff9900',
    desc: '全タワーの物理・通常攻撃が敵の装甲を18%無視して貫通する。',
    armorPenetration: 0.18
  },
  {
    id: 'rapid_spool',
    name: 'ターボチャージ機構',
    rarity: 'RARE',
    icon: 'rate',
    color: '#ffd000',
    desc: 'タワーが攻撃するたびに自身の攻撃速度が+1.5%加速（最大+45%まで蓄積）。',
    spooling: true
  },
  {
    id: 'compound_interest',
    name: '防衛基金利子運用',
    rarity: 'RARE',
    icon: 'gold',
    color: '#00ff9d',
    desc: 'ウェーブクリア時、手持ちクレジットの6%（最大200クレジット）を利子として受領。',
    interestRate: 0.06,
    maxInterest: 200
  },
  {
    id: 'titan_slayer',
    name: 'タイタンキラー弾頭',
    rarity: 'RARE',
    icon: 'target',
    color: '#ff2e63',
    desc: 'ボスおよびHP1000以上のエリート敵への全タワー与ダメージが +40% 増加する。',
    bossDmgBonus: 0.40
  },
  {
    id: 'energy_resonance',
    name: 'シナジー共鳴場',
    rarity: 'RARE',
    icon: 'core',
    color: '#7bff00',
    desc: 'シナジーコアの有効範囲が+25%拡大し、全バフ効果（攻撃力・速度）が+15%強化される。',
    boosterBoost: true
  },
  {
    id: 'bounty_harvest',
    name: 'コア収穫プロトコル',
    rarity: 'RARE',
    icon: 'core',
    color: '#00f0ff',
    desc: 'ボス撃破時、クォンタムコアを即座に追加で +8 個ボーナス獲得する。',
    bossCoreBonus: 8
  },

  // EPIC
  {
    id: 'quantum_barrier',
    name: '緊急防壁エマージェンシー',
    rarity: 'EPIC',
    icon: 'shield',
    color: '#ffd000',
    desc: '拠点HPが最大値の35%以下になった瞬間、画面全体の全敵を6秒間完全麻痺させる（1戦1回）。',
    barrierEmergency: true
  },
  {
    id: 'cluster_payload',
    name: 'クラスター爆砕弾頭',
    rarity: 'EPIC',
    icon: 'rocket',
    color: '#ff007f',
    desc: '迫撃砲およびレールガンの弾丸が着弾時に周囲へ3つのクラスター小型子弾を撒き散らす。',
    clusterBombs: true
  },
  {
    id: 'hyper_execute',
    name: '絶滅処刑コード',
    rarity: 'EPIC',
    icon: 'damage',
    color: '#ff2e63',
    desc: 'HP15%以下の通常敵、およびHP8%以下のボス敵に攻撃が当たると一撃で即死・消滅させる。',
    executeThreshold: 0.15,
    bossExecuteThreshold: 0.08
  },
  {
    id: 'nano_swarm_healer',
    name: '自己複製ナノマトリクス',
    rarity: 'EPIC',
    icon: 'shield',
    color: '#00ff9d',
    desc: '最大拠点HPが+6増加し、毎ウェーブ終了時に拠点HPを即座に+2自動修復する。',
    maxHpBonus: 6,
    waveRepair: 2
  },
  {
    id: 'orbital_overdrive',
    name: '衛星リンク同期過負荷',
    rarity: 'EPIC',
    icon: 'satellite',
    color: '#00f0ff',
    desc: '全司令官スキルのクールダウンが25%短縮され、オーバードライブの効果時間が+5秒延長。',
    skillCdReduce: 0.25,
    skillDurationBoost: 5
  },
  {
    id: 'tesla_storm',
    name: 'テスラストーム・カタストロフ',
    rarity: 'EPIC',
    icon: 'zap',
    color: '#b84dff',
    desc: 'テスラコイルの連鎖数が+3増加し、シールドへのダメージが通常の3.5倍に跳ね上がる。',
    teslaStorm: true
  }
];

// ==========================================
// TOWER MASTERY SYSTEM (永続熟練度)
// ==========================================
export const TOWER_MASTERY_LEVELS = [
  { level: 0, killsReq: 0, title: '未配属', bonusDesc: 'なし' },
  { level: 1, killsReq: 80, title: '初級運用', bonusDesc: '射程 +4%', bonus: { range: 0.04 } },
  { level: 2, killsReq: 250, title: '熟練配備', bonusDesc: '攻撃力 +5%', bonus: { damage: 0.05 } },
  { level: 3, killsReq: 600, title: 'ベテラン', bonusDesc: '攻撃速度 +6%', bonus: { fireRate: 0.06 } },
  { level: 4, killsReq: 1200, title: 'エキスパート', bonusDesc: '会心率 +4%', bonus: { critChance: 0.04 } },
  { level: 5, killsReq: 2500, title: 'グランドマスター', bonusDesc: '全能力+3% ＆ 建設コスト -10%', bonus: { range: 0.03, damage: 0.03, fireRate: 0.03, costReduction: 0.10 } }
];

// Tower Definitions with Detailed Roles & Tactical Strengths
export const TOWER_TYPES = {
  pulse: {
    id: 'pulse',
    name: 'パルス砲',
    role: '万能・先鋒',
    strengths: '小型・標準敵・序盤の防衛線',
    weaknesses: '重装甲・超高HPボス',
    desc: '標準的な連射エネルギー砲。低コストで信頼性が高く、どの位置に置いても安定して活躍する。',
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
    role: '至近掃討・装甲破砕',
    strengths: 'スウォーマー・小型の群れ・接近戦',
    weaknesses: '長距離の敵・高機動ユニット',
    desc: '至近距離の群れに強い超高速機関砲。進化すると敵の装甲を剥ぎ取り味方全体のダメージを底上げする。',
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
        desc: '回転数極大。クリティカル率+35%の弾幕を展開。',
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
    role: '超長距離・ボス狙撃',
    strengths: 'ボス・重装甲タンク・遠方敵',
    weaknesses: '大量の小型群れ・至近距離の漏れ',
    desc: '長距離単発高威力。画面の端から高HPの敵を狙撃する。ターゲット設定を「STRONGEST」にすると効果絶大。',
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
        desc: 'ボス・重装甲特効。ターゲットの最大HPの6%を追加割合ダメージ。',
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
    role: '範囲減速・足止め支援',
    strengths: '高速スカウト・ボスの進行遅延',
    weaknesses: '単体火力は控えめ（他タワー必須）',
    desc: '絶対零度の冷気光線。敵を減速させ、周囲の攻撃タワーが敵を攻撃できる時間を劇的に引き延ばす。',
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
    role: '長距離爆撃・密集粉砕',
    strengths: '密集した集団・重装甲・ステルス炙り出し',
    weaknesses: '弾速が遅い・高速移動する単騎敵',
    desc: '放物線を描いて榴弾を発射し広範囲を爆破。物理装甲を貫く爆発ダメージで集団を一網打尽にする。',
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
    role: '連鎖電撃・シールド破壊特効',
    strengths: 'シールドドローン(2.5倍特効)・群れ・ステルス',
    weaknesses: '単体の超高耐久タンク',
    desc: '高圧電撃を放ち、周囲の敵へ跳躍！【シールドに対し特大ダメージ(2.5倍)】を与えて即座に剥ぎ取るシールドキラー。',
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
        desc: '電撃ヒット時に敵を0.8秒スタンさせ、シールドを3.5倍ダメージで瞬殺。',
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
    role: '熱線照射・巨獣融解',
    strengths: 'ボス・重装甲タンク・単体高HP敵',
    weaknesses: '目標が次々変わる群れ敵',
    desc: '持続照射ビーム。同一ターゲットに当て続けるほどダメージが指数関数的に急増！装甲を無視して高耐久の巨体を溶かす。',
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
    role: '周囲支援・味方能力増幅',
    strengths: '味方タワー密集地帯・全体火力底上げ',
    weaknesses: '自身は一切攻撃できない（他タワー必須）',
    desc: '攻撃は行わないが、範囲内の全味方タワーの攻撃力・速度・射程を劇的に強化する要塞の要。',
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

// Combat & Tactical Guide (Attributes, Shield breaking, armor shredding)
export const COMBAT_GUIDE = [
  {
    category: 'エネルギーシールドの破壊法',
    color: '#3d84ff',
    desc: '青い光のリングを纏った敵。シールドが存在する間、本体HPは守られる。',
    tips: [
      '【テスラコイル】はシールドに対して2.5倍〜3.5倍の特大電撃ダメージを与え、一撃で破砕できる！',
      '司令官スキル【EMPサージ】を発動すると、画面全体の敵のシールドを即座に半減＋4秒間スタン！',
      '通常の実弾・物理攻撃はシールドに吸収されやすいため、テスラやEMPでのシールド剥がしが最優先！'
    ]
  },
  {
    category: 'ヘビー装甲（Armor）の突破法',
    color: '#ff9900',
    desc: 'オレンジの重装甲タンク。物理ダメージを割合でカット（25%〜40%軽減）する。',
    tips: [
      '【迫撃砲（キャノン）】の爆発属性ダメージは装甲カットに強く、広範囲にまとめて大ダメージ！',
      '【レーザー】は装甲を無視して熱線を照射し続け、秒間ダメージが最大600%まで加速して溶かす！',
      '【バルカン（シュレッダー進化）】を当てると敵の装甲が剥がれ、周囲タワーの与ダメージが最大+50%増加！'
    ]
  },
  {
    category: 'ステルス（ファントム）の索敵法',
    color: '#b84dff',
    desc: '周期的に姿を消す紫のユニット。透明化中はタワーの直接ターゲットから外れる。',
    tips: [
      '【テスラコイル】の連鎖放電は、近くの敵を経由して透明化中の敵にも強制命中する！',
      '【迫撃砲】の着弾爆風や放射能汚染ゾーンは、姿を消した敵にも巻き込みダメージを与える！'
    ]
  },
  {
    category: 'ターゲット優先設定（Targeting）の活用',
    color: '#00ff9d',
    desc: '配置済みタワーをタップすると、標的優先順位（FIRST / LAST / STRONGEST / WEAKEST）を変更可能。',
    tips: [
      '【STRONGEST】: 高HPのボスや回復を行うリペアドローンをレールガンやレーザーで集中狙撃！',
      '【LAST】: 防衛線の後ろに陣取って周囲を回復し続ける敵を背後から狙い撃つ！',
      '【WEAKEST】: 瀕死の敵を優先して仕留め、取りこぼしを確実にゼロにする！'
    ]
  },
  {
    category: '拠点（ネクサス）への侵入ダメージ差',
    color: '#ff2e63',
    desc: '敵が防衛線を突破して拠点に到達したときのダメージは、敵の脅威度・サイズによって異なります。',
    tips: [
      '小型・一般兵（スカウト・トルーパー・群れ）: 侵入時に拠点HP -1',
      '重装甲・特殊兵（ヘビータンク・シールド・スプリッター・ファントム等）: 侵入時に拠点HP -2',
      '巨大ボス（コロッサス -5 / リーパー -7 / オーバーロード -10）: 拠点が壊滅的打撃を受けるため絶対に通してはならない！'
    ]
  }
];

// Enemy Definitions
export const ENEMY_TYPES = {
  scout: {
    id: 'scout',
    name: 'スカウト',
    hp: 36,
    speed: 105,
    reward: 10,
    nexusDamage: 1,
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
    nexusDamage: 1,
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
    nexusDamage: 2,
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
    nexusDamage: 2,
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
    nexusDamage: 1,
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
    nexusDamage: 2,
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
    nexusDamage: 1,
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
    nexusDamage: 2,
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
    nexusDamage: 2,
    color: '#9c27b0',
    size: 13,
    shape: 'chevron',
    isStealth: true,
    score: 50
  },
  // --- Advanced & Endless Exclusive Units ---
  disruptor: {
    id: 'disruptor',
    name: 'ディスラプター',
    hp: 240,
    speed: 72,
    reward: 35,
    nexusDamage: 2,
    color: '#ff00aa',
    size: 15,
    shape: 'disruptor',
    attacksTowers: true,
    attackRange: 140,
    attackCooldown: 4.5,
    empDuration: 2.6,
    score: 70
  },
  kamikaze: {
    id: 'kamikaze',
    name: 'カミカゼドローン',
    hp: 85,
    speed: 145,
    reward: 20,
    nexusDamage: 2,
    color: '#ff3b30',
    size: 11,
    shape: 'kamikaze',
    suicideOnTowers: true,
    targetTowerRange: 95,
    stunBlastRadius: 75,
    stunDuration: 2.5,
    score: 45
  },
  warper: {
    id: 'warper',
    name: 'クォンタムワーパー',
    hp: 310,
    shield: 160,
    speed: 82,
    reward: 40,
    nexusDamage: 2,
    color: '#00e5ff',
    size: 14,
    shape: 'warper',
    canWarp: true,
    warpCooldown: 3.2,
    warpDistance: 2.4,
    score: 80
  },
  reflector: {
    id: 'reflector',
    name: 'プリズムリフレクター',
    hp: 420,
    armor: 0.15,
    speed: 62,
    reward: 48,
    nexusDamage: 3,
    color: '#e040fb',
    size: 17,
    shape: 'reflector',
    reflectEnergy: true,
    energyDamageReduction: 0.40,
    explosiveVulnerability: 1.8,
    score: 95
  },
  dreadnought: {
    id: 'dreadnought',
    name: 'ドレッドノート',
    hp: 1150,
    shield: 750,
    armor: 0.35,
    speed: 46,
    reward: 95,
    nexusDamage: 4,
    color: '#ff9100',
    size: 22,
    shape: 'dreadnought',
    attacksTowers: true,
    attackRange: 165,
    attackCooldown: 5.0,
    empDuration: 3.0,
    shieldAura: true,
    shieldAuraRange: 85,
    score: 220
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
    nexusDamage: 5,
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
    hp: 6500,
    shield: 2200,
    speed: 46,
    reward: 300,
    nexusDamage: 7,
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
    hp: 8500,
    shield: 2600,
    armor: 0.35,
    speed: 44,
    reward: 500,
    nexusDamage: 10,
    color: '#00f0ff',
    size: 32,
    shape: 'boss_omega',
    score: 2000,
    coreDrop: 40
  },
  boss_leviathan: {
    id: 'boss_leviathan',
    name: 'アビス レヴィアサン',
    isBoss: true,
    hp: 13500,
    shield: 4800,
    armor: 0.40,
    speed: 36,
    reward: 850,
    nexusDamage: 12,
    color: '#76ff03',
    size: 36,
    shape: 'boss_leviathan',
    attacksTowers: true,
    attackRange: 210,
    attackCooldown: 5.5,
    empDuration: 3.5,
    spawnsMinions: 'kamikaze',
    spawnMinionCooldown: 7.0,
    score: 4500,
    coreDrop: 60
  }
};

// Maps Definition
export const MAPS = [
  {
    id: 'nexus_prime',
    name: '01. ALPHA CIRCUIT',
    desc: '標準的なS字防衛ライン。基本配置とシナジーを学ぶのに最適。',
    difficulty: 'EASY',
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
    difficulty: 'NORMAL',
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
    difficulty: 'HARD',
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
    difficulty: 'EXPERT',
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
  },
  {
    id: 'twin_bastion',
    name: '05. TWIN BASTION',
    desc: '左右に分かれた2基のネクサスを同時防衛する超緊迫の複合作戦区域。',
    difficulty: 'HARD',
    wavesCount: 40,
    baseHp: 25,
    startGold: 500,
    coreReward: 50,
    gridWidth: 16,
    gridHeight: 10,
    nexuses: [
      { x: 2, y: 5, label: 'ALPHA' },
      { x: 13, y: 5, label: 'BETA' }
    ],
    nexus: { x: 2, y: 5 }, // primary fallback
    paths: [
      [
        { x: 0, y: 2 },
        { x: 4, y: 2 },
        { x: 4, y: 5 },
        { x: 2, y: 5 }
      ],
      [
        { x: 15, y: 2 },
        { x: 11, y: 2 },
        { x: 11, y: 5 },
        { x: 13, y: 5 }
      ],
      [
        { x: 2, y: 9 },
        { x: 2, y: 7 },
        { x: 5, y: 7 },
        { x: 5, y: 5 },
        { x: 2, y: 5 }
      ],
      [
        { x: 13, y: 9 },
        { x: 13, y: 7 },
        { x: 10, y: 7 },
        { x: 10, y: 5 },
        { x: 13, y: 5 }
      ]
    ],
    spawnPoints: [
      { x: 0, y: 2 },
      { x: 15, y: 2 },
      { x: 2, y: 9 },
      { x: 13, y: 9 }
    ]
  },
  {
    id: 'hyper_corridor',
    name: '06. HYPER HIGHWAY',
    desc: '中央を貫く直線ハイウェイと外周迂回線。超高速強襲部隊を迎え撃て。',
    difficulty: 'HARD',
    wavesCount: 42,
    baseHp: 20,
    startGold: 480,
    coreReward: 60,
    gridWidth: 16,
    gridHeight: 10,
    paths: [
      // Fast straight middle
      [
        { x: 0, y: 4 },
        { x: 14, y: 4 }
      ],
      // Upper detour
      [
        { x: 0, y: 1 },
        { x: 7, y: 1 },
        { x: 7, y: 4 },
        { x: 14, y: 4 }
      ],
      // Lower detour
      [
        { x: 0, y: 8 },
        { x: 10, y: 8 },
        { x: 10, y: 4 },
        { x: 14, y: 4 }
      ]
    ],
    nexus: { x: 14, y: 4 },
    spawnPoints: [
      { x: 0, y: 4 },
      { x: 0, y: 1 },
      { x: 0, y: 8 }
    ]
  },
  {
    id: 'neon_labyrinth',
    name: '07. NEON LABYRINTH',
    desc: '複雑に入り組む巨大迷路回路。蛇行地点での集中砲火と範囲殲滅が鍵。',
    difficulty: 'EXPERT',
    wavesCount: 45,
    baseHp: 25,
    startGold: 500,
    coreReward: 80,
    gridWidth: 16,
    gridHeight: 10,
    paths: [
      [
        { x: 0, y: 0 },
        { x: 14, y: 0 },
        { x: 14, y: 2 },
        { x: 2, y: 2 },
        { x: 2, y: 4 },
        { x: 14, y: 4 },
        { x: 14, y: 6 },
        { x: 2, y: 6 },
        { x: 2, y: 8 },
        { x: 12, y: 8 },
        { x: 12, y: 9 },
        { x: 8, y: 9 }
      ]
    ],
    nexus: { x: 8, y: 9 },
    spawnPoints: [{ x: 0, y: 0 }]
  },
  {
    id: 'quantum_singularity',
    name: '08. QUANTUM VOID',
    desc: '全方位8箇所から同時侵攻する究極の試練。防衛線の死角は一切許されない。',
    difficulty: 'NIGHTMARE',
    wavesCount: 55,
    baseHp: 30,
    startGold: 650,
    coreReward: 150,
    gridWidth: 16,
    gridHeight: 10,
    paths: [
      // 4 corners
      [
        { x: 0, y: 0 },
        { x: 4, y: 4 },
        { x: 8, y: 4 }
      ],
      [
        { x: 15, y: 0 },
        { x: 12, y: 4 },
        { x: 8, y: 4 }
      ],
      [
        { x: 0, y: 9 },
        { x: 4, y: 6 },
        { x: 8, y: 6 },
        { x: 8, y: 5 }
      ],
      [
        { x: 15, y: 9 },
        { x: 12, y: 6 },
        { x: 8, y: 6 },
        { x: 8, y: 5 }
      ],
      // 4 cardinals
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
        { x: 8, y: 4 }
      ],
      [
        { x: 8, y: 9 },
        { x: 8, y: 5 }
      ]
    ],
    nexus: { x: 8, y: 5 },
    spawnPoints: [
      { x: 0, y: 0 },
      { x: 15, y: 0 },
      { x: 0, y: 9 },
      { x: 15, y: 9 },
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
    icon: 'satellite',
    desc: '指定座標に超高出力の衛星レーザーを投下し、広範囲の敵に大打撃を与える。',
    cooldown: 35,
    damage: 950,
    radius: 95,
    needsTarget: true
  },
  emp: {
    id: 'emp',
    name: 'EMPサージ',
    icon: 'zap',
    desc: '画面内の全敵を4秒間完全に麻痺させ、シールドを半減させる。',
    cooldown: 45,
    duration: 4.0,
    shieldDamagePercent: 0.5,
    needsTarget: false
  },
  overcharge: {
    id: 'overcharge',
    name: 'オーバードライブ',
    icon: 'rocket',
    desc: '10秒間、すべてのタワーの攻撃速度を+100%増加させる。',
    cooldown: 50,
    duration: 10.0,
    speedBoost: 1.0,
    needsTarget: false
  },
  supply: {
    id: 'supply',
    name: '緊急補給',
    icon: 'core',
    desc: '緊急支援クレジットを即座に投下し、資金を獲得する。',
    cooldown: 60,
    goldAmount: 250,
    needsTarget: false
  }
};

// Commander Skills Tactical Guide
export const SKILLS_GUIDE = [
  {
    id: 'orbital',
    name: '軌道爆撃 (Orbital Strike)',
    icon: 'satellite',
    color: '#00f0ff',
    targetType: '地点指定型（タップして照準）',
    cooldown: 35,
    effect: '950ダメージ（着弾点中心の超広範囲爆発）',
    desc: '衛星軌道上の高エネルギー荷電粒子砲より、地上へ直撃爆撃を敢行する決戦兵器。',
    usage: '1. 下部スキルバーの【軌道爆撃】ボタンをタップ（照準モード開始）\n2. マップ上の敵が密集したマスやボスをタップすると、青い照準レティクルが合致し即座にレーザーが投下されます。',
    tips: [
      '敵がカーブや合流地点に密集している瞬間に撃ち込むと、1回の砲撃で群れを丸ごと消滅させられる。',
      'ボス周辺の雑魚部隊を一掃し、味方タワーの単体攻撃（レールガン等）がボスに集中する状況を作るのにも有効。',
      '研究所の【指令部冷却システム】を強化すれば、再使用までの時間を大幅に短縮可能。'
    ]
  },
  {
    id: 'emp',
    name: 'EMPサージ (EMP Shockwave)',
    icon: 'zap',
    color: '#b84dff',
    targetType: '全域即時発動型',
    cooldown: 45,
    effect: '4秒間完全スタン ＋ 敵シールド50%消滅',
    desc: '戦場全域に高密度電磁パルスを放ち、すべての敵の電子回路を4秒間完全に沈黙させると同時に、青いエネルギーシールドを半減させる。',
    usage: '下部スキルバーの【EMPサージ】ボタンをタップするだけで、照準不要で画面内のすべての敵へ即座に衝撃波が到達します。',
    tips: [
      '高速スカウトや透明化中のファントムが拠点の直前に迫った時の「緊急停止ブレーキ」として絶大。',
      'ボスの強大なシールドを強制的に半分吹き飛ばす開幕の一手としても超強力。',
      'テスラコイルと併用すれば、残ったシールドも一瞬で粉砕可能。'
    ]
  },
  {
    id: 'overcharge',
    name: 'オーバードライブ (Overcharge)',
    icon: 'rocket',
    color: '#ffd000',
    targetType: '全域即時発動型',
    cooldown: 50,
    effect: '10秒間、全タワー攻撃速度 +100%（2倍連射）',
    desc: '全防衛システムのリアクターを過負荷駆動させ、配置済みの全タワーの射撃レートを10秒間2倍に引き上げる。',
    usage: '下部スキルバーの【オーバードライブ】ボタンをタップすると即時発動。全タワーの砲身が一斉に超高速連射を開始します。',
    tips: [
      '大型ボスが自陣の最もタワーが密集したキルゾーン（集中砲火エリア）に入った瞬間に発動するのがベスト。',
      'ガトリング（バルカン）やレーザーなど手数型のタワーと組み合わせると、秒間ダメージが爆発的に跳ね上がる。'
    ]
  },
  {
    id: 'supply',
    name: '緊急物資投下 (Supply Drop)',
    icon: 'gold',
    color: '#00ff9d',
    targetType: '即時補給型',
    cooldown: 60,
    effect: '+250 クレジット即時受領',
    desc: '司令部からの緊急支援カプセルを受領し、250クレジットの追加軍資金を即座にチャージする。',
    usage: '下部スキルバーの【緊急補給】ボタンをタップするだけで、所持クレジットが即時 +250 増加します。',
    tips: [
      '序盤のタワー設置資金が足りない時や、急遽新タワーの追加や分岐進化を行いたい時にいつでも使用可能。',
      'クールダウンが終わるたびに積極的に使用することで、ミッション全体の獲得資金が飛躍的に増加する。'
    ]
  }
];

// Permanent Tech Tree / Laboratory
export const TECH_TREE = [
  {
    id: 'starting_gold',
    name: '初期予算増強',
    icon: 'gold',
    desc: 'ステージ開始時の初期所持クレジットを増加。',
    maxLevel: 10,
    costPerLevel: (lvl) => Math.floor(10 * Math.pow(1.4, lvl)),
    effectPerLevel: 30, // +30 gold per level
    format: (val) => `+${val} G`
  },
  {
    id: 'tower_damage',
    name: '高密度エネルギー弾頭',
    icon: 'damage',
    desc: 'すべてのタワーの基本攻撃力を永続強化。',
    maxLevel: 10,
    costPerLevel: (lvl) => Math.floor(15 * Math.pow(1.45, lvl)),
    effectPerLevel: 0.05, // +5% damage per level
    format: (val) => `+${Math.round(val * 100)}%`
  },
  {
    id: 'fire_rate',
    name: '超伝導サーボモーター',
    icon: 'rate',
    desc: 'すべてのタワーの攻撃速度を向上。',
    maxLevel: 10,
    costPerLevel: (lvl) => Math.floor(15 * Math.pow(1.45, lvl)),
    effectPerLevel: 0.04, // +4% attack speed per level
    format: (val) => `+${Math.round(val * 100)}%`
  },
  {
    id: 'tower_range',
    name: '長距離センサー網',
    icon: 'range',
    desc: 'すべてのタワーの射程範囲を拡大。',
    maxLevel: 8,
    costPerLevel: (lvl) => Math.floor(20 * Math.pow(1.5, lvl)),
    effectPerLevel: 0.04, // +4% range per level
    format: (val) => `+${Math.round(val * 100)}%`
  },
  {
    id: 'crit_matrix',
    name: 'クリティカルマトリクス',
    icon: 'target',
    desc: '全タワーにクリティカル発動チャンスを付与。',
    maxLevel: 8,
    costPerLevel: (lvl) => Math.floor(25 * Math.pow(1.55, lvl)),
    effectPerLevel: 0.03, // +3% crit chance per level
    format: (val) => `+${Math.round(val * 100)}%`
  },
  {
    id: 'skill_cooldown',
    name: '指令部冷却システム',
    icon: 'clock',
    desc: '全司令官スキルのクールダウン時間を短縮。',
    maxLevel: 6,
    costPerLevel: (lvl) => Math.floor(30 * Math.pow(1.6, lvl)),
    effectPerLevel: 0.05, // -5% CD per level
    format: (val) => `-${Math.round(val * 100)}%`
  },
  {
    id: 'core_scrapper',
    name: 'スクラップ還元装置',
    icon: 'wrench',
    desc: '敵撃破時に得られるクレジットが上昇。',
    maxLevel: 8,
    costPerLevel: (lvl) => Math.floor(18 * Math.pow(1.5, lvl)),
    effectPerLevel: 0.05, // +5% gold per kill
    format: (val) => `+${Math.round(val * 100)}%`
  },
  {
    id: 'base_nanites',
    name: 'ナノ修復フィールド',
    icon: 'shield',
    desc: '拠点HPを増加させ、ウェーブ終了時にHPを自動修復。',
    maxLevel: 6,
    costPerLevel: (lvl) => Math.floor(20 * Math.pow(1.5, lvl)),
    effectPerLevel: 3, // +3 max hp & repair
    format: (val) => `HP +${val}`
  },
  {
    id: 'interest_banking',
    name: '金融運用アルゴリズム',
    icon: 'gold',
    desc: 'ウェーブクリア時、所持クレジットに応じた利子ボーナスを獲得。',
    maxLevel: 5,
    costPerLevel: (lvl) => Math.floor(25 * Math.pow(1.5, lvl)),
    effectPerLevel: 0.01, // +1% interest per level up to 5%
    format: (val) => `利子 +${Math.round(val * 100)}%`
  },
  {
    id: 'crit_devastation',
    name: '高調波過負荷弾頭',
    icon: 'target',
    desc: 'クリティカル発生時のダメージ倍率（基本2.0倍）をさらに向上。',
    maxLevel: 6,
    costPerLevel: (lvl) => Math.floor(30 * Math.pow(1.5, lvl)),
    effectPerLevel: 0.15, // +15% crit multiplier per level (up to 2.9x)
    format: (val) => `会心倍率 +${Math.round(val * 100)}%`
  },
  {
    id: 'heavy_ordnance',
    name: '対要塞徹甲兵装',
    icon: 'damage',
    desc: '巨大ボスおよびヘビータンクに対する全タワーの与ダメージを向上。',
    maxLevel: 6,
    costPerLevel: (lvl) => Math.floor(28 * Math.pow(1.5, lvl)),
    effectPerLevel: 0.06, // +6% boss/heavy damage per level
    format: (val) => `対大型 +${Math.round(val * 100)}%`
  },
  {
    id: 'protocol_reroll',
    name: '量子分岐予測プロセッサ',
    icon: 'core',
    desc: '戦術プロトコル選択時に候補を再抽選（リロール）できる回数を付与。',
    maxLevel: 3,
    costPerLevel: (lvl) => Math.floor(45 * Math.pow(1.8, lvl)),
    effectPerLevel: 1, // +1 reroll per level
    format: (val) => `リロール +${val}回`
  }
];

// Achievements
export const ACHIEVEMENTS = [
  { id: 'first_kill', title: '初陣', desc: '初めて敵を1体撃破する。', reward: 5, check: (s) => s.totalKills >= 1 },
  { id: 'kills_100', title: '殲滅部隊', desc: '累計100体の敵を撃破する。', reward: 15, check: (s) => s.totalKills >= 100 },
  { id: 'kills_1000', title: 'サイバーウォーロード', desc: '累計1000体の敵を撃破する。', reward: 50, check: (s) => s.totalKills >= 1000 },
  { id: 'kills_5000', title: '殲滅の化身', desc: '累計5000体の敵を撃破する。', reward: 100, check: (s) => s.totalKills >= 5000 },
  { id: 'wave_10', title: '初期防衛線', desc: 'ウェーブ10に到達する。', reward: 10, check: (s) => s.highestWave >= 10 },
  { id: 'wave_30', title: 'ベテラン司令官', desc: 'ウェーブ30に到達する。', reward: 30, check: (s) => s.highestWave >= 30 },
  { id: 'wave_50', title: '不落の要塞', desc: 'ウェーブ50に到達する。', reward: 80, check: (s) => s.highestWave >= 50 },
  { id: 'wave_100', title: '無限の防壁', desc: 'ウェーブ100に到達する。', reward: 150, check: (s) => s.highestWave >= 100 },
  { id: 'boss_kill', title: '巨兵落とし', desc: '初めてボス敵を撃破する。', reward: 25, check: (s) => s.bossesDefeated >= 1 },
  { id: 'boss_10', title: 'タイタンバスター', desc: '累計10体のボスを撃破する。', reward: 60, check: (s) => s.bossesDefeated >= 10 },
  { id: 'boss_50', title: 'タイタンスレイヤー', desc: '累計50体のボスを撃破する。', reward: 120, check: (s) => s.bossesDefeated >= 50 },
  
  // Stages
  { id: 'stage_clear_1', title: 'Alpha制覇', desc: 'Stage 01 をクリアする。', reward: 20, check: (s) => s.stagesCleared?.includes('nexus_prime') },
  { id: 'stage_clear_2', title: 'Twin Cross制覇', desc: 'Stage 02 をクリアする。', reward: 35, check: (s) => s.stagesCleared?.includes('dual_cross') },
  { id: 'stage_clear_3', title: 'Maze走破', desc: 'Stage 03 をクリアする。', reward: 50, check: (s) => s.stagesCleared?.includes('silicon_maze') },
  { id: 'stage_clear_4', title: 'Vortex完全防衛', desc: 'Stage 04 をクリアする。', reward: 100, check: (s) => s.stagesCleared?.includes('vortex_core') },
  { id: 'stage_clear_5', title: 'Twin Bastion制覇', desc: 'Stage 05 をクリアする。', reward: 60, check: (s) => s.stagesCleared?.includes('twin_bastion') },
  { id: 'stage_clear_6', title: 'Hyper Highway走破', desc: 'Stage 06 をクリアする。', reward: 70, check: (s) => s.stagesCleared?.includes('hyper_corridor') },
  { id: 'stage_clear_7', title: 'Labyrinth踏破', desc: 'Stage 07 をクリアする。', reward: 90, check: (s) => s.stagesCleared?.includes('neon_labyrinth') },
  { id: 'stage_clear_8', title: 'Void特異点破壊', desc: 'Stage 08 をクリアする。', reward: 180, check: (s) => s.stagesCleared?.includes('quantum_singularity') },

  // Difficulties & Modifiers
  { id: 'diff_hard', title: '試練の克服者', desc: '難易度HARD以上でいずれかのステージをクリア。', reward: 40, check: (s) => s.hardClears >= 1 },
  { id: 'diff_nightmare', title: '悪夢の支配者', desc: '難易度NIGHTMAREでいずれかのステージをクリア。', reward: 100, check: (s) => s.nightmareClears >= 1 },
  { id: 'mutator_3', title: '極限戦術家', desc: 'デンジャー変異体を3つ以上同時に有効にしてクリア。', reward: 50, check: (s) => s.maxModifiersCleared >= 3 },
  { id: 'mutator_all', title: '絶対防衛の神話', desc: '全6種の変異体をすべて有効にしてステージをクリア。', reward: 200, check: (s) => s.maxModifiersCleared >= 6 },

  // Tactical Protocols
  { id: 'protocol_first', title: '戦術プロトコル起動', desc: '初めて戦術プロトコルを選択・獲得する。', reward: 15, check: (s) => (s.protocolsChosen || 0) >= 1 },
  { id: 'protocol_10', title: '技術の集積', desc: '累計10枚の戦術プロトコルを獲得する。', reward: 40, check: (s) => (s.protocolsChosen || 0) >= 10 },
  { id: 'protocol_epic', title: '神話級オーバードライブ', desc: 'EPICレアリティの戦術プロトコルを獲得する。', reward: 50, check: (s) => s.epicProtocolsFound >= 1 },

  // Tower Mastery
  { id: 'mastery_lvl1', title: '砲手への第一歩', desc: 'いずれかのタワーで熟練度Lv.1に到達する。', reward: 20, check: (s) => s.maxMasteryLevel >= 1 },
  { id: 'mastery_lvl3', title: 'ベテランクルー', desc: 'いずれかのタワーで熟練度Lv.3に到達する。', reward: 50, check: (s) => s.maxMasteryLevel >= 3 },
  { id: 'mastery_lvl5', title: 'グランドマスター砲撃手', desc: 'いずれかのタワーで熟練度Lv.5（最大）に到達する。', reward: 120, check: (s) => s.maxMasteryLevel >= 5 },
  { id: 'all_mastery_1', title: '全兵科習熟', desc: '全8種類のタワーすべてで熟練度Lv.1以上に到達する。', reward: 80, check: (s) => s.allTowersMastery1 },

  // General & Challenges
  { id: 'all_towers', title: '技術の結晶', desc: '全8種類のタワーを1度以上建設する。', reward: 30, check: (s) => s.towersBuiltCount >= 8 },
  { id: 'upgrade_path', title: '特化進化', desc: 'タワーの分岐進化（Path A / B）を実行する。', reward: 15, check: (s) => s.evolvedTowers >= 1 },
  { id: 'skill_master', title: '戦略支援', desc: '司令官スキルを累計20回使用する。', reward: 25, check: (s) => s.skillsUsed >= 20 },
  { id: 'rich_commander', title: '大富豪', desc: 'ゲーム中に一度に1500クレジット以上所持する。', reward: 30, check: (s) => s.maxGoldHold >= 1500 },
  { id: 'ultra_rich', title: '量子財閥', desc: 'ゲーム中に一度に3000クレジット以上所持する。', reward: 60, check: (s) => s.maxGoldHold >= 3000 },
  { id: 'researcher', title: '研究開発', desc: '研究所でアップグレードを累計10回購入する。', reward: 30, check: (s) => s.totalTechBought >= 10 },
  { id: 'tech_titan', title: '科学技術の最高峰', desc: '研究所でアップグレードを累計30回購入する。', reward: 100, check: (s) => s.totalTechBought >= 30 },
  { id: 'flawless', title: '完全防衛 (Flawless)', desc: 'ノーダメージ（拠点HPMAXのまま）でステージをクリア。', reward: 50, check: (s) => s.flawlessVictory }
];
