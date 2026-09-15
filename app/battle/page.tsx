"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import MyDepartmentCard from "@/components/MyDepartmentCard";
import RankingList from "@/components/RankingList";
import SupportButton from "@/components/SupportButton";
import AttackButton from "@/components/AttackButton";
import { getRanking, supportDepartment, attackDepartment } from "@/lib/scores";
import {
  getClickStats,
  getSelectedDepartmentId,
  recordAttackClick,
  recordSupportClick,
  revertAttackClick,
  revertSupportClick,
  type ClickStats,
} from "@/lib/clientStorage";
import type { Department } from "@/types/department";

const POLL_INTERVAL_MS = 2500;
const CLICK_DEBOUNCE_MS = 100;

type ClickAction = "support" | "attack";

export default function BattlePage() {
  const router = useRouter();
  const [myDepartmentId, setMyDepartmentId] = useState<number | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [stats, setStats] = useState<ClickStats>({ supportClicks: 0, attackClicks: 0, totalClicks: 0 });
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastClickRef = useRef<Map<string, number>>(new Map());

  const showNotice = useCallback((message: string) => {
    setNotice(message);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 2000);
  }, []);

  const resync = useCallback(async () => {
    try {
      const fresh = await getRanking();
      setDepartments(fresh);
    } catch {
      // 폴링 실패는 조용히 무시하고 다음 주기에 다시 시도한다.
    }
  }, []);

  useEffect(() => {
    const id = getSelectedDepartmentId();
    if (id == null) {
      router.replace("/select");
      return;
    }
    setMyDepartmentId(id);
    setStats(getClickStats());

    let cancelled = false;
    (async () => {
      try {
        const fresh = await getRanking();
        if (!cancelled) setDepartments(fresh);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    const interval = setInterval(resync, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [router, resync]);

  const ranking = useMemo(
    () => [...departments].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name)),
    [departments]
  );

  const myDepartment = useMemo(
    () => ranking.find((d) => d.id === myDepartmentId) ?? null,
    [ranking, myDepartmentId]
  );

  const myRank = useMemo(() => {
    if (myDepartmentId == null) return 0;
    return ranking.findIndex((d) => d.id === myDepartmentId) + 1;
  }, [ranking, myDepartmentId]);

  const applyLocalDelta = useCallback((departmentId: number, delta: number) => {
    setDepartments((prev) =>
      prev.map((d) => (d.id === departmentId ? { ...d, score: Math.max(d.score + delta, 0) } : d))
    );
  }, []);

  const sendClick = useCallback(
    async (action: ClickAction, department: Department) => {
      // 연타 시 겹치는 요청을 막는 간단한 디바운스(100ms).
      const key = `${action}:${department.id}`;
      const now = Date.now();
      const last = lastClickRef.current.get(key) ?? 0;
      if (now - last < CLICK_DEBOUNCE_MS) return;
      lastClickRef.current.set(key, now);

      // 1) 낙관적 업데이트: 화면 점수와 내 클릭 기록을 즉시 반영한다.
      const delta = action === "support" ? 1 : -1;
      applyLocalDelta(department.id, delta);
      setStats(action === "support" ? recordSupportClick() : recordAttackClick());

      try {
        // 2) 서버 반영: 실제 변화량은 서버가 결정한다.
        const updated =
          action === "support"
            ? await supportDepartment(department.id)
            : await attackDepartment(department.id);
        setDepartments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      } catch (err) {
        // 3) 실패 시 rollback & resync: 클릭 기록을 되돌리고 서버의 실제 점수로 재동기화한다.
        setStats(action === "support" ? revertSupportClick() : revertAttackClick());
        await resync();
        showNotice(err instanceof Error ? err.message : "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.");
      }
    },
    [applyLocalDelta, resync, showNotice]
  );

  if (loading || myDepartmentId == null || !myDepartment) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto flex w-full max-w-md flex-1 items-center justify-center px-4">
          <p className="text-sm text-slate-500">불러오는 중...</p>
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

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg border border-white/10 bg-white/5 py-2">
            <p className="text-[11px] text-slate-400">응원</p>
            <p className="text-sm font-bold text-white">{stats.supportClicks}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 py-2">
            <p className="text-[11px] text-slate-400">공격</p>
            <p className="text-sm font-bold text-white">{stats.attackClicks}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 py-2">
            <p className="text-[11px] text-slate-400">총 클릭</p>
            <p className="text-sm font-bold text-white">{stats.totalClicks}</p>
          </div>
        </div>

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
        <div className="pointer-events-none fixed inset-x-0 bottom-6 flex justify-center px-4">
          <div className="rounded-full bg-slate-800/95 px-4 py-2 text-xs font-medium text-white shadow-lg">
            {notice}
          </div>
        </div>
      )}
    </div>
  );
}
