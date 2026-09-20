import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";
import { getClientIdentifier, isRateLimited } from "@/lib/server/rateLimit";
import { devAttackDepartment, devSupportDepartment } from "@/lib/devStore";
import type { Department } from "@/types/department";

type Action = "support" | "attack";

/**
 * /api/support 와 /api/attack 의 공통 처리. 두 라우트는 "어느 방향으로 1점 바꾸는가"만 다르다.
 * 변화량(+1/-1)은 여기(서버)에서 고정되며 클라이언트가 보낸 어떤 값도 반영되지 않는다(SPEC.md 4번).
 *
 * 순서: 요청 빈도 검사 → 요청 형식 검사 → 점수 변경(Supabase RPC 또는 개발용 메모리 DB) → 결과 반환
 */
export async function handleScoreChange(request: Request, action: Action) {
  const identifier = getClientIdentifier(request);
  if (isRateLimited(identifier)) {
    return NextResponse.json(
      { error: "요청이 너무 많아 잠시 제한됐어요." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const departmentId = (body as { departmentId?: unknown })?.departmentId;
  if (typeof departmentId !== "number" || !Number.isInteger(departmentId)) {
    return NextResponse.json({ error: "departmentId가 올바르지 않습니다." }, { status: 400 });
  }

  // 개발 모드: Supabase 없이 서버 메모리에서 점수를 바꾼다.
  if (!isSupabaseConfigured) {
    const updated =
      action === "support" ? devSupportDepartment(departmentId) : devAttackDepartment(departmentId);
    if (!updated) {
      return NextResponse.json({ error: "학과를 찾을 수 없습니다." }, { status: 404 });
    }
    return NextResponse.json({ department: updated });
  }

  // 실제 모드: DB 함수가 단일 UPDATE 문으로 원자적으로 증감한다.
  const rpcName = action === "support" ? "support_department" : "attack_department";
  const { data, error } = await getSupabaseAdmin().rpc(rpcName, { dept_id: departmentId }).single();

  if (error || !data) {
    return NextResponse.json({ error: "학과를 찾을 수 없습니다." }, { status: 404 });
  }

  const row = data as Department;
  return NextResponse.json({ department: { id: row.id, name: row.name, score: row.score } });
}
