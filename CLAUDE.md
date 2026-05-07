# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

このファイルは **規約集** に絞っている。プロダクト仕様・URL 設計・DB スキーマ・実装サンプルなどは `docs/` 配下に分割してあるので、必要なときに該当ファイルを読むこと。

## コマンド

```bash
npm run dev      # 開発サーバー起動 (localhost:3000)
npm run build    # プロダクションビルド
npm run lint     # ESLint実行
```

テストフレームワークは未設定。

## 重要：Next.jsバージョンについて

このプロジェクトは **Next.js 16.2.4 + React 19.2.4** を使用している。学習データより新しいバージョンのため、API・規約・ファイル構造が異なる可能性がある。**Next.js固有のコードを書く前に `node_modules/next/dist/docs/` の該当ガイドを必ず読むこと。**

重要なAIエージェント向けヒント：クライアントサイドナビゲーションが遅い場合、`Suspense`だけでは不十分。ルートから `unstable_instant` もエクスポートする必要がある。`node_modules/next/dist/docs/01-app/02-guides/instant-navigation.mdx` を参照。

---

## ドキュメント構造

実装作業は **チケット駆動**。`docs/` のチケット → 該当 spec を読む → 実装、の順で進める。仕様変更は spec 側を先に直し、CLAUDE.md（規約）には触らない。

### `docs/`（チケット）

進捗管理用。各ファイル先頭に `[ ]` の TODO チェックリストがあり、完了したら `[x]` に書き換える。

- `docs/00_overview.md` — 全チケットの INDEX
- `docs/NN_*.md` — 機能・画面単位のチケット（21 本）

### `docs/specs/`（仕様）

実装時に詳細を確認する詳細仕様。チケットの「参考」セクションから辿る。

| ファイル                                              | 内容                                                                 |
| ----------------------------------------------------- | -------------------------------------------------------------------- |
| [`product.md`](./docs/specs/product.md)               | プロダクト概要・機能一覧（F-01〜F-12）                               |
| [`tech-stack.md`](./docs/specs/tech-stack.md)         | 技術スタック・想定コスト・環境変数・ディレクトリ構成                 |
| [`pages.md`](./docs/specs/pages.md)                   | ページ構成・URL 設計・認証ルール                                     |
| [`api.md`](./docs/specs/api.md)                       | Route Handler 一覧（ユーザー向け / 管理者向け）                      |
| [`database.md`](./docs/specs/database.md)             | テーブル定義・RLS・トリガー・インデックス                            |
| [`ai-identify.md`](./docs/specs/ai-identify.md)       | Gemini API 呼び出し・3 段階フォールバックマッチング・UI              |
| [`story-card.md`](./docs/specs/story-card.md)         | Canvas API でのしおり生成                                            |
| [`data-collector.md`](./docs/specs/data-collector.md) | Python スクレイパー 5 本（scrape→normalize→geocode→validate→upload） |
| [`seo.md`](./docs/specs/seo.md)                       | メタデータ・sitemap・robots・JSON-LD                                 |
| [`operations.md`](./docs/specs/operations.md)         | オーバーツーリズム対策・コスト管理・技術的懸念点・ローンチチェック   |
| [`roadmap.md`](./docs/specs/roadmap.md)               | 4 週間ロードマップ・v2 拡張・未確定事項                              |
| [`design.md`](./docs/specs/design.md)                 | デザイン規約（トークン・画面パターン・やらないこと）                 |

### この CLAUDE.md（規約）

毎回ロードされる。**全コミットで必ず守るべきルール** だけを置く：

1. Next.js App Router ベストプラクティス
2. Supabase Auth（App Router）実装ルール
3. プロジェクト共通規約（論理削除・整合性・コスト・セキュリティ境界）

---

## Next.js App Router ベストプラクティス（必読）

このプロジェクトでは **App Router 規約を厳守する**。古い Pages Router 流の書き方（`getServerSideProps` / `getStaticProps` / `_app.tsx` / `pages/api/*`）は使用しない。実装前に確信が持てない場合は `node_modules/next/dist/docs/` の該当ガイドを読んでから書くこと。

### 1. Server Components をデフォルトに

- **`'use client'` を書かない限り全てのコンポーネントは Server Component**。データ取得・DB アクセス・秘密情報の利用はサーバー側で完結させる。
- `'use client'` を付けるのは **ブラウザ API・状態フック・イベントハンドラが必要な葉のコンポーネントのみ**。親レイアウトや一覧ページ全体に `'use client'` を付けない。
- Client Component が必要な場合は **Client 境界をできるだけ末端に押し下げる**。例：検索ページ全体は Server Component のまま、絞り込みフォームのインタラクション部分だけを Client Component に切り出す。
- Client Component に Server Component を **`children` props として渡す** パターンを活用する（Server Component 内で `import` して JSX で挿入することはできない）。

### 2. データ取得は Server Component で async/await

- ページ・レイアウト・Server Component 内で **直接 `async` 関数として書き、`await` でデータを取る**。`useEffect` + `fetch` でクライアントから取りに行かない。
- Supabase は **`lib/supabase/server.ts`** をサーバー側で、**`lib/supabase/client.ts`** を Client Component でのみ使う。Server Component で Client 用クライアントを使わない。
- **並列化**：独立した取得は `Promise.all` でまとめる。逐次 `await` のウォーターフォールを作らない。
- **重複呼び出しの抑制**：同一リクエスト内で同じデータを複数コンポーネントから取りたい場合は `React.cache()` でメモ化する。

### 3. Mutation は Server Actions または Route Handler

- フォーム送信・データ更新は原則 **Server Actions（`'use server'`）** を第一選択にする。`useState` でフォーム状態を持って `fetch` を投げる構成は避ける。
- 外部からの呼び出し（AI 判定 API、Webhook、外部連携）や、明確に REST 的な公開 API が必要なものは **Route Handler**（`app/api/**/route.ts`）で実装する。
- Server Action 後の再取得は **`revalidatePath` / `revalidateTag`** で行う。`router.refresh()` の連発でしのがない。

### 4. キャッシュとレンダリング戦略

- **キャッシュ動作は明示的に決める**。Server Component 内の Supabase クエリは原則動的（`dynamic = 'force-dynamic'` 相当）になりやすい。静的化したい一覧（花マスター等）は明示的に `revalidate` を設定する。
- `fetch` を直接使う場合は `cache: 'force-cache'` / `next: { revalidate: N, tags: [...] }` を意識して指定する。**「とりあえずデフォルト」で書かない**。
- ユーザー固有データ（`/mypage/*`）は静的化しない。動的レンダリングであることを意識する。

### 5. ローディング・エラー・Not Found

- 各ルートセグメントに **`loading.tsx`** を置いてストリーミング SSR を効かせる。スポット詳細・検索結果・AI 判定結果など重い処理が走るページでは必須。
- データ取得エラーは **`error.tsx`** で境界を作る。`try/catch` で握りつぶして空配列を返す実装はしない（管理画面では特に）。
- データが見つからない場合は **`notFound()`** を呼んで `not-found.tsx` を表示する。`redirect('/')` で隠さない。
- 部分的な遅延が許せる場合は **`<Suspense>`** で個別にラップしてプログレッシブにレンダリングする。

### 6. メタデータと SEO

- 静的メタデータは `export const metadata`、動的なものは **`generateMetadata`** を使う。`<Head>` を直接書かない（App Router では使わない）。
- 共通の OGP・タイトルテンプレートは `app/layout.tsx` の `metadata` で定義し、各ページで上書きする。
- `sitemap.ts` / `robots.ts` / `opengraph-image.tsx` などの Metadata Files 規約を使う。手書きで `public/sitemap.xml` を置かない。

### 7. ファイル規約とディレクトリ

- ルーティングに使うファイル名は **`page.tsx` / `layout.tsx` / `loading.tsx` / `error.tsx` / `not-found.tsx` / `route.ts` / `template.tsx`** に限定する。それ以外の名前で同等の挙動を期待しない。
- 共有コンポーネントは `components/`、サーバー専用ユーティリティは `lib/` に置く。**`app/` 配下に `page.tsx` 等の規約外ファイルを置かない**（`@/components/...` に切り出す）。
- Route Group `(group)` や Private Folder `_folder` を意図的に使い分ける。URL に出したくない構造化のためのフォルダは `_` プレフィックスを付ける。
- 動的ルートのパラメータは Next.js 15+ で **`params: Promise<{...}>`** に変わった。`const { id } = await params;` で取り出すこと。`searchParams` も同様。

### 8. ナビゲーション・画像・リンク

- 内部リンクは必ず **`next/link` の `<Link>`**。`<a href>` でハードナビゲーションしない（プリフェッチが効かない）。
- 画像は **`next/image` の `<Image>`** を使う。`width` / `height` または `fill` を必ず指定し、`alt` は `images.caption` を反映する。`<img>` 直書きは Canvas API での合成等、`next/image` が使えない箇所のみ。
- `useRouter` は `next/navigation` から import する（`next/router` は Pages Router 用なので使わない）。

### 9. URL 検索パラメータを状態として活用

- 一覧の絞り込み（都道府県・花種類・月）は **URL の `searchParams` に持たせる**。`useState` でクライアント状態として持たない（共有・SEO・戻るボタン挙動のために必須）。
- Server Component でそのまま `searchParams` を読み、SQL に流す。クライアント側で再フェッチしない。

### 10. 環境変数とセキュリティ境界

- ブラウザに露出してよいものだけ **`NEXT_PUBLIC_`** プレフィックスを付ける。`SUPABASE_SERVICE_ROLE_KEY` 等は **絶対に Client Component や `NEXT_PUBLIC_` で参照しない**。
- Service Role キーを使う処理は **Route Handler または Server Action 内**に閉じ込める。Server Component から直接呼ぶ場合も RLS をバイパスする自覚を持って使う。

### 11. やりがちな NG パターン

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

---

## Supabase Auth（App Router）実装ルール

公式 Quickstart（<https://supabase.com/docs/guides/auth/quickstarts/nextjs>）と SSR ガイド（<https://supabase.com/docs/guides/auth/server-side/nextjs>）の構成を **そのまま踏襲する**。独自アレンジを加えない。

### 1. パッケージとライブラリ

- 認証ライブラリは **`@supabase/ssr`** + `@supabase/supabase-js` を使う。`@supabase/auth-helpers-nextjs` は **deprecated なので使わない**。
  ```bash
  npm install @supabase/supabase-js @supabase/ssr
  ```
- Cookie API は **必ず `getAll()` / `setAll(cookiesToSet)` ペア** を使う。古い `get` / `set` / `remove` の3メソッド形式（`@supabase/auth-helpers-nextjs` 時代の API）は **使わない**。`@supabase/ssr` で書くと型エラー or 黙ってセッション破壊が起きる。

### 2. 環境変数

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=         # 既存。legacy anon key として当面動作
# NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=  # 新方式（sb_publishable_...）。Supabase が legacy 廃止予告したら移行
SUPABASE_SERVICE_ROLE_KEY=             # サーバー専用。NEXT_PUBLIC_ プレフィックスは絶対に付けない
```

`SUPABASE_SERVICE_ROLE_KEY` は **Route Handler / Server Action / バッチスクリプト内のみで使用**。Server Component から呼ぶときも RLS をバイパスする自覚を持って使う。

### 3. ファイル構成（公式テンプレート準拠）

```
lib/supabase/
├── client.ts        # Client Component 用（createBrowserClient）
├── server.ts        # Server Component / Route Handler / Server Action 用（createServerClient + cookies()）
└── middleware.ts    # updateSession ヘルパー（middleware.ts から呼ばれる）
middleware.ts        # ルート直下。updateSession を呼ぶ
app/auth/callback/route.ts   # OAuth / Magic Link コールバック
```

### 4. `lib/supabase/client.ts`（Client Component 専用）

```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

### 5. `lib/supabase/server.ts`（Server 側専用）

```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies(); // Next.js 15+ で async

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Component から呼ばれた場合は cookies の書き込みが禁止されている。
            // Middleware 経由でセッション更新されているなら無視して良い。
          }
        },
      },
    },
  );
}
```

### 6. `lib/supabase/middleware.ts`（updateSession ヘルパー）

```typescript
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // ⚠️ createServerClient と getUser() の間に他のコードを書かない。
  //    書くとユーザーがランダムにログアウトする現象を引き起こす。
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = pathname.startsWith('/mypage') || pathname.startsWith('/admin');

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith('/admin') && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .is('deleted_at', null)
      .single();

    if (profile?.role !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  // ⚠️ 必ず supabaseResponse をそのまま返す。新しい NextResponse を作って返すと
  //    Cookie が同期されずセッションが切れる。Cookie を引き継いで新レスポンスを
  //    作る場合は myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll()) で
  //    必ずコピーすること。
  return supabaseResponse;
}
```

### 7. `middleware.ts`（ルート直下）

```typescript
import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * 以下を除く全てのパスにマッチ:
     * - _next/static, _next/image
     * - favicon.ico
     * - 画像ファイル
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

### 8. Auth Callback（`app/auth/callback/route.ts`）

OAuth / Magic Link / メール確認後にリダイレクトされる先。`code` を Session に交換する。

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`);
}
```

### 9. ログイン / サインアップは Server Action で

Client Component から `supabase.auth.signInWithPassword` を直接叩いてもいいが、Server Action にすると Cookie 同期と `revalidatePath` が綺麗に書ける。

```typescript
// app/auth/login/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function login(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  });

  if (error) {
    redirect('/auth/login?error=invalid_credentials');
  }

  revalidatePath('/', 'layout');
  redirect('/');
}
```

ログアウトも同じく Server Action（`supabase.auth.signOut()` → `revalidatePath('/', 'layout')` → `redirect('/auth/login')`）。

### 10. 絶対に守るルール（DO / DON'T）

| ✅ DO                                                                                                                                            | ❌ DON'T                                                                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| 保護されたページ・middleware では **`supabase.auth.getUser()`** を使う（毎回 Auth サーバーに JWT 検証を投げる）                                  | `supabase.auth.getSession()` をサーバー側で「ログイン判定」に使う。**Cookie は user が改ざん可能で、検証されないため信用できない** |
| `lib/supabase/server.ts` の `createClient()` は **リクエストごとに新規生成** する（モジュールスコープでキャッシュしない）                        | `const supabase = createClient()` を top-level で書いて使い回す                                                                    |
| Server Component で書き込み時の例外は **`try/catch` で握りつぶす**（cookies() が writable でないため）                                           | Server Component で setAll 失敗を上位に投げる                                                                                      |
| `updateSession` 内では `createServerClient` の直後に `getUser()` を呼び、その間に処理を挟まない                                                  | 認可チェックや DB クエリを `createServerClient` と `getUser()` の間に書く（セッション喪失バグの原因）                              |
| middleware は **`supabaseResponse` をそのまま return**。Cookie を別レスポンスに移す場合は `setAll(supabaseResponse.cookies.getAll())` で全コピー | 新しい `NextResponse.next()` を作って return（Cookie が消える）                                                                    |
| `@supabase/ssr` の **`getAll` / `setAll`** Cookie インターフェースを使う                                                                         | 古い `get` / `set` / `remove` の3メソッド形式を使う                                                                                |
| `SUPABASE_SERVICE_ROLE_KEY` は Route Handler / Server Action / バッチ内に閉じる                                                                  | Client Component で参照する／`NEXT_PUBLIC_` プレフィックスを付ける                                                                 |
| Client Component では `lib/supabase/client.ts` を、Server では `lib/supabase/server.ts` を使う                                                   | Client で `createServerClient` を import、Server で `createBrowserClient` を import                                                |

迷ったら公式 SSR ガイド（<https://supabase.com/docs/guides/auth/server-side/nextjs>）の最新版を再確認すること。

---

## プロジェクト共通規約

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

- `SUPABASE_SERVICE_ROLE_KEY` / `GEMINI_API_KEY` などサーバー秘密は **`NEXT_PUBLIC_` プレフィックスを付けない**。Client Component から import しない。
- AI 判定など外部 API 呼び出しは **必ずレート制限**（匿名 1/日、ログイン 3/日）を `ai_usage_logs` で管理。匿名 ID は `localStorage` の UUID。
- 画像はアップロード前にクライアントで **max-width 1024px、JPEG 0.8、2MB 以下にリサイズ**。同一画像（SHA-256 ハッシュ）は 24h キャッシュして API 呼び出しを抑制。
- スポットは **`is_published=false` で投入 → 管理者が出典を確認 → 公開**。`official_url` が NULL の場合は `source` 必須（オーバーツーリズム対策）。

### デザイン

UI 実装は [`docs/specs/design.md`](./docs/specs/design.md) のトークン・パターンに従う。色・角丸・フォントは `app/globals.css` の `@theme` トークン経由のみ（`bg-brand` / `text-ink` / `font-serif` / `rounded-card` 等）。Tailwind の生パレット（`bg-pink-300` 等）を本番コードに直書きしない（**例外**：花の写真がない時のグラデーション・プレースホルダーのみ可）。新しい色や画面パターンを追加する場合は、コードと `docs/specs/design.md` を**同時に更新**する。実装サンプルは `app/demo/page.tsx`。

### 命名・規約

- 管理者ロール判定は `profiles.role === 'admin'`。Route Handler では共通ユーティリティ `lib/utils/requireAdmin.ts` を使う。
- 月またぎの見頃判定は `lib/utils/seasonUtils.ts` の `isInBestSeason()` を使う（直接書かない）。
- NG ワード辞書は `lib/ng-words.ts`。バージョン管理し、すり抜けたものは管理者画面から手動論理削除。

### 実装フロー

1. `docs/00_overview.md` で対象チケット番号を確認
2. チケットファイル（例：`docs/05_top-page.md`）を開いて TODO と「参考」リンクを確認
3. 「参考」の `docs/specs/*.md` を読んで詳細仕様を把握
4. 実装 → TODO を `[x]` に更新
5. 仕様の不整合に気付いたら **specs を先に直してから** 実装する（CLAUDE.md には触らない）
