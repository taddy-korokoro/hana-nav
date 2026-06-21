# 22a. 楽天アフィリエイト導入

> **更新**: AI 判定結果ページの楽天ブックスは UX 上のノイズが大きいため撤去（残置は花詳細＝楽天市場、スポット詳細＝楽天トラベルの 2 箇所）。Books 関連のコンポーネント・queries・types・copy は削除済み。

## 概要

楽天ウェブサービス（無料）の検索 API を Server Component から呼び出し、コンテンツマッチした商品/宿カードを表示してアフィリエイト収益化する。

設置箇所は ROI 観点で 2 つに絞る：

| 配置                   | API                      | 用途                           |
| ---------------------- | ------------------------ | ------------------------------ |
| **花の種類詳細ページ** | 楽天市場商品検索 API     | 種・球根・苗・園芸キット       |
| **スポット詳細ページ** | 楽天トラベル空室検索 API | 近隣ホテル（緯度経度から自動） |

トップ / エリア一覧ページには載せない（ノイズになりやすく CV も期待薄）。

## 依存チケット

- [07](./07_spot-detail.md) — スポット詳細ページ
- [08](./08_flower-pages.md) — 花の種類詳細ページ
- [11](./11_ai-identify.md) — AI 判定結果ページ
- [20](./20_static-pages.md) — プライバシーポリシーへの追記が発生

## 関連ファイル

### 新規

- `lib/rakuten/client.ts` — fetch ラッパ（タイムアウト・エラーハンドリング・キャッシュ戦略）
- `lib/rakuten/types.ts` — 各 API のレスポンス型
- `lib/queries/rakuten.ts` — ドメイン別クエリ関数（`searchBooksByFlowerName` / `searchProductsByFlowerName` / `searchHotelsNearSpot`）
- `components/affiliate/AffiliateLink.tsx` — 「広告」バッジを強制する基底コンポーネント
- `components/affiliate/AffiliateBookCard.tsx` — 楽天ブックス用カード
- `components/affiliate/AffiliateProductCard.tsx` — 楽天市場用カード
- `components/affiliate/AffiliateHotelCard.tsx` — 楽天トラベル用カード
- `components/affiliate/AffiliateBookSection.tsx` — AI 判定結果に挿入する Server Component セクション
- `components/affiliate/AffiliateProductSection.tsx` — 花の種類詳細に挿入する Server Component セクション
- `components/affiliate/AffiliateHotelSection.tsx` — スポット詳細に挿入する Server Component セクション

### 変更

- `app/(site)/identify/result/page.tsx` — AffiliateBookSection を追加
- `app/(site)/flowers/[id]/page.tsx` — AffiliateProductSection を追加
- `app/(site)/spots/[id]/page.tsx` — AffiliateHotelSection を追加
- `app/(site)/privacy/page.tsx` — 「楽天アフィリエイトプログラム参加」の条項を追記
- `lib/constants/copy.ts` — 各セクションの見出し・空状態・広告ラベルを追加
- `docs/specs/operations.md` — 収益化セクションを追記
- `.env.local` / `.env.example` — `RAKUTEN_APPLICATION_ID` / `RAKUTEN_ACCESS_KEY` / `RAKUTEN_AFFILIATE_ID` を追加
- `README.md` — 環境変数説明を追記

## 環境変数

```bash
RAKUTEN_APPLICATION_ID=    # 楽天ウェブサービス アプリケーション ID（サーバー専用）
RAKUTEN_ACCESS_KEY=        # 楽天ウェブサービス アクセスキー（2026-05-14 API 移行で必須化）
RAKUTEN_AFFILIATE_ID=      # 楽天アフィリエイト ID（サーバー専用）
```

`NEXT_PUBLIC_` プレフィックスは付けない。Server Component と Route Handler 内のみで参照する。Client Component から触ろうとした時点で設計ミス。

## 設計方針

### データ取得層（`lib/rakuten/`）

- **Server Component から `await` で直接呼ぶ**（Route Handler は作らない）。クライアントから叩く必要がないため
- fetch のオプションは `next: { revalidate: 86400, tags: ['rakuten:books:<flower_id>'] }` のように **ドメインごとにキャッシュタグを切る**
- 楽天ウェブサービスの **1 秒 1 リクエスト** 制限・**1 日上限** に当たらないよう、必ず `revalidate` 経由で叩く（リクエスト時に直接 fetch しない）
- 失敗時は `null` を返し、上位の Section コンポーネントが「表示しない」or「テキストリンクのみ」にフォールバック

### 共通コンポーネント

- `<AffiliateLink>` は **必ず「広告」バッジを描画する**（景品表示法ステマ規制対応）。`<a target="_blank" rel="sponsored noopener noreferrer">` を強制
- 各 `Card` 系コンポーネントは `<AffiliateLink>` をラップする形にして、ステマ表記漏れを構造的に防ぐ
- カードのスタイルは design.md の `rounded-card border border-line bg-white` に準拠

### 検索クエリの組み立て

| API                  | クエリ                                                                                          |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| 楽天ブックス検索     | `keyword=<花名> 図鑑` で genre 絞り込み（書籍：001005）、`hits=4`                               |
| 楽天市場商品検索     | `keyword=<花名> 種 OR 苗`、`genreId=<園芸>`（後で確定）、`hits=4`、`imageFlag=1`                |
| 楽天トラベル空室検索 | `latitude=<spot.lat>&longitude=<spot.lng>&searchRadius=3`（km）、`hits=5`、`responseType=small` |

### キャッシュ戦略

| 配置         | revalidate | 理由                                     |
| ------------ | ---------- | ---------------------------------------- |
| 楽天ブックス | 24 時間    | 書籍の入れ替わりは緩やか                 |
| 楽天市場     | 12 時間    | 季節商品は週単位で動くが過剰更新を避ける |
| 楽天トラベル | 1 時間     | 空室は流動的だが MVP は 1 時間で十分     |

## 法令・規約対応

### ステマ規制（景品表示法 / 2023年10月施行）

- リンク or リンク群の **近接位置**に「広告」「PR」「アフィリエイト広告」等の明示
- ページ末尾の包括文言「※当サイトはアフィリエイトプログラムを利用しています」だけでは消費者庁ガイドライン上 **不十分**
- `<AffiliateLink>` の中で `<span>広告</span>` バッジを必ず描画する形で構造的に担保

### プライバシーポリシー追記

- 「楽天アフィリエイトプログラムに参加しています」
- 「楽天サイト訪問時に Cookie が設定される場合があります」
- 「Cookie 情報は楽天株式会社に送信され、楽天株式会社のプライバシーポリシーに従います」

### 楽天ウェブサービス利用規約

- レスポンスのキャッシュは技術的に必要な範囲で許容されているが、**永続的なローカル保存はしない**（24時間以内の `revalidate` で運用）
- 楽天が提供する商品画像 URL を `next/image` の `remotePatterns` に追加が必要

## TODO

### 楽天側のアカウント準備

- [x] 楽天会員登録 → 楽天アフィリエイト登録（審査なし、即時）
- [x] 楽天ウェブサービス Application ID を発行
  - **「許可されたウェブサイト」には本番 URL（`https://hananav.site`）のみ登録**。`http://localhost:3000` は楽天ウェブサービスの規約上（公開ホスト以外不可）登録できなかったため省略。ローカル開発時は `.env.local` に Application ID を入れれば API は叩ける（許可ドメインはサーバー側の参照元チェックに使われていないため）
  - アクセスキー（applicationSecret）は OAuth / 受発注系 API 専用で、本チケットの公開検索 API では未使用のため保存しない
- [x] アフィリエイト ID を確認
- [ ] `.env.local` に投入、Vercel 環境変数にも追加（Vercel 側は 22 チケットの本番デプロイ確認時にまとめて実施）

### データ取得層

- [x] `lib/rakuten/types.ts` で各 API のレスポンス型を定義
- [x] `lib/rakuten/client.ts` を実装（fetch ラッパ、タイムアウト 5秒、エラー時 null）
- [x] `lib/queries/rakuten.ts` で 3 つのクエリ関数を実装（`React.cache()` 併用）
- [x] `next.config.ts` の `images.remotePatterns` に楽天画像ドメインを追加（`thumbnail.image.rakuten.co.jp` / `img.travel.rakuten.co.jp` 等）

### 共通コンポーネント

- [x] `<AffiliateLink>` 実装（広告バッジ強制、`rel="sponsored noopener noreferrer"`、`target="_blank"`）
- [x] `<AffiliateBookCard>` 実装
- [x] `<AffiliateProductCard>` 実装
- [x] `<AffiliateHotelCard>` 実装
- [x] `app/demo/page.tsx` にアフィリエイトコンポーネントのショーケースを追加（`/demo/affiliate`）

### ページ組み込み

- [x] AI 判定結果ページ：`<AffiliateBookSection flowerName={...} />` を結果カード下に配置
  - 花名は `flower_master.name` 優先、なければ `ai_result.flower_name`
  - マスター未登録時も AI 推定名で検索する
  - sessionStorage 由来でクライアント状態のため `AffiliateBookSectionClient` （Server Action + `use()` + Suspense）として実装
- [x] 花の種類詳細ページ：`<AffiliateProductSection flowerName={flower.name} />` を「育ててみる」セクションとして配置
- [x] スポット詳細ページ：`<AffiliateHotelSection lat={spot.lat} lng={spot.lng} />` を「近くの宿」セクションとして配置
- [x] 各セクションを `<Suspense>` でラップしてストリーミング（楽天 API の遅延でページ全体を遅延させない）

### 文言・コピー

- [x] `lib/constants/copy.ts` に `affiliate` セクション追加
  - セクション見出し（「もっと詳しく知る」「育ててみる」「近くの宿」）
  - 広告バッジテキスト（「広告」）
  - 空状態テキスト（「該当する商品が見つかりませんでした」）
  - エラー時のフォールバックリンク（楽天検索ページへの汎用リンク）

### 法令対応

- [x] `app/(site)/privacy/page.tsx` に楽天アフィリエイト条項を追加
  - 第 1 条（取得する情報）に「Cookie（楽天株式会社経由）」を追記
  - 第 3 条（第三者提供）に楽天株式会社を追加
  - 第 5 条として「アフィリエイトプログラム」を新設
- [x] 利用規約（`/terms`）の見直し（第 8 条「外部リンク・アフィリエイト」として、商品購入は外部事業者と利用者の取引であり運営者は責任を負わない旨を明記）

### 検証

以下は 22 (`docs/22_instant-navigation.md`) のローンチ前最終確認でまとめて実施する（22a 単体では Vercel 本番アクセスが取れないため）。

- [ ] ローカルで 3 箇所すべてに楽天カードが表示されること
- [ ] 「広告」バッジが各リンク近接に出ること
- [ ] 楽天 API 障害をシミュレートしてフォールバックが効くこと（一時的に環境変数を空に / API URL を変えるなど）
- [ ] アフィリエイト ID がリンク URL に正しく付与されていること
- [ ] `next/image` で楽天画像が表示できること（remotePatterns 設定済み）
- [ ] レスポンシブ確認（モバイル：1 列、PC：2 列等）
- [ ] DevTools Network で revalidate が効いている（同じページ再訪で API リクエストが発生しない）こと

### ドキュメント

- [x] `docs/specs/operations.md` に「収益化」セクションを追加
  - 楽天ウェブサービスの利用方法・無料枠の制約
  - レポート確認手順（楽天アフィリエイト管理画面）
  - 報酬受取設定（楽天キャッシュ vs 銀行振込）
- [x] `README.md` に環境変数の説明を追記

## コスト・運用

- 楽天ウェブサービスは無料、Application ID 単位で **1 秒 1 リクエスト**・**1 日のリクエスト上限あり**（公式に明示されないが、感覚的には 10 万 req/日程度）
- 上記を超えると一時的に 429 が返るので、必ず `revalidate` 経由で叩く設計
- 報酬は楽天キャッシュ受取（手数料無料・¥1 から）を推奨。銀行振込は ¥3,000 から

## 完了基準

UI / 法令対応 / 実装は本チケットで完了する。実環境での発火確認は 22 のローンチ前最終確認に統合する。

- [x] 全リンクに「広告」バッジが付き、`rel="sponsored noopener noreferrer"` で出力されている（実装・ローカル目視）
- [x] 楽天 API 障害時もページが壊れない（実装上 `null` 返却 → フォールバックリンク表示）
- [x] プライバシーポリシー・利用規約に楽天アフィリエイトの記載が追加されている
- [ ] AI 判定結果 / 花の種類詳細 / スポット詳細の 3 箇所で楽天カードが表示される（→ 22 で実環境確認）
- [ ] 本番環境で実際にアフィリエイト ID 付き URL が発火することを確認（→ 22 で実環境確認）

## 参考

- [楽天ウェブサービス](https://webservice.rakuten.co.jp/)
- [楽天アフィリエイト](https://affiliate.rakuten.co.jp/)
- [消費者庁ステルスマーケティング規制](https://www.caa.go.jp/policies/policy/representation/fair_labeling/stealth_marketing/)
- [specs/operations.md](./specs/operations.md) — 収益化セクション（本チケットで追記）
- [specs/ai-identify.md](./specs/ai-identify.md) — AI 判定結果 UI
- [specs/nextjs-conventions.md](./specs/nextjs-conventions.md) — Route Handler / Server 側の API キー取り扱い
- [11](./11_ai-identify.md) / [07](./07_spot-detail.md) / [08](./08_flower-pages.md)
