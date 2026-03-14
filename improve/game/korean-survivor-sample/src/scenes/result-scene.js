(function () {
  class ResultScene extends Phaser.Scene {
    constructor() {
      super("ResultScene");
    }

    init(summary) {
      this.summary = summary || {
        cleared: false,
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
        totalStages: 3,
        currentStageLabel: "1단계 감정",
        stageThemeTrail: [],
        pickupSummary: [],
        logSaved: false,
        savedRank: 0,
      };
    }

    create() {
      const ui = window.KoreanSurvivorGame.ui;
      const font = window.KoreanSurvivorGame.fontFamily;
      const accent = this.summary.cleared ? "#ffd18e" : "#ffb6af";

      ui.drawBackdrop(this);

      this.add.text(54, 88, this.summary.cleared ? "FINAL CLEAR LOG" : "RUN RESULT", {
        fontFamily: font,
        fontSize: "18px",
        fontStyle: "700",
        color: "#5ce0a0",
        letterSpacing: 4,
      });

      this.add.text(54, 146, this.summary.cleared ? "최종 보스 클리어" : "도전 실패", {
        fontFamily: font,
        fontSize: "52px",
        fontStyle: "800",
        color: "#f7fbff",
      });

      this.add.text(54, 218, this.summary.cleared ? "클리어 로그가 저장되었습니다." : (this.summary.defeatedBy || "다시 준비해서 재도전하세요."), {
        fontFamily: font,
        fontSize: "24px",
        color: "#a9bfd0",
        wordWrap: { width: 610 },
      });

      this.add.text(54, 258, (this.summary.stageThemeTrail || []).join(" -> ") || this.summary.currentStageLabel || "", {
        fontFamily: font,
        fontSize: "18px",
        fontStyle: "700",
        color: "#8fd8b0",
        wordWrap: { width: 610 },
      });

      ui.addPanel(this, 360, 660, 620, 870, 1);

      this.add.text(360, 322, `${this.summary.recordScore}`, {
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

      this.add.text(360, 432, this.summary.cleared
        ? `${this.summary.totalStages || 3}개 스테이지 완전 클리어`
        : `${this.summary.stageReached || 1}단계 도달 · ${this.summary.stagesCleared || 0}개 클리어`, {
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
      }

      [
        {
          label: "스테이지",
          value: this.summary.cleared
            ? `${this.summary.totalStages || 3}/${this.summary.totalStages || 3}`
            : `${this.summary.stageReached || 1}/${this.summary.totalStages || 3}`,
        },
        { label: "준 데미지", value: `${this.summary.damageDealt}` },
        { label: "받은 데미지", value: `${this.summary.damageTaken}` },
        { label: "생존 시간", value: `${this.summary.survivedSeconds}초` },
        { label: "레벨", value: `${this.summary.level}` },
        { label: "미니보스 처치", value: `${this.summary.bossDefeats}` },
        { label: "아이템 획득", value: `${this.summary.pickupCount}` },
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

      this.add.text(106, 972, "먹은 아이템", {
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
        label: "다시 하기",
        fontSize: "32px",
        onClick: () => this.scene.start("ArenaScene"),
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
