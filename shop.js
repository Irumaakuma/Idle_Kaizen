// shop.js

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

// Bateaux (bonus bonheur)
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

// Log Pose (bonus unique)
shopItems.push(new ShopItem({
  id: "log_pos",
  name: "Log Pose",
  description: "Affiche la durée des événements et les chances d'apparition.",
  category: "boost",
  costPerDay: 0,
  effect: () => { player.hasLogPose = true; },
  unlockCondition: () => !player.hasLogPose
}));

// Boosts de compétences fondamentales
const baseSkills = ["force", "agilite", "vitalite", "vigueur", "intelligence", "endurance", "dexterite"];

baseSkills.forEach((skill, index) => {
  for (let i = 1; i <= 10; i++) {
    shopItems.push(new ShopItem({
      id: `${skill}_boost_${i}`,
      name: `${skill.charAt(0).toUpperCase() + skill.slice(1)} Boost ${i}`,
      description: `Boost ${skill} de +${(0.005 * i).toFixed(3)} par tick.`,
      category: "boost",
      costPerDay: i,
      effect: () => player.skills[skill].baseXpGain += 0.005 * i,
      unlockCondition: () => player.skills[skill].level >= i * 2
    }));
  }
});

// Utilitaires
function getTotalShopCost() {
  return shopItems.filter(item => item.isActive).reduce((sum, i) => sum + i.costPerDay, 0);
}

function getDailyIncome() {
  const job = jobs.find(j => j.id === player.currentJobId);
  return job ? Math.floor((job.getIncome() * 1000) / job.interval) : 0;
}

// Affichage
function renderShop() {
  const container = document.getElementById("shop-items");
  container.innerHTML = "";

  const grouped = {
    bateau: "Bateaux (Bonheur)",
    boost: "Boosts de compétences"
  };

  for (let groupKey in grouped) {
    const groupName = grouped[groupKey];
    let groupHTML = "";

    shopItems
      .filter(item => item.category === groupKey && item.unlockCondition())
      .forEach(item => {
        item.unlocked = true;
        const isActive = item.isActive;
        const btnLabel = isActive ? "Désactiver" : "Activer";
        const lockNote = (player.berries <= 0 && !isActive)
          ? `<span style="color:red;">(verrouillé)</span>` : "";

        groupHTML += `
          <div class="shop-item">
            <strong>${item.name}</strong> - ${item.description} <br>
            💸 ${item.costPerDay} / jour ${lockNote}
            <button onclick="toggleShopItem('${item.id}')" ${player.berries <= 0 && !isActive ? 'disabled' : ''}>
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

// Interaction
function toggleShopItem(id) {
  const item = shopItems.find(i => i.id === id);
  if (item) item.toggleActive();
  updateUI();
}

if (item.isActive) {
  const costPerTick = item.costPerDay / 365;

  if (player.berries < costPerTick) {
    item.isActive = false;
    showToast(`💸 ${item.name} désactivé automatiquement (plus de berries)`);
  } else {
    player.berries -= costPerTick;
  }
}


window.renderShop = renderShop;
window.toggleShopItem = toggleShopItem;
window.manageShopItems = manageShopItems;
