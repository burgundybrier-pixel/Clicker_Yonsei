import { supabaseAnon } from "./supabase";
import type { Department } from "@/types/department";

/**
 * 전체 학과 목록(이름순). 랜딩 화면의 참여 학과 수, /select 검색·목록에 사용.
 * 서버(Server Component)와 클라이언트(브라우저) 양쪽에서 호출 가능.
 */
export async function getDepartments(): Promise<Department[]> {
  const { data, error } = await supabaseAnon
    .from("departments")
    .select("id, name, score")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`getDepartments failed: ${error.message}`);
  }

  return data ?? [];
}
