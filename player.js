const player = {
  name: "Inconnu",
  berries: 0,
  xp: 0,
  level: 1,
  job: "Civil",
  currentJobId: null,
  currentSkillId: null,
  jobs: {},
  skills: { ...window.defaultSkills },
  questsCompleted: [],
  happiness: 1.0,
  hasLogPose: false,

  // 🕒 Système de temps
  day: 1,
  age: 14,         // ⚠️ Âge de départ fixé à 14 ans
  maxAge: 30,     // ⚠️ Limite de vie fixée à 30 ans
  dead: false,     // ⚠️ Flag pour gérer la mort

  // test pour load le rebirth en même temps que le joueur
  rebirth: 0,
  rebirthBonuses: {},
  pvpStats: { wins: 0, losses: 0 },
  heritage: {},
  alignmentScore: 0,
  dailyBonus: null,
  faction: null
};

// ✅ Réserve pour revenus fractionnaires (ex: 0.2/jour accumulés)
player.queuedIncome = 0;
player.queuedSkillXp = 0;


// 💰 Gagner des berries
function gainBerries(amount) {
  player.berries += amount;
}

// ⭐ Gagner de l’XP de niveau général
function gainXP(amount) {
  player.xp += amount;
  if (player.xp >= player.level * 100) {
    player.xp = 0;
    player.level++;
  }
}
