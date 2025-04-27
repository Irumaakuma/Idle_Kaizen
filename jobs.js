// jobs.js (ajout des jobs de combat évolutifs)


function formatCurrency(value) {
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(2) + "M";
  if (value >= 1_000) return (value / 1_000).toFixed(2) + "k";
  return value.toFixed(2); // 👈 garde les décimales pour petits revenus
}


class Job {
  constructor({ id, name, baseIncome, interval, requiredSkill, requiredLevel, skillRequired, group, upgradesTo }) {
    this.id = id;
    this.name = name;
    this.baseIncome = baseIncome;
    this.interval = interval;
    this.requiredSkill = requiredSkill;
    this.requiredLevel = requiredLevel;
    this.skillRequired = skillRequired;
    this.group = group;
    this.upgradesTo = upgradesTo || null;
    this.level = 1;
    this.xp = 0;
  }

  getMaxXp() {
    return Math.round(100 * (this.level + 1) * Math.pow(1.01, this.level));
  }

  getProgress() {
    return Math.min(100, (this.xp / this.getMaxXp()) * 100);
  }

  getLevelMultiplier() {
    return 1 + Math.log10(this.level + 1);
  }

  getXpMultiplier() {
    const skillEffect = player.skills[this.requiredSkill]?.getEffectMultiplier() || 1;
    return skillEffect;
  }

  getXpGain() {
    const baseGain = 10;
    return baseGain * this.getXpMultiplier();
  }

  gainXp() {
    const gain = applySpeed(this.getXpGain()) / 25;
    this.xp += gain;
    if (this.xp >= this.getMaxXp()) {
      let excess = this.xp - this.getMaxXp();
      while (excess >= 0) {
        this.level++;
        excess -= this.getMaxXp();
      }
      this.xp = this.getMaxXp() + excess;
    }
    player.jobs[this.id] = { level: this.level, xp: this.xp };
  }

  getIncome() {
    const skillMult = this.getXpMultiplier();
    const levelMult = this.getLevelMultiplier();
    const agiMult = player.skills.agilite?.getEffectMultiplier() || 1;
    return this.baseIncome * levelMult * skillMult * agiMult;
  }

  run() {
    const income = applySpeed(this.getIncome()) /10;
  
    // ✅ Initialisation sécurisée
    player.queuedIncome = player.queuedIncome || 0;
  
    // 🧮 Accumuler le revenu fractionnaire
    player.queuedIncome += income;
  
    // 🐞 Debugging
    console.log(`💰 Income généré : ${income.toFixed(4)} | 📦 En attente : ${player.queuedIncome.toFixed(4)}`);
  
    // ✅ Convertir dès que >= 1
    if (player.queuedIncome >= 1) {
      const whole = Math.floor(player.queuedIncome);
      gainBerries(whole);
      player.queuedIncome -= whole;
  
      console.log(`✅ ${whole} berries gagnés. Nouveau stock : ${player.berries}`);
    }
  
    // 🔁 Gagner de l’XP du job
    this.gainXp();
  }
  

  loadSavedData() {
    if (player.jobs[this.id]) {
      this.level = player.jobs[this.id].level || 1;
      this.xp = player.jobs[this.id].xp || 0;
    } else {
      player.jobs[this.id] = { level: this.level, xp: this.xp };
    }
  }
}

const jobs = [];

const pirateNames = [
  "Voleur de port", "Petit brigand", "Bandit des mers", "Sabreur rebelle", "Flibustier",
  "Corsaire des docks", "Chasseur illégal", "Pilleur d’entrepôt", "Explorateur pirate", "Canonier errant",
  "Saccageur de navires", "Recrue pirate", "Assassin des mers", "Contrebandier", "Chef de sloop",
  "Corsaire aguerri", "Épéiste sanglant", "Mercenaire pirate", "Artilleur de bord", "Maître du pillage",
  "Capitaine pirate", "Flibustier noir", "Commandant corsaire", "Démon des eaux", "Terreur de l’océan",
  "Membre des Empires", "Supernova pirate", "Empereur émergent", "Légende des mers", "Yonkou des ténèbres",
  "Maître corsaire", "Seigneur des pirates", "Ravageur du Gouvernement", "Roi des pillards", "Furie des océans",
  "Terreur céleste", "Titan de Grand Line", "Fléau impérial", "Chasseur de trésors mythiques", "Cauchemar de la Marine",
  "Empereur vengeur", "Rebelle immortel", "Spectre des abysses", "Destructeur d’îles", "Dieu pirate",
  "Souverain sans loi", "Anarchie incarnée", "Titan du Nouveau Monde", "Seigneur de la destruction", "Roi Pirate"
];

for (let i = 0; i < pirateNames.length; i++) {
  const { reward, duration } = applyFactionBonusesToQuest(
    0.025 + i * 0.06,
    Math.max(800, 3800 - i * 32)
  );

  jobs.push(new Job({
    id: `pirate_${i + 1}`,
    name: pirateNames[i],
    baseIncome: reward,
    interval: duration,
    requiredSkill: "agilite",
    requiredLevel: i * 2 + 1,
    skillRequired: 5 + i * 4,
    group: "pirate",
    upgradesTo: i < pirateNames.length - 1 ? `pirate_${i + 2}` : null
  }));
}


const marineNames = [
  "Recrue marine", "Matelot", "Soldat de base", "Artilleur de bord", "Fusilier marin",
  "Sentinelle marine", "Espion naval", "Garde maritime", "Officier de pont", "Chef tireur",
  "Instructeur de base", "Lieutenant de ligne", "Commandant de bord", "Agent du CP1", "Patrouilleur de Grand Line",
  "Lieutenant d’élite", "Agent CP3", "Capitaine de frégate", "Agent CP5", "Vice-commandant",
  "Commandant stratégique", "Contre-amiral", "Agent CP7", "Vice-amiral", "Chef d’opérations",
  "Amiral en second", "Amiral de la flotte", "Inspecteur du Gouvernement", "Héros de la Justice", "Arbitre céleste",
  "Sage marin", "Amiral mythique", "Maître tacticien", "Chancelier naval", "Gardien du Nouveau Monde",
  "Protecteur d’Alabasta", "Commandeur du QG", "Porteur de Justice", "Voix de la Marine", "Espoir de Marijoa",
  "Main de l’équilibre", "Main céleste", "Juge impérial", "Bastion de la loi", "Maréchal des mers",
  "Surveillant des flottes", "Divinité de la Marine", "Voix du Gouvernement", "Pilier de l’ordre", "Dieu de la Justice"
];

for (let i = 0; i < marineNames.length; i++) {
  const { reward, duration } = applyFactionBonusesToQuest(
    0.025 + i * 0.06,
    Math.max(800, 3800 - i * 32)
  );

  jobs.push(new Job({
    id: `marine_${i + 1}`,
    name: marineNames[i],
    baseIncome: reward,
    interval: duration,
    requiredSkill: "intelligence",
    requiredLevel: i * 2 + 1,
    skillRequired: 5 + i * 4,
    group: "marine",
    upgradesTo: i < marineNames.length - 1 ? `marine_${i + 2}` : null
  }));
}


const farmNames = [
  "Cueilleur de baies", "Cueilleur d’herbes", "Jardinier novice", "Jardinier", "Cultivateur",
  "Planteur", "Taille-haies", "Apprenti fermier", "Fermier", "Fermier certifié",
  "Fermier confirmé", "Agriculteur", "Exploitant rural", "Spécialiste bio", "Éleveur",
  "Éleveur certifié", "Marchand de graines", "Maître composteur", "Arboriculteur", "Maître agriculteur",
  "Chef de culture", "Technicien des sols", "Hydrofermier", "Fermeur d’élite", "Fermeur indépendant",
  "Fermier d’élite", "Chef de plantation", "Agriculteur chevronné", "Superviseur rural", "Directeur de domaine",
  "Agro-scientifique", "Agro-ingénieur", "Horticulteur", "Horticulteur expert", "Conseiller agricole",
  "Agronome", "Écofermier", "Chef syndical agricole", "Fermeur autonome", "Producteur renommé",
  "Légende rurale", "Fermier mythique", "Chef de coopérative", "Cultivateur royal", "Agro-stratège",
  "Éco-magnat", "Sage de la terre", "Maître cultivateur", "Agri-légendaire", "Dieu de la moisson"
]; // (inchangé)
for (let i = 0; i < farmNames.length; i++) {
  jobs.push(new Job({
    id: `farm_${i + 1}`,
    name: farmNames[i],
    baseIncome: 0.01 + i * 0.05,
    interval: Math.max(1000, 4000 - i * 30),
    requiredSkill: "vigueur",
    requiredLevel: i === 0 ? 1 : i * 3,
    skillRequired: i === 0 ? 1 : i * 5,
    group: "farm",
    upgradesTo: i < farmNames.length - 1 ? `farm_${i + 2}` : null
  }));
}

const combatNames = [
  "Bagarreur de rue", "Apprenti boxeur", "Boxeur local", "Boxeur de tournoi", "Combattant urbain",
  "Mercenaire", "Tireur de ruelle", "Soldat à louer", "Lame de ruelle", "Chasseur de primes",
  "Assassin discret", "Gladiateur", "Protecteur privé", "Chasseur expert", "Commandant mercenaire",
  "Champion d’arène", "Artilleur", "Épéiste royal", "Combattant sacré", "Légionnaire",
  "Capitaine d’escouade", "Maître du dojo", "Shinobi", "Membre du CP6", "Commandant pirate",
  "Élite corsaire", "Instructeur de combat", "Membre d’élite", "Chef d’unité", "Maréchal de champ",
  "Exécuteur", "Sentinelle obscure", "Chef d’armes", "Garde d’élite", "Marteau sacré",
  "Tacticien armé", "Maître du sabre", "Supernova", "Éveillé du Haki", "Général de front",
  "Maître combattant", "Combattant suprême", "Champion mondial", "Colosse de guerre", "Empereur masqué",
  "Main de justice", "Juge des mers", "Roi de l’arène", "Légende martiale", "Seigneur du chaos"
]; // (les 50 noms de combat)
for (let i = 0; i < combatNames.length; i++) {
  jobs.push(new Job({
    id: `combat_${i + 1}`,
    name: combatNames[i],
    baseIncome: 0.02 + i * 0.06,
    interval: Math.max(1000, 4000 - i * 35),
    requiredSkill: "force",
    requiredLevel: i * 3 + 1,
    skillRequired: Math.max(5, i * 6 + 5),
    group: "combat",
    upgradesTo: i < combatNames.length - 1 ? `combat_${i + 2}` : null
  }));
}

function renderJobs() {
  const container = document.getElementById("jobs-tab");
  container.innerHTML = "<h2>Jobs</h2>";

  const groups = {
    farm: "Métiers agricoles",
    combat: "Métiers de combat",
    pirate: "Métiers de pirate",
    marine: "Métiers de marine"
  };

  for (let groupKey in groups) {
    const groupName = groups[groupKey];
    let groupContent = "";

    jobs.filter(job => job.group === groupKey).forEach(job => {
      const skill = job.requiredSkill ? player.skills[job.requiredSkill] : null;
      const isCurrent = player.currentJobId === job.id;
      if (!isCurrent && (!skill || !skill.unlocked || skill.level < job.skillRequired || player.jobs[job.id]?.level < job.requiredLevel)) return;

      job.loadSavedData();
      const revenuParJour = applySpeed(job.getIncome());
      
      groupContent += `
        <div class="job-entry ${isCurrent ? 'active-job' : ''}">
          <strong>${job.name}</strong> (Niveau ${job.level}) - ${formatCurrency(revenuParJour)} 💰 / jour
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${job.getProgress()}%; background: #ff6f00;"></div>
          </div>
          <button class="job-button" data-job-id="${job.id}">${isCurrent ? 'Annuler' : 'Choisir'}</button>
        </div>
      `;
    });

    if (groupContent !== "") {
      container.innerHTML += `<div class="group-title">${groupName}</div>${groupContent}`;
    }
  }
}

function selectJob(jobId) {
  console.log("➡️ Job sélectionné :", jobId);

  if (player.currentJobId === jobId) {
    console.log("🔴 Job annulé !");
    player.currentJobId = null;
  } else {
    console.log("🟢 Nouveau job activé !");
    player.currentJobId = jobId;
  }
  
  updateUI();
}
