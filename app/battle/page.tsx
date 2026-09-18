"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import MyDepartmentCard from "@/components/MyDepartmentCard";
import RankingList from "@/components/RankingList";
import SupportButton from "@/components/SupportButton";
import AttackButton from "@/components/AttackButton";
import { supportDepartment, attackDepartment, ScoreRequestError } from "@/lib/scores";
import { useRankingPolling } from "@/lib/hooks/useRankingPolling";
import {
  clearSelectedDepartmentId,
  getClickStats,
  getSelectedDepartmentId,
  recordAttackClick,
  recordSupportClick,
  revertAttackClick,
  revertSupportClick,
  type ClickStats,
} from "@/lib/clientStorage";
import type { Department } from "@/types/department";

/** 다른 사람의 클릭을 얼마나 자주 반영할지. 짧을수록 실시간에 가깝지만 서버 요청이 늘어난다. */
const POLL_INTERVAL_MS = 2500;
/** 같은 버튼 연타 시 이 시간 안의 중복 클릭은 무시한다. 서버 요청이 겹치는 것을 막는 최소 장치. */
const CLICK_DEBOUNCE_MS = 60;
/** 하단 토스트 메시지 표시 시간 */
const NOTICE_MS = 2000;

type ClickAction = "support" | "attack";
const EMPTY_STATS: ClickStats = { supportClicks: 0, attackClicks: 0, totalClicks: 0 };

/**
 * 배틀 화면 (/battle) — 이 서비스의 핵심 화면.
 *
 * 흐름: 내 학과 확인 → 랭킹 폴링 시작 → 클릭하면 낙관적 업데이트 → 서버 반영 → 실패 시 롤백
 * 데이터 로딩/폴링은 useRankingPolling 훅이, 클릭 처리는 이 파일의 sendClick 이 담당한다.
 */
export default function BattlePage() {
  const router = useRouter();
  const { departments, setDepartments, resync, loading, error: loadError } = useRankingPolling(POLL_INTERVAL_MS);

  const [myDepartmentId, setMyDepartmentId] = useState<number | null>(null);
  const [stats, setStats] = useState<ClickStats>(EMPTY_STATS);
  const [notice, setNotice] = useState<string | null>(null);

  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastClickAt = useRef<Map<string, number>>(new Map());

  // 1) 첫 진입: localStorage 에서 내 학과와 클릭 기록을 읽는다. 학과가 없으면 선택 화면으로 보낸다.
  useEffect(() => {
    const id = getSelectedDepartmentId();
    if (id == null) {
      router.replace("/select");
      return;
    }
    setMyDepartmentId(id);
    setStats(getClickStats());
  }, [router]);

  // 2) 저장된 학과가 목록에 없으면(학과 목록이 바뀐 경우 등) 선택을 지우고 다시 고르게 한다.
  //    그렇지 않으면 "불러오는 중..." 에서 영원히 멈춘다.
  useEffect(() => {
    if (loading || myDepartmentId == null || departments.length === 0) return;
    if (!departments.some((d) => d.id === myDepartmentId)) {
      clearSelectedDepartmentId();
      router.replace("/select");
    }
  }, [loading, myDepartmentId, departments, router]);

  // 3) 화면용 파생값. departments 가 바뀔 때만 다시 계산된다(useMemo).
  const ranking = useMemo(
    () => [...departments].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, "ko")),
    [departments]
  );
  const myDepartment = useMemo(
    () => ranking.find((d) => d.id === myDepartmentId) ?? null,
    [ranking, myDepartmentId]
  );
  const myRank = useMemo(
    () => (myDepartmentId == null ? 0 : ranking.findIndex((d) => d.id === myDepartmentId) + 1),
    [ranking, myDepartmentId]
  );

  const showNotice = useCallback((message: string) => {
    setNotice(message);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), NOTICE_MS);
  }, []);

  /** 화면 점수만 ±1. 서버 응답을 기다리지 않는 "낙관적 업데이트"의 화면 쪽 절반. */
  const applyLocalDelta = useCallback(
    (departmentId: number, delta: number) => {
      setDepartments((prev) =>
        prev.map((d) => (d.id === departmentId ? { ...d, score: Math.max(d.score + delta, 0) } : d))
      );
    },
    [setDepartments]
  );

  /**
   * 클릭 한 번의 전체 처리.
   *  ① 디바운스 → ② 화면 즉시 반영 + 내 기록 저장 → ③ 서버 요청 → ④ 성공: 서버 값으로 확정 / 실패: 롤백 + 재동기화
   * 실제 변화량(+1/-1)은 서버가 정한다. 여기서 보내는 것은 "어느 학과를" "응원/공격" 하는지뿐이다.
   */
  const sendClick = useCallback(
    async (action: ClickAction, department: Department) => {
      const key = `${action}:${department.id}`;
      const now = Date.now();
      if (now - (lastClickAt.current.get(key) ?? 0) < CLICK_DEBOUNCE_MS) return;
      lastClickAt.current.set(key, now);

      applyLocalDelta(department.id, action === "support" ? 1 : -1);
      setStats(action === "support" ? recordSupportClick() : recordAttackClick());

      try {
        const updated =
          action === "support" ? await supportDepartment(department.id) : await attackDepartment(department.id);
        setDepartments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      } catch (err) {
        setStats(action === "support" ? revertSupportClick() : revertAttackClick());
        await resync();
        // 요청 빈도 제한(429)은 정상 플레이 중 거의 안 걸리고, 걸려도 재동기화로 충분하다.
        // 토스트까지 띄우면 게임 흐름을 방해하므로 조용히 넘어간다.
        if (err instanceof ScoreRequestError && err.status === 429) return;
        showNotice(err instanceof Error ? err.message : "요청이 실패했습니다. 잠시 후 다시 시도해 주세요.");
      }
    },
    [applyLocalDelta, resync, setDepartments, showNotice]
  );

  // ── 렌더링 ──────────────────────────────────────────────────────────────

  if (loading || myDepartmentId == null || !myDepartment) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
          {loadError && !loading ? (
            <>
              <p className="text-sm text-red-400">{loadError}</p>
              <button
                type="button"
                onClick={() => void resync()}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-200 hover:bg-white/10"
              >
                다시 시도
              </button>
            </>
          ) : (
            <p className="text-sm text-slate-500">불러오는 중...</p>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">
        <MyDepartmentCard
          department={myDepartment}
          rank={myRank}
          totalDepartments={ranking.length}
          onSupport={() => sendClick("support", myDepartment)}
        />

        <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            ["응원", stats.supportClicks],
            ["공격", stats.attackClicks],
            ["총 클릭", stats.totalClicks],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-white/10 bg-white/5 py-2">
              <dt className="text-[11px] text-slate-400">{label}</dt>
              <dd className="text-sm font-bold text-white">{value}</dd>
            </div>
          ))}
        </dl>

        <h2 className="mt-6 text-sm font-semibold text-slate-300">전체 랭킹</h2>
        <div className="mt-2">
          <RankingList
            departments={ranking}
            myDepartmentId={myDepartment.id}
            renderAction={(department) =>
              department.id === myDepartment.id ? (
                <SupportButton onClick={() => sendClick("support", department)} label="+1" />
              ) : (
                <AttackButton onClick={() => sendClick("attack", department)} label="-1" />
              )
            }
          />
        </div>
      </main>

      {notice && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 flex justify-center px-4" role="status">
          <div className="rounded-full bg-slate-800/95 px-4 py-2 text-xs font-medium text-white shadow-lg">
            {notice}
          </div>
        </div>
      )}
    </div>
  );
}
