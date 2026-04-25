/**
 * 앱 셸 상단 헤더 공통 Tailwind 클래스.
 * 랭킹·회원가입·내정보·위시 프로필 헤더 등에서 재사용 — 수정 시 이 파일만 보면 됨.
 */

/** 풀폭 페이지 헤더 (`mb-4` · `w-full shrink-0` 포함) — 랭킹·회원가입·내정보 */
export const PAGE_HEADER_ROW =
  "relative z-40 mb-4 flex w-full shrink-0 items-center justify-between gap-2.5 pl-[5.5%] pr-[4%] pt-[7%]";

/**
 * 위시 메인/공개 프로필 타이틀 줄 — 위와 패딩·정렬은 같고 `mb-4`·`w-full shrink-0` 없음
 * (보드 카드 안 레이아웃과 맞추기 위한 기존 디자인 유지)
 */
export const PAGE_HEADER_ROW_COMPACT =
  "relative z-40 flex items-center justify-between gap-2.5 pl-[5.5%] pr-[4%] pt-[7%]";

/** 우측 햄버거 메뉴 — 연회색 원 + 보라 아이콘 */
export const PAGE_HEADER_MENU_BUTTON =
  "relative z-40 flex size-[42px] shrink-0 items-center justify-center rounded-full bg-slate-100 text-[#7B61FF] shadow-sm transition hover:bg-slate-200 active:bg-slate-300/90 touch-manipulation";

/** 좌측 뒤로가기 — 배경 없는 원형 터치 영역 */
export const PAGE_HEADER_BACK_BUTTON =
  "relative z-40 flex size-[42px] shrink-0 items-center justify-center rounded-full text-slate-800 transition hover:opacity-70 active:opacity-50 touch-manipulation";

/** 랭킹 헤더 등 — 우측 메뉴 없을 때 자리 맞춤용 42px */
export const PAGE_HEADER_END_SPACER = "relative z-40 size-[42px] shrink-0";
