# ADR-003. Instant Navigation 採用

| 項目       | 値                                                                 |
| ---------- | ------------------------------------------------------------------ |
| ステータス | Accepted（2026-06-07 本番反映済み、E2E 回帰テスト導入）            |
| 決定者     | プロジェクトリード                                                 |
| 関連 spec  | `docs/22_instant-navigation.md`                                    |
| 関連タスク | Netlify ローンチ後の Lighthouse 対応・チケット 21〜22 の一連の作業 |

---

## 1. 背景

MVP ローンチ時、公開ページのクライアントサイド遷移が体感で遅かった。特に「一覧 → 詳細」の主要動線（`/spots → /spots/[id]` や `/flowers → /flowers/[id]`）で、ページ遷移時に Server Component のデータ取得完了までシェルすら描画されず、白画面が数百 ms 見える状態が発生していた。

原因は 3 つの構造的問題。

| 原因                                              | 影響                                                               |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| 各ページで `dynamic = 'force-dynamic'` を指定     | サーバー生成が毎回走り、`<Link>` の静的プリフェッチ効果が消える    |
| Server Component 直下でデータを await             | Suspense 境界がなく、シェル HTML すらデータ待ちでブロックされる    |
| Vercel → Netlify 移行検討 & Fluid Active CPU 高騰 | サーバー生成回数を減らさないとホスティングコストで詰む懸念があった |

CLAUDE.md の「重要：技術スタックのバージョン」冒頭で明示されている通り、Next.js 16.2.4 では `Suspense` 単独では不十分で、**ルートから `unstable_instant` をエクスポート**することが公式の推奨解になっている（`node_modules/next/dist/docs/01-app/02-guides/instant-navigation.mdx`）。

さらに、`unstable_instant` は Next.js の `cacheComponents` 機能に依存するため、キャッシュ戦略・データ取得構造の見直しもセットで必要になる。

---

## 2. 決定

**Next.js 16 の `unstable_instant` を公開ページの主要ルートに適用し、それに必要な `cacheComponents: true` の有効化 + 段階的な `'use cache'` 化を受け入れる。**

### 2-1. 適用範囲

| ルート種別                           | 設定                                                                          |
| ------------------------------------ | ----------------------------------------------------------------------------- |
| 公開ページ（`app/(site)/**`）        | `unstable_instant = { prefetch: 'static', unstable_disableValidation: true }` |
| 管理画面（`app/admin/**`）           | `unstable_instant = false`                                                    |
| 認証系（`app/auth/**`）              | `unstable_instant = false`                                                    |
| マイページ（`app/(site)/mypage/**`） | layout レベルで `unstable_instant = false`                                    |

`unstable_disableValidation: true` は、公開ページ間で共有される layout が cookies を読むケース（例: ヘッダの認証状態表示）を許容するために付与している。厳密な runtime samples の設計は将来のパフォーマンス問題が顕在化した時に別チケットで再着手する方針。

### 2-2. セット施策

- `next.config.ts` に `cacheComponents: true` を追加
- 各ページの `dynamic = 'force-dynamic'` / `revalidate = N` を撤去
- 公開ページのデータ取得を `loadXxxBundle(id) { 'use cache'; cacheLife(...); cacheTag(...); ... }` パターンに集約
- キャッシュ破棄は `lib/cacheTags.ts` に集約したタグ設計 + Server Actions からの `updateTag()`

### 2-3. 回帰検知

`unstable_instant` は静的シェル生成に依存するため、`<Suspense>` 境界の設計を崩すと即座にシェルが空白化する。E2E で「一覧 → 詳細」の 2 ルート（`/spots → /spots/[id]` / `/flowers → /flowers/[id]`）を Playwright + `@next/playwright` の `instant()` ヘルパで最低限カバーする（`e2e/instant-navigation.spec.ts`）。

MVP 段階でこれ以上の E2E は書かない（Next.js 公式も "There is no need to write an `instant()` test for every navigation" と明言している）。

---

## 3. 結果

### 3-1. 得られたもの

- **主要動線の遷移が体感で即時**: `/spots → /spots/[id]` などのクリック → シェル表示が同フレーム
- **サーバー生成回数の削減**: `cacheComponents` の効果で `/spots` へのボットトラフィックが CPU 実行時間に直結しなくなった。Netlify Functions コストの上限リスクが下がった
- **Lighthouse Performance / SEO スコア 80+**: ホーム・スポット詳細・花詳細で達成（2026-06-07）
- **キャッシュタグ設計の集約**: `lib/cacheTags.ts` に一元化されたことで、admin の編集操作 → 公開ページ即時反映のフローが明示的になった

### 3-2. トレードオフ

| 項目                               | 内容                                                                                                |
| ---------------------------------- | --------------------------------------------------------------------------------------------------- |
| **API が `unstable`**              | Next.js の minor バージョンアップで挙動・API が変わりうる。追従コストが継続的に発生                 |
| **リファクタ影響範囲が広い**       | `cacheComponents` は `unstable_instant` を付けないページも含めて全 page/layout/route handler が対象 |
| **cookies/headers 直 read の制約** | Server Component 直下で cookies を読むと prerender が拒否される。Suspense 内へ押し下げる必要        |
| **rollout の分割**                 | 1 PR で完結せず、`cacheComponents` 有効化前後で 5 段階に分けて安全に移行する必要があった            |
| **キャッシュの鮮度管理**           | `'use cache'` はサーバー起動中の in-memory。デプロイ間で揺らぐため、永続鮮度は `updateTag` で明示   |

### 3-3. 移行に必要だった作業

段階を追ってしか安全に有効化できなかったため、`docs/22_instant-navigation.md` に記録した Step 1〜5 の順で PR を分割した。特に Step 4（`cacheComponents: true` 有効化）で全ページの build エラーを一度に潰す局面が発生した。

- Step 1: 共通基盤（`SiteFooter` の Client 分離・admin/auth の Suspense 化）
- Step 2: 公開ページの Suspense + `'use cache'` 化
- Step 3: Route Handler の dynamic 化
- Step 4: `cacheComponents` 有効化
- Step 5: `unstable_instant` 適用 + E2E 導入

---

## 4. 検討した代替案

### 案 A: `<Suspense>` の追加のみで完結させる

**却下理由**: CLAUDE.md「重要：技術スタックのバージョン」冒頭にある通り、Next.js 16.2.4 では `Suspense` 単独では静的シェルのプリフェッチが効かず、遷移遅延が解消しない。公式ガイドが `unstable_instant` の付与を明示的に要求している。

### 案 B: クライアントサイド SPA 化（`'use client'` トップ）

**却下理由**:

- SEO 要件（Lighthouse SEO 80+ / 検索経由の流入）を満たすため SSR を維持する必要がある
- Server Component + Server Actions によるデータ取得の一貫性が失われる
- 画像 CDN や ISR の恩恵を放棄することになる

### 案 C: View Transitions API のみで対応

**却下理由**: View Transitions は「遷移中のアニメーション」を提供するが「遷移前のシェルプリフェッチ」は解決しない。空白時間を隠す視覚的トリックにはなるが、根本の LCP/TTFB は改善しない。Instant Navigation と補完関係にあるが代替にはならない。

### 案 D: `force-dynamic` を維持しつつ CDN で頑張る

**却下理由**: Netlify の Fluid Active CPU 実行時間がボットトラフィックで膨らみ、月次コスト上限に触れるリスクがある。CDN Cache-Control でボット由来リクエストを吸収する案も検討したが、admin による編集の即時反映と両立が難しかった（キャッシュヒット中に古いデータが返る）。`cacheComponents` + `updateTag` の即時破棄モデルの方が要件に合う。

---

## 5. 参考

- `docs/22_instant-navigation.md` — 実装チケット（Step 1〜5 の詳細・E2E 導入・PR 分割方針）
- `node_modules/next/dist/docs/01-app/02-guides/instant-navigation.mdx` — Next.js 公式ガイド
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/instant.md` — API リファレンス
- `docs/specs/nextjs-conventions.md` — Server / Client 境界と `<Link>` プリフェッチ規約
- `e2e/instant-navigation.spec.ts` — 一覧 ↔ 詳細の Instant Nav 回帰検知
- `lib/cacheTags.ts` — キャッシュタグ集約
