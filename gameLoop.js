// ✅ gameLoop.js complet et à jour

function checkJobEvolution() {
    const currentId = player.currentJobId;
    const job = jobs.find(j => j.id === currentId);
    if (!job || !job.upgradesTo) return;
  
    const nextJob = jobs.find(j => j.id === job.upgradesTo);
    const skillLevel = player.skills[job.requiredSkill]?.level || 0;
    const jobLevel = player.jobs[job.id]?.level || 0;
  
    if (skillLevel >= nextJob.skillRequired && jobLevel >= nextJob.requiredLevel) {
      trackJobHeritage(job.id); // 🧬 Héritage enregistré
      player.currentJobId = nextJob.id;
      showToast(`⬆️ Ton métier évolue en : ${nextJob.name} !`);
    }
  }
  
  function updateMaxAge() {
    const fondamentales = Object.values(player.skills).filter(s => s.group === "fondamentale");
    const totalLevels = fondamentales.reduce((sum, s) => sum + s.level, 0);
    const bonusParNiveau = Math.floor(totalLevels / 100) * 0.1;
  
    const bonheur = parseFloat(player.happiness || 1);
    const bonusBonheur = bonheur * 0.2;
  
    const enduranceBonus = player.skills.endurance?.getEffect() || 0;
    player.maxAge = 30 + bonusParNiveau + bonusBonheur + enduranceBonus;

  }
  
  function updateGameLoop() {
    if (player.dead) return;
  
    const jobActif = !!player.currentJobId;
    const skillActif = !!player.currentSkillId && player.skills[player.currentSkillId]?.unlocked;
  
    // ✅ Avancer le temps SEULEMENT si job ou compétence active
    if (jobActif || skillActif) {
      player.day += applySpeed(1);
    }
  
    // 🔁 Exécution du job
    if (jobActif) {
      const job = jobs.find(j => j.id === player.currentJobId);
      if (job) {
        job.run();
        checkJobEvolution();
      }
    }
  
    // ✨ XP compétence (patch fluide)
    if (skillActif) {
      const skill = player.skills[player.currentSkillId];
      const SKILL_XP_MULTIPLIER = 5;
      const gain = applySpeed(skill.getXpGain?.() || 0) * SKILL_XP_MULTIPLIER;
  
      player.queuedSkillXp = (player.queuedSkillXp || 0) + gain;
      skill.xp += player.queuedSkillXp;
      player.queuedSkillXp = 0;
  
      while (skill.xp >= skill.getMaxXp()) {
        skill.xp -= skill.getMaxXp();
        skill.level++;
      }
  
      // 🎯 Mettre à jour l’interface compétence
      const bar = document.getElementById("current-skill-bar");
      if (bar) {
        bar.style.width = `${skill.getProgress()}%`;
      }
  
      const skillDisplay = document.getElementById("current-skill-display");
      if (skillDisplay) {
        skillDisplay.textContent = `${skill.name} (Nv. ${skill.level})`;
      }
    }
  
    // 🛒 Vérification automatique des items shop
    manageShopItems();
  
    // 📆 Mise à jour des événements quotidiens
    if (player.dailyBonus?.duration > 0) {
      player.dailyBonus.duration--;
      if (player.dailyBonus.duration <= 0) {
        showToast("⏳ L'effet de l'événement du jour s'est dissipé.");
        player.dailyBonus = null;
      }
    }
  
    // 📈 Mise à jour de l’âge + mort
    if (jobActif || skillActif) {
      const totalDays = Math.floor(player.day);
      player.age = 14 + Math.floor(totalDays / 365);
  
      updateMaxAge();
      manageShopItems(); // (sécurité double si jamais appelé ailleurs)
  
      if (player.age >= player.maxAge && !player.dead) {
        player.dead = true;
  
        let bonusHTML = "<ul style='margin-left: 10px;'>";
        for (let id in player.skills) {
          const skill = player.skills[id];
          if (skill.group === "fondamentale") {
            const bonus = Math.floor(skill.level / 10) * 0.1;
            if (bonus > 0) {
              player.rebirthBonuses[id] = (player.rebirthBonuses[id] || 0) + bonus;
              bonusHTML += `<li><strong>${skill.name}</strong> : +${bonus.toFixed(1)} bonus Rebirth</li>`;
            }
          }
        }
        bonusHTML += "</ul>";
  
        document.getElementById("rebirth-bonuses-list").innerHTML = bonusHTML;
        showToast("☠️ Tu es mort de vieillesse à " + Math.floor(player.age) + " ans...");
      }
    }
  
    updateUI();
  }
  
  
  
  
  
  function triggerRebirth() {
    player.rebirth = (player.rebirth || 0) + 1;
  
    // ✅ Appliquer les bonus même sans mort de vieillesse
    if (!player.rebirthBonuses) player.rebirthBonuses = {};
    let bonusHTML = "<ul style='margin-left: 10px;'>";
    for (let id in player.skills) {
      const skill = player.skills[id];
      if (skill.group === "fondamentale") {
        const bonus = Math.floor(skill.level / 10) * 0.1;
        if (bonus > 0) {
          player.rebirthBonuses[id] = (player.rebirthBonuses[id] || 0) + bonus;
          bonusHTML += `<li><strong>${skill.name}</strong> : +${bonus.toFixed(1)} bonus Rebirth</li>`;
        }
      }
    }
    bonusHTML += "</ul>";
    document.getElementById("rebirth-bonuses-list").innerHTML = bonusHTML;
  
    // 🔁 Réinitialisation du joueur
    const savedBonuses = { ...player.rebirthBonuses };
  
    Object.assign(player, {
      berries: 0,
      xp: 0,
      level: 1,
      job: "Civil",
      currentJobId: null,
      currentSkillId: null,
      day: 1,
      age: 0,
      dead: false,
      maxAge: 30,
      rebirthBonuses: savedBonuses,
      questsCompleted: [],
      hasLogPose: false,
      queuedIncome: 0,
      queuedSkillXp: 0
    });
  
    // 🔄 Réinitialiser les jobs
    player.jobs = {};
    jobs.forEach(j => {
      j.level = 1;
      j.xp = 0;
    });
  
    // 🔄 Réinitialiser les skills
    player.skills = {};
    for (let id in window.defaultSkills) {
      const base = window.defaultSkills[id];
      player.skills[id] = new Skill({
        id: base.id,
        name: base.name,
        baseXpGain: base.baseXpGain,
        baseEffect: base.baseEffect,
        group: base.group,
        unlocked: true,
        getBonusDamage: base.getBonusDamage,
        getBonusDodge: base.getBonusDodge,
        getTripleHitChance: base.getTripleHitChance,
        getIgnoreDefense: base.getIgnoreDefense,
        getEventChanceBoost: base.getEventChanceBoost,
        getEventDurationBoost: base.getEventDurationBoost,
        getFactionRevenueBonus: base.getFactionRevenueBonus,
        getFactionSpeedBonus: base.getFactionSpeedBonus,
        maxLevel: base.maxLevel
      });
    }
  
    // ✅ Réactiver l’UI
    document.querySelectorAll("#tabs button").forEach(btn => {
      btn.disabled = false;
      btn.style.opacity = 1;
      btn.style.pointerEvents = "auto";
    });
  
    // ✅ Masquer la section Rebirth
    document.getElementById("rebirth-section").style.display = "none";
  
    // ✅ Restaurer la navigation normale
    if (typeof originalSwitchTab === "function") {
      window.switchTab = originalSwitchTab;
    }
  
    showToast("🔁 Nouvelle vie lancée ! Tes bonus sont actifs.");
    updateUI();
  }
  
  
  

  // 🎲 Système complet d’événements aléatoires
const dailyEvents = {
  positive: [
    { message: "📦 Un coffre de ravitaillement t’apporte +500 berries", effect: () => player.berries += 500 },
    { message: "⚙️ Tes outils sont affûtés : jobs -20% durée", effect: () => player.dailyModifiers.interval *= 0.8 },
    { message: "📚 Tu découvres une technique : +1 niveau aléatoire", effect: () => {
      const skills = Object.values(player.skills).filter(s => s.unlocked);
      if (skills.length) skills[Math.floor(Math.random() * skills.length)].level++;
    }},
    { message: "🧭 Navigation idéale : +15% revenus", effect: () => player.dailyModifiers.income *= 1.15 },
    { message: "⚒️ Entraînement optimisé : +10% XP passive", effect: () => player.dailyModifiers.xp *= 1.1 },
    { message: "🏗️ Jobs en chaîne boostés", effect: () => player.dailyModifiers.interval *= 0.85 },
    { message: "🛳️ Navigation rapide : vitesse +15%", effect: () => player.dailyModifiers.interval *= 0.85 },
    { message: "🧰 Artisanat efficace : -20% prix boutique", effect: () => player.dailyModifiers.price *= 0.8 },
    { message: "📖 Savoir tactique : +5 intelligence", effect: () => player.skills.intelligence.level += 5 },
    { message: "💪 Tu es en forme : +5 force", effect: () => player.skills.force.level += 5 },
    { message: "🛡️ Tu ressens une aura de protection...", effect: () => player._haki_armement_trigger = true },
    { message: "👁️ Tu entends des voix invisibles...", effect: () => player._haki_observation_trigger = true },
    { message: "👑 Un éclair traverse ton esprit...", effect: () => player._haki_roi_trigger = true },

  ],
  negative: [
    { message: "🌀 Tempête : +20% durée jobs", effect: () => player.dailyModifiers.interval *= 1.2 },
    { message: "💰 Corruption : -25% revenus", effect: () => player.dailyModifiers.income *= 0.75 },
    { message: "🧱 Chute : +15% intervalle jobs", effect: () => player.dailyModifiers.interval *= 1.15 },
    { message: "🚧 Barrage administratif : jobs +20% durée", effect: () => player.dailyModifiers.interval *= 1.2 },
    { message: "📉 Perte de mémoire : -1 niveau random", effect: () => {
      const skills = Object.values(player.skills).filter(s => s.level > 1);
      if (skills.length) skills[Math.floor(Math.random() * skills.length)].level--;
    }},
    { message: "🔩 Panne technique : -15% revenus", effect: () => player.dailyModifiers.income *= 0.85 },
    { message: "😵 Fatigue mentale : XP -10%", effect: () => player.dailyModifiers.xp *= 0.9 },
    { message: "📦 Stock abîmé : +50% prix boutique", effect: () => player.dailyModifiers.price *= 1.5 },
    { message: "💥 Retard général : +30% quêtes", effect: () => player.dailyModifiers.interval *= 1.3 },
    { message: "⚒️ Fatigue extrême : vitesse -15%", effect: () => player.dailyModifiers.interval *= 1.15 }
  ]
};

function triggerDailyEvent() {
  player.dailyModifiers = { income: 1, interval: 1, price: 1, xp: 1 };
  player.canUnlockHakiToday = false;

  const eventChanceBonus = player.skills.cartographie?.getEventChanceBoost?.(player.skills.cartographie.level || 0) || 0;
  const eventDurationBonus = player.skills.manoeuvre_navire?.getEventDurationBoost?.(player.skills.manoeuvre_navire.level || 0) || 0;
  const boostedChance = 0.15 + eventChanceBonus;

  const roll = Math.random();

  if (roll < boostedChance) {
    const event = dailyEvents.positive[Math.floor(Math.random() * dailyEvents.positive.length)];
    player.dailyBonus = { type: "positive", duration: 25 + eventDurationBonus };
    player.canUnlockHakiToday = true;
    showToast("🌟 " + event.message);
    event.effect();
  } else if (roll > 0.85) {
    const event = dailyEvents.negative[Math.floor(Math.random() * dailyEvents.negative.length)];
    player.dailyBonus = { type: "negative", duration: 25 + eventDurationBonus };
    showToast("⚠️ " + event.message);
    event.effect();

    if (Math.random() < 0.001) {
      player.dead = true;
      showToast("☠️ Tu as été victime d'un événement fatal !");
    }
  } else {
    player.dailyBonus = null;
  }
}


// ⏱️ À appeler dans ta boucle journalière
if (typeof player.lastDayChecked === "undefined" || player.lastDayChecked !== Math.floor(player.day)) {
  player.lastDayChecked = Math.floor(player.day);
  triggerDailyEvent();
}
  
  
  window.updateMaxAge = updateMaxAge;
  window.updateGameLoop = updateGameLoop;
  window.triggerRebirth = triggerRebirth;
  window.checkJobEvolution = checkJobEvolution;