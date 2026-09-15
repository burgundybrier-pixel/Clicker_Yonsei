import Link from "next/link";
import Header from "@/components/Header";
import { getRanking } from "@/lib/scores";

// 방문할 때마다 최신 참여 학과 수/1위/누적 점수를 보여주기 위해 캐시하지 않는다.
export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const ranking = await getRanking();
  const departmentCount = ranking.length;
  const topDepartment = ranking[0] ?? null;
  // "전체 누적 클릭 수"는 별도 카운터 컬럼이 없어(SPEC.md 8번 스키마 고정),
  // 전체 학과 점수 합계로 근사한다. 공격(-1)도 점수에 반영되므로 실제 클릭 총량의
  // 근사치이지 정확한 누적 클릭 수는 아니다.
  const totalScore = ranking.reduce((sum, d) => sum + d.score, 0);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-4 py-16 text-center">
        <div>
          <p className="text-sm font-medium text-brand-300">Yonsei Click Battle</p>
          <h1 className="mt-2 text-3xl font-extrabold text-white">학과 대항전 클릭 배틀</h1>
          <p className="mt-3 text-sm text-slate-400">
            내 학과를 클릭하면 +1점, 다른 학과를 클릭하면 -1점.
            <br />
            지금 바로 우리 학과를 1위로 만들어 보세요.
          </p>
        </div>

        <dl className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <dt className="text-xs text-slate-400">참여 학과</dt>
            <dd className="mt-1 text-xl font-bold text-white">{departmentCount}</dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <dt className="text-xs text-slate-400">현재 1위</dt>
            <dd className="mt-1 truncate text-xl font-bold text-white">
              {topDepartment ? topDepartment.name : "-"}
            </dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <dt className="text-xs text-slate-400">누적 점수</dt>
            <dd className="mt-1 text-xl font-bold text-white">{totalScore}</dd>
          </div>
        </dl>

        <Link
          href="/select"
          className="w-full rounded-xl bg-brand-500 px-6 py-4 text-base font-bold text-white shadow-lg shadow-brand-900/30 transition hover:bg-brand-400"
        >
          참여하기
        </Link>
      </main>
    </div>
  );
}
