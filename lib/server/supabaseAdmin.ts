import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, fetchWithTimeout, PLACEHOLDER_PATTERN } from "@/lib/supabase";

/**
 * ⚠️ 서버 전용. app/api/** 의 route.ts 에서만 import 한다.
 *
 * service_role 키는 RLS 를 포함한 모든 보안 규칙을 우회하는 "관리자 키"다.
 * 이 키가 브라우저로 새면 누구나 점수를 마음대로 바꿀 수 있으므로:
 *  - 환경변수 이름에 NEXT_PUBLIC_ 접두사를 절대 붙이지 않는다 (붙이면 Next.js 가 브라우저에 실어 보낸다).
 *  - "use client" 파일이나 components/ 에서 이 파일을 import 하지 않는다.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error("getSupabaseAdmin() must never be called in the browser.");
  }
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured. Fill in .env.local with real project values.");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey || PLACEHOLDER_PATTERN.test(serviceRoleKey)) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Set it in your server environment (never NEXT_PUBLIC_)."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
    global: { fetch: fetchWithTimeout },
  });
}
