/** 카카오 `data-ad-onfail` 에서 호출하는 전역 함수명 (페이지당 1종류, ins별 구분은 data-ad-instance-id) */
export const KAKAO_ADFIT_ONFAIL_CALLBACK_NAME = "ohJjeomOhKakaoAdfitOnFail";

const handlers = new Map<string, () => void>();

let globalInstalled = false;

export function installKakaoAdfitOnFailGlobal(): void {
  if (typeof window === "undefined" || globalInstalled) return;
  globalInstalled = true;

  (
    window as Window & {
      ohJjeomOhKakaoAdfitOnFail?: (elm: HTMLElement) => void;
    }
  ).ohJjeomOhKakaoAdfitOnFail = (elm: HTMLElement) => {
    const id = elm.getAttribute("data-ad-instance-id");
    if (!id) return;
    handlers.get(id)?.();
  };
}

export function registerKakaoAdfitOnFailHandler(
  instanceId: string,
  onFail: () => void,
): void {
  handlers.set(instanceId, onFail);
}

export function unregisterKakaoAdfitOnFailHandler(instanceId: string): void {
  handlers.delete(instanceId);
}

/** SDK 로드 전에 전역 콜백이 있어야 `data-ad-onfail` 이 동작함 */
if (typeof window !== "undefined") {
  installKakaoAdfitOnFailGlobal();
}
