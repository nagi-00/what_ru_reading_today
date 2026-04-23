# What are you reading today?

네이밍 그대로, "오늘 뭐 읽어?"라는 질문에서 시작한 뉴몰피즘 독서 아카이브 데스크탑 앱.
Aladin TTB OpenAPI와 로컬 저장소를 사용해 내가 읽은 책을 기록/별점/코멘트로 남기고,
마음에 드는 북카드로 내보낼 수 있어요.

<p align="center">
  <em>Electron + Vite + React + TypeScript · Zustand · html-to-image</em>
</p>

## 주요 기능

- **상단 검색** — Aladin TTB `ItemSearch`로 실시간 검색, 선택 시 `ItemLookUp`으로 줄거리까지 보강해서 서재에 추가. 추가한 날짜가 기록돼요.
- **좌측 서재** — 읽은 모든 책을 최신순 / 오래된순 / 별점순 / 가나다순으로 정렬.
- **중앙 목록** — "내 목록"(직접 만든 컬렉션) 또는 "카테고리"(Aladin `categoryName` 파싱)로 전환. 행을 클릭하면 목록 내 도서가 펼쳐지고 다시 클릭하면 최소화.
- **우측 상세** — 표지·저자·번역가·출판사·출간일·카테고리·ISBN·줄거리·내 별점·내 코멘트·목록 소속 관리.
- **북카드 내보내기** — 별점+코멘트가 담긴 뉴몰피즘 카드를 PNG로 저장.
- **커스텀** — 로컬 폰트 선택, 단일 테마컬러 지정(팔레트 자동 생성), 다크 모드.

## 레이아웃

```
┌─────────────────────────────────────────────────────────────┐
│  📖 Brand      [🔍 검색 ………………………………]   ＋직접추가  ⚙ 설정 │
├──────────┬─────────────────────────┬──────────────────────┤
│          │ 내 목록 / 카테고리          │                      │
│  서재    │ ─ 목록1 (열림 ▾)           │     [ 표지 ]         │
│  (정렬)  │    └ 책 타일 …              │   제목 / 저자        │
│  …       │ ─ 목록2 (닫힘 ▸)           │   출판사/ISBN/장르   │
│          │                             │   줄거리 / 별점 /    │
│          │                             │   코멘트 / 북카드    │
└──────────┴─────────────────────────┴──────────────────────┘
```

## 설치 & 실행

```bash
npm install

# 1) 브라우저에서 확인 (Vite 프록시가 CORS를 처리)
npm run dev
# → http://localhost:5173/ 열기

# 2) Electron 데스크탑 앱으로 실행
npm run electron:dev

# 3) 배포용 패키징
npm run electron:build
```

## Aladin TTB 키

1. [알라딘 OpenAPI](https://blog.aladin.co.kr/openapi) 에서 TTB 키를 발급
2. 앱 실행 후 ⚙ **설정** → "Aladin TTB 키"에 붙여넣기 → **저장**
3. 키는 기기 로컬에만 저장돼요. Electron에서는 main 프로세스가, 브라우저에서는 Vite dev 프록시가 알라딘 서버로 중계합니다.

## API 필드 매핑

Aladin `ItemSearch` / `ItemLookUp` 응답 → 내부 `Book` 모델:

| Aladin 필드 | 내부 필드 | 비고 |
| --- | --- | --- |
| `title` | `title` | |
| `author` | `authors`, `translators` | `"김영하 (지은이), 홍길동 (옮긴이)"` 같은 문자열을 역할별로 파싱 |
| `publisher` | `publisher` | |
| `pubDate` | `publishedAt` | |
| `isbn13` (fallback `isbn`) | `isbn` | 13자리 우선 |
| `cover` | `thumbnail` | `Cover=Big` 요청 |
| `categoryName` | `categories` | `">"` 구분, `국내도서/외국도서` prefix 제거 후 상위 2단계 보존 |
| `description` / `subInfo.story` | `contents` | `ItemLookUp`의 story가 있으면 우선 |
| `link` | `url` | 알라딘 상세 페이지 |

## 데이터 저장

서재/목록/설정은 `localStorage`(`wryrt.store.v2`)에 JSON으로 저장돼요.
향후 `electron-store` 기반 파일 저장 및 JSON export/import 추가 예정.

## 기술 스택

- **Electron** — 데스크탑 셸 + 메인 프로세스의 Aladin 프록시
- **Vite + React + TypeScript** — 렌더러
- **Zustand (persist)** — 상태 관리/영속화
- **CSS Variables + 동적 팔레트** — 단일 seed 컬러에서 뉴몰피즘 전용 컬러·그림자를 파생
- **html-to-image** — 북카드 PNG 내보내기
