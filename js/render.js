/**
 * 데이터 파일(data/*.json) 기반 콘텐츠 렌더러.
 * 새 강사·프로그램·가격·후기를 추가할 때는 컴포넌트 코드를 건드릴 필요 없이
 * 해당 JSON 파일에 항목 하나만 추가하면 된다.
 *
 * 사용법: <div data-render="programs" data-source="data/programs.json" data-limit="3"></div>
 */
(function () {
  "use strict";

  const WAVE_PATHS = {
    gentle: "M2 10 Q 9 4 17 10 T 32 10",
    wavy: "M2 12 Q 6 3 10 12 T 18 12 T 26 6 T 32 10",
    steps: "M2 16 L6 16 L6 4 L11 4 L11 16 L17 16 L17 8 L22 8 L22 16 L27 16 L27 4 L32 4",
    spiky: "M2 10 L6 2 L10 18 L14 4 L18 16 L22 6 L26 14 L30 6",
    flat: "M2 10 Q 9 8 17 10 T 32 10",
    measure: "M2 10 L2 6 M8 10 L8 2 M14 10 L14 7 M20 10 L20 4 M26 10 L26 8 M32 10 L32 5",
    default: "M2 10 Q 9 4 17 10 T 32 10",
  };

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function renderPrograms(container, items) {
    container.innerHTML = items
      .map((p) => {
        const d = WAVE_PATHS[p.wave] || WAVE_PATHS.default;
        return `<article class="course-card" data-reveal data-tilt>
          <div class="course-card-head">
            <span class="idx">${escapeHtml(p.idx)}</span>
            <svg class="course-wave" width="34" height="20" viewBox="0 0 34 20" fill="none"><path d="${d}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
          </div>
          <h3>${escapeHtml(p.title)}</h3>
          <p>${escapeHtml(p.desc)}</p>
          <div class="tags">${p.tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("")}</div>
        </article>`;
      })
      .join("");
  }

  function renderProgramDetail(container, items) {
    container.innerHTML = items
      .map((p) => {
        const d = WAVE_PATHS[p.wave] || WAVE_PATHS.default;
        return `<article class="detail-row" data-reveal>
          <svg class="wave-icon" width="34" height="34" viewBox="0 0 34 20" fill="none"><path d="${d}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
          <div>
            <h3>${escapeHtml(p.title)}</h3>
            <p>${escapeHtml(p.desc)}</p>
            <div class="tags" style="margin-top:0.8em;">${p.tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("")}</div>
          </div>
        </article>`;
      })
      .join("");
  }

  function renderInstructors(container, items) {
    container.innerHTML = items
      .map(
        (p) => `<article class="person-card" data-reveal data-tilt>
        <div class="person-frame">
          <svg viewBox="0 0 60 40" fill="none"><path d="M4 22 Q 14 10 22 22 T 40 22 T 56 22" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        </div>
        <h3>${escapeHtml(p.name)}</h3>
        <span class="person-role">${escapeHtml(p.role)} · ${escapeHtml(p.credential)}</span>
        <p class="person-note">${escapeHtml(p.note)}</p>
      </article>`
      )
      .join("");
  }

  function renderPricing(container, items) {
    container.innerHTML = items
      .map(
        (p) => `<article class="price-card${p.popular ? " price-card--popular" : ""}" data-reveal data-tilt>
        <h3>${escapeHtml(p.title)}</h3>
        <div class="price-value">문의 <small>/ ${escapeHtml(p.unit)}</small></div>
        <ul class="price-list">${p.items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>
        <a href="contact.html" class="btn${p.popular ? "" : " btn--ghost"}" style="margin-top: var(--space-2);">신청하기</a>
      </article>`
      )
      .join("");
  }

  function renderTestimonials(container, items) {
    container.innerHTML = items
      .map(
        (t) => `<blockquote class="quote-card" data-reveal data-tilt>
        <span class="stars">★★★★★</span>
        <p>"${escapeHtml(t.quote)}"</p>
        <footer>${escapeHtml(t.source)}</footer>
      </blockquote>`
      )
      .join("");
  }

  const RENDERERS = {
    programs: renderPrograms,
    "programs-detail": renderProgramDetail,
    instructors: renderInstructors,
    pricing: renderPricing,
    testimonials: renderTestimonials,
  };

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-render]").forEach((container) => {
      const type = container.dataset.render;
      const src = container.dataset.source;
      const limit = container.dataset.limit ? parseInt(container.dataset.limit, 10) : null;
      const renderer = RENDERERS[type];
      if (!renderer || !src) return;

      fetch(src)
        .then((res) => {
          if (!res.ok) throw new Error("data fetch failed: " + src);
          return res.json();
        })
        .then((items) => {
          const list = limit ? items.slice(0, limit) : items;
          renderer(container, list);
          container.dispatchEvent(new CustomEvent("content-rendered", { bubbles: true }));
        })
        .catch((err) => {
          console.error(err);
          container.innerHTML = `<p style="color: var(--text-dim);">콘텐츠를 불러오지 못했습니다.</p>`;
        });
    });
  });
})();
