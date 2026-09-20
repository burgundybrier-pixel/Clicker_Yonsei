# 구조 설명 — 어떤 파일이 무슨 일을 하고, 왜 그렇게 만들었나

> 코딩을 처음 접하는 팀원도 읽을 수 있게 썼습니다. 위에서부터 순서대로 읽으면 전체가 이어집니다.
> 각 절의 **[배경지식]** 은 그 부분을 이해하는 데 필요한 최소한의 개념입니다.

---

## 1. 큰 그림

이 앱은 세 곳에서 돌아갑니다.

```
┌──────────────┐   HTTP 요청    ┌──────────────┐   SQL / RPC   ┌──────────────┐
│  브라우저     │ ───────────▶ │  서버         │ ───────────▶ │  DB           │
│  (사람이 봄)  │ ◀─────────── │  (Next.js)    │ ◀─────────── │  (Supabase)   │
└──────────────┘   HTML/JSON    └──────────────┘   결과 행     └──────────────┘
  app/*/page.tsx                  app/api/**/route.ts            supabase/migrations/*.sql
  components/*                    lib/server/*
  lib/clientStorage.ts
```

**[배경지식] 왜 브라우저가 DB 에 직접 쓰지 않나?**
브라우저에서 실행되는 코드는 사용자가 전부 볼 수 있고(F12), 마음대로 바꿔서 실행할 수 있습니다. 브라우저가 "경영학과 +1000" 을 보낼 수 있다면 게임이 망가집니다. 그래서 **"브라우저에서 오는 건 못 믿는다"** 가 웹 개발의 기본 원칙이고, 이 프로젝트 설계의 절반은 여기서 나옵니다.

---

## 2. 폴더 지도

```
app/                 ★ 화면과 API.  Next.js 는 "폴더 경로 = URL 주소"
├─ layout.tsx          모든 페이지의 공통 껍데기 (<html>, <body>, 배경색, 탭 제목)
├─ page.tsx            /          랜딩 — 서버 컴포넌트
├─ select/page.tsx     /select    학과 선택 — 클라이언트 컴포넌트
├─ battle/page.tsx     /battle    배틀 (핵심) — 클라이언트 컴포넌트
├─ api/
│  ├─ support/route.ts   POST /api/support   +1  ──┐ 둘 다 lib/server/scoreRoute.ts 로 위임
│  ├─ attack/route.ts    POST /api/attack    -1  ──┘
│  └─ ranking/route.ts   GET  /api/ranking   목록 (주로 개발 모드용)
└─ globals.css         Tailwind 로딩 + 기본 폰트

components/          ★ 화면 부품. "받은 데이터를 그리기만" 하고 로직은 없다
├─ Header.tsx            상단 바
├─ DepartmentSearch.tsx  검색 입력창
├─ DepartmentCard.tsx    선택 화면의 학과 카드 1개
├─ RankingList.tsx       랭킹 목록 (랜딩·배틀 공용, 버튼은 바깥에서 주입)
├─ MyDepartmentCard.tsx  배틀 상단 "내 학과" 큰 카드
├─ ScoreButton.tsx       +1/-1 버튼의 실제 구현
├─ SupportButton.tsx     ScoreButton(variant=support) 껍데기
└─ AttackButton.tsx      ScoreButton(variant=attack)  껍데기

lib/                 ★ 화면 없는 로직
├─ supabase.ts           Supabase 연결 여부 판단 + 읽기 전용(anon) 클라이언트   [브라우저 OK]
├─ departments.ts        getDepartments()  + 공통 조회 fetchAllDepartments()   [브라우저 OK]
├─ scores.ts             getRanking(), supportDepartment(), attackDepartment() [브라우저 OK]
├─ clientStorage.ts      localStorage 읽기/쓰기 (내 학과, 클릭 기록)           [브라우저 전용]
├─ searchDepartments.ts  약칭·초성·띄어쓰기 무시 검색                          [브라우저 OK]
├─ departmentNames.ts    참여 학과 목록의 단일 원본
├─ devStore.ts           Supabase 없을 때 쓰는 메모리 DB (개발용)
├─ format.ts             점수 12540 → "12,540"
├─ hooks/
│  └─ useRankingPolling.ts  2.5초마다 랭킹 다시 불러오는 커스텀 훅
└─ server/            ⚠️ 서버 전용. "use client" 파일·components/ 에서 import 금지
   ├─ supabaseAdmin.ts    service_role(관리자) 키 클라이언트
   ├─ rateLimit.ts        초당 30회 요청 제한
   └─ scoreRoute.ts       /api/support, /api/attack 의 공통 처리

types/department.ts  ★ "학과" 의 모양 { id, name, score }

supabase/migrations/ ★ DB 를 만드는 SQL
├─ 20260915000000_init.sql            테이블 + 함수 + 보안 규칙 + 학과 66개
└─ 20260919000000_departments_v2.sql  예전 DB 를 66개 목록으로 갱신할 때만

docs/                문서 (이 파일, Supabase 가이드)
prompts/             팀원별 작업 지시서 (Cursor 에 붙여넣는 용도)
SPEC.md              서비스 명세
```

**분리 원칙 한 줄**: `app/` 은 "어느 주소에 뭘 보여줄지", `components/` 는 "화면 조각", `lib/` 은 "화면 없는 일", `lib/server/` 는 "브라우저에 절대 나가면 안 되는 일".

---

## 3. 버튼을 한 번 누르면 일어나는 일

이 하나만 이해하면 프로젝트 전체가 보입니다. 배틀 화면에서 "경영학과 -1" 을 누른 경우:

```
① 브라우저   AttackButton 클릭
② 브라우저   app/battle/page.tsx  sendClick("attack", 경영학과)
             ├─ 60ms 안에 같은 버튼 또 눌렸으면 무시           (디바운스)
             ├─ 화면 점수 즉시 -1                              (낙관적 업데이트)
             └─ localStorage 에 attackClicks +1                (lib/clientStorage.ts)
③ 브라우저   lib/scores.ts  attackDepartment(5)
             → fetch POST /api/attack  { departmentId: 5 }     ← "얼마 바꿀지" 는 안 보냄
④ 서버       app/api/attack/route.ts → lib/server/scoreRoute.ts
             ├─ 이 IP 가 1초에 30번 넘게 보냈나?  → 429
             ├─ departmentId 가 정수인가?          → 아니면 400
             └─ 관리자 키로 DB 함수 호출  rpc("attack_department", {dept_id: 5})
⑤ DB         UPDATE departments SET score = GREATEST(score-1, 0) WHERE id=5 RETURNING *
⑥ 서버→브라우저  { department: { id:5, name:"경영학과", score:99 } }
⑦ 브라우저   서버가 준 진짜 값으로 화면 덮어씀
             (실패했으면: 클릭 기록 되돌리고, 랭킹 전체 다시 불러와 동기화)

(별도로)     lib/hooks/useRankingPolling.ts 가 2.5초마다 getRanking() → 다른 사람 클릭도 반영
```

---

## 4. 파일 하나하나

### `types/department.ts`
```ts
export interface Department { id: number; name: string; score: number }
```
**[배경지식] interface** = "이 모양의 객체" 라는 약속. 모든 파일이 이걸 import 하면, 누가 `score` 에 문자열을 넣으려 할 때 TypeScript 가 저장 전에 빨간 줄을 그어줍니다.
**왜**: 여러 사람이 각자 파일을 만들어도 이 타입만 공유하면 코드를 서로 안 봐도 맞물립니다.

### `lib/supabase.ts` — 연결 여부 판단 + 읽기 클라이언트
- `isSupabaseConfigured`: `.env.local` 값이 플레이스홀더면 `false`. 이 값 하나로 앱 전체가 "개발 모드 / 실제 모드" 를 갈라탑니다.
- `supabaseAnon`: anon 키로 만든 클라이언트. **읽기만** 됩니다(RLS). 미연결이면 `null`.
- `fetchWithTimeout`: 모든 Supabase 요청에 5초 제한. 서버가 죽어도 화면이 영원히 "불러오는 중" 에 머물지 않게.

**[배경지식] 환경변수와 `NEXT_PUBLIC_`**: `.env.local` 의 값은 `process.env.이름` 으로 읽습니다. Next.js 는 이름이 `NEXT_PUBLIC_` 으로 시작하는 것만 브라우저로 보내고, 나머지는 서버에만 남깁니다. 그래서 관리자 키엔 접두사가 없습니다.

### `lib/server/supabaseAdmin.ts` — 관리자 키 (서버 전용)
`service_role` 키는 RLS 를 포함한 모든 규칙을 무시합니다. 그래서 `lib/server/` 에 격리하고, 브라우저에서 호출되면 `throw` 하는 방어 코드까지 넣었습니다.

### `lib/departments.ts`, `lib/scores.ts` — 데이터 함수 4개
| 함수 | 하는 일 | 경로 |
|---|---|---|
| `getDepartments()` | 이름순 전체 목록 (선택 화면) | 읽기 |
| `getRanking()` | 점수 내림차순 (배틀·랜딩) | 읽기 |
| `supportDepartment(id)` | +1 | `fetch("/api/support")` |
| `attackDepartment(id)` | -1 | `fetch("/api/attack")` |

읽기 두 개는 `fetchAllDepartments()` 를 공유하고 정렬만 다릅니다. `fetchAllDepartments` 는 상황에 따라 경로를 고릅니다:
- Supabase 연결됨 → anon 키로 직접 읽기
- 미연결 + 서버(랜딩 페이지) → `devStore` 직접
- 미연결 + 브라우저 → `/api/ranking`

**쓰기 두 개는 DB 를 안 건드리고 내 서버 API 를 부릅니다.** "읽기는 공개, 쓰기는 서버 경유" 원칙이 코드로 나타난 곳. `ScoreRequestError` 는 HTTP 상태 코드를 들고 다니는 에러로, 화면이 429 를 조용히 처리할 때 씁니다.

### `lib/server/scoreRoute.ts` — 서버의 문지기
`/api/support` 와 `/api/attack` 은 "어느 방향으로 1점 바꾸는가" 만 달라서 하나로 합쳤습니다. 순서: 레이트리밋 → 형식 검사 → (개발 모드면 devStore / 아니면 Supabase RPC) → 결과.

**가장 중요한 설계**: 요청 본문엔 `departmentId` 만 있습니다. 변화량은 엔드포인트가 정합니다. 클라이언트가 `{ delta: 9999 }` 를 보내도 서버는 읽지 않습니다.

### `lib/server/rateLimit.ts` — 초당 30회
**[배경지식] 슬라이딩 윈도우**: IP 별로 "최근 요청 시각 목록" 을 들고 있다가, 요청이 오면 1초 넘은 건 버리고 남은 게 30개 이상이면 거절. 사람은 아무리 빨라도 초당 10~15회라 정상 플레이는 안 걸리고 매크로만 걸립니다.
**한계**: 서버 메모리라서 서버가 여러 대면 각자 셉니다. MVP 용.

### `lib/devStore.ts` — 개발용 메모리 DB
Supabase 없이 클릭·랭킹이 동작하게 하는 가짜 DB. `globalThis` 에 붙여둬서 Next.js 가 파일 저장 때마다 모듈을 다시 불러도(HMR) 점수가 유지됩니다. 서버 재시작하면 0 으로.

### `lib/clientStorage.ts` — 로그인 없이 "나" 를 기억
**[배경지식] localStorage**: 브라우저가 사이트별로 갖고 있는 작은 저장 공간(키-값 문자열). 새로고침해도, 브라우저를 꺼도 남습니다. 단 그 브라우저에서만 — 폰으로 열면 다시 선택해야 합니다.
저장하는 것: `selectedDepartmentId`, `clickStats`(응원/공격/총합 JSON).
`typeof window === "undefined"` 체크가 있는 이유: Next.js 는 서버에서 먼저 HTML 을 그리는데(SSR) 서버엔 `window` 가 없어서 그냥 부르면 에러가 납니다.
`record…`/`revert…` 쌍: 클릭 즉시 올리고, 서버가 실패하면 되돌립니다.

### `lib/searchDepartments.ts` — 검색
정식 이름 + 약칭(`ALIASES`) 을 대상으로 ① 정확 일치 ② 앞부분 일치 ③ 포함 ④ 순서만 일치 순으로 점수를 매겨 정렬합니다. 초성 검색은 한글 유니코드 구조를 이용합니다(완성형 글자 코드에서 0xAC00 을 빼고 588 로 나누면 초성 인덱스). 약칭을 추가하려면 `ALIASES` 에 한 줄만 넣으면 됩니다.

### `lib/hooks/useRankingPolling.ts` — 폴링
**[배경지식] 커스텀 훅**: `use` 로 시작하는 함수에 `useState`/`useEffect` 를 묶어두면 여러 화면에서 재사용할 수 있는 "로직 조각" 이 됩니다. 이 훅은 첫 로드 + 주기적 재조회 + 탭이 숨겨졌을 때 쉬기 + 페이지 떠날 때 타이머 정리를 담당합니다. 나중에 WebSocket 으로 바꿔도 이 파일만 고치면 됩니다.

### `app/layout.tsx`
`<html lang="ko"><body>{children}</body>` — 각 `page.tsx` 가 `{children}` 자리에 끼워집니다. 탭 제목(`metadata`) 도 여기.

### `app/page.tsx` — 랜딩
파일 맨 위에 `"use client"` 가 **없습니다** → **서버 컴포넌트**. 서버에서 `await getRanking()` 을 실행해 완성된 HTML 을 보냅니다. `async function` 이 가능하고 `useState` 는 못 씁니다.
`export const dynamic = "force-dynamic"`: 캐시하지 말고 매번 새로 그리라는 뜻.
"누적 점수" 는 전체 점수 합계입니다. 공격으로 깎이면 줄어드는 근사값이고, 정확한 누적 클릭 수가 필요하면 DB 에 카운터 컬럼을 추가해야 합니다.

### `app/select/page.tsx` — 학과 선택
`"use client"` → **클라이언트 컴포넌트**. 사용자 입력이 있으면 필요합니다.
**[배경지식] 자주 나오는 훅 셋**
- `useState`: 바뀌면 화면이 다시 그려지는 변수
- `useEffect(fn, [])`: 화면이 처음 뜬 직후 한 번 실행 (여기서 localStorage 읽고 목록 로드)
- `useMemo`: 계산 결과 캐시. 검색 결과는 검색어나 목록이 바뀔 때만 다시 계산

### `app/battle/page.tsx` — 배틀 (핵심)
3절의 흐름 그 자체입니다. 데이터 로딩은 훅에 맡기고, 이 파일은 ① 내 학과 확인/리다이렉트 ② 파생값 계산(정렬, 내 순위) ③ `sendClick` 만 갖습니다.
**[배경지식] `useRef`**: `useState` 와 달리 바뀌어도 화면을 다시 그리지 않는 값 보관함. "마지막 클릭 시각" 처럼 기억은 해야 하지만 화면엔 영향 없는 값에 씁니다.

### `components/`
**[배경지식] props**: 컴포넌트에 넘기는 인자. `<SupportButton onClick={…} label="+1" />`. 컴포넌트는 "데이터 받아서 그리기" 만 하고 로직은 page 가 합니다. 그래서 같은 버튼을 상단 카드와 랭킹 행 양쪽에서 재사용할 수 있습니다.
- `RankingList` 의 `renderAction?: (dept, rank) => ReactNode` — 각 행 오른쪽에 뭘 그릴지를 **바깥에서 함수로** 받습니다. 랜딩에선 버튼 없이, 배틀에선 +1/-1 을 달아서 같은 컴포넌트를 씁니다. 이 패턴을 **render prop** 이라고 합니다.
- `ScoreButton` 이 실제 버튼이고 `SupportButton`/`AttackButton` 은 색만 정해주는 껍데기입니다. 이름을 남긴 건 SPEC 의 공통 계약 때문입니다.

---

## 5. 데이터베이스 (`supabase/migrations/20260915000000_init.sql`)

**[배경지식] 마이그레이션**: DB 구조를 SQL 파일로 적어두는 것. 누가 새 Supabase 프로젝트를 만들어도 이 파일 하나 실행하면 똑같은 DB 가 나옵니다.

```sql
create table departments (
  id bigint generated always as identity primary key,   -- 자동 증가 번호
  name text not null unique,                            -- 중복 학과 방지
  score bigint not null default 0 check (score >= 0),   -- DB 레벨에서도 음수 차단
  created_at / updated_at timestamptz
);
```

**함수(RPC) 2개 — 왜 DB 안에서 계산하나**
초보가 가장 많이 하는 실수: 서버에서 `score = 읽기(); score++; 저장(score)`. 두 사람이 동시에 하면 둘 다 100 을 읽고 둘 다 101 을 저장 → 한 클릭이 증발합니다(**race condition**).
```sql
update departments set score = score + 1 where id = dept_id returning *;
```
이 한 문장은 Postgres 가 그 행을 잠그고 처리해서 100→101→102 가 보장됩니다. 그래서 SQL 함수로 만들어 `rpc()` 로 부릅니다.

**RLS (Row Level Security)** — "누구나 SELECT, 쓰기는 아무도 불가" 를 **DB 규칙** 으로 박아둠. 실수로 브라우저에서 UPDATE 를 날려도 DB 가 거절합니다. 관리자 키는 RLS 를 무시하므로 서버만 쓸 수 있습니다.
**함수 권한** — 두 함수는 `service_role` 만 실행 가능. anon 키로 `rpc()` 를 불러도 거절.

---

## 6. 설계 결정 요약 — "왜 그렇게 했나"

| 결정 | 이유 | 대가 |
|---|---|---|
| 변화량은 서버가 정한다 | 브라우저는 조작 가능 | 엔드포인트가 2개 |
| 증감은 DB 함수의 단일 UPDATE | race condition 방지 | SQL 함수 관리 |
| 키 두 개 + RLS | 실수해도 DB 가 막아줌 | 환경변수 3개 |
| 낙관적 업데이트 | 클리커 게임에서 100ms 지연은 치명적 | 롤백 코드 필요 |
| 2.5초 폴링 | 단순, 어디서나 됨 | 완전 실시간은 아님 |
| 로그인 없음 → localStorage | 가입 없이 바로 플레이 | 기기 간 연동 불가, 레이트리밋이 IP 근사 |
| 공통 계약(타입·함수 4개·키) 고정 | 여러 사람이 동시에 작업 가능 | 이름 바꾸기 어려움 |
| 개발 모드(devStore) | Supabase 없이도 UI 작업 가능 | 실서비스에선 반드시 꺼야 함 (자동) |

---

## 7. 설정 파일

| 파일 | 역할 |
|---|---|
| `package.json` | 쓰는 라이브러리 목록 + `npm run dev/build/lint/typecheck/check` |
| `package-lock.json` | 설치된 정확한 버전. 자동 생성, 커밋함 (팀원이 같은 버전 받게) |
| `tsconfig.json` | TypeScript 설정. `@/` 가 프로젝트 루트를 가리키는 `paths` 가 여기 |
| `tailwind.config.ts` | `brand` 파랑 팔레트, `pop` 애니메이션. `content` 에 적힌 폴더만 스캔 |
| `next.config.mjs` | Next.js 설정 (`reactStrictMode`) |
| `.eslintrc.json` | 코드 검사 규칙 |
| `.env.local` | 비밀 키. `.gitignore` 에 있어 커밋 안 됨 |
| `.env.local.example` | `.env.local` 을 만들 때 참고하는 빈 양식 |
| `.next/`, `node_modules/` | 자동 생성물. 지워도 `npm install`, `npm run dev` 로 복구 |

---

## 8. 자주 하는 작업, 어디를 고치나

| 하고 싶은 것 | 고칠 곳 |
|---|---|
| 학과 추가/삭제 | `lib/departmentNames.ts` + `supabase/migrations/` 에 새 SQL |
| 약칭 추가 (예: "컴공") | `lib/searchDepartments.ts` 의 `ALIASES` |
| 폴링 주기 변경 | `app/battle/page.tsx` 의 `POLL_INTERVAL_MS` |
| 레이트리밋 변경 | `lib/server/rateLimit.ts` 의 `MAX_REQUESTS_PER_WINDOW` |
| 색상/애니메이션 | `tailwind.config.ts` |
| 랭킹 행 모양 | `components/RankingList.tsx` |
| 버튼 모양 | `components/ScoreButton.tsx` |
| 실시간(WebSocket)으로 전환 | `lib/hooks/useRankingPolling.ts` 만 |
| 랜딩 통계 항목 | `app/page.tsx` |
