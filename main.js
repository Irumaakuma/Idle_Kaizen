function applySpeed(value) {
  const happiness = player.dead ? 1 : parseFloat(player.happiness || 1) || 1;
  return value * happiness;
}

function sendPvpNotification(killer, victim) {
  if (!webhookURL || !killer || !victim) return;

  fetch(webhookURL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: `⚔️ **${killer}** a vaincu **${victim}** en PvP !`
    })
  })
  .then(res => {
    if (!res.ok) console.error("❌ Erreur Webhook Discord :", res.status);
    else console.log("✅ Webhook envoyé :", killer, "->", victim);
  })
  .catch(err => console.error("❌ Échec webhook :", err));
}


function updateUI() {
  renderStats();
  renderJobs();
  renderSidebar();
  renderMultiplierTable();
  renderShop();
  updateTimeUI();
  togglePvpButton();
  document.getElementById("rebirth-section").style.display = "block";


  if (player.dead) {
    // 🔁 Afficher le bouton Rebirth si mort
    const rebirthBox = document.getElementById("rebirth-section");
    if (rebirthBox) {
      rebirthBox.style.display = "block";
    }
  
    // 🔒 Désactiver tous les onglets sauf Paramètres
    document.querySelectorAll("#tabs button").forEach(btn => {
      if (!btn.textContent.includes("Paramètres")) {
        btn.disabled = true;
        btn.style.opacity = 0.4;
        btn.style.pointerEvents = "none";
      }
    });
  
    // 🚫 Forcer l'utilisateur à rester dans l'onglet Paramètres
    switchTab("settings");
  }
  
  


}

function togglePvpButton() {
  const pvpButton = document.querySelector("#tabs button[onclick=\"switchTab('pvp')\"]");
  if (!pvpButton) return;

  const replacement = document.createElement("button");
  replacement.textContent = "PvP";
  replacement.className = pvpButton.className;
  replacement.style.opacity = 1;
  replacement.style.cursor = "pointer";
  replacement.onclick = () => switchTab("pvp");

  pvpButton.replaceWith(replacement);
}



function switchTab(tabId) {
  // 🔒 Empêche de naviguer si le joueur est mort (sauf "settings")
  if (player.dead && tabId !== "settings") {
    showToast("☠️ Tu es mort ! Tu dois renaître.");
    return;
  }

  console.log("🔎 currentUserId:", currentUserId);
  console.log("🔎 faction:", player.faction);

  if (tabId === "pvp" && !currentUserId) {
    showToast("❌ Connecte-toi avec Discord pour accéder au PvP.");
    return;
  }

  document.querySelectorAll(".tab-content").forEach(div => div.style.display = "none");
  document.getElementById(`${tabId}-tab`).style.display = "block";

  document.querySelectorAll("#tabs button").forEach(btn => btn.classList.remove("active"));
  document.querySelector(`#tabs button[onclick="switchTab('${tabId}')"]`)?.classList.add("active");

  if (tabId === "skills") renderStats();
  if (tabId === "jobs") renderJobs();
  if (tabId === "shop") renderShop();
  if (tabId === "pvp") renderPvpTab();
}

// Sauvegarde la version originale de switchTab pour pouvoir la restaurer après la mort
const originalSwitchTab = switchTab;


function renderPvpTab() {
  const container = document.getElementById("pvp-tab");

  if (!currentUserId) {
    container.innerHTML = `<h2>PvP</h2><p style='color: #ff5252;'>❌ Connecte-toi avec Discord pour voir les classements.</p>`;
    return;
  }

  container.innerHTML = "<h2>Joueurs disponibles</h2><div id='player-list'></div>";

  loadAllPlayers().then(players => {
    const list = document.getElementById("player-list");
    players
      .filter(p => p.username && !p.username.includes("???"))  // ❗ On garde même les civils
      .forEach(player => {
        const pseudo = player.username.split("#")[0];
        const block = document.createElement("div");
        block.className = "pvp-entry";
        block.innerHTML = `
          <strong>${pseudo}</strong> - Faction : ${player.faction} - Force : ${player.level}
          <button onclick="challengePlayer('${player.id}')">Défier</button>
        `;
        list.appendChild(block);
      });
  });
}


function selectSkill(skillId) {
  player.currentSkillId = player.currentSkillId === skillId ? null : skillId;
  updateUI();
}

function autoSaveLoop() {
  if (typeof currentUserId !== "undefined" && currentUserId) {
    savePlayerData(currentUserId);
  }
}

function hardReset() {
  if (confirm("🧨 Es-tu sûr de vouloir supprimer **définitivement** ta sauvegarde ?")) {
    if (currentUserId) {
      fetch(`https://kaizen-backend-fkod.onrender.com/delete/${currentUserId}`, {
        method: "DELETE",
        headers: {
          "Authorization": currentUserId
        }
      }).then(res => {
        if (res.ok) {
          showToast("☠️ Données supprimées !");
          location.reload();
        } else {
          showToast("❌ Impossible de supprimer les données !");
        }
      });
    } else {
      showToast("❌ Tu dois être connecté pour faire ça.");
    }
  }
}

async function loadAllPlayers() {
  const res = await fetch("https://kaizen-backend-fkod.onrender.com/players", {
    headers: {
      "Authorization": currentUserId
    }
  });
  return await res.json();
}

async function loadOpponentData(opponentId) {
  const res = await fetch(`https://kaizen-backend-fkod.onrender.com/load/${opponentId}`, {
    headers: {
      "Authorization": opponentId
    }
  });
  return await res.json();
}

async function challengePlayer(id) {
  const opponent = await loadOpponentData(id);
  simulateCombat(player, opponent);
}

async function simulateCombat(playerA, playerB) {
  const container = document.getElementById("pvp-tab");
  const logBox = document.createElement("pre");
  logBox.className = "pvp-log";
  logBox.style.background = "#111";
  logBox.style.color = "#fff";
  logBox.style.padding = "10px";
  logBox.style.maxHeight = "300px";
  logBox.style.overflowY = "auto";
  container.appendChild(logBox);

  const nameA = currentUsername || "Toi";
  const nameB = playerB.discordUsername?.split("#")[0] || "Adversaire";

  function addLogLine(line, color = "#ccc") {
    const lineHTML = `<span style="color: ${color};">${line}</span>`;
    logBox.innerHTML += lineHTML + "<br>";
    logBox.scrollTop = logBox.scrollHeight;
  }

  const getStat = (p, stat) => p.skills?.[stat]?.level || 0;
  const statsA = {
    name: nameA,
    hp: 10 + getStat(playerA, "vitalite") * 3,
    force: getStat(playerA, "force"),
    vigueur: getStat(playerA, "vigueur"),
    agilite: getStat(playerA, "agilite"),
    dexterite: getStat(playerA, "dexterite")
  };

  const statsB = {
    name: nameB,
    hp: 10 + getStat(playerB, "vitalite") * 3,
    force: getStat(playerB, "force"),
    vigueur: getStat(playerB, "vigueur"),
    agilite: getStat(playerB, "agilite"),
    dexterite: getStat(playerB, "dexterite")
  };

  let tour = 1;
  await addLogLine(`⚔️ Combat entre ${statsA.name} et ${statsB.name}`, "#ffffff");

  async function nextTurn() {
    addLogLine(`--- Tour ${tour} ---`, "#888");
    addLogLine(`${statsA.name} PV: ${statsA.hp.toFixed(2)} | ${statsB.name} PV: ${statsB.hp.toFixed(2)}`, "#888");

    // Attaque du joueur
    await new Promise(r => setTimeout(r, 3000));
    if (Math.random() * 100 >= statsB.agilite - statsA.dexterite) {
      const dmg = Math.max(1, statsA.force - statsB.vigueur);
      statsB.hp -= dmg;
      await addLogLine(`✅ ${statsA.name} inflige ${dmg.toFixed(1)} dégâts à ${statsB.name}`, "limegreen");
    } else {
      await addLogLine(`✅ ${statsB.name} esquive l'attaque de ${statsA.name}`, "limegreen");
    }

    if (statsB.hp <= 0) {
      await addLogLine(`🏆 Victoire de ${statsA.name}`, "#00b0ff");
      await addLogLine(`${statsA.name} PV restants : ${Math.max(0, statsA.hp).toFixed(2)} | ${statsB.name} PV restants : 0`, "#00b0ff");
      sendPvpNotification(statsA.name, statsB.name);
      return;
    }

    // Attaque de l’ennemi
    await new Promise(r => setTimeout(r, 3000));
    if (Math.random() * 100 >= statsA.agilite - statsB.dexterite) {
      const dmg = Math.max(1, statsB.force - statsA.vigueur);
      statsA.hp -= dmg;
      await addLogLine(`❌ ${statsB.name} inflige ${dmg.toFixed(1)} dégâts à ${statsA.name}`, "tomato");
    } else {
      await addLogLine(`❌ ${statsA.name} esquive l'attaque de ${statsB.name}`, "tomato");
    }

    if (statsA.hp <= 0) {
      await addLogLine(`🏆 Victoire de ${statsB.name}`, "#00b0ff");
      await addLogLine(`${statsA.name} PV restants : 0 | ${statsB.name} PV restants : ${Math.max(0, statsB.hp).toFixed(2)}`, "#00b0ff");

      sendPvpNotification(statsB.name, statsA.name);

      if (statsA.name === currentUsername) {
        player.dead = true;
        savePlayerData(currentUserId);
        await new Promise(resolve => setTimeout(resolve, 500));
        lockDeathMode(); // ✅ au lieu de triggerRebirth direct
      }

      return;
    }

    tour++;
    await nextTurn();
  }

  await nextTurn();
}

function lockDeathMode() {
  showToast("☠️ Tu es mort... Rebirth obligatoire.");

  switchTab("settings");

  document.querySelectorAll("#tabs button").forEach(btn => {
    if (!btn.textContent.includes("Paramètres")) {
      btn.disabled = true;
      btn.style.opacity = 0.3;
      btn.style.pointerEvents = "none";
    }
  });

  const rebirthBox = document.getElementById("rebirth-section");
  if (rebirthBox) {
    rebirthBox.style.display = "block";
  }

  window.switchTab = () => showToast("❌ Tu es mort... Tu dois renaître !");
}



function sendPvpStatsToDiscord() {
  const wins = player.pvpStats?.wins || 0;
  const losses = player.pvpStats?.losses || 0;
  const username = window.currentUsername || "Joueur inconnu";

  fetch("https://kaizen-backend-fkod.onrender.com/pvp-stats", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username, wins, losses })
  }).then(() => {
    showToast("📡 Ton classement a été envoyé sur Discord !");
  });
}


function sendPvpLeaderboardToDiscord() {
  fetch("https://kaizen-backend-fkod.onrender.com/pvp-leaderboard", {
    method: "POST"
  }).then(() => {
    showToast("📡 Classement PvP envoyé sur Discord !");
  });
}

function unlockSkillsProgressively() {
  const force = player.skills.force?.level || 0;
  const intelligence = player.skills.intelligence?.level || 0;
  const vitalite = player.skills.vitalite?.level || 0;
  const vigueur = player.skills.vigueur?.level || 0;
  const endurance = player.skills.endurance?.level || 0;
  const agilite = player.skills.agilite?.level || 0;
  const dexterite = player.skills.dexterite?.level || 0;

  const karate = player.skills.karate_homme_poisson?.level || 0;
  const rokushiki = player.skills.rokushiki?.level || 0;
  const sabres = player.skills.style_3_sabres?.level || 0;
  const diable = player.skills.frappe_du_diable?.level || 0;

  const nav = player.skills.navigation_base?.level || 0;
  const meteo = player.skills.meteo?.level || 0;
  const carto = player.skills.cartographie?.level || 0;
  const manoeuvre = player.skills.manoeuvre_navire?.level || 0;

  // 🗡️ Combat
  if (force >= 100 && player.skills.karate_homme_poisson) player.skills.karate_homme_poisson.unlocked = true;
  if (force >= 2500 && karate >= 1000 && player.skills.rokushiki) player.skills.rokushiki.unlocked = true;
  if (force >= 3500 && rokushiki >= 1000 && player.skills.style_3_sabres) player.skills.style_3_sabres.unlocked = true;
  if (force >= 4500 && sabres >= 2000 && player.skills.frappe_du_diable) player.skills.frappe_du_diable.unlocked = true;

  // 🧭 Navigation
  if (intelligence >= 100 && player.skills.navigation_base) player.skills.navigation_base.unlocked = true;
  if (intelligence >= 2500 && nav >= 1000 && player.skills.meteo) player.skills.meteo.unlocked = true;
  if (intelligence >= 3500 && meteo >= 1000 && player.skills.cartographie) player.skills.cartographie.unlocked = true;
  if (intelligence >= 4500 && carto >= 2000 && player.skills.manoeuvre_navire) player.skills.manoeuvre_navire.unlocked = true;

  // 🛡️ Haki de l'Armement (event + stats)
  if (
    player._haki_armement_trigger &&
    force >= 5000 && vitalite >= 5000 && vigueur >= 5000 && endurance >= 5000 &&
    player.skills.haki_armement_1 && !player.skills.haki_armement_1.unlocked
  ) {
    player.skills.haki_armement_1.unlocked = true;
    showToast("🛡️ Tu as débloqué le Haki de l'Armement !");
    player._haki_armement_trigger = false;
  }

  // 👁️ Haki de l'Observation (event + stats)
  if (
    player._haki_observation_trigger &&
    agilite >= 5000 && intelligence >= 5000 && dexterite >= 5000 &&
    player.skills.haki_observation_1 && !player.skills.haki_observation_1.unlocked
  ) {
    player.skills.haki_observation_1.unlocked = true;
    showToast("👁️ Tu as débloqué le Haki de l'Observation !");
    player._haki_observation_trigger = false;
  }

  // 👑 Haki des Rois (rebirth + stats)
  const hasCombatSkills = karate >= 1000 && rokushiki >= 1000 && sabres >= 1000 && diable >= 1000;
  const hasNavSkills = nav >= 1000 && meteo >= 1000 && carto >= 1000 && manoeuvre >= 1000;
  const rebirthChance = (player.rebirthCount || 0) * 0.01;

  if (
    hasCombatSkills && hasNavSkills &&
    player.skills.haki_roi && !player.skills.haki_roi.unlocked &&
    Math.random() < 0.01 + rebirthChance
  ) {
    player.skills.haki_roi.unlocked = true;
    showToast("👑 Tu as éveillé le Haki des Rois !");
  }
}


function applyFactionBonusesToQuest(baseReward, baseDuration) {
  let reward = baseReward;
  let duration = baseDuration;

  // ✅ Applique les bonus de revenu et vitesse si le joueur a les compétences Navigation
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


setInterval(autoSaveLoop, 10000);

window.addEventListener("DOMContentLoaded", () => {
  updateUI();

  setTimeout(() => {
    if (typeof player !== "undefined") {
      setInterval(updateGameLoop, 1000 / updateSpeed);
    }
  }, 100);
});


function startGame() {
  console.log("🚀 Lancement du jeu avec currentUserId =", currentUserId);
  updateUI();

  setTimeout(() => {
    if (typeof player !== "undefined") {
      setInterval(updateGameLoop, 1000 / updateSpeed);
    }
  }, 100);
}

window.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM prêt, vérification de currentUserId...");

  if (currentUserId) {
    startGame();
  } else {
    // Attendre que checkLogin() ait initialisé currentUserId
    setTimeout(() => {
      console.log("🔁 Retry après 200ms → currentUserId =", currentUserId);
      if (currentUserId) {
        startGame();
      } else {
        console.warn("❌ currentUserId est toujours null. Connexion Discord échouée ou non encore prête.");
      }
    }, 200);
  }
});




window.updateUI = updateUI;
window.switchTab = switchTab;
window.triggerRebirth = triggerRebirth;
window.challengePlayer = challengePlayer;
window.renderPvpTab = renderPvpTab;
window.simulateCombat = simulateCombat;
window.unlockSkillsProgressively = unlockSkillsProgressively;
window.applyFactionBonusesToQuest = applyFactionBonusesToQuest;
window.sendPvpNotification = sendPvpNotification;
