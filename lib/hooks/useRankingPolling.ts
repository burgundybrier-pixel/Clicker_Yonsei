"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getRanking } from "@/lib/scores";
import type { Department } from "@/types/department";

/**
 * 랭킹을 처음 한 번 불러오고, 이후 intervalMs 마다 다시 불러오는 커스텀 훅.
 * 다른 사용자의 클릭이 내 화면에도 반영되게 하는 "폴링(polling)" 담당.
 *
 * 배경지식: 실시간 반영 방법은 두 가지다.
 *  - 폴링: 주기적으로 "지금 뭐야?" 하고 물어본다. 단순하고 어디서나 된다. (지금 방식)
 *  - 푸시(WebSocket / Supabase Realtime): 서버가 바뀔 때 알려준다. 더 즉각적이지만 설정이 복잡하다.
 * 나중에 Realtime 으로 바꾸고 싶으면 이 훅 내부만 바꾸면 되고 화면 코드는 그대로다.
 *
 * 반환값
 *  - departments: 현재 목록 (정렬은 화면에서 useMemo 로 한다)
 *  - setDepartments: 낙관적 업데이트로 화면 점수를 즉시 바꿀 때 사용
 *  - resync: 지금 즉시 서버 값으로 다시 맞추기 (요청 실패 시 롤백용)
 *  - loading / error: 첫 로드 상태
 */
export function useRankingPolling(intervalMs: number) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 이미 요청이 날아가 있는데 또 보내지 않도록 하는 잠금. useRef 는 값이 바뀌어도 화면을 다시 그리지 않는다.
  const inFlight = useRef(false);

  const resync = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const fresh = await getRanking();
      setDepartments(fresh);
      setError(null);
    } catch (err) {
      // 첫 로드가 아니면(이미 목록이 있으면) 폴링 실패는 조용히 무시하고 다음 주기에 다시 시도한다.
      setError((prev) => prev ?? (err instanceof Error ? err.message : "랭킹을 불러오지 못했습니다."));
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await resync();
      if (!cancelled) setLoading(false);
    })();

    // 탭이 숨겨져 있을 때는 폴링을 쉬어서 불필요한 요청을 줄인다.
    const tick = () => {
      if (document.visibilityState === "visible") void resync();
    };
    const interval = setInterval(tick, intervalMs);

    // 화면을 떠날 때 타이머를 반드시 정리한다. 안 하면 페이지가 바뀌어도 계속 요청을 보낸다(메모리 누수).
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [intervalMs, resync]);

  return { departments, setDepartments, resync, loading, error };
}
