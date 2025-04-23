// shop.js

class ShopItem {
    constructor({ id, name, description, category, costPerDay, effect, unlockCondition }) {
      this.id = id;
      this.name = name;
      this.description = description;
      this.category = category; // 'bateau' ou 'boost'
      this.costPerDay = costPerDay;
      this.effect = effect; // Fonction appelée à l'activation
      this.unlockCondition = unlockCondition; // Fonction booléenne
      this.unlocked = false;
      this.isActive = false;
    }
  
    canAfford() {
      const revenu = getDailyIncome();
      const totalCost = getTotalShopCost() + this.costPerDay;
      return revenu >= totalCost;
    }
  
    toggleActive() {
      if (!this.isActive) {
        if (this.canAfford()) {
          this.isActive = true;
          this.effect();
          showToast(`✅ ${this.name} activé !`);
        } else {
          showToast("❌ Revenu insuffisant pour activer cet item.");
        }
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
  
  function getTotalShopCost() {
    return shopItems.filter(item => item.isActive).reduce((sum, i) => sum + i.costPerDay, 0);
  }
  
  function getDailyIncome() {
    const job = jobs.find(j => j.id === player.currentJobId);
    return job ? Math.floor((job.getIncome() * 1000) / job.interval) : 0;
  }
  
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
  
      shopItems.filter(item => item.category === groupKey && item.unlockCondition()).forEach(item => {
        item.unlocked = true;
        const isActive = item.isActive;
        const btnLabel = isActive ? "Désactiver" : "Activer";
  
        groupHTML += `
          <div class="shop-item">
            <strong>${item.name}</strong> - ${item.description} <br>
            💸 ${item.costPerDay} / jour
            <button onclick="toggleShopItem('${item.id}')">${btnLabel}</button>
          </div>
        `;
      });
  
      if (groupHTML !== "") {
        container.innerHTML += `<div class="group-title">${groupName}</div>${groupHTML}`;
      }
    }
  }
  
  function toggleShopItem(id) {
    const item = shopItems.find(i => i.id === id);
    if (item) item.toggleActive();
    updateUI();
  }
  
  function manageShopItems() {
    shopItems.forEach(item => {
      if (item.isActive && !item.canAfford()) {
        item.isActive = false;
        showToast(`💸 ${item.name} désactivé automatiquement (plus assez d'argent)`);
      }
    });
  }
  
  window.renderShop = renderShop;
  window.toggleShopItem = toggleShopItem;
  window.manageShopItems = manageShopItems;
  