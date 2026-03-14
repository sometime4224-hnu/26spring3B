(function () {
  class MenuScene extends Phaser.Scene {
    constructor() {
      super("MenuScene");
      this.logOverlay = null;
    }

    create() {
      const gameData = window.KoreanSurvivorGame;
      const ui = gameData.ui;
      const font = gameData.fontFamily;
      const logs = gameData.runHistory.getLogs();

      ui.drawBackdrop(this);

      this.add.text(52, 86, "SURVIVOR FINAL RANKING", {
        fontFamily: font,
        fontSize: "18px",
        fontStyle: "700",
        color: "#5ce0a0",
        letterSpacing: 4,
      });

      this.add.text(52, 146, "한글 서바이버", {
        fontFamily: font,
        fontSize: "60px",
        fontStyle: "800",
        color: "#f7fbff",
      });

      this.add.text(54, 224, "감정 -> 건강 -> 인생\n30초 강습, 90초 보스", {
        fontFamily: font,
        fontSize: "36px",
        fontStyle: "800",
        color: "#f7fbff",
        lineSpacing: 10,
      });

      this.add.text(56, 338, "Khong co quiz. Vuot qua tung stage, ha boss, nhan thuong va tien toi tran chien cuoi.", {
        fontFamily: font,
        fontSize: "22px",
        color: "#9ab0c0",
        wordWrap: { width: 610 },
      });

      this.add.text(56, 410, "일반형, 탱커형, 무리 속도형에 돌진형, 원거리형, 고함형, 증식형 역할이 섞여 나옵니다.", {
        fontFamily: font,
        fontSize: "21px",
        color: "#b3c6d5",
        wordWrap: { width: 610 },
      });

      ui.addPanel(this, 360, 792, 620, 640, 1);

      this.add.text(88, 502, "클리어 랭킹", {
        fontFamily: font,
        fontSize: "26px",
        fontStyle: "800",
        color: "#ffb776",
      });

      this.add.text(88, 542, "기록을 누르면 상세 로그가 열립니다.", {
        fontFamily: font,
        fontSize: "18px",
        color: "#a6bac7",
      });

      this.renderRanking(logs, font);

      const startButton = ui.createButton(this, {
        x: 360,
        y: 1148,
        width: 612,
        height: 96,
        label: "시작하기",
        fontSize: "34px",
        onClick: () => this.scene.start("ArenaScene"),
      });

      this.tweens.add({ targets: startButton, scale: 1.015, duration: 1100, yoyo: true, repeat: -1, ease: "Sine.inOut" });
      this.input.keyboard.once("keydown-SPACE", () => this.scene.start("ArenaScene"));
      this.input.keyboard.once("keydown-ENTER", () => this.scene.start("ArenaScene"));
    }

    renderRanking(logs, font) {
      if (!logs.length) {
        this.add.text(360, 794, "아직 클리어 기록이 없습니다.\n최종 보스를 쓰러뜨리면 랭킹에 저장됩니다.", {
          fontFamily: font,
          fontSize: "28px",
          fontStyle: "700",
          color: "#d4e1ea",
          align: "center",
          lineSpacing: 10,
        }).setOrigin(0.5);
        return;
      }

      logs.slice(0, 5).forEach((log, index) => {
        const y = 624 + index * 96;
        const bg = this.add.rectangle(360, y, 544, 82, 0xffffff, index === 0 ? 0.11 : 0.07)
          .setStrokeStyle(1, 0xffffff, 0.14)
          .setInteractive({ useHandCursor: true });

        this.add.text(106, y - 12, `#${index + 1}`, {
          fontFamily: font,
          fontSize: "28px",
          fontStyle: "900",
          color: index === 0 ? "#ffd88c" : "#dce8ef",
        }).setOrigin(0, 0.5);

        this.add.text(176, y - 12, `${log.recordScore}점`, {
          fontFamily: font,
          fontSize: "30px",
          fontStyle: "900",
          color: "#fff8f0",
        }).setOrigin(0, 0.5);

        this.add.text(176, y + 18, `${(log.stagesCleared || 0)}/${log.totalStages || 3}단계 · ${log.survivedSeconds}초 · ${this.formatLogDate(log.clearedAt)}`, {
          fontFamily: font,
          fontSize: "18px",
          color: "#a9bfd0",
        }).setOrigin(0, 0.5);

        this.add.text(582, y, `피해 ${log.damageTaken}\n아이템 ${log.pickupCount}`, {
          fontFamily: font,
          fontSize: "18px",
          fontStyle: "700",
          color: "#dce8ef",
          align: "right",
        }).setOrigin(1, 0.5);

        bg.on("pointerdown", () => this.openLogDetail(log));
      });
    }

    formatLogDate(isoString) {
      const date = new Date(isoString || Date.now());
      return date.toLocaleString("ko-KR", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    openLogDetail(log) {
      const ui = window.KoreanSurvivorGame.ui;
      const font = window.KoreanSurvivorGame.fontFamily;

      if (this.logOverlay) {
        this.logOverlay.forEach((item) => item.destroy());
      }

      const overlay = [];
      const dim = this.add.rectangle(360, 640, 720, 1280, 0x02070d, 0.78).setDepth(50).setInteractive();
      overlay.push(dim);

      overlay.push(ui.addPanel(this, 360, 662, 620, 880, 1).setDepth(51));

      overlay.push(this.add.text(360, 246, `#${log.recordScore}`, {
        fontFamily: font,
        fontSize: "62px",
        fontStyle: "900",
        color: "#fff6ec",
      }).setOrigin(0.5).setDepth(52));

      overlay.push(this.add.text(360, 314, `${log.finalBossWord || "파멸"} 클리어 기록`, {
        fontFamily: font,
        fontSize: "28px",
        fontStyle: "800",
        color: "#ffcf94",
      }).setOrigin(0.5).setDepth(52));

      overlay.push(this.add.text(360, 352, this.formatLogDate(log.clearedAt), {
        fontFamily: font,
        fontSize: "20px",
        color: "#aebfd0",
      }).setOrigin(0.5).setDepth(52));

      overlay.push(this.add.text(360, 386, (log.stageThemeTrail || []).join(" -> ") || `${log.stageReached || 1}단계`, {
        fontFamily: font,
        fontSize: "18px",
        fontStyle: "700",
        color: "#8fd8b0",
      }).setOrigin(0.5).setDepth(52));

      const detailRows = [
        { label: "스테이지", value: `${log.stagesCleared || 0}/${log.totalStages || 3}` },
        { label: "준 데미지", value: `${log.damageDealt}` },
        { label: "받은 데미지", value: `${log.damageTaken}` },
        { label: "생존 시간", value: `${log.survivedSeconds}초` },
        { label: "레벨", value: `${log.level}` },
        { label: "스테이지 보스 돌파", value: `${log.bossDefeats}` },
        { label: "각성 횟수", value: `${log.awakeningCount}` },
      ];

      detailRows.forEach((item, index) => {
        const y = 448 + index * 60;
        overlay.push(this.add.rectangle(360, y, 520, 52, 0xffffff, 0.05).setDepth(51));
        overlay.push(this.add.text(130, y, item.label, {
          fontFamily: font,
          fontSize: "24px",
          color: "#d0dde8",
        }).setOrigin(0, 0.5).setDepth(52));
        overlay.push(this.add.text(584, y, item.value, {
          fontFamily: font,
          fontSize: "26px",
          fontStyle: "800",
          color: "#fff8f0",
        }).setOrigin(1, 0.5).setDepth(52));
      });

      overlay.push(this.add.text(106, 868, "먹은 아이템", {
        fontFamily: font,
        fontSize: "24px",
        fontStyle: "800",
        color: "#8fe3b0",
      }).setDepth(52));

      const pickupLines = (log.pickupSummary || [])
        .slice(0, 8)
        .map((entry) => `${entry.word} x${entry.count}`)
        .join("  ·  ");

      overlay.push(this.add.text(106, 918, pickupLines || "기록된 아이템이 없습니다.", {
        fontFamily: font,
        fontSize: "22px",
        color: "#eaf2f8",
        wordWrap: { width: 500 },
        lineSpacing: 10,
      }).setDepth(52));

      const closeButton = ui.createButton(this, {
        x: 360,
        y: 1098,
        width: 440,
        height: 82,
        label: "닫기",
        fontSize: "28px",
        onClick: () => {
          if (this.logOverlay) {
            this.logOverlay.forEach((item) => item.destroy());
            this.logOverlay = null;
          }
        },
      });
      closeButton.setDepth(53);
      overlay.push(closeButton);

      dim.on("pointerdown", () => {
        if (this.logOverlay) {
          this.logOverlay.forEach((item) => item.destroy());
          this.logOverlay = null;
        }
      });

      this.logOverlay = overlay;
    }
  }

  window.KoreanSurvivorGame = window.KoreanSurvivorGame || {};
  window.KoreanSurvivorGame.MenuScene = MenuScene;
})();
