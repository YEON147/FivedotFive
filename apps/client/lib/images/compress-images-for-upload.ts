/**
 * 공지·이미지 업로드 전 브라우저에서 용량 줄이기 (Canvas JPEG 재인코딩).
 * PNG 투명도는 JPEG 변환 시 사라질 수 있음.
 */

const DEFAULT_MAX_EDGE = 2048;
const JPEG_QUALITY = 0.82;
/** 이 크기 이하이면 그대로 둠 (불필요한 화질 손실 방지) */
const SKIP_BELOW_BYTES = 400 * 1024;

function baseName(name: string): string {
  const i = name.lastIndexOf(".");
  return i === -1 ? name : name.slice(0, i);
}

async function fileToJpegBlob(
  file: File,
  maxEdge: number,
  quality: number,
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    let { width: w, height: h } = bitmap;
    if (w > maxEdge || h > maxEdge) {
      if (w >= h) {
        h = Math.max(1, Math.round((h * maxEdge) / w));
        w = maxEdge;
      } else {
        w = Math.max(1, Math.round((w * maxEdge) / h));
        h = maxEdge;
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("canvas 2d를 사용할 수 없습니다.");
    }
    ctx.drawImage(bitmap, 0, 0, w, h);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", quality),
    );
    if (!blob) {
      throw new Error("이미지 인코딩에 실패했습니다.");
    }
    return blob;
  } finally {
    bitmap.close();
  }
}

/**
 * 이미지 파일만 가장 긴 변 기준으로 줄이고 JPEG로 재압축.
 * 압축 결과가 원본보다 커지면 원본을 유지합니다.
 */
export async function compressImagesForUpload(
  files: File[],
  options?: { maxEdge?: number; quality?: number },
): Promise<File[]> {
  const maxEdge = options?.maxEdge ?? DEFAULT_MAX_EDGE;
  const quality = options?.quality ?? JPEG_QUALITY;

  const out: File[] = [];
  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      out.push(file);
      continue;
    }
    if (file.size <= SKIP_BELOW_BYTES && file.type === "image/jpeg") {
      out.push(file);
      continue;
    }

    try {
      const blob = await fileToJpegBlob(file, maxEdge, quality);
      if (blob.size >= file.size) {
        out.push(file);
        continue;
      }
      const newName = `${baseName(file.name)}.jpg`;
      out.push(new File([blob], newName, { type: "image/jpeg" }));
    } catch {
      out.push(file);
    }
  }
  return out;
}
