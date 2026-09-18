"use client";

import type { Department } from "@/types/department";
import SupportButton from "./SupportButton";
import { formatScore } from "@/lib/format";

interface MyDepartmentCardProps {
  department: Department;
  rank: number;
  totalDepartments: number;
  onSupport: () => void;
  disabled?: boolean;
}

export default function MyDepartmentCard({
  department,
  rank,
  totalDepartments,
  onSupport,
  disabled,
}: MyDepartmentCardProps) {
  return (
    <div className="rounded-2xl border border-brand-400/40 bg-gradient-to-br from-brand-500/20 to-brand-900/20 p-5 shadow-lg shadow-brand-900/20">
      <p className="text-xs font-medium uppercase tracking-wide text-brand-300">내 학과</p>
      <div className="mt-1 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="truncate text-2xl font-bold text-white">{department.name}</h2>
          <p className="mt-1 text-sm text-slate-300">
            현재 {rank}위 / {totalDepartments}개 학과 중
          </p>
        </div>
        <p className="shrink-0 text-4xl font-extrabold tabular-nums text-white">{formatScore(department.score)}</p>
      </div>
      <div className="mt-4">
        <SupportButton
          onClick={onSupport}
          disabled={disabled}
          label={`${department.name} 응원하기 +1`}
          className="w-full py-3 text-base"
        />
      </div>
    </div>
  );
}
