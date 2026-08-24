/**
 * 강의실 실시간 사용 현황 조회/수동 정정 API
 * GET  : 누구나 조회 가능 (홈페이지 위젯이 사용)
 * POST : x-admin-key 헤더가 ADMIN_KEY 환경변수와 일치해야만 변경 가능
 *        (NFC 태깅을 깜빡했을 때 데스크 직원이 수동으로 바로잡기 위한 안전판.
 *        평소 정상 흐름은 api/room-toggle.js — 강의실 문의 NFC 태그.)
 */

const { kvGet, kvSet } = require("./_kv");
const { KV_KEY, ALLOWED_STATUSES, ROOMS, withDefaults } = require("./_rooms-config");

function readBody(req) {
  return new Promise((resolve) => {
    if (req.body !== undefined) {
      try {
        resolve(typeof req.body === "string" ? JSON.parse(req.body) : req.body);
      } catch {
        resolve({});
      }
      return;
    }
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
    req.on("error", () => resolve({}));
  });
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "GET") {
    try {
      const raw = await kvGet(KV_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      res.status(200).json({ rooms: withDefaults(parsed) });
    } catch (err) {
      res.status(500).json({ error: "상태를 불러오지 못했습니다.", detail: String(err.message || err) });
    }
    return;
  }

  if (req.method === "POST") {
    const adminKey = req.headers["x-admin-key"];
    if (!process.env.ADMIN_KEY || adminKey !== process.env.ADMIN_KEY) {
      res.status(401).json({ error: "인증 실패" });
      return;
    }

    const body = await readBody(req);
    const roomId = body && body.roomId;
    const status = body && body.status;
    if (!ROOMS.some((r) => r.id === roomId)) {
      res.status(400).json({ error: "존재하지 않는 강의실입니다." });
      return;
    }
    if (!ALLOWED_STATUSES.includes(status)) {
      res.status(400).json({ error: `status는 ${ALLOWED_STATUSES.join(" / ")} 중 하나여야 합니다.` });
      return;
    }

    try {
      const raw = await kvGet(KV_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      const rooms = withDefaults(parsed);
      const updatedAt = new Date().toISOString();
      const next = rooms.map((r) => (r.id === roomId ? { ...r, status, updatedAt } : r));
      await kvSet(KV_KEY, JSON.stringify({ rooms: next }));
      res.status(200).json({ rooms: next });
    } catch (err) {
      res.status(500).json({ error: "상태 저장에 실패했습니다.", detail: String(err.message || err) });
    }
    return;
  }

  res.setHeader("Allow", "GET, POST");
  res.status(405).json({ error: "허용되지 않은 메서드입니다." });
};
