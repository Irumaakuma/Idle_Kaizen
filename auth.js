let currentUserId = null;
let currentUsername = null;

const clientId = "1363336518181195817";
const redirectUri = "https://kaizen-backend-fkod.onrender.com/auth/discord/callback";
window.webhookURL = "https://discord.com/api/webhooks/1363338362244567141/lM6-jUxgdgyw1eBrhgH70BbQNnco4If-AExWOijdVmcTgPI49CIrll09yZqQgleAVQoA";

// Auth vers backend
function loginWithDiscord() {
  const discordUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify`;
  window.location.href = discordUrl;
}

function checkLogin() {
  console.log("⚡ checkLogin() appelé automatiquement");

  // 1. Vérifie si déjà stocké localement
  const storedId = localStorage.getItem("discord_id");
  const storedUsername = localStorage.getItem("username");

  if (storedId && storedUsername) {
    currentUserId = storedId;
    currentUsername = storedUsername;
    window.currentUsername = storedUsername;

    console.log("✅ currentUserId récupéré depuis localStorage :", currentUserId);

    document.getElementById("login-area").innerHTML = `✅ Connecté en tant que ${currentUsername}`;
    loadPlayerData(currentUserId);

    // Nettoyer l’URL s’il y avait un hash
    window.history.replaceState({}, document.title, window.location.pathname);
    return;
  }

  // 2. Si on vient d’être redirigé depuis Discord avec des query params
  const urlParams = new URLSearchParams(window.location.search);
  const discordId = urlParams.get("discord_id");
  const username = urlParams.get("username");

  if (discordId) {
    localStorage.setItem("discord_id", discordId);
    localStorage.setItem("username", username || "Joueur");
    console.log("💾 Données enregistrées dans localStorage depuis URL");
    window.location.href = "#logged"; // redirige vers URL propre
    return;
  }

  // 3. Sinon, afficher le bouton
  console.log("🔐 Aucune session détectée — affichage du bouton login");
  document.getElementById("login-area").innerHTML = `<button onclick="loginWithDiscord()">Se connecter avec Discord</button>`;
}





function getSaveData() {
  const cleanSkills = {};
  for (let id in player.skills) {
    const s = player.skills[id];
    cleanSkills[id] = {
      id: s.id,
      name: s.name,
      level: s.level,
      xp: s.xp,
      baseEffect: s.baseEffect,
      baseXpGain: s.baseXpGain,
      group: s.group
    };
  }

  return {
    name: player.name,
    berries: player.berries,
    xp: player.xp,
    level: player.level,
    job: player.job,
    currentJobId: player.currentJobId,
    currentSkillId: player.currentSkillId,
    day: player.day,
    age: player.age,
    maxAge: player.maxAge,
    skills: cleanSkills,
    jobs: { ...player.jobs },
    questsCompleted: player.questsCompleted,
    faction: player.faction,
    discordUsername: currentUsername || "???",
    alignmentScore: player.alignmentScore || 0, // ✅ AJOUTÉ ICI
    queuedIncome: player.queuedIncome || 0,
    queuedSkillXp: player.queuedSkillXp || 0,

  };
}



async function savePlayerData(userId) {
  const skillsData = {};
  for (let id in player.skills) {
    const s = player.skills[id];
    skillsData[id] = {
      id: s.id,
      name: s.name,
      level: s.level,
      xp: s.xp,
      baseXpGain: s.baseXpGain,
      baseEffect: s.baseEffect,
      group: s.group,
      unlocked: s.unlocked
    };
  }

  const data = {
    name: player.name,
    berries: player.berries,
    xp: player.xp,
    level: player.level,
    currentJobId: player.currentJobId,
    currentSkillId: player.currentSkillId,
    jobs: player.jobs,
    skills: skillsData,
    questsCompleted: player.questsCompleted,
    happiness: player.happiness,
    hasLogPose: player.hasLogPose,
    day: player.day,
    age: player.age,
    maxAge: player.maxAge,
    dead: player.dead,
    faction: player.faction,
    alignmentScore: player.alignmentScore,
    rebirthCount: player.rebirthCount,
    rebirthBonuses: player.rebirthBonuses,
    dailyBonus: player.dailyBonus,
    heritage: player.heritage,
    pvpStats: player.pvpStats,
    _haki_armement_trigger: player._haki_armement_trigger,
    _haki_observation_trigger: player._haki_observation_trigger,
    activeShopItems: shopItems.filter(i => i.isActive).map(i => i.id)
  };

  try {
    const res = await fetch(`https://kaizen-backend-fkod.onrender.com/save/${userId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": userId
      },
      body: JSON.stringify(data)
    });

    if (res.ok) {
      const now = new Date().toLocaleTimeString();
      document.getElementById("last-save").textContent = `💾 Sauvegarde : ${now}`;
    } else {
      showToast("❌ Erreur lors de la sauvegarde !");
    }
  } catch (err) {
    console.error("❌ Erreur fetch :", err);
  }
}



async function loadPlayerData(userId) {
  try {
    const res = await fetch(`https://kaizen-backend-fkod.onrender.com/load/${userId}`, {
      headers: {
        Authorization: userId
      }
    });

    if (!res.ok) {
      console.warn("❌ Données introuvables pour cet utilisateur.");
      return;
    }

    const data = await res.json();

    Object.assign(player, {
      name: data.name || "Joueur",
      berries: data.berries || 0,
      xp: data.xp || 0,
      level: data.level || 1,
      currentJobId: data.currentJobId || null,
      currentSkillId: data.currentSkillId || null,
      jobs: data.jobs || {},
      questsCompleted: data.questsCompleted || [],
      happiness: data.happiness || 1,
      hasLogPose: data.hasLogPose || false,
      day: data.day || 1,
      age: data.age || 0,
      maxAge: data.maxAge || 30,
      dead: data.dead || false,
      faction: data.faction || "Civil",
      alignmentScore: data.alignmentScore || 0,
      rebirthCount: data.rebirthCount || 0,
      rebirthBonuses: data.rebirthBonuses || {},
      dailyBonus: data.dailyBonus || null,
      heritage: data.heritage || {},
      pvpStats: data.pvpStats || {},
      _haki_armement_trigger: data._haki_armement_trigger || false,
      _haki_observation_trigger: data._haki_observation_trigger || false
    });

    // 🔄 Reconstituer les compétences (skills)
    player.skills = {};
    for (let id in data.skills) {
      const s = data.skills[id];
      player.skills[id] = new Skill({
        id: s.id,
        name: s.name,
        baseEffect: s.baseEffect,
        baseXpGain: s.baseXpGain,
        group: s.group,
        unlocked: s.unlocked
      });
      player.skills[id].level = s.level;
      player.skills[id].xp = s.xp;
    }

    // 🛍️ Réactiver les items de boutique actifs
    shopItems.forEach(item => {
      if (data.activeShopItems?.includes(item.id)) {
        item.toggleActive(); // réactive (avec effet)
      }
    });

    console.log("✅ Données chargées :", player);
    updateUI();

  } catch (err) {
    console.error("❌ Erreur de chargement :", err);
  }
}




function forceSave() {
  if (currentUserId) {
    savePlayerData(currentUserId);

    const now = new Date();
    const time = now.toLocaleTimeString();

    try {
      fetch(webhookURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          content: `💾 Sauvegarde manuelle effectuée à ${time} pour <@${currentUserId}>`
        })
      });
    } catch (err) {
      console.warn("⚠️ Webhook Discord échoué :", err);
    }

    showToast("💾 Sauvegarde manuelle envoyée !");
  } else {
    showToast("❌ Connecte-toi avec Discord d'abord !");
  }
}

window.addEventListener("DOMContentLoaded", checkLogin);


