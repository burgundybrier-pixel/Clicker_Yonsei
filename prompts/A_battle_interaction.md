# [Cursor 프롬프트] A — 배틀 인터랙션 담당

아래 내용을 그대로 Cursor Chat / Composer에 붙여넣어서 시작하세요.
작업 브랜치: `feature/battle` (main에서 분기, 없으면 새로 만드세요)

---

당신은 "학과 대항전 클릭 배틀"이라는 실시간 웹서비스의 프론트엔드 개발자입니다. 저는 3인 팀 중 "배틀 인터랙션(A)" 담당이고, 당신은 저를 도와 아래 명세대로 코드를 작성합니다.

## 서비스 개요

사용자가 자신의 학과를 선택하고, 배틀 화면에서 "내 학과"를 클릭하면 +1점, "다른 학과"를 클릭하면 그 학과가 -1점 되는 서비스입니다. 회원가입 없음. 기술 스택: Next.js(App Router) + TypeScript + Tailwind CSS + Supabase.

## 내가 담당하는 부분 (당신이 만들 것)

- `app/battle/page.tsx` — 배틀 화면 (핵심 화면)
- `components/MyDepartmentCard.tsx` — 상단 "내 학과" 카드 (이름 / 점수 / 현재 순위 / +1 버튼)
- `components/SupportButton.tsx` — 내 학과용 "+1" 버튼
- `components/AttackButton.tsx` — 다른 학과용 "-1" 버튼
- 개인 클릭 기록(로그인 없이 localStorage 사용)
- 클릭 시 즉시 반영되는 애니메이션/숫자 변화

**다른 사람이 담당하는 파일은 절대 수정하지 마세요**: `app/page.tsx`, `app/select/*`, `lib/supabase.ts`, `lib/departments.ts`, `lib/scores.ts`, `components/Header.tsx`, `components/DepartmentSearch.tsx`, `components/DepartmentCard.tsx`, `components/RankingList.tsx`. 이 파일들은 필요하면 **import만** 해서 사용하세요.

## 공통 계약 (반드시 그대로 사용, 이름/시그니처 변경 금지)

```ts
// types/department.ts
interface Department {
  id: number
  name: string
  score: number
}

// lib/scores.ts (backend 담당자가 구현, 나는 호출만 함)
getDepartments(): Promise<Department[]>
getRanking(): Promise<Department[]>          // score DESC 정렬된 배열
supportDepartment(id: number): Promise<Department>   // 성공 시 갱신된 학과 반환
attackDepartment(id: number): Promise<Department>
```

만약 아직 `lib/scores.ts` / `lib/departments.ts`가 존재하지 않는다면(backend 담당자가 아직 안 만들었다면), 위 시그니처와 동일한 **임시 스텁**을 만들어서 개발을 진행하세요. 스텁 파일 상단에 `// TODO(B): 실제 Supabase 연동으로 교체 필요` 주석을 남기고, 실제 구현이 들어오면 자동으로 교체될 수 있도록 함수 시그니처만 정확히 맞춰두세요. (스텁은 메모리 배열이나 setTimeout으로 흉내내는 정도면 충분합니다.)

localStorage 키:
- `selectedDepartmentId` (select 화면에서 이미 저장되어 있다고 가정, 없으면 `/select`로 리다이렉트)
- `supportClicks`, `attackClicks`, `totalClicks` (내가 직접 관리)

## 배틀 화면 UI (`/battle`)

```
내 학과
컴퓨터공학과
12,540점
현재 3위
[ +1 ]

──────────────
전체 랭킹
1위 경영학과       13,241   [ -1 ]
2위 경제학과       12,901   [ -1 ]
3위 컴퓨터공학과   12,540   [ +1 ]
4위 산업공학과     11,201   [ -1 ]
```

- 상단: `MyDepartmentCard` — localStorage의 `selectedDepartmentId`로 내 학과를 찾아 이름/점수/순위(랭킹 배열에서 index+1)/+1 버튼 표시
- 하단: 전체 랭킹 리스트 — 각 항목마다, 그 학과가 내 학과면 `SupportButton`(+1), 아니면 `AttackButton`(-1) 표시. 내 학과 항목은 색/배경으로 강조.
- 랭킹은 2~3초 주기로 `getRanking()`을 다시 호출해서 갱신 (다른 사용자의 클릭도 반영되도록). `setInterval` + cleanup(`clearInterval`) 사용.

## 클릭 동작 — 낙관적 업데이트(Optimistic UI) 필수

순서: **클릭 → 화면 점수를 즉시 ±1 변경 → 서버에 요청 전송(supportDepartment/attackDepartment) → 성공하면 그대로 유지, 실패하면 서버가 반환한(또는 재조회한) 실제 점수로 동기화(rollback)**.

- 서버 응답을 기다린 후에 화면을 바꾸는 방식은 금지입니다(체감 지연 발생).
- attack 클릭 시 화면상으로도 0점 아래로 내려가지 않게 클라이언트에서 `Math.max(score - 1, 0)` 처리.
- 짧은 시간에 같은 버튼을 연타해도 요청이 겹치지 않도록 간단한 디바운스/버튼 비활성화(예: 100ms) 정도는 넣어주세요. (서버 쪽 초당 5회 제한은 backend 담당자가 처리하지만, 프론트도 과도한 요청을 보내지 않는 게 좋습니다.)

## 개인 클릭 기록

- `+1`(내 학과) 클릭 시 `supportClicks += 1`, `-1`(다른 학과) 클릭 시 `attackClicks += 1`, 둘 다 `totalClicks += 1`
- localStorage에 저장하고, 배틀 화면 어딘가(하단 등)에 아래처럼 표시:

```
내 활동
우리 학과 응원 38회
상대 학과 공격 24회
총 클릭 62회
```

## 완성 기준 (Definition of Done)

- [ ] `selectedDepartmentId`가 없으면 `/select`로 자동 리다이렉트
- [ ] 내 학과 +1 클릭 가능, 화면 즉시 반영
- [ ] 다른 학과 -1 클릭 가능, 화면 즉시 반영, 0점 아래로 안 내려감
- [ ] 클릭 실패 시 실제 서버 값으로 재동기화
- [ ] 랭킹이 2~3초마다 자동 갱신
- [ ] 내 클릭 횟수(응원/공격/총합)가 화면에 표시되고 새로고침해도 유지됨
- [ ] 내 학과가 랭킹에서 시각적으로 강조됨

작업은 `feature/battle` 브랜치에서 진행하고, 완성되면 커밋해주세요.
