// auth.js amélioré et corrigé

let currentUserId = null;
let currentUsername = null;

const clientId = "1363336518181195817";
const redirectUri = "https://kaizen-backend-fkod.onrender.com/auth/discord/callback";
window.webhookURL = "https://discord.com/api/webhooks/1363338362244567141/lM6-jUxgdgyw1eBrhgH70BbQNnco4If-AExWOijdVmcTgPI49CIrll09yZqQgleAVQoA";

function loginWithDiscord() {
  const discordUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify`;
  window.location.href = discordUrl;
}

async function checkLogin() {
  console.log("⚡ checkLogin() appelé automatiquement");

  const storedId = localStorage.getItem("discord_id");
  const storedUsername = localStorage.getItem("username");

  if (storedId && storedUsername) {
    currentUserId = storedId;
    currentUsername = storedUsername;
    window.currentUsername = storedUsername;

    console.log("✅ currentUserId récupéré depuis localStorage :", currentUserId);
    document.getElementById("login-area").innerHTML = `✅ Connecté en tant que ${currentUsername}`;
    await loadPlayerData(currentUserId);
    window.history.replaceState({}, document.title, window.location.pathname);
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const discordId = urlParams.get("discord_id");
  const username = urlParams.get("username");

  if (discordId) {
    localStorage.setItem("discord_id", discordId);
    localStorage.setItem("username", username || "Joueur");
    console.log("💾 Données enregistrées dans localStorage depuis URL");
    window.location.href = "#logged";
    return;
  }

  console.log("🔐 Aucune session détectée — affichage du bouton login");
  document.getElementById("login-area").innerHTML = `<button onclick="loginWithDiscord()">Se connecter avec Discord</button>`;
}

async function loadPlayerData(userId) {
  try {
    const res = await fetch(`https://kaizen-backend-fkod.onrender.com/load/${userId}`, {
      headers: { Authorization: userId }
    });

    if (!res.ok) {
      console.log("🆕 Aucun fichier trouvé, création d'un nouveau joueur.");
      return startGame();
    }

    const data = await res.json();
    if (!data || typeof data !== "object") {
      console.warn("⚠️ Réponse inattendue, nouveau joueur.");
      return startGame();
    }

    Object.assign(player, {
      name: data.name || "Joueur",
      berries: data.berries || 0,
      xp: data.xp || 0,
      level: data.level || 1,
      job: data.job || "Civil",
      currentJobId: data.currentJobId || null,
      currentSkillId: data.currentSkillId || null,
      day: data.day ?? 1,
      dayVisual: data.dayVisual ?? data.day ?? 1,
      age: data.age || 0,
      maxAge: data.maxAge || 30,
      dead: data.dead || false,
      hasLogPose: data.hasLogPose || false,
      happiness: data.happiness || 1,
      alignmentScore: data.alignmentScore || 0,
      rebirthCount: data.rebirthCount || 0,
      rebirthBonuses: data.rebirthBonuses || {},
      dailyBonus: data.dailyBonus || null,
      faction: data.faction || "Civil",
      heritage: data.heritage || {},
      pvpStats: data.pvpStats || {},
      queuedIncome: data.queuedIncome || 0,
      queuedSkillXp: data.queuedSkillXp || 0,
      questsCompleted: data.questsCompleted || [],
      jobs: data.jobs || {}
    });

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

    if (Array.isArray(data.activeShopItems)) {
      shopItems.forEach(item => {
        if (data.activeShopItems.includes(item.id)) {
          item.toggleActive?.();
        }
      });
    }

    console.log("✅ Données chargées avec succès !");
    startGame();

  } catch (err) {
    console.error("❌ Erreur de chargement :", err);
    startGame();
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
        headers: { "Content-Type": "application/json" },
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