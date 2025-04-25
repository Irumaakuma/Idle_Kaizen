(() => {
    console.log("%c🚫 Anti-triche activé", "color: red; font-size: 16px;");
  
    // 🔒 Protéger les fonctions critiques
    Object.defineProperty(window, "gainBerries", {
      configurable: false,
      writable: false,
      value: () => alert("❌ gainBerries bloqué.")
    });
  
    Object.defineProperty(window, "gainXP", {
      configurable: false,
      writable: false,
      value: () => alert("❌ gainXP bloqué.")
    });
  
    Object.defineProperty(window, "challengePlayer", {
      configurable: false,
      writable: false,
      value: () => alert("❌ PvP manuel interdit.")
    });
  
    // 🔐 Empêche l’ajout d’autres propriétés à jobs et skills (mais garde les actuelles fonctionnelles)
    Object.seal(player.jobs);
    Object.seal(player.skills);
  
    // 🛡️ Détection console DevTools
    let devToolsOpen = false;
  
    setInterval(() => {
      const t0 = performance.now();
      debugger; // provoque un arrêt si la console est ouverte
      const t1 = performance.now();
  
      if (t1 - t0 > 100) {
        if (!devToolsOpen) {
          devToolsOpen = true;
          alert("🚫 Console détectée. Le jeu va redémarrer.");
          location.reload();
        }
      }
    }, 1000);
  
    // 🔐 Désactivation des raccourcis DevTools
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
  
    // ❌ Bloquer clic droit
    document.addEventListener("contextmenu", e => e.preventDefault());
  })();
  