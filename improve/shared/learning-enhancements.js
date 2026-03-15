(() => {
  "use strict";

  const VISITS_KEY = "korean3b.visits.v1";
  const COMPLETION_KEY = "korean3b.completion.v1";

  const TEXT = {
    doneOnKo: "\uC644\uB8CC\uB428",
    doneOffKo: "\uC644\uB8CC \uD45C\uC2DC",
    doneKo: "\uC644\uB8CC",
    visitKo: "\uBC29\uBB38",
    progressTitle: "\uD559\uC2B5 \uC9C4\uD589\uB960",
    navList: "\uBAA9\uB85D",
    navMain: "\uBA54\uC778",
    quizKo: "\uBB38\uBC95 \uD034\uC988",
    quizVi: "Luyen tap ngu phap",
    doneOnVi: "\u0110\u00E3 ho\u00E0n th\u00E0nh",
    doneOffVi: "\u0110\u00E1nh d\u1EA5u ho\u00E0n th\u00E0nh",
    doneVi: "Ho\u00E0n th\u00E0nh",
    visitVi: "\u0110\u00E3 xem"
  };

  function createStorage() {
    let available = true;
    try {
      const testKey = "__korean3b_storage_test__";
      window.localStorage.setItem(testKey, "1");
      window.localStorage.removeItem(testKey);
    } catch (error) {
      available = false;
    }

    return {
      get(key, fallback) {
        if (!available) return fallback;
        try {
          const raw = window.localStorage.getItem(key);
          return raw ? JSON.parse(raw) : fallback;
        } catch (error) {
          return fallback;
        }
      },
      set(key, value) {
        if (!available) return false;
        try {
          window.localStorage.setItem(key, JSON.stringify(value));
          return true;
        } catch (error) {
          return false;
        }
      }
    };
  }

  const storage = createStorage();

  function cleanPath(pathname) {
    return String(pathname || "").split("#")[0].split("?")[0];
  }

  function getCurrentPath() {
    return cleanPath(window.location.pathname);
  }

  function linkPathFromHref(href) {
    if (!href) return null;
    try {
      const url = new URL(href, window.location.href);
      return cleanPath(url.pathname);
    } catch (error) {
      return null;
    }
  }

  function upsertVisit(pathname) {
    const visits = storage.get(VISITS_KEY, {});
    const now = new Date().toISOString();
    const existing = visits[pathname] || { count: 0 };
    visits[pathname] = {
      title: document.title || "Untitled",
      count: Number(existing.count || 0) + 1,
      lastVisitedAt: now
    };
    storage.set(VISITS_KEY, visits);
    return visits;
  }

  function getCompletionMap() {
    return storage.get(COMPLETION_KEY, {});
  }

  function setCompletion(pathname, done) {
    const completion = getCompletionMap();
    completion[pathname] = {
      done: Boolean(done),
      title: document.title || "Untitled",
      updatedAt: new Date().toISOString()
    };
    storage.set(COMPLETION_KEY, completion);
    return completion;
  }

  function isIndexPage(pathname) {
    return pathname.toLowerCase().endsWith("/index.html");
  }

  function isRootIndex(pathname) {
    return pathname.toLowerCase().endsWith("/korean3bimprove/index.html");
  }

  function inChapterFolder(pathname) {
    return /\/c\d+\//i.test(pathname);
  }

  function getGrammarSetFromPath(pathname) {
    const match = pathname.toLowerCase().match(/\/grammar([1-4])\.html$/);
    return match ? `g${match[1]}` : null;
  }

  function ensureStyle() {
    if (document.getElementById("le-style")) return;
    const style = document.createElement("style");
    style.id = "le-style";
    style.textContent = `
      .le-tools {
        position: fixed;
        left: 16px;
        bottom: 16px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        z-index: 1200;
      }
      .le-tools.le-tools-right {
        left: auto;
        right: 16px;
      }
      .le-btn {
        border: 1px solid rgba(148, 163, 184, 0.35);
        background: rgba(15, 23, 42, 0.92);
        color: #f8fafc;
        font-size: 13px;
        font-weight: 700;
        border-radius: 10px;
        padding: 9px 12px;
        cursor: pointer;
        text-decoration: none;
        box-shadow: 0 10px 28px rgba(0, 0, 0, 0.28);
        text-align: center;
      }
      .le-btn:hover,
      .le-btn:focus-visible {
        outline: none;
        border-color: rgba(99, 102, 241, 0.7);
      }
      .le-btn-done {
        background: rgba(22, 163, 74, 0.95);
        border-color: rgba(22, 163, 74, 0.95);
      }
      .le-btn-ko {
        display: block;
        font-size: 12px;
        font-weight: 800;
        line-height: 1.2;
      }
      .le-btn-vi {
        display: block;
        font-size: 10px;
        opacity: 0.82;
        line-height: 1.2;
      }
      .le-index-summary {
        margin-bottom: 16px;
        padding: 12px;
        border-radius: 12px;
        border: 1px solid rgba(148, 163, 184, 0.25);
        background: rgba(15, 23, 42, 0.55);
      }
      .le-index-summary strong {
        display: block;
        margin-bottom: 8px;
        font-size: 14px;
        font-weight: 700;
      }
      .le-progress-track {
        width: 100%;
        height: 10px;
        border-radius: 999px;
        background: rgba(148, 163, 184, 0.2);
        overflow: hidden;
      }
      .le-progress-fill {
        height: 100%;
        width: 0%;
        border-radius: 999px;
        background: linear-gradient(90deg, #22c55e, #84cc16);
        transition: width 0.25s ease;
      }
      .le-progress-text {
        margin-top: 8px;
        font-size: 12px;
        color: #cbd5e1;
      }
      .le-link-badge {
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1px;
        margin-top: 8px;
        margin-left: auto;
        border-radius: 10px;
        padding: 3px 7px;
        min-width: 56px;
        pointer-events: none;
      }
      .le-link-badge-visit {
        color: #0f172a;
        background: #e2e8f0;
      }
      .le-link-badge-done {
        color: #ecfdf5;
        background: #16a34a;
      }
      .le-badge-ko {
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.01em;
        line-height: 1.15;
      }
      .le-badge-vi {
        font-size: 9px;
        opacity: 0.9;
        line-height: 1.1;
      }
      @media (max-width: 640px) {
        .le-tools {
          left: 10px;
          bottom: 10px;
        }
        .le-tools.le-tools-right {
          left: auto;
          right: 10px;
        }
        .le-btn {
          font-size: 12px;
          padding: 8px 10px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function overlapsLeftBottomFixedElement() {
    const zoneLeft = 220;
    const zoneBottom = 220;
    const viewportHeight = window.innerHeight;

    const elements = Array.from(document.querySelectorAll("body *"));
    return elements.some((el) => {
      if (!el || el.classList.contains("le-tools")) return false;
      const style = window.getComputedStyle(el);
      if (style.position !== "fixed") return false;
      if (style.display === "none" || style.visibility === "hidden") return false;

      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return false;

      const nearLeft = rect.left < zoneLeft;
      const nearBottom = rect.bottom > viewportHeight - zoneBottom;
      return nearLeft && nearBottom;
    });
  }
  function buildTools(pathname) {
    if (isRootIndex(pathname)) return;
    if (!document.body) return;

    ensureStyle();

    const tools = document.createElement("div");
    tools.className = "le-tools";

    const doneBtn = document.createElement("button");
    doneBtn.type = "button";
    doneBtn.className = "le-btn";

    function renderDoneState() {
      const completion = getCompletionMap();
      const done = Boolean(completion[pathname] && completion[pathname].done);
      doneBtn.innerHTML = done
        ? `<span class="le-btn-ko">${TEXT.doneOnKo}</span><span class="le-btn-vi">${TEXT.doneOnVi}</span>`
        : `<span class="le-btn-ko">${TEXT.doneOffKo}</span><span class="le-btn-vi">${TEXT.doneOffVi}</span>`;
      doneBtn.setAttribute("aria-pressed", done ? "true" : "false");
      doneBtn.classList.toggle("le-btn-done", done);
    }

    doneBtn.addEventListener("click", () => {
      const completion = getCompletionMap();
      const current = Boolean(completion[pathname] && completion[pathname].done);
      setCompletion(pathname, !current);
      renderDoneState();
      annotateLinksAndSummary();
    });
    renderDoneState();
    tools.appendChild(doneBtn);

    let navHref = null;
    let navLabel = null;

    if (inChapterFolder(pathname) && !isIndexPage(pathname)) {
      navHref = "index.html";
      navLabel = TEXT.navList;
    } else if (inChapterFolder(pathname) && isIndexPage(pathname)) {
      navHref = "../index.html";
      navLabel = TEXT.navMain;
    }

    if (navHref && navLabel) {
      const navLink = document.createElement("a");
      navLink.href = navHref;
      navLink.className = "le-btn";
      navLink.textContent = navLabel;
      tools.appendChild(navLink);
    }

    const grammarSet = getGrammarSetFromPath(pathname);
    if (grammarSet) {
      const quizLink = document.createElement("a");
      quizLink.href = `grammar-practice.html?set=${grammarSet}`;
      quizLink.className = "le-btn";
      quizLink.innerHTML = `<span class="le-btn-ko">${TEXT.quizKo}</span><span class="le-btn-vi">${TEXT.quizVi}</span>`;
      tools.appendChild(quizLink);
    }

    if (overlapsLeftBottomFixedElement()) {
      tools.classList.add("le-tools-right");
    }

    document.body.appendChild(tools);
  }

  function createBadge(done) {
    const badge = document.createElement("span");
    badge.className = done
      ? "le-link-badge le-link-badge-done"
      : "le-link-badge le-link-badge-visit";
    badge.innerHTML = done
      ? `<span class="le-badge-ko">${TEXT.doneKo}</span><span class="le-badge-vi">${TEXT.doneVi}</span>`
      : `<span class="le-badge-ko">${TEXT.visitKo}</span><span class="le-badge-vi">${TEXT.visitVi}</span>`;
    return badge;
  }

  function summarizeChapterLinks(pathname, links, completion, visits) {
    if (!isIndexPage(pathname)) return;
    if (!inChapterFolder(pathname)) return;

    const lessonPaths = links
      .map((a) => linkPathFromHref(a.getAttribute("href")))
      .filter((p) => p && p !== pathname && !p.endsWith("/index.html"));

    const uniquePaths = Array.from(new Set(lessonPaths));
    if (uniquePaths.length === 0) return;

    const doneCount = uniquePaths.filter((p) => completion[p] && completion[p].done).length;
    const visitedCount = uniquePaths.filter((p) => visits[p] && Number(visits[p].count || 0) > 0).length;
    const donePercent = Math.round((doneCount / uniquePaths.length) * 100);

    const summary = document.createElement("section");
    summary.className = "le-index-summary";
    summary.innerHTML = `
      <strong>${TEXT.progressTitle}</strong>
      <div class="le-progress-track"><div class="le-progress-fill"></div></div>
      <div class="le-progress-text">${TEXT.doneKo} ${doneCount}/${uniquePaths.length}, ${TEXT.visitKo} ${visitedCount}/${uniquePaths.length}</div>
    `;
    const fill = summary.querySelector(".le-progress-fill");
    if (fill) fill.style.width = `${donePercent}%`;

    const main = document.querySelector("main");
    if (main) {
      main.insertBefore(summary, main.firstChild);
    } else {
      document.body.insertBefore(summary, document.body.firstChild);
    }
  }

  function annotateLinksAndSummary() {
    const pathname = getCurrentPath();
    if (!isIndexPage(pathname)) return;
    const links = Array.from(document.querySelectorAll('a[href$=".html"], a[href*=".html#"], a[href*=".html?"]'));
    if (links.length === 0) return;

    const visits = storage.get(VISITS_KEY, {});
    const completion = getCompletionMap();

    links.forEach((link) => {
      if (link.closest("nav") || link.closest(".le-tools")) return;
      const existing = link.querySelector(".le-link-badge");
      if (existing) existing.remove();

      const href = link.getAttribute("href");
      const linkPath = linkPathFromHref(href);
      if (!linkPath || linkPath === pathname) return;

      const done = Boolean(completion[linkPath] && completion[linkPath].done);
      const visited = Boolean(visits[linkPath] && Number(visits[linkPath].count || 0) > 0);
      if (!done && !visited) return;

      link.appendChild(createBadge(done));
    });

    const existingSummary = document.querySelector(".le-index-summary");
    if (existingSummary) existingSummary.remove();
    summarizeChapterLinks(pathname, links, completion, visits);
  }

  function bootstrap() {
    const pathname = getCurrentPath();
    upsertVisit(pathname);
    buildTools(pathname);
    annotateLinksAndSummary();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
  } else {
    bootstrap();
  }
})();