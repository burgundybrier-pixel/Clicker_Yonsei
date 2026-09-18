# Supabase 연결 가이드 (담당자용)

> 이 문서 하나로 끝나도록 썼습니다. 순서대로 따라가면 30분 안에 끝납니다.
> 막히면 맨 아래 "문제 해결"을 먼저 보세요.

## 0. 지금 상태 이해하기 (2분)

앱은 이미 **Supabase 없이도 돌아갑니다.** `.env.local` 에 진짜 키가 없으면 "개발 모드"로 서버 메모리(`lib/devStore.ts`)에 점수를 저장합니다.
당신이 할 일은 **그 메모리 DB 자리를 진짜 DB 로 바꾸는 것**이고, 코드는 이미 두 모드를 자동으로 구분합니다 (`lib/supabase.ts` 의 `isSupabaseConfigured`).

**코드를 고칠 일은 거의 없습니다.** 해야 할 일은 ① Supabase 프로젝트 만들기 ② SQL 한 번 실행 ③ 키 3개 `.env.local` 에 넣기 ④ 확인 ⑤ (선택) Vercel 배포.

```
개발 모드 (지금)                          실제 모드 (당신이 만들 상태)
브라우저 → /api/ranking → 서버 메모리      브라우저 → Supabase 직접 읽기 (anon 키, 읽기만)
브라우저 → /api/support → 서버 메모리      브라우저 → /api/support → 서버(service_role 키) → Supabase RPC
```

## 1. Supabase 프로젝트 만들기 (5분)

1. https://supabase.com 접속 → GitHub 로 가입/로그인
2. **New project**
   - Organization: 본인 것 (없으면 만들기)
   - Name: `clicker-yonsei` (아무거나 OK)
   - Database Password: **어딘가에 적어두세요.** 나중에 CLI 쓸 때 필요합니다.
   - Region: **Northeast Asia (Seoul)** — 가까울수록 빠름
   - Pricing: Free
3. 생성 완료까지 1~2분 기다립니다.

## 2. 테이블·함수·보안 규칙 만들기 (3분)

1. 왼쪽 메뉴 **SQL Editor** → **New query**
2. 이 저장소의 `supabase/migrations/20260915000000_init.sql` 파일을 열어 **전체 내용을 복사 → 붙여넣기 → Run**
3. 아래 메시지가 나오면 성공: `Success. No rows returned`
4. 확인: 왼쪽 메뉴 **Table Editor** → `departments` 테이블에 학과 66개가 보여야 합니다.

이 SQL 이 만드는 것 (자세한 설명은 `docs/ARCHITECTURE.md` 의 DB 절):

| 만드는 것 | 역할 |
|---|---|
| `departments` 테이블 | id, name, score, created_at, updated_at |
| `support_department(dept_id)` 함수 | score + 1 을 **DB 안에서 원자적으로** |
| `attack_department(dept_id)` 함수 | max(score - 1, 0) 을 **DB 안에서 원자적으로** |
| RLS 정책 | 누구나 읽기 가능, 직접 쓰기는 아무도 불가 |
| 함수 권한 | 두 함수는 `service_role` 만 실행 가능 |
| 시드 데이터 | 학과 66개 (`lib/departmentNames.ts` 와 동일) |

> ⚠️ 이미 예전 버전 SQL 로 만든 DB 라면(학과 42개) `init.sql` 대신 `20260919000000_departments_v2.sql` 을 실행하세요. 기존 점수는 보존됩니다.

## 3. 키 복사해서 .env.local 에 넣기 (3분)

1. 왼쪽 아래 **Project Settings**(톱니) → **API**
2. 세 값을 복사합니다:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API keys → `anon` `public`** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Project API keys → `service_role`** (Reveal 클릭) → `SUPABASE_SERVICE_ROLE_KEY`
3. 프로젝트 루트의 `.env.local` 파일을 열어 (없으면 `.env.local.example` 복사) 세 줄을 교체합니다:

```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...(긴 문자열)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...(긴 문자열)
```

**규칙 세 개**
- `service_role` 키는 **절대** 커밋·카톡·스크린샷하지 마세요. 이 키 하나면 DB 를 통째로 지울 수 있습니다.
- `service_role` 키 앞에 **`NEXT_PUBLIC_` 을 붙이면 안 됩니다.** 붙이면 Next.js 가 브라우저에 실어 보냅니다.
- `.env.local` 은 `.gitignore` 에 있어서 커밋되지 않습니다. 확인: `git status` 에 안 뜨면 정상.

## 4. 확인 (5분)

```bash
# 터미널에서 서버를 끄고(Ctrl+C) 다시 켭니다. 환경변수는 재시작해야 반영됩니다.
npm run dev
```

체크리스트:
- [ ] 터미널에 `[dev fallback]` 같은 경고가 **없다**
- [ ] http://localhost:3000 랜딩에 "참여 학과 66" 이 보인다
- [ ] `/select` 에서 학과 선택 → `/battle` 진입
- [ ] +1 누르면 점수가 오르고, **Supabase Table Editor 에서 새로고침하면 DB 값도 올라 있다** ← 이게 핵심 확인
- [ ] -1 누르면 내려가고 0 밑으로 안 내려간다
- [ ] 브라우저 탭 두 개를 열어 한쪽에서 누르면 다른 쪽도 3초 안에 바뀐다
- [ ] 개발자도구(F12) → Network 탭에서 `/api/support` 요청의 응답이 `{"department": {...}}` 다

동시성 확인(선택): 브라우저 콘솔(F12 → Console)에 아래를 붙이고 실행 → DB 점수가 정확히 20 올라야 합니다.
```js
await Promise.all(Array.from({length: 20}, () =>
  fetch("/api/support", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({departmentId: 1})})
));
```
(초당 30회 제한이 있어서 20개는 통과합니다. 40개로 하면 일부가 429 로 거절되는 것도 볼 수 있습니다.)

## 5. Vercel 배포 (10분, 선택)

1. https://vercel.com → GitHub 로 로그인 → **Add New → Project** → `Clicker_Yonsei` 저장소 Import
2. Framework Preset 이 **Next.js** 로 잡히는지 확인
3. **Environment Variables** 에 위의 세 개를 그대로 입력 (이름·값 동일)
4. **Deploy** → 1~2분 후 `https://clicker-yonsei-xxx.vercel.app` 주소가 나옵니다
5. 그 주소로 4번 체크리스트를 다시 확인

이후 `main` 브랜치에 push 하면 자동으로 재배포됩니다.

## 6. 문제 해결

| 증상 | 원인 | 해결 |
|---|---|---|
| 터미널에 `[dev fallback]` / 랜딩에 학과 66개인데 클릭이 안 됨 | 키가 여전히 플레이스홀더 | `.env.local` 값 확인 후 서버 재시작 |
| `Missing SUPABASE_SERVICE_ROLE_KEY` | service_role 키 누락 또는 오타 | 대시보드에서 다시 복사 |
| 클릭하면 `학과를 찾을 수 없습니다` | SQL 을 안 돌렸거나 함수 권한 문제 | SQL Editor 에서 `select * from departments limit 1;` 로 테이블 확인, 없으면 2번 다시 |
| `permission denied for function support_department` | service_role 키가 아니라 anon 키를 `SUPABASE_SERVICE_ROLE_KEY` 에 넣음 | 키 재확인 |
| 랭킹이 안 보이고 콘솔에 CORS/401 | `NEXT_PUBLIC_SUPABASE_URL` 오타 | URL 이 `https://xxxx.supabase.co` 형식인지 확인 |
| Vercel 에서만 안 됨 | 환경변수를 Vercel 에 안 넣음 | Vercel → Settings → Environment Variables 확인 후 Redeploy |
| 점수가 서버 재시작 때 0 이 됨 | 아직 개발 모드 | 정상. Supabase 연결하면 사라짐 |

## 7. 알아두면 좋은 것 (선택)

- **Supabase CLI** 를 쓰면 SQL 을 대시보드에 붙이는 대신 `supabase db push` 로 적용할 수 있습니다. MVP 단계에서는 대시보드가 더 빠릅니다.
- **레이트리밋**(`lib/server/rateLimit.ts`)은 서버 메모리 기반이어서 Vercel 처럼 서버가 여러 대 뜨는 환경에선 정확하지 않습니다. 트래픽이 커지면 Upstash Redis 로 교체하는 것이 정석입니다.
- **Realtime**: 지금은 2.5초 폴링입니다. Supabase Realtime(WebSocket) 으로 바꾸면 즉시 반영되는데, 바꿀 자리는 `lib/hooks/useRankingPolling.ts` 하나입니다.
