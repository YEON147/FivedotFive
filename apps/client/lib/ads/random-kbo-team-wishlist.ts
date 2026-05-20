import {
  KBO_TEAM_WISHLIST_BOARDS,
  type KboTeamBoardSlug,
} from "@/lib/constants/kbo-team-wishlist-boards";

export function pickRandomKboTeamWishlistSlug(): KboTeamBoardSlug {
  const idx = Math.floor(Math.random() * KBO_TEAM_WISHLIST_BOARDS.length);
  return KBO_TEAM_WISHLIST_BOARDS[idx]!.slug;
}

export function wishlistPathForTeamSlug(slug: KboTeamBoardSlug): string {
  return `/wishlist/${encodeURIComponent(slug)}`;
}
