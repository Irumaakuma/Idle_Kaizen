(() => {
    console.log("%c🚫 Triche désactivée. Toute tentative sera ignorée.", "color: red; font-size: 16px;");
  
    // 🔒 Redéfinir les fonctions critiques en version protégée
    const safeGainBerries = (amount) => {
      if (typeof amount === "number" && amount > 0 && amount < 1_000_000) {
        player.berries += amount;
      } else {
        console.warn("Tentative de triche : gainBerries bloqué.");
      }
    };
  
    const safeGainXP = (amount) => {
      if (typeof amount === "number" && amount > 0 && amount < 1_000_000) {
        player.xp += amount;
        if (player.xp >= player.level * 100) {
          player.xp = 0;
          player.level++;
        }
      } else {
        console.warn("Tentative de triche : gainXP bloqué.");
      }
    };
  
    player.gainBerries = safeGainBerries;
    player.gainXP = safeGainXP;
  
    // 🔒 Supprimer les accès globaux
    window.gainBerries = () => alert("❌ Action bloquée.");
    window.gainXP = () => alert("❌ Action bloquée.");
    window.challengePlayer = () => alert("❌ PvP manuel interdit.");
    window.updateSpeed = 1; // verrouille la vitesse
  
    // 🔒 Geler les objets critiques
    Object.freeze(player);
    Object.freeze(player.skills);
    Object.freeze(player.jobs);
  
    // 🔐 Verrouiller l'accès console
    let devToolsOpen = false;
  
    setInterval(() => {
      const t0 = performance.now();
      debugger; // ← Déclenche un arrêt si console ouverte
      const t1 = performance.now();
      if (t1 - t0 > 100) {
        if (!devToolsOpen) {
          devToolsOpen = true;
          alert("🚫 Console détectée. Le jeu va redémarrer.");
          location.reload();
        }
      }
    }, 1000);
  
    // 🛡️ Désactiver les raccourcis DevTools
    document.addEventListener("keydown", function (e) {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key)) ||
        (e.ctrlKey && e.key === "U")
      ) {
        e.preventDefault();
        alert("🔒 Console et inspecteur désactivés.");
      }
    });
  
    document.addEventListener("contextmenu", e => e.preventDefault());
  })();
  