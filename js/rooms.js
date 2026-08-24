/**
 * "지금 강의실 현황" 위젯 — 강사가 강의실 문 앞 NFC 태그를 태깅하면(api/room-toggle.js)
 * 바뀐 상태가 여기 반영된다. /api/rooms(GET)를 45초마다 폴링.
 * API가 아직 연동 전(로컬 정적 서버 등)이면 위젯 자체를 조용히 숨겨 사이트 동작에 영향 없음.
 */
(function () {
  "use strict";

  const POLL_MS = 45000;
  const STATUS_LABEL = { "in-use": "레슨 중", empty: "비어있어요" };

  function fmtTime(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  }

  function render(widget, data) {
    const list = document.getElementById("roomsList");
    const updatedEl = document.getElementById("roomsUpdated");
    if (!list || !Array.isArray(data.rooms) || data.rooms.length === 0) return;

    list.innerHTML = data.rooms
      .map((r) => {
        const label = STATUS_LABEL[r.status] || "확인 중";
        return `<div class="room-chip" data-status="${r.status}">
          <span class="room-name">${r.name}</span>
          <span class="room-status">${label}</span>
        </div>`;
      })
      .join("");

    const latest = data.rooms.reduce((acc, r) => (r.updatedAt && r.updatedAt > acc ? r.updatedAt : acc), "");
    if (updatedEl) {
      const t = fmtTime(latest);
      updatedEl.textContent = t ? `${t} 기준` : "";
    }
    widget.hidden = false;
  }

  function loadState(opts) {
    const manual = !!(opts && opts.manual);
    const widget = document.getElementById("roomsWidget");
    if (!widget) return;

    const refreshBtn = document.getElementById("roomsRefresh");
    if (manual && refreshBtn) refreshBtn.classList.add("is-loading");

    fetch("/api/rooms", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("rooms fetch failed");
        return res.json();
      })
      .then((data) => render(widget, data))
      .catch(() => {
        // 조회 실패 시 위젯을 숨긴 채로 두고 조용히 무시한다.
      })
      .finally(() => {
        if (manual && refreshBtn) refreshBtn.classList.remove("is-loading");
      });
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!document.getElementById("roomsWidget")) return;
    loadState();
    setInterval(loadState, POLL_MS);

    const refreshBtn = document.getElementById("roomsRefresh");
    if (refreshBtn) refreshBtn.addEventListener("click", () => loadState({ manual: true }));
  });
})();
