"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import type { Department } from "@/types/department";
import { formatScore } from "@/lib/format";

interface RankingListProps {
  /** score DESC로 이미 정렬된 배열을 받는다. */
  departments: Department[];
  /** 강조 표시용. 없으면 강조 없이 렌더링된다. */
  myDepartmentId?: number;
  /** 각 행 우측에 렌더링할 요소(예: SupportButton/AttackButton). 없으면 점수만 표시. */
  renderAction?: (department: Department, rank: number) => ReactNode;
}

export default function RankingList({ departments, myDepartmentId, renderAction }: RankingListProps) {
  const rows = useRef(new Map<number, HTMLLIElement>());
  const positions = useRef(new Map<number, number>());
  const animations = useRef(new Map<number, Animation>());

  useLayoutEffect(() => {
    const nextPositions = new Map<number, number>();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    rows.current.forEach((row, id) => {
      const top = row.offsetTop;
      nextPositions.set(id, top);
      const previous = positions.current.get(id);
      if (previous != null && previous !== top) {
        animations.current.get(id)?.cancel();
        if (!reduceMotion) {
          animations.current.set(id, row.animate(
            [{ transform: `translateY(${previous - top}px)` }, { transform: "translateY(0)" }],
            { duration: 240, easing: "ease-out" }
          ));
        }
      }
    });
    positions.current = nextPositions;
  }, [departments]);

  useLayoutEffect(() => {
    const activeAnimations = animations.current;
    return () => {
      activeAnimations.forEach((animation) => animation.cancel());
      activeAnimations.clear();
    };
  }, []);

  return (
    <ol className="relative space-y-2">
      {departments.map((department, index) => {
        const rank = index + 1;
        const isMine = department.id === myDepartmentId;

        return (
          <li
            key={department.id}
            ref={(element) => {
              if (element) rows.current.set(department.id, element);
              else rows.current.delete(department.id);
            }}
            className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
              isMine ? "border-brand-400/50 bg-brand-500/10" : "border-white/10 bg-white/5"
            }`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="w-6 shrink-0 text-sm font-semibold text-slate-400">{rank}</span>
              <span className={`truncate text-sm font-medium ${isMine ? "text-white" : "text-slate-200"}`}>
                {department.name}
                {isMine && <span className="ml-2 text-xs font-semibold text-brand-300">MY</span>}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="min-w-[3rem] text-right text-sm font-bold tabular-nums text-white">
                {formatScore(department.score)}
              </span>
              {renderAction?.(department, rank)}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
