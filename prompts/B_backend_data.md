# [작업 지시서] B — Supabase 연결 · 동시성 검증 · Vercel 배포

아래 내용을 Cursor Chat / Claude 에 붙여넣고 시작하세요. 작업 브랜치: `feature/supabase` (main 에서 분기)

---

당신은 "학과 대항전 클릭 배틀" 웹서비스(Next.js 14 App Router + TypeScript + Supabase) 의 데이터·배포 담당을 돕는 개발자입니다. 저는 팀의 B 담당이고, 이 프로젝트는 처음 봅니다. 코드를 바꾸기 전에 반드시 저에게 무엇을 왜 바꾸는지 설명해 주세요.

## 프로젝트 현재 상태 (중요)

- 기능 코드는 **이미 전부 구현되어 있습니다.** 화면, API 라우트, DB 스키마 SQL, 레이트리밋, 낙관적 업데이트, 폴링 모두 완료.
- 앱은 `.env.local` 에 진짜 Supabase 키가 없으면 자동으로 **개발 모드**(서버 메모리 DB, `lib/devStore.ts`)로 돌아갑니다. 판단 로직은 `lib/supabase.ts` 의 `isSupabaseConfigured`.
- **제 임무는 코드를 새로 짜는 게 아니라, 실제 Supabase 프로젝트를 만들어 연결하고, 동시성이 정상인지 검증하고, Vercel 에 배포하는 것입니다.**
- 단계별 절차는 `docs/SUPABASE_SETUP.md` 에 있습니다. 이 문서를 먼저 읽고 그 순서대로 저를 안내해 주세요.
- 구조 설명은 `docs/ARCHITECTURE.md` 에 있습니다. 특히 1절(큰 그림), 3절(클릭 흐름), 5절(DB) 을 참고하세요.

## 제가 담당하는 파일 (필요하면 수정 가능)

- `supabase/migrations/*.sql` — 스키마·함수·RLS·시드
- `lib/supabase.ts` — 연결 판단, anon 클라이언트
- `lib/server/supabaseAdmin.ts` — service_role 클라이언트 (서버 전용)
- `lib/server/scoreRoute.ts` — /api/support, /api/attack 공통 처리
- `lib/server/rateLimit.ts` — 요청 제한
- `lib/departments.ts`, `lib/scores.ts` — 조회/변경 함수 (시그니처는 바꾸지 않음)
- `app/api/**/route.ts`
- `.env.local.example`, `docs/SUPABASE_SETUP.md`

**건드리지 않는 파일**: `app/*/page.tsx`, `components/*`, `lib/clientStorage.ts`, `lib/searchDepartments.ts`, `lib/hooks/*`. 문제를 발견하면 고치지 말고 PR 설명에 적어 주세요.

## 공통 계약 (변경 금지)

```ts
interface Department { id: number; name: string; score: number }   // types/department.ts
getDepartments(): Promise<Department[]>
getRanking(): Promise<Department[]>
supportDepartment(id: number): Promise<Department>
attackDepartment(id: number): Promise<Department>
```
- `service_role` 키에는 절대 `NEXT_PUBLIC_` 접두사를 붙이지 않는다.
- `lib/server/` 의 파일은 브라우저 코드(`"use client"`, `components/`)에서 import 하지 않는다.
- 학과 목록을 바꾸면 `lib/departmentNames.ts` 와 SQL 시드를 함께 바꾼다.

## 해야 할 일 (순서대로)

### 1. Supabase 연결
`docs/SUPABASE_SETUP.md` 1~4절. 프로젝트 생성 → `init.sql` 실행 → `.env.local` 에 키 3개 → 서버 재시작 → 체크리스트 확인.
확인 포인트: 클릭 후 **Supabase Table Editor 에서 점수가 실제로 바뀌는가.**

### 2. 동시성 검증
브라우저 콘솔에서 `/api/support` 를 20개 동시에 보내 DB 점수가 정확히 20 오르는지 확인 (가이드 4절의 스크립트). 누락(19 이하)이나 덮어쓰기가 있으면 `attack_department`/`support_department` 함수가 단일 UPDATE 문인지, 애플리케이션 코드에서 "읽고-계산-쓰기" 를 하고 있지 않은지 점검.

### 3. 레이트리밋 확인
같은 스크립트를 40개로 보내면 일부가 429 로 거절되는지 확인. 정상 플레이(사람 클릭)에서는 절대 429 가 나면 안 됩니다. 필요하면 `lib/server/rateLimit.ts` 의 `MAX_REQUESTS_PER_WINDOW` 조정.

### 4. Vercel 배포
가이드 5절. 환경변수 3개를 Vercel 에 입력하고 배포. 배포 주소에서 1~2 를 다시 확인.

### 5. (선택, 시간 남으면) 개선
- 레이트리밋을 Upstash Redis 로 교체 (서버리스 다중 인스턴스 대응)
- `lib/hooks/useRankingPolling.ts` 를 Supabase Realtime 으로 교체 — 단, 이건 A/C 담당 파일과 겹치므로 먼저 팀에 이야기
- 누적 클릭 수를 정확히 세는 `total_clicks` 카운터 컬럼 추가 (현재 랜딩의 "누적 점수" 는 점수 합계 근사)

## 완성 기준 (Definition of Done)

- [ ] Supabase 프로젝트에 `departments` 테이블과 학과 66개가 있다
- [ ] `.env.local` 에 진짜 키 3개가 있고, 터미널에 `[dev fallback]` 경고가 없다
- [ ] 클릭 시 DB 점수가 실제로 바뀐다 (Table Editor 로 확인)
- [ ] 동시 20건 요청 → 정확히 +20
- [ ] 초당 30회 초과 시 429, 정상 클릭은 429 없음
- [ ] 두 브라우저 탭에서 서로의 클릭이 3초 내 반영
- [ ] Vercel 주소에서 위 항목 재확인
- [ ] `docs/SUPABASE_SETUP.md` 에서 실제와 다른 부분을 발견했으면 고쳐서 함께 커밋
- [ ] `.env.local` 이 커밋에 포함되지 않았다 (`git status` 확인)

`feature/supabase` 브랜치에서 작업하고 PR 을 올려 주세요. PR 설명에 Vercel 주소를 적어 주세요.
