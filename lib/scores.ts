import { supabaseAnon } from "./supabase";
import type { Department } from "@/types/department";

/**
 * 점수 내림차순 랭킹. 배틀 화면에서 2~3초 주기로 폴링 호출한다.
 * 서버(Server Component)와 클라이언트(브라우저) 양쪽에서 호출 가능.
 */
export async function getRanking(): Promise<Department[]> {
  const { data, error } = await supabaseAnon
    .from("departments")
    .select("id, name, score")
    .order("score", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`getRanking failed: ${error.message}`);
  }

  return data ?? [];
}

/**
 * 내 학과 응원: score = score + 1.
 * 실제 원자적 갱신과 초당 5회 요청 제한은 서버(app/api/support)에서 처리한다.
 * 클라이언트는 변화량을 지정할 수 없다 — 서버가 항상 +1로 고정한다.
 */
export async function supportDepartment(id: number): Promise<Department> {
  return postScoreChange("/api/support", id);
}

/**
 * 상대 학과 공격: score = max(score - 1, 0).
 * 실제 원자적 갱신과 초당 5회 요청 제한은 서버(app/api/attack)에서 처리한다.
 */
export async function attackDepartment(id: number): Promise<Department> {
  return postScoreChange("/api/attack", id);
}

async function postScoreChange(endpoint: string, departmentId: number): Promise<Department> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ departmentId }),
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      typeof body?.error === "string" ? body.error : `요청이 실패했습니다 (${res.status}).`
    );
  }

  return body.department as Department;
}
