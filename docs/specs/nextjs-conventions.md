# Next.js App Router 規約

このプロジェクトでは **App Router 規約を厳守する**。古い Pages Router 流の書き方（`getServerSideProps` / `getStaticProps` / `_app.tsx` / `pages/api/*`）は使用しない。実装前に確信が持てない場合は `node_modules/next/dist/docs/01-app/` の該当ガイドを読んでから書くこと。

> 動的ルートのパラメータは Next.js 15+ で **`params: Promise<{...}>`** に変わった。`const { id } = await params;` で取り出す（`searchParams` も同様）。

## 1. Server Components をデフォルトに

- **`'use client'` を書かない限り全てのコンポーネントは Server Component**。データ取得・DB アクセス・秘密情報の利用はサーバー側で完結させる。
- `'use client'` を付けるのは **ブラウザ API・状態フック・イベントハンドラが必要な葉のコンポーネントのみ**。親レイアウトや一覧ページ全体に `'use client'` を付けない。
- Client Component が必要な場合は **Client 境界をできるだけ末端に押し下げる**。例：検索ページ全体は Server Component のまま、絞り込みフォームのインタラクション部分だけを Client Component に切り出す。
- Client Component に Server Component を **`children` props として渡す** パターンを活用する（Server Component 内で `import` して JSX で挿入することはできない）。

## 2. データ取得は Server Component で async/await

- ページ・レイアウト・Server Component 内で **直接 `async` 関数として書き、`await` でデータを取る**。`useEffect` + `fetch` でクライアントから取りに行かない。
- Supabase は **`lib/supabase/server.ts`** をサーバー側で、**`lib/supabase/client.ts`** を Client Component でのみ使う。Server Component で Client 用クライアントを使わない。
- **並列化**：独立した取得は `Promise.all` でまとめる。逐次 `await` のウォーターフォールを作らない。
- **重複呼び出しの抑制**：同一リクエスト内で同じデータを複数コンポーネントから取りたい場合は `React.cache()` でメモ化する。

## 3. Mutation は Server Actions または Route Handler

- フォーム送信・データ更新は原則 **Server Actions（`'use server'`）** を第一選択にする。`useState` でフォーム状態を持って `fetch` を投げる構成は避ける。
- 外部からの呼び出し（AI 判定 API、Webhook、外部連携）や、明確に REST 的な公開 API が必要なものは **Route Handler**（`app/api/**/route.ts`）で実装する。
- Server Action 後の再取得は **`revalidatePath` / `revalidateTag`** で行う。`router.refresh()` の連発でしのがない。

## 4. キャッシュとレンダリング戦略

- **キャッシュ動作は明示的に決める**。Server Component 内の Supabase クエリは原則動的（`dynamic = 'force-dynamic'` 相当）になりやすい。静的化したい一覧（花マスター等）は明示的に `revalidate` を設定する。
- `fetch` を直接使う場合は `cache: 'force-cache'` / `next: { revalidate: N, tags: [...] }` を意識して指定する。**「とりあえずデフォルト」で書かない**。
- ユーザー固有データ（`/mypage/*`）は静的化しない。動的レンダリングであることを意識する。

## 5. ローディング・エラー・Not Found

- 各ルートセグメントに **`loading.tsx`** を置いてストリーミング SSR を効かせる。スポット詳細・検索結果・AI 判定結果など重い処理が走るページでは必須。
- データ取得エラーは **`error.tsx`** で境界を作る。`try/catch` で握りつぶして空配列を返す実装はしない（管理画面では特に）。
- データが見つからない場合は **`notFound()`** を呼んで `not-found.tsx` を表示する。`redirect('/')` で隠さない。
- 部分的な遅延が許せる場合は **`<Suspense>`** で個別にラップしてプログレッシブにレンダリングする。

## 6. メタデータと SEO

- 静的メタデータは `export const metadata`、動的なものは **`generateMetadata`** を使う。`<Head>` を直接書かない（App Router では使わない）。
- 共通の OGP・タイトルテンプレートは `app/layout.tsx` の `metadata` で定義し、各ページで上書きする。
- `sitemap.ts` / `robots.ts` / `opengraph-image.tsx` などの Metadata Files 規約を使う。手書きで `public/sitemap.xml` を置かない。

## 7. ファイル規約とディレクトリ

- ルーティングに使うファイル名は **`page.tsx` / `layout.tsx` / `loading.tsx` / `error.tsx` / `not-found.tsx` / `route.ts` / `template.tsx`** に限定する。それ以外の名前で同等の挙動を期待しない。
- 共有コンポーネントは `components/`、サーバー専用ユーティリティは `lib/` に置く。**`app/` 配下に `page.tsx` 等の規約外ファイルを置かない**（`@/components/...` に切り出す）。
- Route Group `(group)` や Private Folder `_folder` を意図的に使い分ける。URL に出したくない構造化のためのフォルダは `_` プレフィックスを付ける。
- 動的ルートのパラメータは Next.js 15+ で **`params: Promise<{...}>`** に変わった。`const { id } = await params;` で取り出すこと。`searchParams` も同様。

## 8. ナビゲーション・画像・リンク

- 内部リンクは必ず **`next/link` の `<Link>`**。`<a href>` でハードナビゲーションしない（プリフェッチが効かない）。
- 画像は **`next/image` の `<Image>`** を使う。`width` / `height` または `fill` を必ず指定し、`alt` は `images.caption` を反映する。`<img>` 直書きは Canvas API での合成等、`next/image` が使えない箇所のみ。
- `useRouter` は `next/navigation` から import する（`next/router` は Pages Router 用なので使わない）。

## 9. URL 検索パラメータを状態として活用

- 一覧の絞り込み（都道府県・花種類・月）は **URL の `searchParams` に持たせる**。`useState` でクライアント状態として持たない（共有・SEO・戻るボタン挙動のために必須）。
- Server Component でそのまま `searchParams` を読み、SQL に流す。クライアント側で再フェッチしない。

## 10. 環境変数とセキュリティ境界

- ブラウザに露出してよいものだけ **`NEXT_PUBLIC_`** プレフィックスを付ける。`SUPABASE_SERVICE_ROLE_KEY` 等は **絶対に Client Component や `NEXT_PUBLIC_` で参照しない**。
- Service Role キーを使う処理は **Route Handler または Server Action 内**に閉じ込める。Server Component から直接呼ぶ場合も RLS をバイパスする自覚を持って使う。

## 11. やりがちな NG パターン

| NG                                                                | 正しいやり方                                                                     |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| ページ全体に `'use client'` を付けてから `useEffect` でデータ取得 | Server Component で `async/await` 取得、Client は末端のみ                        |
| `getServerSideProps` / `getStaticProps` を書く                    | App Router では存在しない。`generateStaticParams` / Server Component で取得      |
| `pages/api/*` に API を書く                                       | `app/api/**/route.ts` の Route Handler を使う                                    |
| `_app.tsx` / `_document.tsx` でプロバイダ設定                     | `app/layout.tsx` に書く。Provider が Client 必須なら Client Component に切り出す |
| `<Head>` で title/meta を設定                                     | `metadata` / `generateMetadata` を使う                                           |
| `<a href="/spots">` で内部遷移                                    | `<Link href="/spots">` を使う                                                    |
| `params.id` を同期的に参照                                        | `const { id } = await params;`（Next.js 15+）                                    |
| `fetch` のキャッシュ指定なしで書きっぱなし                        | `cache` / `next.revalidate` / `next.tags` を明示する                             |
| Server Action 後に `router.refresh()` で更新                      | `revalidatePath` / `revalidateTag` を使う                                        |
| Client Component から Server Component を `import` して描画       | `children` として Client に渡すか、Server Component 側で組み立てる               |

迷ったら `node_modules/next/dist/docs/01-app/` の該当ガイドを必ず読んでから書く。
