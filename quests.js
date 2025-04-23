const quests = [
    {
      id: "earn_50_berries",
      description: "Gagner 50 berries",
      condition: () => player.berries >= 50,
      completed: false,
      reward: () => {
        gainXP(50);
       // alert(`Quête terminée : ${q.name} ! Vous gagnez ${q.rewardXp} XP.`);
      }
    }
  ];
  
  function renderQuests() {
    const container = document.getElementById("quests");
    container.innerHTML = "<h2>Quêtes</h2>";
    quests.forEach(quest => {
      if (!quest.completed) {
        const p = document.createElement("p");
        p.textContent = `🗺️ ${quest.description}`;
        container.appendChild(p);
      }
    });
  }
  
  function checkQuests() {
    quests.forEach(quest => {
      if (!quest.completed && quest.condition()) {
        quest.completed = true;
        player.questsCompleted.push(quest.id);
        quest.reward();
        updateUI();
      }
    });
  }
  
