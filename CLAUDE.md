# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

このファイルは **全工程で必ず守る最小限のルール** に絞っている。詳細仕様・実装サンプル・コード例は `docs/` 配下にあるので、必要なときに該当ファイルを読むこと。

## コマンド

```bash
npm run dev          # 開発サーバー起動 (localhost:3000)
npm run build        # プロダクションビルド
npm run lint         # ESLint実行
npm run test:e2e     # Playwright（Instant Navigation 回帰検知のみ）
npm run test:e2e:ui  # 同上（UI モード）
```

ユニットテスト・コンポーネントテストは未設定。E2E は **Instant Navigation の回帰検知** のみ Playwright + `@next/playwright` の `instant()` ヘルパで `e2e/` に書く（詳細は `docs/22_instant-navigation.md`）。

## 重要：技術スタックのバージョン

- **Next.js 16.2.4 + React 19.2.4**（学習データより新しい）。Next.js 固有のコードを書く前に `node_modules/next/dist/docs/01-app/` の該当ガイドを必ず読むこと。
- 動的ルートのパラメータは Next.js 15+ で **`params: Promise<{...}>`** に変わった。`const { id } = await params;` で取り出す（`searchParams` も同様）。
- クライアントサイドナビゲーションが遅い場合、`Suspense` だけでは不十分。ルートから `unstable_instant` もエクスポートする必要がある（`node_modules/next/dist/docs/01-app/02-guides/instant-navigation.mdx`）。

---

## ドキュメント構造

実装は **チケット駆動**。`docs/00_overview.md`（チケット INDEX）→ 対象チケット → 「参考」リンクの spec を読む → 実装。仕様変更は spec 側を先に直し、CLAUDE.md（規約）には触らない。

### `docs/`（チケット）

各ファイル先頭に `[ ]` の TODO チェックリスト。完了したら `[x]` に書き換える。

### `docs/specs/`（仕様）

| ファイル                                                      | 内容                                                                 |
| ------------------------------------------------------------- | -------------------------------------------------------------------- |
| [`product.md`](./docs/specs/product.md)                       | プロダクト概要・機能一覧（F-01〜F-12）                               |
| [`tech-stack.md`](./docs/specs/tech-stack.md)                 | 技術スタック・想定コスト・環境変数・ディレクトリ構成                 |
| [`pages.md`](./docs/specs/pages.md)                           | ページ構成・URL 設計・認証ルール                                     |
| [`api.md`](./docs/specs/api.md)                               | Route Handler 一覧（ユーザー向け / 管理者向け）                      |
| [`database.md`](./docs/specs/database.md)                     | テーブル定義・RLS・トリガー・インデックス                            |
| [`nextjs-conventions.md`](./docs/specs/nextjs-conventions.md) | **Next.js App Router 規約（必読）**・NG パターン一覧                 |
| [`supabase-auth.md`](./docs/specs/supabase-auth.md)           | **Supabase Auth（@supabase/ssr）実装ルール**・コード雛形・DO/DON'T   |
| [`design.md`](./docs/specs/design.md)                         | デザイントークン・画面パターン                                       |
| [`ai-identify.md`](./docs/specs/ai-identify.md)               | Gemini API 呼び出し・3 段階フォールバックマッチング・UI              |
| [`story-card.md`](./docs/specs/story-card.md)                 | Canvas API でのしおり生成                                            |
| [`data-collector.md`](./docs/specs/data-collector.md)         | Python スクレイパー 5 本（scrape→normalize→geocode→validate→upload） |
| [`seo.md`](./docs/specs/seo.md)                               | メタデータ・sitemap・robots・JSON-LD                                 |
| [`operations.md`](./docs/specs/operations.md)                 | オーバーツーリズム対策・コスト管理・技術的懸念点・ローンチチェック   |
| [`roadmap.md`](./docs/specs/roadmap.md)                       | 4 週間ロードマップ・v2 拡張・未確定事項                              |

---

## 全コミットで守るルール

### Next.js App Router（要点）

- `'use client'` を書かない限り **Server Component**。データ取得は Server で `async/await`、`useEffect` + `fetch` でクライアント側から取りに行かない。
- フォーム・更新系は **Server Actions** 第一選択。外部からの呼び出し・Webhook は **Route Handler**（`app/api/**/route.ts`）。Server Action 後の再取得は `revalidatePath` / `revalidateTag`（`router.refresh()` 連発で代替しない）。
- 内部リンクは `<Link>`、画像は `<Image>`、`useRouter` は `next/navigation`。`<Head>` は使わず `metadata` / `generateMetadata`。
- ルートに使えるファイル名は `page.tsx` / `layout.tsx` / `loading.tsx` / `error.tsx` / `not-found.tsx` / `route.ts` / `template.tsx` のみ。
- 一覧の絞り込みは **URL `searchParams`** に持たせる（`useState` でローカル保持しない）。
- `fetch` のキャッシュは `cache` / `next.revalidate` / `next.tags` を **明示**。「とりあえずデフォルト」で書かない。
- 詳細・NG パターン一覧・並列化方針は [`docs/specs/nextjs-conventions.md`](./docs/specs/nextjs-conventions.md)。

### Supabase Auth（要点）

- `@supabase/ssr` を使用（`@supabase/auth-helpers-nextjs` は deprecated）。Cookie は **`getAll()` / `setAll()` ペア**（古い 3 メソッド形式は使わない）。
- サーバー側のログイン判定は必ず **`supabase.auth.getUser()`**。`getSession()` は Cookie 改ざんが検証されないため信用しない。
- `lib/supabase/server.ts` の `createClient()` は **リクエストごとに新規生成**（モジュールスコープでキャッシュしない）。
- `middleware.ts` 内では `createServerClient` の直後に `getUser()` を呼び、間に処理を挟まない（セッション喪失の原因）。`supabaseResponse` をそのまま return する。
- 既存実装は `lib/supabase/{client,server,middleware}.ts` / `middleware.ts` / `app/auth/callback/route.ts`。コード雛形・DO/DON'T は [`docs/specs/supabase-auth.md`](./docs/specs/supabase-auth.md)。

### 論理削除（全テーブル必須）

- 物理削除は禁止。全テーブルに `deleted_at TIMESTAMPTZ DEFAULT NULL` を持たせる。
- **全クエリで `WHERE deleted_at IS NULL`（Supabase クライアントなら `.is('deleted_at', null)`）を必須**。漏れるとゴミレコードが画面に出る。
- 親レコード（`spots`, `flowers`, `profiles` 等）の論理削除時は子レコードもカスケード論理削除する（DB トリガーで自動化、`docs/specs/database.md` 参照）。
- レビューは退会後も物理削除しない。`profiles.deleted_at IS NOT NULL` の場合に「退会済ユーザー」と表示。

### `images` テーブル整合性（多態関連）

- `images` は `owner_type ('spot' | 'flower')` + `owner_id` で多態関連を表現。外部キー制約はかけられない。
- INSERT 前に必ず **`lib/utils/imageValidator.ts` の `validateImageOwner()` で親存在チェック**。さらに DB トリガー（`validate_image_owner_trigger`）でも同じ検証をかける（A 層 + B 層の 2 層防御）。
- 取得時は別クエリで `eq('owner_type', ...)`+`eq('owner_id', ...)`+`is('deleted_at', null)`+`order('display_order')`。Supabase の relation join では取れない。

### コスト・セキュリティ境界

- `SUPABASE_SERVICE_ROLE_KEY` / `GEMINI_API_KEY` などサーバー秘密は **`NEXT_PUBLIC_` プレフィックスを付けない**。Client Component から import しない。Route Handler / Server Action / バッチ内に閉じる。
- AI 判定など外部 API 呼び出しは **必ずレート制限**（匿名 1/日、ログイン 3/日）を `ai_usage_logs` で管理。匿名 ID は `localStorage` の UUID。
- 画像はアップロード前にクライアントで **max-width 1024px、JPEG 0.8、2MB 以下にリサイズ**。同一画像（SHA-256 ハッシュ）は 24h キャッシュして API 呼び出しを抑制。
- スポットは **`is_published=false` で投入 → 管理者が出典を確認 → 公開**。`official_url` が NULL の場合は `source` 必須（オーバーツーリズム対策）。

### デザイン

UI 実装は [`docs/specs/design.md`](./docs/specs/design.md) のトークン・パターンに従う。色・角丸・フォントは `app/globals.css` の `@theme` トークン経由のみ（`bg-brand` / `text-ink` / `font-serif` / `rounded-card` 等）。Tailwind の生パレット（`bg-pink-300` 等）を本番コードに直書きしない（**例外**：花の写真がない時のグラデーション・プレースホルダーのみ可）。新しい色や画面パターンを追加する場合は、コードと `docs/specs/design.md` を**同時に更新**する。実装サンプルは `app/demo/page.tsx`。

### 命名・共通ユーティリティ

- 管理者ロール判定は `profiles.role === 'admin'`。Route Handler では共通ユーティリティ `lib/utils/requireAdmin.ts` を使う。
- 月またぎの見頃判定は `lib/utils/seasonUtils.ts` の `isInBestSeason()` を使う（直接書かない）。
- NG ワード辞書は `lib/ng-words.ts`。バージョン管理し、すり抜けたものは管理者画面から手動論理削除。

---

## 実装フロー

1. `docs/00_overview.md` で対象チケット番号を確認
2. チケットファイル（例：`docs/05_top-page.md`）の TODO と「参考」リンクを確認
3. 「参考」の `docs/specs/*.md` を読んで詳細仕様を把握
4. 実装 → TODO を `[x]` に更新
5. 仕様の不整合に気付いたら **specs を先に直してから** 実装する（CLAUDE.md には触らない）
6. **1 チケット = 1 ブランチ**。`<type>/NN-<topic>` 形式で `origin/main` から切る（例：`chore/01-project-setup`、`feat/05-top-page`）
7. **コミットは機能単位で分割する**。1 コミット = 1 論理変更を原則とし、`feat`（実装）/ `refactor`（リネーム・整理）/ `docs`（仕様・README 更新）/ `chore`（設定・スケルトン）などは別コミットに分ける。分割が困難な場合のみ 1 コミットに集約してよい。コミット時の手順・チェックは `/commit` スキル参照
