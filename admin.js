// admin.js

(function() {
    const ADMIN_PASSWORD = "admin123"; // 🛡️ Mot de passe admin
  
    document.addEventListener('keydown', function(e) {
      if (e.shiftKey && e.key === 'A') {
        openLoginPanel();
      }
    });
  
    function openLoginPanel() {
      if (document.getElementById('admin-login')) return;
  
      const loginBox = document.createElement('div');
      loginBox.id = 'admin-login';
      loginBox.style.position = 'fixed';
      loginBox.style.top = '50px';
      loginBox.style.right = '20px';
      loginBox.style.background = '#111';
      loginBox.style.padding = '10px';
      loginBox.style.border = '1px solid orange';
      loginBox.style.zIndex = 9999;
      loginBox.style.borderRadius = '8px';
      loginBox.style.pointerEvents = 'auto'; // 👈 Important
      loginBox.innerHTML = `
        <h3>🔒 Admin Login</h3>
        <input id="admin-password-input" type="password" placeholder="Mot de passe" style="width: 100%; margin-bottom: 8px; padding: 5px;"/>
        <button onclick="verifyAdminPassword()">Se connecter</button>
      `;
      document.body.appendChild(loginBox);
    }
  
    window.verifyAdminPassword = function() {
      const input = document.getElementById('admin-password-input');
      if (!input) return;
  
      if (input.value === ADMIN_PASSWORD) {
        document.getElementById('admin-login')?.remove();
        openAdminPanel();
      } else {
        alert("❌ Mot de passe incorrect !");
      }
    };
  
    function openAdminPanel() {
      if (document.getElementById('admin-panel')) return;
  
      const panel = document.createElement('div');
      panel.id = 'admin-panel';
      panel.style.position = 'fixed';
      panel.style.top = '50px';
      panel.style.right = '20px';
      panel.style.background = '#222';
      panel.style.padding = '10px';
      panel.style.border = '1px solid lime';
      panel.style.zIndex = 9999;
      panel.style.borderRadius = '8px';
      panel.style.pointerEvents = 'auto'; // 👈 Important
      panel.style.maxWidth = '200px';
      panel.innerHTML = `
        <h3>🛠️ Admin Panel</h3>
        <button onclick="player.berries += 1000000; updateUI();">💰 +1M Berries</button><br><br>
        <button onclick="player.xp += 10000; gainXP(0); updateUI();">⭐ +10K XP</button><br><br>
        <button onclick="player.day += 3650; updateUI();">👴 Vieillir +10 ans</button><br><br>
        <button onclick="triggerRebirth(); updateUI();">🔁 Forcer Rebirth</button><br><br>
        <button onclick="player.faction = 'pirate'; updateUI();">🏴‍☠️ Pirate</button><br><br>
        <button onclick="player.faction = 'marine'; updateUI();">⚓ Marine</button><br><br>
        <button onclick="player.happiness += 1; updateUI();">😊 +1 Bonheur</button><br><br>
        <button onclick="document.getElementById('admin-panel')?.remove();">❌ Fermer</button>
      `;
      document.body.appendChild(panel);
    }
  })();
  