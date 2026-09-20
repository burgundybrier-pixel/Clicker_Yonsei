import { supabaseAnon, isSupabaseConfigured } from "./supabase";
import { devGetDepartments } from "./devStore";
import type { Department } from "@/types/department";

/**
 * 전체 학과 목록(이름순). 랜딩 화면의 참여 학과 수, /select 검색·목록에 사용.
 * 서버(Server Component)와 클라이언트(브라우저) 양쪽에서 호출 가능.
 */
export async function getDepartments(): Promise<Department[]> {
  const list = await fetchAllDepartments();
  return list.sort((a, b) => a.name.localeCompare(b.name, "ko"));
}

/**
 * 공통 조회. Supabase 연결 여부와 실행 위치(서버/브라우저)에 따라 경로를 고른다.
 *  - Supabase 연결됨: anon 키로 직접 조회 (RLS로 읽기만 허용)
 *  - 미연결 + 서버:   메모리 DB 직접 읽기
 *  - 미연결 + 브라우저: /api/ranking 을 통해 서버 메모리 DB 읽기
 */
export async function fetchAllDepartments(): Promise<Department[]> {
  if (!isSupabaseConfigured || !supabaseAnon) {
    if (typeof window === "undefined") {
      return devGetDepartments();
    }
    const res = await fetch("/api/ranking", { cache: "no-store" });
    if (!res.ok) throw new Error(`랭킹 조회 실패 (${res.status})`);
    const body = (await res.json()) as { departments: Department[] };
    return body.departments;
  }

  const { data, error } = await supabaseAnon.from("departments").select("id, name, score");
  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}
