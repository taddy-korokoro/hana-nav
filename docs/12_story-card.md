# 12. 旅のしおり生成 + SNS シェア（F-06）

## 概要

ユーザーの花写真をベースに、Canvas API で縦長 1080×1920 のしおり画像をクライアントサイドで生成し、Web Share API で SNS シェアする。サーバーコスト ¥0。

## 関連機能

- F-06 旅のしおり画像生成

## 依存チケット

- [11](./11_ai-identify.md)

## 関連ファイル

- `app/identify/story/page.tsx`
- `components/StoryCardGenerator.tsx`
- `lib/utils/canvasHelpers.ts`（loadImage / drawImageCover / wrapText）

## TODO

### Canvas 描画

- [ ] 1080×1920 の Canvas を準備
- [ ] ユーザー画像を `cover` でフィット描画
- [ ] 下部にグラデーションオーバーレイ（透明 → 黒 70%）
- [ ] 花名（96px bold, white）
- [ ] 花言葉（42px italic, white95）
- [ ] スポット名（48px, white90）
- [ ] 訪問日（36px, white80）
- [ ] コメント（40px、自動改行）
- [ ] ロゴ「🌸 hana nav」（右下、bold 32px）
- [ ] CORS：外部画像は `crossOrigin = 'anonymous'`

### 入力 UI

- [ ] 花名（AI 判定結果からプリフィル）
- [ ] スポット名（任意）
- [ ] 訪問日（デフォルトは今日）
- [ ] コメント（任意、200文字まで）

### シェア

- [ ] `navigator.share` + `canShare({ files: [...] })` で SNS 投稿
- [ ] 非対応端末はダウンロードフォールバック
- [ ] シェア時のテキスト：`{flower_name}を見つけました🌸 #花ナビ`

### モバイル対応

- [ ] 端末性能で重い場合は 1080→720 に解像度ダウン
- [ ] 生成中ローディング表示
- [ ] プレビュー画像表示

### 動作確認

- [ ] iOS Safari でシェアできる
- [ ] Android Chrome でシェアできる
- [ ] PC ブラウザではダウンロード動作になる
- [ ] 長いコメントが折り返される
- [ ] 縦長/横長どちらの元画像でも `cover` で美しく収まる

## 完了基準

- [ ] しおり画像が生成・プレビュー・シェアできる
- [ ] AI 判定結果ページから遷移できる

## 参考

- [specs/story-card.md](./specs/story-card.md)
- [specs/operations.md](./specs/operations.md) — モバイルでの Canvas 性能リスク
