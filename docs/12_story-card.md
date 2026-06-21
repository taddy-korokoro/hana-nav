# 12. 旅のしおり生成 + SNS シェア（F-06）

## 概要

ユーザーの花写真をベースに、Canvas API で縦長 1080×1920 のしおり画像をクライアントサイドで生成し、Web Share API で SNS シェアする。サーバーコスト ¥0。

## 関連機能

- F-06 旅のしおり画像生成

## 依存チケット

- [11](./11_ai-identify.md)

## 関連ファイル

- `app/(site)/identify/story/page.tsx`
- `app/(site)/identify/story/loading.tsx`
- `components/identify/StoryCardGenerator.tsx`
- `components/identify/storage.ts`（`IDENTIFY_USER_IMAGE_STORAGE_KEY` を追加）
- `components/identify/IdentifyUploader.tsx`（リサイズ済み画像を sessionStorage に保存）
- `lib/utils/canvasHelpers.ts`（loadImage / drawImageCover / wrapText）

## TODO

### Canvas 描画

- [x] 1080×1920 の Canvas を準備
- [x] ユーザー画像を `cover` でフィット描画
- [x] 下部にグラデーションオーバーレイ（透明 → 黒 70%）
- [x] 花名（96px bold, white）
- [x] 花言葉（42px italic, white95）
- [x] スポット名（48px, white90）
- [x] 訪問日（36px, white80）
- [x] コメント（40px、自動改行）
- [x] ロゴ「🌸 hana nav」（右下、bold 32px）
- [x] CORS：外部画像は `crossOrigin = 'anonymous'`

### 入力 UI

- [x] 花名（AI 判定結果からプリフィル）
- [x] スポット名（任意）
- [x] 訪問日（デフォルトは今日）
- [x] コメント（任意、200文字まで）

### シェア

- [x] `navigator.share` + `canShare({ files: [...] })` で SNS 投稿
- [x] 非対応端末はダウンロードフォールバック
- [x] シェア時のテキスト：`{flower_name}を見つけました🌸 #花ナビ`

### モバイル対応

- [x] 端末性能で重い場合は 1080→720 に解像度ダウン（`navigator.hardwareConcurrency < 4`）
- [x] 生成中ローディング表示
- [x] プレビュー画像表示

### 動作確認

- [x] iOS Safari でシェアできる
- [ ] Android Chrome でシェアできる
- [x] PC ブラウザではダウンロード動作になる
- [x] 長いコメントが折り返される
- [x] 縦長/横長どちらの元画像でも `cover` で美しく収まる

## 完了基準

- [x] しおり画像が生成・プレビュー・シェアできる
- [x] AI 判定結果ページから遷移できる

## 参考

- [specs/story-card.md](./specs/story-card.md)
- [specs/operations.md](./specs/operations.md) — モバイルでの Canvas 性能リスク
- [specs/nextjs-conventions.md](./specs/nextjs-conventions.md) — Client Component の境界 / 画像の `<img>` 直書き例外
