/**
 * 강의실 목록 + 상태 정규화 — api/rooms.js와 api/room-toggle.js가 함께 쓴다.
 * 강의실 개수·이름은 상담 후 확정 전까지 임시. 상담 후 이 배열만 고치면
 * 위젯/토글 엔드포인트 양쪽에 동시에 반영된다.
 */

const KV_KEY = "ppadum:rooms";
const ALLOWED_STATUSES = ["in-use", "empty"];

const ROOMS = [
  { id: "personal-1", name: "개인레슨룸 1" },
  { id: "personal-2", name: "개인레슨룸 2" },
  { id: "group-1", name: "그룹룸" },
];

function withDefaults(saved) {
  const rooms = (saved && saved.rooms) || [];
  const byId = new Map(rooms.map((r) => [r.id, r]));
  return ROOMS.map((r) => {
    const s = byId.get(r.id);
    return {
      id: r.id,
      name: r.name,
      status: s && ALLOWED_STATUSES.includes(s.status) ? s.status : "empty",
      updatedAt: (s && s.updatedAt) || null,
    };
  });
}

module.exports = { KV_KEY, ALLOWED_STATUSES, ROOMS, withDefaults };
