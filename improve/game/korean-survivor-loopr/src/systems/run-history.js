(function () {
  const storageKey = "korean-survivor-clear-logs-v1";
  const maxLogs = 40;

  function safeClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function readLogs() {
    try {
      const raw = window.localStorage.getItem(storageKey);

      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function sortLogs(logs) {
    return logs.sort(function (a, b) {
      if ((b.recordScore || 0) !== (a.recordScore || 0)) {
        return (b.recordScore || 0) - (a.recordScore || 0);
      }

      return String(b.clearedAt || "").localeCompare(String(a.clearedAt || ""));
    });
  }

  function writeLogs(logs) {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(logs));
    } catch (error) {
      // Storage can fail silently on restricted browsers.
    }
  }

  function getLogs() {
    return safeClone(sortLogs(readLogs()));
  }

  function getLog(id) {
    const logs = getLogs();

    for (let index = 0; index < logs.length; index += 1) {
      if (logs[index].id === id) {
        return logs[index];
      }
    }

    return null;
  }

  function saveClearLog(log) {
    const logs = readLogs();
    const savedLog = safeClone(log || {});
    savedLog.id = savedLog.id || `clear-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    logs.push(savedLog);

    const sorted = sortLogs(logs).slice(0, maxLogs);
    writeLogs(sorted);

    return {
      log: safeClone(savedLog),
      rank: sorted.findIndex(function (entry) {
        return entry.id === savedLog.id;
      }) + 1,
      logs: safeClone(sorted),
    };
  }

  window.KoreanSurvivorGame = window.KoreanSurvivorGame || {};
  window.KoreanSurvivorGame.runHistory = {
    getLogs: getLogs,
    getLog: getLog,
    saveClearLog: saveClearLog,
  };
})();
