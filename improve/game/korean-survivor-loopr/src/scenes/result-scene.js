(function () {
  class ResultScene extends Phaser.Scene {
    constructor() {
      super("ResultScene");
    }

    init(summary) {
      this.summary = summary || {
        cleared: false,
        isTestMode: false,
        title: "실패",
        recordScore: 0,
        runScore: 0,
        survivedSeconds: 0,
        level: 1,
        bossDefeats: 0,
        negativeClears: 0,
        pickupCount: 0,
        awakeningCount: 0,
        damageDealt: 0,
        damageTaken: 0,
        remainingHp: 0,
        stageReached: 1,
        stagesCleared: 0,
        totalStages: 5,
        currentStageLabel: "1스테이지",
        stageThemeTrail: [],
        pickupSummary: [],
        logSaved: false,
        savedRank: 0,
      };
    }

    create() {
      const ui = window.KoreanSurvivorGame.ui;
      const font = window.KoreanSurvivorGame.fontFamily;
      const isTestMode = !!this.summary.isTestMode;
      const accent = this.summary.cleared ? "#ffd18e" : "#ffb6af";
      const header = isTestMode ? "BOSS RUSH TEST" : (this.summary.cleared ? "FINAL CLEAR LOG" : "RUN RESULT");
      const title = this.summary.cleared
        ? (isTestMode ? "테스트 클리어" : "최종 보스 클리어")
        : (isTestMode ? "테스트 종료" : "도전 실패");
      const subtitle = this.summary.cleared
        ? (isTestMode
          ? "테스트 결과입니다. 랭킹에는 저장되지 않습니다."
          : (this.summary.logSaved ? "클리어 로그가 저장되었습니다." : "클리어 로그를 저장하지 못했습니다."))
        : (this.summary.defeatedBy || "다시 준비해 보세요.");
      const stageLine = (this.summary.stageThemeTrail || []).join(" -> ") || this.summary.currentStageLabel || "";
      const progressLine = this.summary.cleared
        ? `${this.summary.totalStages || 5}개 스테이지 완전 클리어`
        : `${this.summary.stageReached || 1}스테이지 도달 · ${this.summary.stagesCleared || 0}개 클리어`;
      const retryPayload = isTestMode ? { bossRushTestMode: true } : undefined;

      ui.drawBackdrop(this);

      this.add.text(54, 88, header, {
        fontFamily: font,
        fontSize: "18px",
        fontStyle: "700",
        color: "#5ce0a0",
        letterSpacing: 4,
      });

      this.add.text(54, 146, title, {
        fontFamily: font,
        fontSize: "52px",
        fontStyle: "800",
        color: "#f7fbff",
      });

      this.add.text(54, 218, subtitle, {
        fontFamily: font,
        fontSize: "24px",
        color: "#a9bfd0",
        wordWrap: { width: 610 },
      });

      this.add.text(54, 258, stageLine, {
        fontFamily: font,
        fontSize: "18px",
        fontStyle: "700",
        color: "#8fd8b0",
        wordWrap: { width: 610 },
      });

      ui.addPanel(this, 360, 660, 620, 870, 1);

      this.add.text(360, 322, `${this.summary.recordScore || 0}`, {
        fontFamily: font,
        fontSize: "92px",
        fontStyle: "900",
        color: "#fff8f0",
      }).setOrigin(0.5);

      this.add.text(360, 394, "기록 점수", {
        fontFamily: font,
        fontSize: "28px",
        color: accent,
      }).setOrigin(0.5);

      this.add.text(360, 432, progressLine, {
        fontFamily: font,
        fontSize: "20px",
        fontStyle: "800",
        color: "#b8d0de",
      }).setOrigin(0.5);

      if (this.summary.logSaved) {
        this.add.text(360, 468, `랭킹 ${this.summary.savedRank}위 저장`, {
          fontFamily: font,
          fontSize: "22px",
          fontStyle: "800",
          color: "#ffe6b4",
        }).setOrigin(0.5);
      } else if (isTestMode) {
        this.add.text(360, 468, "테스트 결과는 랭킹에 저장되지 않습니다.", {
          fontFamily: font,
          fontSize: "20px",
          fontStyle: "800",
          color: "#ffd7b3",
        }).setOrigin(0.5);
      }

      [
        {
          label: "스테이지",
          value: this.summary.cleared
            ? `${this.summary.totalStages || 5}/${this.summary.totalStages || 5}`
            : `${this.summary.stageReached || 1}/${this.summary.totalStages || 5}`,
        },
        { label: "준 피해", value: `${this.summary.damageDealt || 0}` },
        { label: "받은 피해", value: `${this.summary.damageTaken || 0}` },
        { label: "생존 시간", value: `${this.summary.survivedSeconds || 0}초` },
        { label: "레벨", value: `${this.summary.level || 1}` },
        { label: "보스 처치", value: `${this.summary.bossDefeats || 0}` },
        { label: "먹은 아이템", value: `${this.summary.pickupCount || 0}` },
      ].forEach((item, index) => {
        const y = 520 + index * 64;
        this.add.rectangle(360, y, 520, 58, 0xffffff, 0.06).setDepth(1);
        this.add.text(118, y, item.label, {
          fontFamily: font,
          fontSize: "26px",
          color: "#d2dee8",
        }).setOrigin(0, 0.5);
        this.add.text(602, y, item.value, {
          fontFamily: font,
          fontSize: "28px",
          fontStyle: "800",
          color: "#fff8f0",
        }).setOrigin(1, 0.5);
      });

      this.add.text(106, 972, "먹은 아이템 요약", {
        fontFamily: font,
        fontSize: "24px",
        fontStyle: "800",
        color: "#8fe3b0",
      });

      const pickupLines = (this.summary.pickupSummary || [])
        .slice(0, 8)
        .map((entry) => `${entry.word} x${entry.count}`)
        .join("  ·  ");

      this.add.text(106, 1016, pickupLines || "기록된 아이템이 없습니다.", {
        fontFamily: font,
        fontSize: "22px",
        color: "#eaf2f8",
        wordWrap: { width: 500 },
        lineSpacing: 10,
      });

      ui.createButton(this, {
        x: 360,
        y: 1156,
        width: 612,
        height: 92,
        label: isTestMode ? "테스트 다시 하기" : "다시 하기",
        fontSize: "32px",
        onClick: () => this.scene.start("ArenaScene", retryPayload),
      });

      ui.createButton(this, {
        x: 360,
        y: 1246,
        width: 612,
        height: 78,
        label: "랭킹으로",
        fontSize: "28px",
        onClick: () => this.scene.start("MenuScene"),
      });
    }
  }

  window.KoreanSurvivorGame = window.KoreanSurvivorGame || {};
  window.KoreanSurvivorGame.ResultScene = ResultScene;
})();
