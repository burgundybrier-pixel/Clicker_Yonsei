import type { Department } from "@/types/department";
import { DEPARTMENT_NAMES } from "./departmentNames";

/**
 * 개발 모드 메모리 DB (Supabase 미연결 시에만 사용).
 *
 * .env.local 에 실제 Supabase 키가 없으면(lib/supabase.ts 의 isSupabaseConfigured === false)
 * 서버가 이 메모리 저장소로 점수를 관리한다. 덕분에 Supabase 없이도 로컬에서
 * 클릭/랭킹이 전부 동작해서 UI 작업을 바로 확인할 수 있다.
 *
 * 한계:
 *  - 서버 프로세스 메모리라서 `npm run dev` 를 재시작하면 점수가 0으로 돌아간다.
 *  - 실서비스(Vercel)에서는 절대 쓰지 않는다. 배포 전에 반드시 Supabase 를 연결한다.
 *
 * 비밀 정보가 없으므로 lib/ 에 두지만, 상태(점수)는 서버 프로세스 안에서만 의미가 있다.
 * 브라우저는 /api/ranking 을 통해 이 저장소를 읽는다.
 */

type DevStore = { departments: Department[] };

// Next.js 개발 서버는 파일을 저장할 때마다 모듈을 다시 로드한다(HMR).
// 그때 점수가 초기화되지 않도록 globalThis 에 붙여 둔다.
const globalForStore = globalThis as unknown as { __clickerDevStore?: DevStore };

function getStore(): DevStore {
  if (!globalForStore.__clickerDevStore) {
    globalForStore.__clickerDevStore = {
      departments: DEPARTMENT_NAMES.map((name, index) => ({ id: index + 1, name, score: 0 })),
    };
  }
  return globalForStore.__clickerDevStore;
}

export function devGetDepartments(): Department[] {
  return getStore().departments.map((d) => ({ ...d }));
}

export function devSupportDepartment(id: number): Department | null {
  const dept = getStore().departments.find((d) => d.id === id);
  if (!dept) return null;
  dept.score += 1;
  return { ...dept };
}

export function devAttackDepartment(id: number): Department | null {
  const dept = getStore().departments.find((d) => d.id === id);
  if (!dept) return null;
  dept.score = Math.max(dept.score - 1, 0);
  return { ...dept };
}
