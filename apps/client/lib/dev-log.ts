/**
 * 프로덕션 배포에서 브라우저 콘솔 스팸 방지.
 * `next dev` / `NODE_ENV=development` 일 때만 출력합니다.
 */
function isDev(): boolean {
  return process.env.NODE_ENV === "development";
}

export function devLog(...args: unknown[]): void {
  if (!isDev()) return;
  console.log(...args);
}

export function devWarn(...args: unknown[]): void {
  if (!isDev()) return;
  console.warn(...args);
}

export function devError(...args: unknown[]): void {
  if (!isDev()) return;
  console.error(...args);
}
