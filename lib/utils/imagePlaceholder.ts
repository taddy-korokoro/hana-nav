/**
 * `next/image` の `placeholder="blur"` 用の汎用 blurDataURL。
 *
 * 画像ごとに固有の blurDataURL を生成しないシンプル運用として、ブランドカラー
 * `--color-brand-soft`（薄ピンク #f4e3eb）の 4×3 単色 SVG を base64 化したものを使う。
 * 読み込み完了までの間、デザイントークンと馴染む柔らかい色が表示されるので、
 * 真っ白フラッシュや黒抜けがなく、体感的に「もう読み込み始まっている」と認識される。
 *
 * 個別画像から生成した本格的なぼかしが必要になった場合は、images テーブルに
 * `blur_data_url` カラムを追加して別途配信する。
 */
export const STATIC_BLUR_DATA_URL =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0IDMiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjMiIGZpbGw9IiNmNGUzZWIiLz48L3N2Zz4=';
