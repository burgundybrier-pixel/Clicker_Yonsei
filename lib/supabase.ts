import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
      "Copy .env.local.example to .env.local and fill in your Supabase project values."
  );
}

/**
 * 읽기 전용 클라이언트. Server Component와 Client Component(브라우저) 양쪽에서
 * 안전하게 사용할 수 있다. departments 테이블에 대해 RLS로 SELECT만 허용되어 있다.
 */
export const supabaseAnon: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

/**
 * 서비스 롤 클라이언트. RLS를 우회하므로 반드시 서버 전용 코드(app/api/*/route.ts)
 * 안에서만 호출해야 한다. Client Component에서 이 함수를 import하면 절대 안 된다.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error("getSupabaseAdmin() must never be called in the browser.");
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Set it in your server environment (never NEXT_PUBLIC_)."
    );
  }

  return createClient(supabaseUrl!, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
