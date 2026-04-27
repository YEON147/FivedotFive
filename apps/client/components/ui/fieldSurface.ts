/**
 * TextField 입력란과 동일한 테두리·배경·포커스 링.
 * 높이·좌우 패딩·글자 크기는 각 컴포넌트 `className`으로 지정합니다.
 */
export const FIELD_SURFACE_FRAME =
  "rounded-xl border outline-none transition focus:ring-2";

export function fieldSurfaceState(error: boolean, filled: boolean): string {
  if (error) {
    return "border-rose-300 bg-rose-50 focus:ring-rose-200";
  }
  if (filled) {
    return "border-[#7B61FF]/30 bg-[#faf8ff] focus:ring-[#7B61FF]/25";
  }
  return "border-slate-200 bg-white focus:ring-[#7B61FF]/25";
}

/**
 * 추가 정보 카드 한 줄(성별 버튼·학교·학년) 공통 박스 규격.
 * 세로 34px · rounded-lg · text-xs — GenderToggle `h-[34px]` 과 동일 축.
 */
export const COMPACT_CONTROL_BOX_CLASS =
  "box-border !h-[34px] min-h-[34px] max-h-[34px] w-full min-w-0 !rounded-lg py-0 text-xs font-normal leading-normal text-slate-900";

/** 학교 검색 등 컴팩트 TextField — 좌우 동일 패딩 */
export const COMPACT_FIELD_INPUT_CLASS =
  `${COMPACT_CONTROL_BOX_CLASS} !px-3`;

/**
 * 같은 시각 크기의 native select — 우측 화살표 여역(pr-9)
 */
export const COMPACT_FIELD_SELECT_CLASS =
  `${COMPACT_CONTROL_BOX_CLASS} !pl-3 !pr-9 shrink-0 cursor-pointer appearance-none bg-no-repeat disabled:cursor-not-allowed !bg-[length:0.875rem_0.875rem]`;
