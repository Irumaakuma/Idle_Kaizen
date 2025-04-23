let currentUserId = null;
let currentUsername = null;

const clientId = "1363336518181195817";
const redirectUri = "https://kaizen-backend-fkod.onrender.com/auth/discord/callback";
const webhookURL = "https://discord.com/api/webhooks/1363338362244567141/...";

// Auth vers backend
function loginWithDiscord() {
  const discordUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify`;
  window.location.href = discordUrl;
}

function checkLogin() {
  const urlParams = new URLSearchParams(window.location.search);
  const discordId = urlParams.get("discord_id");
  const username = urlParams.get("username");

  if (!discordId) {
    document.getElementById("login-area").innerHTML = `<button onclick="loginWithDiscord()">Se connecter avec Discord</button>`;
    return;
  }

  currentUserId = discordId;

  if (username) {
    currentUsername = decodeURIComponent(username);
    window.currentUsername = currentUsername; // 👈 exposé globalement
    document.getElementById("login-area").innerHTML = `✅ Connecté en tant que ${currentUsername}`;
  } else {
    currentUsername = "Joueur inconnu";
    window.currentUsername = currentUsername;
    document.getElementById("login-area").innerHTML = `✅ Connecté via Discord`;
  }

  loadPlayerData(currentUserId);
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
    questsCompleted: player.questsCompleted
  };
}

function savePlayerData(userId) {
  fetch(`https://kaizen-backend-fkod.onrender.com/save/${userId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(getSaveData())
  }).then(() => {
    const now = new Date();
    const time = now.toLocaleTimeString();
    document.getElementById("last-save").textContent = `💾 Sauvegarde effectuée à ${time}`;
    showToast("✅ Données sauvegardées");
  });
}

async function loadPlayerData(userId) {
  const res = await fetch(`https://kaizen-backend-fkod.onrender.com/load/${userId}`);
  const data = await res.json();

  if (data) {
    Object.assign(player, data);

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

    fetch(webhookURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        content: `💾 Sauvegarde manuelle effectuée à ${time} pour <@${currentUserId}>`
      })
    });

    showToast("💾 Sauvegarde manuelle envoyée !");
  } else {
    showToast("❌ Connecte-toi avec Discord d'abord !");
  }
}
