# 폰트 서브셋 (2026-10-01)

서체는 Pretendard Variable(SIL OFL 1.1) 한 종.

- `fonts/PretendardSubset.woff2`: 사이트의 html, data/*.json, js/*.js에 쓰인 글자 + ASCII만 담은 서브셋(약 90KB, 굵기 축 400~900). 모든 페이지가 preload하고, `css/styles.css`의 글꼴 목록 첫 번째("Pretendard Subset").
- `css/pretendard.css`: jsDelivr의 Pretendard Variable 조각 폰트 CSS를 같은 출처로 옮긴 것. 서브셋에 없는 글자(폼에 입력하는 글자 등)만 이쪽 조각 폰트를 받는다.

## 문구를 바꿨을 때 다시 만드는 법
1. `pip install fonttools brotli` (한 번만)
2. 원본: npm 패키지 pretendard 1.3.9의 `dist/public/variable/PretendardVariable.ttf`
3. `python scripts/font-subset.py <이 저장소 경로> <PretendardVariable.ttf>`
4. 빠진 글자가 있어도 조각 폰트가 채우므로 깨지지는 않지만, 그 글자 때문에 조각 폰트를 추가로 받게 된다.
