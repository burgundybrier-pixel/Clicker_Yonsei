import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getClientIdentifier, isRateLimited } from "@/lib/rateLimit";

// 점수 변경은 반드시 이 서버 레이어를 거친다. 변화량은 여기서 +1로 고정되며
// 클라이언트가 다른 값을 보내도 전혀 반영되지 않는다(SPEC.md 4번).
export async function POST(request: Request) {
  const identifier = getClientIdentifier(request);
  if (isRateLimited(identifier)) {
    return NextResponse.json(
      { error: "너무 빠른 요청입니다. 잠시 후 다시 시도해 주세요." },
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

  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .rpc("support_department", { dept_id: departmentId })
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "학과를 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({ department: data });
}
