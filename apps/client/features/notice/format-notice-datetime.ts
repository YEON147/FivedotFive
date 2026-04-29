/** ISO 문자열을 사용자에게 보여 줄 한국어 날짜·시간 문자열로 변환 */
export function formatNoticeDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
