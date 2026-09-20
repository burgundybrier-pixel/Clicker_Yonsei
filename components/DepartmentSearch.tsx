"use client";

interface DepartmentSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export default function DepartmentSearch({ value, onChange }: DepartmentSearchProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="학과 검색 (예: 컴공, 첨컴, ㅋㅍㅌ)"
      autoFocus
      autoComplete="off"
      aria-label="학과 검색"
      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
    />
  );
}
