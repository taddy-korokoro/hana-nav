# 22. Instant Navigation 全画面対応

## 概要

公開画面の主要ルートに Next.js の **`unstable_instant`** を適用し、`<Link>` のプリフェッチ + 静的シェル生成によるクライアント遷移高速化を効かせる。CLAUDE.md「クライアントサイドナビゲーションが遅い場合、`Suspense` だけでは不十分」のヒントに沿った仕上げ作業。

## 依存チケット

- [05](./05_top-page.md) / [06](./06_spot-search.md) / [07](./07_spot-detail.md) / [08](./08_flower-pages.md) / [09](./09_area-pages.md) — 公開ページ実装が一通り終わってから手を入れる
- [13](./13_mypage.md) / [14](./14_review.md) — マイページ系も対応するなら同じく完了後

## 関連ファイル

- `next.config.ts`（`cacheComponents` 有効化）
- 各ルートの `page.tsx`（`unstable_instant` エクスポート / `dynamic = 'force-dynamic'` 削除）
- 各 Server Component（`use cache` ディレクティブ追加 or `<Suspense>` 境界の追加）
- `node_modules/next/dist/docs/01-app/02-guides/instant-navigation.md` — 一次資料
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/instant.md` — API 仕様

## 前提・制約

`unstable_instant` は **`cacheComponents` を有効化しないと動かない**。さらに `cacheComponents` 有効下では「Server Component が cookies / headers / DB を直接 read する場合は Suspense で囲むか、データ層を `use cache` でキャッシュする」必要があり、現状の各 page.tsx の `dynamic = 'force-dynamic'` は撤去する設計変更を伴う。

つまりこのチケットは **キャッシュ戦略の見直しを兼ねる** ため、影響範囲が広い。08 などのチケットに混ぜると「機能実装 + キャッシュ再設計」が同じ PR に乗ってレビューしづらいので独立チケットとして切る。

### 2026-05-27 追記：cacheComponents の影響範囲が当初想定より広い

初回着手時（feat/22-instant-navigation ブランチ）に `cacheComponents: true` を有効化したところ、以下が判明：

- **`unstable_instant` を付けていないページも含めて、全 page/layout/route handler が新ルールの対象**になる
- 単に `force-dynamic` を撤去するだけでなく、**ほぼ全ページで「データ取得を Suspense で囲む」or「`use cache` する」refactor が必須**
- 具体的に build エラーで詰まった箇所：
  - `SiteFooter` の `tokyoYmd().year`（`new Date()` 呼び出し）→ prerender が拒否される。Client Component 化 + Suspense ラップで回避可能
  - `admin/layout.tsx` の `requireAdmin()` 直 await → static shell をブロック。Suspense 内側に閉じ込める必要あり
  - `auth/login` 等の `searchParams` 直 await → 同上
  - `app/api/*/route.ts` の `cookies()` 経由クエリ → prerender 時に `cookies()` rejection が発生
  - `tokyoYmd()` のような request-time data に依存するヘルパー全般

この知見を踏まえ、**1 PR でやり切らず複数 PR に分割**する方針に変更（下記「段階移行プラン」参照）。

## TODO

### 0. 月次リセット前の緊急対応（着手の最初に実施）

チケット 21 デプロイ後、`/spots` への bot トラフィック（12 時間で 644K req / Cache hit 0%）により Vercel が Pause（Fast Origin Transfer 31.24GB/10GB、Fluid Active CPU 6h37m/4h）。月次リセット（6/1）で復活した瞬間に再 Pause しないよう、22 本体（`cacheComponents` + `use cache`）と直交する以下 2 点を先行で main に乗せておく。

#### 0-1. middleware matcher を保護パスに絞る

- [x] `middleware.ts:8-18` の matcher を `/mypage/:path*` / `/admin/:path*` / `/auth/callback` の 3 パスに限定
  ```ts
  export const config = {
    matcher: ['/mypage/:path*', '/admin/:path*', '/auth/callback'],
  };
  ```
- 公開ページから `supabase.auth.getUser()` 呼び出しが消える（Fluid Active CPU の主要因を除去）
- Cookie 同期は `lib/supabase/server.ts` 側の `setAll` で行われるので、ログインユーザーがマイページに遷移した時点で同期される。実害なし
- `/auth/callback` だけ残すのは OAuth コールバック直後のセッション更新を担保するため
- 22 本体の `cacheComponents` 対応とは独立した恒久措置として扱う

#### 0-3. ~~Vercel Firewall で `/spots` にレート制限~~ → N/A（Netlify 移行で obsolete）

- ~~[ ] Dashboard → Firewall → Custom Rules → Add Rule で以下を作成~~ — **Netlify 移行のためスキップ**
- 必要が出れば Netlify Edge Function でレート制限実装する別チケットとして扱う

#### リセット前のフロー

1. ブランチ `feat/22-instant-navigation` を `main` から作成
2. 0-1 をコミット → PR → main へ merge（Vercel は Paused のままなので deploy は走らないが、6/1 リセット時に自動デプロイされる）
3. 0-3 を Vercel Dashboard で設定（Paused でも Firewall ルールは適用可能）
4. 6/1 リセット後、Usage 推移を 2〜3 日観測
5. 問題なければ以下「設計確認」「実装」に進む

> 0-2 として検討していた `/spots` への `export const revalidate = 300` 暫定対応は、22 本体の `cacheComponents` + `use cache` で同じ効果が得られるため**スキップ**。万が一 22 本体が 6/1 を跨ぎそうな場合のみ、hotfix で先行投入する。

## 段階移行プラン（2026-05-27 再設計）

1 PR でやり切ると差分が膨大かつ regression リスクが高いため、以下の **5 段階の PR** に分けて漸進的に進める。各 PR は単独で main にマージ可能で、build が通り続けること。

### Step 1: 共通基盤の事前修正（cacheComponents は **まだ有効化しない**）

`cacheComponents` を on にしなくても安全にできる「下準備」だけを先に main へ。

- [x] `SiteFooter` の `tokyoYmd().year` を Client Component（`SiteFooterYear`）に切り出し
- [x] `admin/layout.tsx` で `requireAdmin()` を Suspense + 子コンポーネントに分離する設計に書き換え
- [x] `admin/loading.tsx` を新設して暗黙の Suspense 境界を用意
- [x] `mypage/layout.tsx` を新設し、`getCurrentUser()` ガード（マイページの認証チェック）を Suspense 内側に閉じ込める
- [x] auth pages（`/auth/login` 他 4 本）を `searchParams` の await を子コンポーネントに切り出して Suspense でラップ

### Step 2: 公開ページ refactor（cacheComponents off のまま）

各公開ページの DB 取得を Suspense 境界の内側に押し下げ、`'use cache'` を意識した形に再構成する。`cacheComponents` を入れる前の **dry run** として効く形に整える。

- [x] `/` の `HomeContent` 内でデータ取得を `'use cache'` 化し Suspense 境界の内側に押し下げ
- [x] `/spots` の `searchParams` 駆動のフィルタを Suspense 境界内側に（`SpotsContent` で `<Suspense>` ラップ）
- [x] `/spots/[id]` の `loadSpotBundle` + `BookmarkButtonIsland` + `SpotReviewBlockIsland` で分離
- [x] `/flowers/[id]`（`loadFlowerBundle`）/ `/areas/[prefecture_id]`（`loadAreaBundle`）も同様

PR 単位は「1 ページ 1 PR」または「2〜3 ページまとめて」を状況で判断。

### Step 3: route handler を新ルール対応

`app/api/*/route.ts` のうち `cookies()` 経由で Supabase を叩いているものを、prerender 時に評価されない形に書き換える。

- [x] 各 route handler を確認し、build 時に prerender されないよう明示的に dynamic 化（`app/api/bookmarks/[spot_id]/route.ts` 等で確認済み、build 時の `ƒ Dynamic` マーカーで表示される）
- [x] cookies に依存しない公開クエリ（`/api/flowers` 等）は無 cookie の Supabase クライアントで叩く形に分離検討 → ユーザー固有状態は `/api/me/*` 系に分離済み（`/api/me/reviews/by-spot/[spot_id]/route.ts` 等）

### Step 4: cacheComponents 有効化 + データ層の `'use cache'` 化

- [x] `next.config.ts` に `cacheComponents: true` を追加
- [x] 各 page.tsx の `export const dynamic = 'force-dynamic'` / `export const revalidate = N` を撤去
- [x] 公開ページの `loadXxxBundle` 関数群に `'use cache'` ディレクティブを追加し、`lib/cacheTags.ts` で `revalidateTag` のキー設計を集約
- [x] build を通し、Step 1〜3 の準備で残った穴を埋める

### Step 5: `unstable_instant` 適用 + 検証

- [x] 対象ルート（トップ / `/spots` / `/spots/[id]` / `/flowers` / `/flowers/[id]` / `/areas/[prefecture_id]`）に `export const unstable_instant = { prefetch: 'static', unstable_disableValidation: true }` を追加
- [x] 追加で `/privacy` / `/terms` / `/identify` / `/identify/result` / `/identify/story` にも `prefetch: 'static'` を適用（共通レイアウトの cookies 読みを許容するため disableValidation を併用）
- [x] 管理画面・マイページ詳細など適用しないルートには `export const unstable_instant = false` を明示（バリデーションをスキップ）
- [x] `experimental.instantNavigationDevToolsToggle = true` を有効化
- [x] `npm run build` でビルドが通ることを確認
- [x] Next.js DevTools の「Instant Navs」で `/spots → /spots/[id]` を目視確認（2026-06-07）
- [x] **自動回帰テストの導入**: `@next/playwright` の `instant()` で `/spots → /spots/[id]` と `/flowers → /flowers/[id]` の 2 本を E2E 化（`e2e/instant-navigation.spec.ts`）
- [x] 本番デプロイ後に `<Link>` プリフェッチ後の遷移が体感で即時になることを確認（2026-06-07）

> **2026-06-07 着手結果**: `/spots` `/flowers` リストは searchParams 駆動のため厳格な runtime samples 設計が本来の正解だが、MVP では他ページと統一して `disableValidation: true` で簡易対応。Lighthouse 計測で「兄弟ルートから遷移時の遅延」が顕在化したタイミングで samples 化を別チケットで再着手する方針。
>
> **2026-06-07 追補（PR #70）**: PageSpeed Insights で `/flowers` が Performance 74 / LCP 5.6s / TTFB 2,040ms と未達だったため、ホームと同じ `'use cache'` + LCP priority 修正 + `content-visibility:auto` のパターンに揃えて改善（[`app/(site)/flowers/page.tsx`](<../app/(site)/flowers/page.tsx>) / [`components/flowers/FlowerCard.tsx`](../components/flowers/FlowerCard.tsx)）。

## 自動回帰テスト（Playwright + `@next/playwright`）

公式の `instant()` ヘルパで「動的データ到着前の静的シェル」だけに対して assertion する E2E テストを `e2e/instant-navigation.spec.ts` に置く。

```bash
npm run test:e2e        # ヘッドレス実行（CI 想定）
npm run test:e2e:ui     # Playwright UI モード（ローカルデバッグ）
```

設計方針（公式 docs より）:

> There is no need to write an `instant()` test for every navigation.
> Build-time validation already provides the structural guarantee.
> Use `instant()` for the user flows that matter most.

MVP では一覧 ↔ 詳細の代表 2 ルート（`/spots → /spots/[id]` と `/flowers → /flowers/[id]`）だけテストする。新ルート追加や `<Suspense>` 境界の再設計で「シェルが空白に化けた」等の致命的回帰が起きたタイミングでテストが落ちる。

依存:

- `@playwright/test` + `@next/playwright`（devDependencies に追加済み）
- 初回 `npx playwright install chromium` でブラウザバイナリ取得（約 90MB、ローカルキャッシュ）

注意:

- 本テストはローカル / Preview の Supabase に接続する。スポット / 花が 1 件以上存在しないと一覧→詳細クリックが成立しない（CI で空 DB を使う場合は seed が必要）
- `webServer` 設定で dev server を自動起動 / 再利用するため、追加の起動コマンドは不要

## 注意点

- `unstable_instant` は名前のとおり **unstable**。Next.js の最新版で API が変わる可能性があるので、適用後しばらくはアップグレード時に追従コストが発生する想定で扱う
- `cacheComponents` 有効化はキャッシュ動作が変わるので、データの「鮮度」と「キャッシュ TTL」をチケット 19 (SEO) や `/api/*` の Cache-Control ヘッダ設計と合わせて再確認する
- `use cache` はサーバ起動中の in-memory キャッシュなのでデプロイ間で揺らぐ。永続化が必要なら `revalidateTag` でキー設計する

## 完了基準

- [x] 公開ページのうち主要ルートが `unstable_instant` 対応で `npm run build` が通る
- [x] 一覧 ↔ 詳細の遷移がプリフェッチ済み URL で即座に切り替わる（ローカル目視 + E2E でカバー）
- [x] マイページ・管理画面など対象外ルートが意図的に `unstable_instant = false` で除外されている

## チケット 22a（楽天アフィリエイト）との関係

22 本体は段階移行で時間がかかるため、22a（PR #40）は **22 を待たず先に main へ merge する** 方針に変更（2026-05-27）。22a の実環境検証（楽天 ID 付与・カード表示等）はチケット 22 の Step 5 以降にまとめて実施する。

## チケット 21 残項目の最終確認（リセット後）

チケット [21](./21_deploy-launch.md) のうち、Vercel Pause 解除（月次リセット = 6/1）後でしか実施できない項目をここで仕上げる。22 本体（`cacheComponents` + `unstable_instant`）は Performance スコアに大きく寄与するため、Lighthouse 計測は本セクションのタイミングが最適。

### SEO 最終確認

- [x] Lighthouse モバイルスコア：Performance / SEO ともに 80+（2026-06-07 達成）
  - 22 本体実装後に計測。閾値未達の場合は LCP / CLS / 主要 LCP 画像の優先度を切り分け
  - 計測場所：本番 URL `https://hananav.site/` および `/spots`、`/spots/[id]`、`/flowers/[id]`
  - トップは PR #69（モバイル非表示・余白整理・InfoWindow CSS）で基準到達。`/flowers` は PR #70（`'use cache'` + LCP priority 修正 + `content-visibility:auto`）で基準近傍まで改善

### ローンチ後すぐの監視

> **注**: Vercel → Netlify に移行済み。「Vercel Logs」表記は「Netlify Functions Logs」と読み替える。

- [ ] 初日：Netlify Functions Logs を 1 時間ごとに確認、500 系エラーがないか
- [ ] AI 利用回数（`ai_usage_logs`）の急増を監視。バズ検知時は API キー無効化を即決
- [ ] Supabase DB サイズの推移を確認

### チケット 21 の完了基準

- [ ] 本番 URL で全機能が動作する
- [ ] コストアラートが設定されている
- [ ] ローンチチェックリスト全項目が完了している（[`launch-runbook.md`](./launch-runbook.md) のチェック状況）

## 参考

- [CLAUDE.md](../CLAUDE.md) 冒頭「重要：技術スタックのバージョン」のヒント
- [specs/nextjs-conventions.md](./specs/nextjs-conventions.md) — Server / Client 境界 / Link プリフェッチ
- `node_modules/next/dist/docs/01-app/02-guides/instant-navigation.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/instant.md`
