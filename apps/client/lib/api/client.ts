export async function apiClient<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const rawText = await response.text();
  let data: unknown = null;

  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    console.error("API 실패", {
      url: input,
      status: response.status,
      statusText: response.statusText,
      rawText,
    });

    const message =
      (data as { message?: string } | null)?.message ??
      `요청 처리 중 오류가 발생했습니다. (${response.status})`;

    throw new Error(message);
  }

  if (!data) {
    throw new Error("서버 응답이 비어 있거나 JSON 형식이 아닙니다.");
  }

  return data as T;
}