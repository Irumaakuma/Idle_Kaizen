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
  age: 0,
  maxAge: 30,     // ⚠️ Limite de vie fixée à 30 ans
  dead: false     // ⚠️ Nouveau flag pour gérer la mort
};

// Gagner des berries
function gainBerries(amount) {
  player.berries += amount;
}

// Gagner de l’XP de niveau général
function gainXP(amount) {
  player.xp += amount;
  if (player.xp >= player.level * 100) {
    player.xp = 0;
    player.level++;
  }
}
