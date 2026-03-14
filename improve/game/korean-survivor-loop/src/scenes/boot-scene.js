(function () {
  class BootScene extends Phaser.Scene {
    constructor() {
      super("BootScene");
    }

    create() {
      this.createTextures();
      this.scene.start("MenuScene");
    }

    createTextures() {
      this.createRoundedTexture("panel", 620, 320, 0x0a1d2d, 0xffffff, 0.82, 0.1, 34);
      this.createRoundedTexture("button", 360, 96, 0xff8b3d, 0xffd1aa, 1, 0.38, 28);
      this.createRoundedTexture("button-hover", 360, 96, 0xffa257, 0xffebd7, 1, 0.48, 28);
      this.createRoundedTexture("button-pressed", 360, 96, 0xf07d32, 0xffd3b1, 1, 0.3, 28);
      this.createRoundedTexture("enemy-pill", 168, 64, 0x5e2229, 0xffc0b6, 1, 0.22, 24);
      this.createEnemyTextures();
      this.createRoundedTexture("boss-pill", 240, 94, 0x6f1f1f, 0xffd1c4, 1, 0.3, 28);
      this.createRoundedTexture("pickup-pill", 126, 52, 0x1d4737, 0xc9ffe3, 1, 0.2, 22);
      this.createRoundedTexture("upgrade-card", 194, 220, 0x0f2334, 0xffffff, 0.96, 0.12, 28);
      this.createCircleTexture("player", 54, 0x5ce0a0, 0xd8fff0, 0.28);
      this.createCircleTexture("fire-orb", 30, 0xffa65e, 0xfff0c9, 0.28);
      this.createCircleTexture("bullet", 16, 0xfff0c4, 0xffffff, 0.2);
      this.createCircleTexture("enemy-bullet", 24, 0xff9a86, 0xffefe7, 0.32);
      this.createWeaponTextures();
      this.createAllyTextures();
      this.createBossTextures();
      this.createBossProjectileTextures();
      this.createFinalBossTextures();
      this.createFinalBossEffectTextures();
      this.createLoopMapTextures();
      this.createPickupIconTextures();
    }

    createRoundedTexture(key, width, height, fillColor, strokeColor, fillAlpha, strokeAlpha, radius) {
      const g = this.add.graphics();
      g.fillStyle(fillColor, fillAlpha);
      g.fillRoundedRect(0, 0, width, height, radius);
      g.lineStyle(3, strokeColor, strokeAlpha);
      g.strokeRoundedRect(2, 2, width - 4, height - 4, radius);
      g.generateTexture(key, width, height);
      g.destroy();
    }

    createCircleTexture(key, size, fillColor, strokeColor, strokeAlpha) {
      const g = this.add.graphics();
      g.fillStyle(fillColor, 1);
      g.fillCircle(size / 2, size / 2, size / 2);
      g.lineStyle(4, strokeColor, strokeAlpha);
      g.strokeCircle(size / 2, size / 2, size / 2 - 3);
      g.generateTexture(key, size, size);
      g.destroy();
    }

    createEnemyTextures() {
      this.createEnemyTexture("enemy-normal", 176, 72, (g) => {
        g.fillStyle(0xffffff, 0.96);
        g.fillRoundedRect(10, 14, 156, 44, 24);
        g.fillStyle(0xffffff, 0.22);
        g.fillRoundedRect(28, 20, 52, 12, 10);
        g.lineStyle(4, 0xffffff, 0.28);
        g.strokeRoundedRect(14, 18, 148, 36, 20);
      });

      this.createEnemyTexture("enemy-tank", 188, 88, (g) => {
        g.fillStyle(0xffffff, 0.95);
        g.fillPoints([
          { x: 20, y: 42 },
          { x: 38, y: 18 },
          { x: 86, y: 10 },
          { x: 144, y: 16 },
          { x: 170, y: 40 },
          { x: 160, y: 70 },
          { x: 102, y: 78 },
          { x: 34, y: 68 },
        ], true);
        g.fillStyle(0xffffff, 0.22);
        g.fillRoundedRect(52, 24, 84, 16, 8);
        g.lineStyle(5, 0xffffff, 0.26);
        g.strokeRoundedRect(36, 24, 112, 38, 14);
        g.lineStyle(3, 0xffffff, 0.18);
        g.beginPath();
        g.moveTo(52, 58);
        g.lineTo(88, 34);
        g.lineTo(114, 50);
        g.lineTo(142, 30);
        g.strokePath();
      });

      this.createEnemyTexture("enemy-swarm", 144, 60, (g) => {
        g.fillStyle(0xffffff, 0.98);
        g.fillPoints([
          { x: 18, y: 30 },
          { x: 62, y: 12 },
          { x: 124, y: 30 },
          { x: 62, y: 48 },
        ], true);
        g.fillStyle(0xffffff, 0.34);
        g.fillPoints([
          { x: 42, y: 30 },
          { x: 64, y: 22 },
          { x: 94, y: 30 },
          { x: 64, y: 38 },
        ], true);
        g.lineStyle(4, 0xffffff, 0.3);
        g.beginPath();
        g.moveTo(28, 30);
        g.lineTo(114, 30);
        g.strokePath();
      });
    }

    createEnemyTexture(key, width, height, drawShape) {
      const g = this.add.graphics();
      drawShape(g, width, height);
      g.generateTexture(key, width, height);
      g.destroy();
    }

    createWeaponTextures() {
      this.createWeaponTexture("blade-shot", 64, 28, (g, w, h) => {
        g.fillStyle(0xffffff, 0.96);
        g.fillPoints([
          { x: 6, y: h - 6 },
          { x: 18, y: 8 },
          { x: 38, y: 4 },
          { x: w - 6, y: h / 2 },
          { x: 34, y: h - 4 },
          { x: 14, y: h - 8 },
        ], true);
        g.fillStyle(0xffffff, 0.28);
        g.fillRoundedRect(10, 12, 18, 6, 3);
        g.lineStyle(2, 0xffffff, 0.26);
        g.strokePoints([
          { x: 8, y: h - 7 },
          { x: 19, y: 10 },
          { x: 38, y: 6 },
          { x: w - 8, y: h / 2 },
          { x: 33, y: h - 6 },
          { x: 15, y: h - 9 },
        ], true, true);
      });

      this.createWeaponTexture("disc-shot", 48, 48, (g, w, h) => {
        const c = w / 2;
        g.fillStyle(0xffffff, 0.94);
        g.fillCircle(c, c, 16);
        g.fillStyle(0xffffff, 0.24);
        g.fillCircle(c, c, 22);
        g.lineStyle(3, 0xffffff, 0.34);
        g.strokeCircle(c, c, 20);
        g.lineStyle(2, 0xffffff, 0.26);
        g.beginPath();
        g.moveTo(c, 7);
        g.lineTo(c, h - 7);
        g.moveTo(7, c);
        g.lineTo(w - 7, c);
        g.strokePath();
      });

      this.createWeaponTexture("spear-shot", 72, 20, (g, w, h) => {
        g.fillStyle(0xffffff, 0.96);
        g.fillPoints([
          { x: 4, y: h / 2 },
          { x: 22, y: 4 },
          { x: w - 10, y: h / 2 },
          { x: 22, y: h - 4 },
        ], true);
        g.fillStyle(0xffffff, 0.32);
        g.fillRoundedRect(10, 7, 22, 6, 3);
        g.lineStyle(2, 0xffffff, 0.3);
        g.strokePoints([
          { x: 5, y: h / 2 },
          { x: 22, y: 5 },
          { x: w - 12, y: h / 2 },
          { x: 22, y: h - 5 },
        ], true, true);
      });

      this.createWeaponTexture("shield-orb", 42, 42, (g, w, h) => {
        const c = w / 2;
        g.fillStyle(0xffffff, 0.96);
        g.fillPoints([
          { x: c, y: 4 },
          { x: w - 7, y: 12 },
          { x: w - 10, y: h - 9 },
          { x: c, y: h - 4 },
          { x: 10, y: h - 9 },
          { x: 7, y: 12 },
        ], true);
        g.fillStyle(0xffffff, 0.24);
        g.fillRoundedRect(c - 5, 10, 10, 16, 4);
        g.lineStyle(2, 0xffffff, 0.3);
        g.strokePoints([
          { x: c, y: 6 },
          { x: w - 9, y: 13 },
          { x: w - 12, y: h - 10 },
          { x: c, y: h - 6 },
          { x: 12, y: h - 10 },
          { x: 9, y: 13 },
        ], true, true);
      });

      this.createWeaponTexture("mist-cloud", 168, 122, (g, w, h) => {
        g.fillStyle(0xffffff, 0.22);
        g.fillCircle(44, 66, 28);
        g.fillCircle(78, 48, 34);
        g.fillCircle(112, 60, 30);
        g.fillCircle(138, 72, 22);
        g.fillRoundedRect(34, 56, 96, 34, 18);
        g.lineStyle(3, 0xffffff, 0.18);
        g.strokeEllipse(w / 2, h / 2 + 8, 118, 58);
      });

      this.createWeaponTexture("blast-shell", 52, 52, (g, w, h) => {
        const c = w / 2;
        g.fillStyle(0xffffff, 0.96);
        g.fillCircle(c, c, 12);
        g.fillStyle(0xffffff, 0.24);
        g.fillCircle(c, c, 20);
        g.fillTriangle(c, 4, c - 7, 18, c + 7, 18);
        g.fillTriangle(w - 4, c, w - 18, c - 7, w - 18, c + 7);
        g.fillTriangle(c, h - 4, c - 7, h - 18, c + 7, h - 18);
        g.fillTriangle(4, c, 18, c - 7, 18, c + 7);
        g.lineStyle(3, 0xffffff, 0.34);
        g.strokeCircle(c, c, 18);
      });

      this.createRingTexture("weapon-blast-wave", 150, 0xffffff, 0.1, 0.84, 6);
    }

    createWeaponTexture(key, width, height, drawShape) {
      const g = this.add.graphics();
      drawShape(g, width, height);
      g.generateTexture(key, width, height);
      g.destroy();
    }

    createAllyTextures() {
      this.createWeaponTexture("ally-support", 62, 62, (g, w, h) => {
        const c = w / 2;
        g.fillStyle(0xffffff, 0.96);
        g.fillCircle(c, c, 18);
        g.fillStyle(0xffffff, 0.28);
        g.fillCircle(c, c, 26);
        g.fillRoundedRect(c - 6, 10, 12, 20, 6);
        g.fillTriangle(10, 34, 24, 24, 24, 44);
        g.fillTriangle(w - 10, 34, w - 24, 24, w - 24, 44);
        g.lineStyle(3, 0xffffff, 0.34);
        g.strokeCircle(c, c, 24);
      });

      this.createWeaponTexture("ally-offense", 62, 62, (g, w, h) => {
        const c = w / 2;
        g.fillStyle(0xffffff, 0.98);
        g.fillPoints([
          { x: c, y: 4 },
          { x: c + 8, y: 22 },
          { x: w - 4, y: c },
          { x: c + 8, y: h - 22 },
          { x: c, y: h - 4 },
          { x: c - 8, y: h - 22 },
          { x: 4, y: c },
          { x: c - 8, y: 22 },
        ], true);
        g.fillStyle(0xffffff, 0.32);
        g.fillCircle(c, c, 10);
        g.lineStyle(3, 0xffffff, 0.38);
        g.strokeCircle(c, c, 20);
      });

      this.createWeaponTexture("ally-balance", 62, 62, (g, w, h) => {
        const c = w / 2;
        g.fillStyle(0xffffff, 0.96);
        g.fillPoints([
          { x: c, y: 6 },
          { x: w - 8, y: c },
          { x: c, y: h - 6 },
          { x: 8, y: c },
        ], true);
        g.fillStyle(0xffffff, 0.28);
        g.fillCircle(c, c, 14);
        g.lineStyle(3, 0xffffff, 0.36);
        g.strokeEllipse(c, c, 40, 26);
        g.strokeEllipse(c, c, 26, 40);
      });

      this.createWeaponTexture("ally-bolt", 30, 30, (g, w, h) => {
        const c = w / 2;
        g.fillStyle(0xffffff, 0.98);
        g.fillCircle(c, c, 8);
        g.fillTriangle(c, 2, c - 5, 12, c + 5, 12);
        g.fillTriangle(w - 2, c, w - 12, c - 5, w - 12, c + 5);
        g.fillTriangle(c, h - 2, c - 5, h - 12, c + 5, h - 12);
        g.fillTriangle(2, c, 12, c - 5, 12, c + 5);
        g.lineStyle(2, 0xffffff, 0.34);
        g.strokeCircle(c, c, 11);
      });
    }

    createLoopMapTextures() {
      const base = this.add.graphics();
      base.fillStyle(0x10242f, 1);
      base.fillRect(0, 0, 256, 256);
      base.fillStyle(0x173544, 0.94);

      for (let gx = 0; gx < 256; gx += 64) {
        for (let gy = 0; gy < 256; gy += 64) {
          base.fillRoundedRect(gx + 6, gy + 6, 52, 52, 14);
        }
      }

      base.lineStyle(2, 0xffffff, 0.06);
      for (let index = 0; index <= 4; index += 1) {
        const offset = index * 64;
        base.lineBetween(offset, 0, offset, 256);
        base.lineBetween(0, offset, 256, offset);
      }

      base.fillStyle(0x2f5968, 0.34);
      base.fillCircle(32, 32, 10);
      base.fillCircle(224, 32, 10);
      base.fillCircle(32, 224, 10);
      base.fillCircle(224, 224, 10);
      base.generateTexture("loopmap-base", 256, 256);
      base.destroy();

      const detail = this.add.graphics();
      detail.fillStyle(0x000000, 0);
      detail.fillRect(0, 0, 256, 256);
      detail.lineStyle(6, 0xe7d099, 0.08);
      detail.strokeCircle(128, 128, 70);
      detail.lineStyle(4, 0x95d9b0, 0.1);
      detail.strokeRoundedRect(26, 26, 204, 204, 30);
      detail.lineStyle(3, 0xffffff, 0.08);
      detail.beginPath();
      detail.moveTo(24, 128);
      detail.lineTo(232, 128);
      detail.moveTo(128, 24);
      detail.lineTo(128, 232);
      detail.strokePath();
      detail.fillStyle(0xffc16d, 0.1);
      detail.fillCircle(128, 128, 18);
      detail.fillStyle(0xa5ffd7, 0.08);
      detail.fillCircle(64, 64, 12);
      detail.fillCircle(192, 64, 12);
      detail.fillCircle(64, 192, 12);
      detail.fillCircle(192, 192, 12);
      detail.generateTexture("loopmap-detail", 256, 256);
      detail.destroy();
    }

    createBossTextures() {
      this.createBossTexture("boss-despair", (g, w, h) => {
        g.fillStyle(0xffffff, 0.94);
        g.fillRoundedRect(24, 16, 192, 54, 24);
        g.fillTriangle(58, 66, 78, 66, 68, 86);
        g.fillTriangle(110, 68, 130, 68, 120, 88);
        g.fillTriangle(162, 66, 182, 66, 172, 86);
        g.lineStyle(4, 0xffffff, 0.28);
        g.beginPath();
        g.moveTo(72, 28);
        g.lineTo(98, 54);
        g.lineTo(122, 38);
        g.lineTo(150, 60);
        g.strokePath();
      });

      this.createBossTexture("boss-chaos", (g, w, h) => {
        g.fillStyle(0xffffff, 0.9);
        g.fillPoints([
          { x: 28, y: 48 },
          { x: 68, y: 18 },
          { x: 116, y: 28 },
          { x: 176, y: 12 },
          { x: 214, y: 48 },
          { x: 188, y: 84 },
          { x: 128, y: 68 },
          { x: 64, y: 82 },
        ], true);
        g.lineStyle(4, 0xffffff, 0.24);
        g.strokeCircle(88, 48, 16);
        g.strokeCircle(154, 48, 22);
        g.lineStyle(3, 0xffffff, 0.18);
        g.beginPath();
        g.moveTo(66, 62);
        g.lineTo(118, 32);
        g.lineTo(168, 64);
        g.strokePath();
      });

      this.createBossTexture("boss-fear", (g, w, h) => {
        g.fillStyle(0xffffff, 0.92);
        g.fillEllipse(w / 2, h / 2, 212, 74);
        g.fillStyle(0x071014, 0.68);
        g.fillEllipse(w / 2, h / 2, 128, 30);
        g.fillStyle(0xffffff, 0.96);
        g.fillCircle(w / 2, h / 2, 17);
        g.fillStyle(0x081015, 0.9);
        g.fillCircle(w / 2, h / 2, 8);
        g.fillStyle(0xffffff, 0.52);
        g.fillTriangle(120, 8, 112, 22, 128, 22);
        g.fillTriangle(120, 88, 112, 74, 128, 74);
      });

      this.createBossTexture("boss-frustration", (g, w, h) => {
        g.fillStyle(0xffffff, 0.93);
        g.fillPoints([
          { x: 26, y: 26 },
          { x: 92, y: 16 },
          { x: 140, y: 18 },
          { x: 210, y: 28 },
          { x: 198, y: 80 },
          { x: 128, y: 74 },
          { x: 74, y: 82 },
          { x: 34, y: 70 },
        ], true);
        g.lineStyle(4, 0xffffff, 0.26);
        g.beginPath();
        g.moveTo(82, 28);
        g.lineTo(102, 48);
        g.lineTo(88, 62);
        g.lineTo(126, 36);
        g.lineTo(146, 54);
        g.lineTo(170, 32);
        g.strokePath();
      });
    }

    createBossTexture(key, drawShape) {
      const width = 240;
      const height = 96;
      const g = this.add.graphics();
      drawShape(g, width, height);
      g.generateTexture(key, width, height);
      g.destroy();
    }

    createBossProjectileTextures() {
      this.createBossProjectileTexture("enemy-bullet-pressure", (g, c) => {
        g.fillStyle(0xffffff, 0.94);
        g.fillRoundedRect(c - 10, c - 10, 20, 20, 5);
        g.lineStyle(2, 0xffffff, 0.22);
        g.strokeRoundedRect(c - 12, c - 12, 24, 24, 7);
        g.lineStyle(2, 0x0d0d10, 0.4);
        g.beginPath();
        g.moveTo(c - 5, c);
        g.lineTo(c + 5, c);
        g.strokePath();
      });

      this.createBossProjectileTexture("enemy-bullet-shock", (g, c) => {
        g.fillStyle(0xffffff, 0.96);
        g.fillTriangle(c, c - 12, c - 3, c - 3, c + 3, c - 3);
        g.fillTriangle(c + 12, c, c + 3, c - 3, c + 3, c + 3);
        g.fillTriangle(c, c + 12, c - 3, c + 3, c + 3, c + 3);
        g.fillTriangle(c - 12, c, c - 3, c - 3, c - 3, c + 3);
        g.fillStyle(0xffffff, 0.42);
        g.fillCircle(c, c, 5);
      });

      this.createBossProjectileTexture("enemy-bullet-confusion", (g, c) => {
        g.lineStyle(3, 0xffffff, 0.9);
        g.strokeCircle(c - 3, c, 7);
        g.strokeCircle(c + 4, c, 6);
        g.fillStyle(0xffffff, 0.3);
        g.fillCircle(c + 6, c - 6, 3);
        g.fillCircle(c - 7, c + 4, 2);
      });

      this.createBossProjectileTexture("enemy-bullet-wound", (g, c) => {
        g.fillStyle(0xffffff, 0.96);
        g.fillPoints([
          { x: c - 10, y: c + 2 },
          { x: c - 2, y: c - 10 },
          { x: c + 2, y: c - 6 },
          { x: c - 6, y: c + 6 },
        ], true);
        g.fillPoints([
          { x: c - 1, y: c + 8 },
          { x: c + 8, y: c - 8 },
          { x: c + 11, y: c - 5 },
          { x: c + 3, y: c + 11 },
        ], true);
      });
    }

    createFinalBossTextures() {
      const g = this.add.graphics();
      g.fillStyle(0xffffff, 0.95);
      g.fillEllipse(140, 74, 224, 106);
      g.fillStyle(0x091018, 0.68);
      g.fillEllipse(140, 74, 134, 52);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(140, 74, 24);
      g.fillStyle(0x101217, 0.92);
      g.fillCircle(140, 74, 11);
      g.fillStyle(0xffffff, 0.78);
      g.fillTriangle(62, 20, 104, 44, 88, 66);
      g.fillTriangle(218, 20, 176, 44, 192, 66);
      g.fillTriangle(66, 128, 108, 102, 92, 82);
      g.fillTriangle(214, 128, 172, 102, 188, 82);
      g.lineStyle(5, 0xffffff, 0.28);
      g.beginPath();
      g.moveTo(90, 36);
      g.lineTo(118, 66);
      g.lineTo(162, 52);
      g.lineTo(188, 90);
      g.strokePath();
      g.generateTexture("final-boss-core", 280, 156);
      g.destroy();

      this.createBossProjectileTexture("final-bullet-fracture", (shape, c) => {
        shape.fillStyle(0xffffff, 0.96);
        shape.fillPoints([
          { x: c - 13, y: c + 1 },
          { x: c - 2, y: c - 12 },
          { x: c + 3, y: c - 7 },
          { x: c - 6, y: c + 9 },
        ], true);
        shape.fillPoints([
          { x: c - 2, y: c + 11 },
          { x: c + 10, y: c - 9 },
          { x: c + 13, y: c - 4 },
          { x: c + 4, y: c + 13 },
        ], true);
      });

      this.createBossProjectileTexture("final-bullet-overdrive", (shape, c) => {
        shape.fillStyle(0xffffff, 0.92);
        shape.fillCircle(c, c, 9);
        shape.lineStyle(3, 0xffffff, 0.42);
        shape.strokeCircle(c, c, 14);
        shape.lineStyle(2, 0xffffff, 0.26);
        shape.beginPath();
        shape.moveTo(c - 14, c);
        shape.lineTo(c + 14, c);
        shape.moveTo(c, c - 14);
        shape.lineTo(c, c + 14);
        shape.strokePath();
      });
    }

    createFinalBossEffectTextures() {
      this.createRingTexture("final-warning-ring", 160, 0xffffff, 0.12, 0.88, 5);
      this.createImpactTexture("final-impact-wave", 180);
    }

    createBossProjectileTexture(key, drawShape) {
      const size = 34;
      const c = size / 2;
      const g = this.add.graphics();
      drawShape(g, c);
      g.generateTexture(key, size, size);
      g.destroy();
    }

    createRingTexture(key, size, fillColor, fillAlpha, strokeAlpha, strokeWidth) {
      const g = this.add.graphics();
      const center = size / 2;
      const radius = center - strokeWidth - 2;

      g.fillStyle(fillColor, fillAlpha);
      g.fillCircle(center, center, radius);
      g.lineStyle(strokeWidth, fillColor, strokeAlpha);
      g.strokeCircle(center, center, radius - strokeWidth * 0.3);
      g.generateTexture(key, size, size);
      g.destroy();
    }

    createImpactTexture(key, size) {
      const g = this.add.graphics();
      const center = size / 2;

      g.fillStyle(0xffffff, 0.4);
      g.fillCircle(center, center, center - 20);
      g.lineStyle(8, 0xffffff, 0.94);
      g.strokeCircle(center, center, center - 26);
      g.lineStyle(3, 0xffffff, 0.28);
      g.strokeCircle(center, center, center - 12);
      g.generateTexture(key, size, size);
      g.destroy();
    }

    createPickupIconTextures() {
      this.createPickupIconTexture("pickup-icon-xp", 0x8ff0b4, (g, c) => {
        g.fillStyle(0xeffff4, 1);
        g.fillTriangle(c, c - 8, c - 2, c - 2, c + 2, c - 2);
        g.fillTriangle(c + 8, c, c + 2, c - 2, c + 2, c + 2);
        g.fillTriangle(c, c + 8, c - 2, c + 2, c + 2, c + 2);
        g.fillTriangle(c - 8, c, c - 2, c - 2, c - 2, c + 2);
        g.fillStyle(0x8ff0b4, 1);
        g.fillCircle(c, c, 3);
      });

      this.createPickupIconTexture("pickup-icon-score", 0xffdb82, (g, c) => {
        g.fillStyle(0xffdb82, 1);
        g.fillCircle(c, c, 7);
        g.lineStyle(2, 0xfff7da, 0.95);
        g.strokeCircle(c, c, 7);
        g.lineStyle(2, 0xb97a23, 0.75);
        g.beginPath();
        g.moveTo(c, c - 4);
        g.lineTo(c, c + 4);
        g.strokePath();
      });

      this.createPickupIconTexture("pickup-icon-heal", 0x72efb8, (g, c) => {
        g.fillStyle(0xf2fff8, 1);
        g.fillRoundedRect(c - 6, c - 2, 12, 4, 2);
        g.fillRoundedRect(c - 2, c - 6, 4, 12, 2);
      });

      this.createPickupIconTexture("pickup-icon-shield", 0x8ad3ff, (g, c) => {
        g.fillStyle(0xeaf8ff, 1);
        g.fillPoints([
          { x: c, y: c - 7 },
          { x: c + 6, y: c - 3 },
          { x: c + 4, y: c + 5 },
          { x: c, y: c + 8 },
          { x: c - 4, y: c + 5 },
          { x: c - 6, y: c - 3 },
        ], true);
      });

      this.createPickupIconTexture("pickup-icon-speed", 0xffc985, (g, c) => {
        g.fillStyle(0xfff6ea, 1);
        g.fillTriangle(c - 7, c, c - 1, c - 5, c - 1, c + 5);
        g.fillTriangle(c, c, c + 6, c - 5, c + 6, c + 5);
      });

      this.createPickupIconTexture("pickup-icon-magnet", 0x89ecff, (g, c) => {
        g.fillStyle(0xeefdff, 1);
        g.fillRoundedRect(c - 8, c - 7, 4, 14, 2);
        g.fillRoundedRect(c + 4, c - 7, 4, 14, 2);
        g.fillRoundedRect(c - 8, c + 3, 16, 4, 2);
        g.fillStyle(0x89ecff, 1);
        g.fillRoundedRect(c - 8, c - 9, 4, 3, 1);
        g.fillRoundedRect(c + 4, c - 9, 4, 3, 1);
      });

      this.createPickupIconTexture("pickup-icon-transform", 0xff9bf2, (g, c) => {
        g.fillStyle(0xfff0fd, 1);
        g.fillPoints([
          { x: c, y: c - 8 },
          { x: c + 3, y: c - 2 },
          { x: c + 9, y: c },
          { x: c + 3, y: c + 3 },
          { x: c, y: c + 9 },
          { x: c - 3, y: c + 3 },
          { x: c - 9, y: c },
          { x: c - 3, y: c - 2 },
        ], true);
        g.fillStyle(0xff9bf2, 1);
        g.fillCircle(c, c, 2);
      });

      this.createPickupIconTexture("pickup-icon-cleanup", 0xffef92, (g, c) => {
        g.fillStyle(0xfffceb, 1);
        g.fillTriangle(c, c - 8, c - 2, c - 2, c + 2, c - 2);
        g.fillTriangle(c + 8, c, c + 2, c - 2, c + 2, c + 2);
        g.fillTriangle(c, c + 8, c - 2, c + 2, c + 2, c + 2);
        g.fillTriangle(c - 8, c, c - 2, c - 2, c - 2, c + 2);
        g.fillStyle(0xffef92, 1);
        g.fillCircle(c, c, 3);
      });

      this.createPickupIconTexture("pickup-icon-beam", 0x8fefff, (g, c) => {
        g.fillStyle(0xf4feff, 1);
        g.fillRoundedRect(c - 8, c - 3, 14, 6, 3);
        g.fillTriangle(c + 7, c - 6, c + 12, c, c + 7, c + 6);
        g.fillStyle(0x8fefff, 1);
        g.fillRect(c - 10, c - 1, 3, 2);
        g.fillRect(c - 14, c - 1, 2, 2);
      });
    }

    createPickupIconTexture(key, ringColor, drawSymbol) {
      const size = 30;
      const c = size / 2;
      const g = this.add.graphics();

      g.fillStyle(0x08120d, 0.94);
      g.fillCircle(c, c, 14);
      g.lineStyle(2, ringColor, 0.7);
      g.strokeCircle(c, c, 12);

      drawSymbol(g, c);

      g.generateTexture(key, size, size);
      g.destroy();
    }
  }

  window.KoreanSurvivorGame = window.KoreanSurvivorGame || {};
  window.KoreanSurvivorGame.BootScene = BootScene;
})();
