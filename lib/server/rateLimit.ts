const WINDOW_MS = 1000;
// 사람이 마우스로 최대한 빨리 눌러도 초당 10~15회 정도라서 30회면 정상 플레이는 절대 걸리지 않고,
// 매크로(초당 수백 회)만 걸러낸다. 걸리면 서버가 429를 주고 화면은 조용히 재동기화한다.
const MAX_REQUESTS_PER_WINDOW = 30;

const hits = new Map<string, number[]>();

/**
 * 요청 빈도 제한(SPEC.md 10번). 로그인이 없으므로 클라이언트 식별은 IP 기준 근사치를 사용한다.
 *
 * 메모리 기반 구현이라 서버리스 환경에서 인스턴스가 여러 개로 분산되면
 * 인스턴스별로 카운터가 나뉜다. MVP 단계의 기본 방어이며, 이후 IP 제한 고도화나
 * Upstash Redis 같은 공유 스토어로 교체하면 더 정확해진다.
 */
export function isRateLimited(identifier: string): boolean {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  const timestamps = hits.get(identifier) ?? [];
  const recent = timestamps.filter((t) => t > windowStart);

  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    hits.set(identifier, recent);
    return true;
  }

  recent.push(now);
  hits.set(identifier, recent);
  return false;
}

export function getClientIdentifier(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]!.trim();
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}
