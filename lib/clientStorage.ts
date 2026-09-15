// 로그인 없이 localStorage로 관리하는 개인 상태(SPEC.md 7번).
// 이 파일의 함수들은 브라우저에서만 호출한다 (Client Component 전용).

const SELECTED_DEPARTMENT_KEY = "selectedDepartmentId";
const STATS_KEY = "clickStats";

export interface ClickStats {
  supportClicks: number;
  attackClicks: number;
  totalClicks: number;
}

const EMPTY_STATS: ClickStats = { supportClicks: 0, attackClicks: 0, totalClicks: 0 };

export function getSelectedDepartmentId(): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SELECTED_DEPARTMENT_KEY);
  if (!raw) return null;
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

export function setSelectedDepartmentId(id: number): void {
  window.localStorage.setItem(SELECTED_DEPARTMENT_KEY, String(id));
}

export function getClickStats(): ClickStats {
  if (typeof window === "undefined") return EMPTY_STATS;
  const raw = window.localStorage.getItem(STATS_KEY);
  if (!raw) return EMPTY_STATS;
  try {
    const parsed = JSON.parse(raw);
    return {
      supportClicks: Number(parsed.supportClicks) || 0,
      attackClicks: Number(parsed.attackClicks) || 0,
      totalClicks: Number(parsed.totalClicks) || 0,
    };
  } catch {
    return EMPTY_STATS;
  }
}

function saveClickStats(stats: ClickStats): void {
  window.localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export function recordSupportClick(): ClickStats {
  const stats = getClickStats();
  const next: ClickStats = {
    ...stats,
    supportClicks: stats.supportClicks + 1,
    totalClicks: stats.totalClicks + 1,
  };
  saveClickStats(next);
  return next;
}

export function recordAttackClick(): ClickStats {
  const stats = getClickStats();
  const next: ClickStats = {
    ...stats,
    attackClicks: stats.attackClicks + 1,
    totalClicks: stats.totalClicks + 1,
  };
  saveClickStats(next);
  return next;
}

// 요청 실패 시 낙관적으로 늘렸던 카운트를 되돌린다(rollback).
export function revertSupportClick(): ClickStats {
  const stats = getClickStats();
  const next: ClickStats = {
    ...stats,
    supportClicks: Math.max(stats.supportClicks - 1, 0),
    totalClicks: Math.max(stats.totalClicks - 1, 0),
  };
  saveClickStats(next);
  return next;
}

export function revertAttackClick(): ClickStats {
  const stats = getClickStats();
  const next: ClickStats = {
    ...stats,
    attackClicks: Math.max(stats.attackClicks - 1, 0),
    totalClicks: Math.max(stats.totalClicks - 1, 0),
  };
  saveClickStats(next);
  return next;
}
