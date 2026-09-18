# [작업 지시서] C — 랜딩 · 학과 선택 · 검색 개선

아래 내용을 Cursor Chat / Claude 에 붙여넣고 시작하세요. 작업 브랜치: `feature/ui` (main 에서 분기)

---

당신은 "학과 대항전 클릭 배틀" 웹서비스(Next.js 14 App Router + TypeScript + Tailwind) 의 프론트엔드 개발을 돕습니다. 저는 팀의 C(진입·선택 UI) 담당입니다.

## 프로젝트 현재 상태

- `/`(랜딩), `/select`(학과 선택), 검색은 **이미 동작합니다.** 검색은 약칭(컴공, 전전, 첨컴…)·초성(ㅋㅍㅌ)·띄어쓰기 무시까지 지원 (`lib/searchDepartments.ts`).
- 학과 66개. 목록의 단일 원본은 `lib/departmentNames.ts`.
- 구조는 `docs/ARCHITECTURE.md` 4절(`app/page.tsx`, `app/select/page.tsx`, `lib/searchDepartments.ts`, `components/RankingList.tsx`) 참고.
- Supabase 없이도 개발 모드로 로컬에서 전부 동작합니다(`npm run dev`).

## 제가 담당하는 파일

- `app/page.tsx`, `app/select/page.tsx`
- `components/Header.tsx`, `components/DepartmentSearch.tsx`, `components/DepartmentCard.tsx`, `components/RankingList.tsx`
- `lib/searchDepartments.ts`, `lib/departmentNames.ts` (학과 목록을 바꾸면 SQL 도 함께 — B 와 협의)
- `app/layout.tsx`, `app/globals.css`, `tailwind.config.ts` 의 색상

**건드리지 않는 파일**: `app/battle/*`, `components/MyDepartmentCard.tsx`, `components/ScoreButton.tsx`, `components/SupportButton.tsx`, `components/AttackButton.tsx`, `lib/clientStorage.ts`, `lib/hooks/*`, `lib/server/*`, `lib/supabase.ts`, `lib/departments.ts`, `lib/scores.ts`, `supabase/*`.

## 공통 계약 (변경 금지)

```ts
interface Department { id: number; name: string; score: number }
getDepartments(), getRanking()   // 호출만 함
```
- localStorage 키 `selectedDepartmentId` 유지 (선택 완료 시 저장)
- `RankingList` 의 props (`departments`, `myDepartmentId?`, `renderAction?`) 는 A 가 배틀 화면에서 쓰고 있으므로 **기존 prop 을 없애거나 이름을 바꾸지 않는다.** 추가는 가능.

## 해야 할 일 (우선순위 순)

1. **랜딩에 랭킹 미리보기** — 상위 5개 학과를 `RankingList` 로 보여준다(`renderAction` 없이). 랜딩은 서버 컴포넌트이므로 `RankingList` 가 `"use client"` 여도 서버 컴포넌트에서 렌더할 수 있음을 확인.
2. **약칭 보완** — `lib/searchDepartments.ts` 의 `ALIASES` 를 실제 학생들이 부르는 이름으로 검토·추가. 특히 첨단컴퓨팅학부/컴퓨터과학과/인공지능학과처럼 헷갈리는 학과는 서로 다른 약칭으로 확실히 구분되게.
3. **검색 UX** — 검색 결과 0개일 때 "혹시 이 학과?" 로 가장 비슷한 2~3개를 제안. 검색어의 일치 부분을 하이라이트(선택).
4. **최근 선택 학과 / 내 학과로 바로 가기** — `/select` 재방문 시 이전 선택을 맨 위에 고정 표시하고 "이대로 계속" 버튼.
5. **접근성** — 키보드로 목록 이동·선택 가능, 검색 입력에 `aria-*`, 카드에 focus 스타일.
6. (선택) 랜딩 통계 숫자 카운트업 애니메이션.

## 지켜야 할 것

- 검색 점수 로직을 바꾸면 이 케이스들이 여전히 첫 줄에 나와야 합니다: `컴공→컴퓨터과학과`, `첨컴→첨단컴퓨팅학부`, `ㅋㅍㅌ→컴퓨터과학과`, `전전→전기전자공학과`, `의대→의예과`, `아동가족→아동·가족학과`, `컴퓨터 과학→컴퓨터과학과`.
- 새 npm 패키지 추가는 먼저 팀에 이야기.
- `npm run check` 통과.

## 완성 기준

- [ ] 랜딩에 상위 5개 랭킹이 보인다
- [ ] 위 검색 케이스 7개가 모두 첫 줄에 나온다
- [ ] 결과 0개일 때 제안이 나온다
- [ ] `/select` 재방문 시 이전 선택이 위에 고정된다
- [ ] 키보드만으로 학과를 선택할 수 있다
- [ ] `/battle` 이 그대로 동작한다 (`RankingList` 변경이 A 화면을 깨지 않음)
- [ ] `npm run check` 통과

`feature/ui` 브랜치에서 작업하고 PR 을 올려 주세요.
