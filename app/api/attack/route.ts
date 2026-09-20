import { handleScoreChange } from "@/lib/server/scoreRoute";

// POST /api/attack — 상대 학과 공격(-1, 0 미만 방지). 공통 처리는 lib/scoreRoute.ts 참고.
export async function POST(request: Request) {
  return handleScoreChange(request, "attack");
}
