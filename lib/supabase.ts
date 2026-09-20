import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase 연결 (브라우저에서도 안전한 부분).
 *
 * 여기에는 "anon 키"만 있다. anon 키는 공개돼도 괜찮은 키로, DB에 걸어둔 RLS 정책
 * (supabase/migrations 참고) 때문에 departments 테이블을 "읽기"만 할 수 있다.
 * 점수를 바꾸는 관리자 키(service_role)는 lib/server/supabaseAdmin.ts 에만 있다.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// .env.local 이 비어 있거나 .env.local.example 의 플레이스홀더 그대로면 "미연결"로 판단한다.
export const PLACEHOLDER_PATTERN = /placeholder|YOUR-PROJECT|your-anon-key|your-service-role-key|example/i;

/**
 * true  → 실제 Supabase 프로젝트에 연결됨. 모든 읽기/쓰기가 DB로 간다.
 * false → 개발 모드. 네트워크 요청 없이 lib/devStore.ts 의 메모리 DB로 동작한다.
 *         (존재하지 않는 서버에 접속을 시도하며 수 초씩 기다리는 일을 막기 위해)
 */
export const isSupabaseConfigured: boolean =
  supabaseUrl.startsWith("https://") &&
  supabaseAnonKey.length > 20 &&
  !PLACEHOLDER_PATTERN.test(supabaseUrl) &&
  !PLACEHOLDER_PATTERN.test(supabaseAnonKey);

// Supabase 가 응답하지 않을 때 화면이 무한히 "불러오는 중"에 머물지 않도록 요청마다 제한 시간을 둔다.
export const REQUEST_TIMEOUT_MS = 5000;

export function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetch(input, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
}

/**
 * 읽기 전용 클라이언트. Server Component 와 Client Component(브라우저) 양쪽에서 사용 가능.
 * Supabase 미연결 상태면 null 이다 — 호출하는 쪽에서 isSupabaseConfigured 를 먼저 확인한다.
 */
export const supabaseAnon: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: { fetch: fetchWithTimeout },
    })
  : null;
