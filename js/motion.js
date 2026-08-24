/**
 * 스무스 스크롤(Lenis) + 잔잔한 스크롤 리빌(GSAP) + 카드 호버 리프트.
 * "온화하고 따뜻한" 톤에 맞춰 틸트/글레어 같은 과한 효과 대신 은은한 페이드+라이즈만 사용한다.
 * render.js가 비동기로 채우는 콘텐츠는 DOMContentLoaded 시점엔 아직 없으므로,
 * render.js가 쏘는 "content-rendered" 이벤트를 받아 그 컨테이너에도 다시 적용한다.
 * GSAP 로드 실패/prefers-reduced-motion이면 콘텐츠는 기본값(보임)으로 안전하게 남는다.
 */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isCoarsePointer = !window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const canReveal = !reduceMotion && window.gsap && window.ScrollTrigger;

  if (canReveal) window.gsap.registerPlugin(window.ScrollTrigger);

  function applyReveal(root) {
    const targets = root.querySelectorAll("[data-reveal]:not(.js-reveal-done)");
    targets.forEach((el, i) => {
      el.classList.add("js-reveal-done");
      if (!canReveal) return;
      el.classList.add("js-reveal");
      window.gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay: (i % 3) * 0.08,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 90%" },
      });
    });
  }

  function applyLift(root) {
    if (reduceMotion || isCoarsePointer) return;
    root.querySelectorAll("[data-tilt]:not(.js-lift-done)").forEach((card) => {
      card.classList.add("js-lift-done");
      // CSS의 :hover transform(translateY)만으로 충분히 은은해서 별도 JS 틸트는 쓰지 않는다.
    });
  }

  function apply(root) {
    applyReveal(root);
    applyLift(root);
  }

  document.addEventListener("DOMContentLoaded", () => apply(document));
  document.addEventListener("content-rendered", (e) => apply(e.target));

  // ---- smooth scroll (데스크톱 · 모션 허용 시에만) ----
  // Lenis는 딱 하나의 rAF 루프로만 구동해야 한다 — GSAP 티커와 순수 rAF 루프를 동시에
  // 붙이면 서로 다른 시간 소스로 두 번 갱신되어 스크롤이 어긋나고, ScrollTrigger가
  // Lenis의 스크롤을 놓쳐 스크롤 리빌/드로우 애니메이션이 멈추는 버그가 생긴다.
  if (!reduceMotion && !isCoarsePointer && window.Lenis) {
    const lenis = new window.Lenis({ duration: 1.05, smoothWheel: true });

    if (canReveal) {
      lenis.on("scroll", window.ScrollTrigger.update);
      window.gsap.ticker.add((time) => lenis.raf(time * 1000));
      window.gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (time) => {
        lenis.raf(time);
        requestAnimationFrame(raf);
      };
      requestAnimationFrame(raf);
    }
  }
})();
