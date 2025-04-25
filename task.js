class Task {
  constructor(id, name, baseXpPerTick = 5) {
    this.id = id;
    this.name = name;
    this.level = 0;
    this.xp = 0;
    this.baseXpPerTick = baseXpPerTick;
  }

  getMaxXp() {
    return 50 + this.level * 10;
  }

  gainXp() {
    this.xp += this.baseXpPerTick;
    if (this.xp >= this.getMaxXp()) {
      this.level++;
      this.xp = 0;
    }
  }

  getEffectMultiplier() {
    return 1 + this.level * 0.1;
  }

  getProgress() {
    return Math.min(100, (this.xp / this.getMaxXp()) * 100);
  }
}

class Skill {
  constructor({ id, name, baseXpGain = 3, baseEffect = 0.05, group = "autre", unlocked = true, getBonusDamage, getBonusDodge, getTripleHitChance, getIgnoreDefense, maxLevel }) {
    this.id = id;
    this.name = name;
    this.level = 1;
    this.xp = 0;
    this.baseXpGain = baseXpGain;
    this.baseEffect = baseEffect;
    this.group = group;
    this.unlocked = unlocked;
    this.getBonusDamage = getBonusDamage;
    this.getBonusDodge = getBonusDodge;
    this.getTripleHitChance = getTripleHitChance;
    this.getIgnoreDefense = getIgnoreDefense;
    this.maxLevel = maxLevel || Infinity;
  }

  getMaxXp() {
    return Math.round(80 * (this.level + 1) * Math.pow(1.05, this.level));
  }

  getProgress() {
    return Math.min(100, (this.xp / this.getMaxXp()) * 100);
  }

  getEffect() {
    const heritage = getHeritageBonusFromSkill(this.id);
    return 1 + this.level * this.baseEffect + heritage;
  }

  getEffectMultiplier() {
    return this.getEffect();
  }

  getXpGain() {
    return this.baseXpGain;
  }

  gainXp() {
    const gain = applySpeed(this.getXpGain());
    this.xp += gain;

    if (this.xp >= this.getMaxXp() && this.level < this.maxLevel) {
      let excess = this.xp - this.getMaxXp();
      while (excess >= 0 && this.level < this.maxLevel) {
        this.level++;
        excess -= this.getMaxXp();
      }
      this.xp = Math.min(this.getMaxXp(), this.getMaxXp() + excess);
    }

    player.skills[this.id] = this;
  }

  tryUnlock(conditionFunc) {
    if (!this.unlocked && conditionFunc()) {
      this.unlocked = true;
      showToast(`🧠 Nouvelle compétence débloquée : ${this.name}`);
    }
  }
}

window.Task = Task;
window.Skill = Skill;

// === Nouvelle structure de compétences ===
window.defaultSkills = {
  force:       new Skill({ id: "force", name: "Force", baseXpGain: 5, baseEffect: 0.01, group: "fondamentale" }),
  agilite:     new Skill({ id: "agilite", name: "Agilité", baseXpGain: 5, baseEffect: 0.01, group: "fondamentale" }),
  vitalite:    new Skill({ id: "vitalite", name: "Vitalité", baseXpGain: 5, baseEffect: 0.01, group: "fondamentale" }),
  vigueur:     new Skill({ id: "vigueur", name: "Vigueur", baseXpGain: 5, baseEffect: 0.01, group: "fondamentale" }),
  intelligence:new Skill({ id: "intelligence", name: "Intelligence", baseXpGain: 5, baseEffect: 0.01, group: "fondamentale" }),
  endurance:   new Skill({ id: "endurance", name: "Endurance", baseXpGain: 5, baseEffect: 0.01, group: "fondamentale" }),
  dexterite:   new Skill({ id: "dexterite", name: "Dextérité", baseXpGain: 5, baseEffect: 0.01, group: "fondamentale" }), // ↖️ priorité
  

  // 🗡️ Combat
  karate_homme_poisson: new Skill({ id: "karate_homme_poisson", name: "Karaté HP", group: "combat", unlocked: false, getBonusDamage: lvl => lvl * 0.02 }),
  rokushiki:            new Skill({ id: "rokushiki", name: "Rokushiki", group: "combat", unlocked: false, getBonusDodge: lvl => lvl * 0.01 }),
  style_3_sabres:       new Skill({ id: "style_3_sabres", name: "3 Sabres", group: "combat", unlocked: false, getTripleHitChance: lvl => lvl * 0.03, maxLevel: 1000 }),
  frappe_du_diable:     new Skill({ id: "frappe_du_diable", name: "Frappe Diable", group: "combat", unlocked: false, getIgnoreDefense: lvl => lvl * 0.02, maxLevel: 1500 }),

  // 🧭 Navigation
  navigation_base: new Skill({ id: "navigation_base", name: "Navigation", group: "navigation", unlocked: false, getFactionRevenueBonus: lvl => lvl * 0.01 }),
  meteo:           new Skill({ id: "meteo", name: "Lecture du climat", group: "navigation", unlocked: false, getFactionSpeedBonus: lvl => 1 + lvl * 0.01 }),  
  cartographie:    new Skill({ id: "cartographie", name: "Cartographie", group: "navigation", unlocked: false, getEventChanceBoost: lvl => lvl * 0.0001 }),
  manoeuvre_navire:new Skill({ id: "manoeuvre_navire", name: "Manœuvre navire", group: "navigation", unlocked: false, getEventDurationBoost: lvl => lvl * 0.01 }),

  // 👑 Haki
  haki_observation_1: new Skill({ id: "haki_observation_1", name: "Haki Observation I", group: "haki", unlocked: false }),
  haki_armement_1:    new Skill({ id: "haki_armement_1", name: "Haki Armement I", group: "haki", unlocked: false }),
  haki_roi:           new Skill({ id: "haki_roi", name: "Haki des Rois", group: "haki", unlocked: false, maxLevel: 100 })
};