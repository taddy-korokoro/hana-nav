/**
 * /identify から /identify/result へ判定結果を渡すための sessionStorage キー。
 * URL クエリやサーバーステートに置くと画像 URL や説明文が長くなりすぎるため、
 * 同一タブ内のクライアント受け渡しに割り切っている。
 */
export const IDENTIFY_RESULT_STORAGE_KEY = 'hana-nav:identify-result';

export type IdentifyApiResult = {
  success: true;
  ai_result: {
    flower_name?: string;
    flower_variety?: string;
    confidence?: number;
    bloom_status?: string;
    description?: string;
    flower_language?: string;
    fun_fact?: string;
    best_viewing_months?: string;
    is_flower?: boolean;
  };
  flower_master: {
    id: string;
    name: string;
    description: string | null;
    default_season_start: number | null;
    default_season_end: number | null;
  } | null;
  flower_images: { id: string; url: string; caption: string | null; display_order: number }[];
  recommended_spots: {
    id: string;
    name: string;
    location: string;
    official_url: string | null;
    best_season_start: number;
    best_season_end: number;
    prefecture_name: string;
    cover_image_url: string | null;
  }[];
  rate_limit: { used: number; limit: number; remaining: number };
};
