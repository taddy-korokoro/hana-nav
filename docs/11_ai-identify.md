# 11. AI 花判定 + レート制限

## 概要

ユーザーが撮影/選択した花の画像を Gemini API で判定し、PictureThis 風 UI で結果と関連スポットを表示する。匿名/ログイン別のレート制限を `ai_usage_logs` で管理する。

## 関連機能

- F-05 AI 植物判定
- F-07 レート制限（匿名1/日、ログイン3/日）

## 依存チケット

- [02](./02_database-schema.md), [03](./03_auth.md)

## 関連ファイル

- `app/identify/page.tsx`（入口・カメラ起動 or ファイル選択）
- `app/identify/result/page.tsx`（判定結果 UI）
- `app/api/ai/identify-flower/route.ts`
- `lib/utils/anonymousId.ts`（匿名識別子の生成・保存）
- `lib/utils/imageResize.ts`（クライアント圧縮）
- `lib/utils/imageHash.ts`（SHA-256 キャッシュキー）
- `components/identify/IdentifyUploader.tsx`（Client Component）
- `components/identify/IdentifyResult.tsx`
- `components/identify/RateLimitBanner.tsx`

## 関連 DB

`ai_usage_logs`, `flowers`, `flower_aliases`, `images`, `spots`, `spot_flowers`

## TODO

### 入口画面（`/identify`）

- [ ] カメラ起動（`<input type="file" accept="image/*" capture="environment">`）
- [ ] ファイル選択
- [ ] 利用状況バナー（残回数表示）
- [ ] プライバシー注意文（画像はサーバー処理にのみ使う）

### クライアント画像処理

- [ ] `imageResize.ts`：max-width 1024px、JPEG 品質 0.8、2MB 以下に圧縮
- [ ] `imageHash.ts`：SHA-256 をクライアントで計算してキャッシュキーとして送信
- [ ] `anonymousId.ts`：`crypto.randomUUID()` を `localStorage` に永続化

### Route Handler（`/api/ai/identify-flower`）

- [ ] FormData で画像 + userId（任意） + anonId 受領
- [ ] レート制限チェック（`checkRateLimit`）
- [ ] 同一画像ハッシュの 24h キャッシュ確認（任意：`ai_response_cache` テーブル or KV）
- [ ] Gemini `gemini-2.5-flash` を呼び出し（プロンプトは [specs/ai-identify.md](./specs/ai-identify.md) の通り）
- [ ] レスポンス JSON をパース・サニタイズ
- [ ] 3段階フォールバックでマスターマッチング
  - [ ] `flowers.name` 完全一致
  - [ ] `flower_aliases.alias` 完全一致
  - [ ] `flower_variety` でエイリアス検索
- [ ] マッチ花の `images` を取得
- [ ] 関連スポット最大5件取得（`is_published=true`）
- [ ] `ai_usage_logs` に記録
- [ ] 残回数とともにレスポンス返却

### 判定結果 UI（`/identify/result`）

- [ ] PictureThis 風レイアウト（写真 + 花名 + 信頼度 + 開花状況）
- [ ] 特徴 / 花言葉 / 豆知識
- [ ] 関連スポットカード（最大5件）
- [ ] 「旅のしおりを作る」CTA → [12](./12_story-card.md) へ
- [ ] confidence 低い場合の「自信なし」表示
- [ ] マスター未登録時の表示（特徴のみ表示、関連スポット非表示）

### レート制限 UI

- [ ] 残回数表示（ヘッダー or バナー）
- [ ] 上限到達時の表示（「明日また試してね」or リワード広告誘導）
- [ ] ログイン誘導（匿名→ログインで残回数アップ）

### 動作確認

- [ ] 通常画像で判定が返る
- [ ] 花以外の画像で `is_flower: false` が返り、ユーザーに通知される
- [ ] 匿名の場合 1日1回で上限になる
- [ ] ログインの場合 1日3回で上限になる
- [ ] 同一画像 2回目はキャッシュから返る（API コールなし）
- [ ] confidence ≦ 0.5 の場合に「自信なし」表示
- [ ] Gemini API のタイムアウト/エラー時のフォールバック表示

## コスト管理

- [ ] Google Cloud 月予算アラート ¥5,000 設定
- [ ] Gemini API キーをサーバーのみで使用していることを確認

## 完了基準

- [ ] 画像から花を判定できる
- [ ] レート制限が機能する
- [ ] 関連スポットが表示される

## 参考

- [specs/ai-identify.md](./specs/ai-identify.md)
- [specs/operations.md](./specs/operations.md) — コスト管理 / Gemini API コスト爆発リスク
