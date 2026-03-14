(function () {
  class ArenaScene extends Phaser.Scene {
    constructor() {
      super("ArenaScene");
    }

    create() {
      const gameData = window.KoreanSurvivorGame;
      const ui = gameData.ui;

      this.font = gameData.fontFamily;
      this.vocabData = gameData.vocabData;
      this.roundSeconds = 90;
      this.timeRemaining = this.roundSeconds;
      this.stageCount = Math.max(1, (this.vocabData.stages || []).length || 1);
      this.currentStageIndex = 0;
      this.currentStageData = null;
      this.stagesCleared = 0;
      this.pendingStageIndex = null;
      this.stageTransitionOverlay = null;
      this.stageRecoveryAmount = 12;
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
      this.roundEnded = false;
      this.isLevelUp = false;
      this.playerInvulnerableUntil = 0;
      this.feedbackUntil = 0;
      this.transformUntil = 0;
      this.isMagnetCollecting = false;

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
      this.pierceLevel = 0;
      this.linkLevel = 0;
      this.splitLevel = 0;
      this.amplifyLevel = 0;
      this.durationLevel = 0;
      this.siphonLevel = 0;
      this.trackingLevel = 0;
      this.blastLevel = 0;
      this.fireOrbs = [];
      this.shieldOrbs = [];
      this.mistZones = [];
      this.enemyIdCounter = 0;
      this.upgradeLevels = {};

      (this.vocabData.upgrades || []).forEach((upgrade) => {
        this.upgradeLevels[upgrade.key] = 0;
      });

      ui.drawBackdrop(this);
      this.physics.world.setBounds(0, 0, 720, 1280);

      this.enemies = this.physics.add.group();
      this.bullets = this.physics.add.group();
      this.enemyProjectiles = this.physics.add.group();
      this.pickups = this.physics.add.group();
      this.fireOrbGroup = this.physics.add.group();
      this.shieldOrbGroup = this.physics.add.group();

      this.player = this.physics.add.image(360, 860, "player");
      this.player.setCircle(23, 4, 4);
      this.player.setCollideWorldBounds(true);
      this.player.setDepth(5);

      this.auraRing = this.add.circle(360, 860, 46, 0x8ad3ff, 0.08).setStrokeStyle(3, 0x8ad3ff, 0.55).setVisible(false).setDepth(4);
      this.awakeningRing = this.add.circle(360, 860, 56, 0xffd166, 0.06).setStrokeStyle(5, 0xfff0b5, 0.72).setVisible(false).setDepth(6);
      this.magnetField = this.add.circle(360, 860, 74, 0x89ecff, 0.05).setStrokeStyle(4, 0xcff8ff, 0.68).setVisible(false).setDepth(6);
      this.magnetLinks = this.add.graphics().setDepth(3);
      this.touchRing = this.add.circle(0, 0, 34, 0xffffff, 0.06).setStrokeStyle(2, 0xffffff, 0.12).setVisible(false).setDepth(30);
      this.touchDot = this.add.circle(0, 0, 10, 0xffffff, 0.2).setVisible(false).setDepth(31);

      this.createHud();

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
      this.applyStageData(0, { skipSpawns: false, silent: false });
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

      this.stageText = this.add.text(284, 62, "1단계 감정", {
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

    colorToHex(colorValue) {
      return `#${(colorValue || 0xffffff).toString(16).padStart(6, "0")}`;
    }

    getStageData(index) {
      const stages = this.vocabData.stages || [];

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
      this.refreshStageTimers();

      if (!settings.silent) {
        this.showFeedback(stage.introMessage || this.getCurrentStageTitle(), this.colorToHex(stage.accentColor));
        this.showFloatingText(360, 250, this.getCurrentStageTitle(), this.colorToHex(stage.accentColor), "34px");
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

      if (this.roundEnded || this.finalBossPhase) {
        return;
      }

      const stage = this.getCurrentStageData();

      if (!stage) {
        return;
      }

      this.enemyTimer = this.time.addEvent({
        delay: stage.spawnDelay || 760,
        callback: this.spawnNegativeEnemy,
        callbackScope: this,
        loop: true,
      });

      this.bossTimer = this.time.addEvent({
        delay: stage.miniBossDelay || 20000,
        callback: this.spawnMiniBoss,
        callbackScope: this,
        loop: true,
      });
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
    }

    openStageTransition(nextStageIndex) {
      const nextStage = this.getStageData(nextStageIndex);

      if (!nextStage) {
        return;
      }

      const ui = window.KoreanSurvivorGame.ui;
      const overlayItems = [];

      this.pendingStageIndex = nextStageIndex;
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
      overlayItems.push(ui.addPanel(this, 360, 666, 612, 760, 1).setDepth(41));

      overlayItems.push(this.add.text(360, 290, `${this.currentStageIndex + 1}단계 클리어`, {
        fontFamily: this.font,
        fontSize: "44px",
        fontStyle: "900",
        color: "#fff7ef",
      }).setOrigin(0.5).setDepth(42));

      overlayItems.push(this.add.text(360, 344, `다음 스테이지: ${nextStageIndex + 1}단계 ${nextStage.label}`, {
        fontFamily: this.font,
        fontSize: "30px",
        fontStyle: "800",
        color: this.colorToHex(nextStage.accentColor),
      }).setOrigin(0.5).setDepth(42));

      overlayItems.push(this.add.text(360, 396, nextStage.introMessage || "", {
        fontFamily: this.font,
        fontSize: "24px",
        fontStyle: "700",
        color: "#dce8f1",
        align: "center",
        wordWrap: { width: 500 },
      }).setOrigin(0.5).setDepth(42));

      overlayItems.push(this.add.text(360, 440, nextStage.introViMessage || "", {
        fontFamily: this.font,
        fontSize: "18px",
        color: "#8db0a8",
        align: "center",
        wordWrap: { width: 520 },
      }).setOrigin(0.5).setDepth(42));

      overlayItems.push(this.add.text(360, 544, `${this.stageRecoveryAmount} 회복 · 적 역할 강화`, {
        fontFamily: this.font,
        fontSize: "22px",
        fontStyle: "800",
        color: "#bff2c2",
      }).setOrigin(0.5).setDepth(42));

      overlayItems.push(this.add.text(360, 602, `${nextStage.label} 테마 단어와 더 강한 적이 등장합니다.`, {
        fontFamily: this.font,
        fontSize: "20px",
        color: "#a7bfd0",
        align: "center",
        wordWrap: { width: 520 },
      }).setOrigin(0.5).setDepth(42));

      const button = ui.createButton(this, {
        x: 360,
        y: 876,
        width: 460,
        height: 90,
        label: "다음 스테이지",
        fontSize: "30px",
        onClick: () => this.startNextStage(nextStageIndex),
      });
      button.setDepth(43);
      overlayItems.push(button);

      this.stageTransitionOverlay = overlayItems;
      this.refreshHud();
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

    completeCurrentStage() {
      const clearedStageNumber = this.currentStageIndex + 1;

      this.stagesCleared = Math.max(this.stagesCleared, clearedStageNumber);

      if (clearedStageNumber >= this.stageCount) {
        this.startFinalBossPhase();
        return;
      }

      this.showFeedback(`${this.getCurrentStageTitle()} 돌파`, this.colorToHex(this.getCurrentStageData().accentColor));
      this.openStageTransition(clearedStageNumber);
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
      let x = 0;
      let y = 0;

      if (side === 0) {
        x = -margin;
        y = Phaser.Math.Between(210, 1220);
      } else if (side === 1) {
        x = 720 + margin;
        y = Phaser.Math.Between(210, 1220);
      } else if (side === 2) {
        x = Phaser.Math.Between(0, 720);
        y = 200;
      } else {
        x = Phaser.Math.Between(0, 720);
        y = 1280 + margin;
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
      if (this.roundEnded || this.isLevelUp || this.finalBossPhase) {
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
            if (!this.roundEnded && !this.isLevelUp && !this.finalBossPhase) {
              this.createNegativeEnemy(archetypeKey, spawn.x, spawn.y);
            }
          });
        }
      }

      if (
        this.timeRemaining < 60 &&
        archetypeKey !== "swarm" &&
        Phaser.Math.Between(0, 100) < (stage.extraSpawnChance || 36)
      ) {
        this.time.delayedCall(120, () => {
          if (!this.roundEnded && !this.isLevelUp && !this.finalBossPhase) {
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
      if (this.roundEnded || this.isLevelUp || this.finalBossPhase || this.hasActiveBoss()) {
        return;
      }

      const stage = this.getCurrentStageData();
      const defs = stage && stage.bossWords ? stage.bossWords : [];

      if (!defs.length) {
        return;
      }

      const definition = defs[Phaser.Math.Between(0, defs.length - 1)];
      const x = Phaser.Math.Between(160, 560);
      const y = 224;

      const boss = this.enemies.create(x, y, definition.texture || "boss-pill");
      boss.setDisplaySize(definition.displayWidth || 224, definition.displayHeight || 88);
      boss.setTint(definition.color);
      boss.setDepth(2);
      boss.enemyId = (this.enemyIdCounter += 1);
      boss.enemyKind = "boss";
      boss.word = definition.word;
      boss.motion = definition.motion || "";
      boss.hp = Math.max(1, Math.round(
        (definition.hp + Math.floor((this.roundSeconds - this.timeRemaining) / 10)) *
        (stage.bossHpMultiplier || 1)
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
      this.attachEnemyHealthBar(boss, definition.hpBarWidth || 144, definition.hpBarOffsetY || 56);

      this.showFeedback(`에픽 몬스터 등장: ${definition.word}`, "#ffb7a1");
      this.wordBurst(boss.x, boss.y, 0xffb7a1);
    }

    startFinalBossPhase() {
      if (this.finalBossPhase || this.roundEnded) {
        return;
      }

      this.stagesCleared = Math.max(this.stagesCleared, this.stageCount);
      this.finalBossPhase = true;
      this.finalBossIntroUntil = this.time.now + 1700;
      this.timeRemaining = 0;

      if (this.enemyTimer) {
        this.enemyTimer.paused = true;
      }

      if (this.bossTimer) {
        this.bossTimer.paused = true;
      }

      this.clearCombatField();
      this.showFeedback(`최종 보스 등장: ${this.vocabData.finalBoss.word}`, "#ffb3ad");
      this.showFloatingText(360, 276, this.vocabData.finalBoss.word, "#ffd0c4", "44px");
      this.wordBurst(360, 340, 0xffb8ad);
      this.cameras.main.flash(220, 255, 142, 124, false);

      this.spawnFinalBoss();
      this.refreshHud();
    }

    spawnFinalBoss() {
      const definition = this.vocabData.finalBoss;
      const stage = this.getCurrentStageData();
      const hpMultiplier = stage ? Math.max(1.1, stage.bossHpMultiplier || 1) : 1.1;
      const speedMultiplier = stage ? Math.max(1.06, stage.bossSpeedMultiplier || 1) : 1.06;
      const damageMultiplier = stage ? Math.max(1.08, stage.bossDamageMultiplier || 1) : 1.08;
      const boss = this.enemies.create(360, 268, definition.texture || "final-boss-core");
      boss.setDisplaySize(definition.displayWidth || 278, definition.displayHeight || 156);
      boss.setTint(definition.color);
      boss.setDepth(2);
      boss.enemyId = (this.enemyIdCounter += 1);
      boss.enemyKind = "finalBoss";
      boss.word = definition.word;
      boss.hp = Math.round(definition.hp * hpMultiplier);
      boss.maxHp = boss.hp;
      boss.speed = Math.round(definition.speed * speedMultiplier);
      boss.scoreValue = Math.round((definition.score || 2600) * 1.2);
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
      this.attachEnemyHealthBar(boss, definition.hpBarWidth || 206, definition.hpBarOffsetY || 90);

      this.finalBoss = boss;
      this.finalBossSpawned = true;

      if (this.finalBossAttackTimer) {
        this.finalBossAttackTimer.remove(false);
      }

      this.finalBossAttackTimer = this.time.addEvent({
        delay: 1850,
        callback: this.executeFinalBossAttack,
        callbackScope: this,
        loop: true,
      });
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

      for (let index = -3; index <= 3; index += 1) {
        const angle = baseAngle + index * 0.14;
        this.spawnFinalBossProjectile(boss.x, boss.y + 16, angle, 340, attack);
      }
    }

    castFinalBossNova(boss) {
      const attack = this.vocabData.finalBossAttacks.nova;
      this.showFloatingText(boss.x, boss.y - 96, attack.word, "#ffd1ea", "24px");

      for (let index = 0; index < 14; index += 1) {
        const angle = (Math.PI * 2 * index) / 14 + (this.finalBossPatternIndex % 2) * 0.08;
        this.spawnFinalBossProjectile(boss.x, boss.y + 8, angle, 260, attack);
      }
    }

    castFinalBossMeteor(boss) {
      const attack = this.vocabData.finalBossAttacks.meteor;
      const targets = [
        { x: this.player.x, y: this.player.y },
        { x: Phaser.Math.Clamp(this.player.x + Phaser.Math.Between(-110, 110), 90, 630), y: Phaser.Math.Clamp(this.player.y + Phaser.Math.Between(-120, 120), 240, 1180) },
        { x: Phaser.Math.Between(110, 610), y: Phaser.Math.Between(280, 1120) },
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

          if (distance <= 64 && !this.roundEnded && !this.isLevelUp) {
            this.applyPlayerDamage(attack.damage, target.x, target.y, `${attack.word} 낙하`);
          }
        });
      });
    }

    castFinalBossDash(boss) {
      const attack = this.vocabData.finalBossAttacks.dash;
      const angle = Phaser.Math.Angle.Between(boss.x, boss.y, this.player.x, this.player.y);
      boss.dashUntil = this.time.now + 520;
      this.physics.velocityFromRotation(angle, 520, boss.body.velocity);
      this.showFloatingText(boss.x, boss.y - 96, attack.word, "#ffb9b0", "24px");

      this.time.delayedCall(540, () => {
        if (!boss.active) {
          return;
        }

        boss.dashUntil = 0;
        for (let index = 0; index < 8; index += 1) {
          const shotAngle = angle - 0.72 + index * 0.18;
          this.spawnFinalBossProjectile(boss.x, boss.y + 10, shotAngle, 300, {
            word: attack.word,
            damage: attack.damage,
            color: attack.color,
            texture: "final-bullet-fracture",
            scale: 1.04,
            spin: 0.006,
          });
        }
      });
    }

    spawnFinalBossProjectile(x, y, angle, speed, attack) {
      const projectile = this.enemyProjectiles.create(x, y, attack.texture || "final-bullet-fracture");
      projectile.setDepth(3);
      projectile.setTint(attack.color);
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

    getUpgradeLevel(key) {
      return this.upgradeLevels && this.upgradeLevels[key] ? this.upgradeLevels[key] : 0;
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
      projectile.blastDamage = settings.blastDamage || 0;
      projectile.homingStrength = settings.homingStrength || 0;
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

      const target = this.findNearestEnemyFromPoint(this.player.x, this.player.y, this.attackRange + 180);

      if (!target) {
        return;
      }

      const baseAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, target.x, target.y);
      const count = 1 + Math.floor((this.spearLevel - 1) / 2) + Math.min(2, this.splitLevel);
      const damage = Math.max(2, Math.round((3 + this.spearLevel * 1.6) * this.getWeaponAmplifyMultiplier()));
      const pierce = 1 + Math.floor(this.spearLevel / 2) + this.pierceLevel;
      const chainJumps = this.linkLevel > 0 ? 1 + Math.floor(this.linkLevel / 2) : 0;
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
          blastDamage: this.blastLevel > 0 ? 1 + this.blastLevel : 0,
          homingStrength: this.getTrackingStrength(),
          tintColor: 0xffdf9c,
        });
      });
    }

    castChainWeapon() {
      if (this.roundEnded || this.isLevelUp || this.chainLevel <= 0) {
        return;
      }

      const startTarget = this.findNearestEnemyFromPoint(this.player.x, this.player.y, this.attackRange + 220);

      if (!startTarget) {
        return;
      }

      const hitIds = new Set();
      const maxHits = 2 + this.chainLevel + this.linkLevel;
      const chainDamage = Math.max(2, Math.round((2 + this.chainLevel * 1.3) * this.getWeaponAmplifyMultiplier()));
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
          this.recordDamageDealt(step.enemy, chainDamage);
          step.enemy.hp -= chainDamage;
          step.enemy.setAlpha(0.76);

          this.time.delayedCall(90, () => {
            if (step.enemy.active) {
              step.enemy.setAlpha(1);
            }
          });

          if (this.blastLevel > 0) {
            this.triggerWeaponBlast(step.enemy.x, step.enemy.y, 56 + this.blastLevel * 6, 1 + this.blastLevel, step.enemy);
          }

          if (step.enemy.hp <= 0) {
            this.defeatEnemy(step.enemy);
          }
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
          this.recordDamageDealt(step.enemy, damage);
          step.enemy.hp -= damage;
          step.enemy.setAlpha(0.8);

          this.time.delayedCall(80, () => {
            if (step.enemy.active) {
              step.enemy.setAlpha(1);
            }
          });

          if (this.blastLevel > 0) {
            this.triggerWeaponBlast(step.enemy.x, step.enemy.y, 48 + this.blastLevel * 5, 1 + this.blastLevel, step.enemy);
          }

          if (step.enemy.hp <= 0) {
            this.defeatEnemy(step.enemy);
          }
        });
      });
    }

    syncShieldWeapon() {
      const orbCount = this.shieldWeaponLevel <= 0 ? 0 : 1 + Math.floor((this.shieldWeaponLevel - 1) / 2);

      while (this.shieldOrbs.length > orbCount) {
        const orb = this.shieldOrbs.pop();
        orb.destroy();
      }

      while (this.shieldOrbs.length < orbCount) {
        const orb = this.shieldOrbGroup.create(this.player.x, this.player.y, "shield-orb");
        orb.setDepth(4);
        orb.body.setCircle(14, 7, 7);
        this.shieldOrbs.push(orb);
      }
    }

    spawnMistZone() {
      if (this.roundEnded || this.isLevelUp || this.mistLevel <= 0) {
        return;
      }

      const target = this.findNearestEnemyFromPoint(this.player.x, this.player.y, this.attackRange + 260);
      const zoneX = target ? target.x : Phaser.Math.Clamp(this.player.x + Phaser.Math.Between(-110, 110), 80, 640);
      const zoneY = target ? target.y : Phaser.Math.Clamp(this.player.y + Phaser.Math.Between(-120, 120), 240, 1180);
      const maxZones = 1 + Math.floor((this.mistLevel + this.durationLevel) / 2);

      while (this.mistZones.length >= maxZones) {
        const oldest = this.mistZones.shift();

        if (oldest && oldest.sprite) {
          oldest.sprite.destroy();
        }
      }

      const sprite = this.add.image(zoneX, zoneY, "mist-cloud")
        .setTint(0xcde9ff)
        .setAlpha(0.36)
        .setDepth(2);
      const zone = {
        sprite: sprite,
        x: zoneX,
        y: zoneY,
        radius: 84 + this.mistLevel * 14 + this.durationLevel * 12,
        tickDamage: Math.max(1, Math.round((0.7 + this.mistLevel * 0.55) * this.getWeaponAmplifyMultiplier())),
        tickEvery: 260,
        nextTickAt: this.time.now,
        expiresAt: this.time.now + 2200 + this.mistLevel * 260 + this.durationLevel * 720,
      };

      sprite.setScale(zone.radius / 96);
      this.mistZones.push(zone);
    }

    triggerWeaponBlast(x, y, radius, damage, sourceEnemy) {
      if (this.blastLevel <= 0 || this.roundEnded) {
        return;
      }

      const baseScale = Math.max(0.3, radius / 150);
      const blast = this.add.image(x, y, "weapon-blast-wave")
        .setTint(0xffd48b)
        .setAlpha(0.46)
        .setScale(baseScale)
        .setDepth(6);

      this.tweens.add({
        targets: blast,
        alpha: 0,
        scale: baseScale * 1.28,
        duration: 180,
        onComplete: () => blast.destroy(),
      });

      this.enemies.children.iterate((enemy) => {
        if (!enemy || !enemy.active || enemy === sourceEnemy) {
          return;
        }

        const distance = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);

        if (distance > radius) {
          return;
        }

        this.recordDamageDealt(enemy, damage);
        enemy.hp -= damage;
        enemy.setAlpha(0.8);

        this.time.delayedCall(70, () => {
          if (enemy.active) {
            enemy.setAlpha(1);
          }
        });

        if (enemy.hp <= 0) {
          this.defeatEnemy(enemy);
        }
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
        if (!pickup || !pickup.active || pickup.isMagnetized) {
          return;
        }

        const distance = Phaser.Math.Distance.Between(x, y, pickup.x, pickup.y);

        if (distance <= 90 + this.siphonLevel * 24) {
          this.isMagnetCollecting = true;
          this.magnetizePickup(pickup);
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
      const count = 1 + Math.min(2, this.splitLevel);
      const bulletDamage = Math.max(1, Math.round(this.getActiveAttackDamage() * this.getWeaponAmplifyMultiplier()));
      const chainJumps = this.linkLevel > 0 ? 1 + Math.floor(this.linkLevel / 2) : 0;
      const angles = this.buildSpreadAngles(angle, count, 0.16);

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
          remainingPierce: this.pierceLevel,
          chainJumps: chainJumps,
          blastDamage: this.blastLevel > 0 ? 1 + this.blastLevel : 0,
          homingStrength: this.getTrackingStrength(),
          tintColor: 0xfff0c4,
        });
        bullet.setScale(1 + (bulletDamage - 1) * 0.08 + this.amplifyLevel * 0.04);
      });
    }

    getNearestEnemyInRange() {
      return this.findNearestEnemyFromPoint(this.player.x, this.player.y, this.attackRange);
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

    tryBossShot(enemy) {
      if (!enemy.active || enemy.enemyKind !== "boss" || this.roundEnded || this.isLevelUp) {
        return;
      }

      const now = this.time.now;

      if ((enemy.nextShotAt || 0) > now) {
        return;
      }

      const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);

      if (distance > 620) {
        enemy.nextShotAt = now + 260;
        return;
      }

      const attack = this.pickRandomBossProjectile(enemy);
      const projectile = this.enemyProjectiles.create(enemy.x, enemy.y + 10, attack.texture || "enemy-bullet");
      projectile.setDepth(3);
      projectile.setTint(attack.color);
      projectile.attackWord = attack.word;
      projectile.damage = attack.damage + Math.floor((this.roundSeconds - this.timeRemaining) / 24);
      projectile.lifespan = 3200;
      projectile.rotationSpeed = attack.spin || 0;
      projectile.setScale(attack.scale || 1);
      projectile.body.setCircle(10, 2, 2);

      const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
      const speed = 260 + Math.min(90, (this.roundSeconds - this.timeRemaining) * 0.8);
      this.physics.velocityFromRotation(angle, speed, projectile.body.velocity);
      projectile.rotation = angle;

      enemy.nextShotAt = now + Phaser.Math.Between(1600, 2400);
      this.showFloatingText(enemy.x, enemy.y - 64, attack.word, "#ffd1c7", "18px");

      const flare = this.add.circle(enemy.x, enemy.y + 8, 18, attack.color, 0.26).setDepth(5);
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
      const stageThemeTrail = (this.vocabData.stages || [])
        .slice(0, stageReached)
        .map((stage) => stage.label);

      return {
        cleared: cleared,
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

      this.recordDamageDealt(enemy, bullet.damage || 1);
      enemy.hp -= bullet.damage || 1;
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

      if ((bullet.blastDamage || 0) > 0) {
        this.triggerWeaponBlast(
          enemy.x,
          enemy.y,
          52 + this.blastLevel * 6 + (bullet.weaponType === "spear" ? 10 : 0),
          bullet.blastDamage,
          enemy
        );
      }

      if (enemy.hp <= 0) {
        this.defeatEnemy(enemy);
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

      if ((enemy.lastFireHitAt || 0) + 240 > now) {
        return;
      }

      enemy.lastFireHitAt = now;
      const fireDamage = Math.max(1, Math.round(
        (1 + Math.floor((this.fireLevel - 1) / 2) + (this.isAwakeningActive() ? 1 : 0)) * this.getWeaponAmplifyMultiplier()
      ));
      this.recordDamageDealt(enemy, fireDamage);
      enemy.hp -= fireDamage;
      enemy.setAlpha(0.82);

      this.time.delayedCall(80, () => {
        if (enemy.active) {
          enemy.setAlpha(1);
        }
      });

      if (this.blastLevel > 0 && this.fireLevel >= 3) {
        this.triggerWeaponBlast(enemy.x, enemy.y, 46 + this.blastLevel * 5, 1 + this.blastLevel, enemy);
      }

      if (enemy.hp <= 0) {
        this.defeatEnemy(enemy);
      }
    }

    handleShieldHit(orb, enemy) {
      if (!orb.active || !enemy.active || this.roundEnded || this.isLevelUp || this.shieldWeaponLevel <= 0) {
        return;
      }

      const now = this.time.now;

      if ((enemy.lastShieldHitAt || 0) + 280 > now) {
        return;
      }

      enemy.lastShieldHitAt = now;
      const shieldDamage = Math.max(1, Math.round(
        (1 + this.shieldWeaponLevel * 0.8 + (this.isAwakeningActive() ? 1 : 0)) * this.getWeaponAmplifyMultiplier()
      ));
      this.recordDamageDealt(enemy, shieldDamage);
      enemy.hp -= shieldDamage;
      enemy.setAlpha(0.78);
      this.pushEnemy(enemy, this.isBossEnemy(enemy) ? 180 : 240, 180 + this.shieldWeaponLevel * 24);

      this.time.delayedCall(90, () => {
        if (enemy.active) {
          enemy.setAlpha(1);
        }
      });

      if (this.blastLevel > 0 && this.shieldWeaponLevel >= 3) {
        this.triggerWeaponBlast(enemy.x, enemy.y, 50 + this.blastLevel * 5, 1 + this.blastLevel, enemy);
      }

      if (enemy.hp <= 0) {
        this.defeatEnemy(enemy);
      }
    }

    handleShieldProjectileHit(_, projectile) {
      if (!projectile.active || this.roundEnded || this.isLevelUp || this.shieldWeaponLevel < 2) {
        return;
      }

      this.showFloatingText(projectile.x, projectile.y - 18, "방패", "#d9ecff", "16px");
      this.wordBurst(projectile.x, projectile.y, 0xb9deff);
      projectile.destroy();
    }

    defeatEnemy(enemy, options) {
      const settings = options || {};
      const isMiniBoss = enemy.enemyKind === "boss";
      const isFinalBoss = enemy.enemyKind === "finalBoss";
      const isBoss = isMiniBoss || isFinalBoss;

      if (isFinalBoss) {
        this.finalBossDefeated = true;
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

      this.negativeClears += isBoss ? 3 : 1;
      this.score += enemy.scoreValue;
      this.experience += isBoss ? 32 : 8;
      this.gainAwakeningCharge(isBoss ? 48 : 14);

      if (isMiniBoss) {
        this.bossDefeats += 1;
        if (!settings.skipBossFeedback) {
          this.showFeedback(`${enemy.word} 처치`, "#ffcf9f");
        }

        for (let index = 0; index < 4; index += 1) {
          this.spawnPickup(
            enemy.x + Phaser.Math.Between(-36, 36),
            enemy.y + Phaser.Math.Between(-20, 20),
            true
          );
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

      if (!settings.deferLevelCheck) {
        this.checkLevelUp();
      }
    }

    spawnPickup(x, y, forceDrop) {
      const dropChance = 0.5 + this.pickupLuck;

      if (!forceDrop && Phaser.Math.FloatBetween(0, 1) > dropChance) {
        return;
      }

      const definition = this.pickRandomPickup();
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
        if (pickup && pickup.active && !pickup.isMagnetized) {
          this.magnetizePickup(pickup);
          magnetizedCount += 1;
        }
      });

      if (!magnetizedCount && !wasCollecting) {
        this.finishMagnetCollection();
      }
    }

    magnetizePickup(pickup) {
      if (!pickup || !pickup.active || pickup.isMagnetized) {
        return;
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
        if (enemy && enemy.active && enemy.enemyKind !== "finalBoss") {
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

      this.enemyProjectiles.clear(true, true);
      this.activateMagnet({ sourceWord: "청소", sourceX: this.player.x, sourceY: this.player.y });
      this.refreshHud();
      this.checkLevelUp();
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
          this.recordDamageDealt(enemy, 7);
          enemy.hp -= 7;
          this.pushEnemy(enemy, 280, 240);

          if (enemy.hp <= 0) {
            this.defeatEnemy(enemy);
          }
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
          this.recordDamageDealt(enemy, 3);
          enemy.hp -= 3;
          this.pushEnemy(enemy, 180, 180);

          if (enemy.hp <= 0) {
            this.defeatEnemy(enemy);
          }
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
      const orbCount = Math.min(3, this.fireLevel);

      while (this.fireOrbs.length > orbCount) {
        const orb = this.fireOrbs.pop();
        orb.destroy();
      }

      while (this.fireOrbs.length < orbCount) {
        const orb = this.fireOrbGroup.create(this.player.x, this.player.y, "fire-orb");
        orb.setDepth(4);
        orb.body.setCircle(11, 4, 4);
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
        const card = this.add.image(positions[index], 730, "upgrade-card").setDisplaySize(188, 274).setDepth(41);
        card.setInteractive({ useHandCursor: true });

        const kindText = this.add.text(positions[index], 588, upgrade.kindLabel || "기본", {
          fontFamily: this.font,
          fontSize: "15px",
          fontStyle: "800",
          color: upgrade.kind === "weapon" ? "#9cd6ff" : upgrade.kind === "trait" ? "#d7c2ff" : "#ffd9a8",
        }).setOrigin(0.5).setDepth(42);

        const title = this.add.text(positions[index], 630, upgrade.label, {
          fontFamily: this.font,
          fontSize: "34px",
          fontStyle: "800",
          color: "#ffcb92",
        }).setOrigin(0.5).setDepth(42);

        const viTitle = this.add.text(positions[index], 670, upgrade.viLabel || "", {
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
          wordWrap: { width: 142, useAdvancedWrap: true },
        }).setOrigin(0.5).setDepth(42);

        const viDesc = this.add.text(positions[index], 792, upgrade.viDescription || "", {
          fontFamily: this.font,
          fontSize: "15px",
          color: "#a4c9b7",
          align: "center",
          wordWrap: { width: 146, useAdvancedWrap: true },
        }).setOrigin(0.5).setDepth(42);

        const tip = this.add.text(positions[index], 842, `Lv ${currentLevel + 1}/${upgrade.maxLevel || 1} · ${upgrade.viKindLabel || ""}`, {
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
      } else if (upgrade.key === "pierce") {
        this.pierceLevel = this.getUpgradeLevel("pierce");
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

      if (this.mistTimer) {
        this.mistTimer.paused = paused;
      }

      if (this.finalBossAttackTimer) {
        this.finalBossAttackTimer.paused = paused;
      }
    }

    castLightning() {
      if (this.roundEnded || this.isLevelUp || this.lightningLevel <= 0) {
        return;
      }

      const activeEnemies = [];

      this.enemies.children.iterate((enemy) => {
        if (enemy && enemy.active) {
          activeEnemies.push(enemy);
        }
      });

      if (!activeEnemies.length) {
        return;
      }

      const strikeCount = Math.min(5, 1 + Math.floor((this.lightningLevel - 1) / 2) + Math.floor(this.linkLevel / 2));
      const targets = Phaser.Utils.Array.Shuffle(activeEnemies).slice(0, strikeCount);

      targets.forEach((enemy, index) => {
        this.time.delayedCall(index * 70, () => {
          if (!enemy.active) {
            return;
          }

          const damage = Math.max(1, Math.round(
            (2 + this.lightningLevel + (this.isAwakeningActive() ? 1 : 0)) * this.getWeaponAmplifyMultiplier()
          ));
          this.recordDamageDealt(enemy, damage);
          enemy.hp -= damage;
          this.drawLightning(enemy.x, enemy.y);

          if (this.blastLevel > 0) {
            this.triggerWeaponBlast(enemy.x, enemy.y, 52 + this.blastLevel * 6, 1 + this.blastLevel, enemy);
          }

          if (enemy.hp <= 0) {
            this.defeatEnemy(enemy);
          }
        });
      });
    }

    castWavePulse() {
      if (this.roundEnded || this.isLevelUp || this.waveLevel <= 0) {
        return;
      }

      const radius = 120 + this.waveLevel * 22 + this.durationLevel * 12;
      const damage = Math.max(1, Math.round(
        (1 + this.waveLevel + (this.isAwakeningActive() ? 1 : 0)) * this.getWeaponAmplifyMultiplier()
      ));
      const ring = this.add.circle(this.player.x, this.player.y, 18, 0x8edbff, 0.08)
        .setStrokeStyle(4, 0x8edbff, 0.82)
        .setDepth(6);

      this.tweens.add({
        targets: ring,
        radius: radius,
        alpha: 0,
        duration: 260 + this.durationLevel * 40,
        ease: "Cubic.out",
        onComplete: () => ring.destroy(),
      });

      this.enemies.children.iterate((enemy) => {
        if (!enemy || !enemy.active) {
          return;
        }

        const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);

        if (distance <= radius) {
          this.recordDamageDealt(enemy, damage);
          enemy.hp -= damage;
          enemy.setAlpha(0.8);

          this.time.delayedCall(90, () => {
            if (enemy.active) {
              enemy.setAlpha(1);
            }
          });

          if (enemy.hp <= 0) {
            this.defeatEnemy(enemy);
          }
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
      if (!enemy || !enemy.active || !this.isBossEnemy(enemy)) {
        return;
      }

      const time = this.time.now;

      if (enemy.motion === "despair") {
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

    refreshHud() {
      const stage = this.getCurrentStageData();
      const nextStage = this.getStageData(this.currentStageIndex + 1);

      this.hpBarFill.width = 170 * Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);
      this.hpBarFill.fillColor = this.hp > this.maxHp * 0.5 ? 0x5ce0a0 : this.hp > this.maxHp * 0.25 ? 0xffc857 : 0xff7b71;
      this.levelText.setText(`레벨 ${this.level}`);
      this.stageText.setText(this.getCurrentStageTitle());
      this.stageText.setColor(this.colorToHex(stage ? stage.accentColor : 0xffcb92));
      this.timeText.setText(this.finalBossPhase ? "FINAL" : `${Math.ceil(this.timeRemaining)}s`);
      this.timeText.setColor(this.finalBossPhase ? "#ffb0a8" : this.timeRemaining <= 12 ? "#ffb8b0" : "#f8fcff");
      this.scoreText.setText(String(this.score));
      this.xpBarFill.width = 524 * Phaser.Math.Clamp(this.experience / this.nextLevelExperience, 0, 1);
      this.phaseText.setText(
        this.finalBossPhase
          ? `${this.vocabData.finalBoss.word} 토벌전`
          : this.timeRemaining <= 12
            ? (nextStage ? `곧 ${nextStage.label}` : "최종 보스가 다가옵니다")
            : (stage ? stage.viLabel : "")
      );
      this.phaseText.setColor(this.finalBossPhase ? "#ffc8b0" : this.timeRemaining <= 12 ? "#ffd9b0" : "#9fb4c6");
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
      const worldPoint = pointer.positionToCamera(this.cameras.main);

      if (this.isLevelUp) {
        this.player.body.setVelocity(0, 0);
        this.touchRing.setVisible(false);
        this.touchDot.setVisible(false);
        this.magnetLinks.clear();
        this.magnetField.setVisible(false);
        this.updateFireOrbs(delta);
        this.updateShieldOrbs(delta);
        this.updateLabels();
        return;
      }

      if (pointer.isDown) {
        this.touchRing.setPosition(worldPoint.x, worldPoint.y).setVisible(true);
        this.touchDot.setPosition(worldPoint.x, worldPoint.y).setVisible(true);

        const dx = worldPoint.x - this.player.x;
        const dy = worldPoint.y - this.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const moveSpeed = this.getMovementSpeed();

        if (distance > 10) {
          this.player.body.setVelocity((dx / distance) * moveSpeed, (dy / distance) * moveSpeed);
        } else {
          this.player.body.setVelocity(0, 0);
        }
      } else {
        this.touchRing.setVisible(false);
        this.touchDot.setVisible(false);
        this.player.body.setVelocity(0, 0);
      }

      this.elapsedSeconds += delta / 1000;

      if (!this.finalBossPhase) {
        this.timeRemaining = Math.max(0, this.timeRemaining - delta / 1000);
      } else {
        this.timeRemaining = 0;
      }

      this.updateBullets(delta);
      this.updateEnemies();
      this.updateFireOrbs(delta);
      this.updateShieldOrbs(delta);
      this.updateMistZones();
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

      if (this.isTransformActive()) {
        const morphPulse = 1.1 + Math.abs(Math.sin(this.time.now * 0.016)) * 0.14;
        this.player.setScale(morphPulse);
        this.player.setTint(0xffd6fb);
      } else if (this.time.now >= this.playerInvulnerableUntil) {
        this.player.setScale(1);
        this.player.clearTint();
      } else {
        this.player.setScale(1);
      }

      if (this.time.now > this.feedbackUntil) {
        this.feedbackText.setText("");
      }

      if (!this.isMagnetCollecting) {
        this.magnetField.setVisible(false);
        this.magnetLinks.clear();
      }

      this.refreshHud();

      if (!this.finalBossPhase && this.timeRemaining <= 0) {
        this.completeCurrentStage();
      }
    }

    updateBullets(delta) {
      this.bullets.children.iterate((bullet) => {
        if (!bullet || !bullet.active) {
          return;
        }

        bullet.lifespan -= delta;

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

        if (bullet.lifespan <= 0 || bullet.x < -40 || bullet.x > 760 || bullet.y < -40 || bullet.y > 1320) {
          bullet.destroy();
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
          projectile.x < -60 ||
          projectile.x > 780 ||
          projectile.y < -60 ||
          projectile.y > 1340
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

      this.fireAngle += delta * 0.0032;
      const radius = 74 + Math.min(this.fireLevel, 3) * 10;

      this.fireOrbs.forEach((orb, index) => {
        const angle = this.fireAngle + (Math.PI * 2 * index) / this.fireOrbs.length;
        const x = this.player.x + Math.cos(angle) * radius;
        const y = this.player.y + Math.sin(angle) * radius;
        orb.setPosition(x, y);
        orb.setScale(1 + this.amplifyLevel * 0.05);
      });
    }

    updateShieldOrbs(delta) {
      if (!this.shieldOrbs.length) {
        return;
      }

      this.shieldAngle += delta * (0.0026 + this.shieldWeaponLevel * 0.00012);
      const radius = 98 + this.shieldWeaponLevel * 5 + this.amplifyLevel * 3;
      const scale = 0.96 + this.amplifyLevel * 0.05;

      this.shieldOrbs.forEach((orb, index) => {
        const angle = this.shieldAngle + (Math.PI * 2 * index) / this.shieldOrbs.length;
        const x = this.player.x + Math.cos(angle) * radius;
        const y = this.player.y + Math.sin(angle) * radius;
        orb.setPosition(x, y);
        orb.setScale(scale);
        orb.setTint(0xcfe3ff);
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

          this.recordDamageDealt(enemy, zone.tickDamage);
          enemy.hp -= zone.tickDamage;
          enemy.mistSlowUntil = this.time.now + 420 + this.durationLevel * 90;
          enemy.mistSlowFactor = Math.max(0.46, 0.76 - this.mistLevel * 0.04);
          enemy.setAlpha(0.76);

          this.time.delayedCall(80, () => {
            if (enemy.active) {
              enemy.setAlpha(1);
            }
          });

          if (enemy.hp <= 0) {
            this.defeatEnemy(enemy);
          }
        });
      }
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

      const summary = this.createRunSummary(cleared, settings.defeatedBy);

      if (cleared) {
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
