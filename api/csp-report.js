/**
 * CSP Report-Only 위반 보고 수신용. 저장하지 않고 Vercel 함수 로그에만 한 줄 남긴다.
 * 차단 단계로 올리기 전에 로그를 보고 허용 목록을 다듬기 위한 용도.
 * 남용 방지: 인스턴스별 인메모리 한도(1분 60건)를 넘으면 기록 없이 204만 돌려준다.
 */

const WINDOW_MS = 60 * 1000;
const LIMIT = 60;
let windowStart = 0;
let count = 0;

function readRaw(req) {
  return new Promise((resolve) => {
    if (req.body !== undefined) {
      resolve(typeof req.body === "string" ? req.body : JSON.stringify(req.body));
      return;
    }
    let raw = "";
    req.on("data", (c) => {
      raw += c;
      if (raw.length > 8192) req.destroy();
    });
    req.on("end", () => resolve(raw));
    req.on("error", () => resolve(""));
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).end();
    return;
  }
  const now = Date.now();
  if (now - windowStart > WINDOW_MS) {
    windowStart = now;
    count = 0;
  }
  count += 1;
  if (count <= LIMIT) {
    const raw = await readRaw(req);
    console.warn("[csp-report]", String(raw).slice(0, 1000));
  }
  res.status(204).end();
};
