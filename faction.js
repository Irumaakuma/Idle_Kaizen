// faction.js

const factionRanks = {
  marine: [
    "Recrue", "Matelot", "Sergent", "Commandant", "Capitaine", "Contre-amiral", "Vice-amiral", "Amiral"
  ],
  pirate: [
    "Pillard", "Ravisseur", "Flibustier", "Forban", "Corsaire", "Capitaine", "Empereur"  
  ]
};

function gainAlignment(points) {
  if (player.faction) return; // 🔒 Une fois défini, plus de changement de faction

  player.alignmentScore = (player.alignmentScore || 0) + points;

  if (player.alignmentScore >= 50) {
    player.faction = "marine";
    player.marineLevel = 0;
    showToast("⚓ Tu rejoins la Marine !");
  } else if (player.alignmentScore <= -50) {
    player.faction = "pirate";
    player.pirateLevel = 0;
    showToast("🏴‍☠️ Tu deviens un Pirate !");
  }
}



function getFactionRank() {
  if (player.faction === "marine") {
    return factionRanks.marine[player.marineLevel] || "?";
  } else if (player.faction === "pirate") {
    return factionRanks.pirate[player.pirateLevel] || "?";
  }
  return "Sans faction";
}

function progressFaction(points) {
  if (player.faction === "marine") {
    player.honor += points;
    if (player.honor >= (player.marineLevel + 1) * 100) {
      player.marineLevel++;
      showToast(`🔰 Promotion Marine : ${getFactionRank()}`);
    }
  } else if (player.faction === "pirate") {
    player.prime += points;
    if (player.prime >= (player.pirateLevel + 1) * 100) {
      player.pirateLevel++;
      showToast(`💰 Nouvelle prime : ${getFactionRank()}`);
    }
  }
}

function isJobUnlockedByFaction(jobId) {
  const factionLocked = {
    combattant: "pirate",
    coureur: "marine"
  };
  const required = factionLocked[jobId];
  return !required || player.faction === required;
}

window.gainAlignment = gainAlignment;
window.progressFaction = progressFaction;
window.getFactionRank = getFactionRank;
window.isJobUnlockedByFaction = isJobUnlockedByFaction;