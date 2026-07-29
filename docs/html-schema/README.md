# 세무사 학습자료 HTML 공통 스키마

이 패키지는 `SemosiKorea/notion_cta`의 차분한 종이색 배경, 네이비 헤더, 세리프 제목,
카드형 본문, 모바일 우선 레이아웃과 첨부 OX 퀴즈의 채점·오답복습 구조를 공통 컴포넌트로 분리한 템플릿입니다.

## 저장소 구조

```text
notion_cta/
├─ assets/
│  ├─ css/common.css
│  ├─ css/learning.css
│  ├─ css/quiz.css
│  ├─ js/common.js
│  └─ js/quiz.js
├─ templates/
│  ├─ learning-template.html
│  └─ quiz-template.html
├─ accounting/
├─ tax-law/
└─ administrative-litigation/
```

## 적용 방법

1. `assets` 폴더는 저장소 루트에서 한 번만 유지합니다.
2. 회계학·일반 학습자료는 `templates/learning-template.html`을 복제합니다.
3. 세법 OX는 `templates/quiz-template.html`을 복제합니다.
4. 생성 파일의 폴더 깊이에 맞게 CSS·JavaScript 상대경로를 조정합니다.
5. 과목별 색상을 바꾸려면 HTML을 수정하지 말고 `:root` 변수를 덮어씁니다.

## 핵심 설계

- 외형 공통: 종이색 배경, 네이비 헤더, 세리프 제목, 카드와 배지
- 학습자료: 개념 → 계산순서 → 분개 → 함정 → 능동회상
- OX 자료: 선택 → 채점 → 해설 → 오답 필터 → 진행률
- 모바일: 650px 이하에서 1열, 표 가로 스크롤
- 인쇄: 버튼 숨김, 카드 그림자 제거, OX 해설 표시
- 접근성: 의미론적 태그, 버튼 요소, `aria-expanded`, 충분한 대비

## 프로젝트 소스와의 역할 분담

ChatGPT 프로젝트에는 HTML 출력 규칙 문서만 넣고, 실제 CSS·JavaScript·템플릿은 이 저장소에서 관리합니다.
회계학 프로젝트는 `accounting-html-schema.md`, 세법 프로젝트는 `tax-ox-html-schema.md`를 사용합니다.
