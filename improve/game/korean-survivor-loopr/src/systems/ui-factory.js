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
      gridAlpha: 0.025,
      gridSpacingX: 72,
      gridSpacingY: 84,
      orbAColor: 0xff8b3d,
      orbAAlpha: 0.09,
      orbBColor: 0x5ce0a0,
      orbBAlpha: 0.07,
      orbAX: 0.2,
      orbAY: 0.14,
      orbASize: 0.46,
      orbBX: 0.82,
      orbBY: 0.82,
      orbBSize: 0.54,
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
      state.orbA = pinBackdropItem(scene.add.ellipse(width * 0.2, height * 0.14, width * 0.46, width * 0.46, 0xff8b3d, 0.09).setDepth(-10));
      state.orbB = pinBackdropItem(scene.add.ellipse(width * 0.82, height * 0.82, width * 0.54, width * 0.54, 0x5ce0a0, 0.07).setDepth(-10));
      state.vignette = pinBackdropItem(scene.add.rectangle(width * 0.5, height * 0.5, width, height, 0x02070a, 0.2).setDepth(-8));

      scene.stageBackdropState = state;
    }

    if (state.sweep) {
      state.sweep.destroy();
      delete state.sweep;
    }

    if (state.fog) {
      state.fog.destroy();
      delete state.fog;
    }

    if (state.orbC) {
      state.orbC.destroy();
      delete state.orbC;
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
    current.gridAlpha = Phaser.Math.Clamp(current.gridAlpha, 0.012, 0.028);
    current.gridSpacingX = Math.max(60, current.gridSpacingX);
    current.gridSpacingY = Math.max(72, current.gridSpacingY);
    current.orbAAlpha = Phaser.Math.Clamp(current.orbAAlpha, 0.03, 0.1);
    current.orbBAlpha = Phaser.Math.Clamp(current.orbBAlpha, 0.025, 0.08);
    current.orbASize = Phaser.Math.Clamp(current.orbASize, 0.24, 0.5);
    current.orbBSize = Phaser.Math.Clamp(current.orbBSize, 0.3, 0.58);

    state.base.clear();
    state.base.fillGradientStyle(current.topLeft, current.topRight, current.bottomLeft, current.bottomRight, 1);
    state.base.fillRect(0, 0, width, height);
    state.base.fillStyle(current.bottomLeft, 0.12);
    state.base.fillEllipse(width * 0.5, height * 0.97, width * 0.96, height * 0.16);

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

    state.orbA.setPosition(width * current.orbAX, height * current.orbAY);
    state.orbA.setSize(width * current.orbASize, width * current.orbASize);
    state.orbA.setFillStyle(current.orbAColor, current.orbAAlpha);

    state.orbB.setPosition(width * current.orbBX, height * current.orbBY);
    state.orbB.setSize(width * current.orbBSize, width * current.orbBSize);
    state.orbB.setFillStyle(current.orbBColor, current.orbBAlpha);

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
