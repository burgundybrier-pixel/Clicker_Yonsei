import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";
import { devGetDepartments } from "@/lib/devStore";

export const dynamic = "force-dynamic";

/**
 * GET /api/ranking — 전체 학과 목록(점수 내림차순).
 * 주 용도는 Supabase 미연결 개발 모드에서 브라우저가 서버 메모리 DB를 읽는 통로.
 * Supabase가 연결돼 있으면 브라우저는 보통 anon 키로 직접 읽지만, 여기서도 같은 결과를 준다.
 */
export async function GET() {
  if (!isSupabaseConfigured) {
    const departments = devGetDepartments().sort(
      (a, b) => b.score - a.score || a.name.localeCompare(b.name, "ko")
    );
    return NextResponse.json({ departments });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("departments")
    .select("id, name, score")
    .order("score", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ departments: data ?? [] });
}
