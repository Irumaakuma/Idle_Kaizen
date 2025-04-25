function renderSidebar() {
  document.getElementById("money-display").textContent = formatNumber(player.berries);

  const job = jobs.find(j => j.id === player.currentJobId);
  const revenuExact = job ? applySpeed(job.getIncome()) : 0;
  const totalCost = window.getTotalShopCost?.() || 0;
  const net = revenuExact - totalCost;

  // ✅ Affichage revenu & dépenses
  document.getElementById("income-display").textContent = `${revenuExact.toFixed(2)}`;
  document.getElementById("expense-display").textContent = `${totalCost.toFixed(2)}`;

  // ✅ Solde net
  const sidebarBlock = document.querySelector(".sidebar-block:nth-child(2)");
  let netLine = document.getElementById("net-daily-result");
  if (!netLine) {
    netLine = document.createElement("div");
    netLine.id = "net-daily-result";
    sidebarBlock.appendChild(netLine);
  }
  netLine.textContent = `📉 Solde net : ${net >= 0 ? "+" : ""}${net.toFixed(2)} / jour`;
  netLine.style.color = net >= 0 ? "#00e676" : "#ff5252";

  // 💼 Job actif
  if (job) {
    document.getElementById("current-job-display").textContent = `${job.name} (Nv. ${job.level})`;
    document.getElementById("current-job-bar").style.width = `${job.getProgress()}%`;
  } else {
    document.getElementById("current-job-display").textContent = "Aucun";
    document.getElementById("current-job-bar").style.width = "0%";
  }

  // 📚 Compétence active
  const skill = player.skills[player.currentSkillId];
  if (skill) {
    document.getElementById("current-skill-display").textContent = `${skill.name} (Nv. ${skill.level})`;
    document.getElementById("current-skill-bar").style.width = `${skill.getProgress()}%`;
  } else {
    document.getElementById("current-skill-display").textContent = "Aucune";
    document.getElementById("current-skill-bar").style.width = "0%";
  }

  // ❤️ Bonheur ou mort
  const bonheur = player.dead ? "💀 Mort" : player.happiness.toFixed(2);
  document.getElementById("happiness-display").textContent = bonheur;

  // 🧓 Espérance de vie
  const lifespan = document.querySelector(".lifespan");
  if (lifespan) {
    lifespan.textContent = `Durée de vie estimée : ${Math.floor(player.maxAge)} ans`;
  }

  // 🏳️ Faction
  const faction = player.faction === "marine"
    ? "⚓ Marine"
    : player.faction === "pirate"
    ? "🏴‍☠️ Pirate"
    : "Civil";
  const rank = getFactionRank?.() || "";
  document.getElementById("faction-display").textContent =
    `${faction}${rank && faction !== "Civil" ? " (" + rank + ")" : ""}`;

  // 🧭 Log Pose fusionné ici
  const existing = document.getElementById("log-pose-box");
  if (existing) existing.remove();

  if (player.hasLogPose) {
    const logBox = document.createElement("div");
    logBox.id = "log-pose-box";
    logBox.style.color = "#00e5ff";
    logBox.style.marginTop = "10px";

    let content = `<hr><strong>🧭 Log Pose</strong><br>`;

    if (player.dailyBonus?.duration > 0) {
      const type = player.dailyBonus.type === "positive" ? "🌟 Bonus" : "⚠️ Malus";
      const effect = player.dailyBonus.effect || "Effet inconnu";

      const seconds = player.dailyBonus.duration * 10;
      const min = Math.floor(seconds / 60);
      const sec = seconds % 60;

      const chanceBoost = player.skills.cartographie?.getEventChanceBoost?.(player.skills.cartographie.level || 0) || 0;
      const chance = (15 + chanceBoost * 100).toFixed(2);

      content += `
        Événement actif : ${type}<br>
        Effet : ${effect}<br>
        Temps restant : ${min}m ${sec.toString().padStart(2, "0")}s<br>
        Chance estimée d'événement : ${chance}%
      `;
    } else {
      content += `🔍 Aucune perturbation active.`;
    }

    logBox.innerHTML = content;
    document.getElementById("sidebar").appendChild(logBox);
  }

  renderFactionChoice();
  unlockSkillsProgressively();
}





function updateTimeUI() {
  const totalDays = player.dayVisual || 1;
  const age = Math.floor(totalDays / 365);
  const dayOfYear = totalDays % 365;

  document.getElementById("display-age").textContent = 14 + age;
  document.getElementById("day-count").textContent = dayOfYear;

  // 🔥 Suppression du bloc logposeSidebar ici — il est géré dans renderSidebar()
}



function renderMultiplierTable() {
  const body = document.getElementById("multipliers-table-body");
  if (!body) return;
  body.innerHTML = "";

  const fondamentales = Object.values(player.skills).filter(s => s.group === "fondamentale");

  fondamentales.forEach(skill => {
    const level = skill.level;
    const projectedBonus = (Math.floor(level / 10) * 0.1).toFixed(1);

    body.innerHTML += `
      <tr>
        <td>${skill.name}</td>
        <td>${level}</td>
        <td>+${projectedBonus}</td>
      </tr>
    `;
  });
}


function renderStats() {
  const container = document.getElementById("rpg-stats");
  if (!container) return;
  container.innerHTML = "";

  const groups = {
    fondamentale: "Compétences fondamentales",
    combat: "Compétences de combat",
    navigation: "Compétences de navigation",
    haki: "Haki"
  };

  const skillEffects = {
    // 🔰 Fondamentales...
    force: "💪 Augmente les revenus des jobs de combat",
    vigueur: "🌾 Augmente les revenus des jobs agricoles",
    agilite: "🏴‍☠️ Augmente les revenus des jobs pirates",
    intelligence: "⚓ Augmente les revenus des jobs marines",
    vitalite: "❤️ Augmente les points de vie",
    endurance: "🧬 Augmente la durée de vie maximale",
    dexterite: "⚡ Accélère la vitesse d'exécution de toutes les tâches",
  
    // ⚔️ Combat & Navigation (si tu en as déjà)
    karate_homme_poisson: "🥋 Augmente les dégâts infligés en combat PvP ",
    rokushiki: "🌀 Augmente l'esquive en combat PvP ",
    style_3_sabres: "⚔️ Chance d'infliger 3 coups simultanés ",
    frappe_du_diable: "🔥 Ignore une partie de la défense adverse en PvP",
    navigation_base: "📈 Augmente les revenus des quêtes Marine/Pirate",
    meteo: "⚡ Réduit la durée des quêtes Marine/Pirate",
  
    // 👑 Haki
    haki_armement_1: "🛡️ Boost Force, Vitalité, Vigueur, Endurance",
    haki_observation_1: "👁️ Boost Agilité, Intelligence, Dextérité",
    haki_roi: "👑 Chance d'intimider l'adversaire et lui faire passer son tour"
  };
  

  for (let groupKey in groups) {
    const groupName = groups[groupKey];
    let groupContent = "";

    const canSeeGroup =
      groupKey === "fondamentale" ||
      (groupKey === "combat" && (player.skills.force?.level || 0) >= 10) ||
      (groupKey === "navigation" && (player.skills.intelligence?.level || 0) >= 10) ||
      (groupKey === "haki" && player.showHaki === true);

    if (!canSeeGroup) continue;

    for (let key in player.skills) {
      const skill = player.skills[key];
      if (skill.group !== groupKey || !skill.unlocked) continue;

      const isActive = player.currentSkillId === skill.id;
      const levelMult = (skill.level * skill.baseEffect).toFixed(2);
      const rebirthBonus = (player.rebirthBonuses?.[skill.id] || 0).toFixed(2);
      const heritageBonus = getHeritageBonusFromSkill(skill.id).toFixed(2);
      const totalMult = (1 + parseFloat(levelMult) + parseFloat(rebirthBonus) + parseFloat(heritageBonus)).toFixed(2);

      const description = `Multiplicateur total : x${totalMult} (Niveau: +${levelMult}, Rebirth: +${rebirthBonus}, Héritage: +${heritageBonus})`;
      const boostDesc = skillEffects[skill.id] ? `<div class="skill-boost-desc">${skillEffects[skill.id]}</div>` : "";

      groupContent += `
        <div class="skill-entry ${isActive ? 'active-skill' : ''}" onclick="selectSkill('${skill.id}')">
          <strong>${skill.name}</strong> (Niveau ${skill.level})
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${skill.getProgress()}%; background: #00b894;"></div>
          </div>
          <div class="skill-description">${description}</div>
          ${boostDesc}
        </div>
      `;
    }

    if (groupContent !== "") {
      container.innerHTML += `<div class="group-title">${groupName}</div>${groupContent}`;
    }
  }
}

function renderFactionChoice() {
  const container = document.getElementById("faction-choice");
  if (!container || player.faction !== "Civil") return;

  const score = player.alignmentScore || 0;
  container.innerHTML = "";

  if (score >= 50) {
    const marineBtn = document.createElement("button");
    marineBtn.textContent = "🚓 Rejoindre la Marine";
    marineBtn.className = "faction-btn marine";
    marineBtn.onclick = () => {
      player.faction = "marine";
      showToast("🟦 Tu es maintenant un Marine !");
      updateUI();
    };
    container.appendChild(marineBtn);
  }

  if (score <= -50) {
    const pirateBtn = document.createElement("button");
    pirateBtn.textContent = "🏴‍☠️ Devenir un Pirate";
    pirateBtn.className = "faction-btn pirate";
    pirateBtn.onclick = () => {
      player.faction = "pirate";
      showToast("🟥 Tu es maintenant un Pirate !");
      updateUI();
    };
    container.appendChild(pirateBtn);
  }
}

window.renderSidebar = renderSidebar;
window.updateTimeUI = updateTimeUI;
window.renderMultiplierTable = renderMultiplierTable;
window.renderStats = renderStats;
window.renderFactionChoice = renderFactionChoice;