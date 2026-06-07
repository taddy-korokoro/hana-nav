# hana nav

**「いつ・どこで・何が咲いているか」が一目でわかる、全国の花畑スポット検索サービス。**

🔗 **Live demo**: <https://hananav.site>

> ログイン画面の **「ゲストログイン（閲覧専用）」** ボタンで、管理画面を含めた全動線を確認できます。
> 書き込み操作は UI とサーバーの両層でブロックされ、データには影響しません。

<table>
<tr>
<td valign="top" width="33%"><b>トップ（見頃マップ + エリア + AI 訴求）</b><br><img src="./docs/images/screenshot-top.png" alt="Top"></td>
<td valign="top" width="33%"><b>スポット詳細</b><br><img src="./docs/images/screenshot-spot.png" alt="Spot"></td>
<td valign="top" width="33%"><b>AI 花判定 → 旅のしおり</b><br><img src="./docs/images/screenshot-identify.png" alt="Identify"></td>
</tr>
</table>

---

## このプロジェクトについて

見頃カレンダー × 地図検索 × AI 花判定 → 旅のしおり画像生成 → SNS 共有まで、「行きたいと思った瞬間」から「訪問体験のシェア」までを 1 つのサービスとして設計・実装した個人開発の MVP。

---

## 技術スタック

| 領域         | 選定                                                                 | 採用理由・ポイント                                                  |
| ------------ | -------------------------------------------------------------------- | ------------------------------------------------------------------- |
| フロント     | Next.js 16.2.4（App Router）+ React 19.2.4 + TypeScript              | Server Components 前提のキャッシュ戦略を素直に書くため最新メジャー  |
| キャッシュ   | Next.js Cache Components（`'use cache'` + `cacheTag` + `updateTag`） | 公開ページの read-your-own-writes をピンポイントに実現              |
| スタイリング | Tailwind CSS v4（`@theme` トークン定義）+ shadcn/ui                  | `tailwind.config` 不要の CSS-only 構成、デザイントークンを 1 箇所に |
| DB / 認証    | Supabase（PostgreSQL + RLS + Storage + Auth）                        | `@supabase/ssr` ベースで Cookie 同期を厳密に運用                    |
| AI           | Google Gemini API（`gemini-2.5-flash`）                              | マスタと 3 段階フォールバックでマッチング、再現率と精度を両立       |
| 地図         | Google Maps JavaScript API                                           | 月予算アラート + ピンの私有地ボカし運用                             |
| 画像合成     | Canvas API（クライアント側合成）                                     | 旅のしおりを 1 枚画像で Web Share API → SNS へ                      |
| ホスティング | **Vercel**                                                           | Image Optimization・Functions・Spend Management で運用負荷を最小化  |
| データ収集   | Python（scrape → normalize → geocode → validate → upload の 5 段）   | 公式 URL / 出典明記を validate 段階で必須化                         |

**想定月額コスト（MAU 5,000）**: ¥3,000〜21,800（無料枠運用 → スケールで Pro 移行）

---

## 設計上の主な意思決定

文書は **全コミットに効くコーディング原則（`CLAUDE.md`）** と **機能・画面ごとの仕様（`docs/specs/`）** を物理的に別ファイルに分けて運用している。同じ場所に混在させると、規約集が機能の話題で膨らんで読み飛ばされる典型的な失敗が起きる。両者を独立して更新できる状態を維持することで、規約の重みと参照しやすさを担保している。

加えて、規約のみを常時参照し仕様は必要なチケットから都度辿る構造のため、Claude Code 等の AI コーディングアシスタントが毎セッションでロードするコンテキスト量も最小化できる（仕様変更で規約側まで肥大化しない）。

---

## 主な機能

### ユーザー向け（`/`, `/spots`, `/flowers`, `/identify`, `/mypage`）

| ID   | 機能                             | 技術ハイライト                                                         |
| ---- | -------------------------------- | ---------------------------------------------------------------------- |
| F-01 | トップ（見頃マップ × 検索 UI）   | 月またぎ判定（12〜2 月の梅など）を `seasonUtils.isInBestSeason` で吸収 |
| F-02 | スポット検索（エリア / 花 / 月） | URL `searchParams` ベースで Server-side 絞り込み                       |
| F-03 | スポット詳細                     | 画像スライダー（多態関連 `images` から別クエリで取得）                 |
| F-04 | 見頃カレンダー                   | `spot_flowers` の月単位カレンダーをクロス集計                          |
| F-05 | AI 花判定                        | Gemini + 3 段階フォールバックマッチング + 結果からスポット導線         |
| F-06 | 旅のしおり画像生成 + SNS シェア  | Canvas API クライアント合成 + Web Share API                            |
| F-07 | レート制限 + リワード広告解放    | `ai_usage_logs` ベース、+5 回解放                                      |
| F-08 | Supabase Auth（Email + Google）  | `@supabase/ssr` + Middleware で Cookie 同期                            |
| F-09 | ブックマーク（行きたいリスト）   | ログインユーザー限定、論理削除                                         |
| F-10 | レビュー（★ + 一言）             | NG ワード辞書（`lib/ng-words.ts`）で簡易フィルタ                       |

### 管理者向け（`/admin/*`）

`profiles.role = 'admin'` を満たすユーザー限定。Middleware と `lib/utils/requireAdmin.ts` の 2 層で権限チェックし、Service Role を必要とする処理は Route Handler / Server Action 内に閉じ込めている。

| 機能                             | 技術ハイライト                                                                                           |
| -------------------------------- | -------------------------------------------------------------------------------------------------------- |
| スポット投稿レビュー（公開承認） | `is_published=false` で投入 → 出典確認 → `togglePublishedAction` で公開。`updateTag('spots')` で即時反映 |
| スポット CRUD                    | `createSpotAction` / `updateSpotAction` / `softDeleteSpotAction`。`area:<prefecture_id>` も連動破棄      |
| 花マスター CRUD + 別名管理       | `flowers` + `flower_aliases`（AI 判定の 3 段階マッチング用）。`flower:<id>` でピンポイント無効化         |
| 画像管理（多態関連）             | アップロードは Service Role 経由で Supabase Storage へ。共通バリデータ + DB トリガーで親存在を 2 層検証  |
| レビュー削除                     | NG ワードすり抜けを論理削除。物理削除はせず退会時も「退会済ユーザー」として表示                          |
| ユーザー BAN・退会               | `profiles.deleted_at` を立てるとカスケード論理削除トリガーが付随データも無効化                           |
| AI 利用状況統計                  | `ai_usage_logs` をユーザー単位 / 日次で集計し、コスト爆発の兆候を早期検知                                |

---

## エンジニアリングの規律

### ドキュメントの分離

「変えにくいもの」と「変わり得るもの」を物理的に別ファイルに置くことで、規約集が雑談で膨れて読み飛ばされる典型的な失敗を避けている。

- **`CLAUDE.md`**（規約）— 全コミット必須のルール。App Router ベストプラクティス・Supabase Auth・論理削除・整合性・コスト・セキュリティ境界
- **`docs/specs/`**（仕様）— プロダクト・URL・DB・AI・データ収集・SEO・運用などの変わり得るもの。チケットから「参考」リンクで辿る
- **`docs/NN_*.md`**（チケット）— 機能・画面単位の TODO チェックリスト。**1 チケット = 1 ブランチ = 1 PR**

仕様変更は specs を先に直してから実装し、CLAUDE.md（規約）には触らないフローに固定している。

### ブランチ・コミット規約

- ブランチは `<type>/NN-<topic>` 形式で `origin/main` から切る（例: `feat/05-home-area-picker`）
- **1 コミット = 1 論理変更**。`feat` / `refactor` / `docs` / `chore` を別コミットに分割
- 機械的な commit hook（`/commit` skill）で、メッセージ規約と hana-nav 固有のレビュー観点（Service Role 露出 / 論理削除フィルタ漏れ / `is_published` の出典必須）を自動チェック

### 関連リンク

- 規約: [`CLAUDE.md`](./CLAUDE.md)
- チケット INDEX: [`docs/00_overview.md`](./docs/00_overview.md)
- 詳細仕様: [`docs/specs/`](./docs/specs/)
  - [product](./docs/specs/product.md) / [tech-stack](./docs/specs/tech-stack.md) / [pages](./docs/specs/pages.md) / [api](./docs/specs/api.md) / [database](./docs/specs/database.md)
  - [ai-identify](./docs/specs/ai-identify.md) / [story-card](./docs/specs/story-card.md) / [data-collector](./docs/specs/data-collector.md)
  - [seo](./docs/specs/seo.md) / [operations](./docs/specs/operations.md) / [roadmap](./docs/specs/roadmap.md) / [design](./docs/specs/design.md)

---

## ローカル開発

### セットアップ

```bash
cp .env.example .env.local   # 必要なキーを埋める
npm install
npm run dev                  # http://localhost:3000
```

### よく使うコマンド

```bash
npm run build          # プロダクションビルド
npm run lint           # ESLint
npm run format         # Prettier --write
npm run format:check   # Prettier 確認のみ
```

### 必須環境変数

```bash
GEMINI_API_KEY=                       # サーバー専用
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=            # サーバー専用（Route Handler / Server Action 内のみ）
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_BASE_URL=
```

> `SUPABASE_SERVICE_ROLE_KEY` と `GEMINI_API_KEY` は **Client Component から参照禁止**。Service Role を使う処理は Route Handler / Server Action / バッチスクリプト内に閉じ込めること。

### 任意（収益化）

- `RAKUTEN_APPLICATION_ID` / `RAKUTEN_ACCESS_KEY` / `RAKUTEN_AFFILIATE_ID` — 楽天アフィリエイトの商品・宿カードを「花の種類詳細」「スポット詳細」の 2 ページに表示するために使用。サーバー専用
- **2026-05-14 の楽天 API 移行で `accessKey` が必須化**された点に注意。未設定でもアプリは動作し、アフィリエイト枠は静かに非表示になる。詳細は [`docs/22a_rakuten-affiliate.md`](./docs/22a_rakuten-affiliate.md)

### 任意（お問い合わせ通知メール）

- `SMTP_USER` / `SMTP_PASS` — `/contact` フォーム送信時の通知メール、および `/admin/contact` からの返信メールに使う Gmail 認証情報
- SMTP ホスト・ポート（`smtp.gmail.com:587`）と通知の宛先（`SMTP_USER` 自身宛）は `lib/email/mailer.ts` で定数化しているため env は 2 つだけ
- 未設定でもフォーム自体は動作し DB 保存はされるが、メール送信はスキップされる。サーバー専用
