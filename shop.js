class ShopItem {
  constructor({ id, name, description, category, costPerDay, effect, unlockCondition }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.category = category;
    this.costPerDay = costPerDay;
    this.effect = effect;
    this.unlockCondition = unlockCondition;
    this.unlocked = false;
    this.isActive = false;
  }

  toggleActive() {
    if (!this.isActive) {
      if (player.berries <= 0) {
        showToast("❌ Tu n’as pas de berries pour activer cet item.");
        return;
      }
      this.isActive = true;
      this.effect();
      showToast(`✅ ${this.name} activé !`);
    } else {
      this.isActive = false;
      showToast(`🚫 ${this.name} désactivé.`);
    }
  }
}

const shopItems = [];

// 🛶 Bateaux (bonus bonheur)
for (let i = 1; i <= 10; i++) {
  shopItems.push(new ShopItem({
    id: `bateau_${i}`,
    name: `Bateau ${i}`,
    description: `Un bateau de niveau ${i} qui augmente le bonheur.`,
    category: "bateau",
    costPerDay: i * 2,
    effect: () => player.happiness += 0.05 * i,
    unlockCondition: () => player.level >= i
  }));
}

// 🧭 Log Pose
shopItems.push(new ShopItem({
  id: "log_pos",
  name: "Log Pose",
  description: "Affiche la durée des événements et les chances d'apparition.",
  category: "special",
  costPerDay: 0,
  effect: () => { player.hasLogPose = true; },
  unlockCondition: () => !player.hasLogPose
}));

// ⚔️ Boosts de compétences par stat, effet exponentiel
const baseSkills = [
  { id: "force", label: "Force" },
  { id: "agilite", label: "Agilité" },
  { id: "vitalite", label: "Vitalité" },
  { id: "vigueur", label: "Vigueur" },
  { id: "intelligence", label: "Intelligence" },
  { id: "endurance", label: "Endurance" },
  { id: "dexterite", label: "Dextérité" }
];

baseSkills.forEach(({ id, label }) => {
  for (let i = 1; i <= 10; i++) {
    const boostValue = 0.005 * Math.pow(2, i - 1); // double à chaque boost
    const cost = i;

    shopItems.push(new ShopItem({
      id: `${id}_boost_${i}`,
      name: `${label} Boost ${i}`,
      description: `Boost ${label.toLowerCase()} de +${boostValue.toFixed(3)} par tick.`,
      category: id,
      costPerDay: cost,
      effect: () => player.skills[id].baseXpGain += boostValue,
      unlockCondition: () => player.skills[id]?.level >= i * 10 // MASQUÉ si non débloqué
    }));
  }
});

// 🔢 Calcul total coût actif
function getTotalShopCost() {
  return shopItems.filter(i => i.isActive).reduce((sum, i) => sum + i.costPerDay, 0);
}

// 🖼️ Affichage boutique
function renderShop() {
  const container = document.getElementById("shop-items");
  container.innerHTML = "";

  const grouped = {
    bateau: "Bateaux (Bonheur)",
    force: "Boosts de Force",
    agilite: "Boosts d’Agilité",
    vitalite: "Boosts de Vitalité",
    vigueur: "Boosts de Vigueur",
    intelligence: "Boosts d’Intelligence",
    endurance: "Boosts d’Endurance",
    dexterite: "Boosts de Dextérité"
  };

  const totalCost = getTotalShopCost();
  container.innerHTML += `<div style="margin-bottom: 10px;"><strong>💸 Coût total actif : ${totalCost} / jour</strong></div>`;

  for (let groupKey in grouped) {
    const groupName = grouped[groupKey];
    let groupHTML = "";

    shopItems
      .filter(item => item.category === groupKey && item.unlockCondition())
      .forEach(item => {
        item.unlocked = true;
        const btnLabel = item.isActive ? "Désactiver" : "Activer";
        const locked = player.berries <= 0 && !item.isActive;
        const lockNote = locked ? `<span style="color:red;">(verrouillé)</span>` : "";

        groupHTML += `
          <div class="shop-item">
            <strong>${item.name}</strong> - ${item.description} <br>
            💸 ${item.costPerDay} / jour ${lockNote}
            <button onclick="toggleShopItem('${item.id}')" ${locked ? 'disabled' : ''}>
              ${btnLabel}
            </button>
          </div>
        `;
      });

    if (groupHTML !== "") {
      container.innerHTML += `<div class="group-title">${groupName}</div>${groupHTML}`;
    }
  }
}

// 🧩 Activation / désactivation d’un item
function toggleShopItem(id) {
  const item = shopItems.find(i => i.id === id);
  if (item) item.toggleActive();
  updateUI();
}

// 💸 Débit automatique journalier (appelé dans updateGameLoop)
function manageShopItems() {
  shopItems.forEach(item => {
    if (!item.isActive) return;

    const cost = item.costPerDay;
    if (player.berries < cost) {
      item.isActive = false;
      showToast(`💸 ${item.name} désactivé automatiquement (plus de berries)`);
    } else {
      player.berries -= cost;

      if (!isFinite(player.berries) || player.berries < -10000) {
        item.isActive = false;
        player.berries = 0;
        console.warn(`❌ Problème détecté avec ${item.name}, désactivation forcée.`);
      }
    }
  });
}

// 🌐 Exposer
window.renderShop = renderShop;
window.toggleShopItem = toggleShopItem;
window.manageShopItems = manageShopItems;
