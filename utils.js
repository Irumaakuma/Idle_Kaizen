function formatNumber(num) {
  return num.toLocaleString();
}

function showToast(message) {
  let toast = document.getElementById("toast-message");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast-message";
    toast.className = "toast";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

function initGame() {
  checkLogin();

  // Attendre que main.js ait chargé updateUI
  const waitForUpdateUI = setInterval(() => {
    if (typeof updateUI === "function") {
      clearInterval(waitForUpdateUI);
      updateUI();
    }
  }, 50);

  setTimeout(() => {
    if (typeof player !== "undefined") {
      setInterval(updateGameLoop, 1000 / updateSpeed);
    }
  }, 100);

  setInterval(autoSaveLoop, 10000);
}




// ✅ Système d'héritage basé sur la compétence liée au job

function trackJobHeritage(jobId) {
  const job = jobs.find(j => j.id === jobId);
  if (!job || !job.group) return;

  if (!player.heritage) player.heritage = {};
  if (!player.heritage[job.group]) {
    player.heritage[job.group] = { bonus: 0, tiers: 0 };
  }

  const index = parseInt(job.id.split("_")[1]);
  if (index > player.heritage[job.group].tiers) {
    const bonusGain = 0.05 * index;
    player.heritage[job.group].tiers = index;
    player.heritage[job.group].bonus += bonusGain;
    showToast(`🏛️ Héritage débloqué : ${job.name} (+${bonusGain.toFixed(2)} bonus ${job.requiredSkill})`);
  }
}

function getHeritageBonusFromSkill(skillId) {
  const groupMap = {
    vigueur: "farm",
    force: "combat",
    agilite: "pirate",
    intelligence: "marine"
  };
  const group = groupMap[skillId];
  return player.heritage?.[group]?.bonus || 0;
}

function applySpeed(value) {
  const dexBonus = player.skills.dexterite?.getEffect() || 1;
  const happiness = player.dead ? 1 : parseFloat(player.happiness || 1);
  return value * happiness * dexBonus;
}


function applyDailyBonusEffect(value, type) {
  const bonus = player.dailyBonus;
  if (!bonus || !bonus.type || bonus.duration <= 0) return value;

  // Bonus ou malus
  if (type === "income") {
    return bonus.type === "positive" ? value * 1.15 : value * 0.75;
  }
  if (type === "interval") {
    return bonus.type === "positive" ? value * 0.85 : value * 1.2;
  }
  if (type === "price") {
    return bonus.type === "positive" ? value * 0.8 : value * 1.5;
  }

  return value;
}

function applyFactionBonusesToQuest(baseReward, baseDuration) {
  let reward = baseReward;
  let duration = baseDuration;

  if (player.faction === "marine" || player.faction === "pirate") {
    const navSkill = player.skills.navigation_base;
    const meteoSkill = player.skills.meteo;

    if (navSkill?.unlocked && typeof navSkill.getFactionRevenueBonus === "function") {
      reward *= 1 + navSkill.getFactionRevenueBonus(navSkill.level);
    }

    if (meteoSkill?.unlocked && typeof meteoSkill.getFactionSpeedBonus === "function") {
      duration *= 1 / meteoSkill.getFactionSpeedBonus(meteoSkill.level);
    }
  }

  return { reward, duration };
}


const updateSpeed = 1;
window.trackJobHeritage = trackJobHeritage;
window.getHeritageBonusFromSkill = getHeritageBonusFromSkill;
window.onload = initGame;
window.applySpeed = applySpeed;
