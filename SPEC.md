# 학과 대항전 클릭 배틀 — 프로젝트 명세

> 팀 전원이 이 문서를 기준으로 작업합니다. "어떻게 만들어졌는지" 는 `docs/ARCHITECTURE.md`,
> Supabase 연결은 `docs/SUPABASE_SETUP.md`, 각자의 작업 지시서는 `prompts/` 에 있습니다.
>
> **상태 (2026-09-19)**: MVP 기능 구현 완료. Supabase 실제 연결과 Vercel 배포가 남았습니다.

## 1. 서비스 한 줄 정의

사용자가 자신의 학과를 선택한 뒤, 내 학과를 클릭하면 +1점, 다른 학과를 클릭하면 해당 학과가 -1점 되는 실시간 학과 대항전 웹서비스. 회원가입 없음.

## 2. 핵심 유저 플로우

```
서비스 진입(/) → 내 학과 선택(/select) → 배틀 화면(/battle) → 내 학과 +1 또는 다른 학과 -1
→ 전체 랭킹 변화 확인 → 반복 클릭 → 퇴장
```

## 3. 화면

| 경로 | 내용 | 파일 |
|---|---|---|
| `/` | 서비스 이름, 참여 학과 수, 현재 1위, 누적 점수(점수 합계 근사), 참여하기 → `/select` | `app/page.tsx` (서버 컴포넌트) |
| `/select` | 검색(약칭·초성·띄어쓰기 무시), 목록, 선택, 선택 완료 → localStorage 저장 → `/battle` | `app/select/page.tsx` |
| `/battle` | 상단 내 학과 카드(이름/점수/순위/+1), 내 활동(응원/공격/총합), 전체 랭킹(내 학과 +1, 나머지 -1) | `app/battle/page.tsx` |

## 4. 점수 규칙

- 내 학과 클릭 → 내 학과 +1
- 다른 학과 클릭 → 해당 학과 -1, 단 0 미만으로 내려가지 않음 (`max(score - 1, 0)`)
- **한 번의 클릭 = 정확히 1점.** 클라이언트는 변화량을 보내지 않으며, 보내더라도 서버가 무시한다. 변화량은 엔드포인트(`/api/support` = +1, `/api/attack` = -1)가 결정한다.

## 5. 클릭 UX — 낙관적 업데이트

클릭 → 화면 점수 즉시 ±1 → 서버 요청 → 성공 시 서버 값으로 확정 / 실패 시 롤백 후 서버 값으로 재동기화.
서버 응답을 기다린 뒤 화면을 바꾸는 방식은 금지(체감 지연). 같은 버튼 60ms 내 연타는 무시.

## 6. 랭킹

- `score DESC`, 동점이면 이름순
- 내 학과는 카드/색으로 강조
- 다른 사용자의 클릭 반영을 위해 2.5초 간격 폴링 (`lib/hooks/useRankingPolling.ts`). 탭이 숨겨져 있으면 쉰다.

## 7. 개인 기록 (로그인 없음, localStorage)

- `selectedDepartmentId` — 선택한 학과 id
- `clickStats` — `{ supportClicks, attackClicks, totalClicks }` JSON
- 서버 요청 실패 시 카운트도 되돌린다.
- 저장된 학과가 목록에 없으면(학과 목록 변경 등) 선택을 지우고 `/select` 로 보낸다.

## 8. 데이터베이스 (Supabase / PostgreSQL)

테이블 `departments(id, name unique, score >= 0, created_at, updated_at)`
함수 `support_department(dept_id)`, `attack_department(dept_id)` — 단일 UPDATE 로 원자적 증감
RLS — 누구나 SELECT, 직접 쓰기는 불가. 두 함수는 `service_role` 만 실행 가능.
SQL: `supabase/migrations/20260915000000_init.sql` (신규), `20260919000000_departments_v2.sql` (예전 DB 갱신용)

**참여 학과**: 66개. 단일 원본은 `lib/departmentNames.ts`. SQL 시드와 항상 동일하게 유지한다.

## 9. 핵심 함수 (이름·시그니처 고정)

```ts
// lib/departments.ts
getDepartments(): Promise<Department[]>            // 이름순
// lib/scores.ts
getRanking(): Promise<Department[]>                // score DESC
supportDepartment(id: number): Promise<Department> // POST /api/support
attackDepartment(id: number): Promise<Department>  // POST /api/attack
```

## 10. 어뷰징 방지

- 서버 레이트리밋: IP 기준 **초당 30회** (`lib/server/rateLimit.ts`). 사람의 광클(10~15회/초)은 걸리지 않고 매크로만 걸린다.
- 초과 요청은 429 로 거절되고 점수에 반영되지 않는다. 화면은 토스트 없이 조용히 재동기화한다.
- 메모리 기반이라 서버가 여러 대인 환경에선 근사치. 향후: Upstash Redis, 세션 ID, 비정상 패턴 탐지.

## 11. 운영 모드

| 모드 | 조건 | 저장소 | 용도 |
|---|---|---|---|
| 개발 모드 | `.env.local` 없음 또는 플레이스홀더 | 서버 메모리 (`lib/devStore.ts`) | UI 작업, 로컬 테스트. 재시작 시 초기화 |
| 실제 모드 | 진짜 Supabase 키 | Supabase | 배포. 반드시 이 모드로 |

판단 로직은 `lib/supabase.ts` 의 `isSupabaseConfigured` 한 곳.

## 12. 기술 스택

Next.js 14 (App Router) / TypeScript / Tailwind CSS / Supabase / Vercel / GitHub

## 13. 프로젝트 구조

`docs/ARCHITECTURE.md` 2절 참고. 요지:
- `app/` 화면·API, `components/` 부품, `lib/` 로직, **`lib/server/` 서버 전용(관리자 키·레이트리밋)**, `types/` 타입, `supabase/` SQL

## 14. 공통 계약 (팀 전원이 지키는 것)

```ts
// types/department.ts
interface Department { id: number; name: string; score: number }
```
- localStorage 키: `selectedDepartmentId`, `clickStats`
- 9번 함수 4개의 이름·시그니처
- `lib/server/` 의 파일을 `"use client"` 파일이나 `components/` 에서 import 하지 않는다
- `service_role` 키에 `NEXT_PUBLIC_` 접두사를 붙이지 않는다
- 학과 목록을 바꿀 땐 `lib/departmentNames.ts` 와 SQL 을 함께 바꾼다

## 15. MVP 완성 조건

| # | 조건 | 상태 |
|---|---|---|
| 1 | 웹사이트 접속 가능 | ✅ 로컬 / ⬜ 배포 |
| 2 | 학과 검색 가능 | ✅ (약칭·초성 포함) |
| 3 | 내 학과 선택 가능 | ✅ |
| 4 | 내 학과 클릭 시 +1 | ✅ |
| 5 | 상대 학과 클릭 시 -1 | ✅ |
| 6 | 점수가 DB 에 실제 저장 | ✅ 코드 완료 / ⬜ Supabase 연결 |
| 7 | 전체 학과 랭킹 표시 | ✅ |
| 8 | 동시 접속 시 점수 정상 반영 | ✅ 코드 완료 / ⬜ 실제 DB 로 검증 |
| 9 | 새로고침해도 학과 선택 유지 | ✅ |
| 10 | Vercel 실제 링크 | ⬜ |

## 16. 역할 분담 (2차)

| 역할 | 브랜치 | 담당 | 지시서 |
|---|---|---|---|
| A — 배틀 인터랙션 | `feature/battle` | `/battle` 체감 개선: 점수 변화 연출, 순위 변동 표시, 모바일 터치 UX | `prompts/A_battle_interaction.md` |
| B — 데이터·배포 | `feature/supabase` | **Supabase 연결, 동시성 검증, Vercel 배포** (최우선) | `prompts/B_backend_data.md` |
| C — 진입·선택 UI | `feature/ui` | 랜딩 강화(랭킹 미리보기), 검색 UX·약칭 보완, 접근성 | `prompts/C_entry_ranking_ui.md` |

가능하면 서로 담당 파일을 건드리지 않는다. 겹치면 PR 에서 이야기한다.

## 17. 개발 원칙

MVP 에서는 기능을 늘리지 않는다. 검증할 것은 세 가지: 사람들이 자기 학과를 선택하는가 / 반복해서 누르는가 / 다른 학과와 경쟁하는 재미를 느끼는가. 로그인, 친구, 아이템, 콤보, 미션, 채팅은 1차 제외.
