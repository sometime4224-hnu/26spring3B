(function () {
  class ArenaScene extends Phaser.Scene {
    constructor() {
      super("ArenaScene");
      this.scenePayload = {};
    }

    init(data) {
      this.scenePayload = data || {};
    }

    create() {
      const gameData = window.KoreanSurvivorGame;
      const ui = gameData.ui;
      this.isBossRushTestMode = !!(this.scenePayload && this.scenePayload.bossRushTestMode);

      this.font = gameData.fontFamily;
      this.vocabData = gameData.vocabData;
      this.roundSeconds = 90;
      this.timeRemaining = this.roundSeconds;
      this.runStages = this.buildStageRun();
      this.stageCount = Math.max(1, this.runStages.length || 1);
      this.currentStageIndex = 0;
      this.currentStageData = null;
      this.stagesCleared = 0;
      this.pendingStageIndex = null;
      this.stageTransitionOverlay = null;
      this.bossRushTestOverlay = null;
      this.bossRushTestDraft = null;
      this.stageRecoveryAmount = 12;
      this.stageWaveTriggered = {};
      this.stageBossSequenceStarted = false;
      this.stageBossSpawned = false;
      this.pendingStageBoss = false;
      this.currentStageBoss = null;
      this.score = 0;
      this.level = 1;
      this.experience = 0;
      this.nextLevelExperience = 42;
      this.hp = 100;
      this.maxHp = 100;
      this.negativeClears = 0;
      this.bossDefeats = 0;
      this.pickupCount = 0;
      this.damageDealt = 0;
      this.damageTaken = 0;
      this.pickupStats = {};
      this.runStartedAt = new Date().toISOString();
      this.elapsedSeconds = 0;
      this.awakeningCharge = 0;
      this.awakeningThreshold = 100;
      this.awakeningCount = 0;
      this.awakeningUntil = 0;
      this.wasAwakeningActive = false;
      this.wasTransformActive = false;
      this.finalBossPhase = false;
      this.finalBossSpawned = false;
      this.finalBossDefeated = false;
      this.finalBossIntroUntil = 0;
      this.finalBoss = null;
      this.finalBossPatternIndex = 0;
      this.finalBossRushPhase = false;
      this.finalBossRushBossesRemaining = 0;
      this.roundEnded = false;
      this.isLevelUp = false;
      this.playerInvulnerableUntil = 0;
      this.feedbackUntil = 0;
      this.transformUntil = 0;
      this.isMagnetCollecting = false;
      this.beamSweep = null;
      this.joystickActive = false;
      this.joystickOriginX = 0;
      this.joystickOriginY = 0;
      this.joystickRadius = 72;
      this.joystickDeadZone = 12;
      this.lastMoveAngle = -Math.PI / 2;
      this.mapLoopWidth = 1792;
      this.mapLoopHeight = 1792;
      this.combatCullRadius = 1180;
      this.levelUpOverlay = null;

      this.attackDamage = 1;
      this.basePlayerSpeed = 248;
      this.attackCooldown = 340;
      this.attackRange = 320;
      this.pickupLuck = 0;
      this.healBonus = 0;
      this.shieldUntil = 0;
      this.speedBoostUntil = 0;
      this.waveLevel = 0;
      this.fireLevel = 0;
      this.fireAngle = 0;
      this.lightningLevel = 0;
      this.spearLevel = 0;
      this.chainLevel = 0;
      this.shieldWeaponLevel = 0;
      this.shieldAngle = 0;
      this.mistLevel = 0;
      this.linkLevel = 0;
      this.splitLevel = 0;
      this.amplifyLevel = 0;
      this.durationLevel = 0;
      this.siphonLevel = 0;
      this.trackingLevel = 0;
      this.blastLevel = 0;
      this.bladeLevel = 0;
      this.discLevel = 0;
      this.legendaryLevels = {
        giant: 0,
        tempest: 0,
        comet: 0,
        harvest: 0,
        supernova: 0,
      };
      this.fireOrbs = [];
      this.shieldOrbs = [];
      this.mistZones = [];
      this.enemyIdCounter = 0;
      this.upgradeLevels = {};
      this.strongWaveTimer = null;
      this.bossAidAllies = [];
      this.bossAidThresholds = (this.vocabData.bossAidThresholds || [0.5, 0.3, 0.15]).slice();
      this.bossAidThresholdsTriggered = {};
      this.bossAidCandidates = this.rollBossAidCandidates();

      (this.vocabData.upgrades || []).forEach((upgrade) => {
        this.upgradeLevels[upgrade.key] = 0;
      });

      ui.drawBackdrop(this, this.getStageData(0) ? this.getStageData(0).backdropTheme : null);
      this.createLoopMapBackdrop();
      this.physics.world.setBounds(
        -this.mapLoopWidth,
        -this.mapLoopHeight,
        this.mapLoopWidth * 3,
        this.mapLoopHeight * 3
      );

      this.enemies = this.physics.add.group();
      this.bullets = this.physics.add.group();
      this.enemyProjectiles = this.physics.add.group();
      this.pickups = this.physics.add.group();
      this.fireOrbGroup = this.physics.add.group();
      this.shieldOrbGroup = this.physics.add.group();

      const playerStartX = this.mapLoopWidth / 2;
      const playerStartY = this.mapLoopHeight / 2;

      this.player = this.physics.add.image(playerStartX, playerStartY, "player");
      this.player.setCircle(23, 4, 4);
      this.player.setCollideWorldBounds(false);
      this.player.setDepth(5);
      this.cameras.main.startFollow(this.player, true, 1, 1);
      this.cameras.main.setRoundPixels(true);

      this.auraRing = this.add.circle(playerStartX, playerStartY, 46, 0x8ad3ff, 0.08).setStrokeStyle(3, 0x8ad3ff, 0.55).setVisible(false).setDepth(4);
      this.awakeningRing = this.add.circle(playerStartX, playerStartY, 56, 0xffd166, 0.06).setStrokeStyle(5, 0xfff0b5, 0.72).setVisible(false).setDepth(6);
      this.magnetField = this.add.circle(playerStartX, playerStartY, 74, 0x89ecff, 0.05).setStrokeStyle(4, 0xcff8ff, 0.68).setVisible(false).setDepth(6);
      this.magnetLinks = this.add.graphics().setDepth(3);
      this.giantHalo = this.add.circle(playerStartX, playerStartY, 66, 0xffd9a0, 0.06).setStrokeStyle(4, 0xffe7bc, 0.52).setVisible(false).setDepth(3);
      this.tempestRing = this.add.image(playerStartX, playerStartY, "weapon-blast-wave").setTint(0x9fdcff).setAlpha(0).setDepth(3);
      this.harvestRing = this.add.image(playerStartX, playerStartY, "weapon-blast-wave").setTint(0xc7f2ff).setAlpha(0).setDepth(3);
      this.supernovaRing = this.add.image(playerStartX, playerStartY, "weapon-blast-wave").setTint(0xd6a3ff).setAlpha(0).setDepth(3);
      this.cometOrbitals = Array.from({ length: 3 }, () => (
        this.add.image(playerStartX, playerStartY, "bullet").setTint(0xd8c9ff).setAlpha(0).setDepth(5)
      ));
      this.harvestOrbitals = Array.from({ length: 4 }, () => (
        this.add.image(playerStartX, playerStartY, "disc-shot").setTint(0xdff7ff).setScale(0.9).setAlpha(0).setDepth(5)
      ));
      this.touchRing = this.add.circle(0, 0, this.joystickRadius, 0xffffff, 0.08).setStrokeStyle(3, 0xffffff, 0.18).setVisible(false).setDepth(30);
      this.touchDot = this.add.circle(0, 0, 22, 0xffffff, 0.22).setStrokeStyle(2, 0xffffff, 0.22).setVisible(false).setDepth(31);
      this.pinUiItems([this.touchRing, this.touchDot]);
      this.createPlayerHealthBar();

      this.createHud();
      this.pinDisplayObjectsAboveDepth(20);
      this.updateLoopMapBackdrop();

      this.physics.add.overlap(this.bullets, this.enemies, this.handleBulletHit, null, this);
      this.physics.add.overlap(this.player, this.enemies, this.handlePlayerHit, null, this);
      this.physics.add.overlap(this.player, this.enemyProjectiles, this.handleEnemyProjectileHit, null, this);
      this.physics.add.overlap(this.player, this.pickups, this.handlePickup, null, this);
      this.physics.add.overlap(this.fireOrbGroup, this.enemies, this.handleFireOrbHit, null, this);
      this.physics.add.overlap(this.shieldOrbGroup, this.enemies, this.handleShieldHit, null, this);
      this.physics.add.overlap(this.shieldOrbGroup, this.enemyProjectiles, this.handleShieldProjectileHit, null, this);

      this.refreshAttackTimer();
      this.refreshLightningTimer();
      this.refreshWaveTimer();
      this.refreshSpearTimer();
      this.refreshChainTimer();
      this.refreshMistTimer();
      this.refreshBlastTimer();
      this.refreshBladeTimer();
      this.refreshDiscTimer();
      this.applyStageData(0, {
        skipSpawns: this.isBossRushTestMode,
        silent: this.isBossRushTestMode,
      });

      if (this.isBossRushTestMode) {
        this.time.delayedCall(40, () => this.openBossRushTestPrep());
      }
    }

    createHud() {
      this.add.rectangle(0, 0, 720, 186, 0x03111b, 0.34).setOrigin(0).setDepth(20);

      this.add.text(36, 30, "HP", {
        fontFamily: this.font,
        fontSize: "18px",
        fontStyle: "700",
        color: "#95efbf",
      }).setDepth(21);

      this.hpBarTrack = this.add.rectangle(84, 42, 170, 16, 0xffffff, 0.12).setOrigin(0, 0.5).setDepth(21);
      this.hpBarFill = this.add.rectangle(84, 42, 170, 16, 0x5ce0a0, 1).setOrigin(0, 0.5).setDepth(22);

      this.levelText = this.add.text(284, 28, "레벨 1", {
        fontFamily: this.font,
        fontSize: "28px",
        fontStyle: "800",
        color: "#f8fcff",
      }).setDepth(21);

      this.stageText = this.add.text(284, 62, "1단계", {
        fontFamily: this.font,
        fontSize: "16px",
        fontStyle: "800",
        color: "#ffcb92",
      }).setDepth(21);

      this.timeText = this.add.text(502, 28, "90s", {
        fontFamily: this.font,
        fontSize: "28px",
        fontStyle: "800",
        color: "#f8fcff",
      }).setDepth(21);

      this.scoreText = this.add.text(650, 30, "0", {
        fontFamily: this.font,
        fontSize: "22px",
        fontStyle: "700",
        color: "#ffcb92",
      }).setOrigin(1, 0).setDepth(21);

      this.add.text(650, 58, "SCORE", {
        fontFamily: this.font,
        fontSize: "12px",
        fontStyle: "700",
        color: "#84a0b5",
        letterSpacing: 1.4,
      }).setOrigin(1, 0).setDepth(21);

      this.add.text(36, 78, "경험", {
        fontFamily: this.font,
        fontSize: "18px",
        fontStyle: "700",
        color: "#8ee2aa",
      }).setDepth(21);

      this.xpBarTrack = this.add.rectangle(96, 90, 524, 14, 0xffffff, 0.12).setOrigin(0, 0.5).setDepth(21);
      this.xpBarFill = this.add.rectangle(96, 90, 524, 14, 0x86e5a0, 1).setOrigin(0, 0.5).setDepth(22);

      this.add.text(36, 114, "각성", {
        fontFamily: this.font,
        fontSize: "18px",
        fontStyle: "700",
        color: "#ffd88c",
      }).setDepth(21);

      this.awakeningBarTrack = this.add.rectangle(96, 126, 524, 12, 0xffffff, 0.12).setOrigin(0, 0.5).setDepth(21);
      this.awakeningBarFill = this.add.rectangle(96, 126, 524, 12, 0xffc35d, 1).setOrigin(0, 0.5).setDepth(22);
      this.awakeningStatusText = this.add.text(650, 108, "준비 0%", {
        fontFamily: this.font,
        fontSize: "15px",
        fontStyle: "700",
        color: "#ffd88c",
      }).setOrigin(1, 0).setDepth(21);

      this.feedbackText = this.add.text(360, 156, "", {
        fontFamily: this.font,
        fontSize: "22px",
        fontStyle: "700",
        color: "#ffd4aa",
      }).setOrigin(0.5).setDepth(21);

      this.phaseText = this.add.text(360, 186, "", {
        fontFamily: this.font,
        fontSize: "20px",
        fontStyle: "800",
        color: "#ffbbaa",
      }).setOrigin(0.5).setDepth(21);

      this.awakeningBanner = this.add.text(360, 214, "", {
        fontFamily: this.font,
        fontSize: "34px",
        fontStyle: "900",
        color: "#fff1b5",
      }).setOrigin(0.5).setDepth(24).setAlpha(0);
      this.awakeningBanner.setStroke("#6e4d12", 8);
    }

    createPlayerHealthBar() {
      this.playerHpBarTrack = this.add.rectangle(this.player.x - 30, this.player.y + 38, 60, 8, 0x08110d, 0.78)
        .setOrigin(0, 0.5)
        .setDepth(7);
      this.playerHpBarFill = this.add.rectangle(this.player.x - 30, this.player.y + 38, 60, 8, 0x5ce0a0, 1)
        .setOrigin(0, 0.5)
        .setDepth(8);
      this.refreshPlayerHealthBar();
    }

    refreshPlayerHealthBar() {
      if (!this.player || !this.playerHpBarTrack || !this.playerHpBarFill) {
        return;
      }

      const ratio = Phaser.Math.Clamp(this.hp / Math.max(1, this.maxHp), 0, 1);
      const width = 60;
      const barX = this.player.x - (width / 2);
      const barY = this.player.y + 38;
      const fillColor = ratio > 0.5 ? 0x5ce0a0 : ratio > 0.25 ? 0xffc857 : 0xff7b71;

      this.playerHpBarTrack.setPosition(barX, barY);
      this.playerHpBarTrack.width = width;
      this.playerHpBarTrack.alpha = this.time.now < this.playerInvulnerableUntil ? 0.92 : 0.78;

      this.playerHpBarFill.setPosition(barX, barY);
      this.playerHpBarFill.width = width * ratio;
      this.playerHpBarFill.fillColor = fillColor;
      this.playerHpBarFill.alpha = this.time.now < this.playerInvulnerableUntil ? 0.9 : 1;
    }

    pinUiItem(item) {
      if (item && item.setScrollFactor) {
        item.setScrollFactor(0);
      }

      return item;
    }

    pinUiItems(items) {
      (items || []).forEach((item) => this.pinUiItem(item));
      return items;
    }

    pinDisplayObjectsAboveDepth(minDepth) {
      this.children.list.forEach((item) => {
        if (item && item.depth >= minDepth && item.setScrollFactor) {
          item.setScrollFactor(0);
        }
      });
    }

    createLoopMapBackdrop() {
      this.mapBackdropBase = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, "loopmap-base")
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(0.2)
        .setAlpha(0.84);
      this.mapBackdropDetail = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, "loopmap-detail")
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(0.3)
        .setAlpha(0.48);
    }

    updateLoopMapBackdrop() {
      if (!this.mapBackdropBase || !this.player) {
        return;
      }

      this.mapBackdropBase.tilePositionX = this.player.x * 0.74;
      this.mapBackdropBase.tilePositionY = this.player.y * 0.74;
      this.mapBackdropDetail.tilePositionX = this.player.x * 1.08;
      this.mapBackdropDetail.tilePositionY = this.player.y * 1.08;
    }

    getCombatBounds(margin) {
      const extra = margin || 0;
      const halfWidth = this.scale.width / 2;
      const halfHeight = this.scale.height / 2;
      return {
        left: this.player.x - halfWidth - extra,
        right: this.player.x + halfWidth + extra,
        top: this.player.y - halfHeight - extra,
        bottom: this.player.y + halfHeight + extra,
      };
    }

    getCombatSafeBounds(paddingX, paddingTop, paddingBottom) {
      const bounds = this.getCombatBounds(0);
      return {
        left: bounds.left + (paddingX == null ? 90 : paddingX),
        right: bounds.right - (paddingX == null ? 90 : paddingX),
        top: bounds.top + (paddingTop == null ? 236 : paddingTop),
        bottom: bounds.bottom - (paddingBottom == null ? 110 : paddingBottom),
      };
    }

    getRandomCombatPoint(paddingX, paddingTop, paddingBottom) {
      const bounds = this.getCombatSafeBounds(paddingX, paddingTop, paddingBottom);
      return {
        x: Phaser.Math.Between(Math.round(bounds.left), Math.round(bounds.right)),
        y: Phaser.Math.Between(Math.round(bounds.top), Math.round(bounds.bottom)),
      };
    }

    getRandomPointNearPlayer(rangeX, rangeY, paddingX, paddingTop, paddingBottom) {
      const bounds = this.getCombatSafeBounds(paddingX, paddingTop, paddingBottom);
      return {
        x: Phaser.Math.Clamp(this.player.x + Phaser.Math.Between(-rangeX, rangeX), bounds.left, bounds.right),
        y: Phaser.Math.Clamp(this.player.y + Phaser.Math.Between(-rangeY, rangeY), bounds.top, bounds.bottom),
      };
    }

    getLoopWrappedDelta(origin, target, size) {
      let delta = target - origin;

      if (delta > size / 2) {
        delta -= size;
      } else if (delta < -size / 2) {
        delta += size;
      }

      return delta;
    }

    wrapPlayerPosition() {
      const wrappedX = Phaser.Math.Wrap(this.player.x, 0, this.mapLoopWidth);
      const wrappedY = Phaser.Math.Wrap(this.player.y, 0, this.mapLoopHeight);

      if (wrappedX !== this.player.x || wrappedY !== this.player.y) {
        this.player.setPosition(wrappedX, wrappedY);
      }
    }

    normalizeObjectToPlayer(object) {
      if (!object || !object.active || object === this.player) {
        return;
      }

      const nextX = this.player.x + this.getLoopWrappedDelta(this.player.x, object.x, this.mapLoopWidth);
      const nextY = this.player.y + this.getLoopWrappedDelta(this.player.y, object.y, this.mapLoopHeight);

      if (object.setPosition) {
        object.setPosition(nextX, nextY);
      } else {
        object.x = nextX;
        object.y = nextY;
      }
    }

    normalizeCombatObjectsToPlayer() {
      this.enemies.children.iterate((enemy) => this.normalizeObjectToPlayer(enemy));
      this.bullets.children.iterate((bullet) => this.normalizeObjectToPlayer(bullet));
      this.enemyProjectiles.children.iterate((projectile) => this.normalizeObjectToPlayer(projectile));
      this.pickups.children.iterate((pickup) => this.normalizeObjectToPlayer(pickup));

      this.mistZones.forEach((zone) => {
        if (zone && zone.sprite && zone.sprite.active) {
          this.normalizeObjectToPlayer(zone.sprite);
        }
      });
    }

    colorToHex(colorValue) {
      return `#${(colorValue || 0xffffff).toString(16).padStart(6, "0")}`;
    }

    applyStageBackdropTheme() {
      const ui = window.KoreanSurvivorGame.ui;
      const stage = this.getCurrentStageData();
      const theme = stage ? stage.backdropTheme : null;

      if (ui && ui.applyBackdropTheme) {
        ui.applyBackdropTheme(this, theme);
      }

      const loopTheme = theme && theme.loopMap ? theme.loopMap : {};

      if (this.mapBackdropBase) {
        this.mapBackdropBase.setTint(loopTheme.baseTint == null ? 0x39556a : loopTheme.baseTint);
        this.mapBackdropBase.setAlpha(Phaser.Math.Clamp(loopTheme.baseAlpha == null ? 0.84 : loopTheme.baseAlpha, 0.7, 0.84));
      }

      if (this.mapBackdropDetail) {
        this.mapBackdropDetail.setTint(loopTheme.detailTint == null ? 0xaad2e0 : loopTheme.detailTint);
        this.mapBackdropDetail.setAlpha(Phaser.Math.Clamp(loopTheme.detailAlpha == null ? 0.48 : loopTheme.detailAlpha, 0.22, 0.48));
      }
    }

    rollBossAidCandidates() {
      const pool = (this.vocabData.bossAidAllies || []).slice();
      Phaser.Utils.Array.Shuffle(pool);
      return pool.slice(0, Math.min(this.bossAidThresholds.length, pool.length));
    }

    getBossAidProfile(roleKey) {
      const profiles = {
        support: {
          texture: "ally-support",
          attackPower: 0,
          supportPower: 10,
          attackDelay: Number.MAX_SAFE_INTEGER,
          supportDelay: 5200,
        },
        offense: {
          texture: "ally-offense",
          attackPower: 9,
          supportPower: 1,
          attackDelay: 920,
          supportDelay: 18000,
        },
        balance: {
          texture: "ally-balance",
          attackPower: 5,
          supportPower: 5,
          attackDelay: 1450,
          supportDelay: 9200,
        },
      };

      return profiles[roleKey] || profiles.balance;
    }

    canTriggerBossAid() {
      return !this.roundEnded && (this.finalBossRushPhase || this.finalBossPhase);
    }

    checkBossAidSummons(forcedHpRatio) {
      if (!this.canTriggerBossAid() || !this.bossAidCandidates.length) {
        return;
      }

      const hpRatio = forcedHpRatio == null
        ? Phaser.Math.Clamp(this.hp / Math.max(1, this.maxHp), 0, 1)
        : Phaser.Math.Clamp(forcedHpRatio, 0, 1);

      this.bossAidThresholds.forEach((threshold, index) => {
        if (hpRatio > threshold || this.bossAidThresholdsTriggered[index]) {
          return;
        }

        const definition = this.bossAidCandidates[index];

        if (!definition) {
          this.bossAidThresholdsTriggered[index] = true;
          return;
        }

        this.bossAidThresholdsTriggered[index] = true;
        this.summonBossAid(definition, index);
      });
    }

    summonBossAid(definition, thresholdIndex) {
      const profile = this.getBossAidProfile(definition.role);
      const angle = (-Math.PI / 2) + thresholdIndex * ((Math.PI * 2) / Math.max(3, this.bossAidThresholds.length));
      const radius = 86 + thresholdIndex * 12;
      const spawnX = this.player.x + Math.cos(angle) * radius;
      const spawnY = this.player.y + Math.sin(angle) * 24;
      const sprite = this.add.image(spawnX, spawnY, profile.texture)
        .setDepth(7)
        .setTint(definition.color)
        .setScale(0.96);
      const halo = this.add.circle(spawnX, spawnY, 28, definition.auraColor || definition.color, 0.18)
        .setDepth(5)
        .setStrokeStyle(3, definition.accentColor || 0xffffff, 0.46);
      const pulse = this.add.circle(spawnX, spawnY, 18, definition.color, 0.1)
        .setDepth(6)
        .setBlendMode(Phaser.BlendModes.ADD);
      const label = this.add.text(spawnX, spawnY + 40, definition.word, {
        fontFamily: this.font,
        fontSize: "19px",
        fontStyle: "900",
        color: "#fffef7",
        align: "center",
        backgroundColor: "rgba(8, 28, 24, 0.78)",
      }).setOrigin(0.5).setDepth(8);
      label.setPadding(12, 3, 12, 3);
      label.setStroke("#083026", 4);

      const ally = {
        word: definition.word,
        roleKey: definition.role,
        color: definition.color,
        accentColor: definition.accentColor || definition.color,
        auraColor: definition.auraColor || definition.color,
        attackPower: profile.attackPower,
        supportPower: profile.supportPower,
        attackDelay: profile.attackDelay,
        supportDelay: profile.supportDelay,
        sprite,
        halo,
        pulse,
        label,
        slotIndex: this.bossAidAllies.length,
        orbitSeed: Phaser.Math.FloatBetween(0, Math.PI * 2),
        nextAttackAt: this.time.now + 520 + thresholdIndex * 120,
        nextSupportAt: this.time.now + 1200 + thresholdIndex * 180,
        supportStep: 0,
        shotCount: 0,
      };

      this.bossAidAllies.push(ally);

      const healAmount = Math.max(1, Math.round(this.maxHp * 0.3));
      this.hp = Math.min(this.maxHp, this.hp + healAmount);
      this.showFeedback(`${definition.word} 합류`, this.colorToHex(ally.accentColor));
      this.showFloatingText(this.player.x, this.player.y - 96, `${definition.word} +${healAmount}`, this.colorToHex(ally.accentColor), "26px");
      this.wordBurst(spawnX, spawnY, definition.color);
      this.cameras.main.flash(120, 180, 255, 225, false);
      this.refreshHud();
    }

    updateBossAidAllies(delta) {
      if (!this.bossAidAllies.length) {
        return;
      }

      const now = this.time.now;

      for (let index = this.bossAidAllies.length - 1; index >= 0; index -= 1) {
        const ally = this.bossAidAllies[index];

        if (!ally || !ally.sprite || !ally.sprite.active) {
          this.bossAidAllies.splice(index, 1);
          continue;
        }

        const angle = ally.orbitSeed + now * 0.0013 + index * 0.95;
        const radiusX = 82 + index * 10;
        const radiusY = 28 + index * 4;
        const targetX = this.player.x + Math.cos(angle) * radiusX;
        const targetY = this.player.y - 52 + Math.sin(angle * 1.2) * radiusY;

        ally.sprite.x = Phaser.Math.Linear(ally.sprite.x, targetX, 0.14);
        ally.sprite.y = Phaser.Math.Linear(ally.sprite.y, targetY, 0.14);
        ally.sprite.rotation += 0.004 + ally.attackPower * 0.00006;
        ally.halo.setPosition(ally.sprite.x, ally.sprite.y);
        ally.pulse.setPosition(ally.sprite.x, ally.sprite.y);
        ally.label.setPosition(ally.sprite.x, ally.sprite.y + 40);
        ally.halo.setScale(1 + Math.abs(Math.sin(now * 0.003 + index)) * 0.12);
        ally.pulse.setScale(1 + Math.abs(Math.sin(now * 0.006 + index * 0.8)) * 0.28);
        ally.pulse.setAlpha(0.16 + Math.abs(Math.sin(now * 0.004 + index * 0.5)) * 0.12);

        if (ally.supportPower > 0 && now >= ally.nextSupportAt) {
          this.performBossAidSupport(ally);
          ally.nextSupportAt = now + ally.supportDelay;
        }

        if (ally.attackPower > 0 && now >= ally.nextAttackAt) {
          this.performBossAidAttack(ally);
          ally.nextAttackAt = now + ally.attackDelay;
        }
      }
    }

    performBossAidSupport(ally) {
      if (!ally || !ally.sprite || !ally.sprite.active) {
        return;
      }

      ally.supportStep += 1;
      const hpRatio = Phaser.Math.Clamp(this.hp / Math.max(1, this.maxHp), 0, 1);
      let definition;

      if (ally.supportPower >= 9) {
        definition = hpRatio < 0.72 || ally.supportStep % 2 === 1
          ? { word: "회복", type: "heal", amount: 12, color: 0x72efb8 }
          : { word: "보호", type: "shield", amount: 2, color: 0x8ad3ff };
      } else if (ally.supportPower >= 5) {
        definition = hpRatio < 0.56
          ? { word: "약", type: "heal", amount: 9, color: 0xa8ffd1 }
          : (ally.supportStep % 2 === 0
            ? { word: "보호", type: "shield", amount: 1, color: 0x8ad3ff }
            : { word: "속도", type: "speed", amount: 1, color: 0xffc985 });
      } else {
        definition = hpRatio < 0.4
          ? { word: "약", type: "heal", amount: 7, color: 0xa8ffd1 }
          : { word: "보호", type: "shield", amount: 1, color: 0x8ad3ff };
      }

      const spawnX = this.player.x + Phaser.Math.Between(-38, 38);
      const spawnY = this.player.y + Phaser.Math.Between(-26, 26);
      this.spawnPickupFromDefinition(spawnX, spawnY, definition);
      this.showFloatingText(ally.sprite.x, ally.sprite.y - 30, definition.word, this.colorToHex(ally.accentColor), "18px");

      if (ally.supportPower >= 9 && hpRatio < 0.3) {
        const bonusHeal = Math.max(2, Math.round(this.maxHp * 0.02));
        this.hp = Math.min(this.maxHp, this.hp + bonusHeal);
        this.showFloatingText(this.player.x, this.player.y - 72, `+${bonusHeal}`, this.colorToHex(ally.accentColor), "18px");
      }

      this.refreshHud();
    }

    performBossAidAttack(ally) {
      if (!ally || !ally.sprite || !ally.sprite.active) {
        return;
      }

      const target = this.findPriorityEnemyFromPoint(ally.sprite.x, ally.sprite.y, this.attackRange + 280);

      if (!target) {
        return;
      }

      const angle = Phaser.Math.Angle.Between(ally.sprite.x, ally.sprite.y, target.x, target.y);
      const damage = ally.attackPower >= 8 ? 7 : 4;
      const bolt = this.spawnPlayerBullet({
        x: ally.sprite.x,
        y: ally.sprite.y,
        texture: "ally-bolt",
        weaponType: "ally",
        angle: angle,
        speed: 520 + ally.attackPower * 10,
        damage: damage,
        lifespan: 980,
        displayWidth: 20 + ally.attackPower,
        displayHeight: 20 + ally.attackPower,
        bodyCircleRadius: 8,
        bodyCircleOffsetX: 7,
        bodyCircleOffsetY: 7,
        homingStrength: 0.04 + ally.attackPower * 0.004,
        tintColor: ally.color,
        depth: 4,
      });
      bolt.setAlpha(0.94);
      ally.shotCount += 1;

      if (ally.shotCount % 3 === 1) {
        this.showFloatingText(ally.sprite.x, ally.sprite.y - 30, ally.word, this.colorToHex(ally.accentColor), "18px");
      }
    }

    destroyBossAidAllies() {
      this.bossAidAllies.forEach((ally) => {
        ["sprite", "halo", "pulse", "label"].forEach((key) => {
          if (ally && ally[key] && ally[key].active) {
            ally[key].destroy();
          }
        });
      });
      this.bossAidAllies = [];
    }

    getBossRushTestUpgradeBudget() {
      return 24;
    }

    getBossRushTestLegendaryBudget() {
      return 5;
    }

    getBossRushTestPages() {
      return [
        {
          key: "core",
          label: "기본/속성",
          entries: (this.vocabData.upgrades || []).filter((upgrade) => upgrade.kind !== "weapon"),
        },
        {
          key: "weapon",
          label: "무기",
          entries: (this.vocabData.upgrades || []).filter((upgrade) => upgrade.kind === "weapon"),
        },
        {
          key: "legendary",
          label: "전설",
          entries: (this.vocabData.legendaryRewards || []).map((reward) => ({
            ...reward,
            maxLevel: this.getBossRushTestLegendaryBudget(),
          })),
        },
      ];
    }

    createBossRushTestDraft(usePreset) {
      const upgrades = {};
      const legendary = {};

      (this.vocabData.upgrades || []).forEach((upgrade) => {
        upgrades[upgrade.key] = 0;
      });

      (this.vocabData.legendaryRewards || []).forEach((reward) => {
        legendary[reward.key] = 0;
      });

      if (usePreset) {
        Object.assign(upgrades, {
          power: 2,
          speed: 2,
          health: 2,
          focus: 2,
          range: 1,
          fortune: 1,
          wave: 1,
          fire: 1,
          lightning: 1,
          spear: 1,
          chain: 1,
          shieldWeapon: 1,
          mist: 1,
          blast: 1,
          blade: 1,
          disc: 1,
          link: 1,
          split: 1,
          amplify: 1,
          duration: 1,
        });

        Object.assign(legendary, {
          giant: 1,
          tempest: 1,
          comet: 1,
          harvest: 1,
          supernova: 1,
        });
      }

      return {
        pageKey: "core",
        upgrades,
        legendary,
      };
    }

    getBossRushTestSpentUpgrades() {
      if (!this.bossRushTestDraft) {
        return 0;
      }

      return Object.values(this.bossRushTestDraft.upgrades || {}).reduce((sum, value) => sum + (value || 0), 0);
    }

    getBossRushTestSpentLegendary() {
      if (!this.bossRushTestDraft) {
        return 0;
      }

      return Object.values(this.bossRushTestDraft.legendary || {}).reduce((sum, value) => sum + (value || 0), 0);
    }

    openBossRushTestPrep() {
      if (this.roundEnded) {
        return;
      }

      this.clearCombatField();

      if (this.player && this.player.body) {
        this.player.body.setVelocity(0, 0);
      }

      this.isLevelUp = true;
      this.pauseAction(true);
      this.bossRushTestDraft = this.createBossRushTestDraft(true);
      this.renderBossRushTestPrep();
    }

    destroyBossRushTestOverlay() {
      if (!this.bossRushTestOverlay) {
        return;
      }

      this.bossRushTestOverlay.forEach((item) => {
        if (item && item.destroy) {
          item.destroy();
        }
      });
      this.bossRushTestOverlay = null;
    }

    adjustBossRushTestEntry(kind, key, delta, maxLevel) {
      if (!this.bossRushTestDraft || !delta) {
        return;
      }

      const source = kind === "legendary" ? this.bossRushTestDraft.legendary : this.bossRushTestDraft.upgrades;
      const budget = kind === "legendary" ? this.getBossRushTestLegendaryBudget() : this.getBossRushTestUpgradeBudget();
      const spent = kind === "legendary" ? this.getBossRushTestSpentLegendary() : this.getBossRushTestSpentUpgrades();
      const current = source[key] || 0;
      const next = Phaser.Math.Clamp(current + delta, 0, maxLevel == null ? budget : maxLevel);

      if (next === current) {
        return;
      }

      if (delta > 0 && spent >= budget) {
        this.showFeedback(kind === "legendary" ? "전설 포인트 부족" : "강화 포인트 부족", "#ffd2b3");
        return;
      }

      source[key] = next;
      this.renderBossRushTestPrep();
    }

    getBossRushTestRangeBonus(level, baseBonus, stackStep) {
      if (level <= 0) {
        return 0;
      }

      return (level * baseBonus) + (stackStep * level * (level + 1) / 2);
    }

    resetBossRushTestProgress() {
      if (this.enemyTimer) {
        this.enemyTimer.remove(false);
        this.enemyTimer = null;
      }

      if (this.bossTimer) {
        this.bossTimer.remove(false);
        this.bossTimer = null;
      }

      if (this.strongWaveTimer) {
        this.strongWaveTimer.remove(false);
        this.strongWaveTimer = null;
      }

      if (this.finalBossAttackTimer) {
        this.finalBossAttackTimer.remove(false);
        this.finalBossAttackTimer = null;
      }

      this.score = 0;
      this.level = 25;
      this.experience = 0;
      this.nextLevelExperience = 999999;
      this.hp = 100;
      this.maxHp = 100;
      this.negativeClears = 0;
      this.bossDefeats = 0;
      this.pickupCount = 0;
      this.damageDealt = 0;
      this.damageTaken = 0;
      this.pickupStats = {};
      this.runStartedAt = new Date().toISOString();
      this.elapsedSeconds = 0;
      this.awakeningCharge = 0;
      this.awakeningCount = 0;
      this.awakeningUntil = 0;
      this.wasAwakeningActive = false;
      this.wasTransformActive = false;
      this.finalBossPhase = false;
      this.finalBossSpawned = false;
      this.finalBossDefeated = false;
      this.finalBossIntroUntil = 0;
      this.finalBoss = null;
      this.finalBossPatternIndex = 0;
      this.finalBossRushPhase = false;
      this.finalBossRushBossesRemaining = 0;
      this.roundEnded = false;
      this.playerInvulnerableUntil = 0;
      this.feedbackUntil = 0;
      this.transformUntil = 0;
      this.isMagnetCollecting = false;
      this.stageWaveTriggered = {};
      this.stageBossSequenceStarted = true;
      this.stageBossSpawned = false;
      this.pendingStageBoss = false;
      this.currentStageBoss = null;
      this.pendingStageIndex = null;
      this.stagesCleared = this.stageCount;
      this.timeRemaining = 0;
      this.shieldUntil = 0;
      this.speedBoostUntil = 0;
      this.attackDamage = 1;
      this.basePlayerSpeed = 248;
      this.attackCooldown = 340;
      this.attackRange = 320;
      this.pickupLuck = 0;
      this.healBonus = 0;
      this.waveLevel = 0;
      this.fireLevel = 0;
      this.lightningLevel = 0;
      this.spearLevel = 0;
      this.chainLevel = 0;
      this.shieldWeaponLevel = 0;
      this.mistLevel = 0;
      this.linkLevel = 0;
      this.splitLevel = 0;
      this.amplifyLevel = 0;
      this.durationLevel = 0;
      this.siphonLevel = 0;
      this.trackingLevel = 0;
      this.blastLevel = 0;
      this.bladeLevel = 0;
      this.discLevel = 0;
      this.legendaryLevels = {
        giant: 0,
        tempest: 0,
        comet: 0,
        harvest: 0,
        supernova: 0,
      };
      this.destroyBeamSweep();
      this.destroyBossAidAllies();
      this.bossAidThresholdsTriggered = {};
      this.bossAidCandidates = this.rollBossAidCandidates();

      Object.keys(this.upgradeLevels || {}).forEach((key) => {
        this.upgradeLevels[key] = 0;
      });
    }

    applyBossRushTestLoadout() {
      const draft = this.bossRushTestDraft;

      if (!draft) {
        return;
      }

      this.resetBossRushTestProgress();
      this.clearCombatField();

      if (this.player) {
        this.player.setPosition(this.mapLoopWidth / 2, this.mapLoopHeight / 2);
      }

      Object.entries(draft.upgrades || {}).forEach(([key, value]) => {
        this.upgradeLevels[key] = value || 0;
      });

      const upgradeLevels = draft.upgrades || {};
      const legendaryLevels = draft.legendary || {};

      this.attackDamage = 1 + (upgradeLevels.power || 0);
      this.basePlayerSpeed = 248 + (upgradeLevels.speed || 0) * 18;
      this.maxHp = 100 + (upgradeLevels.health || 0) * 18;
      this.hp = this.maxHp;
      this.healBonus = (upgradeLevels.health || 0) * 4;
      this.attackCooldown = Math.max(180, 340 - (upgradeLevels.focus || 0) * 32);
      this.attackRange = 320 + (upgradeLevels.range || 0) * 36;
      this.pickupLuck = (upgradeLevels.fortune || 0) * 0.08;
      this.waveLevel = upgradeLevels.wave || 0;
      this.fireLevel = upgradeLevels.fire || 0;
      this.lightningLevel = upgradeLevels.lightning || 0;
      this.spearLevel = upgradeLevels.spear || 0;
      this.chainLevel = upgradeLevels.chain || 0;
      this.shieldWeaponLevel = upgradeLevels.shieldWeapon || 0;
      this.mistLevel = upgradeLevels.mist || 0;
      this.linkLevel = upgradeLevels.link || 0;
      this.splitLevel = upgradeLevels.split || 0;
      this.amplifyLevel = upgradeLevels.amplify || 0;
      this.durationLevel = upgradeLevels.duration || 0;
      this.siphonLevel = upgradeLevels.siphon || 0;
      this.trackingLevel = upgradeLevels.tracking || 0;
      this.blastLevel = upgradeLevels.blast || 0;
      this.bladeLevel = upgradeLevels.blade || 0;
      this.discLevel = upgradeLevels.disc || 0;

      this.legendaryLevels = {
        giant: legendaryLevels.giant || 0,
        tempest: legendaryLevels.tempest || 0,
        comet: legendaryLevels.comet || 0,
        harvest: legendaryLevels.harvest || 0,
        supernova: legendaryLevels.supernova || 0,
      };

      this.fireLevel += this.legendaryLevels.giant;
      this.shieldWeaponLevel += this.legendaryLevels.giant;
      this.waveLevel += this.legendaryLevels.tempest;
      this.lightningLevel += this.legendaryLevels.tempest;
      this.spearLevel += this.legendaryLevels.comet;
      this.chainLevel += this.legendaryLevels.comet;
      this.bladeLevel += this.legendaryLevels.harvest;
      this.discLevel += this.legendaryLevels.harvest;
      this.mistLevel += this.legendaryLevels.supernova;
      this.blastLevel += this.legendaryLevels.supernova;
      this.attackRange += this.getBossRushTestRangeBonus(this.legendaryLevels.tempest, 12, 6);
      this.attackRange += this.getBossRushTestRangeBonus(this.legendaryLevels.comet, 28, 10);
      this.attackRange += this.getBossRushTestRangeBonus(this.legendaryLevels.harvest, 16, 8);
      this.attackRange += this.getBossRushTestRangeBonus(this.legendaryLevels.supernova, 14, 8);
      this.shieldUntil = this.legendaryLevels.giant > 0 ? this.time.now + 1200 + this.legendaryLevels.giant * 500 : 0;

      this.currentStageIndex = Math.max(0, this.stageCount - 1);
      this.currentStageData = this.getStageData(this.currentStageIndex);
      this.applyStageBackdropTheme();
      this.updateLoopMapBackdrop();
      this.cameras.main.centerOn(this.player.x, this.player.y);
      this.refreshAttackTimer();
      this.refreshLightningTimer();
      this.refreshWaveTimer();
      this.refreshSpearTimer();
      this.refreshChainTimer();
      this.refreshMistTimer();
      this.refreshBlastTimer();
      this.refreshBladeTimer();
      this.refreshDiscTimer();
      this.syncFireWeapon();
      this.syncShieldWeapon();
      this.refreshHud();
    }

    startBossRushTestBattle() {
      this.applyBossRushTestLoadout();
      this.destroyBossRushTestOverlay();
      this.isLevelUp = false;
      this.pauseAction(false);
      this.showFeedback("보스러시 테스트", "#ffd8ad");
      this.showFloatingText(this.player.x, this.player.y - 364, "테스트 시작", "#ffe3c7", "32px");
      this.startFinalBossRushPhase();
    }

    createBossRushTestActionButton(config) {
      const x = config.x;
      const y = config.y;
      const width = config.width;
      const height = config.height;
      const activeFill = config.activeFill || 0xffc985;
      const idleFill = config.idleFill || 0xffffff;
      const activeAlpha = config.activeAlpha == null ? 0.24 : config.activeAlpha;
      const strokeColor = config.strokeColor || 0xffe0b5;
      const depth = config.depth || 72;
      const textColor = config.textColor || "#fffaf1";
      const fontSize = config.fontSize || "26px";
      const bg = this.add.rectangle(x, y, width, height, activeFill, activeAlpha)
        .setDepth(depth)
        .setStrokeStyle(2, strokeColor, 0.38)
        .setInteractive({ useHandCursor: true });
      const label = this.add.text(x, y, config.label, {
        fontFamily: this.font,
        fontSize: fontSize,
        fontStyle: "800",
        color: textColor,
      }).setOrigin(0.5).setDepth(depth + 1);

      bg.on("pointerover", () => {
        bg.setFillStyle(activeFill, Math.min(0.34, activeAlpha + 0.08));
      });
      bg.on("pointerout", () => {
        bg.setFillStyle(activeFill, activeAlpha);
      });
      bg.on("pointerdown", () => {
        bg.setFillStyle(idleFill, 0.2);
        if (config.onClick) {
          config.onClick();
        }
      });

      return [bg, label];
    }

    renderBossRushTestPrep() {
      this.destroyBossRushTestOverlay();

      const ui = window.KoreanSurvivorGame.ui;
      const overlay = [];
      const pages = this.getBossRushTestPages();
      const draft = this.bossRushTestDraft || this.createBossRushTestDraft(true);
      const currentPage = pages.find((page) => page.key === draft.pageKey) || pages[0];
      const upgradeLeft = this.getBossRushTestUpgradeBudget() - this.getBossRushTestSpentUpgrades();
      const legendaryLeft = this.getBossRushTestLegendaryBudget() - this.getBossRushTestSpentLegendary();
      const themeLine = this.getStagePool().map((stage) => stage.label).join(" · ");

      overlay.push(this.add.rectangle(360, 640, 720, 1280, 0x02070d, 0.82).setDepth(70));
      overlay.push(ui.addPanel(this, 360, 646, 636, 1044, 1).setDepth(71));
      overlay.push(this.add.text(360, 150, "보스러시 테스트", {
        fontFamily: this.font,
        fontSize: "42px",
        fontStyle: "900",
        color: "#fff7ef",
      }).setOrigin(0.5).setDepth(72));
      overlay.push(this.add.text(360, 196, "Lv 25 세팅 후 보스러시 -> 최종 보스", {
        fontFamily: this.font,
        fontSize: "20px",
        fontStyle: "700",
        color: "#ffcf94",
      }).setOrigin(0.5).setDepth(72));
      overlay.push(this.add.text(360, 230, themeLine, {
        fontFamily: this.font,
        fontSize: "16px",
        color: "#9fc5b3",
        align: "center",
        wordWrap: { width: 540 },
      }).setOrigin(0.5).setDepth(72));

      overlay.push(this.add.text(202, 276, `강화 ${upgradeLeft}/${this.getBossRushTestUpgradeBudget()}`, {
        fontFamily: this.font,
        fontSize: "22px",
        fontStyle: "800",
        color: upgradeLeft > 0 ? "#b9ffd0" : "#ffe0b5",
      }).setOrigin(0.5).setDepth(72));
      overlay.push(this.add.text(520, 276, `전설 ${legendaryLeft}/${this.getBossRushTestLegendaryBudget()}`, {
        fontFamily: this.font,
        fontSize: "22px",
        fontStyle: "800",
        color: legendaryLeft > 0 ? "#ffd7a8" : "#ffe0b5",
      }).setOrigin(0.5).setDepth(72));

      overlay.push(...this.createBossRushTestActionButton({
        x: 196,
        y: 322,
        width: 180,
        height: 58,
        label: "균형 추천",
        fontSize: "22px",
        onClick: () => {
          this.bossRushTestDraft = this.createBossRushTestDraft(true);
          this.renderBossRushTestPrep();
        },
      }));

      overlay.push(...this.createBossRushTestActionButton({
        x: 524,
        y: 322,
        width: 180,
        height: 58,
        label: "초기화",
        fontSize: "22px",
        onClick: () => {
          this.bossRushTestDraft = this.createBossRushTestDraft(false);
          this.renderBossRushTestPrep();
        },
      }));

      pages.forEach((page, index) => {
        const active = page.key === currentPage.key;
        const x = 164 + index * 196;
        const bg = this.add.rectangle(x, 394, 176, 48, active ? 0xffc985 : 0xffffff, active ? 0.24 : 0.08)
          .setStrokeStyle(1, active ? 0xffd8ad : 0xffffff, active ? 0.5 : 0.18)
          .setDepth(72)
          .setInteractive({ useHandCursor: true });
        const text = this.add.text(x, 394, page.label, {
          fontFamily: this.font,
          fontSize: "20px",
          fontStyle: "800",
          color: active ? "#fffaf1" : "#bfd0dc",
        }).setOrigin(0.5).setDepth(73);

        bg.on("pointerdown", () => {
          this.bossRushTestDraft.pageKey = page.key;
          this.renderBossRushTestPrep();
        });

        overlay.push(bg, text);
      });

      currentPage.entries.forEach((entry, index) => {
        const y = 456 + index * 52;
        const kind = currentPage.key === "legendary" ? "legendary" : "upgrade";
        const currentLevel = kind === "legendary"
          ? (draft.legendary[entry.key] || 0)
          : (draft.upgrades[entry.key] || 0);
        const maxLevel = entry.maxLevel || (kind === "legendary" ? this.getBossRushTestLegendaryBudget() : 1);
        const canAdd = kind === "legendary"
          ? this.getBossRushTestSpentLegendary() < this.getBossRushTestLegendaryBudget() && currentLevel < maxLevel
          : this.getBossRushTestSpentUpgrades() < this.getBossRushTestUpgradeBudget() && currentLevel < maxLevel;

        overlay.push(this.add.rectangle(360, y, 560, 46, 0xffffff, 0.055).setDepth(71));
        overlay.push(this.add.text(102, y - 8, entry.label, {
          fontFamily: this.font,
          fontSize: "22px",
          fontStyle: "800",
          color: currentPage.key === "legendary" ? this.colorToHex(entry.accentColor || 0xffd8a8) : "#f5fbff",
        }).setOrigin(0, 0.5).setDepth(72));
        overlay.push(this.add.text(102, y + 10, entry.viLabel || "", {
          fontFamily: this.font,
          fontSize: "13px",
          color: "#8fb3a4",
        }).setOrigin(0, 0.5).setDepth(72));
        overlay.push(this.add.text(470, y, `Lv ${currentLevel}/${maxLevel}`, {
          fontFamily: this.font,
          fontSize: "18px",
          fontStyle: "800",
          color: "#fff4de",
        }).setOrigin(1, 0.5).setDepth(72));

        const minusBg = this.add.rectangle(548, y, 38, 34, 0xffffff, currentLevel > 0 ? 0.14 : 0.05)
          .setStrokeStyle(1, 0xffffff, currentLevel > 0 ? 0.24 : 0.1)
          .setDepth(72)
          .setInteractive({ useHandCursor: true });
        const minusText = this.add.text(548, y - 1, "-", {
          fontFamily: this.font,
          fontSize: "28px",
          fontStyle: "900",
          color: currentLevel > 0 ? "#fff7ef" : "#6f808d",
        }).setOrigin(0.5).setDepth(73);
        const plusBg = this.add.rectangle(602, y, 38, 34, 0xffc985, canAdd ? 0.24 : 0.08)
          .setStrokeStyle(1, 0xffdeb6, canAdd ? 0.4 : 0.12)
          .setDepth(72)
          .setInteractive({ useHandCursor: true });
        const plusText = this.add.text(602, y - 1, "+", {
          fontFamily: this.font,
          fontSize: "24px",
          fontStyle: "900",
          color: canAdd ? "#fffaf1" : "#92795d",
        }).setOrigin(0.5).setDepth(73);

        minusBg.on("pointerdown", () => this.adjustBossRushTestEntry(kind, entry.key, -1, maxLevel));
        plusBg.on("pointerdown", () => this.adjustBossRushTestEntry(kind, entry.key, 1, maxLevel));
        overlay.push(minusBg, minusText, plusBg, plusText);
      });

      overlay.push(this.add.text(360, 1080, "남은 포인트가 있어도 시작할 수 있습니다.", {
        fontFamily: this.font,
        fontSize: "18px",
        color: "#9eb3c0",
      }).setOrigin(0.5).setDepth(72));

      overlay.push(...this.createBossRushTestActionButton({
        x: 360,
        y: 1144,
        width: 440,
        height: 78,
        label: "테스트 시작",
        fontSize: "30px",
        onClick: () => this.startBossRushTestBattle(),
      }));

      overlay.push(...this.createBossRushTestActionButton({
        x: 360,
        y: 1226,
        width: 300,
        height: 64,
        label: "메뉴로",
        fontSize: "24px",
        activeFill: 0xffffff,
        activeAlpha: 0.12,
        idleFill: 0xffffff,
        strokeColor: 0xffffff,
        onClick: () => this.scene.start("MenuScene"),
      }));

      this.pinUiItems(overlay);
      this.bossRushTestOverlay = overlay;
      this.refreshHud();
    }

    buildStageRun() {
      const stages = (this.vocabData.stages || []).slice();

      if (!stages.length) {
        return [];
      }

      Phaser.Utils.Array.Shuffle(stages);

      const runCount = Math.max(1, Math.min(this.vocabData.runStageCount || 5, stages.length));

      return stages
        .slice(0, runCount)
        .sort((left, right) => (left.difficultyTier || 1) - (right.difficultyTier || 1));
    }

    getStagePool() {
      return this.runStages && this.runStages.length ? this.runStages : (this.vocabData.stages || []);
    }

    getStageData(index) {
      const stages = this.getStagePool();

      if (!stages.length) {
        return null;
      }

      return stages[Phaser.Math.Clamp(index, 0, stages.length - 1)];
    }

    getCurrentStageData() {
      return this.currentStageData || this.getStageData(this.currentStageIndex);
    }

    getCurrentStageTitle() {
      const stage = this.getCurrentStageData();
      return stage ? `${this.currentStageIndex + 1}단계 ${stage.label}` : `${this.currentStageIndex + 1}단계`;
    }

    getReachedStageNumber() {
      return Math.min(this.stageCount, this.currentStageIndex + 1);
    }

    applyStageData(stageIndex, options) {
      const settings = options || {};
      const stage = this.getStageData(stageIndex);

      if (!stage) {
        return;
      }

      this.currentStageIndex = Phaser.Math.Clamp(stageIndex, 0, this.stageCount - 1);
      this.currentStageData = stage;
      this.timeRemaining = this.roundSeconds;
      this.stageWaveTriggered = {};
      this.stageBossSequenceStarted = false;
      this.stageBossSpawned = false;
      this.pendingStageBoss = false;
      this.currentStageBoss = null;
      this.applyStageBackdropTheme();
      this.refreshStageTimers();

      if (!settings.silent) {
        this.showFeedback(stage.introMessage || this.getCurrentStageTitle(), this.colorToHex(stage.accentColor));
        this.showFloatingText(this.player.x, this.player.y - 390, this.getCurrentStageTitle(), this.colorToHex(stage.accentColor), "34px");
      }

      const openingSpawns = settings.skipSpawns ? 0 : (stage.openingSpawns || 0);

      for (let index = 0; index < openingSpawns; index += 1) {
        this.spawnNegativeEnemy();
      }

      this.refreshHud();
    }

    refreshStageTimers() {
      if (this.enemyTimer) {
        this.enemyTimer.remove(false);
        this.enemyTimer = null;
      }

      if (this.bossTimer) {
        this.bossTimer.remove(false);
        this.bossTimer = null;
      }

      if (this.strongWaveTimer) {
        this.strongWaveTimer.remove(false);
        this.strongWaveTimer = null;
      }

      if (this.roundEnded || this.finalBossPhase) {
        return;
      }

      const stage = this.getCurrentStageData();

      if (!stage) {
        return;
      }

      this.scheduleNextEnemySpawn();
    }

    getDynamicSpawnDelay() {
      const stage = this.getCurrentStageData();
      const baseDelay = stage && stage.spawnDelay ? stage.spawnDelay : 760;
      const stagePressure = this.currentStageIndex * 42;
      const timePressure = Math.floor(this.getStageElapsedSeconds() / 10) * 24;
      const wavePressure = Object.keys(this.stageWaveTriggered || {}).length * 22;
      return Math.max(260, baseDelay - stagePressure - timePressure - wavePressure);
    }

    getDynamicExtraSpawnChance(stage) {
      const baseChance = stage && stage.extraSpawnChance ? stage.extraSpawnChance : 36;
      const stagePressure = this.currentStageIndex * 7;
      const timePressure = Math.floor(this.getStageElapsedSeconds() / 12) * 5;
      return Math.min(88, baseChance + stagePressure + timePressure);
    }

    scheduleNextEnemySpawn() {
      if (this.enemyTimer) {
        this.enemyTimer.remove(false);
        this.enemyTimer = null;
      }

      if (this.roundEnded || this.finalBossPhase || this.stageBossSequenceStarted) {
        return;
      }

      this.enemyTimer = this.time.addEvent({
        delay: this.getDynamicSpawnDelay(),
        callback: () => {
          this.spawnNegativeEnemy();

          if (!this.roundEnded && !this.finalBossPhase && !this.stageBossSequenceStarted) {
            this.scheduleNextEnemySpawn();
          }
        },
        callbackScope: this,
      });
    }

    getStrongWaveMoments() {
      const stage = this.getCurrentStageData();
      return stage && stage.strongWaveMoments ? stage.strongWaveMoments : [30, 60];
    }

    getStageElapsedSeconds() {
      return Phaser.Math.Clamp(this.roundSeconds - this.timeRemaining, 0, this.roundSeconds);
    }

    getNextStrongWaveMoment() {
      const elapsed = this.getStageElapsedSeconds();
      const moments = this.getStrongWaveMoments();

      for (let index = 0; index < moments.length; index += 1) {
        const waveNumber = index + 1;

        if (!this.stageWaveTriggered[waveNumber] && elapsed < moments[index]) {
          return moments[index];
        }
      }

      return null;
    }

    triggerStrongWave(waveNumber) {
      if (this.roundEnded || this.isLevelUp || this.finalBossPhase || this.finalBossRushPhase || this.stageBossSequenceStarted) {
        return;
      }

      if (this.stageWaveTriggered[waveNumber]) {
        return;
      }

      const stage = this.getCurrentStageData();

      if (!stage) {
        return;
      }

      this.stageWaveTriggered[waveNumber] = true;
      this.showFeedback(`${this.getCurrentStageTitle()} 강습 ${waveNumber}`, "#ffd9b5");
      this.showFloatingText(this.player.x, this.player.y - 364, `강습 ${waveNumber}`, "#ffe5c2", "34px");

      if (this.strongWaveTimer) {
        this.strongWaveTimer.remove(false);
        this.strongWaveTimer = null;
      }

      const totalPacks = (stage.strongWavePacks && stage.strongWavePacks[waveNumber - 1]) || (4 + waveNumber + this.currentStageIndex);
      let spawnedPacks = 0;
      const spawnBurst = () => {
        if (this.roundEnded || this.isLevelUp || this.finalBossPhase || this.finalBossRushPhase || this.stageBossSequenceStarted) {
          return;
        }

        this.spawnStrongWavePack(waveNumber);
        spawnedPacks += 1;
      };

      spawnBurst();

      if (totalPacks <= 1) {
        return;
      }

      this.strongWaveTimer = this.time.addEvent({
        delay: stage.strongWaveBurstInterval || 420,
        callback: () => {
          spawnBurst();

          if (spawnedPacks >= totalPacks && this.strongWaveTimer) {
            this.strongWaveTimer.remove(false);
            this.strongWaveTimer = null;
          }
        },
        callbackScope: this,
        repeat: totalPacks - 2,
      });
    }

    spawnStrongWavePack(waveNumber) {
      const stage = this.getCurrentStageData();

      if (!stage) {
        return;
      }

      const origin = this.rollNegativeSpawnPoint();
      const eliteArchetype = stage.strongWaveEliteArchetype || "tank";
      const eliteRole = stage.strongWaveEliteRole || "aura";
      const supportCount = 2 + waveNumber + this.currentStageIndex;
      const eliteSpawn = this.offsetNegativeSpawnPoint(origin, 0, supportCount + 1);

      this.createNegativeEnemy(eliteArchetype, eliteSpawn.x, eliteSpawn.y, {
        forceRoleKey: eliteRole,
        hpMultiplier: 1.8 + waveNumber * 0.16 + this.currentStageIndex * 0.12,
        speedMultiplier: 1.04 + waveNumber * 0.04,
        damageMultiplier: 1.16 + this.currentStageIndex * 0.08,
        scoreMultiplier: 1.9,
      });

      for (let index = 0; index < supportCount; index += 1) {
        const supportSpawn = this.offsetNegativeSpawnPoint(origin, index + 1, supportCount + 1);
        const roll = Phaser.Math.Between(0, 100);
        let archetypeKey = "swarm";

        if (waveNumber >= 2 && roll > 58) {
          archetypeKey = "tank";
        } else if (roll > 38) {
          archetypeKey = "normal";
        }

        this.createNegativeEnemy(archetypeKey, supportSpawn.x, supportSpawn.y, {
          hpMultiplier: 1.08 + waveNumber * 0.08,
          speedMultiplier: 1.04 + waveNumber * 0.04,
          damageMultiplier: 1.08 + this.currentStageIndex * 0.06,
          scoreMultiplier: 1.24,
        });
      }
    }

    beginStageBossSequence() {
      if (this.stageBossSequenceStarted || this.roundEnded || this.finalBossPhase) {
        return;
      }

      this.stageBossSequenceStarted = true;
      this.pendingStageBoss = true;

      if (this.enemyTimer) {
        this.enemyTimer.paused = true;
      }

      if (this.strongWaveTimer) {
        this.strongWaveTimer.remove(false);
        this.strongWaveTimer = null;
      }

      this.showFeedback("강습 종료! 남은 적을 정리하세요", "#ffd9b0");
      this.showFloatingText(this.player.x, this.player.y - 364, "보스 준비", "#ffe5c5", "30px");
      this.refreshHud();
    }

    spawnStageBossIfReady() {
      if (
        !this.stageBossSequenceStarted ||
        !this.pendingStageBoss ||
        this.roundEnded ||
        this.isLevelUp ||
        this.finalBossPhase ||
        this.hasActiveBoss() ||
        !this.areRegularEnemiesCleared()
      ) {
        return;
      }

      this.spawnMiniBoss();
    }

    getStageBossHpScale() {
      const maxStageIndex = Math.max(1, this.stageCount - 1);
      const progress = Phaser.Math.Clamp(this.currentStageIndex / maxStageIndex, 0, 1);
      const curvedProgress = (progress * progress * 0.85) + (progress * 0.15);
      return Phaser.Math.Linear(2, 24, curvedProgress);
    }

    getFinalBossHpScale() {
      return 30;
    }

    areRegularEnemiesCleared() {
      let foundEnemy = false;

      this.enemies.children.iterate((enemy) => {
        if (enemy && enemy.active && enemy.enemyKind === "negative") {
          foundEnemy = true;
        }
      });

      return !foundEnemy;
    }

    clearCombatField() {
      this.enemies.children.iterate((enemy) => {
        if (enemy && enemy.active) {
          this.destroyEnemy(enemy);
        }
      });

      this.pickups.children.iterate((pickup) => {
        if (pickup && pickup.active) {
          this.destroyPickup(pickup);
        }
      });

      this.bullets.clear(true, true);
      this.enemyProjectiles.clear(true, true);
      this.magnetLinks.clear();
      this.magnetField.setVisible(false);
      this.isMagnetCollecting = false;

      this.mistZones.forEach((zone) => {
        if (zone && zone.sprite && zone.sprite.active) {
          zone.sprite.destroy();
        }
      });
      this.mistZones = [];
      this.destroyBeamSweep();
    }

    openStageTransition(nextStageIndex, bossWord) {
      const hasNextStage = typeof nextStageIndex === "number" && nextStageIndex < this.stageCount;
      const nextStage = hasNextStage ? this.getStageData(nextStageIndex) : null;
      const rewards = (this.vocabData.legendaryRewards || []).slice(0, 5);

      if (!rewards.length) {
        return;
      }

      const ui = window.KoreanSurvivorGame.ui;
      const overlayItems = [];

      this.pendingStageIndex = hasNextStage ? nextStageIndex : null;
      this.isLevelUp = true;
      this.pauseAction(true);

      if (this.enemyTimer) {
        this.enemyTimer.paused = true;
      }

      if (this.bossTimer) {
        this.bossTimer.paused = true;
      }

      this.clearCombatField();
      this.hp = Math.min(this.maxHp, this.hp + this.stageRecoveryAmount);
      this.shieldUntil = Math.max(this.shieldUntil, this.time.now + 1400);

      const dim = this.add.rectangle(360, 640, 720, 1280, 0x02070d, 0.72).setDepth(40);
      overlayItems.push(dim);
      overlayItems.push(ui.addPanel(this, 360, 666, 632, 980, 1).setDepth(41));

      overlayItems.push(this.add.text(360, 214, `${bossWord || "보스"} 격파`, {
        fontFamily: this.font,
        fontSize: "40px",
        fontStyle: "900",
        color: "#fff7ef",
      }).setOrigin(0.5).setDepth(42));

      overlayItems.push(this.add.text(360, 260, "전설 보상 1개 선택", {
        fontFamily: this.font,
        fontSize: "28px",
        fontStyle: "800",
        color: "#ffd7a0",
      }).setOrigin(0.5).setDepth(42));

      overlayItems.push(this.add.text(360, 304, hasNextStage ? `다음 스테이지: ${nextStageIndex + 1}단계 ${nextStage.label}` : "최종 결전 준비", {
        fontFamily: this.font,
        fontSize: "24px",
        fontStyle: "700",
        color: this.colorToHex(hasNextStage ? nextStage.accentColor : 0xffa88a),
      }).setOrigin(0.5).setDepth(42));

      overlayItems.push(this.add.text(360, 338, hasNextStage ? (nextStage.introViMessage || "") : "Thuong truyen thuyet nay se dan ban toi tran chien cuoi.", {
        fontFamily: this.font,
        fontSize: "16px",
        color: "#8db0a8",
        align: "center",
        wordWrap: { width: 520 },
      }).setOrigin(0.5).setDepth(42));

      overlayItems.push(this.add.text(360, 376, hasNextStage ? `${this.stageRecoveryAmount} 회복 후 다음 스테이지로 진입합니다.` : `${this.stageRecoveryAmount} 회복 후 최종 보스전에 들어갑니다.`, {
        fontFamily: this.font,
        fontSize: "20px",
        fontStyle: "800",
        color: "#bff2c2",
      }).setOrigin(0.5).setDepth(42));

      const positions = [
        { x: 238, y: 594 },
        { x: 482, y: 594 },
        { x: 140, y: 904 },
        { x: 360, y: 904 },
        { x: 580, y: 904 },
      ];

      rewards.forEach((reward, index) => {
        const position = positions[index];
        const currentLevel = this.getLegendaryLevel(reward.key);
        const card = this.add.image(position.x, position.y, "upgrade-card").setDisplaySize(188, 320).setDepth(41);
        card.setInteractive({ useHandCursor: true });

        const title = this.add.text(position.x, position.y - 114, reward.label, {
          fontFamily: this.font,
          fontSize: "30px",
          fontStyle: "900",
          color: this.colorToHex(reward.accentColor),
        }).setOrigin(0.5).setDepth(42);

        const viTitle = this.add.text(position.x, position.y - 72, reward.viLabel || "", {
          fontFamily: this.font,
          fontSize: "15px",
          fontStyle: "700",
          color: "#9ac7b2",
        }).setOrigin(0.5).setDepth(42);

        const desc = this.add.text(position.x, position.y + 8, reward.description || "", {
          fontFamily: this.font,
          fontSize: "18px",
          fontStyle: "700",
          color: "#edf5fb",
          align: "center",
          wordWrap: { width: 146, useAdvancedWrap: true },
        }).setOrigin(0.5).setDepth(42);
        desc.setLineSpacing(4);

        const viDesc = this.add.text(position.x, position.y + 96, reward.viDescription || "", {
          fontFamily: this.font,
          fontSize: "13px",
          color: "#a3c7b6",
          align: "center",
          wordWrap: { width: 146, useAdvancedWrap: true },
        }).setOrigin(0.5).setDepth(42);
        viDesc.setLineSpacing(4);

        const stackText = this.add.text(position.x, position.y + 138, `현재 Lv ${currentLevel}`, {
          fontFamily: this.font,
          fontSize: "14px",
          fontStyle: "800",
          color: currentLevel > 0 ? "#ffe7b5" : "#8ba1b2",
        }).setOrigin(0.5).setDepth(42);

        card.on("pointerover", () => {
          card.setTint(0xffefdc);
        });

        card.on("pointerout", () => {
          card.clearTint();
        });

        card.on("pointerdown", () => this.applyLegendaryReward(reward, overlayItems, hasNextStage ? nextStageIndex : null));
        overlayItems.push(card, title, viTitle, desc, viDesc, stackText);
      });

      this.stageTransitionOverlay = overlayItems;
      this.pinUiItems(overlayItems);
      this.refreshHud();
    }

    applyLegendaryReward(reward, overlayItems, nextStageIndex) {
      if (!this.isLevelUp || !reward) {
        return;
      }

      const legendaryStack = this.getLegendaryLevel(reward.key) + 1;
      let needsLightningRefresh = false;
      let needsWaveRefresh = false;
      let needsSpearRefresh = false;
      let needsChainRefresh = false;
      let needsMistRefresh = false;
      let needsShieldRefresh = false;
      let needsBlastRefresh = false;
      let needsBladeRefresh = false;
      let needsDiscRefresh = false;
      let needsFireSync = false;

      this.legendaryLevels[reward.key] = legendaryStack;

      if (reward.key === "giant") {
        this.fireLevel = Math.max(1, this.fireLevel + 1);
        this.shieldWeaponLevel = Math.max(1, this.shieldWeaponLevel + 1);
        this.shieldUntil = Math.max(this.shieldUntil, this.time.now) + 1500 + legendaryStack * 700;
        needsFireSync = true;
        needsShieldRefresh = true;
      } else if (reward.key === "tempest") {
        this.waveLevel = Math.max(1, this.waveLevel + 1);
        this.lightningLevel = Math.max(1, this.lightningLevel + 1);
        this.attackRange += 12 + legendaryStack * 6;
        needsLightningRefresh = true;
        needsWaveRefresh = true;
      } else if (reward.key === "comet") {
        this.spearLevel = Math.max(1, this.spearLevel + 1);
        this.chainLevel = Math.max(1, this.chainLevel + 1);
        this.attackRange += 28 + legendaryStack * 10;
        needsSpearRefresh = true;
        needsChainRefresh = true;
      } else if (reward.key === "harvest") {
        this.bladeLevel = Math.max(1, this.bladeLevel + 1);
        this.discLevel = Math.max(1, this.discLevel + 1);
        this.attackRange += 16 + legendaryStack * 8;
        needsBladeRefresh = true;
        needsDiscRefresh = true;
      } else if (reward.key === "supernova") {
        this.mistLevel = Math.max(1, this.mistLevel + 1);
        this.blastLevel = Math.max(1, this.blastLevel + 1);
        this.attackRange += 14 + legendaryStack * 8;
        needsMistRefresh = true;
        needsBlastRefresh = true;
      }

      if (needsLightningRefresh) {
        this.refreshLightningTimer();
      }

      if (needsWaveRefresh) {
        this.refreshWaveTimer();
      }

      if (needsSpearRefresh) {
        this.refreshSpearTimer();
      }

      if (needsChainRefresh) {
        this.refreshChainTimer();
      }

      if (needsMistRefresh) {
        this.refreshMistTimer();
      }

      if (needsShieldRefresh) {
        this.syncShieldWeapon();
      }

      if (needsBlastRefresh) {
        this.refreshBlastTimer();
      }

      if (needsBladeRefresh) {
        this.refreshBladeTimer();
      }

      if (needsDiscRefresh) {
        this.refreshDiscTimer();
      }

      if (needsFireSync) {
        this.syncFireWeapon();
      }

      overlayItems.forEach((item) => item.destroy());
      this.stageTransitionOverlay = null;
      this.showFeedback(`${reward.label} Lv ${legendaryStack}`, this.colorToHex(reward.accentColor));
      this.showFloatingText(this.player.x, this.player.y - 360, `${reward.label} Lv ${legendaryStack}`, this.colorToHex(reward.accentColor), "36px");
      this.playLegendaryRewardPulse(reward.accentColor, legendaryStack);
      this.refreshHud();

      if (typeof nextStageIndex === "number" && nextStageIndex < this.stageCount) {
        this.startNextStage(nextStageIndex);
        return;
      }

      this.beginFinalBossAfterReward();
    }

    startNextStage(nextStageIndex) {
      if (this.stageTransitionOverlay) {
        this.stageTransitionOverlay.forEach((item) => item.destroy());
        this.stageTransitionOverlay = null;
      }

      this.pendingStageIndex = null;
      this.isLevelUp = false;
      this.pauseAction(false);
      this.applyStageData(nextStageIndex, { skipSpawns: false, silent: false });

      if (this.experience >= this.nextLevelExperience) {
        this.time.delayedCall(240, () => this.checkLevelUp());
      }
    }

    beginFinalBossAfterReward() {
      if (this.stageTransitionOverlay) {
        this.stageTransitionOverlay.forEach((item) => item.destroy());
        this.stageTransitionOverlay = null;
      }

      this.pendingStageIndex = null;
      this.stageBossSequenceStarted = true;
      this.stageBossSpawned = false;
      this.pendingStageBoss = false;
      this.isLevelUp = false;
      this.pauseAction(false);
      this.startFinalBossRushPhase();
    }

    startFinalBossRushPhase() {
      if (this.roundEnded || this.finalBossPhase || this.finalBossRushPhase) {
        return;
      }

      this.finalBossRushPhase = true;
      this.finalBossRushBossesRemaining = 0;
      this.currentStageBoss = null;
      this.clearCombatField();
      this.checkBossAidSummons();
      this.showFeedback("경고: 최종 방어선 붕괴", "#ffb7aa");
      this.playCenterWarning("경고", "초강력 웨이브 접근", "#ffb7aa", () => {
        this.launchFinalBossSuperWaves();
      });
    }

    canContinueFinalBossRush() {
      return !this.roundEnded && !this.finalBossPhase && this.finalBossRushPhase;
    }

    playCenterWarning(title, subtitle, color, onComplete) {
      const accent = color || "#ffb7aa";
      const dim = this.add.rectangle(360, 640, 720, 1280, 0x06090d, 0.28)
        .setDepth(58)
        .setScrollFactor(0);
      const warningText = this.add.text(360, 538, title, {
        fontFamily: this.font,
        fontSize: "64px",
        fontStyle: "900",
        color: accent,
        stroke: "#1c0505",
        strokeThickness: 10,
      }).setOrigin(0.5).setDepth(59).setScrollFactor(0);
      const subText = this.add.text(360, 616, subtitle || "", {
        fontFamily: this.font,
        fontSize: "26px",
        fontStyle: "800",
        color: "#fff2e8",
        align: "center",
        wordWrap: { width: 520 },
      }).setOrigin(0.5).setDepth(59).setScrollFactor(0);

      dim.alpha = 0;
      warningText.alpha = 0;
      subText.alpha = 0;
      this.cameras.main.flash(120, 255, 124, 124, false);

      this.tweens.add({
        targets: dim,
        alpha: { from: 0, to: 0.3 },
        duration: 140,
        yoyo: true,
        repeat: 5,
        ease: "Sine.inOut",
      });
      this.tweens.add({
        targets: [warningText, subText],
        alpha: { from: 0.12, to: 1 },
        duration: 140,
        yoyo: true,
        repeat: 5,
        ease: "Sine.inOut",
      });

      this.time.delayedCall(980, () => {
        dim.destroy();
        warningText.destroy();
        subText.destroy();
        if (onComplete) {
          onComplete();
        }
      });
    }

    launchFinalBossSuperWaves() {
      if (!this.canContinueFinalBossRush()) {
        return;
      }

      for (let waveNumber = 1; waveNumber <= 3; waveNumber += 1) {
        this.time.delayedCall(180 + (waveNumber - 1) * 1080, () => {
          if (this.canContinueFinalBossRush()) {
            this.triggerFinalBossSuperWave(waveNumber);
          }
        });
      }

      this.time.delayedCall(3880, () => {
        if (this.canContinueFinalBossRush()) {
          this.spawnFinalBossRush();
        }
      });
    }

    triggerFinalBossSuperWave(waveNumber) {
      if (!this.canContinueFinalBossRush()) {
        return;
      }

      this.showFeedback(`슈퍼 웨이브 ${waveNumber}`, "#ffd2bb");
      this.showFloatingText(this.player.x, this.player.y - 348, `위험 ${waveNumber}`, "#ffe3cf", "34px");
      this.wordBurst(this.player.x, this.player.y - 308, 0xffd3ba);
      this.cameras.main.flash(90, 255, 170, 138, false);

      const totalPacks = 2 + waveNumber;
      for (let index = 0; index < totalPacks; index += 1) {
        this.time.delayedCall(index * 180, () => {
          if (this.canContinueFinalBossRush()) {
            this.spawnFinalBossSuperWavePack(waveNumber, index);
          }
        });
      }
    }

    spawnFinalBossSuperWavePack(waveNumber, packIndex) {
      const origin = this.rollNegativeSpawnPoint();
      const eliteArchetypes = ["tank", "normal", "tank", "swarm"];
      const eliteRoles = ["aura", "rush", "shooter", "summoner"];
      const eliteArchetype = eliteArchetypes[(waveNumber + packIndex) % eliteArchetypes.length];
      const eliteRole = eliteRoles[(waveNumber + packIndex) % eliteRoles.length];
      const supportCount = 4 + waveNumber + Math.floor(packIndex / 2);
      const eliteSpawn = this.offsetNegativeSpawnPoint(origin, 0, supportCount + 1);

      this.createNegativeEnemy(eliteArchetype, eliteSpawn.x, eliteSpawn.y, {
        forceRoleKey: eliteRole,
        hpMultiplier: 3.5 + waveNumber * 0.7 + packIndex * 0.12,
        speedMultiplier: 1.12 + waveNumber * 0.05,
        damageMultiplier: 1.28 + waveNumber * 0.08,
        scoreMultiplier: 1.42 + waveNumber * 0.14,
      });

      const supportArchetypes = ["normal", "swarm", "tank", "normal"];
      for (let index = 0; index < supportCount; index += 1) {
        const spawn = this.offsetNegativeSpawnPoint(origin, index + 1, supportCount + 1);
        const archetypeKey = supportArchetypes[(waveNumber + packIndex + index) % supportArchetypes.length];
        const forceRoleKey = index % 5 === 0 ? "shooter" : (index % 3 === 0 ? "rush" : null);

        this.createNegativeEnemy(archetypeKey, spawn.x, spawn.y, {
          forceRoleKey: forceRoleKey || undefined,
          hpMultiplier: 1.9 + waveNumber * 0.24 + packIndex * 0.08,
          speedMultiplier: 1.08 + waveNumber * 0.04,
          damageMultiplier: 1.16 + waveNumber * 0.06,
          scoreMultiplier: 1.18 + waveNumber * 0.12,
        });
      }
    }

    getBossRushSpawnPoints() {
      const bounds = this.getCombatSafeBounds(110, 250, 180);
      const midY = (bounds.top + bounds.bottom) / 2;
      return [
        { x: bounds.left + 18, y: bounds.top },
        { x: bounds.right - 18, y: bounds.top },
        { x: bounds.left, y: midY },
        { x: bounds.right, y: midY },
        { x: this.player.x, y: bounds.bottom },
      ];
    }

    getBossRushHpScale(index) {
      const progress = Phaser.Math.Clamp(index / Math.max(1, this.stageCount - 1), 0, 1);
      return 15 + progress * 5;
    }

    buildBossRushPatternLoadout(enemy, rushIndex) {
      const baseLoadout = this.buildStageBossPatternLoadout(enemy);
      const limit = 3 + Math.min(2, Math.floor(rushIndex / 2));
      return baseLoadout.slice(0, limit);
    }

    setupBossRushGimmick(boss) {
      const type = Phaser.Utils.Array.GetRandom(["invincible", "frenzy", "mirage", "heal"]);
      boss.stageGimmicks = [{
        threshold: 0.5,
        type,
        triggered: false,
      }];
      boss.gimmickInvulnerableUntil = 0;
      boss.gimmickFrenzyUntil = 0;
      boss.lastInvulnerableNoticeAt = 0;
      boss.gimmickInvulnerableDuration = 1800;
      boss.gimmickFrenzyDuration = 1800;
      boss.gimmickHealRatio = 0.12;
      boss.gimmickMirageOptions = {
        cloneCount: 2,
        hpRatio: 0.04,
        duration: 4200,
        damageMultiplier: 0.42,
        tint: 0xd7dcff,
        alpha: 0.52,
        word: "잔영",
      };
    }

    spawnFinalBossRush() {
      if (!this.canContinueFinalBossRush()) {
        return;
      }

      const rushStages = this.runStages.slice(0, this.stageCount);
      const spawnPoints = this.getBossRushSpawnPoints();
      this.finalBossRushBossesRemaining = 0;
      this.showFeedback("오대 보스 러시", "#ffc4af");
      this.showFloatingText(this.player.x, this.player.y - 316, "보스 러시", "#ffe3d0", "38px");

      rushStages.forEach((stage, index) => {
        if (!stage || !stage.bossWords || !stage.bossWords.length) {
          return;
        }

        const definition = stage.bossWords[Phaser.Math.Between(0, stage.bossWords.length - 1)];
        const point = spawnPoints[index] || spawnPoints[spawnPoints.length - 1];
        const hpScale = this.getBossRushHpScale(index);
        const boss = this.enemies.create(point.x, point.y, definition.texture || "boss-pill");
        boss.setDisplaySize(definition.displayWidth || 224, definition.displayHeight || 88);
        boss.setTint(definition.color);
        boss.setDepth(2);
        boss.enemyId = (this.enemyIdCounter += 1);
        boss.enemyKind = "boss";
        boss.isBossRushMember = true;
        boss.word = definition.word;
        boss.motion = definition.motion || "";
        boss.hp = Math.max(1, Math.round(definition.hp * (stage.bossHpMultiplier || 1) * hpScale));
        boss.maxHp = boss.hp;
        boss.speed = Math.max(58, Math.round(definition.speed * Math.max(1.04, stage.bossSpeedMultiplier || 1)));
        boss.scoreValue = Math.round((definition.score || 180) * (1.5 + index * 0.1));
        boss.damage = Math.max(9, Math.round(definition.damage * Math.max(1.12, stage.bossDamageMultiplier || 1)));
        boss.nextShotAt = this.time.now + Phaser.Math.Between(900, 1500);
        boss.projectileKeys = definition.projectileKeys || [];
        boss.bossPatternKeys = this.buildBossRushPatternLoadout(boss, index);
        boss.bossPatternIndex = 0;
        boss.dashUntil = 0;
        boss.baseScale = 1;
        boss.body.setSize(
          Math.max(48, Math.floor((definition.displayWidth || 224) * 0.52)),
          Math.max(44, Math.floor((definition.displayHeight || 88) * 0.74))
        );
        boss.label = this.add.text(point.x, point.y + 1, definition.word, {
          fontFamily: this.font,
          fontSize: "28px",
          fontStyle: "800",
          color: "#fff6f2",
          align: "center",
        }).setOrigin(0.5).setDepth(4);
        this.attachEnemyHealthBar(boss, definition.hpBarWidth || 150, definition.hpBarOffsetY || 58);
        this.setupBossRushGimmick(boss);
        this.finalBossRushBossesRemaining += 1;

        const burst = this.add.circle(point.x, point.y, 18, definition.color, 0.22).setDepth(3);
        this.tweens.add({
          targets: burst,
          radius: 108,
          alpha: 0,
          duration: 420,
          ease: "Cubic.out",
          onComplete: () => burst.destroy(),
        });
      });

      if (this.finalBossRushBossesRemaining <= 0) {
        this.beginFinalBossArrivalSequence();
      }
    }

    beginFinalBossArrivalSequence() {
      if (this.roundEnded || this.finalBossPhase) {
        return;
      }

      this.clearCombatField();
      this.showFeedback("강력한 적 출현", "#ffb29d");
      this.playCenterWarning("경고", "최종 보스 접근", "#ffb29d", () => {
        if (!this.roundEnded && !this.finalBossPhase) {
          this.finalBossRushPhase = false;
          this.startFinalBossPhase();
        }
      });
    }

    completeCurrentStage() {
      this.beginStageBossSequence();
    }

    pickNegativeArchetype() {
      const entries = Object.entries(this.vocabData.negativeArchetypes || {});
      let total = 0;

      entries.forEach(([key]) => {
        total += this.getArchetypeSpawnWeight(key);
      });

      let roll = Phaser.Math.FloatBetween(0, total);

      for (let index = 0; index < entries.length; index += 1) {
        const [key] = entries[index];
        roll -= this.getArchetypeSpawnWeight(key);

        if (roll <= 0) {
          return key;
        }
      }

      return "normal";
    }

    getArchetypeSpawnWeight(archetypeKey) {
      const archetype = (this.vocabData.negativeArchetypes || {})[archetypeKey] || {};
      const stage = this.getCurrentStageData();
      const stageWeights = stage && stage.archetypeWeights ? stage.archetypeWeights : {};
      return stageWeights[archetypeKey] != null ? stageWeights[archetypeKey] : (archetype.spawnWeight || 0);
    }

    pickNegativeDefinition(archetypeKey) {
      const stage = this.getCurrentStageData();
      const stageWords = stage && stage.negativeWords ? stage.negativeWords : [];
      const defs = stageWords.filter((entry) => entry.archetype === archetypeKey);

      if (!defs.length) {
        return stageWords[0];
      }

      return defs[Phaser.Math.Between(0, defs.length - 1)];
    }

    pickNegativeRole(archetypeKey, options) {
      const settings = options || {};

      if (settings.forceRoleKey) {
        return settings.forceRoleKey;
      }

      const stage = this.getCurrentStageData();
      const stageRoleWeights = stage && stage.roleWeights ? stage.roleWeights : {};
      const roleEntries = Object.entries(this.vocabData.negativeRoles || {}).filter(([key, role]) => {
        const eligibleArchetypes = role.eligibleArchetypes || [];
        const weight = stageRoleWeights[key] != null ? stageRoleWeights[key] : (role.weight || 0);
        return weight > 0 && (!eligibleArchetypes.length || eligibleArchetypes.includes(archetypeKey));
      });

      if (!roleEntries.length) {
        return "chaser";
      }

      let total = 0;
      roleEntries.forEach(([key, role]) => {
        total += stageRoleWeights[key] != null ? stageRoleWeights[key] : (role.weight || 0);
      });

      let roll = Phaser.Math.FloatBetween(0, total);

      for (let index = 0; index < roleEntries.length; index += 1) {
        const [key, role] = roleEntries[index];
        roll -= stageRoleWeights[key] != null ? stageRoleWeights[key] : (role.weight || 0);

        if (roll <= 0) {
          return key;
        }
      }

      return roleEntries[0][0];
    }

    setupEnemyRole(enemy, roleKey) {
      const role = (this.vocabData.negativeRoles || {})[roleKey] || (this.vocabData.negativeRoles || {}).chaser || {};
      enemy.roleKey = roleKey || "chaser";
      enemy.roleLabel = role.label || "";
      enemy.roleNextActionAt = 0;
      enemy.roleDashUntil = 0;
      enemy.roleAuraUntil = 0;
      enemy.auraSpeedMultiplier = 1;

      if (enemy.roleAura) {
        enemy.roleAura.destroy();
        enemy.roleAura = null;
      }

      if (enemy.roleKey === "rush") {
        enemy.roleNextActionAt = this.time.now + Phaser.Math.Between(role.cooldownMin || 1700, role.cooldownMax || 2600);
      } else if (enemy.roleKey === "shooter") {
        enemy.roleNextActionAt = this.time.now + Phaser.Math.Between(role.cooldownMin || 1850, role.cooldownMax || 2700);
      } else if (enemy.roleKey === "aura") {
        enemy.roleNextActionAt = this.time.now + Phaser.Math.Between(role.cooldownMin || 2200, role.cooldownMax || 3400);
        enemy.roleAura = this.add.circle(enemy.x, enemy.y, role.auraRadius || 170, role.color || 0xffef9a, 0.04)
          .setStrokeStyle(3, role.color || 0xffef9a, 0.28)
          .setVisible(false)
          .setDepth(1);
      } else if (enemy.roleKey === "summoner") {
        enemy.roleNextActionAt = this.time.now + Phaser.Math.Between(role.cooldownMin || 3600, role.cooldownMax || 4800);
      }
    }

    rollNegativeSpawnPoint() {
      const margin = 40;
      const side = Phaser.Math.Between(0, 3);
      const bounds = this.getCombatBounds(margin);
      let x = 0;
      let y = 0;

      if (side === 0) {
        x = bounds.left;
        y = Phaser.Math.Between(Math.round(bounds.top), Math.round(bounds.bottom));
      } else if (side === 1) {
        x = bounds.right;
        y = Phaser.Math.Between(Math.round(bounds.top), Math.round(bounds.bottom));
      } else if (side === 2) {
        x = Phaser.Math.Between(Math.round(bounds.left), Math.round(bounds.right));
        y = bounds.top;
      } else {
        x = Phaser.Math.Between(Math.round(bounds.left), Math.round(bounds.right));
        y = bounds.bottom;
      }

      return { x, y, side };
    }

    offsetNegativeSpawnPoint(origin, index, total) {
      const spread = (index - (total - 1) / 2) * 26;
      const jitter = Phaser.Math.Between(-10, 10);

      if (origin.side === 0 || origin.side === 1) {
        return {
          x: origin.x + Phaser.Math.Between(-8, 8),
          y: origin.y + spread + jitter,
        };
      }

      return {
        x: origin.x + spread + jitter,
        y: origin.y + Phaser.Math.Between(-8, 8),
      };
    }

    createNegativeEnemy(archetypeKey, x, y, options) {
      const settings = options || {};
      const archetype = this.vocabData.negativeArchetypes[archetypeKey] || this.vocabData.negativeArchetypes.normal;
      const definition = this.pickNegativeDefinition(archetypeKey);
      const stage = this.getCurrentStageData();
      const elapsed = this.roundSeconds - this.timeRemaining;
      const enemy = this.enemies.create(x, y, archetype.texture || "enemy-pill");
      const stageHpMultiplier = stage ? stage.enemyHpMultiplier || 1 : 1;
      const stageSpeedMultiplier = stage ? stage.enemySpeedMultiplier || 1 : 1;
      const stageDamageMultiplier = stage ? stage.enemyDamageMultiplier || 1 : 1;
      const stageScoreMultiplier = 1 + this.currentStageIndex * 0.16;

      enemy.setDisplaySize(archetype.displayWidth, archetype.displayHeight);
      enemy.setTint(archetype.tintColor || 0xffffff);
      enemy.setDepth(2);
      enemy.enemyId = (this.enemyIdCounter += 1);
      enemy.enemyKind = "negative";
      enemy.enemyType = archetypeKey;
      enemy.word = definition.word;
      enemy.hp = Math.max(1, Math.round(
        (definition.hp + Math.floor(elapsed / 24)) *
        archetype.hpMultiplier *
        stageHpMultiplier *
        (settings.hpMultiplier || 1)
      ));
      enemy.maxHp = enemy.hp;
      enemy.speed = Math.max(56, Math.round(
        (definition.speed + Math.floor(elapsed * 0.44)) *
        archetype.speedMultiplier *
        stageSpeedMultiplier *
        (settings.speedMultiplier || 1)
      ));
      enemy.scoreValue = Math.max(8, Math.round(
        definition.score *
        archetype.scoreMultiplier *
        stageScoreMultiplier *
        (settings.scoreMultiplier || 1)
      ));
      enemy.damage = Math.max(4, Math.round(
        definition.damage *
        archetype.damageMultiplier *
        stageDamageMultiplier *
        (settings.damageMultiplier || 1)
      ));
      enemy.body.setSize(archetype.bodyWidth, archetype.bodyHeight);
      enemy.isSummoned = !!settings.isSummoned;

      enemy.label = this.add.text(enemy.x, enemy.y + 1, definition.word, {
        fontFamily: this.font,
        fontSize: archetype.fontSize,
        fontStyle: "800",
        color: "#fff6f2",
        align: "center",
      }).setOrigin(0.5).setDepth(4);

      this.setupEnemyRole(enemy, this.pickNegativeRole(archetypeKey, settings));
      this.attachEnemyHealthBar(enemy, archetype.hpBarWidth, archetype.hpBarOffsetY);
      return enemy;
    }

    spawnNegativeEnemy() {
      if (this.roundEnded || this.isLevelUp || this.finalBossPhase || this.finalBossRushPhase || this.stageBossSequenceStarted) {
        return;
      }

      const stage = this.getCurrentStageData();

      if (!stage) {
        return;
      }

      const archetypeKey = this.pickNegativeArchetype();
      const archetype = this.vocabData.negativeArchetypes[archetypeKey] || this.vocabData.negativeArchetypes.normal;
      const batchSize = Phaser.Math.Between(archetype.batchMin || 1, archetype.batchMax || 1);
      const origin = this.rollNegativeSpawnPoint();

      for (let index = 0; index < batchSize; index += 1) {
        const spawn = this.offsetNegativeSpawnPoint(origin, index, batchSize);
        const delay = index * (archetype.batchDelay || 0);

        if (delay <= 0) {
          this.createNegativeEnemy(archetypeKey, spawn.x, spawn.y);
        } else {
          this.time.delayedCall(delay, () => {
            if (!this.roundEnded && !this.isLevelUp && !this.finalBossPhase && !this.finalBossRushPhase && !this.stageBossSequenceStarted) {
              this.createNegativeEnemy(archetypeKey, spawn.x, spawn.y);
            }
          });
        }
      }

      if (
        this.timeRemaining < 60 &&
        archetypeKey !== "swarm" &&
        Phaser.Math.Between(0, 100) < this.getDynamicExtraSpawnChance(stage)
      ) {
        this.time.delayedCall(120, () => {
          if (!this.roundEnded && !this.isLevelUp && !this.finalBossPhase && !this.finalBossRushPhase && !this.stageBossSequenceStarted) {
            this.spawnNegativeEnemy();
          }
        });
      }
    }

    hasActiveBoss() {
      let found = false;

      this.enemies.children.iterate((enemy) => {
        if (enemy && enemy.active && this.isBossEnemy(enemy)) {
          found = true;
        }
      });

      return found;
    }

    spawnMiniBoss() {
      if (this.roundEnded || this.isLevelUp || this.finalBossPhase || this.hasActiveBoss() || this.stageBossSpawned) {
        return;
      }

      const stage = this.getCurrentStageData();
      const defs = stage && stage.bossWords ? stage.bossWords : [];

      if (!defs.length) {
        return;
      }

      const definition = defs[Phaser.Math.Between(0, defs.length - 1)];
      const bounds = this.getCombatSafeBounds(180, 250, 220);
      const x = Phaser.Math.Between(Math.round(bounds.left), Math.round(bounds.right));
      const y = bounds.top;

      this.enemyProjectiles.clear(true, true);
      this.bullets.clear(true, true);

      const boss = this.enemies.create(x, y, definition.texture || "boss-pill");
      boss.setDisplaySize(definition.displayWidth || 224, definition.displayHeight || 88);
      boss.setTint(definition.color);
      boss.setDepth(2);
      boss.enemyId = (this.enemyIdCounter += 1);
      boss.enemyKind = "boss";
      boss.word = definition.word;
      boss.motion = definition.motion || "";
      const bossHpScale = this.getStageBossHpScale();
      const bossDurabilityMultiplier = 1.85 + this.currentStageIndex * 0.4;
      boss.hp = Math.max(1, Math.round(
        (definition.hp + Math.floor((this.roundSeconds - this.timeRemaining) / 10)) *
        (stage.bossHpMultiplier || 1) *
        bossDurabilityMultiplier *
        bossHpScale
      ));
      boss.maxHp = boss.hp;
      boss.speed = Math.max(52, Math.round(
        (definition.speed + Math.floor((this.roundSeconds - this.timeRemaining) * 0.2)) *
        (stage.bossSpeedMultiplier || 1)
      ));
      boss.scoreValue = Math.round(definition.score * (1 + this.currentStageIndex * 0.18));
      boss.damage = Math.max(8, Math.round(definition.damage * (stage.bossDamageMultiplier || 1)));
      boss.nextShotAt = this.time.now + Phaser.Math.Between(1200, 2100);
      boss.projectileKeys = definition.projectileKeys || [];
      boss.bossPatternKeys = this.buildStageBossPatternLoadout(boss);
      boss.bossPatternIndex = 0;
      boss.dashUntil = 0;
      boss.baseScale = 1;
      boss.body.setSize(
        Math.floor((definition.displayWidth || 224) * 0.72),
        Math.floor((definition.displayHeight || 88) * 0.62),
      );

      boss.label = this.add.text(boss.x, boss.y + 1, definition.word, {
        fontFamily: this.font,
        fontSize: "32px",
        fontStyle: "800",
        color: "#fff7f2",
      }).setOrigin(0.5).setDepth(4);
      this.setupStageBossGimmicks(boss);
      this.attachEnemyHealthBar(boss, definition.hpBarWidth || 144, definition.hpBarOffsetY || 56);
      this.currentStageBoss = boss;
      this.stageBossSpawned = true;
      this.pendingStageBoss = false;

      this.showFeedback(`스테이지 보스 등장: ${definition.word}`, "#ffb7a1");
      this.wordBurst(boss.x, boss.y, 0xffb7a1);
      this.showFloatingText(boss.x, boss.y - 88, `${boss.bossPatternKeys.length}식 패턴`, "#ffd8c0", "18px");
    }

    startFinalBossPhase() {
      if (this.finalBossPhase || this.roundEnded) {
        return;
      }

      this.finalBossPhase = true;
      this.stageBossSequenceStarted = false;
      this.stageBossSpawned = false;
      this.pendingStageBoss = false;
      this.currentStageBoss = null;
      this.finalBossIntroUntil = this.time.now + 1700;
      this.timeRemaining = 0;

      if (this.enemyTimer) {
        this.enemyTimer.paused = true;
      }

      if (this.bossTimer) {
        this.bossTimer.paused = true;
      }

      if (this.strongWaveTimer) {
        this.strongWaveTimer.remove(false);
        this.strongWaveTimer = null;
      }

      this.clearCombatField();
      this.checkBossAidSummons();
      this.showFeedback(`최종 보스 등장: ${this.vocabData.finalBoss.word}`, "#ffb3ad");
      this.showFloatingText(this.player.x, this.player.y - 364, this.vocabData.finalBoss.word, "#ffd0c4", "44px");
      this.wordBurst(this.player.x, this.player.y - 300, 0xffb8ad);
      this.cameras.main.flash(220, 255, 142, 124, false);

      this.spawnFinalBoss();
      this.refreshHud();
    }

    spawnFinalBoss() {
      const definition = this.vocabData.finalBoss;
      const stage = this.getCurrentStageData();
      const hpMultiplier = stage ? Math.max(1.1, stage.bossHpMultiplier || 1) : 1.1;
      const speedMultiplier = stage ? Math.max(1.14, stage.bossSpeedMultiplier || 1) : 1.14;
      const damageMultiplier = stage ? Math.max(1.2, stage.bossDamageMultiplier || 1) : 1.2;
      const durabilityMultiplier = 4.8 + this.stageCount * 0.25;
      const finalBossHpScale = this.getFinalBossHpScale();
      const spawnBounds = this.getCombatSafeBounds(180, 268, 420);
      const spawnPoint = {
        x: this.player.x,
        y: spawnBounds.top,
      };
      const boss = this.enemies.create(spawnPoint.x, spawnPoint.y, definition.texture || "final-boss-core");
      boss.setDisplaySize(definition.displayWidth || 278, definition.displayHeight || 156);
      boss.setTint(definition.color);
      boss.setDepth(2);
      boss.enemyId = (this.enemyIdCounter += 1);
      boss.enemyKind = "finalBoss";
      boss.word = definition.word;
      boss.hp = Math.round(definition.hp * hpMultiplier * durabilityMultiplier * finalBossHpScale);
      boss.maxHp = boss.hp;
      boss.speed = Math.round(definition.speed * speedMultiplier);
      boss.scoreValue = Math.round((definition.score || 2600) * 1.8);
      boss.damage = Math.round(definition.damage * damageMultiplier);
      boss.motion = "final";
      boss.body.setSize(176, 92);
      boss.baseScale = 1;
      boss.dashUntil = 0;

      boss.label = this.add.text(boss.x, boss.y + 3, definition.word, {
        fontFamily: this.font,
        fontSize: "42px",
        fontStyle: "900",
        color: "#fff5f2",
      }).setOrigin(0.5).setDepth(4);
      boss.label.setStroke("#5f1815", 8);
      this.setupFinalBossGimmicks(boss);
      this.attachEnemyHealthBar(boss, definition.hpBarWidth || 206, definition.hpBarOffsetY || 90);

      this.finalBoss = boss;
      this.finalBossSpawned = true;

      this.scheduleNextFinalBossAttack();
    }

    executeFinalBossAttack() {
      if (!this.finalBoss || !this.finalBoss.active || this.roundEnded || this.isLevelUp) {
        return;
      }

      if (this.time.now < this.finalBossIntroUntil) {
        return;
      }

      const patterns = [
        this.castFinalBossBurst,
        this.castFinalBossMeteor,
        this.castFinalBossNova,
        this.castFinalBossDash,
      ];

      const pattern = patterns[this.finalBossPatternIndex % patterns.length];
      this.finalBossPatternIndex += 1;
      pattern.call(this, this.finalBoss);
    }

    castFinalBossBurst(boss) {
      const attack = this.vocabData.finalBossAttacks.burst;
      const baseAngle = Phaser.Math.Angle.Between(boss.x, boss.y, this.player.x, this.player.y);
      this.showFloatingText(boss.x, boss.y - 96, attack.word, "#ffe0c7", "24px");

      for (let index = -5; index <= 5; index += 1) {
        const angle = baseAngle + index * 0.12;
        this.spawnFinalBossProjectile(boss.x, boss.y + 16, angle, 390, attack);
      }
    }

    castFinalBossNova(boss) {
      const attack = this.vocabData.finalBossAttacks.nova;
      this.showFloatingText(boss.x, boss.y - 96, attack.word, "#ffd1ea", "24px");

      for (let index = 0; index < 20; index += 1) {
        const angle = (Math.PI * 2 * index) / 20 + (this.finalBossPatternIndex % 2) * 0.08;
        this.spawnFinalBossProjectile(boss.x, boss.y + 8, angle, 300, attack);
      }
    }

    castFinalBossMeteor(boss) {
      const attack = this.vocabData.finalBossAttacks.meteor;
      const nearbyTarget = this.getRandomPointNearPlayer(110, 120);
      const randomTarget = this.getRandomCombatPoint(110, 280, 160);
      const extraA = this.getRandomPointNearPlayer(170, 180);
      const extraB = this.getRandomCombatPoint(90, 260, 140);
      const targets = [
        { x: this.player.x, y: this.player.y },
        nearbyTarget,
        randomTarget,
        extraA,
        extraB,
      ];

      this.showFloatingText(boss.x, boss.y - 96, attack.word, "#fff1b6", "24px");

      targets.forEach((target, index) => {
        const telegraph = this.add.image(target.x, target.y, "final-warning-ring")
          .setTint(0xffefab)
          .setAlpha(0.32)
          .setScale(0.44)
          .setDepth(6);
        this.tweens.add({
          targets: telegraph,
          scale: 1.02,
          alpha: 0.74,
          duration: 620,
          delay: index * 90,
          ease: "Sine.easeOut",
        });

        this.time.delayedCall(620 + index * 90, () => {
          if (telegraph.active) {
            this.tweens.killTweensOf(telegraph);
            telegraph.destroy();
          }

          if (this.roundEnded || this.isLevelUp || !boss.active || this.finalBoss !== boss) {
            return;
          }

          const blast = this.add.image(target.x, target.y, "final-impact-wave")
            .setTint(0xffd86f)
            .setAlpha(0.46)
            .setScale(0.52)
            .setDepth(7);
          this.tweens.add({
            targets: blast,
            scale: 1.12,
            alpha: 0,
            duration: 240,
            onComplete: () => blast.destroy(),
          });

          this.wordBurst(target.x, target.y, 0xffefab);
          const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, target.x, target.y);

          if (distance <= 72 && !this.roundEnded && !this.isLevelUp) {
            this.applyPlayerDamage(attack.damage, target.x, target.y, `${attack.word} 낙하`);
          }
        });
      });
    }

    castFinalBossDash(boss) {
      const attack = this.vocabData.finalBossAttacks.dash;
      const angle = Phaser.Math.Angle.Between(boss.x, boss.y, this.player.x, this.player.y);
      boss.dashUntil = this.time.now + 640;
      this.physics.velocityFromRotation(angle, 620, boss.body.velocity);
      this.showFloatingText(boss.x, boss.y - 96, attack.word, "#ffb9b0", "24px");

      this.time.delayedCall(660, () => {
        if (!boss.active) {
          return;
        }

        boss.dashUntil = 0;
        for (let index = 0; index < 12; index += 1) {
          const shotAngle = angle - 0.9 + index * 0.16;
          this.spawnFinalBossProjectile(boss.x, boss.y + 10, shotAngle, 340, {
            word: attack.word,
            damage: attack.damage,
            color: attack.color,
            texture: "final-bullet-fracture",
            scale: 1.08,
            spin: 0.008,
          });
        }
      });
    }

    spawnFinalBossProjectile(x, y, angle, speed, attack) {
      const projectile = this.enemyProjectiles.create(x, y, attack.texture || "final-bullet-fracture");
      projectile.setDepth(3);
      projectile.setTint(attack.color);
      projectile.sourceKind = "finalBoss";
      projectile.attackWord = attack.word;
      projectile.damage = attack.damage;
      projectile.lifespan = 3400;
      projectile.rotationSpeed = attack.spin || 0;
      projectile.setScale(attack.scale || 1);
      projectile.body.setCircle(12, 3, 3);
      projectile.rotation = angle;
      this.physics.velocityFromRotation(angle, speed, projectile.body.velocity);
      return projectile;
    }

    getStageBossGimmickThresholds() {
      const stageNumber = this.currentStageIndex + 1;

      if (stageNumber <= 1) {
        return [];
      }

      if (stageNumber <= 3) {
        return [0.5];
      }

      if (stageNumber === 4) {
        return [0.7, 0.4];
      }

      return [0.75, 0.5, 0.25];
    }

    setupStageBossGimmicks(boss) {
      const thresholds = this.getStageBossGimmickThresholds();
      const gimmickPool = Phaser.Utils.Array.Shuffle(["invincible", "frenzy", "mirage", "heal"]);
      boss.stageGimmicks = thresholds.map((threshold, index) => ({
        threshold: threshold,
        type: gimmickPool[index],
        triggered: false,
      }));
      boss.gimmickInvulnerableUntil = 0;
      boss.gimmickFrenzyUntil = 0;
      boss.lastInvulnerableNoticeAt = 0;
    }

    getStageBossGimmickLabel(type) {
      const labels = {
        invincible: "무적",
        frenzy: "광란",
        mirage: "환영 분신",
        heal: "회복",
      };

      return labels[type] || "기믹";
    }

    getStageBossGimmickColor(type) {
      const colors = {
        invincible: "#fff0a6",
        frenzy: "#ffb08a",
        mirage: "#d9dcff",
        heal: "#b8ffd4",
      };

      return colors[type] || "#fff2cf";
    }

    triggerStageBossGimmick(enemy) {
      if (!enemy || !enemy.active || enemy.enemyKind !== "boss" || !enemy.stageGimmicks || !enemy.stageGimmicks.length) {
        return false;
      }

      const nextGimmick = enemy.stageGimmicks.find((entry) => !entry.triggered);

      if (!nextGimmick) {
        return false;
      }

      const hpRatio = enemy.hp / Math.max(1, enemy.maxHp || enemy.hp);

      if (hpRatio > nextGimmick.threshold) {
        return false;
      }

      nextGimmick.triggered = true;
      const label = this.getStageBossGimmickLabel(nextGimmick.type);
      const color = this.getStageBossGimmickColor(nextGimmick.type);

      if (nextGimmick.type === "invincible") {
        enemy.gimmickInvulnerableUntil = this.time.now + (enemy.gimmickInvulnerableDuration || 3000);
      } else if (nextGimmick.type === "frenzy") {
        enemy.gimmickFrenzyUntil = this.time.now + (enemy.gimmickFrenzyDuration || 3000);
        enemy.nextShotAt = Math.min(enemy.nextShotAt || this.time.now, this.time.now + 120);
      } else if (nextGimmick.type === "mirage") {
        this.spawnBossMirages(enemy, enemy.gimmickMirageOptions);
      } else if (nextGimmick.type === "heal") {
        const healAmount = Math.max(1, Math.round(enemy.maxHp * (enemy.gimmickHealRatio || 0.2)));
        enemy.hp = Math.min(enemy.maxHp, enemy.hp + healAmount);
        this.showFloatingText(enemy.x, enemy.y - 106, `+${healAmount}`, color, "26px");
      }

      this.showFeedback(`${enemy.word} ${label}`, color);
      this.showFloatingText(enemy.x, enemy.y - 76, label, color, "24px");
      this.wordBurst(enemy.x, enemy.y, Phaser.Display.Color.HexStringToColor(color).color);
      return true;
    }

    spawnBossMirages(enemy, options) {
      if (!enemy || !enemy.active) {
        return;
      }

      const settings = options || {};
      const cloneCount = settings.cloneCount || (2 + Math.min(1, Math.floor(this.currentStageIndex / 2)));

      for (let index = 0; index < cloneCount; index += 1) {
        const angle = (-Math.PI / 2) + ((Math.PI * 2) * index) / cloneCount;
        const offset = 110 + index * 10;
        const cloneX = enemy.x + Math.cos(angle) * offset;
        const cloneY = enemy.y + Math.sin(angle) * offset;
        const clone = this.enemies.create(cloneX, cloneY, enemy.texture.key);
        clone.setDisplaySize(enemy.displayWidth * 0.78, enemy.displayHeight * 0.78);
        clone.setTint(settings.tint || 0xbfc8ff);
        clone.setDepth(2);
        clone.setAlpha(settings.alpha || 0.62);
        clone.enemyId = (this.enemyIdCounter += 1);
        clone.enemyKind = "bossClone";
        clone.word = settings.word || "환영";
        clone.motion = "clone";
        clone.hp = Math.max(10, Math.round(enemy.maxHp * (settings.hpRatio || 0.08)));
        clone.maxHp = clone.hp;
        clone.speed = Math.round(enemy.speed * 1.06);
        clone.scoreValue = 0;
        clone.damage = Math.max(5, Math.round(enemy.damage * (settings.damageMultiplier || 0.55)));
        clone.expiresAt = this.time.now + (settings.duration || 9000);
        clone.body.setSize(
          Math.max(28, Math.floor(enemy.body.width * 0.7)),
          Math.max(28, Math.floor(enemy.body.height * 0.7))
        );
        clone.label = this.add.text(clone.x, clone.y + 1, clone.word, {
          fontFamily: this.font,
          fontSize: "20px",
          fontStyle: "800",
          color: "#ecefff",
        }).setOrigin(0.5).setDepth(4).setAlpha(0.8);
      }
    }

    getFinalBossGimmickThresholds() {
      return [0.85, 0.65, 0.45, 0.25];
    }

    setupFinalBossGimmicks(boss) {
      const gimmickPool = Phaser.Utils.Array.Shuffle(["invincible", "frenzy", "mirage", "heal"]);
      boss.finalBossGimmicks = this.getFinalBossGimmickThresholds().map((threshold, index) => ({
        threshold: threshold,
        type: gimmickPool[index],
        triggered: false,
      }));
      boss.gimmickInvulnerableUntil = 0;
      boss.gimmickFrenzyUntil = 0;
      boss.lastInvulnerableNoticeAt = 0;
    }

    triggerFinalBossGimmick(enemy) {
      if (!enemy || !enemy.active || enemy.enemyKind !== "finalBoss" || !enemy.finalBossGimmicks || !enemy.finalBossGimmicks.length) {
        return false;
      }

      const nextGimmick = enemy.finalBossGimmicks.find((entry) => !entry.triggered);

      if (!nextGimmick) {
        return false;
      }

      const hpRatio = enemy.hp / Math.max(1, enemy.maxHp || enemy.hp);

      if (hpRatio > nextGimmick.threshold) {
        return false;
      }

      nextGimmick.triggered = true;
      const label = this.getStageBossGimmickLabel(nextGimmick.type);
      const color = this.getStageBossGimmickColor(nextGimmick.type);

      if (nextGimmick.type === "invincible") {
        enemy.gimmickInvulnerableUntil = this.time.now + 3000;
      } else if (nextGimmick.type === "frenzy") {
        enemy.gimmickFrenzyUntil = this.time.now + 3000;
        this.scheduleNextFinalBossAttack();
      } else if (nextGimmick.type === "mirage") {
        this.spawnBossMirages(enemy, {
          cloneCount: 4,
          hpRatio: 0.12,
          duration: 12000,
          damageMultiplier: 0.7,
          tint: 0xe2d7ff,
          alpha: 0.68,
          word: "환영 파편",
        });
      } else if (nextGimmick.type === "heal") {
        const healAmount = Math.max(1, Math.round(enemy.maxHp * 0.2));
        enemy.hp = Math.min(enemy.maxHp, enemy.hp + healAmount);
        this.showFloatingText(enemy.x, enemy.y - 110, `+${healAmount}`, color, "28px");
      }

      this.showFeedback(`${enemy.word} ${label}`, color);
      this.showFloatingText(enemy.x, enemy.y - 84, label, color, "28px");
      this.wordBurst(enemy.x, enemy.y, Phaser.Display.Color.HexStringToColor(color).color);
      return true;
    }

    getFinalBossAttackDelay(boss) {
      const hpRatio = boss && boss.active ? boss.hp / Math.max(1, boss.maxHp || boss.hp) : 1;
      const triggeredCount = boss && boss.finalBossGimmicks
        ? boss.finalBossGimmicks.filter((entry) => entry.triggered).length
        : 0;
      let delay = 1460 - triggeredCount * 120 - Math.round((1 - hpRatio) * 260);

      if (boss && (boss.gimmickFrenzyUntil || 0) > this.time.now) {
        delay *= 0.35;
      }

      return Math.max((boss && (boss.gimmickFrenzyUntil || 0) > this.time.now) ? 280 : 720, delay);
    }

    scheduleNextFinalBossAttack() {
      if (this.finalBossAttackTimer) {
        this.finalBossAttackTimer.remove(false);
        this.finalBossAttackTimer = null;
      }

      if (!this.finalBoss || !this.finalBoss.active || this.roundEnded || this.isLevelUp) {
        return;
      }

      this.finalBossAttackTimer = this.time.addEvent({
        delay: this.getFinalBossAttackDelay(this.finalBoss),
        callback: () => {
          this.executeFinalBossAttack();

          if (this.finalBoss && this.finalBoss.active && !this.roundEnded && !this.isLevelUp) {
            this.scheduleNextFinalBossAttack();
          }
        },
        callbackScope: this,
      });
    }

    attachEnemyHealthBar(enemy, width, offsetY) {
      enemy.hpBarWidth = width;
      enemy.hpBarOffsetY = offsetY;
      enemy.hpBarTrack = this.add.rectangle(enemy.x, enemy.y + offsetY, width, 8, 0x13080b, 0.76)
        .setDepth(4)
        .setStrokeStyle(1, 0xffffff, 0.14);
      enemy.hpBarFill = this.add.rectangle(enemy.x - (width - 4) / 2, enemy.y + offsetY, width - 4, 5, 0x9ff2b4, 1)
        .setOrigin(0, 0.5)
        .setDepth(5);
      this.updateEnemyHealthBar(enemy);
    }

    updateEnemyHealthBar(enemy) {
      if (!enemy || !enemy.active || !enemy.hpBarTrack || !enemy.hpBarFill) {
        return;
      }

      const ratio = Phaser.Math.Clamp(enemy.hp / Math.max(1, enemy.maxHp || enemy.hp), 0, 1);
      const width = enemy.hpBarWidth || 92;
      const innerWidth = width - 4;
      const y = enemy.y + (enemy.hpBarOffsetY || 40);

      enemy.hpBarTrack.setPosition(enemy.x, y);
      enemy.hpBarFill.setPosition(enemy.x - innerWidth / 2, y);
      enemy.hpBarFill.setScale(Math.max(ratio, 0.001), 1);
      enemy.hpBarFill.fillColor = ratio > 0.55 ? 0x9ff2b4 : ratio > 0.25 ? 0xffd16f : 0xff7f79;
      enemy.hpBarFill.setVisible(ratio > 0);
    }

    refreshAttackTimer() {
      if (this.autoFireTimer) {
        this.autoFireTimer.remove(false);
      }

      let delay = this.attackCooldown;

      if (this.isAwakeningActive()) {
        delay = Math.max(150, delay - 80);
      }

      if (this.isTransformActive()) {
        delay = Math.max(130, delay - 90);
      }

      this.autoFireTimer = this.time.addEvent({
        delay: delay,
        callback: this.fireAutoShot,
        callbackScope: this,
        loop: true,
      });
    }

    refreshLightningTimer() {
      if (this.lightningTimer) {
        this.lightningTimer.remove(false);
        this.lightningTimer = null;
      }

      if (this.lightningLevel <= 0) {
        return;
      }

      this.lightningTimer = this.time.addEvent({
        delay: Math.max(760, 1800 - this.lightningLevel * 170),
        callback: this.castLightning,
        callbackScope: this,
        loop: true,
      });
    }

    refreshWaveTimer() {
      if (this.waveTimer) {
        this.waveTimer.remove(false);
        this.waveTimer = null;
      }

      if (this.waveLevel <= 0) {
        return;
      }

      this.waveTimer = this.time.addEvent({
        delay: Math.max(900, 2200 - this.waveLevel * 180),
        callback: this.castWavePulse,
        callbackScope: this,
        loop: true,
      });
    }

    refreshSpearTimer() {
      if (this.spearTimer) {
        this.spearTimer.remove(false);
        this.spearTimer = null;
      }

      if (this.spearLevel <= 0) {
        return;
      }

      this.spearTimer = this.time.addEvent({
        delay: Math.max(620, 1680 - this.spearLevel * 140),
        callback: this.castSpearVolley,
        callbackScope: this,
        loop: true,
      });
    }

    refreshChainTimer() {
      if (this.chainTimer) {
        this.chainTimer.remove(false);
        this.chainTimer = null;
      }

      if (this.chainLevel <= 0) {
        return;
      }

      this.chainTimer = this.time.addEvent({
        delay: Math.max(760, 1850 - this.chainLevel * 150),
        callback: this.castChainWeapon,
        callbackScope: this,
        loop: true,
      });
    }

    refreshMistTimer() {
      if (this.mistTimer) {
        this.mistTimer.remove(false);
        this.mistTimer = null;
      }

      if (this.mistLevel <= 0) {
        return;
      }

      this.mistTimer = this.time.addEvent({
        delay: Math.max(1080, 2650 - this.mistLevel * 180 - this.durationLevel * 90),
        callback: this.spawnMistZone,
        callbackScope: this,
        loop: true,
      });
    }

    refreshBlastTimer() {
      if (this.blastTimer) {
        this.blastTimer.remove(false);
        this.blastTimer = null;
      }

      if (this.getBlastPowerLevel() <= 0) {
        return;
      }

      const powerLevel = this.getBlastPowerLevel();
      const supernovaLevel = this.getLegendaryLevel("supernova");
      const delay = Math.max(1150, 3280 - powerLevel * 190 - supernovaLevel * 110);

      this.blastTimer = this.time.addEvent({
        delay: delay,
        callback: this.castBlastWeapon,
        callbackScope: this,
        loop: true,
      });
    }

    refreshBladeTimer() {
      if (this.bladeTimer) {
        this.bladeTimer.remove(false);
        this.bladeTimer = null;
      }

      if (this.bladeLevel <= 0) {
        return;
      }

      const harvestLevel = this.getLegendaryLevel("harvest");
      this.bladeTimer = this.time.addEvent({
        delay: Math.max(520, 1650 - this.bladeLevel * 140 - harvestLevel * 90),
        callback: this.castBladeBurst,
        callbackScope: this,
        loop: true,
      });
    }

    refreshDiscTimer() {
      if (this.discTimer) {
        this.discTimer.remove(false);
        this.discTimer = null;
      }

      if (this.discLevel <= 0) {
        return;
      }

      const harvestLevel = this.getLegendaryLevel("harvest");
      this.discTimer = this.time.addEvent({
        delay: Math.max(780, 2380 - this.discLevel * 150 - harvestLevel * 110),
        callback: this.castDiscVolley,
        callbackScope: this,
        loop: true,
      });
    }

    getUpgradeLevel(key) {
      return this.upgradeLevels && this.upgradeLevels[key] ? this.upgradeLevels[key] : 0;
    }

    getLegendaryLevel(key) {
      return this.legendaryLevels && this.legendaryLevels[key] ? this.legendaryLevels[key] : 0;
    }

    isUpgradeAvailable(upgrade) {
      if (!upgrade) {
        return false;
      }

      if (this.getUpgradeLevel(upgrade.key) >= (upgrade.maxLevel || 1)) {
        return false;
      }

      if (upgrade.requiresAny && !upgrade.requiresAny.some((key) => this.getUpgradeLevel(key) > 0)) {
        return false;
      }

      return true;
    }

    getUpgradeChoices(count) {
      const desiredCount = count || 3;
      const readyPool = (this.vocabData.upgrades || []).filter((upgrade) => this.isUpgradeAvailable(upgrade));
      const fallbackPool = (this.vocabData.upgrades || []).filter(
        (upgrade) => this.getUpgradeLevel(upgrade.key) < (upgrade.maxLevel || 1)
      );
      const picks = [];

      Phaser.Utils.Array.Shuffle(readyPool.slice()).forEach((upgrade) => {
        if (picks.length < desiredCount && !picks.find((entry) => entry.key === upgrade.key)) {
          picks.push(upgrade);
        }
      });

      Phaser.Utils.Array.Shuffle(fallbackPool.slice()).forEach((upgrade) => {
        if (picks.length < desiredCount && !picks.find((entry) => entry.key === upgrade.key)) {
          picks.push(upgrade);
        }
      });

      return picks.slice(0, desiredCount);
    }

    getWeaponAmplifyMultiplier() {
      return 1 + this.amplifyLevel * 0.18;
    }

    getTrackingStrength() {
      if (this.trackingLevel <= 0) {
        return 0;
      }

      return Math.min(0.34, 0.08 + this.trackingLevel * 0.05);
    }

    getSplitExtraShots(multiplier = 1) {
      return Math.max(0, Math.round(Math.min(3, this.splitLevel) * multiplier));
    }

    getSplitShotCount() {
      return 1 + this.getSplitExtraShots();
    }

    getSplitDamageMultiplier() {
      const penalties = [1, 0.7, 0.55, 0.45];
      return penalties[Math.min(this.splitLevel, penalties.length - 1)];
    }

    getBlastPowerLevel() {
      return this.blastLevel + this.getLegendaryLevel("supernova");
    }

    getHarvestAttractRadius() {
      return 0;
    }

    getPlayerBaseScale() {
      return 1;
    }

    buildSpreadAngles(baseAngle, count, step) {
      const total = Math.max(1, count || 1);

      if (total === 1) {
        return [baseAngle];
      }

      const start = -((total - 1) / 2) * step;
      const angles = [];

      for (let index = 0; index < total; index += 1) {
        angles.push(baseAngle + start + index * step);
      }

      return angles;
    }

    findNearestEnemyFromPoint(x, y, maxDistance, excludeIds) {
      let nearest = null;
      let nearestDistance = maxDistance || Number.MAX_SAFE_INTEGER;

      this.enemies.children.iterate((enemy) => {
        if (!enemy || !enemy.active) {
          return;
        }

        if (excludeIds && excludeIds.has(enemy.enemyId)) {
          return;
        }

        const distance = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);

        if (distance <= nearestDistance) {
          nearest = enemy;
          nearestDistance = distance;
        }
      });

      return nearest;
    }

    findPriorityEnemyFromPoint(x, y, maxDistance, excludeIds) {
      let nearestBoss = null;
      let nearestBossDistance = maxDistance || Number.MAX_SAFE_INTEGER;
      let nearest = null;
      let nearestDistance = maxDistance || Number.MAX_SAFE_INTEGER;

      this.enemies.children.iterate((enemy) => {
        if (!enemy || !enemy.active) {
          return;
        }

        if (enemy.enemyKind === "finalBoss" && this.time.now < this.finalBossIntroUntil) {
          return;
        }

        if (excludeIds && excludeIds.has(enemy.enemyId)) {
          return;
        }

        const distance = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);

        if (distance > (maxDistance || Number.MAX_SAFE_INTEGER)) {
          return;
        }

        if (this.isBossEnemy(enemy) && distance <= nearestBossDistance) {
          nearestBoss = enemy;
          nearestBossDistance = distance;
        }

        if (distance <= nearestDistance) {
          nearest = enemy;
          nearestDistance = distance;
        }
      });

      return nearestBoss || nearest;
    }

    spawnPlayerBullet(config) {
      const settings = config || {};
      const projectile = this.bullets.create(settings.x || this.player.x, settings.y || this.player.y, settings.texture || "bullet");
      projectile.setDepth(settings.depth || 3);
      projectile.weaponType = settings.weaponType || "basic";
      projectile.damage = settings.damage || 1;
      projectile.lifespan = settings.lifespan || 1200;
      projectile.speed = settings.speed || 560;
      projectile.remainingPierce = settings.remainingPierce || 0;
      projectile.chainJumps = settings.chainJumps || 0;
      projectile.impactDamage = settings.impactDamage || 0;
      projectile.impactRadius = settings.impactRadius || 0;
      projectile.impactColor = settings.impactColor || 0xffd48b;
      projectile.impactLabel = settings.impactLabel || "";
      projectile.homingStrength = settings.homingStrength || 0;
      projectile.rotationSpeed = settings.rotationSpeed || 0;
      projectile.hitBlastDamage = settings.hitBlastDamage || 0;
      projectile.hitBlastRadius = settings.hitBlastRadius || 0;
      projectile.hitBlastColor = settings.hitBlastColor || 0xffd48b;
      projectile.hitBlastLabel = settings.hitBlastLabel || "";
      projectile.hitTargets = new Set();

      if (settings.displayWidth && settings.displayHeight) {
        projectile.setDisplaySize(settings.displayWidth, settings.displayHeight);
      } else if (settings.scale) {
        projectile.setScale(settings.scale);
      }

      if (settings.tintColor) {
        projectile.setTint(settings.tintColor);
      }

      if (settings.bodyCircleRadius) {
        projectile.body.setCircle(settings.bodyCircleRadius, settings.bodyCircleOffsetX || 0, settings.bodyCircleOffsetY || 0);
      } else {
        projectile.body.setSize(settings.bodyWidth || 16, settings.bodyHeight || 16);
      }

      projectile.rotation = settings.angle || 0;
      this.physics.velocityFromRotation(projectile.rotation, projectile.speed, projectile.body.velocity);
      return projectile;
    }

    castSpearVolley() {
      if (this.roundEnded || this.isLevelUp || this.spearLevel <= 0) {
        return;
      }

      const cometLevel = this.getLegendaryLevel("comet");
      const target = this.findNearestEnemyFromPoint(this.player.x, this.player.y, this.attackRange + 180);

      if (!target) {
        return;
      }

      const baseAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, target.x, target.y);
      const count = 1 + Math.floor((this.spearLevel - 1) / 2) + Math.floor(cometLevel / 2) + this.getSplitExtraShots(0.5);
      const damage = Math.max(2, Math.round(
        (3.2 + this.spearLevel * 1.7 + cometLevel * 1.1) * this.getWeaponAmplifyMultiplier()
      ));
      const pierce = 1 + Math.floor(this.spearLevel / 2) + cometLevel;
      const chainJumps = this.linkLevel > 0
        ? 1 + Math.floor(this.linkLevel / 2) + Math.floor(cometLevel / 2)
        : Math.floor(cometLevel / 2);
      const hitBlastDamage = cometLevel <= 0 ? 0 : Math.max(1, Math.round(damage * (0.28 + cometLevel * 0.08)));
      const hitBlastRadius = cometLevel <= 0 ? 0 : 34 + cometLevel * 12;
      const angles = this.buildSpreadAngles(baseAngle, count, 0.14);

      angles.forEach((angle) => {
        this.spawnPlayerBullet({
          x: this.player.x,
          y: this.player.y - 10,
          texture: "spear-shot",
          weaponType: "spear",
          angle: angle,
          speed: 680,
          damage: damage,
          lifespan: 1280,
          displayWidth: 62 + this.amplifyLevel * 3,
          displayHeight: 18 + this.amplifyLevel,
          bodyWidth: 38,
          bodyHeight: 12,
          remainingPierce: pierce,
          chainJumps: chainJumps,
          tintColor: 0xffdf9c,
          hitBlastDamage: hitBlastDamage,
          hitBlastRadius: hitBlastRadius,
          hitBlastColor: 0xffd6a2,
          hitBlastLabel: "",
        });
      });
    }

    castChainWeapon() {
      if (this.roundEnded || this.isLevelUp || this.chainLevel <= 0) {
        return;
      }

      const cometLevel = this.getLegendaryLevel("comet");
      const startTarget = this.findNearestEnemyFromPoint(this.player.x, this.player.y, this.attackRange + 220);

      if (!startTarget) {
        return;
      }

      const hitIds = new Set();
      const maxHits = 2 + this.chainLevel + this.linkLevel + cometLevel;
      const chainDamage = Math.max(2, Math.round(
        (2.2 + this.chainLevel * 1.35 + cometLevel * 0.9) * this.getWeaponAmplifyMultiplier()
      ));
      const finalBurstDamage = cometLevel <= 0 ? 0 : Math.max(1, Math.round(chainDamage * (0.55 + cometLevel * 0.12)));
      const finalBurstRadius = 48 + cometLevel * 14;
      const chainTargets = [];
      let current = startTarget;
      let currentX = this.player.x;
      let currentY = this.player.y;

      while (current && chainTargets.length < maxHits) {
        chainTargets.push({
          enemy: current,
          fromX: currentX,
          fromY: currentY,
        });
        hitIds.add(current.enemyId);
        currentX = current.x;
        currentY = current.y;
        current = this.findNearestEnemyFromPoint(currentX, currentY, 270 + this.chainLevel * 18, hitIds);
      }

      if (!chainTargets.length) {
        return;
      }

      this.showFloatingText(chainTargets[0].enemy.x, chainTargets[0].enemy.y - 40, "사슬", "#d8f7ff", "20px");

      chainTargets.forEach((step, index) => {
        this.time.delayedCall(index * 70, () => {
          if (this.roundEnded || this.isLevelUp || !step.enemy.active) {
            return;
          }

          this.drawChainArc(step.fromX, step.fromY, step.enemy.x, step.enemy.y, 0xaeeaff);
          this.applyDamageToEnemy(step.enemy, chainDamage);
          if (index === chainTargets.length - 1 && finalBurstDamage > 0) {
            this.triggerWeaponBlast(step.enemy.x, step.enemy.y, finalBurstRadius, finalBurstDamage, step.enemy, {
              color: 0xcfc7ff,
              label: cometLevel >= 2 ? "혜성" : "",
              heavy: cometLevel >= 3,
            });
          }
          step.enemy.setAlpha(0.76);

          this.time.delayedCall(90, () => {
            if (step.enemy.active) {
              step.enemy.setAlpha(1);
            }
          });
        });
      });
    }

    castBlastWeapon() {
      if (this.roundEnded || this.isLevelUp || this.getBlastPowerLevel() <= 0) {
        return;
      }

      const powerLevel = this.getBlastPowerLevel();
      const supernovaLevel = this.getLegendaryLevel("supernova");
      const target = this.findNearestEnemyFromPoint(this.player.x, this.player.y, this.attackRange + 260 + powerLevel * 12);

      if (!target) {
        return;
      }

      const baseAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, target.x, target.y);
      const shotCount = 1 + Math.floor((powerLevel - 1) / 4) + this.getSplitExtraShots(0.5);
      const directDamage = Math.max(3, Math.round(
        (4.2 + powerLevel * 1.7 + supernovaLevel * 1.1) * this.getWeaponAmplifyMultiplier()
      ));
      const blastDamage = Math.max(directDamage + 2, Math.round(
        (9 + powerLevel * 3 + supernovaLevel * 2.4) * this.getWeaponAmplifyMultiplier()
      ));
      const blastRadius = 82 + powerLevel * 16 + supernovaLevel * 12;
      const angles = this.buildSpreadAngles(baseAngle, shotCount, 0.16);

      angles.forEach((angle) => {
        this.spawnPlayerBullet({
          x: this.player.x,
          y: this.player.y - 12,
          texture: "blast-shell",
          weaponType: "blast",
          angle: angle,
          speed: 320 + powerLevel * 12,
          damage: directDamage,
          lifespan: 1450 + powerLevel * 40,
          displayWidth: 34 + powerLevel * 3,
          displayHeight: 34 + powerLevel * 3,
          bodyCircleRadius: 12,
          bodyCircleOffsetX: 14,
          bodyCircleOffsetY: 14,
          impactDamage: blastDamage,
          impactRadius: blastRadius,
          impactColor: supernovaLevel > 0 ? 0xe3a5ff : 0xffd48b,
          impactLabel: "폭발",
          tintColor: supernovaLevel > 0 ? 0xf1b7ff : 0xffd48b,
          rotationSpeed: 0.006 * (angle >= baseAngle ? 1 : -1),
        });
      });
    }

    castBladeBurst() {
      if (this.roundEnded || this.isLevelUp || this.bladeLevel <= 0) {
        return;
      }

      const harvestLevel = this.getLegendaryLevel("harvest");
      const target = this.findPriorityEnemyFromPoint(this.player.x, this.player.y, this.attackRange + 140);
      const baseAngle = target
        ? Phaser.Math.Angle.Between(this.player.x, this.player.y, target.x, target.y)
        : this.getBeamAimAngle();
      const bladeCount = 2 + Math.floor((this.bladeLevel - 1) / 2) + this.getSplitExtraShots(0.5) + Math.floor(harvestLevel / 2);
      const bladeDamage = Math.max(2, Math.round(
        (2.3 + this.bladeLevel * 1.3 + harvestLevel * 0.9) * this.getWeaponAmplifyMultiplier()
      ));
      const pierce = Math.floor((this.bladeLevel - 1) / 3) + Math.floor(harvestLevel / 3);

      this.emitBladeFan(
        baseAngle,
        bladeCount,
        bladeDamage,
        640 + this.bladeLevel * 18,
        540 + this.bladeLevel * 40,
        54 + this.bladeLevel * 3 + this.amplifyLevel * 4,
        pierce,
        0xfff4cc,
        harvestLevel >= 2 ? Math.max(1, Math.round(bladeDamage * 0.22)) : 0,
        28 + harvestLevel * 8
      );

      if (harvestLevel > 0) {
        this.time.delayedCall(120, () => {
          if (this.roundEnded || this.isLevelUp) {
            return;
          }

          this.emitBladeFan(
            baseAngle + Phaser.Math.FloatBetween(-0.12, 0.12),
            Math.max(1, bladeCount - 1 + Math.floor(harvestLevel / 3)),
            Math.max(1, Math.round(bladeDamage * (0.52 + harvestLevel * 0.06))),
            600 + this.bladeLevel * 12,
            420 + this.bladeLevel * 26,
            42 + this.bladeLevel * 2,
            Math.max(0, pierce - 1),
            0xdff8ff,
            0,
            0
          );
        });
      }
    }

    emitBladeFan(baseAngle, count, damage, speed, lifespan, size, pierce, tintColor, hitBlastDamage, hitBlastRadius) {
      const angles = this.buildSpreadAngles(baseAngle, count, 0.2);

      angles.forEach((angle, index) => {
        this.spawnPlayerBullet({
          x: this.player.x,
          y: this.player.y - 6,
          texture: "blade-shot",
          weaponType: "blade",
          angle: angle,
          speed: speed,
          damage: damage,
          lifespan: lifespan,
          displayWidth: size,
          displayHeight: Math.max(18, size * 0.34),
          bodyWidth: Math.max(26, size * 0.52),
          bodyHeight: 12,
          remainingPierce: pierce,
          tintColor: tintColor,
          rotationSpeed: (index % 2 === 0 ? 1 : -1) * 0.008,
          hitBlastDamage: hitBlastDamage,
          hitBlastRadius: hitBlastRadius,
          hitBlastColor: 0xdaf8ff,
        });
      });
    }

    castDiscVolley() {
      if (this.roundEnded || this.isLevelUp || this.discLevel <= 0) {
        return;
      }

      const harvestLevel = this.getLegendaryLevel("harvest");
      const target = this.findPriorityEnemyFromPoint(this.player.x, this.player.y, this.attackRange + 220);
      const baseAngle = target
        ? Phaser.Math.Angle.Between(this.player.x, this.player.y, target.x, target.y)
        : this.getBeamAimAngle();
      const count = 1 + Math.floor((this.discLevel - 1) / 3) + this.getSplitExtraShots(0.5) + Math.floor(harvestLevel / 4);
      const damage = Math.max(3, Math.round(
        (3 + this.discLevel * 1.5 + harvestLevel) * this.getWeaponAmplifyMultiplier()
      ));
      const pierce = 2 + Math.floor(this.discLevel / 2) + Math.floor(harvestLevel / 2);
      const hitBlastDamage = harvestLevel <= 0 ? 0 : Math.max(1, Math.round(damage * (0.34 + harvestLevel * 0.06)));
      const hitBlastRadius = harvestLevel <= 0 ? 0 : 34 + harvestLevel * 10;
      const angles = this.buildSpreadAngles(baseAngle, count, 0.12);

      angles.forEach((angle, index) => {
        this.spawnPlayerBullet({
          x: this.player.x,
          y: this.player.y - 8,
          texture: "disc-shot",
          weaponType: "disc",
          angle: angle,
          speed: 360 + this.discLevel * 16,
          damage: damage,
          lifespan: 1700 + this.discLevel * 70,
          displayWidth: 30 + this.discLevel * 4 + harvestLevel * 2,
          displayHeight: 30 + this.discLevel * 4 + harvestLevel * 2,
          bodyCircleRadius: 12,
          bodyCircleOffsetX: 12,
          bodyCircleOffsetY: 12,
          remainingPierce: pierce,
          tintColor: 0xdff7ff,
          rotationSpeed: (index % 2 === 0 ? 1 : -1) * (0.008 + harvestLevel * 0.0012),
          hitBlastDamage: hitBlastDamage,
          hitBlastRadius: hitBlastRadius,
          hitBlastColor: 0xcdf4ff,
          hitBlastLabel: "",
        });
      });
    }

    drawChainArc(fromX, fromY, toX, toY, color) {
      const line = this.add.graphics().setDepth(7);
      const midX = (fromX + toX) / 2 + Phaser.Math.Between(-18, 18);
      const midY = (fromY + toY) / 2 + Phaser.Math.Between(-18, 18);

      line.lineStyle(4, color || 0xbdefff, 0.92);
      line.beginPath();
      line.moveTo(fromX, fromY);
      line.lineTo(midX, midY);
      line.lineTo(toX, toY);
      line.strokePath();

      this.tweens.add({
        targets: line,
        alpha: 0,
        duration: 120,
        onComplete: () => line.destroy(),
      });
    }

    triggerImpactChain(sourceEnemy, damage, jumps, seedIds) {
      if (!sourceEnemy || !sourceEnemy.active || jumps <= 0 || this.roundEnded) {
        return;
      }

      const hitIds = new Set(seedIds ? Array.from(seedIds) : []);
      hitIds.add(sourceEnemy.enemyId);
      const chainTargets = [];
      let fromX = sourceEnemy.x;
      let fromY = sourceEnemy.y;
      let nextTarget = this.findNearestEnemyFromPoint(fromX, fromY, 210 + this.linkLevel * 24, hitIds);

      while (nextTarget && chainTargets.length < jumps) {
        chainTargets.push({
          enemy: nextTarget,
          fromX: fromX,
          fromY: fromY,
        });
        hitIds.add(nextTarget.enemyId);
        fromX = nextTarget.x;
        fromY = nextTarget.y;
        nextTarget = this.findNearestEnemyFromPoint(fromX, fromY, 210 + this.linkLevel * 24, hitIds);
      }

      chainTargets.forEach((step, index) => {
        this.time.delayedCall(index * 60, () => {
          if (this.roundEnded || this.isLevelUp || !step.enemy.active) {
            return;
          }

          this.drawChainArc(step.fromX, step.fromY, step.enemy.x, step.enemy.y, 0xbce8ff);
          this.applyDamageToEnemy(step.enemy, damage);
          step.enemy.setAlpha(0.8);

          this.time.delayedCall(80, () => {
            if (step.enemy.active) {
              step.enemy.setAlpha(1);
            }
          });
        });
      });
    }

    syncShieldWeapon() {
      const forgeLevel = this.getLegendaryLevel("giant");
      const orbCount = this.shieldWeaponLevel <= 0
        ? 0
        : Math.min(5, 1 + Math.floor((this.shieldWeaponLevel - 1) / 2) + Math.min(2, Math.ceil(forgeLevel / 2)));

      while (this.shieldOrbs.length > orbCount) {
        const orb = this.shieldOrbs.pop();
        orb.destroy();
      }

      while (this.shieldOrbs.length < orbCount) {
        const orb = this.shieldOrbGroup.create(this.player.x, this.player.y, "shield-orb");
        orb.setDepth(4);
        orb.body.setCircle(15, 6, 6);
        this.shieldOrbs.push(orb);
      }
    }

    spawnMistZone() {
      if (this.roundEnded || this.isLevelUp || this.mistLevel <= 0) {
        return;
      }

      const target = this.findNearestEnemyFromPoint(this.player.x, this.player.y, this.attackRange + 260);
      const fallbackPoint = this.getRandomPointNearPlayer(110, 120, 80, 240, 140);
      const zoneX = target ? target.x : fallbackPoint.x;
      const zoneY = target ? target.y : fallbackPoint.y;
      this.spawnMistZoneAt(zoneX, zoneY);
    }

    spawnMistZoneAt(zoneX, zoneY, options) {
      const settings = options || {};
      const supernovaLevel = this.getLegendaryLevel("supernova");
      const maxZones = settings.maxZones || (
        1 +
        Math.floor((this.mistLevel + this.durationLevel) / 2) +
        Math.min(2, Math.floor((supernovaLevel + 1) / 2))
      );

      while (this.mistZones.length >= maxZones) {
        const oldest = this.mistZones.shift();

        if (oldest && oldest.sprite) {
          oldest.sprite.destroy();
        }
      }

      const radius = settings.radius || (90 + this.mistLevel * 16 + this.durationLevel * 12 + supernovaLevel * 10);
      const tickDamage = settings.tickDamage || Math.max(1, Math.round(
        (0.9 + this.mistLevel * 0.65 + supernovaLevel * 0.3) * this.getWeaponAmplifyMultiplier()
      ));
      const color = settings.color || (supernovaLevel > 0 ? 0xe0b3ff : 0xcde9ff);
      const sprite = this.add.image(zoneX, zoneY, "mist-cloud")
        .setTint(color)
        .setAlpha(supernovaLevel > 0 ? 0.42 : 0.36)
        .setDepth(2);
      const zone = {
        sprite: sprite,
        x: zoneX,
        y: zoneY,
        radius: radius,
        tickDamage: tickDamage,
        tickEvery: settings.tickEvery || Math.max(170, 260 - supernovaLevel * 18),
        nextTickAt: this.time.now,
        pulseEvery: supernovaLevel > 0 ? Math.max(360, 900 - supernovaLevel * 120) : 0,
        nextPulseAt: supernovaLevel > 0 ? this.time.now + 260 : Number.MAX_SAFE_INTEGER,
        pulseDamage: supernovaLevel > 0 ? Math.max(1, Math.round((1.4 + supernovaLevel * 0.8) * this.getWeaponAmplifyMultiplier())) : 0,
        pulseRadius: Math.max(44, radius * 0.4),
        color: color,
        expiresAt: this.time.now + (settings.duration || 2400 + this.mistLevel * 280 + this.durationLevel * 720 + supernovaLevel * 260),
      };

      sprite.setScale(zone.radius / 96);
      this.mistZones.push(zone);
    }

    detonateBlastShell(bullet, sourceEnemy) {
      if (!bullet || !bullet.active) {
        return;
      }

      this.triggerWeaponBlast(
        bullet.x,
        bullet.y,
        bullet.impactRadius || 92,
        bullet.impactDamage || 0,
        sourceEnemy,
        {
          color: bullet.impactColor,
          label: bullet.impactLabel,
          heavy: true,
        }
      );

      if (this.getLegendaryLevel("supernova") > 0 && this.mistLevel > 0) {
        this.spawnMistZoneAt(bullet.x, bullet.y, {
          radius: Math.max(58, (bullet.impactRadius || 92) * 0.52),
          tickDamage: Math.max(1, Math.round((bullet.impactDamage || 0) * 0.16)),
          duration: 1700 + this.getLegendaryLevel("supernova") * 260,
          color: 0xe5b8ff,
        });
      }

      bullet.destroy();
    }

    triggerWeaponBlast(x, y, radius, damage, sourceEnemy, options) {
      if (this.roundEnded || radius <= 0 || damage <= 0) {
        return;
      }

      const settings = options || {};
      const blastColor = settings.color || 0xffd48b;
      const baseScale = Math.max(0.3, radius / 150);
      const blast = this.add.image(x, y, "weapon-blast-wave")
        .setTint(blastColor)
        .setAlpha(settings.heavy ? 0.62 : 0.46)
        .setScale(baseScale)
        .setDepth(6);

      this.tweens.add({
        targets: blast,
        alpha: 0,
        scale: baseScale * (settings.heavy ? 1.52 : 1.28),
        duration: settings.heavy ? 230 : 180,
        onComplete: () => blast.destroy(),
      });

      if (settings.label) {
        this.showFloatingText(x, y - Math.max(26, radius * 0.28), settings.label, this.colorToHex(blastColor), "22px");
      }

      if (settings.heavy) {
        this.wordBurst(x, y, blastColor);
        this.cameras.main.shake(80, 0.0024);
      }

      this.enemies.children.iterate((enemy) => {
        if (!enemy || !enemy.active || enemy === sourceEnemy) {
          return;
        }

        const distance = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);

        if (distance > radius) {
          return;
        }

        this.applyDamageToEnemy(enemy, damage);
        enemy.setAlpha(0.8);

        this.time.delayedCall(70, () => {
          if (enemy.active) {
            enemy.setAlpha(1);
          }
        });
      });
    }

    applySiphonOnDefeat(x, y) {
      if (this.siphonLevel <= 0 || this.roundEnded) {
        return;
      }

      const chance = 0.18 + this.siphonLevel * 0.1;

      if (Phaser.Math.FloatBetween(0, 1) > chance) {
        return;
      }

      const heal = Math.min(this.maxHp - this.hp, 1 + Math.floor(this.siphonLevel / 2));

      if (heal > 0) {
        this.hp += heal;
      } else {
        this.score += 8 + this.siphonLevel * 6;
      }

      this.gainAwakeningCharge(2 + this.siphonLevel);
      this.showFloatingText(x, y - 24, "흡수", "#ccffd8", "18px");

      this.pickups.children.iterate((pickup) => {
        if (!pickup || !pickup.active || pickup.isMagnetized || pickup.isRare) {
          return;
        }

        const distance = Phaser.Math.Distance.Between(x, y, pickup.x, pickup.y);

        if (distance <= 90 + this.siphonLevel * 24 && this.magnetizePickup(pickup)) {
          this.isMagnetCollecting = true;
        }
      });
    }

    fireAutoShot() {
      if (this.roundEnded || this.isLevelUp) {
        return;
      }

      const target = this.getNearestEnemyInRange();

      if (!target) {
        return;
      }

      const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, target.x, target.y);
      const count = this.getSplitShotCount();
      const bulletDamage = Math.max(1, Math.round(
        this.getActiveAttackDamage() * this.getWeaponAmplifyMultiplier() * this.getSplitDamageMultiplier()
      ));
      const chainJumps = this.linkLevel > 0 ? 1 + Math.floor(this.linkLevel / 2) : 0;
      const angles = this.buildSpreadAngles(angle, count, 0.16 + this.splitLevel * 0.02);

      angles.forEach((shotAngle) => {
        const bullet = this.spawnPlayerBullet({
          x: this.player.x,
          y: this.player.y - 8,
          texture: "bullet",
          weaponType: "basic",
          angle: shotAngle,
          speed: 560,
          damage: bulletDamage,
          lifespan: 1200,
          scale: 1 + (bulletDamage - 1) * 0.08 + this.amplifyLevel * 0.04,
          bodyCircleRadius: 6,
          bodyCircleOffsetX: 2,
          bodyCircleOffsetY: 2,
          chainJumps: chainJumps,
          homingStrength: this.getTrackingStrength(),
          tintColor: 0xfff0c4,
        });
        bullet.setScale(1 + (bulletDamage - 1) * 0.08 + this.amplifyLevel * 0.04);
      });
    }

    getNearestEnemyInRange() {
      return this.findNearestEnemyFromPoint(this.player.x, this.player.y, this.attackRange);
    }

    getStageBossPatternLimit() {
      return Math.min(8, 4 + this.currentStageIndex);
    }

    buildStageBossPatternLoadout(enemy) {
      const patternsByMotion = {
        despair: ["aimed", "meteor", "spread", "cross", "dash", "sidewall", "summon", "nova"],
        chaos: ["aimed", "nova", "spread", "sidewall", "meteor", "cross", "dash", "summon"],
        fear: ["aimed", "spread", "meteor", "cross", "sidewall", "dash", "nova", "summon"],
        frustration: ["aimed", "dash", "spread", "cross", "meteor", "sidewall", "summon", "nova"],
      };
      const fallback = ["aimed", "spread", "meteor", "dash", "cross", "sidewall", "summon", "nova"];
      const motion = enemy && enemy.motion ? enemy.motion : "";
      const ordered = (patternsByMotion[motion] || fallback).slice();

      return ordered.slice(0, this.getStageBossPatternLimit());
    }

    getStageBossAttackConfig(patternKey) {
      const table = this.vocabData.stageBossAttacks || {};
      return table[patternKey] || table.aimed || { word: "압박", color: 0xffd1c7, projectileKey: "pressure", cooldown: 1800 };
    }

    getBossProjectileEntry(enemy, preferredKey) {
      const entries = this.vocabData.bossProjectileWords || [];

      if (!entries.length) {
        return { key: "pressure", word: "압박", damage: 9, color: 0xffc1b0, texture: "enemy-bullet-pressure", scale: 1 };
      }

      if (preferredKey) {
        const exact = entries.find((entry) => entry.key === preferredKey);

        if (exact) {
          return exact;
        }
      }

      return this.pickRandomBossProjectile(enemy);
    }

    pickRandomBossProjectile(enemy) {
      const entries = this.vocabData.bossProjectileWords || [];

      if (!entries.length) {
        return { word: "압박", damage: 9, color: 0xffc1b0, texture: "enemy-bullet-pressure", scale: 1 };
      }

      const filtered = enemy && enemy.projectileKeys && enemy.projectileKeys.length
        ? entries.filter((entry) => enemy.projectileKeys.includes(entry.key))
        : entries;

      if (!filtered.length) {
        return entries[Phaser.Math.Between(0, entries.length - 1)];
      }

      return filtered[Phaser.Math.Between(0, filtered.length - 1)];
    }

    spawnBossProjectile(x, y, angle, speed, attack, options) {
      const settings = options || {};
      const projectile = this.enemyProjectiles.create(x, y, attack.texture || "enemy-bullet");
      projectile.setDepth(settings.depth || 3);
      projectile.setTint(settings.tintColor || attack.color);
      projectile.sourceKind = settings.sourceKind || "boss";
      projectile.attackWord = settings.attackWord || attack.word;
      projectile.damage = settings.damage || attack.damage;
      projectile.lifespan = settings.lifespan || 3200;
      projectile.rotationSpeed = settings.rotationSpeed != null ? settings.rotationSpeed : (attack.spin || 0);
      projectile.setScale(settings.scale || attack.scale || 1);
      projectile.body.setCircle(settings.bodyRadius || 10, settings.bodyOffsetX || 2, settings.bodyOffsetY || 2);
      projectile.rotation = angle;
      this.physics.velocityFromRotation(angle, speed, projectile.body.velocity);
      return projectile;
    }

    getStageBossAttackDelay(enemy, patternKey) {
      const config = this.getStageBossAttackConfig(patternKey);
      const stageReduction = this.currentStageIndex * 120;
      const bossReduction = Math.max(0, ((enemy && enemy.bossPatternKeys ? enemy.bossPatternKeys.length : 4) - 4) * 35);
      let delay = (config.cooldown || 1900) - stageReduction - bossReduction;

      if (enemy && enemy.enemyKind === "boss" && (enemy.gimmickFrenzyUntil || 0) > this.time.now) {
        delay *= 0.32;
      }

      return Math.max((enemy && enemy.enemyKind === "boss" && (enemy.gimmickFrenzyUntil || 0) > this.time.now) ? 220 : 760, delay);
    }

    tryBossShot(enemy) {
      if (!enemy.active || enemy.enemyKind !== "boss" || this.roundEnded || this.isLevelUp) {
        return;
      }

      const now = this.time.now;

      if ((enemy.nextShotAt || 0) > now) {
        return;
      }

      const patternKeys = enemy.bossPatternKeys && enemy.bossPatternKeys.length
        ? enemy.bossPatternKeys
        : this.buildStageBossPatternLoadout(enemy);
      const patternKey = patternKeys[(enemy.bossPatternIndex || 0) % patternKeys.length] || "aimed";
      enemy.bossPatternIndex = (enemy.bossPatternIndex || 0) + 1;

      this.executeStageBossPattern(enemy, patternKey);
      enemy.nextShotAt = now + this.getStageBossAttackDelay(enemy, patternKey);
    }

    executeStageBossPattern(enemy, patternKey) {
      if (!enemy || !enemy.active) {
        return;
      }

      if (patternKey === "spread") {
        this.castStageBossSpread(enemy);
        return;
      }

      if (patternKey === "nova") {
        this.castStageBossNova(enemy);
        return;
      }

      if (patternKey === "meteor") {
        this.castStageBossMeteor(enemy);
        return;
      }

      if (patternKey === "dash") {
        this.castStageBossDash(enemy);
        return;
      }

      if (patternKey === "cross") {
        this.castStageBossCross(enemy);
        return;
      }

      if (patternKey === "sidewall") {
        this.castStageBossSidewall(enemy);
        return;
      }

      if (patternKey === "summon") {
        this.castStageBossSummon(enemy);
        return;
      }

      this.castStageBossAimed(enemy);
    }

    castStageBossAimed(enemy) {
      const config = this.getStageBossAttackConfig("aimed");
      const attack = this.getBossProjectileEntry(enemy, config.projectileKey);
      const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
      const speed = 270 + this.currentStageIndex * 24;

      this.spawnBossProjectile(enemy.x, enemy.y + 10, angle, speed, attack, {
        damage: attack.damage + Math.floor(this.getStageElapsedSeconds() / 26),
      });
      this.showFloatingText(enemy.x, enemy.y - 64, attack.word, "#ffd1c7", "18px");
      this.flashBossMuzzle(enemy, attack.color);
    }

    castStageBossSpread(enemy) {
      const config = this.getStageBossAttackConfig("spread");
      const attack = this.getBossProjectileEntry(enemy, config.projectileKey);
      const baseAngle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
      const bulletCount = 5 + Math.min(2, Math.floor(this.currentStageIndex / 2));
      const spread = 0.18;

      this.showFloatingText(enemy.x, enemy.y - 72, config.word, this.colorToHex(config.color), "20px");

      for (let index = 0; index < bulletCount; index += 1) {
        const offset = (index - (bulletCount - 1) / 2) * spread;
        this.spawnBossProjectile(enemy.x, enemy.y + 10, baseAngle + offset, 250 + this.currentStageIndex * 18, attack, {
          scale: (attack.scale || 1) * 0.94,
          damage: attack.damage + 1,
        });
      }

      this.flashBossMuzzle(enemy, config.color);
    }

    castStageBossNova(enemy) {
      const config = this.getStageBossAttackConfig("nova");
      const attack = this.getBossProjectileEntry(enemy, config.projectileKey);
      const count = 8 + Math.min(4, this.currentStageIndex);

      this.showFloatingText(enemy.x, enemy.y - 72, config.word, this.colorToHex(config.color), "20px");

      for (let index = 0; index < count; index += 1) {
        const angle = (Math.PI * 2 * index) / count + ((enemy.bossPatternIndex || 0) % 2) * 0.1;
        this.spawnBossProjectile(enemy.x, enemy.y + 10, angle, 220 + this.currentStageIndex * 16, attack, {
          scale: (attack.scale || 1) * 0.92,
          damage: attack.damage,
        });
      }

      this.flashBossMuzzle(enemy, config.color);
    }

    castStageBossMeteor(enemy) {
      const config = this.getStageBossAttackConfig("meteor");
      const targetCount = 3 + Math.min(2, Math.floor(this.currentStageIndex / 2));
      const targets = [];

      for (let index = 0; index < targetCount; index += 1) {
        const nearbyTarget = this.getRandomPointNearPlayer(150, 170);
        targets.push({
          x: index === 0 ? this.player.x : nearbyTarget.x,
          y: index === 0 ? this.player.y : nearbyTarget.y,
        });
      }

      this.showFloatingText(enemy.x, enemy.y - 72, config.word, this.colorToHex(config.color), "20px");

      targets.forEach((target, index) => {
        const telegraph = this.add.image(target.x, target.y, "final-warning-ring")
          .setTint(0xffefab)
          .setAlpha(0.28)
          .setScale(0.34)
          .setDepth(6);

        this.tweens.add({
          targets: telegraph,
          scale: 0.84,
          alpha: 0.68,
          duration: 520,
          delay: index * 80,
          ease: "Sine.easeOut",
        });

        this.time.delayedCall(520 + index * 80, () => {
          if (telegraph.active) {
            this.tweens.killTweensOf(telegraph);
            telegraph.destroy();
          }

          if (this.roundEnded || this.isLevelUp || !enemy.active || enemy.enemyKind !== "boss") {
            return;
          }

          const blast = this.add.image(target.x, target.y, "final-impact-wave")
            .setTint(0xffd67d)
            .setAlpha(0.42)
            .setScale(0.44)
            .setDepth(7);

          this.tweens.add({
            targets: blast,
            scale: 0.92,
            alpha: 0,
            duration: 210,
            onComplete: () => blast.destroy(),
          });

          this.wordBurst(target.x, target.y, 0xffefab);

          if (Phaser.Math.Distance.Between(this.player.x, this.player.y, target.x, target.y) <= 58) {
            this.applyPlayerDamage(enemy.damage + 2, target.x, target.y, `${config.word} 충격`);
          }
        });
      });
    }

    castStageBossDash(enemy) {
      const config = this.getStageBossAttackConfig("dash");
      const attack = this.getBossProjectileEntry(enemy, config.projectileKey);
      const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);

      enemy.dashUntil = this.time.now + 420 + this.currentStageIndex * 40;
      this.physics.velocityFromRotation(angle, 400 + this.currentStageIndex * 30, enemy.body.velocity);
      this.showFloatingText(enemy.x, enemy.y - 72, config.word, this.colorToHex(config.color), "20px");

      this.time.delayedCall(430 + this.currentStageIndex * 40, () => {
        if (!enemy.active || enemy.enemyKind !== "boss" || this.roundEnded || this.isLevelUp) {
          return;
        }

        enemy.dashUntil = 0;

        for (let index = 0; index < 7; index += 1) {
          const shotAngle = angle - 0.56 + index * 0.18;
          this.spawnBossProjectile(enemy.x, enemy.y + 8, shotAngle, 270 + this.currentStageIndex * 18, attack, {
            damage: attack.damage + 1,
          });
        }

        this.flashBossMuzzle(enemy, config.color);
      });
    }

    castStageBossCross(enemy) {
      const config = this.getStageBossAttackConfig("cross");
      const attack = this.getBossProjectileEntry(enemy, config.projectileKey);
      const angles = [0, Math.PI / 2, Math.PI, Math.PI * 1.5, Math.PI / 4, (Math.PI * 3) / 4, (Math.PI * 5) / 4, (Math.PI * 7) / 4];

      this.showFloatingText(enemy.x, enemy.y - 72, config.word, this.colorToHex(config.color), "20px");
      angles.forEach((angle) => {
        this.spawnBossProjectile(enemy.x, enemy.y + 10, angle, 238 + this.currentStageIndex * 16, attack, {
          scale: (attack.scale || 1) * 0.96,
        });
      });

      this.flashBossMuzzle(enemy, config.color);
    }

    castStageBossSidewall(enemy) {
      const config = this.getStageBossAttackConfig("sidewall");
      const attack = this.getBossProjectileEntry(enemy, config.projectileKey);
      const rows = 3 + Math.min(2, Math.floor(this.currentStageIndex / 2));
      const bounds = this.getCombatBounds(32);
      const safeBounds = this.getCombatSafeBounds(80, 250, 140);
      const startY = Phaser.Math.Clamp(this.player.y - 120, safeBounds.top, safeBounds.bottom - (rows - 1) * 70);

      this.showFloatingText(enemy.x, enemy.y - 72, config.word, this.colorToHex(config.color), "20px");

      for (let index = 0; index < rows; index += 1) {
        const y = Phaser.Math.Clamp(startY + index * 70, safeBounds.top, safeBounds.bottom);
        const leftAngle = Phaser.Math.Angle.Between(bounds.left, y, this.player.x, this.player.y);
        const rightAngle = Phaser.Math.Angle.Between(bounds.right, y, this.player.x, this.player.y);

        this.spawnBossProjectile(bounds.left, y, leftAngle, 260 + this.currentStageIndex * 18, attack, {
          scale: (attack.scale || 1) * 0.9,
          damage: attack.damage,
        });
        this.spawnBossProjectile(bounds.right, y, rightAngle, 260 + this.currentStageIndex * 18, attack, {
          scale: (attack.scale || 1) * 0.9,
          damage: attack.damage,
        });
      }

      this.flashBossMuzzle(enemy, config.color);
    }

    castStageBossSummon(enemy) {
      const config = this.getStageBossAttackConfig("summon");
      const attack = this.getBossProjectileEntry(enemy, config.projectileKey);
      const activeNegativeCount = this.countActiveNegativeEnemies();
      const summonCount = activeNegativeCount >= 16 ? 1 : Math.min(3, 2 + Math.floor(this.currentStageIndex / 2));
      const summonBounds = this.getCombatSafeBounds(44, 240, 120);

      this.showFloatingText(enemy.x, enemy.y - 72, config.word, this.colorToHex(config.color), "20px");

      for (let index = 0; index < summonCount; index += 1) {
        this.createNegativeEnemy(
          "swarm",
          Phaser.Math.Clamp(enemy.x + Phaser.Math.Between(-76, 76), summonBounds.left, summonBounds.right),
          Phaser.Math.Clamp(enemy.y + Phaser.Math.Between(34, 92), summonBounds.top, summonBounds.bottom),
          {
            forceRoleKey: index % 2 === 0 ? "rush" : "chaser",
            isSummoned: true,
            hpMultiplier: 0.78 + this.currentStageIndex * 0.04,
            speedMultiplier: 1.08 + this.currentStageIndex * 0.04,
            damageMultiplier: 0.84 + this.currentStageIndex * 0.04,
            scoreMultiplier: 0.86,
          }
        );
      }

      const baseAngle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
      for (let index = -1; index <= 1; index += 1) {
        this.spawnBossProjectile(enemy.x, enemy.y + 8, baseAngle + index * 0.18, 250 + this.currentStageIndex * 14, attack, {
          scale: (attack.scale || 1) * 0.92,
          damage: attack.damage,
        });
      }

      this.flashBossMuzzle(enemy, config.color);
    }

    flashBossMuzzle(enemy, color) {
      const flare = this.add.circle(enemy.x, enemy.y + 8, 18, color, 0.26).setDepth(5);
      this.tweens.add({
        targets: flare,
        scale: 1.5,
        alpha: 0,
        duration: 180,
        onComplete: () => flare.destroy(),
      });
    }

    getEnemyContactDamage(enemy) {
      let damage = enemy && enemy.damage ? enemy.damage : 10;

      if (enemy && (enemy.auraBoostUntil || 0) > this.time.now) {
        damage = Math.round(damage * (enemy.auraDamageMultiplier || 1.16));
      }

      return damage;
    }

    countActiveNegativeEnemies() {
      let count = 0;

      this.enemies.children.iterate((enemy) => {
        if (enemy && enemy.active && enemy.enemyKind === "negative") {
          count += 1;
        }
      });

      return count;
    }

    tryEnemyRoleAction(enemy) {
      if (!enemy || !enemy.active || enemy.enemyKind !== "negative" || this.roundEnded || this.isLevelUp) {
        return;
      }

      const role = (this.vocabData.negativeRoles || {})[enemy.roleKey];

      if (!role || enemy.roleKey === "chaser" || (enemy.roleNextActionAt || 0) > this.time.now) {
        return;
      }

      if (enemy.roleKey === "rush") {
        enemy.roleDashUntil = this.time.now + (role.dashDuration || 560);
        enemy.roleNextActionAt = this.time.now + Phaser.Math.Between(role.cooldownMin || 1700, role.cooldownMax || 2600);
        this.showFloatingText(enemy.x, enemy.y - 34, role.word || "돌진", this.colorToHex(role.color), "18px");
        return;
      }

      if (enemy.roleKey === "shooter") {
        this.fireRoleProjectile(enemy, role);
        enemy.roleNextActionAt = this.time.now + Phaser.Math.Between(role.cooldownMin || 1850, role.cooldownMax || 2700);
        return;
      }

      if (enemy.roleKey === "aura") {
        this.activateAuraPulse(enemy, role);
        enemy.roleNextActionAt = this.time.now + Phaser.Math.Between(role.cooldownMin || 2200, role.cooldownMax || 3400);
        return;
      }

      if (enemy.roleKey === "summoner") {
        this.spawnRoleSummons(enemy, role);
        enemy.roleNextActionAt = this.time.now + Phaser.Math.Between(role.cooldownMin || 3600, role.cooldownMax || 4800);
      }
    }

    fireRoleProjectile(enemy, role) {
      const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);

      if (distance > (role.range || 620)) {
        enemy.roleNextActionAt = this.time.now + 320;
        return;
      }

      const attack = this.pickRandomBossProjectile(enemy);
      const projectile = this.enemyProjectiles.create(enemy.x, enemy.y + 8, attack.texture || "enemy-bullet");
      projectile.setDepth(3);
      projectile.setTint(attack.color);
      projectile.sourceKind = "negative";
      projectile.attackWord = attack.word;
      projectile.damage = Math.max(5, Math.round(this.getEnemyContactDamage(enemy) * (role.damageMultiplier || 0.72)));
      projectile.lifespan = 2600;
      projectile.rotationSpeed = attack.spin || 0;
      projectile.setScale((attack.scale || 1) * 0.88);
      projectile.body.setCircle(9, 2, 2);

      const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
      const speed = (role.projectileSpeed || 246) + this.currentStageIndex * 20;
      this.physics.velocityFromRotation(angle, speed, projectile.body.velocity);
      projectile.rotation = angle;

      this.showFloatingText(enemy.x, enemy.y - 54, attack.word, "#ffd7cb", "16px");
    }

    activateAuraPulse(enemy, role) {
      if (enemy.roleAura) {
        enemy.roleAura.setPosition(enemy.x, enemy.y);
        enemy.roleAura.setScale(0.7);
        enemy.roleAura.setAlpha(0.28);
        enemy.roleAura.setVisible(true);
        this.tweens.killTweensOf(enemy.roleAura);
        this.tweens.add({
          targets: enemy.roleAura,
          scale: 1.08,
          alpha: 0,
          duration: role.duration || 1300,
          onComplete: () => {
            if (enemy.roleAura && enemy.roleAura.active) {
              enemy.roleAura.setVisible(false);
            }
          },
        });
      }

      this.showFloatingText(enemy.x, enemy.y - 42, role.word || "고함", this.colorToHex(role.color), "18px");

      this.enemies.children.iterate((ally) => {
        if (!ally || !ally.active || ally.enemyKind === "finalBoss") {
          return;
        }

        const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, ally.x, ally.y);

        if (distance > (role.auraRadius || 170)) {
          return;
        }

        ally.auraBoostUntil = this.time.now + (role.duration || 1300);
        ally.auraSpeedMultiplier = 1 + (role.speedBoost || 0.24);
        ally.auraDamageMultiplier = 1.16;
      });
    }

    spawnRoleSummons(enemy, role) {
      let activeNegativeCount = 0;

      this.enemies.children.iterate((candidate) => {
        if (candidate && candidate.active && candidate.enemyKind === "negative") {
          activeNegativeCount += 1;
        }
      });

      if (activeNegativeCount >= 42) {
        enemy.roleNextActionAt = this.time.now + 700;
        return;
      }

      this.showFloatingText(enemy.x, enemy.y - 42, role.word || "증식", this.colorToHex(role.color), "18px");

      for (let index = 0; index < (role.summonCount || 2); index += 1) {
        this.createNegativeEnemy(
          role.summonArchetype || "swarm",
          Phaser.Math.Clamp(enemy.x + Phaser.Math.Between(-52, 52), 36, 684),
          Phaser.Math.Clamp(enemy.y + Phaser.Math.Between(-46, 46), 220, 1220),
          {
            forceRoleKey: "chaser",
            isSummoned: true,
            hpMultiplier: 0.82,
            speedMultiplier: 1.04,
            damageMultiplier: 0.82,
            scoreMultiplier: 0.84,
          }
        );
      }
    }

    pushEnemy(enemy, speed, duration) {
      if (!enemy || !enemy.active) {
        return;
      }

      const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      enemy.pushUntil = this.time.now + duration;
      this.physics.velocityFromRotation(angle, speed, enemy.body.velocity);
    }

    showFloatingText(x, y, message, color, fontSize) {
      const text = this.add.text(x, y, message, {
        fontFamily: this.font,
        fontSize: fontSize || "26px",
        fontStyle: "900",
        color: color,
      }).setOrigin(0.5).setDepth(25);
      text.setStroke("#1a0f0c", 6);

      this.tweens.add({
        targets: text,
        y: y - 34,
        alpha: 0,
        scale: 1.06,
        duration: 560,
        ease: "Cubic.out",
        onComplete: () => text.destroy(),
      });
    }

    playLegendaryRewardPulse(colorValue, stack) {
      const pulse = this.add.image(this.player.x, this.player.y, "weapon-blast-wave")
        .setTint(colorValue || 0xffffff)
        .setAlpha(0.56)
        .setScale(0.42)
        .setDepth(8);

      this.tweens.add({
        targets: pulse,
        alpha: 0,
        scale: 1.4 + stack * 0.22,
        duration: 380,
        ease: "Cubic.out",
        onComplete: () => pulse.destroy(),
      });
      this.wordBurst(this.player.x, this.player.y, colorValue || 0xffffff);
    }

    updateLegendaryVisuals() {
      const time = this.time.now;
      const giantLevel = this.getLegendaryLevel("giant");
      const tempestLevel = this.getLegendaryLevel("tempest");
      const cometLevel = this.getLegendaryLevel("comet");
      const harvestLevel = this.getLegendaryLevel("harvest");
      const supernovaLevel = this.getLegendaryLevel("supernova");

      this.giantHalo.setVisible(giantLevel > 0);

      if (giantLevel > 0) {
        this.giantHalo.setPosition(this.player.x, this.player.y);
        this.giantHalo.setScale(1.08 + giantLevel * 0.22 + Math.abs(Math.sin(time * 0.006)) * 0.09);
        this.giantHalo.setAlpha(0.24 + giantLevel * 0.05);
      }

      this.tempestRing.setPosition(this.player.x, this.player.y);
      this.tempestRing.setScale(0.92 + tempestLevel * 0.22 + Math.abs(Math.sin(time * 0.01)) * 0.12);
      this.tempestRing.setAlpha(tempestLevel > 0 ? 0.22 + tempestLevel * 0.06 : 0);

      this.harvestRing.setPosition(this.player.x, this.player.y);
      this.harvestRing.setScale(0.84 + harvestLevel * 0.18 + Math.abs(Math.sin(time * 0.012)) * 0.08);
      this.harvestRing.setAlpha(harvestLevel > 0 ? 0.2 + harvestLevel * 0.05 : 0);

      this.supernovaRing.setPosition(this.player.x, this.player.y);
      this.supernovaRing.setScale(0.94 + supernovaLevel * 0.22 + Math.abs(Math.sin(time * 0.016)) * 0.12);
      this.supernovaRing.setAlpha(supernovaLevel > 0 ? 0.24 + supernovaLevel * 0.06 : 0);

      this.cometOrbitals.forEach((orb, index) => {
        if (cometLevel <= 0) {
          orb.setAlpha(0);
          return;
        }

        const angle = time * 0.0048 + index * (Math.PI * 2 / this.cometOrbitals.length);
        const radius = 40 + cometLevel * 14;
        orb.setPosition(
          this.player.x + Math.cos(angle) * radius,
          this.player.y + Math.sin(angle) * radius
        );
        orb.setScale(0.78 + cometLevel * 0.1);
        orb.setAlpha(0.58 + Math.abs(Math.sin(time * 0.012 + index)) * 0.28);
      });

      this.harvestOrbitals.forEach((orb, index) => {
        if (harvestLevel <= 0) {
          orb.setAlpha(0);
          return;
        }

        const angle = -time * 0.0036 + index * (Math.PI * 2 / this.harvestOrbitals.length);
        const radius = 46 + harvestLevel * 14;
        orb.setPosition(
          this.player.x + Math.cos(angle) * radius,
          this.player.y + Math.sin(angle) * radius
        );
        orb.rotation -= 0.02;
        orb.setScale(0.94 + harvestLevel * 0.07);
        orb.setAlpha(0.62 + Math.abs(Math.sin(time * 0.01 + index)) * 0.26);
      });
    }

    applyHarvestPickupAura() {
      return;
    }

    announceAwakening() {
      this.awakeningBanner.setText("각성 폭주");
      this.awakeningBanner.setAlpha(0);
      this.awakeningBanner.setScale(0.82);
      this.awakeningBanner.setY(214);
      this.tweens.killTweensOf(this.awakeningBanner);
      this.tweens.add({
        targets: this.awakeningBanner,
        alpha: 1,
        scale: 1,
        y: 228,
        duration: 180,
        ease: "Back.out",
        yoyo: true,
        hold: 380,
      });
    }

    isBossEnemy(enemy) {
      return !!enemy && (enemy.enemyKind === "boss" || enemy.enemyKind === "finalBoss");
    }

    addPickupStat(word, itemType, amount) {
      if (!this.pickupStats[word]) {
        this.pickupStats[word] = {
          word: word,
          itemType: itemType,
          count: 0,
          totalAmount: 0,
        };
      }

      this.pickupStats[word].count += 1;
      this.pickupStats[word].totalAmount += amount || 0;
    }

    recordDamageDealt(enemy, amount) {
      if (!enemy || !enemy.active) {
        return 0;
      }

      const applied = Math.max(0, Math.min(amount, enemy.hp));
      this.damageDealt += applied;
      return applied;
    }

    applyDamageToEnemy(enemy, amount) {
      if (!enemy || !enemy.active || amount <= 0) {
        return { applied: false, defeated: false };
      }

      if ((enemy.enemyKind === "boss" || enemy.enemyKind === "finalBoss") && (enemy.gimmickInvulnerableUntil || 0) > this.time.now) {
        if ((enemy.lastInvulnerableNoticeAt || 0) + 180 <= this.time.now) {
          enemy.lastInvulnerableNoticeAt = this.time.now;
          this.showFloatingText(enemy.x, enemy.y - 58, "무적", "#fff0a6", "18px");
        }

        return { applied: false, defeated: false };
      }

      this.recordDamageDealt(enemy, amount);
      enemy.hp -= amount;

      if (enemy.enemyKind === "boss") {
        this.triggerStageBossGimmick(enemy);
      } else if (enemy.enemyKind === "finalBoss") {
        this.triggerFinalBossGimmick(enemy);
      }

      if (enemy.hp <= 0) {
        this.defeatEnemy(enemy);
        return { applied: true, defeated: true };
      }

      return { applied: true, defeated: false };
    }

    calculateRecordScore(cleared) {
      const clearBonus = cleared ? 4200 : 0;
      const finalBossBonus = this.finalBossDefeated ? 2400 : 0;
      const survivalBonus = Math.round(this.elapsedSeconds * 8);
      const stageBonus = this.stagesCleared * 900 + this.getReachedStageNumber() * 180;

      return Math.max(0, Math.round(
        clearBonus +
        finalBossBonus +
        stageBonus +
        this.score +
        this.damageDealt * 3.2 +
        this.pickupCount * 42 +
        this.awakeningCount * 120 +
        this.bossDefeats * 180 +
        this.hp * 18 +
        survivalBonus -
        this.damageTaken * 2.4
      ));
    }

    buildPickupSummary() {
      return Object.values(this.pickupStats)
        .sort((a, b) => {
          if (b.count !== a.count) {
            return b.count - a.count;
          }

          return a.word.localeCompare(b.word);
        })
        .slice(0, 8)
        .map((entry) => ({
          word: entry.word,
          itemType: entry.itemType,
          count: entry.count,
          totalAmount: entry.totalAmount,
        }));
    }

    createRunSummary(cleared, defeatedBy) {
      const stageReached = this.getReachedStageNumber();
      const stageThemeTrail = this.getStagePool()
        .slice(0, stageReached)
        .map((stage) => stage.label);

      return {
        cleared: cleared,
        isTestMode: !!this.isBossRushTestMode,
        title: cleared ? "클리어" : "실패",
        recordScore: this.calculateRecordScore(cleared),
        runScore: this.score,
        survivedSeconds: Math.round(this.elapsedSeconds),
        level: this.level,
        bossDefeats: this.bossDefeats,
        negativeClears: this.negativeClears,
        pickupCount: this.pickupCount,
        awakeningCount: this.awakeningCount,
        damageDealt: Math.round(this.damageDealt),
        damageTaken: Math.round(this.damageTaken),
        remainingHp: Math.round(this.hp),
        defeatedBy: defeatedBy || "",
        finalBossDefeated: this.finalBossDefeated,
        reachedFinalBoss: this.finalBossPhase || this.finalBossDefeated,
        finalBossWord: this.vocabData.finalBoss ? this.vocabData.finalBoss.word : "파멸",
        stageReached: stageReached,
        stagesCleared: this.stagesCleared,
        totalStages: this.stageCount,
        currentStageLabel: this.finalBossPhase ? "최종 보스" : this.getCurrentStageTitle(),
        stageThemeTrail: stageThemeTrail,
        pickupSummary: this.buildPickupSummary(),
        clearedAt: new Date().toISOString(),
        startedAt: this.runStartedAt,
      };
    }

    applyPlayerDamage(damage, sourceX, sourceY, message) {
      this.playerInvulnerableUntil = this.time.now + 780;
      this.hp = Math.max(0, this.hp - damage);
      this.damageTaken += damage;
      this.showFeedback(`${message} -${damage}`, "#ffc2ba");
      this.showFloatingText(this.player.x, this.player.y - 54, `-${damage}`, "#ffb3ac", "30px");
      this.wordBurst(sourceX, sourceY, 0xffb5ab);
      this.player.setTint(0xff9d96);
      this.cameras.main.shake(120, 0.004);
      this.cameras.main.flash(90, 255, 120, 108, false);

      this.time.delayedCall(150, () => {
        if (this.player.active) {
          this.player.clearTint();
        }
      });

      this.checkBossAidSummons(this.hp / Math.max(1, this.maxHp));
      this.refreshHud();

      if (this.hp <= 0) {
        this.finishRound({ cleared: false, defeatedBy: message });
      }
    }

    handleBulletHit(bullet, enemy) {
      if (!bullet.active || !enemy.active) {
        return;
      }

      if (bullet.hitTargets && bullet.hitTargets.has(enemy.enemyId)) {
        return;
      }

      if (bullet.hitTargets) {
        bullet.hitTargets.add(enemy.enemyId);
      }

      this.applyDamageToEnemy(enemy, bullet.damage || 1);
      enemy.setAlpha(0.84);

      this.time.delayedCall(70, () => {
        if (enemy.active) {
          enemy.setAlpha(1);
        }
      });

      if ((bullet.chainJumps || 0) > 0) {
        this.triggerImpactChain(
          enemy,
          Math.max(1, Math.round((bullet.damage || 1) * 0.6)),
          bullet.chainJumps,
          bullet.hitTargets
        );
        bullet.chainJumps = 0;
      }

      if ((bullet.hitBlastDamage || 0) > 0 && (bullet.hitBlastRadius || 0) > 0) {
        this.triggerWeaponBlast(enemy.x, enemy.y, bullet.hitBlastRadius, bullet.hitBlastDamage, enemy, {
          color: bullet.hitBlastColor,
          label: bullet.hitBlastLabel,
          heavy: false,
        });
      }

      if ((bullet.impactDamage || 0) > 0) {
        this.detonateBlastShell(bullet, enemy);

        return;
      }

      if ((bullet.remainingPierce || 0) > 0) {
        bullet.remainingPierce -= 1;
      } else {
        bullet.destroy();
      }
    }

    handleEnemyProjectileHit(_, projectile) {
      if (!projectile.active || this.roundEnded || this.isLevelUp) {
        return;
      }

      const now = this.time.now;

      if (this.isTransformActive()) {
        this.showFloatingText(projectile.x, projectile.y - 24, projectile.attackWord || "파괴", "#ffe2ff", "18px");
        this.wordBurst(projectile.x, projectile.y, 0xffc2f2);
        projectile.destroy();
        return;
      }

      if (now < this.shieldUntil) {
        this.playerInvulnerableUntil = now + 220;
        this.showFeedback("보호막!", "#bde7ff");
        this.showFloatingText(this.player.x, this.player.y - 50, "막음", "#cfeeff", "20px");
        this.wordBurst(projectile.x, projectile.y, 0xbde7ff);
        projectile.destroy();
        return;
      }

      if (now < this.playerInvulnerableUntil) {
        projectile.destroy();
        return;
      }

      this.applyPlayerDamage(
        projectile.damage || 10,
        projectile.x,
        projectile.y,
        `${projectile.attackWord || "탄막"} 피격`
      );
      projectile.destroy();
    }

    handleFireOrbHit(orb, enemy) {
      if (!orb.active || !enemy.active || this.roundEnded || this.isLevelUp) {
        return;
      }

      const now = this.time.now;
      const forgeLevel = this.getLegendaryLevel("giant");

      if ((enemy.lastFireHitAt || 0) + 240 > now) {
        return;
      }

      enemy.lastFireHitAt = now;
      const fireDamage = Math.max(1, Math.round(
        (1.4 + this.fireLevel * 0.85 + forgeLevel * 0.9 + (this.isAwakeningActive() ? 1 : 0)) * this.getWeaponAmplifyMultiplier()
      ));
      this.applyDamageToEnemy(enemy, fireDamage);
      if (forgeLevel > 0 && ((enemy.lastForgeBurstAt || 0) + 340 <= now)) {
        enemy.lastForgeBurstAt = now;
        this.triggerWeaponBlast(enemy.x, enemy.y, 30 + forgeLevel * 10, Math.max(1, Math.round(fireDamage * 0.45)), enemy, {
          color: 0xffb368,
          label: forgeLevel >= 2 ? "용광" : "",
          heavy: forgeLevel >= 3,
        });
      }
      enemy.setAlpha(0.82);

      this.time.delayedCall(80, () => {
        if (enemy.active) {
          enemy.setAlpha(1);
        }
      });
    }

    handleShieldHit(orb, enemy) {
      if (!orb.active || !enemy.active || this.roundEnded || this.isLevelUp || this.shieldWeaponLevel <= 0) {
        return;
      }

      const now = this.time.now;
      const forgeLevel = this.getLegendaryLevel("giant");

      if ((enemy.lastShieldHitAt || 0) + 280 > now) {
        return;
      }

      enemy.lastShieldHitAt = now;
      const shieldDamage = Math.max(1, Math.round(
        (1.2 + this.shieldWeaponLevel * 0.95 + forgeLevel * 0.8 + (this.isAwakeningActive() ? 1 : 0)) * this.getWeaponAmplifyMultiplier()
      ));
      this.applyDamageToEnemy(enemy, shieldDamage);
      if (forgeLevel > 0 && ((enemy.lastShieldBurstAt || 0) + 380 <= now)) {
        enemy.lastShieldBurstAt = now;
        this.triggerWeaponBlast(enemy.x, enemy.y, 34 + forgeLevel * 12, Math.max(1, Math.round(shieldDamage * 0.42)), enemy, {
          color: 0xffc08a,
          label: forgeLevel >= 2 ? "용광" : "",
          heavy: forgeLevel >= 3,
        });
      }
      enemy.setAlpha(0.78);
      this.pushEnemy(enemy, this.isBossEnemy(enemy) ? 210 : 280, 190 + this.shieldWeaponLevel * 28 + forgeLevel * 14);

      this.time.delayedCall(90, () => {
        if (enemy.active) {
          enemy.setAlpha(1);
        }
      });
    }

    handleShieldProjectileHit(_, projectile) {
      if (!projectile.active || this.roundEnded || this.isLevelUp || this.shieldWeaponLevel < 2) {
        return;
      }

      const forgeLevel = this.getLegendaryLevel("giant");
      this.showFloatingText(projectile.x, projectile.y - 18, "방패", "#d9ecff", "16px");
      this.wordBurst(projectile.x, projectile.y, 0xb9deff);
      if (forgeLevel > 0) {
        this.triggerWeaponBlast(projectile.x, projectile.y, 34 + forgeLevel * 10, Math.max(1, 2 + forgeLevel), null, {
          color: 0xffc595,
          label: forgeLevel >= 2 ? "용광" : "",
          heavy: false,
        });
      }
      projectile.destroy();
    }

    defeatEnemy(enemy, options) {
      const settings = options || {};
      const isClone = enemy.enemyKind === "bossClone";
      const isMiniBoss = enemy.enemyKind === "boss";
      const isFinalBoss = enemy.enemyKind === "finalBoss";
      const isBoss = isMiniBoss || isFinalBoss;

      if (isFinalBoss) {
        this.finalBossDefeated = true;
        this.stagesCleared = Math.max(this.stagesCleared, this.stageCount);
        this.score += enemy.scoreValue || 0;
        this.showFeedback(`${enemy.word} 격파`, "#ffd3af");
        this.wordBurst(enemy.x, enemy.y, 0xffd7b6);
        this.destroyEnemy(enemy);
        this.finalBoss = null;

        if (this.finalBossAttackTimer) {
          this.finalBossAttackTimer.remove(false);
          this.finalBossAttackTimer = null;
        }

        this.finishRound({ cleared: true });
        return;
      }

      if (isClone) {
        this.wordBurst(enemy.x, enemy.y, 0xd3d7ff);
        this.destroyEnemy(enemy);

        if (!settings.deferHud) {
          this.refreshHud();
        }

        return;
      }

      this.negativeClears += isBoss ? 3 : 1;
      this.score += enemy.scoreValue;
      this.experience += isBoss ? 32 : 8;
      this.gainAwakeningCharge(isBoss ? 48 : 14);

      if (isMiniBoss) {
        this.bossDefeats += 1;
        if (!settings.skipBossFeedback) {
          this.showFeedback(`${enemy.word} 돌파`, "#ffcf9f");
        }
      } else {
        this.spawnPickup(enemy.x, enemy.y, !!settings.forceDrop);
      }

      this.applySiphonOnDefeat(enemy.x, enemy.y);
      this.wordBurst(enemy.x, enemy.y, isBoss ? 0xffd0ab : 0xffb08c);
      this.destroyEnemy(enemy);

      if (!settings.deferHud) {
        this.refreshHud();
      }

      if (isMiniBoss) {
        if (enemy.isBossRushMember) {
          this.finalBossRushBossesRemaining = Math.max(0, this.finalBossRushBossesRemaining - 1);

          if (this.finalBossRushBossesRemaining <= 0) {
            this.beginFinalBossArrivalSequence();
          }

          return;
        }

        this.currentStageBoss = null;
        this.stageBossSequenceStarted = false;
        this.stageBossSpawned = false;
        this.pendingStageBoss = false;
        this.stagesCleared = Math.max(this.stagesCleared, this.currentStageIndex + 1);

        if (this.currentStageIndex + 1 < this.stageCount) {
          this.openStageTransition(this.currentStageIndex + 1, enemy.word);
        } else {
          this.openStageTransition(null, enemy.word);
        }

        return;
      }

      if (!settings.deferLevelCheck) {
        this.checkLevelUp();
      }
    }

    spawnPickupFromDefinition(x, y, definition) {
      if (!definition) {
        return null;
      }

      const pickup = this.pickups.create(x, y, "pickup-pill");
      pickup.isRare = !!definition.rare;
      pickup.setDisplaySize(pickup.isRare ? 126 : 114, pickup.isRare ? 52 : 46);
      pickup.setTint(definition.color);
      pickup.setDepth(2);
      pickup.itemType = definition.type;
      pickup.word = definition.word;
      pickup.amount = definition.amount;
      pickup.body.setSize(pickup.isRare ? 96 : 88, pickup.isRare ? 34 : 30);

      if (pickup.isRare) {
        pickup.glow = this.add.circle(x, y, 40, definition.color, 0.14)
          .setStrokeStyle(2, 0xfff0b0, 0.5)
          .setDepth(1);
      }

      pickup.label = this.add.text(x, y + 1, definition.word, {
        fontFamily: this.font,
        fontSize: pickup.isRare ? "22px" : "20px",
        fontStyle: "900",
        color: "#fffdf4",
        align: "center",
        backgroundColor: pickup.isRare ? "rgba(32, 20, 6, 0.88)" : "rgba(8, 18, 14, 0.82)",
      }).setOrigin(0.5).setDepth(4);
      pickup.label.setPadding(pickup.isRare ? 30 : 28, 3, 10, 3);
      pickup.label.setStroke(pickup.isRare ? "#6b5316" : "#163326", 5);
      pickup.label.setShadow(0, 2, pickup.isRare ? "#2a1704" : "#04100b", 6, true, true);
      pickup.icon = this.add.image(x, y + 1, this.getPickupIconKey(definition.type))
        .setScale(pickup.isRare ? 0.92 : 0.82)
        .setDepth(5);
      this.positionPickupBadge(pickup);
      return pickup;
    }

    spawnPickup(x, y, forceDrop) {
      const dropChance = 0.5 + this.pickupLuck;

      if (!forceDrop && Phaser.Math.FloatBetween(0, 1) > dropChance) {
        return null;
      }

      const definition = this.pickRandomPickup();
      return this.spawnPickupFromDefinition(x, y, definition);
    }

    pickRandomPickup() {
      const entries = this.vocabData.pickupWords;
      let total = 0;

      entries.forEach((entry) => {
        total += this.getPickupWeight(entry);
      });

      let roll = Phaser.Math.FloatBetween(0, total);

      for (let index = 0; index < entries.length; index += 1) {
        const entry = entries[index];
        roll -= this.getPickupWeight(entry);

        if (roll <= 0) {
          return entry;
        }
      }

      return entries[0];
    }

    getPickupWeight(entry) {
      let weight = entry.weight + (entry.type !== "xp" ? this.pickupLuck * (entry.luckWeight || 60) : 0);

      if (entry.type === "heal") {
        const hpRatio = Phaser.Math.Clamp(this.hp / Math.max(1, this.maxHp), 0, 1);

        if (hpRatio >= 0.7) {
          return 0;
        }

        if (hpRatio > 0.2) {
          const healRatio = 1 - ((hpRatio - 0.2) / 0.5);
          weight *= Phaser.Math.Clamp(healRatio, 0, 1);
        }
      }

      return weight;
    }

    getPickupIconKey(itemType) {
      const iconMap = {
        xp: "pickup-icon-xp",
        score: "pickup-icon-score",
        heal: "pickup-icon-heal",
        shield: "pickup-icon-shield",
        speed: "pickup-icon-speed",
        magnet: "pickup-icon-magnet",
        transform: "pickup-icon-transform",
        cleanup: "pickup-icon-cleanup",
        beam: "pickup-icon-beam",
      };

      return iconMap[itemType] || "pickup-icon-xp";
    }

    positionPickupBadge(pickup) {
      if (!pickup || !pickup.label) {
        return;
      }

      pickup.label.setPosition(pickup.x, pickup.y + 1);

      if (pickup.icon) {
        pickup.icon.setPosition(
          pickup.x - (pickup.label.width / 2) + 16,
          pickup.y + 1,
        );
      }

      if (pickup.glow) {
        pickup.glow.setPosition(pickup.x, pickup.y);
      }
    }

    handlePickup(_, pickup) {
      if (!pickup.active || this.roundEnded || pickup.isMagnetized) {
        return;
      }

      this.consumePickup(pickup);
    }

    consumePickup(pickup, options) {
      if (!pickup || !pickup.active || this.roundEnded) {
        return;
      }

      const settings = options || {};
      const amount = pickup.amount;
      const pickupWord = pickup.word;
      const itemType = pickup.itemType;
      const pickupX = pickup.x;
      const pickupY = pickup.y;
      const isRare = !!pickup.isRare;

      this.pickupCount += 1;
      this.addPickupStat(pickupWord, itemType, amount);

      if (!settings.silent) {
        this.showFeedback(`${pickupWord} 획득`, isRare ? "#ffe7a6" : "#b9ffd8");
        this.wordBurst(pickupX, pickupY, isRare ? 0xffe4a0 : 0xb9ffd8);
      }

      this.destroyPickup(pickup);

      if (itemType === "xp") {
        this.experience += amount;
        this.gainAwakeningCharge(4);
      } else if (itemType === "score") {
        this.score += amount;
      } else if (itemType === "heal") {
        this.hp = Math.min(this.maxHp, this.hp + amount + this.healBonus);
      } else if (itemType === "shield") {
        this.shieldUntil = Math.max(this.shieldUntil, this.time.now) + amount * 1000;
      } else if (itemType === "speed") {
        this.speedBoostUntil = Math.max(this.speedBoostUntil, this.time.now) + amount * 1000;
      } else if (itemType === "magnet") {
        this.activateMagnet({ sourceX: pickupX, sourceY: pickupY, sourceWord: pickupWord });
      } else if (itemType === "transform") {
        this.activateTransform(amount, pickupWord);
      } else if (itemType === "cleanup") {
        this.activateCleanup(pickupWord);
      } else if (itemType === "beam") {
        this.activateBeam(pickupWord, amount);
      }

      if (!settings.deferHud) {
        this.refreshHud();
      }

      if (!settings.deferLevelCheck) {
        this.checkLevelUp();
      }
    }

    activateMagnet(options) {
      if (this.roundEnded) {
        return;
      }

      const settings = options || {};
      const wasCollecting = this.isMagnetCollecting;
      let magnetizedCount = 0;

      this.isMagnetCollecting = true;

      if (!wasCollecting || !settings.quiet) {
        this.showFeedback(`${settings.sourceWord || "자석"} 발동!`, "#c6f4ff");
        this.showFloatingText(this.player.x, this.player.y - 84, settings.sourceWord || "자석", "#dcfbff", "24px");
        this.wordBurst(settings.sourceX || this.player.x, settings.sourceY || this.player.y, 0x9de6ff);
      }

      this.pickups.children.iterate((pickup) => {
        if (this.magnetizePickup(pickup)) {
          magnetizedCount += 1;
        }
      });

      if (!magnetizedCount && !wasCollecting) {
        this.finishMagnetCollection();
      }
    }

    magnetizePickup(pickup) {
      if (!pickup || !pickup.active || pickup.isMagnetized || pickup.isRare) {
        return false;
      }

      pickup.isMagnetized = true;
      pickup.magnetizedAt = this.time.now;
      pickup.magnetSpin = Phaser.Math.FloatBetween(-0.012, 0.012);

      if (pickup.body) {
        pickup.body.enable = false;
        pickup.body.setVelocity(0, 0);
      }

      if (pickup.glow) {
        pickup.glow.setAlpha(0.26);
      }

      return true;
    }

    finishMagnetCollection() {
      if (!this.isMagnetCollecting) {
        return;
      }

      this.isMagnetCollecting = false;
      this.magnetLinks.clear();
      this.refreshHud();
      this.checkLevelUp();
    }

    updateMagnetPulls(delta) {
      let magnetizedCount = 0;
      const linkedPickups = [];

      this.pickups.children.iterate((pickup) => {
        if (!pickup || !pickup.active || !pickup.isMagnetized) {
          return;
        }

        magnetizedCount += 1;
        const dx = this.player.x - pickup.x;
        const dy = this.player.y - pickup.y;
        const distance = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        const speed = Math.min(1080, 300 + distance * 3.6);
        const step = Math.min(1, (speed * delta / 1000) / distance);
        pickup.setPosition(pickup.x + dx * step, pickup.y + dy * step);
        pickup.rotation += (pickup.magnetSpin || 0.004) * delta;

        if (pickup.icon) {
          pickup.icon.rotation -= (pickup.magnetSpin || 0.004) * delta * 1.4;
          pickup.icon.setScale((pickup.isRare ? 0.92 : 0.82) + Math.abs(Math.sin(this.time.now * 0.02)) * 0.08);
        }

        if (pickup.label) {
          pickup.label.setScale(1 + Math.abs(Math.sin((this.time.now + pickup.x) * 0.018)) * 0.06);
        }

        if (pickup.glow) {
          pickup.glow.setScale(1 + Math.abs(Math.sin(this.time.now * 0.016)) * 0.24);
          pickup.glow.setAlpha(0.18 + Math.abs(Math.sin(this.time.now * 0.014)) * 0.14);
        }

        if (linkedPickups.length < 8) {
          linkedPickups.push({ x: pickup.x, y: pickup.y });
        }

        if (distance <= 34) {
          this.consumePickup(pickup, { silent: true, deferHud: true, deferLevelCheck: true });
        }
      });

      this.magnetLinks.clear();

      if (magnetizedCount > 0) {
        const pulse = 1 + Math.abs(Math.sin(this.time.now * 0.016)) * 0.18;
        this.magnetField.setVisible(true);
        this.magnetField.setPosition(this.player.x, this.player.y);
        this.magnetField.setScale(pulse);
        this.magnetField.setAlpha(0.32 + Math.abs(Math.sin(this.time.now * 0.018)) * 0.16);

        this.magnetLinks.lineStyle(2, 0xbfefff, 0.24);
        linkedPickups.forEach((point) => {
          this.magnetLinks.beginPath();
          this.magnetLinks.moveTo(this.player.x, this.player.y);
          this.magnetLinks.lineTo(point.x, point.y);
          this.magnetLinks.strokePath();
        });
      } else {
        this.magnetField.setVisible(false);
        this.finishMagnetCollection();
      }
    }

    activateTransform(durationSeconds, sourceWord) {
      const duration = Math.max(5, durationSeconds || 8) * 1000;
      this.transformUntil = Math.max(this.transformUntil, this.time.now) + duration;
      this.showFeedback(`${sourceWord || "변신"} 발동!`, "#ffd2fb");
      this.showFloatingText(this.player.x, this.player.y - 84, sourceWord || "변신", "#ffe3ff", "26px");
      this.wordBurst(this.player.x, this.player.y, 0xffbff3);
      this.cameras.main.flash(120, 255, 190, 246, false);
      this.refreshAttackTimer();
      this.refreshHud();
    }

    activateCleanup(sourceWord) {
      const activeEnemies = [];

      this.enemies.children.iterate((enemy) => {
        if (enemy && enemy.active && enemy.enemyKind === "negative") {
          activeEnemies.push(enemy);
        }
      });

      this.showFeedback(`${sourceWord || "청소"} 발동!`, "#fff0b0");
      this.showFloatingText(this.player.x, this.player.y - 84, sourceWord || "청소", "#fff4c4", "26px");
      this.wordBurst(this.player.x, this.player.y, 0xffef9e);

      const sweep = this.add.circle(this.player.x, this.player.y, 34, 0xffef9e, 0.1)
        .setStrokeStyle(5, 0xfff7c5, 0.8)
        .setDepth(7);
      this.tweens.add({
        targets: sweep,
        radius: 520,
        alpha: 0,
        duration: 320,
        ease: "Cubic.out",
        onComplete: () => sweep.destroy(),
      });

      activeEnemies.forEach((enemy) => {
        if (enemy.active) {
          this.recordDamageDealt(enemy, enemy.hp);
          this.defeatEnemy(enemy, { deferHud: true, deferLevelCheck: true, forceDrop: true, skipBossFeedback: true });
        }
      });

      this.enemyProjectiles.children.iterate((projectile) => {
        if (!projectile || !projectile.active) {
          return;
        }

        if (projectile.sourceKind === "boss" || projectile.sourceKind === "finalBoss") {
          return;
        }

        projectile.destroy();
      });
      this.activateMagnet({ sourceWord: "청소", sourceX: this.player.x, sourceY: this.player.y });
      this.refreshHud();
      this.checkLevelUp();
    }

    getBeamAimAngle() {
      if (this.player && this.player.body) {
        const velocity = this.player.body.velocity;
        const speedSq = velocity.x * velocity.x + velocity.y * velocity.y;

        if (speedSq > 24) {
          this.lastMoveAngle = Math.atan2(velocity.y, velocity.x);
        }
      }

      return this.lastMoveAngle || (-Math.PI / 2);
    }

    destroyBeamSweep() {
      if (!this.beamSweep) {
        return;
      }

      ["glow", "core", "flare", "origin"].forEach((key) => {
        if (this.beamSweep[key] && this.beamSweep[key].active) {
          this.beamSweep[key].destroy();
        }
      });

      this.beamSweep = null;
    }

    activateBeam(sourceWord, amount) {
      if (this.roundEnded) {
        return;
      }

      const now = this.time.now;
      const duration = 6000;
      const damage = Math.max(8, Math.round((8 + this.attackDamage * 1.8 + this.currentStageIndex * 1.4) * this.getWeaponAmplifyMultiplier()));
      const range = 520 + amount * 40;
      const width = 172 + amount * 12;
      const word = sourceWord || "광선";

      if (this.beamSweep) {
        this.beamSweep.expiresAt = Math.max(this.beamSweep.expiresAt, now) + duration * 0.55;
        this.beamSweep.damage += 2 + amount;
        this.beamSweep.range += 18;
        this.beamSweep.width += 14;
        this.beamSweep.nextTickAt = now;
        this.beamSweep.word = word;
        this.showFeedback(`${word} 증폭!`, "#c9fbff");
      } else {
        this.beamSweep = {
          word,
          damage,
          range,
          width,
          tickEvery: 90,
          nextTickAt: now,
          expiresAt: now + duration,
          glow: this.add.rectangle(this.player.x, this.player.y, range, width * 1.08, 0x78eaff, 0.18).setOrigin(0, 0.5).setDepth(6),
          core: this.add.rectangle(this.player.x, this.player.y, range, width * 0.34, 0xf4feff, 0.9).setOrigin(0, 0.5).setDepth(7),
          flare: this.add.circle(this.player.x, this.player.y, Math.max(26, width * 0.16), 0xb5f5ff, 0.42).setDepth(7),
          origin: this.add.circle(this.player.x, this.player.y, Math.max(18, width * 0.12), 0xffffff, 0.34).setDepth(7),
        };

        this.beamSweep.glow.setStrokeStyle(2, 0xc4fbff, 0.34);
        this.beamSweep.core.setStrokeStyle(2, 0xffffff, 0.18);
        this.showFeedback(`${word} 발동!`, "#c9fbff");
      }

      this.showFloatingText(this.player.x, this.player.y - 84, word, "#e7feff", "26px");
      this.wordBurst(this.player.x, this.player.y, 0xa4f2ff);
      this.cameras.main.flash(110, 196, 244, 255, false);
      this.refreshHud();
    }

    gainAwakeningCharge(amount) {
      if (this.isAwakeningActive()) {
        return;
      }

      this.awakeningCharge = Math.min(this.awakeningThreshold, this.awakeningCharge + amount);

      if (this.awakeningCharge >= this.awakeningThreshold) {
        this.activateAwakening();
      }
    }

    activateAwakening() {
      this.awakeningCharge = 0;
      this.awakeningUntil = this.time.now + 6500;
      this.awakeningCount += 1;
      this.showFeedback("각성 폭주!", "#ffe18f");
      this.showFloatingText(this.player.x, this.player.y - 84, "각성!", "#ffe8a0", "30px");
      this.announceAwakening();
      this.wordBurst(this.player.x, this.player.y, 0xffdd8f);
      this.cameras.main.flash(160, 255, 228, 140, false);
      this.refreshAttackTimer();
      this.refreshHud();
    }

    isAwakeningActive() {
      return this.time.now < this.awakeningUntil;
    }

    isTransformActive() {
      return this.time.now < this.transformUntil;
    }

    handlePlayerHit(_, enemy) {
      if (!enemy.active || this.roundEnded || this.isLevelUp) {
        return;
      }

      const now = this.time.now;

      if (now < this.playerInvulnerableUntil) {
        return;
      }

      if (this.isTransformActive()) {
        this.showFeedback("변신 돌진!", "#ffd6fb");
        this.showFloatingText(enemy.x, enemy.y - 34, enemy.word, "#ffe3ff", "20px");

        if (this.isBossEnemy(enemy)) {
          this.applyDamageToEnemy(enemy, 7);
          this.pushEnemy(enemy, 280, 240);
        } else {
          this.recordDamageDealt(enemy, enemy.hp);
          this.defeatEnemy(enemy);
        }

        return;
      }

      if (now < this.shieldUntil) {
        this.playerInvulnerableUntil = now + 240;
        this.showFeedback("보호막!", "#bde7ff");
        this.showFloatingText(this.player.x, this.player.y - 50, "막음", "#cfeeff", "20px");
        this.wordBurst(enemy.x, enemy.y, 0xbde7ff);

        if (this.isBossEnemy(enemy)) {
          this.applyDamageToEnemy(enemy, 3);
          this.pushEnemy(enemy, 180, 180);
        } else {
          this.recordDamageDealt(enemy, enemy.hp);
          this.destroyEnemy(enemy);
        }

        return;
      }

      this.applyPlayerDamage(this.getEnemyContactDamage(enemy), enemy.x, enemy.y, `${enemy.word} 충돌`);
      this.pushEnemy(enemy, this.isBossEnemy(enemy) ? 220 : 300, this.isBossEnemy(enemy) ? 220 : 180);
    }

    checkLevelUp() {
      if (this.roundEnded || this.isLevelUp) {
        return;
      }

      if (this.experience >= this.nextLevelExperience) {
        this.openLevelUp();
      }
    }

    syncFireWeapon() {
      const forgeLevel = this.getLegendaryLevel("giant");
      const orbCount = this.fireLevel <= 0 ? 0 : Math.min(5, this.fireLevel + Math.min(2, forgeLevel));

      while (this.fireOrbs.length > orbCount) {
        const orb = this.fireOrbs.pop();
        orb.destroy();
      }

      while (this.fireOrbs.length < orbCount) {
        const orb = this.fireOrbGroup.create(this.player.x, this.player.y, "fire-orb");
        orb.setDepth(4);
        orb.body.setCircle(12, 3, 3);
        this.fireOrbs.push(orb);
      }
    }

    openLevelUp() {
      this.isLevelUp = true;
      this.level += 1;
      this.experience -= this.nextLevelExperience;
      this.nextLevelExperience = Math.floor(this.nextLevelExperience * 1.28);
      this.pauseAction(true);

      this.enemies.children.iterate((enemy) => {
        if (enemy && enemy.active) {
          enemy.body.setVelocity(0, 0);
        }
      });

      this.bullets.clear(true, true);
      this.enemyProjectiles.clear(true, true);

      const choices = this.getUpgradeChoices(3);
      const overlayItems = [];
      const dim = this.add.rectangle(360, 640, 720, 1280, 0x02070d, 0.72).setDepth(40);
      overlayItems.push(dim);

      overlayItems.push(this.add.text(360, 258, "강화 선택", {
        fontFamily: this.font,
        fontSize: "44px",
        fontStyle: "800",
        color: "#f8fcff",
      }).setOrigin(0.5).setDepth(41));

      overlayItems.push(this.add.text(360, 308, "한국어 강화명을 먼저 보고, 작은 베트남어 뜻을 참고하세요.", {
        fontFamily: this.font,
        fontSize: "22px",
        color: "#a9bfd0",
      }).setOrigin(0.5).setDepth(41));

      overlayItems.push(this.add.text(360, 344, "Từ tiếng Việt hiện nhỏ để đoán nghĩa nhanh.", {
        fontFamily: this.font,
        fontSize: "16px",
        color: "#7fa096",
      }).setOrigin(0.5).setDepth(41));

      const positionsByCount = {
        1: [360],
        2: [238, 482],
        3: [140, 360, 580],
      };
      const positions = positionsByCount[choices.length] || positionsByCount[3];

      choices.forEach((upgrade, index) => {
        const currentLevel = this.getUpgradeLevel(upgrade.key);
        const card = this.add.image(positions[index], 748, "upgrade-card").setDisplaySize(204, 360).setDepth(41);
        card.setInteractive({ useHandCursor: true });

        const kindText = this.add.text(positions[index], 566, upgrade.kindLabel || "기본", {
          fontFamily: this.font,
          fontSize: "15px",
          fontStyle: "800",
          color: upgrade.kind === "weapon" ? "#9cd6ff" : upgrade.kind === "trait" ? "#d7c2ff" : "#ffd9a8",
        }).setOrigin(0.5).setDepth(42);

        const title = this.add.text(positions[index], 610, upgrade.label, {
          fontFamily: this.font,
          fontSize: "34px",
          fontStyle: "800",
          color: "#ffcb92",
        }).setOrigin(0.5).setDepth(42);

        const viTitle = this.add.text(positions[index], 652, upgrade.viLabel || "", {
          fontFamily: this.font,
          fontSize: "16px",
          fontStyle: "700",
          color: "#8ac7ac",
        }).setOrigin(0.5).setDepth(42);

        const desc = this.add.text(positions[index], 728, upgrade.description, {
          fontFamily: this.font,
          fontSize: "20px",
          fontStyle: "700",
          color: "#eef5fb",
          align: "center",
          wordWrap: { width: 154, useAdvancedWrap: true },
        }).setOrigin(0.5).setDepth(42);
        desc.setLineSpacing(4);

        const viDesc = this.add.text(positions[index], 824, upgrade.viDescription || "", {
          fontFamily: this.font,
          fontSize: "15px",
          color: "#a4c9b7",
          align: "center",
          wordWrap: { width: 154, useAdvancedWrap: true },
        }).setOrigin(0.5).setDepth(42);
        viDesc.setLineSpacing(4);

        const tip = this.add.text(positions[index], 904, `Lv ${currentLevel + 1}/${upgrade.maxLevel || 1} · ${upgrade.viKindLabel || ""}`, {
          fontFamily: this.font,
          fontSize: "16px",
          color: "#9bd9b0",
        }).setOrigin(0.5).setDepth(42);

        card.on("pointerover", () => {
          card.setTint(0xffefdc);
        });

        card.on("pointerout", () => {
          card.clearTint();
        });

        card.on("pointerdown", () => this.applyUpgrade(upgrade, overlayItems));

        overlayItems.push(card, kindText, title, viTitle, desc, viDesc, tip);
      });

      this.levelUpOverlay = overlayItems;
      this.pinUiItems(overlayItems);
      this.refreshHud();
    }

    applyUpgrade(upgrade, overlayItems) {
      if (!this.isLevelUp) {
        return;
      }

      let needsTimerRefresh = false;
      let needsLightningRefresh = false;
      let needsWaveRefresh = false;
      let needsSpearRefresh = false;
      let needsChainRefresh = false;
      let needsMistRefresh = false;
      let needsShieldRefresh = false;
      let needsBlastRefresh = false;
      let needsBladeRefresh = false;
      let needsDiscRefresh = false;

      this.upgradeLevels[upgrade.key] = this.getUpgradeLevel(upgrade.key) + 1;

      if (upgrade.key === "power") {
        this.attackDamage += 1;
      } else if (upgrade.key === "speed") {
        this.basePlayerSpeed += 18;
      } else if (upgrade.key === "health") {
        this.maxHp += 18;
        this.hp = Math.min(this.maxHp, this.hp + 18);
        this.healBonus += 4;
      } else if (upgrade.key === "focus") {
        this.attackCooldown = Math.max(180, this.attackCooldown - 32);
        needsTimerRefresh = true;
      } else if (upgrade.key === "range") {
        this.attackRange += 36;
      } else if (upgrade.key === "fortune") {
        this.pickupLuck += 0.08;
      } else if (upgrade.key === "wave") {
        this.waveLevel += 1;
        needsWaveRefresh = true;
      } else if (upgrade.key === "fire") {
        this.fireLevel += 1;
        this.syncFireWeapon();
      } else if (upgrade.key === "lightning") {
        this.lightningLevel += 1;
        needsLightningRefresh = true;
      } else if (upgrade.key === "spear") {
        this.spearLevel += 1;
        needsSpearRefresh = true;
      } else if (upgrade.key === "chain") {
        this.chainLevel += 1;
        needsChainRefresh = true;
      } else if (upgrade.key === "shieldWeapon") {
        this.shieldWeaponLevel += 1;
        needsShieldRefresh = true;
      } else if (upgrade.key === "mist") {
        this.mistLevel += 1;
        needsMistRefresh = true;
      } else if (upgrade.key === "link") {
        this.linkLevel = this.getUpgradeLevel("link");
      } else if (upgrade.key === "split") {
        this.splitLevel = this.getUpgradeLevel("split");
      } else if (upgrade.key === "amplify") {
        this.amplifyLevel = this.getUpgradeLevel("amplify");
      } else if (upgrade.key === "duration") {
        this.durationLevel = this.getUpgradeLevel("duration");
        needsMistRefresh = true;
      } else if (upgrade.key === "siphon") {
        this.siphonLevel = this.getUpgradeLevel("siphon");
      } else if (upgrade.key === "tracking") {
        this.trackingLevel = this.getUpgradeLevel("tracking");
      } else if (upgrade.key === "blast") {
        this.blastLevel = this.getUpgradeLevel("blast");
        needsBlastRefresh = true;
      } else if (upgrade.key === "blade") {
        this.bladeLevel = this.getUpgradeLevel("blade");
        needsBladeRefresh = true;
      } else if (upgrade.key === "disc") {
        this.discLevel = this.getUpgradeLevel("disc");
        needsDiscRefresh = true;
      }

      overlayItems.forEach((item) => item.destroy());
      this.levelUpOverlay = null;
      this.isLevelUp = false;
      this.pauseAction(false);

      if (needsTimerRefresh) {
        this.refreshAttackTimer();
      }

      if (needsLightningRefresh) {
        this.refreshLightningTimer();
      }

      if (needsWaveRefresh) {
        this.refreshWaveTimer();
      }

      if (needsSpearRefresh) {
        this.refreshSpearTimer();
      }

      if (needsChainRefresh) {
        this.refreshChainTimer();
      }

      if (needsMistRefresh) {
        this.refreshMistTimer();
      }

      if (needsShieldRefresh) {
        this.syncShieldWeapon();
      }

      if (needsBlastRefresh) {
        this.refreshBlastTimer();
      }

      if (needsBladeRefresh) {
        this.refreshBladeTimer();
      }

      if (needsDiscRefresh) {
        this.refreshDiscTimer();
      }

      this.showFeedback(`${upgrade.label} 강화`, "#ffd4aa");
      this.refreshHud();

      if (this.experience >= this.nextLevelExperience) {
        this.time.delayedCall(120, () => this.checkLevelUp());
      }
    }

    pauseAction(paused) {
      if (this.enemyTimer) {
        this.enemyTimer.paused = paused;
      }

      if (this.bossTimer) {
        this.bossTimer.paused = paused;
      }

      if (this.autoFireTimer) {
        this.autoFireTimer.paused = paused;
      }

      if (this.lightningTimer) {
        this.lightningTimer.paused = paused;
      }

      if (this.waveTimer) {
        this.waveTimer.paused = paused;
      }

      if (this.spearTimer) {
        this.spearTimer.paused = paused;
      }

      if (this.chainTimer) {
        this.chainTimer.paused = paused;
      }

      if (this.strongWaveTimer) {
        this.strongWaveTimer.paused = paused;
      }

      if (this.mistTimer) {
        this.mistTimer.paused = paused;
      }

      if (this.blastTimer) {
        this.blastTimer.paused = paused;
      }

      if (this.bladeTimer) {
        this.bladeTimer.paused = paused;
      }

      if (this.discTimer) {
        this.discTimer.paused = paused;
      }

      if (this.finalBossAttackTimer) {
        this.finalBossAttackTimer.paused = paused;
      }
    }

    castLightning() {
      if (this.roundEnded || this.isLevelUp || this.lightningLevel <= 0) {
        return;
      }

      const tempestLevel = this.getLegendaryLevel("tempest");
      const activeEnemies = [];

      this.enemies.children.iterate((enemy) => {
        if (enemy && enemy.active) {
          activeEnemies.push(enemy);
        }
      });

      if (!activeEnemies.length) {
        return;
      }

      const strikeCount = Math.min(8, 1 + Math.floor((this.lightningLevel - 1) / 2) + Math.floor(this.linkLevel / 2) + tempestLevel);
      const targets = Phaser.Utils.Array.Shuffle(activeEnemies).slice(0, strikeCount);

      targets.forEach((enemy, index) => {
        this.time.delayedCall(index * 70, () => {
          if (!enemy.active) {
            return;
          }

          const damage = Math.max(1, Math.round(
            (2.2 + this.lightningLevel * 1.05 + tempestLevel * 0.85 + (this.isAwakeningActive() ? 1 : 0)) * this.getWeaponAmplifyMultiplier()
          ));
          this.applyDamageToEnemy(enemy, damage);
          this.drawLightning(enemy.x, enemy.y);
          if (tempestLevel > 0) {
            this.triggerImpactChain(enemy, Math.max(1, Math.round(damage * 0.55)), Math.min(4, tempestLevel), new Set([enemy.enemyId]));
          }
        });
      });
    }

    castWavePulse() {
      if (this.roundEnded || this.isLevelUp || this.waveLevel <= 0) {
        return;
      }

      const tempestLevel = this.getLegendaryLevel("tempest");
      const radius = 120 + this.waveLevel * 22 + this.durationLevel * 12 + tempestLevel * 18;
      const damage = Math.max(1, Math.round(
        (1.1 + this.waveLevel + tempestLevel * 0.55 + (this.isAwakeningActive() ? 1 : 0)) * this.getWeaponAmplifyMultiplier()
      ));
      this.emitWavePulse(radius, damage, 0x8edbff, 260 + this.durationLevel * 40);

      const echoCount = Math.min(2, tempestLevel);

      for (let index = 0; index < echoCount; index += 1) {
        this.time.delayedCall(110 + index * 110, () => {
          if (this.roundEnded || this.isLevelUp) {
            return;
          }

          this.emitWavePulse(
            radius * (0.88 + index * 0.06),
            Math.max(1, Math.round(damage * (0.55 + tempestLevel * 0.06))),
            0xb6ecff,
            210 + this.durationLevel * 30
          );
        });
      }
    }

    emitWavePulse(radius, damage, color, duration) {
      const ring = this.add.circle(this.player.x, this.player.y, 18, color, 0.08)
        .setStrokeStyle(4, color, 0.82)
        .setDepth(6);

      this.tweens.add({
        targets: ring,
        radius: radius,
        alpha: 0,
        duration: duration,
        ease: "Cubic.out",
        onComplete: () => ring.destroy(),
      });

      this.enemies.children.iterate((enemy) => {
        if (!enemy || !enemy.active) {
          return;
        }

        const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);

        if (distance <= radius) {
          this.applyDamageToEnemy(enemy, damage);
          enemy.setAlpha(0.8);

          this.time.delayedCall(90, () => {
            if (enemy.active) {
              enemy.setAlpha(1);
            }
          });
        }
      });
    }

    drawLightning(x, y) {
      const line = this.add.graphics().setDepth(7);
      line.lineStyle(4, 0xdcf7ff, 0.95);
      line.beginPath();
      line.moveTo(x + Phaser.Math.Between(-40, 40), 0);

      for (let step = 1; step <= 5; step += 1) {
        const ratio = step / 5;
        const pointY = y * ratio;
        const pointX = x + Phaser.Math.Between(-34, 34);
        line.lineTo(pointX, pointY);
      }

      line.lineTo(x, y);
      line.strokePath();

      this.tweens.add({
        targets: line,
        alpha: 0,
        duration: 120,
        onComplete: () => line.destroy(),
      });
    }

    wordBurst(x, y, color) {
      for (let index = 0; index < 8; index += 1) {
        const spark = this.add.circle(x, y, 6, color, 0.8).setDepth(8);
        const angle = (Math.PI * 2 * index) / 8;
        const distance = 42;

        this.tweens.add({
          targets: spark,
          x: x + Math.cos(angle) * distance,
          y: y + Math.sin(angle) * distance,
          alpha: 0,
          scale: 0.2,
          duration: 280,
          ease: "Cubic.out",
          onComplete: () => spark.destroy(),
        });
      }
    }

    showFeedback(message, color) {
      this.feedbackText.setText(message);
      this.feedbackText.setColor(color);
      this.feedbackUntil = this.time.now + 900;
    }

    updateBossVisual(enemy) {
      if (!enemy || !enemy.active || (!this.isBossEnemy(enemy) && enemy.enemyKind !== "bossClone")) {
        return;
      }

      const time = this.time.now;

      if (enemy.motion === "clone") {
        const clonePulse = 0.78 + Math.abs(Math.sin(time * 0.01)) * 0.08;
        enemy.setScale(clonePulse);
        enemy.setAngle(Math.sin(time * 0.01) * 8);
        enemy.setAlpha(0.38 + Math.abs(Math.sin(time * 0.02)) * 0.2);
      } else if (enemy.motion === "despair") {
        enemy.setScale(1, 0.96 + Math.sin(time * 0.006) * 0.05);
        enemy.setAngle(Math.sin(time * 0.004) * 3.5);
      } else if (enemy.motion === "chaos") {
        const pulse = 0.96 + Math.sin(time * 0.009) * 0.08;
        enemy.setScale(pulse);
        enemy.setAngle(Math.sin(time * 0.011) * 14);
      } else if (enemy.motion === "fear") {
        enemy.setScale(0.98 + Math.sin(time * 0.008) * 0.06);
        enemy.setAngle(Math.sin(time * 0.005) * 2);
        enemy.setAlpha(0.86 + Math.abs(Math.sin(time * 0.009)) * 0.14);
      } else if (enemy.motion === "frustration") {
        enemy.setScale(1 + Math.abs(Math.sin(time * 0.016)) * 0.03);
        enemy.setAngle(Math.sin(time * 0.018) * 6);
      } else if (enemy.motion === "final") {
        const pulse = 1 + Math.abs(Math.sin(time * 0.01)) * 0.08;
        enemy.setScale(pulse);
        enemy.setAngle(Math.sin(time * 0.006) * 3.5);
        enemy.setAlpha(0.9 + Math.abs(Math.sin(time * 0.012)) * 0.1);
      } else {
        enemy.setScale(1);
        enemy.setAngle(0);
        enemy.setAlpha(1);
      }

      if (enemy.enemyKind === "boss" || enemy.enemyKind === "finalBoss") {
        if ((enemy.gimmickInvulnerableUntil || 0) > time) {
          enemy.setAlpha(0.44 + Math.abs(Math.sin(time * 0.03)) * 0.24);
        } else if ((enemy.gimmickFrenzyUntil || 0) > time) {
          enemy.setScale(enemy.scaleX * 1.04, enemy.scaleY * 1.04);
          enemy.setAlpha(Math.max(enemy.alpha, 0.92));
        }
      }
    }

    destroyEnemy(enemy) {
      if (!enemy || !enemy.active) {
        return;
      }

      if (enemy.label) {
        enemy.label.destroy();
      }

      if (enemy.hpBarTrack) {
        enemy.hpBarTrack.destroy();
      }

      if (enemy.hpBarFill) {
        enemy.hpBarFill.destroy();
      }

      if (enemy.roleAura) {
        enemy.roleAura.destroy();
      }

      enemy.destroy();
    }

    destroyPickup(pickup) {
      if (!pickup || !pickup.active) {
        return;
      }

      this.tweens.killTweensOf(pickup);

      if (pickup.label) {
        pickup.label.destroy();
      }

      if (pickup.icon) {
        pickup.icon.destroy();
      }

      if (pickup.glow) {
        pickup.glow.destroy();
      }

      pickup.destroy();
    }

    getActiveAttackDamage() {
      return this.attackDamage + (this.isAwakeningActive() ? 1 : 0) + (this.isTransformActive() ? 2 : 0);
    }

    getMovementSpeed() {
      let speed = this.basePlayerSpeed;

      if (this.time.now < this.speedBoostUntil) {
        speed += 56;
      }

      if (this.isAwakeningActive()) {
        speed += 46;
      }

      if (this.isTransformActive()) {
        speed += 62;
      }

      return speed;
    }

    resetTouchJoystick() {
      this.joystickActive = false;
      this.touchRing.setVisible(false);
      this.touchDot.setVisible(false);
    }

    beginTouchJoystick(screenPoint) {
      this.joystickActive = true;
      this.joystickOriginX = screenPoint.x;
      this.joystickOriginY = screenPoint.y;
      this.touchRing.setPosition(screenPoint.x, screenPoint.y).setVisible(true);
      this.touchDot.setPosition(screenPoint.x, screenPoint.y).setVisible(true);
    }

    updateTouchJoystick(screenPoint) {
      if (!this.joystickActive) {
        this.beginTouchJoystick(screenPoint);
      }

      const dx = screenPoint.x - this.joystickOriginX;
      const dy = screenPoint.y - this.joystickOriginY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const clampedDistance = Math.min(distance, this.joystickRadius);
      const angle = distance > 0 ? Math.atan2(dy, dx) : 0;
      const knobX = this.joystickOriginX + Math.cos(angle) * clampedDistance;
      const knobY = this.joystickOriginY + Math.sin(angle) * clampedDistance;
      const moveSpeed = this.getMovementSpeed();

      this.touchRing.setPosition(this.joystickOriginX, this.joystickOriginY).setVisible(true);
      this.touchDot.setPosition(knobX, knobY).setVisible(true);

      if (distance <= this.joystickDeadZone) {
        this.player.body.setVelocity(0, 0);
        return;
      }

      const intensity = Phaser.Math.Clamp(
        (clampedDistance - this.joystickDeadZone) / Math.max(1, this.joystickRadius - this.joystickDeadZone),
        0,
        1
      );

      this.player.body.setVelocity(
        Math.cos(angle) * moveSpeed * intensity,
        Math.sin(angle) * moveSpeed * intensity
      );
      this.lastMoveAngle = angle;
    }

    refreshHud() {
      const stage = this.getCurrentStageData();
      const nextWaveMoment = this.getNextStrongWaveMoment();
      const secondsUntilWave = nextWaveMoment == null ? null : Math.max(0, Math.ceil(nextWaveMoment - this.getStageElapsedSeconds()));
      let phaseMessage = stage ? stage.viLabel : "";
      let phaseColor = "#9fb4c6";
      let timeLabel = `${Math.ceil(this.timeRemaining)}s`;
      let timeColor = this.timeRemaining <= 12 ? "#ffb8b0" : "#f8fcff";

      this.hpBarFill.width = 170 * Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);
      this.hpBarFill.fillColor = this.hp > this.maxHp * 0.5 ? 0x5ce0a0 : this.hp > this.maxHp * 0.25 ? 0xffc857 : 0xff7b71;
      this.refreshPlayerHealthBar();
      this.levelText.setText(`레벨 ${this.level}`);
      this.stageText.setText(this.getCurrentStageTitle());
      this.stageText.setColor(this.colorToHex(stage ? stage.accentColor : 0xffcb92));
      this.scoreText.setText(String(this.score));
      this.xpBarFill.width = 524 * Phaser.Math.Clamp(this.experience / this.nextLevelExperience, 0, 1);

      if (this.finalBossPhase) {
        timeLabel = "FINAL";
        timeColor = "#ffb0a8";
        phaseMessage = `${this.vocabData.finalBoss.word} 결전`;
        phaseColor = "#ffc8b0";
      } else if (this.isLevelUp && this.stageTransitionOverlay) {
        timeLabel = "REWARD";
        timeColor = "#ffe2b3";
        phaseMessage = "전설 보상 선택";
        phaseColor = "#ffd9a0";
      } else if (this.stageBossSpawned && this.currentStageBoss && this.currentStageBoss.active) {
        timeLabel = "BOSS";
        timeColor = "#ffc2ad";
        phaseMessage = "스테이지 보스전";
        phaseColor = "#ffd1b3";
      } else if (this.stageBossSequenceStarted && this.pendingStageBoss) {
        timeLabel = "CLEAR";
        timeColor = "#ffd0ab";
        phaseMessage = "잔당 정리 후 보스 등장";
        phaseColor = "#ffd9b0";
      } else if (secondsUntilWave != null) {
        phaseMessage = `${nextWaveMoment}초 강습까지 ${secondsUntilWave}초`;
        phaseColor = secondsUntilWave <= 5 ? "#ffd9b0" : "#9fb4c6";
      } else if (!this.stageBossSequenceStarted) {
        phaseMessage = "90초 생존 후 스테이지 보스";
        phaseColor = "#c1d0db";
      }

      this.timeText.setText(timeLabel);
      this.timeText.setColor(timeColor);
      this.phaseText.setText(phaseMessage);
      this.phaseText.setColor(phaseColor);
      const awakeningRatio = Phaser.Math.Clamp(this.awakeningCharge / this.awakeningThreshold, 0, 1);
      const pulseAlpha = 0.82 + Math.abs(Math.sin(this.time.now * 0.012)) * 0.18;

      if (this.isAwakeningActive()) {
        this.awakeningBarFill.width = 524;
        this.awakeningBarFill.fillColor = 0xffd96e;
        this.awakeningBarFill.alpha = pulseAlpha;
        this.awakeningStatusText.setText(`발동 ${((this.awakeningUntil - this.time.now) / 1000).toFixed(1)}초`);
        this.awakeningStatusText.setColor("#fff0b2");
      } else {
        this.awakeningBarFill.width = 524 * awakeningRatio;
        this.awakeningBarFill.fillColor = awakeningRatio >= 0.82 ? 0xffd166 : 0xffc35d;
        this.awakeningBarFill.alpha = awakeningRatio >= 0.82 ? pulseAlpha : 1;
        this.awakeningStatusText.setText(
          awakeningRatio >= 0.82 ? `곧 각성 ${Math.round(awakeningRatio * 100)}%` : `준비 ${Math.round(awakeningRatio * 100)}%`
        );
        this.awakeningStatusText.setColor(awakeningRatio >= 0.82 ? "#ffe7a0" : "#ffd88c");
      }
    }

    update(_, delta) {
      if (this.roundEnded) {
        return;
      }

      const awakeningActive = this.isAwakeningActive();
      const transformActive = this.isTransformActive();

      if (awakeningActive !== this.wasAwakeningActive) {
        const wasAwakeningActive = this.wasAwakeningActive;
        this.wasAwakeningActive = awakeningActive;
        this.refreshAttackTimer();

        if (!awakeningActive && wasAwakeningActive) {
          this.showFeedback("각성 종료", "#d8c597");
        }
      }

      if (transformActive !== this.wasTransformActive) {
        const wasTransformActive = this.wasTransformActive;
        this.wasTransformActive = transformActive;
        this.refreshAttackTimer();

        if (!transformActive && wasTransformActive) {
          this.showFeedback("변신 종료", "#dcb8f4");
        }
      }

      const pointer = this.input.activePointer;
      const screenPoint = pointer.position;

      if (this.isLevelUp) {
        this.player.body.setVelocity(0, 0);
        this.resetTouchJoystick();
        this.magnetLinks.clear();
        this.magnetField.setVisible(false);
        this.updateFireOrbs(delta);
        this.updateShieldOrbs(delta);
        this.updateLoopMapBackdrop();
        this.updateLabels();
        this.updateLegendaryVisuals();
        return;
      }

      if (pointer.isDown) {
        this.updateTouchJoystick(screenPoint);
      } else {
        this.resetTouchJoystick();
        this.player.body.setVelocity(0, 0);
      }

      this.elapsedSeconds += delta / 1000;

      if (!this.finalBossPhase && !this.finalBossRushPhase) {
        this.timeRemaining = Math.max(0, this.timeRemaining - delta / 1000);
      } else {
        this.timeRemaining = 0;
      }

      if (!this.finalBossPhase && !this.finalBossRushPhase) {
        const stageElapsed = this.getStageElapsedSeconds();
        const moments = this.getStrongWaveMoments();

        moments.forEach((moment, index) => {
          const waveNumber = index + 1;

          if (stageElapsed >= moment && !this.stageWaveTriggered[waveNumber]) {
            this.triggerStrongWave(waveNumber);
          }
        });
      }

      this.wrapPlayerPosition();
      this.normalizeCombatObjectsToPlayer();
      this.updateLoopMapBackdrop();
      this.updateBullets(delta);
      this.updateEnemies();
      this.normalizeCombatObjectsToPlayer();
      this.updateFireOrbs(delta);
      this.updateShieldOrbs(delta);
      this.updateBossAidAllies(delta);
      this.updateMistZones();
      this.updateBeamSweep();
      this.applyHarvestPickupAura();
      this.updateMagnetPulls(delta);
      this.updateLabels();

      this.auraRing.setPosition(this.player.x, this.player.y);
      this.auraRing.setVisible(
        this.time.now < this.shieldUntil ||
        this.time.now < this.speedBoostUntil ||
        this.isAwakeningActive() ||
        this.isTransformActive()
      );
      this.awakeningRing.setPosition(this.player.x, this.player.y);
      this.awakeningRing.setVisible(this.isAwakeningActive());

      if (this.time.now < this.shieldUntil) {
        this.auraRing.setStrokeStyle(3, 0x8ad3ff, 0.55);
        this.auraRing.setFillStyle(0x8ad3ff, 0.08);
      } else if (this.isAwakeningActive()) {
        this.auraRing.setStrokeStyle(3, 0xffd166, 0.58);
        this.auraRing.setFillStyle(0xffd166, 0.08);
      } else if (this.isTransformActive()) {
        this.auraRing.setStrokeStyle(3, 0xffa5f1, 0.58);
        this.auraRing.setFillStyle(0xffa5f1, 0.08);
      } else {
        this.auraRing.setStrokeStyle(3, 0xffcb92, 0.55);
        this.auraRing.setFillStyle(0xffcb92, 0.08);
      }

      if (this.isAwakeningActive()) {
        const pulseScale = 1 + Math.abs(Math.sin(this.time.now * 0.014)) * 0.2;
        this.awakeningRing.setScale(pulseScale);
        this.awakeningRing.setAlpha(0.34 + Math.abs(Math.sin(this.time.now * 0.014)) * 0.18);
      } else {
        this.awakeningRing.setScale(1);
        this.awakeningRing.setAlpha(0);
      }

      this.updateLegendaryVisuals();

      const basePlayerScale = this.getPlayerBaseScale();

      if (this.isTransformActive()) {
        const morphPulse = 1.1 + Math.abs(Math.sin(this.time.now * 0.016)) * 0.14;
        this.player.setScale(basePlayerScale * morphPulse);
        this.player.setTint(0xffd6fb);
      } else if (this.time.now >= this.playerInvulnerableUntil) {
        this.player.setScale(basePlayerScale);
        this.player.clearTint();
      } else {
        this.player.setScale(basePlayerScale);
      }

      if (this.time.now > this.feedbackUntil) {
        this.feedbackText.setText("");
      }

      if (!this.isMagnetCollecting) {
        this.magnetField.setVisible(false);
        this.magnetLinks.clear();
      }

      this.refreshHud();

      if (!this.finalBossPhase && !this.finalBossRushPhase && this.timeRemaining <= 0) {
        this.completeCurrentStage();
      }

      if (!this.finalBossPhase && !this.finalBossRushPhase) {
        this.spawnStageBossIfReady();
      }
    }

    updateBullets(delta) {
      this.bullets.children.iterate((bullet) => {
        if (!bullet || !bullet.active) {
          return;
        }

        bullet.lifespan -= delta;
        bullet.rotation += (bullet.rotationSpeed || 0) * delta;

        if ((bullet.homingStrength || 0) > 0) {
          const target = this.findNearestEnemyFromPoint(
            bullet.x,
            bullet.y,
            220 + this.trackingLevel * 80,
            bullet.hitTargets
          );

          if (target) {
            const aimAngle = Phaser.Math.Angle.Between(bullet.x, bullet.y, target.x, target.y);
            const currentSpeed = bullet.speed || Math.max(1, Math.sqrt(
              bullet.body.velocity.x * bullet.body.velocity.x + bullet.body.velocity.y * bullet.body.velocity.y
            ));
            const currentAngle = Math.atan2(bullet.body.velocity.y, bullet.body.velocity.x);
            const angleDelta = Math.atan2(Math.sin(aimAngle - currentAngle), Math.cos(aimAngle - currentAngle));
            const nextAngle = currentAngle + angleDelta * bullet.homingStrength;
            this.physics.velocityFromRotation(nextAngle, currentSpeed, bullet.body.velocity);
            bullet.rotation = nextAngle;
          }
        }

        if (bullet.lifespan <= 0 || Phaser.Math.Distance.Between(this.player.x, this.player.y, bullet.x, bullet.y) > this.combatCullRadius) {
          if (bullet.weaponType === "blast" && (bullet.impactDamage || 0) > 0) {
            this.detonateBlastShell(bullet);
          } else {
            bullet.destroy();
          }
        }
      });

      this.enemyProjectiles.children.iterate((projectile) => {
        if (!projectile || !projectile.active) {
          return;
        }

        projectile.lifespan -= delta;
        projectile.rotation += (projectile.rotationSpeed || 0) * delta;

        if (
          projectile.lifespan <= 0 ||
          Phaser.Math.Distance.Between(this.player.x, this.player.y, projectile.x, projectile.y) > this.combatCullRadius + 120
        ) {
          projectile.destroy();
        }
      });
    }

    updateEnemies() {
      this.enemies.children.iterate((enemy) => {
        if (!enemy || !enemy.active) {
          return;
        }

        if (enemy.enemyKind === "bossClone" && (enemy.expiresAt || 0) <= this.time.now) {
          this.destroyEnemy(enemy);
          return;
        }

        if ((enemy.pushUntil || 0) > this.time.now) {
          if (enemy.enemyKind === "boss") {
            this.tryBossShot(enemy);
          }
          return;
        }

        if (enemy.enemyKind === "finalBoss" && this.time.now < this.finalBossIntroUntil) {
          enemy.body.setVelocity(0, 0);
          this.updateBossVisual(enemy);
          return;
        }

        if (enemy.enemyKind === "finalBoss" && (enemy.dashUntil || 0) > this.time.now) {
          this.updateBossVisual(enemy);
          return;
        }

        if (enemy.enemyKind === "boss" && (enemy.dashUntil || 0) > this.time.now) {
          this.updateBossVisual(enemy);
          return;
        }

        if (enemy.enemyKind === "negative") {
          this.tryEnemyRoleAction(enemy);
        }

        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        let moveSpeed = enemy.enemyKind === "finalBoss" ? enemy.speed * 0.72 : enemy.speed;

        if ((enemy.mistSlowUntil || 0) > this.time.now) {
          moveSpeed *= enemy.mistSlowFactor || 0.72;
        }

        if ((enemy.auraBoostUntil || 0) > this.time.now) {
          moveSpeed *= enemy.auraSpeedMultiplier || 1.18;
        }

        if (enemy.enemyKind === "negative" && enemy.roleKey === "rush" && (enemy.roleDashUntil || 0) > this.time.now) {
          const role = (this.vocabData.negativeRoles || {}).rush || {};
          moveSpeed *= role.dashSpeedMultiplier || 2.35;
        }

        this.physics.velocityFromRotation(angle, moveSpeed, enemy.body.velocity);
        this.updateBossVisual(enemy);

        if (enemy.enemyKind === "boss") {
          this.tryBossShot(enemy);
        }
      });
    }

    updateFireOrbs(delta) {
      if (!this.fireOrbs.length) {
        return;
      }

      const forgeLevel = this.getLegendaryLevel("giant");
      this.fireAngle += delta * (0.0032 + forgeLevel * 0.00018);
      const radius = 78 + Math.min(this.fireLevel, 5) * 12 + forgeLevel * 6;

      this.fireOrbs.forEach((orb, index) => {
        const angle = this.fireAngle + (Math.PI * 2 * index) / this.fireOrbs.length;
        const x = this.player.x + Math.cos(angle) * radius;
        const y = this.player.y + Math.sin(angle) * radius;
        orb.setPosition(x, y);
        orb.setScale(1.04 + this.amplifyLevel * 0.06 + forgeLevel * 0.08 + Math.abs(Math.sin(this.time.now * 0.02 + index)) * 0.08);
        orb.setTint(forgeLevel > 0 ? 0xffd189 : 0xffffff);
      });
    }

    updateShieldOrbs(delta) {
      if (!this.shieldOrbs.length) {
        return;
      }

      const forgeLevel = this.getLegendaryLevel("giant");
      this.shieldAngle += delta * (0.0028 + this.shieldWeaponLevel * 0.00014 + forgeLevel * 0.0001);
      const radius = 104 + this.shieldWeaponLevel * 6 + this.amplifyLevel * 3 + forgeLevel * 8;
      const scale = 1 + this.amplifyLevel * 0.06 + forgeLevel * 0.08;

      this.shieldOrbs.forEach((orb, index) => {
        const angle = this.shieldAngle + (Math.PI * 2 * index) / this.shieldOrbs.length;
        const x = this.player.x + Math.cos(angle) * radius;
        const y = this.player.y + Math.sin(angle) * radius;
        orb.setPosition(x, y);
        orb.setScale(scale);
        orb.setTint(forgeLevel > 0 ? 0xffd9a6 : 0xcfe3ff);
        orb.rotation = angle + Math.PI / 2;
      });
    }

    updateMistZones() {
      if (!this.mistZones.length) {
        return;
      }

      for (let index = this.mistZones.length - 1; index >= 0; index -= 1) {
        const zone = this.mistZones[index];

        if (!zone || !zone.sprite || !zone.sprite.active) {
          this.mistZones.splice(index, 1);
          continue;
        }

        if (this.time.now >= zone.expiresAt) {
          zone.sprite.destroy();
          this.mistZones.splice(index, 1);
          continue;
        }

        zone.sprite.setAlpha(0.24 + Math.abs(Math.sin((this.time.now + index * 80) * 0.004)) * 0.18);
        zone.sprite.setScale((zone.radius / 96) * (1 + Math.abs(Math.sin((this.time.now + index * 120) * 0.004)) * 0.06));

        if (this.time.now < zone.nextTickAt) {
          continue;
        }

        zone.nextTickAt = this.time.now + zone.tickEvery;

        this.enemies.children.iterate((enemy) => {
          if (!enemy || !enemy.active) {
            return;
          }

          const distance = Phaser.Math.Distance.Between(zone.sprite.x, zone.sprite.y, enemy.x, enemy.y);

          if (distance > zone.radius) {
            return;
          }

          this.applyDamageToEnemy(enemy, zone.tickDamage);
          enemy.mistSlowUntil = this.time.now + 420 + this.durationLevel * 90;
          enemy.mistSlowFactor = Math.max(0.46, 0.76 - this.mistLevel * 0.04);
          enemy.setAlpha(0.76);

          this.time.delayedCall(80, () => {
            if (enemy.active) {
              enemy.setAlpha(1);
            }
          });
        });

        if (zone.pulseEvery > 0 && this.time.now >= zone.nextPulseAt) {
          zone.nextPulseAt = this.time.now + zone.pulseEvery;
          this.triggerWeaponBlast(zone.sprite.x, zone.sprite.y, zone.pulseRadius, zone.pulseDamage, null, {
            color: zone.color,
            label: this.getLegendaryLevel("supernova") >= 3 ? "심연" : "",
            heavy: false,
          });
        }
      }
    }

    updateBeamSweep() {
      if (!this.beamSweep) {
        return;
      }

      const beam = this.beamSweep;

      if (this.time.now >= beam.expiresAt) {
        this.destroyBeamSweep();
        return;
      }

      const angle = this.getBeamAimAngle();
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const startX = this.player.x + cos * 24;
      const startY = this.player.y + sin * 24;
      const endX = startX + cos * beam.range;
      const endY = startY + sin * beam.range;
      const pulse = 1 + Math.abs(Math.sin(this.time.now * 0.024)) * 0.12;

      beam.glow.setPosition(startX, startY);
      beam.glow.rotation = angle;
      beam.glow.setDisplaySize(beam.range, beam.width * (1.02 + Math.abs(Math.sin(this.time.now * 0.018)) * 0.16));
      beam.glow.setAlpha(0.16 + Math.abs(Math.sin(this.time.now * 0.016)) * 0.12);

      beam.core.setPosition(startX, startY);
      beam.core.rotation = angle;
      beam.core.setDisplaySize(beam.range, beam.width * 0.34 * pulse);
      beam.core.setAlpha(0.76 + Math.abs(Math.sin(this.time.now * 0.026)) * 0.2);

      beam.flare.setPosition(endX, endY);
      beam.flare.setScale(1 + Math.abs(Math.sin(this.time.now * 0.03)) * 0.28);
      beam.flare.setAlpha(0.3 + Math.abs(Math.sin(this.time.now * 0.024)) * 0.24);

      beam.origin.setPosition(this.player.x, this.player.y);
      beam.origin.setScale(0.92 + Math.abs(Math.sin(this.time.now * 0.028)) * 0.18);
      beam.origin.setAlpha(0.26 + Math.abs(Math.sin(this.time.now * 0.022)) * 0.18);

      if (this.time.now < beam.nextTickAt) {
        return;
      }

      beam.nextTickAt = this.time.now + beam.tickEvery;

      this.enemies.children.iterate((enemy) => {
        if (!enemy || !enemy.active) {
          return;
        }

        if (enemy.enemyKind === "finalBoss" && this.time.now < this.finalBossIntroUntil) {
          return;
        }

        const relX = enemy.x - startX;
        const relY = enemy.y - startY;
        const forward = relX * cos + relY * sin;

        if (forward < -8 || forward > beam.range + 36) {
          return;
        }

        const side = Math.abs(relX * -sin + relY * cos);
        const enemyRadius = Math.max(enemy.displayWidth || 30, enemy.displayHeight || 30) * 0.24;

        if (side > (beam.width * 0.5) + enemyRadius) {
          return;
        }

        const damage = this.isBossEnemy(enemy)
          ? Math.max(5, Math.round(beam.damage * 0.58))
          : beam.damage;

        this.applyDamageToEnemy(enemy, damage);
        this.pushEnemy(enemy, this.isBossEnemy(enemy) ? 140 : 220, 120);
        enemy.setAlpha(0.72);

        this.time.delayedCall(70, () => {
          if (enemy.active) {
            enemy.setAlpha(1);
          }
        });
      });
    }

    updateLabels() {
      this.enemies.children.iterate((enemy) => {
        if (enemy && enemy.active && enemy.label) {
          enemy.label.setPosition(enemy.x, enemy.y + 1);
          this.updateEnemyHealthBar(enemy);

          if (enemy.roleAura) {
            enemy.roleAura.setPosition(enemy.x, enemy.y);
          }
        }
      });

      this.pickups.children.iterate((pickup) => {
        if (pickup && pickup.active && pickup.label) {
          this.positionPickupBadge(pickup);
        }
      });
    }

    finishRound(options) {
      if (this.roundEnded) {
        return;
      }

      const settings = options || {};
      const cleared = !!settings.cleared;
      this.roundEnded = true;

      if (this.enemyTimer) {
        this.enemyTimer.paused = true;
      }

      if (this.bossTimer) {
        this.bossTimer.paused = true;
      }

      if (this.finalBossAttackTimer) {
        this.finalBossAttackTimer.paused = true;
      }

      if (this.spearTimer) {
        this.spearTimer.paused = true;
      }

      if (this.chainTimer) {
        this.chainTimer.paused = true;
      }

      if (this.mistTimer) {
        this.mistTimer.paused = true;
      }

      if (this.bladeTimer) {
        this.bladeTimer.paused = true;
      }

      if (this.discTimer) {
        this.discTimer.paused = true;
      }

      this.destroyBeamSweep();
      this.destroyBossAidAllies();

      const summary = this.createRunSummary(cleared, settings.defeatedBy);

      if (cleared && !this.isBossRushTestMode) {
        const saved = window.KoreanSurvivorGame.runHistory.saveClearLog(summary);
        summary.savedRank = saved.rank;
        summary.logId = saved.log.id;
        summary.logSaved = true;
      } else {
        summary.savedRank = 0;
        summary.logId = "";
        summary.logSaved = false;
      }

      this.scene.start("ResultScene", summary);
    }
  }

  window.KoreanSurvivorGame = window.KoreanSurvivorGame || {};
  window.KoreanSurvivorGame.ArenaScene = ArenaScene;
})();
