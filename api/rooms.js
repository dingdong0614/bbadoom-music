/**
 * 강의실 실시간 사용 현황 조회/수동 정정 API
 * GET  : 누구나 조회 가능 (홈페이지 위젯이 사용)
 * POST : x-admin-key 헤더가 ADMIN_KEY 환경변수와 일치해야만 변경 가능
 *        (NFC 태깅을 깜빡했을 때 데스크 직원이 수동으로 바로잡기 위한 안전판.
 *        평소 정상 흐름은 api/room-toggle.js — 강의실 문의 NFC 태그.)
 */

const crypto = require("crypto");
const { kvConfigured, kvGet, kvSet } = require("./_kv");
const { KV_KEY, ALLOWED_STATUSES, ROOMS, withDefaults } = require("./_rooms-config");

function safeEqual(a, b) {
  const ah = crypto.createHash("sha256").update(String(a)).digest();
  const bh = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(ah, bh);
}

// 관리자 수동 정정(POST) 남용 방지: IP당 10분 20회, 인스턴스별 인메모리(best-effort).
const POST_WINDOW_MS = 10 * 60 * 1000;
const POST_LIMIT = 20;
const postHits = new Map();
function allowPost(req) {
  const fwd = String(req.headers["x-forwarded-for"] || "");
  const ip = fwd.split(",")[0].trim() || (req.socket && req.socket.remoteAddress) || "unknown";
  const now = Date.now();
  const hits = (postHits.get(ip) || []).filter((t) => now - t < POST_WINDOW_MS);
  hits.push(now);
  postHits.set(ip, hits);
  if (postHits.size > 5000) postHits.clear();
  return hits.length <= POST_LIMIT;
}

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
    // 저장소(Upstash) 연동 전에는 오류 대신 "미연동"으로 응답한다.
    // 위젯은 빈 목록이면 숨겨진 채로 있고, configured:false면 폴링도 멈춘다.
    if (!kvConfigured()) {
      res.status(200).json({ rooms: [], configured: false });
      return;
    }
    try {
      const raw = await kvGet(KV_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      res.status(200).json({ rooms: withDefaults(parsed), configured: true });
    } catch (err) {
      console.error("[rooms] GET failed:", err && err.message);
      res.status(500).json({ error: "상태를 불러오지 못했습니다." });
    }
    return;
  }

  if (req.method === "POST") {
    if (!allowPost(req)) {
      res.setHeader("Retry-After", "600");
      res.status(429).json({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." });
      return;
    }
    const adminKey = req.headers["x-admin-key"];
    if (!process.env.ADMIN_KEY || !adminKey || !safeEqual(adminKey, process.env.ADMIN_KEY)) {
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
      console.error("[rooms] POST failed:", err && err.message);
      res.status(500).json({ error: "상태 저장에 실패했습니다." });
    }
    return;
  }

  res.setHeader("Allow", "GET, POST");
  res.status(405).json({ error: "허용되지 않은 메서드입니다." });
};
