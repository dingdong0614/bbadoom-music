/**
 * Upstash Redis REST API 최소 래퍼 — Vercel Marketplace "Upstash for Redis" 연동 시
 * 자동 주입되는 KV_REST_API_URL / KV_REST_API_TOKEN 환경변수를 사용한다.
 * 파일명이 밑줄로 시작해 Vercel이 별도 라우트로 노출하지 않는다 (내부 전용 모듈).
 */

function kvBase() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    throw new Error("KV_REST_API_URL / KV_REST_API_TOKEN 환경변수가 설정되지 않았습니다.");
  }
  return { url, token };
}

async function kvGet(key) {
  const { url, token } = kvBase();
  const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`KV GET 실패: ${res.status}`);
  const data = await res.json();
  return data.result || null;
}

async function kvSet(key, value) {
  const { url, token } = kvBase();
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(["SET", key, value]),
  });
  if (!res.ok) throw new Error(`KV SET 실패: ${res.status}`);
}

module.exports = { kvGet, kvSet };
