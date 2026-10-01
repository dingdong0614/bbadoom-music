# 빠둠뮤직 보컬 트레이닝 센터

## doion 사이트 안내
- 사이트: 빠둠뮤직 보컬 트레이닝 센터 (보컬 학원, 부산 양정·서울 충무로). 만들다 만 사이트라 doion.co.kr 사례에는 내려 둠(published:false)
- GitHub: dingdong0614/bbadoom-music (origin, 저장소 이름이 폴더 이름과 다름). 기본 브랜치: main
- 라이브: https://bbadoom-music.vercel.app. 이 폴더에는 .vercel 연결 정보가 없어 Vercel 프로젝트명은 확인 필요
- 스택: 정적 HTML(index, courses, pricing, instructors, reviews, faq, contact, privacy) + css/js + Vercel 서버리스 api/(rooms, room-toggle, csp-report, 저장소는 api/_kv.js). 서체 Pretendard Variable 서브셋
- 로컬 확인: 정적 화면은 폴더에서 python -m http.server 8000. api/는 Vercel 환경이 필요해 로컬에서 동작 확인 불가(vercel dev 사용 여부는 확인 필요)
- 배포: 기본 브랜치(main)에 push하면 Vercel 자동 배포(수동 vercel deploy는 저장소와 어긋나므로 쓰지 않음). 미리보기 브랜치 배포는 Vercel 로그인 보호. push는 대표 요청·승인 후에만. 보안 헤더는 vercel.json
- 폰트·문구 변경 시: python scripts/font-subset.py <이 저장소 경로> <PretendardVariable.ttf> (docs/font-subset.md 참고). 사진 출처는 docs/image-credits.md
- 검사 스크립트: 없음
- 건드리면 안 되는 것: doion 사례에 다시 올리는 것은 대표 확인 후에만. 가격·강사 수·강의실 수 등 미확인 정보는 지어내지 않음
- 공통 규칙: doion 공통 규칙은 doion 프로젝트 메모리(제작 방식·실무표준)를 따름.
