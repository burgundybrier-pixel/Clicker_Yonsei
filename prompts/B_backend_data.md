# [Cursor 프롬프트] B — 데이터 및 서버(Backend) 담당

아래 내용을 그대로 Cursor Chat / Composer에 붙여넣어서 시작하세요.
작업 브랜치: `feature/backend` (main에서 분기, 없으면 새로 만드세요)

---

당신은 "학과 대항전 클릭 배틀"이라는 실시간 웹서비스의 백엔드/데이터 담당 개발자입니다. 저는 3인 팀 중 "데이터 및 서버(B)" 담당이고, 당신은 저를 도와 아래 명세대로 코드를 작성합니다.

## 서비스 개요

사용자가 자신의 학과를 선택하고, 배틀 화면에서 "내 학과"를 클릭하면 +1점, "다른 학과"를 클릭하면 그 학과가 -1점 되는 서비스입니다. 회원가입 없음. 기술 스택: Next.js(App Router) + TypeScript + Tailwind CSS + Supabase, 배포는 Vercel.

## 내가 담당하는 부분 (당신이 만들 것)

- Supabase 프로젝트의 `departments` 테이블 스키마 및 마이그레이션 SQL
- `lib/supabase.ts` — Supabase 클라이언트 초기화
- `lib/departments.ts` — `getDepartments()`
- `lib/scores.ts` — `getRanking()`, `supportDepartment(id)`, `attackDepartment(id)` (점수 증가/감소, 원자적 처리)
- 랭킹 조회 로직
- 동시 클릭에도 안전한 원자적 점수 갱신 (race condition 방지)
- 요청 빈도 제한(rate limiting) — 한 브라우저/클라이언트 기준 초당 최대 5회

**다른 사람이 담당하는 파일은 절대 수정하지 마세요**: `app/battle/*`, `app/page.tsx`, `app/select/*`, `components/*` 전체(UI 컴포넌트). A와 C가 당신이 만든 `lib/departments.ts`, `lib/scores.ts`의 함수를 **import해서 호출**할 것이므로, 함수 시그니처를 반드시 아래와 똑같이 유지하세요.

## 공통 계약 (반드시 그대로 사용, 이름/시그니처 변경 금지)

```ts
// types/department.ts
interface Department {
  id: number
  name: string
  score: number
}

// lib/departments.ts
export async function getDepartments(): Promise<Department[]>

// lib/scores.ts
export async function getRanking(): Promise<Department[]>            // score DESC 정렬
export async function supportDepartment(id: number): Promise<Department>  // score = score + 1, 갱신된 학과 반환
export async function attackDepartment(id: number): Promise<Department>   // score = max(score - 1, 0), 갱신된 학과 반환
```

- `getDepartments()`와 `getRanking()`은 결과가 다를 수 있음에 주의: `getDepartments()`는 전체 목록(학과 선택 화면용, 이름순 정렬 권장), `getRanking()`은 점수 내림차순 정렬(배틀/랭킹 화면용). 필요하면 내부적으로 같은 쿼리를 재사용해도 됩니다.

## 데이터베이스 스키마 (Supabase / PostgreSQL)

```sql
create table departments (
  id bigint generated always as identity primary key,
  name text not null unique,
  score bigint not null default 0 check (score >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

초기 데이터(연세대 주요 학과 예시로 십수 개 정도 seed) 를 INSERT 문으로 함께 작성해주세요.

## 점수 증가/감소 — 반드시 원자적(atomic) 처리

클라이언트는 절대 "몇 점 변화시킬지"를 결정하지 못합니다. **변화량(+1/-1)은 항상 서버(DB 함수)가 직접 정합니다.** 동시에 여러 사용자가 같은 학과를 클릭해도 두 요청이 모두 반영되어야 합니다 (예: 100점에서 A가 attack, B가 attack 동시에 오면 반드시 98점이 되어야 함. 96점처럼 하나가 누락되거나 99점처럼 덮어써지면 안 됨).

권장 구현: Supabase Postgres에 SQL 함수(RPC)를 만들어 단일 UPDATE 문으로 원자적 증감을 수행하세요.

```sql
create or replace function support_department(dept_id bigint)
returns departments as $$
  update departments
  set score = score + 1, updated_at = now()
  where id = dept_id
  returning *;
$$ language sql volatile;

create or replace function attack_department(dept_id bigint)
returns departments as $$
  update departments
  set score = greatest(score - 1, 0), updated_at = now()
  where id = dept_id
  returning *;
$$ language sql volatile;
```

그리고 `lib/scores.ts`에서 `supabase.rpc('support_department', { dept_id: id })` / `supabase.rpc('attack_department', { dept_id: id })`로 호출하세요. (단일 UPDATE 문은 Postgres에서 row-level lock으로 원자적이므로 애플리케이션 레벨 락이 필요 없습니다. `score = score + 1`처럼 "읽고 - 계산 - 쓰기"를 애플리케이션 코드에서 따로 하지 말고, 반드시 DB의 단일 SQL 문 안에서 계산하세요.)

## 요청 빈도 제한 (Rate Limiting)

- 규칙: 한 클라이언트(브라우저) 기준 초당 최대 5회 요청까지만 점수에 반영, 초과분은 무시(점수 반영 안 함, 에러 또는 조용한 무시 응답)
- API 라우트(`app/api/support/route.ts`, `app/api/attack/route.ts` 등, 또는 선택한 방식)에서 클라이언트를 식별할 수단이 필요합니다. 로그인이 없으므로 쿠키에 저장하는 임의의 클라이언트 ID(uuid)를 발급하거나, 없다면 IP 기반으로 최소한의 제한을 구현하세요. 메모리 기반의 간단한 토큰 버킷/슬라이딩 윈도우면 충분합니다(MVP 수준).
- Next.js Server Action 또는 Route Handler 중 편한 방식으로 구현하되, **클라이언트에서 서버로 가는 모든 점수 변경 요청은 이 레이어를 반드시 거치도록** 하세요. A, C가 호출하는 `lib/scores.ts`의 함수가 내부적으로 이 API를 호출하는 구조로 만들면 됩니다.

## 완성 기준 (Definition of Done)

- [ ] `departments` 테이블이 실제로 생성되고 seed 데이터가 있음
- [ ] `getDepartments()`, `getRanking()`이 실제 DB에서 데이터를 가져옴
- [ ] `supportDepartment(id)` 호출 시 실제로 DB 점수가 +1 됨
- [ ] `attackDepartment(id)` 호출 시 실제로 DB 점수가 -1 되고 0 밑으로 내려가지 않음
- [ ] 동시에 여러 요청이 와도 (부하 테스트 스크립트나 Promise.all로 동시 10개 요청 시뮬레이션) 점수가 정확히 반영됨 (누락/덮어쓰기 없음)
- [ ] 초당 5회를 초과하는 요청은 점수에 반영되지 않음
- [ ] 랭킹 조회가 항상 점수 내림차순으로 반환됨

## 환경 변수

`.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`(및 필요 시 서버 전용 `SUPABASE_SERVICE_ROLE_KEY`)를 사용한다고 가정하고 `lib/supabase.ts`를 작성하세요. 실제 키 값은 제가 별도로 채워 넣겠습니다. `.env.local.example` 파일도 만들어주세요.

작업은 `feature/backend` 브랜치에서 진행하고, 완성되면 커밋해주세요.
