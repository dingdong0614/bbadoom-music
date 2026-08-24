/**
 * 방식 A · NFC 원터치 토글형.
 * 강의실 문 앞 NFC 태그에 이 URL을 심어둔다:
 *   https://<도메인>/api/room-toggle?room=<강의실ID>&token=<해당 강의실 전용 토큰>
 * 강사가 입·퇴실 시 태깅하면 GET 요청이 열리며 상태가 즉시 토글된다(사용중 ↔ 비어있음).
 *
 * 보안: 강의실별 토큰은 코드에 넣지 않고 ROOM_TOKEN_<ID> 환경변수로만 관리한다
 * (이 저장소는 public이라 태그 URL을 커밋하면 누구나 볼 수 있음). 토큰이 안 맞으면
 * 그냥 404 — 존재하지 않는 강의실인지 틀린 토큰인지 구분되는 응답조차 주지 않는다.
 * 남용 방지: 같은 강의실이 3초 이내 재태깅되면 상태를 다시 뒤집지 않고 그대로 반환한다
 * (문에서 태그가 두 번 스캔되는 실수로 사용중/비어있음이 튀는 것을 막는다).
 */

const crypto = require("crypto");
const { kvGet, kvSet } = require("./_kv");
const { KV_KEY, ROOMS, withDefaults } = require("./_rooms-config");

const COOLDOWN_MS = 3000;

function safeEqual(a, b) {
  const ah = crypto.createHash("sha256").update(String(a)).digest();
  const bh = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(ah, bh);
}

function tokenEnvName(roomId) {
  return "ROOM_TOKEN_" + roomId.toUpperCase().replace(/[^A-Z0-9]/g, "_");
}

function page(title, message, tone) {
  const color = tone === "in-use" ? "#26346f" : tone === "empty" ? "#8a6a12" : "#5c6478";
  return `<!doctype html>
<html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="robots" content="noindex, nofollow"><title>${title}</title>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
    background:#f5efe0;color:#262b3d;font-family:-apple-system,"Pretendard",sans-serif;padding:24px;text-align:center;}
  .card{max-width:360px;padding:36px 28px;border:1px dashed rgba(38,43,61,0.28);border-radius:6px;background:#fffdf6;}
  .status{font-size:1.4rem;font-weight:700;color:${color};margin:10px 0 4px;}
  .meta{font-size:0.85rem;color:#5c6478;}
</style></head><body><div class="card">
  <p style="font-size:0.85rem;color:#5c6478;margin:0;">빠둠뮤직 · 강의실 현황</p>
  <p class="status">${message}</p>
  <p class="meta">이 창은 닫으셔도 됩니다.</p>
</div></body></html>`;
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).send("Method Not Allowed");
    return;
  }

  const roomId = req.query.room;
  const token = req.query.token;
  const room = ROOMS.find((r) => r.id === roomId);
  const expected = room ? process.env[tokenEnvName(room.id)] : null;

  if (!room || !expected || !token || !safeEqual(token, expected)) {
    res.status(404).send("Not Found");
    return;
  }

  try {
    const raw = await kvGet(KV_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const rooms = withDefaults(parsed);
    const current = rooms.find((r) => r.id === room.id);

    const now = Date.now();
    const lastAt = current.updatedAt ? new Date(current.updatedAt).getTime() : 0;
    const withinCooldown = now - lastAt < COOLDOWN_MS;

    const nextStatus = withinCooldown ? current.status : current.status === "in-use" ? "empty" : "in-use";
    const nextUpdatedAt = withinCooldown ? current.updatedAt : new Date(now).toISOString();

    if (!withinCooldown) {
      const next = rooms.map((r) => (r.id === room.id ? { ...r, status: nextStatus, updatedAt: nextUpdatedAt } : r));
      await kvSet(KV_KEY, JSON.stringify({ rooms: next }));
    }

    const label = nextStatus === "in-use" ? "사용중으로 표시했어요" : "비어있음으로 표시했어요";
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(page(`${room.name} · 빠둠뮤직`, `${room.name}, ${label}`, nextStatus));
  } catch (err) {
    res.status(500).send("상태 저장에 실패했습니다: " + String(err.message || err));
  }
};
