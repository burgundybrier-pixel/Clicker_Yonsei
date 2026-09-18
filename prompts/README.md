# prompts/ 사용법

각 파일은 **역할 하나의 작업 지시서**입니다. Cursor Chat / Claude 에 파일 내용을 그대로 붙여넣고 시작하세요.
AI 가 프로젝트를 이해하도록 `docs/ARCHITECTURE.md` 도 함께 첨부하면(또는 "@docs/ARCHITECTURE.md 읽고 시작해" 라고 하면) 훨씬 정확하게 도와줍니다.

| 파일 | 역할 | 우선순위 |
|---|---|---|
| `B_backend_data.md` | Supabase 연결 · 동시성 검증 · Vercel 배포 | **1 (이게 끝나야 배포됨)** |
| `A_battle_interaction.md` | 배틀 화면 체감 개선 | 2 |
| `C_entry_ranking_ui.md` | 랜딩·선택 화면·검색 개선 | 2 |

공통 규칙
- 작업 전 `git pull origin main`, 자기 브랜치에서 작업, 커밋 전 `npm run check`
- `.env.local` 과 `service_role` 키는 절대 커밋하지 않음
- `lib/server/` 파일을 `"use client"` 파일이나 `components/` 에서 import 하지 않음
- 담당 밖 파일을 고쳐야 하면 PR 설명에 이유를 적음
