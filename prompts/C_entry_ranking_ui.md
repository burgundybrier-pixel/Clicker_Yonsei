# [Cursor 프롬프트] C — 진입 및 랭킹 UI 담당

아래 내용을 그대로 Cursor Chat / Composer에 붙여넣어서 시작하세요.
작업 브랜치: `feature/ui` (main에서 분기, 없으면 새로 만드세요)

---

당신은 "학과 대항전 클릭 배틀"이라는 실시간 웹서비스의 프론트엔드 개발자입니다. 저는 3인 팀 중 "진입 및 랭킹 UI(C)" 담당이고, 당신은 저를 도와 아래 명세대로 코드를 작성합니다.

## 서비스 개요

사용자가 자신의 학과를 선택하고, 배틀 화면에서 "내 학과"를 클릭하면 +1점, "다른 학과"를 클릭하면 그 학과가 -1점 되는 서비스입니다. 회원가입 없음. 기술 스택: Next.js(App Router) + TypeScript + Tailwind CSS + Supabase.

## 내가 담당하는 부분 (당신이 만들 것)

- `app/page.tsx` — 랜딩 화면(`/`)
- `app/select/page.tsx` — 학과 선택 화면(`/select`)
- `components/Header.tsx`
- `components/DepartmentSearch.tsx`
- `components/DepartmentCard.tsx`
- `components/RankingList.tsx` — 전체 랭킹 리스트 (배틀 화면에서도 재사용됨, 아래 참고)

**다른 사람이 담당하는 파일은 절대 수정하지 마세요**: `app/battle/*`, `components/MyDepartmentCard.tsx`, `components/SupportButton.tsx`, `components/AttackButton.tsx`, `lib/supabase.ts`, `lib/departments.ts`, `lib/scores.ts`. 필요하면 **import만** 해서 사용하세요.

## 공통 계약 (반드시 그대로 사용, 이름/시그니처 변경 금지)

```ts
// types/department.ts
interface Department {
  id: number
  name: string
  score: number
}

// lib/departments.ts, lib/scores.ts (backend 담당자가 구현, 나는 호출만 함)
getDepartments(): Promise<Department[]>
getRanking(): Promise<Department[]>   // score DESC 정렬된 배열
```

만약 아직 `lib/departments.ts` / `lib/scores.ts`가 존재하지 않는다면(backend 담당자가 아직 안 만들었다면), 위 시그니처와 동일한 **임시 스텁**을 만들어서 개발을 진행하세요. 스텁 상단에 `// TODO(B): 실제 Supabase 연동으로 교체 필요` 주석을 남기세요.

localStorage 키: `selectedDepartmentId` — 학과 선택 완료 시 이 키에 선택한 학과의 `id`를 저장합니다.

## 화면 1: 랜딩 (`/`)

표시 정보:
- 서비스 이름 (예: "학과 대항전")
- 현재 참여 학과 수 (= `getDepartments()` 결과 개수)
- 현재 1위 학과 (= `getRanking()`의 첫 번째 항목)
- 전체 누적 클릭 수 (MVP 단계에서는 간단히 "전체 학과 점수 합계" 등으로 대체 가능 — 정확한 누적 클릭 수 집계 기능이 없다면 근사값 사용, 주석으로 명시)
- "참여하기" 버튼 → 클릭 시 `/select`로 이동 (Next.js `Link` 또는 `router.push`)

## 화면 2: 학과 선택 (`/select`)

기능:
- `DepartmentSearch` — 학과 이름 검색 입력창 (한글 부분 문자열 매칭, 클라이언트 필터링으로 충분)
- 학과 목록 표시 (`DepartmentCard`를 나열, `getDepartments()` 결과 사용)
- 학과 선택 (카드 클릭 시 선택 상태로 표시)
- "선택 완료" 버튼 — 선택된 학과의 `id`를 `localStorage.setItem('selectedDepartmentId', ...)`로 저장한 뒤 `/battle`로 이동

## 컴포넌트: `RankingList.tsx` (공용, A가 배틀 화면에서도 사용)

전체 학과를 점수 내림차순으로 렌더링하는 리스트 컴포넌트로 만들어주세요. 배틀 화면(A 담당)에서도 이 컴포넌트를 가져다 쓸 수 있도록, 각 행에 대해 무엇을 렌더링할지(예: +1/-1 버튼) **바깥에서 주입**할 수 있게 설계하세요. 예를 들어:

```tsx
interface RankingListProps {
  departments: Department[]          // 이미 정렬된 배열을 받음
  myDepartmentId?: number            // 강조 표시용, 없으면 강조 없음
  renderAction?: (dept: Department, rank: number) => React.ReactNode  // 각 행 우측에 렌더링할 요소(옵션)
}
```

- 표시 형식: `순위 | 학과명 | 점수 | (renderAction이 있으면 그 내용)`
- `myDepartmentId`와 일치하는 항목은 배경색/테두리로 강조
- 랜딩/선택 화면에서는 `renderAction` 없이 단순 리스트로도 쓰일 수 있어야 함 (optional prop)

이렇게 만들어두면 A가 배틀 화면에서 `<RankingList departments={ranking} myDepartmentId={myId} renderAction={(d) => d.id === myId ? <SupportButton .../> : <AttackButton .../>} />` 형태로 재사용할 수 있습니다.

## `Header.tsx`

모든 페이지 상단에 들어갈 간단한 헤더(서비스 이름/로고, 필요하면 현재 페이지 표시). 각 페이지(`app/page.tsx`, `app/select/page.tsx`)에서 import해서 사용하세요. (`app/battle/page.tsx`는 A가 직접 넣을 수도 있으니, Header 자체를 만들어 export하는 것까지가 내 책임입니다.)

## 완성 기준 (Definition of Done)

- [ ] `/` 접속 시 참여 학과 수, 1위 학과, 누적 클릭 수(또는 근사값), 참여하기 버튼이 보임
- [ ] "참여하기" 클릭 시 `/select`로 이동
- [ ] `/select`에서 학과 이름으로 검색 가능
- [ ] 학과를 선택하고 "선택 완료" 시 `selectedDepartmentId`가 localStorage에 저장되고 `/battle`로 이동
- [ ] 새로고침해도 이전에 선택한 학과가 유지됨(직접 `/select`에 다시 들어가도 이전 선택이 표시되면 더 좋음)
- [ ] `RankingList`가 재사용 가능한 형태(props로 액션 주입)로 구현됨

작업은 `feature/ui` 브랜치에서 진행하고, 완성되면 커밋해주세요.
