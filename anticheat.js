(() => {
    console.log("%c🛡️ Anti-triche actif", "color: lime; font-size: 16px;");
  
    // Utilitare de protection via Proxy
    function protectFunction(fnName, originalFn) {
      if (typeof originalFn !== "function") return;
  
      window[fnName] = new Proxy(originalFn, {
        apply(target, thisArg, argumentsList) {
          const err = new Error();
          const stack = err.stack || "";
          const isFromConsole = stack.includes("at <anonymous>") || stack.includes("VM");
  
          if (isFromConsole) {
            alert(`❌ ${fnName} bloqué depuis la console.`);
            return;
          }
  
          return Reflect.apply(target, thisArg, argumentsList);
        }
      });
    }
  
    // 🔒 Appliquer la protection sur les fonctions critiques
    protectFunction("gainBerries", window.gainBerries);
    protectFunction("gainXP", window.gainXP);
    protectFunction("challengePlayer", window.challengePlayer);
  
    // 🔒 Désactiver les raccourcis DevTools
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
  
    // 🔎 Détecter ouverture console
    let devToolsOpen = false;
    setInterval(() => {
      const t0 = performance.now();
      debugger;
      const t1 = performance.now();
      if (t1 - t0 > 100) {
        if (!devToolsOpen) {
          devToolsOpen = true;
          alert("🚫 Console détectée. Le jeu va redémarrer.");
          location.reload();
        }
      }
    }, 1000);
  })();
  