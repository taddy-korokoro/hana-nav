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

## TODO

### 0. 月次リセット前の緊急対応（着手の最初に実施）

チケット 21 デプロイ後、`/spots` への bot トラフィック（12 時間で 644K req / Cache hit 0%）により Vercel が Pause（Fast Origin Transfer 31.24GB/10GB、Fluid Active CPU 6h37m/4h）。月次リセット（6/1）で復活した瞬間に再 Pause しないよう、22 本体（`cacheComponents` + `use cache`）と直交する以下 2 点を先行で main に乗せておく。

#### 0-1. middleware matcher を保護パスに絞る

- [ ] `middleware.ts:8-18` の matcher を `/mypage/:path*` / `/admin/:path*` / `/auth/callback` の 3 パスに限定
  ```ts
  export const config = {
    matcher: ['/mypage/:path*', '/admin/:path*', '/auth/callback'],
  };
  ```
- 公開ページから `supabase.auth.getUser()` 呼び出しが消える（Fluid Active CPU の主要因を除去）
- Cookie 同期は `lib/supabase/server.ts` 側の `setAll` で行われるので、ログインユーザーがマイページに遷移した時点で同期される。実害なし
- `/auth/callback` だけ残すのは OAuth コールバック直後のセッション更新を担保するため
- 22 本体の `cacheComponents` 対応とは独立した恒久措置として扱う

#### 0-3. Vercel Firewall で `/spots` にレート制限

コード変更なし。Vercel Dashboard 操作のみ。

- [ ] Dashboard → Firewall → Custom Rules → Add Rule で以下を作成
  - Name: `rate-limit-spots-bot`
  - If: `Path` `starts with` `/spots`
  - Then: `Rate Limit`（Fixed Window / 60 requests / 1 minute / Key by IP Address）
  - Action when exceeded: `Deny`（429）/ Duration `10 minutes`
- 60 req/min/IP は人間操作では到達しない値。bot 由来トラフィックのみを抑制する
- 正規クローラー（Googlebot 等）を守りたい場合は AND 条件で `User-Agent does not contain "Googlebot"` を追加
- Firewall は Hobby プランでも利用可。Edge Request はカウントされるが、関数実行・Origin Transfer は発生しない
- リセット後 1〜2 日は Firewall Logs で当たり方を確認し、閾値を調整

#### リセット前のフロー

1. ブランチ `feat/22-instant-navigation` を `main` から作成
2. 0-1 をコミット → PR → main へ merge（Vercel は Paused のままなので deploy は走らないが、6/1 リセット時に自動デプロイされる）
3. 0-3 を Vercel Dashboard で設定（Paused でも Firewall ルールは適用可能）
4. 6/1 リセット後、Usage 推移を 2〜3 日観測
5. 問題なければ以下「設計確認」「実装」に進む

> 0-2 として検討していた `/spots` への `export const revalidate = 300` 暫定対応は、22 本体の `cacheComponents` + `use cache` で同じ効果が得られるため**スキップ**。万が一 22 本体が 6/1 を跨ぎそうな場合のみ、hotfix で先行投入する。

### 設計確認

- [ ] `cacheComponents` 有効化に伴って影響を受けるページを棚卸し（`grep -r "force-dynamic" app/`）
- [ ] 各ページについて「`use cache` できる範囲」と「Suspense で囲むべき動的領域」を区分
  - 公開ページ：花マスター・スポットマスターは `use cache` + `revalidateTag` で扱える
  - マイページ：cookies / Auth セッションが絡むので各 Server Component を Suspense でラップ
  - 管理画面：基本は static shell に向かないので対象外（`unstable_instant = false` を明示）

### 実装

- [ ] `next.config.ts` に `experimental.cacheComponents = true` を追加
- [ ] 各 Server Component のデータ取得を `use cache` に切り替え（`lib/queries/*` 経由のもの）
- [ ] cookies / auth が絡む箇所は `<Suspense>` で囲む
- [ ] 対象ルート（トップ / `/spots` / `/spots/[id]` / `/flowers` / `/flowers/[id]` / `/areas/[prefecture_id]`）に `export const unstable_instant = { prefetch: 'static' }` を追加
- [ ] 既存の `export const dynamic = 'force-dynamic'` を削除（`unstable_instant` と矛盾するため）
- [ ] 管理画面・マイページ詳細など適用しないルートには `export const unstable_instant = false` を明示（バリデーションをスキップ）

### 検証

- [ ] `next.config.js` の `experimental.instantNavigationDevToolsToggle = true` を一時的に有効化し、Next.js DevTools の「Instant Navs」で挙動を目視確認
- [ ] `npm run build` でビルド時バリデーションが通ることを確認（エラー = 静的シェル化できない箇所）
- [ ] `<Link>` プリフェッチ後の遷移が体感で即時になることを確認（一覧 ↔ 詳細の往復）

## 注意点

- `unstable_instant` は名前のとおり **unstable**。Next.js の最新版で API が変わる可能性があるので、適用後しばらくはアップグレード時に追従コストが発生する想定で扱う
- `cacheComponents` 有効化はキャッシュ動作が変わるので、データの「鮮度」と「キャッシュ TTL」をチケット 19 (SEO) や `/api/*` の Cache-Control ヘッダ設計と合わせて再確認する
- `use cache` はサーバ起動中の in-memory キャッシュなのでデプロイ間で揺らぐ。永続化が必要なら `revalidateTag` でキー設計する

## 完了基準

- [ ] 公開ページのうち主要ルートが `unstable_instant` 対応で `npm run build` が通る
- [ ] 一覧 ↔ 詳細の遷移がプリフェッチ済み URL で即座に切り替わる
- [ ] マイページ・管理画面など対象外ルートが意図的に `unstable_instant = false` で除外されている

## チケット 21 残項目の最終確認（リセット後）

チケット [21](./21_deploy-launch.md) のうち、Vercel Pause 解除（月次リセット = 6/1）後でしか実施できない項目をここで仕上げる。22 本体（`cacheComponents` + `unstable_instant`）は Performance スコアに大きく寄与するため、Lighthouse 計測は本セクションのタイミングが最適。

### SEO 最終確認

- [ ] Lighthouse モバイルスコア：Performance / SEO ともに 80+
  - 22 本体実装後に計測。閾値未達の場合は LCP / CLS / 主要 LCP 画像の優先度を切り分け
  - 計測場所：本番 URL `https://hananav.site/` および `/spots`、`/spots/[id]`、`/flowers/[id]`

### ローンチ後すぐの監視

- [ ] 初日：Vercel Logs を 1 時間ごとに確認、500 系エラーがないか
- [ ] AI 利用回数（`ai_usage_logs`）の急増を監視。バズ検知時は API キー無効化を即決
- [ ] Supabase DB サイズの推移を確認

### チケット 21 の完了基準

- [ ] 本番 URL で全機能が動作する
- [ ] コストアラートが設定されている
- [ ] ローンチチェックリスト全項目が完了している（[`launch-runbook.md`](./launch-runbook.md) のチェック状況）

## 参考

- [CLAUDE.md](../CLAUDE.md) 冒頭「重要：Next.jsバージョンについて」のヒント
- `node_modules/next/dist/docs/01-app/02-guides/instant-navigation.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/instant.md`
