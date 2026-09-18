/** 12540 → "12,540". 화면에 점수를 표시할 때 항상 이 함수를 거친다. */
export function formatScore(score: number): string {
  return score.toLocaleString("ko-KR");
}
