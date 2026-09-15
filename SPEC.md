# 학과 대항전 클릭 배틀 — 프로젝트 명세 (공통 참고 문서)

> A/B/C 세 사람 모두 이 문서를 기준으로 작업합니다. 각자의 상세 개발 프롬프트는 `prompts/` 폴더에 따로 있습니다.
> - `prompts/A_battle_interaction.md`
> - `prompts/B_backend_data.md`
> - `prompts/C_entry_ranking_ui.md`

## 1. 서비스 한 줄 정의

사용자가 자신의 학과를 선택한 뒤, 내 학과를 클릭하면 +1점, 다른 학과를 클릭하면 해당 학과가 -1점 되는 실시간 학과 대항전 웹서비스. 회원가입은 MVP에서 제외.

## 2. 핵심 유저 플로우

```
서비스 진입 → 내 학과 선택 → 배틀 화면 진입 → 내 학과 +1 또는 다른 학과 -1
→ 전체 랭킹 변화 확인 → 반복 클릭 → 퇴장
```

## 3. 화면

- `/` (랜딩): 서비스 이름, 참여 학과 수, 현재 1위 학과, 전체 누적 클릭 수, 참여하기 버튼 → `/select` 이동
- `/select` (학과 선택): 검색, 목록, 선택, 선택 완료 → `selectedDepartmentId`를 localStorage에 저장 → `/battle` 이동
- `/battle` (배틀 화면, 핵심 화면): 상단에 내 학과 카드(이름/점수/현재 순위/+1 버튼), 아래에 전체 랭킹(각 학과 점수 + 내 학과면 +1, 아니면 -1 버튼)

## 4. 점수 규칙

- 내 학과 클릭 → 내 학과 +1
- 다른 학과 클릭 → 해당 학과 -1
- 점수는 0 미만으로 내려가지 않음 (`max(score - 1, 0)`)
- 한 번의 클릭으로 변경되는 점수는 반드시 1점. 클라이언트가 임의의 변화량을 요청해도 서버가 무시하고 항상 서버가 변화량(+1/-1)을 직접 결정한다.

## 5. 클릭 UX (낙관적 업데이트)

클릭 → 화면 점수 즉시 ±1 변경 → 서버에 요청 전송 → DB 반영. 서버 응답을 기다린 후 화면을 바꾸지 않는다. 요청이 실패하면 서버의 실제 점수로 다시 동기화(rollback & resync)한다.

## 6. 랭킹

- `score DESC` 정렬
- 내 학과는 색/카드로 강조
- 다른 사용자의 클릭도 반영되도록 2~3초 간격으로 폴링 갱신

## 7. 개인 기록 (로그인 없음, localStorage)

필드: `selectedDepartmentId`, `supportClicks`, `attackClicks`, `totalClicks`
표시: 우리 학과 응원 N회 / 상대 학과 공격 N회 / 총 클릭 N회

## 8. 데이터베이스 (Supabase)

테이블 `departments`: `id, name, score, created_at, updated_at`

## 9. 핵심 서버 기능 (네 가지, 이름 고정)

```ts
getDepartments()
getRanking()
supportDepartment(departmentId)
attackDepartment(departmentId)
```

- `supportDepartment`: `score = score + 1`
- `attackDepartment`: `score = max(score - 1, 0)`
- 점수 변경은 반드시 DB에서 원자적으로 처리 (동시 클릭 두 건이 모두 반영되어야 함, race condition 없이)

## 10. 기본 어뷰징 방지

- 한 브라우저 기준 초당 최대 5회 요청
- 서버에서 요청 빈도 검사, 너무 빠른 요청은 점수에 반영하지 않음
- (향후: IP 제한, 세션 ID, CAPTCHA, 비정상 클릭 탐지)

## 11. 기술 스택

Next.js / TypeScript / Tailwind CSS / Supabase / Vercel / GitHub

## 12. 프로젝트 구조

```
app/
├── page.tsx
├── select/
│   └── page.tsx
└── battle/
    └── page.tsx

components/
├── Header.tsx
├── DepartmentSearch.tsx
├── DepartmentCard.tsx
├── MyDepartmentCard.tsx
├── RankingList.tsx
├── SupportButton.tsx
└── AttackButton.tsx

lib/
├── supabase.ts
├── departments.ts
└── scores.ts

types/
└── department.ts
```

## 13. 역할 분담

| 역할 | 브랜치 | 담당 |
|---|---|---|
| A — 배틀 인터랙션 | `feature/battle` | `/battle`, SupportButton, AttackButton, MyDepartmentCard, 개인 클릭 기록, 클릭 애니메이션, 즉시 점수 변경 |
| B — 데이터 및 서버 | `feature/backend` | Supabase `departments` 테이블, 점수 증가/감소 함수, 랭킹 조회, 동시 클릭 처리, 요청 제한 |
| C — 진입 및 랭킹 UI | `feature/ui` | `/`, `/select`, Header, DepartmentSearch, DepartmentCard, RankingList |

가능하면 서로 담당 파일을 건드리지 않는다.

## 14. 세 사람이 반드시 통일할 규칙 (공통 계약)

```ts
// types/department.ts
interface Department {
  id: number
  name: string
  score: number
}
```

- localStorage 키: `selectedDepartmentId`
- 공통 함수 이름(시그니처 고정): `getDepartments()`, `getRanking()`, `supportDepartment(id)`, `attackDepartment(id)`

## 15. MVP 완성 조건

1. 웹사이트 접속 가능
2. 학과 검색 가능
3. 내 학과 선택 가능
4. 내 학과 클릭 시 +1
5. 상대 학과 클릭 시 -1
6. 점수가 DB에 실제 저장
7. 전체 학과 랭킹 표시
8. 여러 사용자가 동시에 접속해도 점수 정상 반영
9. 새로고침해도 학과 선택 유지
10. Vercel에서 실제 링크로 접속 가능

## 16. 개발 원칙

MVP에서는 기능을 늘리지 않는다. 검증할 것은 세 가지뿐이다: 사람들이 자기 학과를 선택하는가 / 반복해서 버튼을 누르는가 / 다른 학과와 경쟁하는 재미를 느끼는가. 로그인, 친구 기능, 아이템, 콤보, 미션, 채팅 등은 1차 버전에서 제외한다.
