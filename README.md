# 학과 대항전 클릭 배틀 (Clicker_Yonsei)

내 학과를 클릭하면 +1, 다른 학과를 클릭하면 -1. 로그인 없는 실시간 학과 대항전 웹앱.
**Next.js 14 · TypeScript · Tailwind CSS · Supabase · Vercel**

## 지금 상태

- ✅ MVP 기능 전부 구현됨 (선택 → 배틀 → 랭킹, 낙관적 업데이트, 폴링, 레이트리밋, 원자적 점수 처리)
- ✅ Supabase 없이도 로컬에서 전부 동작 (개발 모드, 서버 메모리 DB)
- ⬜ **Supabase 실제 연결** → [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md)
- ⬜ Vercel 배포

## 5분 안에 실행하기

```bash
npm install          # 처음 한 번
npm run dev          # http://localhost:3000
```

`.env.local` 이 없어도 됩니다. 없으면 자동으로 **개발 모드**(서버 메모리에 점수 저장, 재시작 시 초기화)로 동작합니다.
실제 DB 로 붙이려면 [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) 를 따라가세요.

```bash
npm run check        # 타입 체크 + lint. 커밋 전에 한 번
```

## 문서

| 문서 | 누가 읽나 |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | **모든 팀원.** 파일별 역할, 데이터 흐름, 왜 이렇게 설계했는지 — 배경지식 포함 |
| [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) | Supabase 연결 · Vercel 배포 담당자 |
| [SPEC.md](SPEC.md) | 서비스 명세 (기능·규칙·공통 계약) |
| [prompts/](prompts/) | 역할별 작업 지시서. Cursor/Claude 에 붙여넣고 시작 |

## 구조 한 장

```
브라우저 (app/*/page.tsx, components/)
   │  읽기: Supabase anon 키로 직접 (읽기만 허용)
   │  쓰기: fetch("/api/support" | "/api/attack")  ← 변화량은 안 보냄
   ▼
서버 (app/api/**/route.ts → lib/server/)
   │  레이트리밋 → 검증 → service_role 키로 DB 함수 호출
   ▼
DB (Supabase Postgres)
      support_department / attack_department  — 단일 UPDATE 로 원자적 ±1
      RLS: 읽기 공개, 쓰기 불가
```

핵심 원칙 하나: **브라우저는 못 믿는다.** 점수를 바꾸는 코드와 관리자 키는 `lib/server/` 와 `app/api/` 에만 있습니다.

## 폴더

```
app/           화면(page.tsx)과 API(route.ts). 폴더 경로 = URL
components/    화면 부품. 로직 없음
lib/           화면 없는 로직 (데이터 조회, 검색, localStorage, 훅)
lib/server/    ⚠️ 서버 전용 — 관리자 키, 레이트리밋. 브라우저 코드에서 import 금지
types/         공통 타입
supabase/      DB 만드는 SQL
docs/          문서
prompts/       팀원별 지시서
```

## 브랜치 규칙

- `main` — 항상 동작하는 상태. 직접 push 하지 않고 PR 로 합칩니다.
- `feature/<이름>` — 작업 브랜치. 예: `feature/supabase`, `feature/battle-fx`
- 커밋 전 `npm run check`.
- `.env.local` 과 `service_role` 키는 절대 커밋하지 않습니다 (`.gitignore` 에 포함).

## 자주 묻는 것

**Q. 학과를 추가하려면?** `lib/departmentNames.ts` 에 한 줄 + `supabase/migrations/` 에 새 SQL. (ARCHITECTURE 8절)
**Q. "컴공" 같은 약칭 검색을 추가하려면?** `lib/searchDepartments.ts` 의 `ALIASES`.
**Q. 점수가 서버 재시작 때 0 이 돼요.** 개발 모드라서 정상. Supabase 연결하면 사라집니다.
**Q. 다른 사람 클릭이 늦게 보여요.** 2.5초 폴링. `app/battle/page.tsx` 의 `POLL_INTERVAL_MS`.
