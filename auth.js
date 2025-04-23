let currentUserId = null;
let currentUsername = null;

const clientId = "1363336518181195817";
const redirectUri = "https://kaizen-backend-fkod.onrender.com/auth/discord/callback";
const webhookURL = "https://discord.com/api/webhooks/1363338362244567141/lM6-jUxgdgyw1eBrhgH70BbQNnco4If-AExWOijdVmcTgPI49CIrll09yZqQgleAVQoA";

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
    faction: player.faction, // 👈 Ne surtout pas oublier ça !
    discordUsername: currentUsername || "???",
  };
}


function savePlayerData(userId) {
  fetch(`https://kaizen-backend-fkod.onrender.com/save/${userId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": userId  // 🟢 C'EST OBLIGATOIRE
    },
    body: JSON.stringify(getSaveData())
  }).then(() => {
    const now = new Date();
    const time = now.toLocaleTimeString();
    document.getElementById("last-save").textContent = `💾 Sauvegarde effectuée à ${time}`;
    showToast("✅ Données sauvegardées");
  });
}


async function loadPlayerData(userId) {
  const res = await fetch(`https://kaizen-backend-fkod.onrender.com/load/${userId}`, {
    headers: { "Authorization": userId }
  });

  const data = await res.json();

  if (data) {
    Object.assign(player, data);

    if (data.faction) {
      player.faction = data.faction; // ✅ restauration manuelle si besoin
    }

    const rebuiltSkills = {};
    for (let id in data.skills) {
      const s = data.skills[id];
      rebuiltSkills[id] = new Skill({
        id: s.id,
        name: s.name,
        baseXpGain: s.baseXpGain,
        baseEffect: s.baseEffect,
        group: s.group
      });
      rebuiltSkills[id].level = s.level;
      rebuiltSkills[id].xp = s.xp;
    }

    player.skills = rebuiltSkills;

    jobs.forEach(job => {
      const saved = data.jobs?.[job.id];
      if (saved) {
        job.level = saved.level || 1;
        job.xp = saved.xp || 0;
      }
    });

    updateUI();
    togglePvpButton();
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


