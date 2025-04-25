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
  
    // ⏱️ Avancer le temps visuel et réel
    if (jobActif || skillActif) {
      if (typeof player.dayVisual === "undefined") player.dayVisual = 1;
  
      player.day += applySpeed(1); // vitesse réelle boostée par bonheur/dextérité
  
      // Avancement du jour visuel uniquement quand un jour réel est atteint
      if (player.day >= player.dayVisual + 1) {
        player.dayVisual++;
      }
    }
  
    // 💼 Exécution du job
    if (jobActif) {
      const job = jobs.find(j => j.id === player.currentJobId);
      if (job) {
        job.run();
        checkJobEvolution();
      }
    }
  
    // 📚 XP compétence active
    if (skillActif) {
      const skill = player.skills[player.currentSkillId];
      const gain = applySpeed(skill.getXpGain?.() || 0) * 5;
  
      player.queuedSkillXp = (player.queuedSkillXp || 0) + gain;
      skill.xp += player.queuedSkillXp;
      player.queuedSkillXp = 0;
  
      while (skill.xp >= skill.getMaxXp()) {
        skill.xp -= skill.getMaxXp();
        skill.level++;
      }
  
      // UI barre de compétence
      const bar = document.getElementById("current-skill-bar");
      if (bar) bar.style.width = `${skill.getProgress()}%`;
  
      const skillDisplay = document.getElementById("current-skill-display");
      if (skillDisplay) skillDisplay.textContent = `${skill.name} (Nv. ${skill.level})`;
    }
  
    // 🛒 SHOP – Consommer coût par jour
    if (typeof player.lastShopCheckDay === "undefined") {
      player.lastShopCheckDay = Math.floor(player.day);
    }
  
    const currentDay = Math.floor(player.day);
    if (currentDay > player.lastShopCheckDay) {
      player.lastShopCheckDay = currentDay;
      manageShopItems(); // consomme les boosts actifs
    }
  
    // 🎁 Événement journalier (bonus ou malus)
    if (player.dailyBonus?.duration > 0) {
      player.dailyBonus.duration--;
      if (player.dailyBonus.duration <= 0) {
        showToast("⏳ L'effet de l'événement du jour s'est dissipé.");
        player.dailyBonus = null;
      }
    }
  
    // 👴 Vieillissement + mort
    if (jobActif || skillActif) {
      const totalDays = Math.floor(player.day);
      player.age = 14 + Math.floor(totalDays / 365);
  
      updateMaxAge();
  
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
        showToast(`☠️ Tu es mort de vieillesse à ${Math.floor(player.age)} ans...`);
      }
    }
  
    updateUI();
  }
  
  
  
  
  
  
  
  function triggerRebirth() {
    player.rebirth = (player.rebirth || 0) + 1;
  
    // ✅ Ne PAS recalculer les bonus ici (déjà faits à la mort)
    const savedBonuses = { ...player.rebirthBonuses };
  
    // 🔁 Réinitialisation du joueur
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
  
    // ❌ Désactiver tous les items shop actifs
    shopItems.forEach(item => {
      if (item.isActive) {
        item.isActive = false;
        if (typeof item.removeEffect === "function") {
          item.removeEffect();
        }
      }
    });
  
    // ✅ Réactiver les onglets de l'interface
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
      { message: "📦 Un coffre de ravitaillement t’apporte +500 berries", effect: () => player.berries += 500, givesImmediateBonus: true },
      { message: "⚙️ Tes outils sont affûtés : jobs -20% durée", effect: () => player.dailyModifiers.interval *= 0.8 },
      { message: "📚 Tu découvres une technique : +1 niveau aléatoire", effect: () => {
        const skills = Object.values(player.skills).filter(s => s.unlocked);
        if (skills.length) skills[Math.floor(Math.random() * skills.length)].level++;
      }, givesImmediateBonus: true },
      { message: "🧭 Navigation idéale : +15% revenus", effect: () => player.dailyModifiers.income *= 1.15 },
      { message: "⚒️ Entraînement optimisé : +10% XP passive", effect: () => player.dailyModifiers.xp *= 1.1 },
      { message: "🏗️ Jobs en chaîne boostés", effect: () => player.dailyModifiers.interval *= 0.85 },
      { message: "🛳️ Navigation rapide : vitesse +15%", effect: () => player.dailyModifiers.interval *= 0.85 },
      { message: "🧰 Artisanat efficace : -20% prix boutique", effect: () => player.dailyModifiers.price *= 0.8 },
      { message: "📖 Savoir tactique : +5 intelligence", effect: () => player.skills.intelligence.level += 5, givesImmediateBonus: true },
      { message: "💪 Tu es en forme : +5 force", effect: () => player.skills.force.level += 5, givesImmediateBonus: true },
      { message: "🛡️ Tu ressens une aura de protection...", effect: () => player._haki_armement_trigger = true, givesImmediateBonus: true },
      { message: "👁️ Tu entends des voix invisibles...", effect: () => player._haki_observation_trigger = true, givesImmediateBonus: true },
      { message: "👑 Un éclair traverse ton esprit...", effect: () => player._haki_roi_trigger = true, givesImmediateBonus: true },
    ],
    negative: [
      { message: "🌀 Tempête : +20% durée jobs", effect: () => player.dailyModifiers.interval *= 1.2 },
      { message: "💰 Corruption : -25% revenus", effect: () => player.dailyModifiers.income *= 0.75 },
      { message: "🧱 Chute : +15% intervalle jobs", effect: () => player.dailyModifiers.interval *= 1.15 },
      { message: "🚧 Barrage administratif : jobs +20% durée", effect: () => player.dailyModifiers.interval *= 1.2 },
      { message: "📉 Perte de mémoire : -1 niveau random", effect: () => {
        const skills = Object.values(player.skills).filter(s => s.level > 1);
        if (skills.length) skills[Math.floor(Math.random() * skills.length)].level--;
      }, givesImmediateBonus: true },
      { message: "🔩 Panne technique : -15% revenus", effect: () => player.dailyModifiers.income *= 0.85 },
      { message: "😵 Fatigue mentale : XP -10%", effect: () => player.dailyModifiers.xp *= 0.9 },
      { message: "📦 Stock abîmé : +50% prix boutique", effect: () => player.dailyModifiers.price *= 1.5 },
      { message: "💥 Retard général : +30% quêtes", effect: () => player.dailyModifiers.interval *= 1.3 },
      { message: "⚒️ Fatigue extrême : vitesse -15%", effect: () => player.dailyModifiers.interval *= 1.15 }
    ]
  };
  
function triggerDailyEvent() {
  // ⛔️ Si un événement est encore actif, ne rien faire
  if (player.dailyBonus?.duration > 0) return;

  player.dailyModifiers = { income: 1, interval: 1, price: 1, xp: 1 };
  player.canUnlockHakiToday = false;

  const eventChanceBonus = player.skills.cartographie?.getEventChanceBoost?.(player.skills.cartographie.level || 0) || 0;
  const eventDurationBonus = player.skills.manoeuvre_navire?.getEventDurationBoost?.(player.skills.manoeuvre_navire.level || 0) || 0;
  const boostedChance = 0.15 + eventChanceBonus;

  const roll = Math.random();

  if (roll < boostedChance) {
    const isPositive = Math.random() < 0.5;
    const pool = isPositive ? dailyEvents.positive : dailyEvents.negative;
    const event = pool[Math.floor(Math.random() * pool.length)];

    const isInstant = !!event.givesImmediateBonus;
    const duration = isInstant ? 1 : 30 + eventDurationBonus;

    player.dailyBonus = {
      type: isPositive ? "positive" : "negative",
      duration,
      effect: event.message,
      startTime: Date.now()
    };

    showToast(`${isPositive ? "🌟" : "⚠️"} ${event.message}`);
    event.effect();

    if (isPositive) {
      player.canUnlockHakiToday = true;
    }

    if (!isPositive && Math.random() < 0.001) {
      player.dead = true;
      showToast("☠️ Tu as été victime d'un événement fatal !");
    }
  } else {
    player.dailyBonus = null;
  }
}



function startRealTimeEventLoop() {
  setInterval(() => {
    if (player.dead) return;

    // ⏳ Réduire la durée de l’effet en cours
    if (player.dailyBonus?.duration > 0) {
      player.dailyBonus.duration--;
      if (player.dailyBonus.duration <= 0) {
        showToast("⏳ L'effet de l'événement s'est dissipé.");
        player.dailyBonus = null;
        player.dailyModifiers = { income: 1, interval: 1, price: 1, xp: 1 };
      }
      return;
    }

    // 🎲 Déclenche un nouvel événement s’il n’y en a pas
    triggerDailyEvent();

  }, 10000); // toutes les 10s IRL
}


  
  
  window.updateMaxAge = updateMaxAge;
  window.updateGameLoop = updateGameLoop;
  window.triggerRebirth = triggerRebirth;
  window.checkJobEvolution = checkJobEvolution;
  window.startRealTimeEventLoop = startRealTimeEventLoop;