/**
 * "음성 주파수 측정" 섹션의 손그림 톤 파형 라인 — 스크롤에 맞춰 천천히 그려진다.
 * 기술적인 오실로스코프 느낌이 아니라, 잔잔하게 선 하나가 이어지는 느낌을 의도했다.
 * GSAP/ScrollTrigger가 없거나 prefers-reduced-motion이면 그냥 완성된 선으로 보인다(안전 기본값).
 */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function initDrawLines() {
    document.querySelectorAll(".draw-line").forEach((path) => {
      const length = path.getTotalLength();
      path.style.strokeDasharray = String(length);

      if (reduceMotion || !window.gsap || !window.ScrollTrigger) {
        path.style.strokeDashoffset = "0";
        return;
      }

      path.style.strokeDashoffset = String(length);
      window.gsap.to(path, {
        strokeDashoffset: 0,
        duration: 1.6,
        ease: "power1.inOut",
        scrollTrigger: { trigger: path, start: "top 85%" },
      });
    });
  }

  document.addEventListener("DOMContentLoaded", initDrawLines);
})();
