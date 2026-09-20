import { handleScoreChange } from "@/lib/server/scoreRoute";

// POST /api/support — 내 학과 응원(+1). 공통 처리는 lib/scoreRoute.ts 참고.
export async function POST(request: Request) {
  return handleScoreChange(request, "support");
}
