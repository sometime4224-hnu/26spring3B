/**
 * pc-mode.js  ─  C12 학습자료 PC 최적화 공유 스크립트
 *
 * 사용법: 각 HTML 파일의 </body> 직전에 추가
 *   <script src="../shared/pc-mode.js"></script>
 *
 * 동작:
 *   1. 우하단 🖥️ 버튼 → PC 최적화 모드 ON/OFF
 *   2. PC 모드에서 A+ / % / A- 버튼으로 학습 콘텐츠 확대/축소
 *   3. 내비게이션 및 position:fixed/sticky UI는 확대 영향 없음 (자동 감지)
 *      - body 직접 자식 중 fixed/sticky → 래퍼 밖 유지
 *      - 래퍼 내부의 fixed 요소 → 역줌(counter-zoom)으로 고정 크기 유지
 *   4. 설정은 localStorage에 저장 (새로고침 후에도 유지)
 */
(function () {
  'use strict';

  /* ── 상수 ── */
  const KEY_PC   = 'c12-pc-mode';
  const KEY_ZOOM = 'c12-pc-zoom';
  const MIN_Z = 0.7, MAX_Z = 2.5, STEP = 0.1;

  /* ── 헬퍼 ── */
  const $ = (id) => document.getElementById(id);
  const getZ  = () => parseFloat(localStorage.getItem(KEY_ZOOM) || '1');
  const isPc  = () => localStorage.getItem(KEY_PC) === 'true';
  const round = (v) => Math.round(v * 100) / 100;

  /* ── 공통 CSS 주입 ── */
  const css = document.createElement('style');
  css.id = 'pc-mode-style';
  css.textContent = `
    /* PC 모드: 콘텐츠 래퍼 최대 너비 해제 */
    body.pc-mode #pc-content-wrap > * { max-width: 100% !important; }

    /* PC 모드 토글 버튼 */
    #pc-toggle-btn {
      position: fixed; bottom: 16px; right: 16px;
      width: 40px; height: 40px;
      background: #fff; border: 2.5px solid #2563eb;
      border-radius: 12px; cursor: pointer;
      font-size: 18px; z-index: 2147483647;
      box-shadow: 0 4px 14px rgba(37,99,235,.28);
      opacity: .65; transition: opacity .2s, transform .15s;
      display: flex; align-items: center; justify-content: center;
      padding: 0; line-height: 1;
    }
    #pc-toggle-btn:hover { opacity: 1; transform: scale(1.1); }
    #pc-toggle-btn:active { transform: scale(.92); }

    /* 줌 컨트롤 바 ─ 토글 버튼 바로 위에 세로 배치 */
    #pc-zoom-bar {
      position: fixed; bottom: 64px; right: 16px;
      display: none; flex-direction: column; align-items: center; gap: 0;
      background: #fff; border: 2.5px solid #2563eb;
      border-radius: 12px; width: 40px; padding: 3px 0;
      z-index: 2147483647; box-shadow: 0 4px 14px rgba(37,99,235,.28);
      font-family: 'Noto Sans KR', 'Segoe UI', sans-serif;
      opacity: .65; transition: opacity .2s;
    }
    #pc-zoom-bar:hover { opacity: 1; }
    #pc-zoom-bar button {
      background: none; border: none; cursor: pointer;
      font-weight: 900; color: #2563eb;
      font-size: 12px; width: 100%; height: 30px; line-height: 1;
      border-radius: 8px; transition: background .12s;
      display: flex; align-items: center; justify-content: center;
    }
    #pc-zoom-bar button:hover { background: #eff6ff; }
    #pc-zoom-bar button:active { transform: scale(.92); }
    #pc-zoom-pct {
      font-size: 10px; font-weight: 700; color: #374151;
      width: 100%; text-align: center; pointer-events: none;
      padding: 1px 0; border-top: 1px solid #dbeafe; border-bottom: 1px solid #dbeafe;
    }

    /* 줌 래퍼 */
    #pc-content-wrap {
      transform-origin: top left;
    }

    /* PC 모드: 우하단 컨트롤에 가려지지 않도록 최소 하단 여백 확보 */
    body.pc-mode #pc-content-wrap {
      padding-bottom: 120px !important;
    }
  `;
  document.head.appendChild(css);

  /* ── DOM 준비 후 실행 ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    buildWrapper();
    buildToggleBtn();
    buildZoomBar();
    applyState(false); // 애니메이션 없이 초기 상태 적용
  }

  /* ────────────────────────────────────────────
     콘텐츠 래퍼 생성

     제외 규칙 (body 직접 자식):
       - <nav>              → 내비게이션
       - SCRIPT / NOSCRIPT  → 기능 보존
       - #pc-* 요소         → 이미 추가된 PC UI
       - position:fixed     → 뷰포트 고정 UI (줌 영향 차단)
       - position:sticky    → 스티키 헤더/푸터 (줌 영향 차단)

     래퍼 내부에 포함된 position:fixed 자손 요소는
     data-pc-fixed 자동 마킹 → 역줌으로 원래 크기 유지
  ──────────────────────────────────────────── */
  function buildWrapper() {
    if ($('pc-content-wrap')) return;

    const nav  = document.querySelector('nav');
    const wrap = document.createElement('div');
    wrap.id = 'pc-content-wrap';

    const toMove = [];
    Array.from(document.body.children).forEach((el) => {
      if (el === nav)                          return; // nav 제외
      if (el.tagName === 'SCRIPT')             return; // 스크립트 제외
      if (el.tagName === 'NOSCRIPT')           return; // GTM noscript 제외
      if (el.id && el.id.startsWith('pc-'))   return; // PC UI 제외

      /* position:fixed / sticky 요소는 body에 유지 → 줌 영향 없음 */
      const pos = window.getComputedStyle(el).position;
      if (pos === 'fixed' || pos === 'sticky') return;

      toMove.push(el);
    });
    toMove.forEach((el) => wrap.appendChild(el));

    /* nav 바로 뒤에 래퍼 삽입 (DOM에 먼저 연결해야 getComputedStyle 정확) */
    if (nav) {
      nav.insertAdjacentElement('afterend', wrap);
    } else {
      document.body.prepend(wrap);
    }

    /* 래퍼 내부에 남아 있는 position:fixed 자손 → 역줌 마킹 */
    autoMarkFixed(wrap);
  }

  /* 래퍼 내부의 position:fixed 요소를 data-pc-fixed 속성으로 자동 마킹 */
  function autoMarkFixed(root) {
    root.querySelectorAll('*').forEach((el) => {
      if (window.getComputedStyle(el).position === 'fixed') {
        if (!el.hasAttribute('data-pc-fixed')) {
          el.setAttribute('data-pc-fixed', '');
        }
      }
    });
  }

  /* ── 토글 버튼 ── */
  function buildToggleBtn() {
    if ($('pc-toggle-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'pc-toggle-btn';
    btn.setAttribute('aria-label', 'PC / 모바일 화면 전환');
    btn.setAttribute('title', 'PC 최적화 모드');
    btn.addEventListener('click', () => {
      localStorage.setItem(KEY_PC, String(!isPc()));
      applyState(true);
    });
    document.body.appendChild(btn);
  }

  /* ── 줌 바 (세로 배치: A+ 위 / % 중간 / A- 아래) ── */
  function buildZoomBar() {
    if ($('pc-zoom-bar')) return;
    const bar = document.createElement('div');
    bar.id = 'pc-zoom-bar';
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', '콘텐츠 확대/축소');
    bar.innerHTML = `
      <button id="pc-zoom-in"  title="확대">A<small>+</small></button>
      <span id="pc-zoom-pct" aria-live="polite"></span>
      <button id="pc-zoom-out" title="축소">A<small>-</small></button>
    `;
    document.body.appendChild(bar);
    $('pc-zoom-out').addEventListener('click', () => changeZoom(-STEP));
    $('pc-zoom-in').addEventListener('click',  () => changeZoom(+STEP));
  }

  /* ── 줌 변경 ── */
  function changeZoom(delta) {
    const z = round(Math.max(MIN_Z, Math.min(MAX_Z, getZ() + delta)));
    localStorage.setItem(KEY_ZOOM, String(z));
    applyZoom(z);
  }

  /* ── 줌 적용
       - #pc-content-wrap 에만 CSS zoom 적용
       - data-pc-fixed 요소(자동 마킹 포함)는 역줌으로 고정 크기 유지
  ── */
  function applyZoom(z) {
    z = z ?? getZ();
    const wrap = $('pc-content-wrap');
    const pct  = $('pc-zoom-pct');
    if (wrap) wrap.style.zoom = String(z);
    if (pct)  pct.textContent = Math.round(z * 100) + '%';

    /* data-pc-fixed 속성 요소는 역줌으로 원래 크기 유지 */
    document.querySelectorAll('[data-pc-fixed]').forEach((el) => {
      el.style.zoom = String(round(1 / z));
    });
  }

  /* ── 모드 상태 적용 ── */
  function applyState(animate) {
    const pc   = isPc();
    const btn  = $('pc-toggle-btn');
    const bar  = $('pc-zoom-bar');
    const wrap = $('pc-content-wrap');

    /* 버튼 아이콘 */
    if (btn) btn.textContent = pc ? '📱' : '🖥️';

    /* 줌 바 표시 */
    if (bar) bar.style.display = pc ? 'flex' : 'none';

    if (pc) {
      document.body.classList.add('pc-mode');
      applyZoom();
    } else {
      document.body.classList.remove('pc-mode');
      /* 모바일 모드 복귀: 줌 초기화 */
      if (wrap) wrap.style.zoom = '1';
      document.querySelectorAll('[data-pc-fixed]').forEach((el) => {
        el.style.zoom = '';
      });
    }
  }
})();
