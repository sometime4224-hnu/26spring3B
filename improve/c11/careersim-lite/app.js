import { categoryLabels, interviewDeck, phaseLabels, vocabulary } from "./data.js";

const ROUND_COUNT = Math.min(6, interviewDeck.length);
const STORAGE_KEY_BEST = "careerInterviewLite.bestScore";
const STORAGE_KEY_LANG = "careerInterviewLite.lang";

const uiCopy = {
  ko: {
    title: "Mirinae Sync Lite",
    subtitle: "모바일 경량 면접 학습",
    score: "점수",
    best: "최고",
    round: "라운드",
    restart: "리셋",
    start: "시작",
    next: "다음 장면",
    finish: "결과 보기",
    phase: "단계",
    mission: "과제",
    question: "질문",
    glossary: "핵심 어휘",
    coaching: "학습 코치",
    rapport: "호감도",
    composure: "침착도",
    streak: "연속 정답",
    readyTitle: "짧고 가볍게 연습해 보세요",
    readyBody: "상단의 면접관 대사를 보고, 필요한 순간에만 나타나는 선택지로 답합니다.",
    readyTip: "게임 화면은 위, 도움이 되는 학습 정보는 아래에 고정되어 있습니다.",
    choiceHint: "필요할 때만 선택지가 열립니다.",
    answerHint: "아래 선택지 중 가장 자연스러운 답을 고르세요.",
    reviewHint: "해설을 확인한 뒤 다음 장면으로 넘어가세요.",
    completedBody: "결과를 확인하고 다시 도전할 수 있습니다.",
    playerName: "지원자",
    interviewerName: "면접관",
    helper: "모바일 경량 버전",
    correct: "적절함",
    wrong: "다듬기 필요",
    resultTitle: "세션 결과",
    accuracy: "정답률",
    mastered: "익힌 표현",
    retry: "다시",
    locked: "질문이 시작되면 선택지가 열립니다.",
    glossaryEmpty: "현재 장면의 표현이 여기에 정리됩니다.",
    coachIntroTitle: "시작 전 팁",
    coachWaitingTitle: "질문 듣는 중",
    coachCorrectTitle: "좋은 선택",
    coachWrongTitle: "이렇게 다듬어 보세요",
    coachResultTitle: "마무리 피드백",
    coachResultBody: "짧은 세션을 여러 번 반복하면 데이터 부담 없이 복습 효율을 높일 수 있습니다.",
    bubbleIntroKo: "오늘 면접은 짧고 집중적으로 진행하겠습니다. 준비되면 시작해 보세요.",
    bubbleIntroVi: "Buoi phong van hom nay se ngan gon va tap trung. San sang thi bat dau nhe.",
    bubbleResultKo: "좋아요. 오늘 인터뷰는 여기까지입니다. 핵심 표현을 다시 확인해 보세요.",
    bubbleResultVi: "Tot lam. Buoi phong van den day ket thuc. Hay xem lai cac bieu hien chinh.",
  },
  vi: {
    title: "Mirinae Sync Lite",
    subtitle: "Hoc phong van ban nhe",
    score: "Diem",
    best: "Cao nhat",
    round: "Vong",
    restart: "Dat lai",
    start: "Bat dau",
    next: "Canh tiep",
    finish: "Xem ket qua",
    phase: "Giai doan",
    mission: "Nhiem vu",
    question: "Cau hoi",
    glossary: "Tu vung trong tam",
    coaching: "Huong dan hoc",
    rapport: "Do thien cam",
    composure: "Do binh tinh",
    streak: "Dung lien tiep",
    readyTitle: "Luyen tap gon nhe tren mot man hinh",
    readyBody: "Xem loi cua nha tuyen dung o phan tren va chi chon dap an khi tinh huong can den.",
    readyTip: "Man choi o tren, thong tin ho tro hoc tap o duoi va luon hien san.",
    choiceHint: "Dap an chi mo ra khi can.",
    answerHint: "Chon cau tra loi tu nhien nhat trong cac lua chon ben duoi.",
    reviewHint: "Xem giai thich roi chuyen sang canh tiep theo.",
    completedBody: "Xem ket qua va thu lai bat cu luc nao.",
    playerName: "Ung vien",
    interviewerName: "Nguoi phong van",
    helper: "Ban toi uu cho di dong",
    correct: "Phu hop",
    wrong: "Can chinh lai",
    resultTitle: "Ket qua phien hoc",
    accuracy: "Ti le dung",
    mastered: "Bieu hien da luyen",
    retry: "Thu lai",
    locked: "Dap an se hien khi cau hoi bat dau.",
    glossaryEmpty: "Cac bieu hien cua canh hien tai se duoc gom o day.",
    coachIntroTitle: "Meo truoc khi bat dau",
    coachWaitingTitle: "Dang nghe cau hoi",
    coachCorrectTitle: "Lua chon tot",
    coachWrongTitle: "Thu sua theo cach nay",
    coachResultTitle: "Nhan xet tong ket",
    coachResultBody: "Lap lai nhieu phien ngan se giup on tap hieu qua ma van tiet kiem du lieu.",
    bubbleIntroKo: "오늘 면접은 짧고 집중적으로 진행하겠습니다. 준비되면 시작해 보세요.",
    bubbleIntroVi: "Buoi phong van hom nay se ngan gon va tap trung. San sang thi bat dau nhe.",
    bubbleResultKo: "좋아요. 오늘 인터뷰는 여기까지입니다. 핵심 표현을 다시 확인해 보세요.",
    bubbleResultVi: "Tot lam. Buoi phong van den day ket thuc. Hay xem lai cac bieu hien chinh.",
  },
};

const app = document.querySelector("#app");
const url = new URL(window.location.href);

const state = {
  uiLanguage: url.searchParams.get("lang") === "vi" ? "vi" : readLanguage(),
  screen: "intro",
  queue: [],
  currentIndex: 0,
  answeredCurrent: false,
  results: [],
  score: 0,
  rapport: 68,
  composure: 74,
  streak: 0,
  bestScore: readBestScore(),
  activeTermId: vocabulary[0]?.id ?? "",
};

app.addEventListener("click", handleClick);
window.addEventListener("keydown", handleKeydown);

boot();

function boot() {
  if (url.searchParams.get("autostart") === "1") {
    startSession();
    return;
  }

  render();
}

function handleClick(event) {
  const target = event.target.closest("[data-action], [data-choice], [data-lang], [data-term]");
  if (!target) {
    return;
  }

  if (target.dataset.lang) {
    setLanguage(target.dataset.lang);
    return;
  }

  if (target.dataset.term) {
    state.activeTermId = target.dataset.term;
    render();
    return;
  }

  if (target.dataset.choice) {
    submitChoice(target.dataset.choice);
    return;
  }

  if (target.dataset.action === "start") {
    startSession();
  } else if (target.dataset.action === "advance") {
    advance();
  } else if (target.dataset.action === "restart") {
    resetToIntro();
  }
}

function handleKeydown(event) {
  if (state.screen !== "play" || state.answeredCurrent) {
    return;
  }

  const prompt = getCurrentPrompt();
  const index = Number(event.key) - 1;
  if (!prompt || Number.isNaN(index) || index < 0 || index >= prompt.choices.length) {
    return;
  }

  event.preventDefault();
  submitChoice(prompt.choices[index].id);
}

function render() {
  const copy = uiCopy[state.uiLanguage];
  const prompt = getCurrentPrompt();
  const currentResult = getCurrentRoundResult();

  app.innerHTML = `
    <div class="shell">
      <div class="shell__frame">
        ${renderTopbar(copy)}
        <main class="main-layout ${state.screen === "play" ? "is-play" : state.screen === "result" ? "is-result" : "is-intro"}">
          ${renderGamePanel(copy, prompt, currentResult)}
          ${renderInfoPanel(copy, prompt, currentResult)}
        </main>
      </div>
    </div>
  `;
}

function renderTopbar(copy) {
  const roundLabel =
    state.screen === "play"
      ? `${state.currentIndex + 1}/${state.queue.length}`
      : state.screen === "result"
        ? `${state.queue.length}/${state.queue.length}`
        : "-";

  return `
    <header class="topbar">
      <div class="brand">
        <h1 class="brand__title">${escapeHTML(copy.title)}</h1>
        <p class="brand__subtitle">${escapeHTML(copy.subtitle)}</p>
        <div class="brand__stats">
          <span class="stat-pill">${escapeHTML(copy.round)} ${escapeHTML(roundLabel)}</span>
          <span class="stat-pill">${escapeHTML(copy.score)} ${state.score}</span>
          <span class="stat-pill">${escapeHTML(copy.best)} ${state.bestScore}</span>
        </div>
      </div>
      <div class="topbar__actions">
        <div class="lang-switch" aria-label="Language toggle">
          <button type="button" data-lang="ko" class="${state.uiLanguage === "ko" ? "is-active" : ""}">한국어</button>
          <button type="button" data-lang="vi" class="${state.uiLanguage === "vi" ? "is-active" : ""}">Tiếng Việt</button>
        </div>
        <button type="button" class="icon-button" data-action="restart">${escapeHTML(copy.restart)}</button>
      </div>
    </header>
  `;
}

function renderGamePanel(copy, prompt, currentResult) {
  const bubble = getBubbleContent(prompt, currentResult);
  const phase = prompt ? getPhaseLabel(prompt) : copy.helper;

  return `
    <section class="panel game-panel" aria-label="game panel">
      <div class="stage">
        <div class="stage__backdrop" style="background-image: url('./assets/office-bg.webp');"></div>
        <div class="stage__chrome">
          <div class="stage__header">
            <span class="phase-pill">${escapeHTML(phase)}</span>
            <span class="stage__helper">${escapeHTML(copy.helper)}</span>
          </div>
          <div class="stage__content">
            <div class="speech-bubble">
              <div class="speech-bubble__name">${escapeHTML(copy.interviewerName)}</div>
              <div class="speech-bubble__body">${renderLearningText(bubble.ko, bubble.vi)}</div>
            </div>
            <div class="portrait-row">
              <div class="portrait-card">
                <div class="portrait-card__frame">
                  <img class="portrait-card__image" src="./assets/interviewer.webp" alt="Interviewer portrait" />
                </div>
                <div class="portrait-card__label">${escapeHTML(copy.interviewerName)}</div>
              </div>
              <div class="portrait-card portrait-card--candidate">
                <div class="portrait-card__frame">
                  <img class="portrait-card__image" src="./assets/candidate.webp" alt="Candidate portrait" />
                </div>
                <div class="portrait-card__label">${escapeHTML(copy.playerName)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      ${renderChoicePanel(copy, prompt, currentResult)}
    </section>
  `;
}

function renderChoicePanel(copy, prompt, currentResult) {
  if (state.screen === "intro") {
    return `
      <div class="choice-panel">
        <div class="cta-row">
          <span class="choice-panel__status">${escapeHTML(copy.choiceHint)}</span>
          <button type="button" class="primary-button" data-action="start">${escapeHTML(copy.start)}</button>
        </div>
      </div>
    `;
  }

  if (state.screen === "result") {
    return `
      <div class="choice-panel">
        <div class="cta-row">
          <span class="choice-panel__status">${escapeHTML(copy.completedBody)}</span>
          <button type="button" class="secondary-button" data-action="start">${escapeHTML(copy.retry)}</button>
        </div>
      </div>
    `;
  }

  if (!prompt) {
    return `<div class="choice-panel"><div class="choice-panel__status">${escapeHTML(copy.locked)}</div></div>`;
  }

  if (state.answeredCurrent) {
    const label = currentResult?.correct ? copy.correct : copy.wrong;
    const buttonLabel = state.currentIndex === state.queue.length - 1 ? copy.finish : copy.next;
    return `
      <div class="choice-panel">
        <div class="choice-panel__hint">${escapeHTML(copy.reviewHint)}</div>
        <div class="choice-panel__footer">
          <span class="choice-panel__status">${escapeHTML(label)}</span>
          <button type="button" class="primary-button" data-action="advance">${escapeHTML(buttonLabel)}</button>
        </div>
      </div>
    `;
  }

  return `
    <div class="choice-panel">
      <div class="choice-panel__hint">${escapeHTML(copy.answerHint)}</div>
      <div class="choice-grid">
        ${prompt.choices
          .map(
            (choice, index) => `
              <button type="button" class="choice-card" data-choice="${escapeHTML(choice.id)}">
                <span class="choice-card__index">Choice ${index + 1}</span>
                <span class="choice-card__body">${renderLearningText(choice.label, choice.translation)}</span>
              </button>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderInfoPanel(copy, prompt, currentResult) {
  const focusTerms = getFocusTerms(prompt, currentResult);
  const activeTerm = getActiveTerm(focusTerms);

  return `
    <section class="panel info-panel" aria-label="study panel">
      <div class="info-stack">
        ${state.screen === "intro" ? "" : renderMeters(copy)}
        ${renderMissionCard(copy, prompt)}
        ${renderSupportCard(copy, prompt, currentResult, focusTerms, activeTerm)}
      </div>
    </section>
  `;
}

function renderMeters(copy) {
  const accuracy = state.results.length ? Math.round((countCorrect() / state.results.length) * 100) : 0;

  return `
    <section class="meter-grid">
      <div class="meter-card">
        <div class="meter-card__label">${escapeHTML(copy.rapport)}</div>
        <div class="meter-card__value">${state.rapport}</div>
        <div class="meter" style="--value:${state.rapport}"></div>
      </div>
      <div class="meter-card">
        <div class="meter-card__label">${escapeHTML(copy.composure)}</div>
        <div class="meter-card__value">${state.composure}</div>
        <div class="meter" style="--value:${state.composure}"></div>
      </div>
      <div class="meter-card">
        <div class="meter-card__label">${escapeHTML(copy.accuracy)}</div>
        <div class="meter-card__value">${accuracy}%</div>
        <div class="meter" style="--value:${accuracy}"></div>
      </div>
    </section>
  `;
}

function renderMissionCard(copy, prompt) {
  if (state.screen === "intro") {
    return `
      <section class="info-card">
        <h2 class="info-card__title">${escapeHTML(copy.mission)}</h2>
        <div class="empty-state">
          <div class="empty-state__body">
            <p class="empty-state__title">${escapeHTML(copy.readyTitle)}</p>
            <p class="empty-state__text">${escapeHTML(copy.readyBody)}</p>
          </div>
        </div>
        <div class="learning-block">${renderLearningText(uiCopy.ko.bubbleIntroKo, uiCopy.ko.bubbleIntroVi)}</div>
        <div class="learning-block">
          <button type="button" class="primary-button" data-action="start">${escapeHTML(copy.start)}</button>
        </div>
      </section>
    `;
  }

  if (state.screen === "result") {
    const accuracy = state.results.length ? Math.round((countCorrect() / state.results.length) * 100) : 0;
    return `
      <section class="info-card">
        <h2 class="info-card__title">${escapeHTML(copy.resultTitle)}</h2>
        <div class="result-card">
          <div class="result-score">
            <div>
              <div class="support-text">${escapeHTML(copy.score)}</div>
              <div class="result-score__value">${state.score}</div>
            </div>
            <span class="phase-pill">${escapeHTML(copy.accuracy)} ${accuracy}%</span>
          </div>
          <div class="result-list">
            <div class="result-item">
              <span>${escapeHTML(copy.mastered)}</span>
              <strong>${state.results.reduce((sum, item) => sum + item.masteredCount, 0)}</strong>
            </div>
            <div class="result-item">
              <span>${escapeHTML(copy.streak)}</span>
              <strong>${getBestStreak()}</strong>
            </div>
            <div class="result-item">
              <span>${escapeHTML(copy.best)}</span>
              <strong>${state.bestScore}</strong>
            </div>
          </div>
          <div class="learning-block">
            <button type="button" class="secondary-button" data-action="start">${escapeHTML(copy.retry)}</button>
          </div>
        </div>
      </section>
    `;
  }

  if (!prompt) {
    return "";
  }

  return `
    <section class="info-card">
      <h2 class="info-card__title">${escapeHTML(copy.mission)}</h2>
      <div class="mission-grid">
        <div class="mission-meta">
          <div class="mission-meta__label">${escapeHTML(copy.phase)}</div>
          <div class="mission-meta__value">${escapeHTML(getPhaseLabel(prompt))}</div>
        </div>
        <div class="mission-meta">
          <div class="mission-meta__label">${escapeHTML(copy.round)}</div>
          <div class="mission-meta__value">${state.currentIndex + 1} / ${state.queue.length}</div>
        </div>
      </div>
      <div class="learning-block">${renderLearningText(prompt.title, prompt.titleVi)}</div>
      <div class="learning-block">${renderLearningText(prompt.question, prompt.questionVi)}</div>
    </section>
  `;
}

function renderSupportCard(copy, prompt, currentResult, focusTerms, activeTerm) {
  let title = copy.coachIntroTitle;
  let bodyKo = copy.readyTip;
  let bodyVi = uiCopy.vi.readyTip;

  if (state.screen === "play" && prompt && !state.answeredCurrent) {
    title = copy.coachWaitingTitle;
    bodyKo = prompt.situation;
    bodyVi = prompt.situationVi;
  } else if (state.screen === "play" && prompt && state.answeredCurrent && currentResult) {
    title = currentResult.correct ? copy.coachCorrectTitle : copy.coachWrongTitle;
    bodyKo = prompt.explanation;
    bodyVi = prompt.explanationVi;
  } else if (state.screen === "result") {
    title = copy.coachResultTitle;
    bodyKo = uiCopy.ko.coachResultBody;
    bodyVi = uiCopy.vi.coachResultBody;
  }

  const badge =
    state.screen === "play" && state.answeredCurrent && currentResult
      ? `<span class="badge ${currentResult.correct ? "is-correct" : "is-wrong"}">${escapeHTML(
          currentResult.correct ? copy.correct : copy.wrong,
        )}</span>`
      : "";

  const answerReview =
    state.screen === "play" && state.answeredCurrent && currentResult
      ? `<div class="learning-block">${renderLearningText(currentResult.choice.label, currentResult.choice.translation)}</div>`
      : "";

  const summary =
    state.screen === "result"
      ? `<div class="learning-block">${renderLearningText(uiCopy.ko.bubbleResultKo, uiCopy.ko.bubbleResultVi)}</div>`
      : "";

  return `
    <section class="info-card">
      <div class="cta-row">
        <h2 class="info-card__title">${escapeHTML(copy.glossary)}</h2>
        ${badge}
      </div>
      ${
        focusTerms.length
          ? `
            <div class="term-list">
              ${focusTerms
                .map(
                  (term) => `
                    <button
                      type="button"
                      class="term-chip ${term.id === activeTerm?.id ? "is-active" : ""}"
                      data-term="${escapeHTML(term.id)}"
                    >
                      <span class="term-chip__term">${escapeHTML(term.term)}</span>
                      <span class="term-chip__translation">${escapeHTML(term.translation)}</span>
                    </button>
                  `,
                )
                .join("")}
            </div>
            ${
              activeTerm
                ? `
                  <div class="term-detail">
                    <div class="term-detail__meta">
                      <strong>${escapeHTML(activeTerm.term)}</strong>
                      <span class="term-detail__category">${escapeHTML(getCategoryLabel(activeTerm.category))}</span>
                    </div>
                    ${renderLearningText(activeTerm.glossKo, activeTerm.glossVi)}
                  </div>
                `
                : ""
            }
          `
          : `<p class="support-text">${escapeHTML(copy.glossaryEmpty)}</p>`
      }
      <div class="learning-block">
        <div class="feedback-copy"><strong>${escapeHTML(title)}</strong></div>
        ${renderLearningText(bodyKo, bodyVi)}
      </div>
      ${answerReview}
      ${summary}
    </section>
  `;
}

function startSession() {
  state.screen = "play";
  state.queue = shuffle(interviewDeck).slice(0, ROUND_COUNT);
  state.currentIndex = 0;
  state.answeredCurrent = false;
  state.results = [];
  state.score = 0;
  state.rapport = 68;
  state.composure = 74;
  state.streak = 0;
  state.activeTermId = state.queue[0]?.focusTerms?.[0] ?? vocabulary[0]?.id ?? "";
  render();
}

function advance() {
  if (state.screen !== "play" || !state.answeredCurrent) {
    return;
  }

  if (state.currentIndex >= state.queue.length - 1) {
    finishSession();
    return;
  }

  state.currentIndex += 1;
  state.answeredCurrent = false;
  state.activeTermId = getCurrentPrompt()?.focusTerms?.[0] ?? vocabulary[0]?.id ?? "";
  render();
}

function finishSession() {
  state.screen = "result";
  state.answeredCurrent = false;
  if (state.score > state.bestScore) {
    state.bestScore = state.score;
    writeBestScore(state.bestScore);
  }
  render();
}

function resetToIntro() {
  state.screen = "intro";
  state.queue = [];
  state.currentIndex = 0;
  state.answeredCurrent = false;
  state.results = [];
  state.score = 0;
  state.rapport = 68;
  state.composure = 74;
  state.streak = 0;
  state.activeTermId = vocabulary[0]?.id ?? "";
  render();
}

function submitChoice(choiceId) {
  if (state.screen !== "play" || state.answeredCurrent) {
    return;
  }

  const prompt = getCurrentPrompt();
  if (!prompt) {
    return;
  }

  const choice = prompt.choices.find((item) => item.id === choiceId);
  if (!choice) {
    return;
  }

  const correct = choice.id === prompt.correctChoiceId;
  const masteredTerms = new Set([...(prompt.focusTerms || []), ...(choice.relatedTerms || [])]);

  state.answeredCurrent = true;
  state.streak = correct ? state.streak + 1 : 0;
  state.score = correct ? state.score + 120 + (state.streak - 1) * 15 : Math.max(0, state.score + 20);
  state.rapport = clamp(state.rapport + (correct ? 6 : -4), 0, 100);
  state.composure = clamp(state.composure + (correct ? 4 : -7), 0, 100);
  state.activeTermId = [...masteredTerms][0] ?? prompt.focusTerms?.[0] ?? state.activeTermId;

  state.results.push({
    promptId: prompt.id,
    choice,
    correct,
    masteredCount: masteredTerms.size,
    streakAfter: state.streak,
  });

  render();
}

function getCurrentPrompt() {
  return state.screen === "play" ? state.queue[state.currentIndex] ?? null : null;
}

function getCurrentRoundResult() {
  if (state.screen !== "play" || !state.answeredCurrent) {
    return null;
  }

  return state.results[state.currentIndex] ?? null;
}

function getBubbleContent(prompt, currentResult) {
  if (state.screen === "intro") {
    return { ko: uiCopy.ko.bubbleIntroKo, vi: uiCopy.ko.bubbleIntroVi };
  }

  if (state.screen === "result") {
    return { ko: uiCopy.ko.bubbleResultKo, vi: uiCopy.ko.bubbleResultVi };
  }

  if (!prompt) {
    return { ko: uiCopy.ko.bubbleIntroKo, vi: uiCopy.ko.bubbleIntroVi };
  }

  if (state.answeredCurrent && currentResult) {
    return currentResult.correct
      ? { ko: prompt.successLine, vi: prompt.successLineVi }
      : { ko: prompt.failureLine, vi: prompt.failureLineVi };
  }

  return { ko: prompt.interviewerLine, vi: prompt.interviewerLineVi };
}

function getFocusTerms(prompt, currentResult) {
  const ids = new Set();

  if (prompt?.focusTerms) {
    prompt.focusTerms.forEach((termId) => ids.add(termId));
  }

  if (currentResult?.choice?.relatedTerms) {
    currentResult.choice.relatedTerms.forEach((termId) => ids.add(termId));
  }

  return [...ids].map(findVocabulary).filter(Boolean).slice(0, 4);
}

function getActiveTerm(terms) {
  return terms.find((term) => term.id === state.activeTermId) ?? terms[0] ?? null;
}

function getPhaseLabel(prompt) {
  return phaseLabels[prompt.phaseVi] ?? prompt.phaseVi;
}

function getCategoryLabel(category) {
  return categoryLabels[state.uiLanguage]?.[category] ?? category;
}

function countCorrect() {
  return state.results.filter((result) => result.correct).length;
}

function getBestStreak() {
  return state.results.reduce((best, item) => Math.max(best, item.streakAfter), 0);
}

function findVocabulary(id) {
  return vocabulary.find((term) => term.id === id) ?? null;
}

function setLanguage(language) {
  if (!uiCopy[language]) {
    return;
  }

  state.uiLanguage = language;
  writeLanguage(language);
  render();
}

function renderLearningText(korean, vietnamese) {
  return `
    <span class="learning-text">
      <span class="learning-text__ko">${escapeHTML(korean)}</span>
      <span class="learning-text__vi">${escapeHTML(vietnamese)}</span>
    </span>
  `;
}

function readBestScore() {
  try {
    return Number.parseInt(localStorage.getItem(STORAGE_KEY_BEST) || "0", 10) || 0;
  } catch {
    return 0;
  }
}

function writeBestScore(score) {
  try {
    localStorage.setItem(STORAGE_KEY_BEST, String(score));
  } catch {
    return;
  }
}

function readLanguage() {
  try {
    return localStorage.getItem(STORAGE_KEY_LANG) === "vi" ? "vi" : "ko";
  } catch {
    return "ko";
  }
}

function writeLanguage(language) {
  try {
    localStorage.setItem(STORAGE_KEY_LANG, language);
  } catch {
    return;
  }
}

function shuffle(items) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[randomIndex]] = [next[randomIndex], next[index]];
  }
  return next;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
