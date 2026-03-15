(function () {
  const gameData = window.KoreanSurvivorGame;

  gameData.instance = new Phaser.Game({
    type: Phaser.AUTO,
    parent: "game-root",
    width: 720,
    height: 1280,
    backgroundColor: "#061420",
    physics: {
      default: "arcade",
      arcade: {
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [
      gameData.BootScene,
      gameData.MenuScene,
      gameData.ArenaScene,
      gameData.ResultScene,
    ],
  });
})();
