(function () {
  window.KoreanSurvivorGame = window.KoreanSurvivorGame || {};
  window.KoreanSurvivorGame.fontFamily = "SUIT Variable, Noto Sans KR, Noto Sans, sans-serif";
  const ui = window.KoreanSurvivorGame.ui = window.KoreanSurvivorGame.ui || {};
  const font = window.KoreanSurvivorGame.fontFamily;

  ui.drawBackdrop = function (scene) {
    const width = scene.scale.width;
    const height = scene.scale.height;

    const g = scene.add.graphics();
    g.fillGradientStyle(0x04131d, 0x0b2030, 0x133347, 0x06131c, 1);
    g.fillRect(0, 0, width, height);
    g.setScrollFactor(0);

    const grid = scene.add.graphics();
    grid.lineStyle(1, 0xffffff, 0.03);

    for (let x = 48; x < width; x += 72) {
      grid.lineBetween(x, 0, x, height);
    }

    for (let y = 48; y < height; y += 84) {
      grid.lineBetween(0, y, width, y);
    }
    grid.setScrollFactor(0);

    const orbA = scene.add.ellipse(width * 0.2, height * 0.14, width * 0.7, width * 0.7, 0xff8b3d, 0.12);
    const orbB = scene.add.ellipse(width * 0.82, height * 0.82, width * 0.82, width * 0.82, 0x5ce0a0, 0.1);
    const orbC = scene.add.ellipse(width * 0.7, height * 0.18, width * 0.36, width * 0.36, 0xf3d37a, 0.08);
    orbA.setScrollFactor(0);
    orbB.setScrollFactor(0);
    orbC.setScrollFactor(0);

    scene.tweens.add({ targets: orbA, x: width * 0.28, y: height * 0.18, scale: 1.05, duration: 7600, yoyo: true, repeat: -1, ease: "Sine.inOut" });
    scene.tweens.add({ targets: orbB, x: width * 0.74, y: height * 0.74, scale: 1.08, duration: 8800, yoyo: true, repeat: -1, ease: "Sine.inOut" });
    scene.tweens.add({ targets: orbC, x: width * 0.64, y: height * 0.22, duration: 7200, yoyo: true, repeat: -1, ease: "Sine.inOut" });
  };

  ui.addPanel = function (scene, x, y, width, height, alpha) {
    const panel = scene.add.image(x, y, "panel");
    panel.setDisplaySize(width, height);
    panel.setAlpha(alpha === undefined ? 1 : alpha);
    return panel;
  };

  ui.createButton = function (scene, config) {
    const width = config.width || 240;
    const height = config.height || 70;
    const x = config.x || 0;
    const y = config.y || 0;
    const bg = scene.add.image(0, 0, "button").setDisplaySize(width, height);
    const glow = scene.add.ellipse(0, height * 0.48, width * 0.72, 18, 0xffb068, 0.18).setBlendMode(Phaser.BlendModes.ADD);
    const text = scene.add.text(0, -2, config.label || "Button", {
      fontFamily: font,
      fontSize: config.fontSize || "28px",
      fontStyle: "700",
      color: "#fffaf1",
      letterSpacing: 0.4,
    }).setOrigin(0.5);

    const container = scene.add.container(x, y, [glow, bg, text]);
    bg.setInteractive({ useHandCursor: true });

    bg.on("pointerover", function () {
      bg.setTexture("button-hover");
      container.y = y - 2;
    });

    bg.on("pointerout", function () {
      bg.setTexture("button");
      container.y = y;
    });

    bg.on("pointerdown", function () {
      bg.setTexture("button-pressed");
      container.y = y + 1;
    });

    bg.on("pointerup", function () {
      bg.setTexture("button-hover");
      container.y = y - 2;
      (config.onClick || function () {})();
    });

    return container;
  };
})();
