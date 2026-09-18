"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import DepartmentSearch from "@/components/DepartmentSearch";
import DepartmentCard from "@/components/DepartmentCard";
import { getDepartments } from "@/lib/departments";
import { getSelectedDepartmentId, setSelectedDepartmentId } from "@/lib/clientStorage";
import { searchDepartments } from "@/lib/searchDepartments";
import type { Department } from "@/types/department";

export default function SelectPage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 이미 선택한 학과가 있으면(재방문) 미리 표시해 준다.
    setSelectedId(getSelectedDepartmentId());

    getDepartments()
      .then(setDepartments)
      .catch(() => setError("학과 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."))
      .finally(() => setLoading(false));
  }, []);

  // 약칭(컴공, 전전), 초성(ㅋㅍㅌ), 띄어쓰기 무시까지 처리하는 검색. lib/searchDepartments.ts 참고.
  const filtered = useMemo(() => searchDepartments(departments, query), [departments, query]);

  function handleConfirm() {
    if (selectedId == null) return;
    setSelectedDepartmentId(selectedId);
    router.push("/battle");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-8">
        <h1 className="text-xl font-bold text-white">내 학과를 선택하세요</h1>
        <p className="mt-1 text-sm text-slate-400">선택한 학과는 언제든 다시 바꿀 수 있어요.</p>

        <div className="mt-4">
          <DepartmentSearch value={query} onChange={setQuery} />
          {!loading && !error && (
            <p className="mt-2 text-xs text-slate-500">
              {query.trim() ? `${filtered.length}개 학과 일치` : `총 ${departments.length}개 학과`} · 약칭(컴공, 전전)이나 초성(ㅋㅍㅌ)으로도 검색돼요
            </p>
          )}
        </div>

        <div className="mt-4 space-y-2 pb-24">
          {loading && <p className="text-sm text-slate-500">불러오는 중...</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}
          {!loading && !error && filtered.length === 0 && (
            <p className="text-sm text-slate-500">검색 결과가 없습니다.</p>
          )}
          {filtered.map((department) => (
            <DepartmentCard
              key={department.id}
              department={department}
              selected={department.id === selectedId}
              onSelect={(d) => setSelectedId(d.id)}
            />
          ))}
        </div>
      </main>

      <div className="sticky bottom-0 border-t border-white/10 bg-slate-950/90 px-4 py-4 backdrop-blur">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={selectedId == null}
          className="mx-auto block w-full max-w-md rounded-xl bg-brand-500 px-6 py-3 text-base font-bold text-white transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          선택 완료
        </button>
      </div>
    </div>
  );
}
