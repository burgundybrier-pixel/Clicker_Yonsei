# [작업 지시서] A — 배틀 화면 체감 개선

아래 내용을 Cursor Chat / Claude 에 붙여넣고 시작하세요. 작업 브랜치: `feature/battle` (main 에서 분기)

---

당신은 "학과 대항전 클릭 배틀" 웹서비스(Next.js 14 App Router + TypeScript + Tailwind) 의 프론트엔드 개발을 돕습니다. 저는 팀의 A(배틀 인터랙션) 담당입니다.

## 프로젝트 현재 상태

- `/battle` 화면은 **이미 동작합니다**: 내 학과 카드, +1/-1 버튼, 낙관적 업데이트, 실패 시 롤백, 2.5초 폴링, 내 활동 기록. 구조는 `docs/ARCHITECTURE.md` 3절·4절(`app/battle/page.tsx`, `lib/hooks/useRankingPolling.ts`) 참고.
- Supabase 없이도 개발 모드로 로컬에서 전부 동작하므로(`npm run dev`), 바로 화면 작업을 할 수 있습니다.
- **제 임무는 기능 추가가 아니라 "누르는 재미" 를 키우는 것**입니다. MVP 원칙(SPEC.md 17번)에 따라 아이템·콤보·미션 같은 새 기능은 넣지 않습니다.

## 제가 담당하는 파일

- `app/battle/page.tsx`
- `components/MyDepartmentCard.tsx`, `components/ScoreButton.tsx`, `components/SupportButton.tsx`, `components/AttackButton.tsx`
- `lib/clientStorage.ts`, `lib/hooks/useRankingPolling.ts`
- `tailwind.config.ts` 의 keyframes/animation (새 애니메이션 추가 시)

**건드리지 않는 파일**: `app/page.tsx`, `app/select/*`, `components/Header.tsx`, `components/DepartmentSearch.tsx`, `components/DepartmentCard.tsx`, `components/RankingList.tsx`(C 담당 — 필요한 prop 이 있으면 C 에게 요청), `lib/server/*`, `lib/supabase.ts`, `lib/departments.ts`, `lib/scores.ts`, `supabase/*`.

## 공통 계약 (변경 금지)

```ts
interface Department { id: number; name: string; score: number }
getRanking(), supportDepartment(id), attackDepartment(id)   // lib/scores.ts — 호출만 함
```
- localStorage 키 `selectedDepartmentId`, `clickStats` 유지
- 클릭 → 화면 즉시 반영 → 서버 요청 → 실패 시 롤백 순서 유지. 서버 응답을 기다린 뒤 화면을 바꾸는 코드로 되돌리지 않는다.
- 클라이언트는 변화량을 서버에 보내지 않는다.

## 해야 할 일 (우선순위 순)

1. **점수 변화 연출** — 클릭 시 `+1`/`-1` 이 점수 옆에서 떠오르며 사라지는 효과. 연타 시 여러 개가 겹쳐도 자연스럽게. (CSS 애니메이션으로, 라이브러리 추가 없이)
2. **순위 변동 표시** — 내 학과 순위가 바뀌면 카드에 `▲2` / `▼1` 같은 표시가 잠깐 나타남. 직전 순위는 `useRef` 로 기억.
3. **모바일 터치 UX** — 버튼 최소 터치 영역 44px, 더블탭 확대 방지(`touch-action: manipulation`), 연타 시 텍스트 선택 안 되게(`select-none` 은 이미 있음).
4. **랭킹 변동 애니메이션** — 폴링으로 순위가 바뀔 때 행이 툭 바뀌지 않고 부드럽게. `RankingList` 는 C 담당이므로, 필요하면 "행에 `key` 안정성 / transition 클래스 추가" 를 C 에게 요청하거나 PR 에서 협의.
5. (선택) 내 학과가 1위가 되는 순간 짧은 축하 효과.

## 지켜야 할 것

- 애니메이션 때문에 클릭 반응이 느려지면 안 됩니다. 60fps 유지, 레이아웃을 흔드는 속성(width/height/top) 대신 transform/opacity 사용.
- 새 npm 패키지 추가는 하지 않습니다 (필요하면 먼저 팀에 이야기).
- `npm run check` 통과.

## 완성 기준

- [ ] 클릭할 때마다 ±1 이 시각적으로 떠오른다, 연타에도 버벅이지 않는다
- [ ] 순위가 바뀌면 ▲/▼ 표시가 잠깐 나타난다
- [ ] 모바일(크롬 개발자도구 기기 모드)에서 버튼이 누르기 쉽고 더블탭 확대가 안 된다
- [ ] 낙관적 업데이트·롤백·폴링이 그대로 동작한다 (서버를 끄고 클릭해 보면 롤백이 되어야 함)
- [ ] `npm run check` 통과

`feature/battle` 브랜치에서 작업하고 PR 을 올려 주세요. 변경 전/후 화면 GIF 나 스크린샷을 PR 에 붙여 주세요.
