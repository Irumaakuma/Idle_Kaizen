class ShopItem {
  constructor({ id, name, description, category, costPerDay, effect, unlockCondition }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.category = category;
    this.costPerDay = costPerDay;
    this.effect = effect;
    this.removeEffect = null;
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
      if (typeof this.effect === "function") {
        this.removeEffect = this.effect();
      }
      showToast(`✅ ${this.name} activé !`);
    } else {
      this.isActive = false;
      if (typeof this.removeEffect === "function") {
        this.removeEffect();
      }
      showToast(`🚫 ${this.name} désactivé.`);
    }
  }
}

const shopItems = [];

// 🛶 Bateaux (bonheur)
for (let i = 1; i <= 10; i++) {
  const value = 0.05 * i;
  shopItems.push(new ShopItem({
    id: `bateau_${i}`,
    name: `Bateau ${i}`,
    description: `Un bateau de niveau ${i} qui augmente le bonheur.`,
    category: "bateau",
    costPerDay: i * 2,
    effect: () => {
      player.happiness += value;
      return () => player.happiness -= value;
    },
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
  effect: () => {
    player.hasLogPose = true;
    return () => { player.hasLogPose = false; };
  },
  unlockCondition: () => !player.hasLogPose
}));

// 📚 Boosts de compétences fondamentales
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
    const boostValue = 0.005 * Math.pow(2, i - 1);
    const cost = i;

    shopItems.push(new ShopItem({
      id: `${id}_boost_${i}`,
      name: `${label} Boost ${i}`,
      description: `Boost ${label.toLowerCase()} de +${boostValue.toFixed(3)} par tick.`,
      category: id,
      costPerDay: cost,
      effect: () => {
        player.skills[id].baseXpGain += boostValue;
        return () => player.skills[id].baseXpGain -= boostValue;
      },
      unlockCondition: () => player.skills[id]?.level >= i * 10
    }));
  }
});

// 💰 Total coût actif
function getTotalShopCost() {
  return shopItems.filter(i => i.isActive).reduce((sum, i) => sum + i.costPerDay, 0);
}

// 🖼️ Affichage de la boutique
function renderShop() {
  const container = document.getElementById("shop-items");
  container.innerHTML = "";

  // 🧭 Affichage de l’événement actif (Log Pose)
  if (player.hasLogPose && player.dailyBonus?.duration > 0) {
    const remaining = player.dailyBonus.duration * 10; // 10s par tick
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    const label = player.dailyBonus.type === "positive" ? "🌟 Bonus" : "⚠️ Malus";
    const color = player.dailyBonus.type === "positive" ? "#4caf50" : "#e53935";

    container.innerHTML += `
      <div style="padding: 10px; background: #111; color: ${color}; border-radius: 8px; margin-bottom: 10px;">
        <strong>${label} en cours</strong><br>
        ${player.dailyBonus.effect}<br>
        ⏳ Temps restant : ${minutes}m ${seconds.toString().padStart(2, "0")}s
      </div>
    `;
  }

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

// 📦 Interaction
function toggleShopItem(id) {
  const item = shopItems.find(i => i.id === id);
  if (item) item.toggleActive();
  updateUI();
}

// 🔁 Coût journalier
function manageShopItems() {
  shopItems.forEach(item => {
    if (!item.isActive) return;

    const cost = item.costPerDay;
    if (player.berries < cost) {
      item.isActive = false;
      if (typeof item.removeEffect === "function") {
        item.removeEffect();
      }
      showToast(`💸 ${item.name} désactivé automatiquement (plus de berries)`);
    } else {
      player.berries -= cost;
    }
  });
}

// 🌍 Exposition
window.renderShop = renderShop;
window.toggleShopItem = toggleShopItem;
window.manageShopItems = manageShopItems;
window.getTotalShopCost = getTotalShopCost;
