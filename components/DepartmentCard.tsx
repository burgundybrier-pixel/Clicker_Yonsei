"use client";

import type { Department } from "@/types/department";

interface DepartmentCardProps {
  department: Department;
  selected: boolean;
  onSelect: (department: Department) => void;
}

export default function DepartmentCard({ department, selected, onSelect }: DepartmentCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(department)}
      aria-pressed={selected}
      className={`w-full rounded-xl border px-4 py-3 text-left transition ${
        selected
          ? "border-brand-400 bg-brand-500/20 text-white"
          : "border-white/10 bg-white/5 text-slate-200 hover:border-white/20 hover:bg-white/10"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{department.name}</span>
        {selected && <span className="text-xs font-semibold text-brand-300">선택됨</span>}
      </div>
    </button>
  );
}
