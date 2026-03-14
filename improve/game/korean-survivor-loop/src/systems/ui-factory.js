(function () {
  window.KoreanSurvivorGame = window.KoreanSurvivorGame || {};
  window.KoreanSurvivorGame.fontFamily = "SUIT Variable, Noto Sans KR, Noto Sans, sans-serif";
  const ui = window.KoreanSurvivorGame.ui = window.KoreanSurvivorGame.ui || {};
  const font = window.KoreanSurvivorGame.fontFamily;

  function pinBackdropItem(item) {
    if (item && item.setScrollFactor) {
      item.setScrollFactor(0);
    }

    return item;
  }

  function getBackdropTheme(theme) {
    return {
      topLeft: 0x04131d,
      topRight: 0x0b2030,
      bottomLeft: 0x133347,
      bottomRight: 0x06131c,
      gridColor: 0xffffff,
      gridAlpha: 0.03,
      gridSpacingX: 72,
      gridSpacingY: 84,
      sweepColor: 0xffb068,
      sweepAlpha: 0.08,
      sweepWidth: 0.92,
      sweepHeight: 0.34,
      sweepX: 0.52,
      sweepY: 0.22,
      sweepAngle: -12,
      fogColor: 0x5ce0a0,
      fogAlpha: 0.08,
      fogX: 0.2,
      fogY: 0.84,
      fogWidth: 0.88,
      fogHeight: 0.48,
      orbAColor: 0xff8b3d,
      orbAAlpha: 0.12,
      orbBColor: 0x5ce0a0,
      orbBAlpha: 0.1,
      orbCColor: 0xf3d37a,
      orbCAlpha: 0.08,
      orbAX: 0.2,
      orbAY: 0.14,
      orbASize: 0.7,
      orbBX: 0.82,
      orbBY: 0.82,
      orbBSize: 0.82,
      orbCX: 0.7,
      orbCY: 0.18,
      orbCSize: 0.36,
      vignetteColor: 0x02070a,
      vignetteAlpha: 0.2,
      ...theme,
    };
  }

  ui.drawBackdrop = function (scene, theme) {
    const width = scene.scale.width;
    const height = scene.scale.height;
    const state = scene.stageBackdropState || {};

    if (!state.base) {
      state.base = pinBackdropItem(scene.add.graphics().setDepth(-12));
      state.grid = pinBackdropItem(scene.add.graphics().setDepth(-11));
      state.sweep = pinBackdropItem(scene.add.rectangle(width * 0.5, height * 0.22, width * 0.92, height * 0.34, 0xffb068, 0.08).setDepth(-10).setBlendMode(Phaser.BlendModes.ADD));
      state.fog = pinBackdropItem(scene.add.ellipse(width * 0.2, height * 0.84, width * 0.88, height * 0.48, 0x5ce0a0, 0.08).setDepth(-10).setBlendMode(Phaser.BlendModes.ADD));
      state.orbA = pinBackdropItem(scene.add.ellipse(width * 0.2, height * 0.14, width * 0.7, width * 0.7, 0xff8b3d, 0.12).setDepth(-9));
      state.orbB = pinBackdropItem(scene.add.ellipse(width * 0.82, height * 0.82, width * 0.82, width * 0.82, 0x5ce0a0, 0.1).setDepth(-9));
      state.orbC = pinBackdropItem(scene.add.ellipse(width * 0.7, height * 0.18, width * 0.36, width * 0.36, 0xf3d37a, 0.08).setDepth(-9));
      state.vignette = pinBackdropItem(scene.add.rectangle(width * 0.5, height * 0.5, width, height, 0x02070a, 0.2).setDepth(-8));

      scene.tweens.add({ targets: state.orbA, x: width * 0.28, y: height * 0.18, scale: 1.05, duration: 7600, yoyo: true, repeat: -1, ease: "Sine.inOut" });
      scene.tweens.add({ targets: state.orbB, x: width * 0.74, y: height * 0.74, scale: 1.08, duration: 8800, yoyo: true, repeat: -1, ease: "Sine.inOut" });
      scene.tweens.add({ targets: state.orbC, x: width * 0.64, y: height * 0.22, duration: 7200, yoyo: true, repeat: -1, ease: "Sine.inOut" });

      scene.stageBackdropState = state;
    }

    ui.applyBackdropTheme(scene, theme);
    return state;
  };

  ui.applyBackdropTheme = function (scene, theme) {
    const width = scene.scale.width;
    const height = scene.scale.height;
    const state = scene.stageBackdropState;

    if (!state) {
      return null;
    }

    const current = getBackdropTheme(theme);

    state.base.clear();
    state.base.fillGradientStyle(current.topLeft, current.topRight, current.bottomLeft, current.bottomRight, 1);
    state.base.fillRect(0, 0, width, height);
    state.base.fillStyle(current.bottomLeft, 0.16);
    state.base.fillEllipse(width * 0.5, height * 0.96, width * 1.15, height * 0.22);

    state.grid.clear();
    state.grid.lineStyle(1, current.gridColor, current.gridAlpha);

    for (let x = 48; x < width; x += current.gridSpacingX) {
      state.grid.lineBetween(x, 0, x, height);
    }

    for (let y = 48; y < height; y += current.gridSpacingY) {
      state.grid.lineBetween(0, y, width, y);
    }

    state.grid.lineStyle(2, current.gridColor, current.gridAlpha * 0.6);
    state.grid.lineBetween(0, height * 0.78, width, height * 0.24);
    state.grid.lineBetween(0, height * 0.94, width, height * 0.4);

    state.sweep.setPosition(width * current.sweepX, height * current.sweepY);
    state.sweep.setSize(width * current.sweepWidth, height * current.sweepHeight);
    state.sweep.setAngle(current.sweepAngle);
    state.sweep.setFillStyle(current.sweepColor, current.sweepAlpha);

    state.fog.setPosition(width * current.fogX, height * current.fogY);
    state.fog.setSize(width * current.fogWidth, height * current.fogHeight);
    state.fog.setFillStyle(current.fogColor, current.fogAlpha);

    state.orbA.setPosition(width * current.orbAX, height * current.orbAY);
    state.orbA.setSize(width * current.orbASize, width * current.orbASize);
    state.orbA.setFillStyle(current.orbAColor, current.orbAAlpha);

    state.orbB.setPosition(width * current.orbBX, height * current.orbBY);
    state.orbB.setSize(width * current.orbBSize, width * current.orbBSize);
    state.orbB.setFillStyle(current.orbBColor, current.orbBAlpha);

    state.orbC.setPosition(width * current.orbCX, height * current.orbCY);
    state.orbC.setSize(width * current.orbCSize, width * current.orbCSize);
    state.orbC.setFillStyle(current.orbCColor, current.orbCAlpha);

    state.vignette.setFillStyle(current.vignetteColor, current.vignetteAlpha);
    return current;
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
