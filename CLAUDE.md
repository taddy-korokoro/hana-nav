# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
- 外部からの呼び出し（AI 判定 API、Webhook、外部連携）や、明確に REST 的な公開 API が必要なものは **Route Handler（`app/api/**/route.ts`）** で実装する。
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

| NG | 正しいやり方 |
|---|---|
| ページ全体に `'use client'` を付けてから `useEffect` でデータ取得 | Server Component で `async/await` 取得、Client は末端のみ |
| `getServerSideProps` / `getStaticProps` を書く | App Router では存在しない。`generateStaticParams` / Server Component で取得 |
| `pages/api/*` に API を書く | `app/api/**/route.ts` の Route Handler を使う |
| `_app.tsx` / `_document.tsx` でプロバイダ設定 | `app/layout.tsx` に書く。Provider が Client 必須なら Client Component に切り出す |
| `<Head>` で title/meta を設定 | `metadata` / `generateMetadata` を使う |
| `<a href="/spots">` で内部遷移 | `<Link href="/spots">` を使う |
| `params.id` を同期的に参照 | `const { id } = await params;`（Next.js 15+） |
| `fetch` のキャッシュ指定なしで書きっぱなし | `cache` / `next.revalidate` / `next.tags` を明示する |
| Server Action 後に `router.refresh()` で更新 | `revalidatePath` / `revalidateTag` を使う |
| Client Component から Server Component を `import` して描画 | `children` として Client に渡すか、Server Component 側で組み立てる |

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
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### 5. `lib/supabase/server.ts`（Server 側専用）

```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();   // Next.js 15+ で async

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
    }
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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // ⚠️ createServerClient と getUser() の間に他のコードを書かない。
  //    書くとユーザーがランダムにログアウトする現象を引き起こす。
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected =
    pathname.startsWith('/mypage') || pathname.startsWith('/admin');

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

| ✅ DO | ❌ DON'T |
|---|---|
| 保護されたページ・middleware では **`supabase.auth.getUser()`** を使う（毎回 Auth サーバーに JWT 検証を投げる） | `supabase.auth.getSession()` をサーバー側で「ログイン判定」に使う。**Cookie は user が改ざん可能で、検証されないため信用できない** |
| `lib/supabase/server.ts` の `createClient()` は **リクエストごとに新規生成** する（モジュールスコープでキャッシュしない） | `const supabase = createClient()` を top-level で書いて使い回す |
| Server Component で書き込み時の例外は **`try/catch` で握りつぶす**（cookies() が writable でないため） | Server Component で setAll 失敗を上位に投げる |
| `updateSession` 内では `createServerClient` の直後に `getUser()` を呼び、その間に処理を挟まない | 認可チェックや DB クエリを `createServerClient` と `getUser()` の間に書く（セッション喪失バグの原因） |
| middleware は **`supabaseResponse` をそのまま return**。Cookie を別レスポンスに移す場合は `setAll(supabaseResponse.cookies.getAll())` で全コピー | 新しい `NextResponse.next()` を作って return（Cookie が消える） |
| `@supabase/ssr` の **`getAll` / `setAll`** Cookie インターフェースを使う | 古い `get` / `set` / `remove` の3メソッド形式を使う |
| `SUPABASE_SERVICE_ROLE_KEY` は Route Handler / Server Action / バッチ内に閉じる | Client Component で参照する／`NEXT_PUBLIC_` プレフィックスを付ける |
| Client Component では `lib/supabase/client.ts` を、Server では `lib/supabase/server.ts` を使う | Client で `createServerClient` を import、Server で `createBrowserClient` を import |

迷ったら公式 SSR ガイド（<https://supabase.com/docs/guides/auth/server-side/nextjs>）の最新版を再確認すること。

---

## 1. プロダクト概要

**hana nav（花ナビ）** — 「いつ・どこで・何が咲いているか」が一目でわかる花畑スポット検索サービス。

**ターゲット**: 国内旅行中・旅行計画中のファミリー層、花好きな人

**コア価値提案**:
1. 見頃カレンダー × 地図検索で「今どこに行けば花が見られるか」が分かる
2. AI植物判定 → 旅のしおり画像生成 → SNS共有（競合との差別化）
3. 公式情報ベースで安心して訪問できる

---

## 2. 機能一覧

### MUST（MVP必須）

| ID | 機能 | 概要 |
|---|---|---|
| F-01 | トップページ（見頃マップ × 検索UI） | |
| F-02 | スポット検索（エリア/花種類/見頃月） | |
| F-03 | スポット詳細（地図、花、レビュー、地図ピン） | spots, images, spot_flowers, flowers, reviews |
| F-04 | 見頃カレンダー（今月/来月の絞り込み） | トップで「今見頃」を表示 |
| F-05 | AI植物判定（画像アップ→花の種類・特徴を提示） | Gemini API、PictureThis風UX |
| F-06 | 旅のしおり画像生成（縦長1枚画像、SNS投稿対応） | Canvas APIでクライアント合成、Web Share APIでSNS連携 |
| F-07 | レート制限（匿名1/日、ログイン3/日） | ai_usage_logsテーブルでカウント管理 |
| F-08 | Supabase Auth（メール+Googleログイン） | |
| F-09 | ブックマーク（行きたいリスト） | ログインユーザー限定 |

### WANT（時間あれば実装）

| ID | 機能 | 概要 |
|---|---|---|
| F-10 | 簡易レビュー（★+一言コメント） | ログインユーザー限定 |
| F-11 | 動画リワード広告でAI追加利用 | Google AdSense Reward |
| F-12 | アフィリエイトリンク埋め込み | スポット詳細ページに楽天トラベル等のリンク |

---

## 3. 技術スタック

```
フロントエンド: Next.js 16.2.4 (App Router) + TypeScript + Tailwind CSS v4
UIライブラリ:   shadcn/ui（Radix UIベース）
状態管理:       React Server Components + URL検索パラメータ
データベース:   Supabase (PostgreSQL + PostGIS拡張)
認証:           Supabase Auth (Email + Google OAuth)
ストレージ:     Supabase Storage（画像アップロード）
ホスティング:   Vercel
AI:             Google Gemini API (gemini-2.5-flash)
地図:           Google Maps JavaScript API
画像合成:       Canvas API（クライアントサイド）
```

Tailwind CSS v4 は `@tailwindcss/postcss` 経由。`tailwind.config.*` ファイルは存在せず設定はCSS内。フォントは `next/font/google`（Geist Sans / Geist Mono）でCSS変数として読み込む。

### 想定月額コスト（MAU 5,000想定）

| サービス | プラン | 月額 |
|---|---|---|
| Vercel | Hobby（無料）→ Proで$20 | ¥0〜3,000 |
| Supabase | Free（500MB）→ Proで$25 | ¥0〜3,800 |
| Gemini API | gemini-2.5-flash 従量課金 | ¥3,000〜10,000 |
| Google Maps | 従量課金（$200/月無料枠） | ¥0〜5,000 |
| **合計** | | **¥3,000〜21,800** |

### 環境変数（`.env.local`）

```bash
GEMINI_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

---

## 4. ページ構成・URL設計

URL = ファイル構造で表現。認証保護は Next.js Middleware + Supabase Auth + RLS の3層で実施。

### 4.1 認証ルール

| ページ種別 | アクセス可能な権限 | 未ログイン時の挙動 |
|---|---|---|
| 公開ページ | 全員（匿名OK） | アクセス可能 |
| ログインユーザー専用 | ログイン済み（user / admin） | `/auth/login` へリダイレクト |
| 管理者専用 | admin のみ | `/auth/login` へリダイレクト |

管理者判定は `profiles.role = 'admin'` で行う。初期管理者は Supabase Dashboard から手動付与：
```sql
UPDATE profiles SET role = 'admin' WHERE id = '...';
```

### 4.2 公開ページ一覧

| 画面名 | URL | 概要 | 主な使用テーブル |
|---|---|---|---|
| トップ | `/` | 見頃マップ、花の種類検索 | spots, flowers, prefectures |
| スポット検索 | `/spots` | 絞り込み検索 | spots, flowers, prefectures, images |
| スポット詳細 | `/spots/[id]` | 地図、花、レビュー、地図ピン | spots, images, spot_flowers, flowers, reviews |
| エリア別一覧 | `/areas/[prefecture_id]` | 都道府県ごとのスポット一覧 | spots, prefectures |
| 花の種類一覧 | `/flowers` | 全花種類の一覧（50音順） | flowers, images |
| 花の詳細 | `/flowers/[id]` | 花の特徴、花言葉、見頃時期、その花が見られるスポット | flowers, images, spots, spot_flowers |
| AI花判定 | `/identify` | カメラ起動 or 画像選択で花を判定する入口画面 | ai_usage_logs |
| AI判定結果 | `/identify/result` | 判定結果表示（PictureThis風UI）、関連スポット | flowers, images, spots, spot_flowers, ai_usage_logs |
| 旅のしおり生成 | `/identify/story` | Canvas APIで縦長画像を生成 → SNSシェア | クライアント完結 |
| 利用規約 | `/terms` | 静的ページ | - |
| プライバシーポリシー | `/privacy` | 静的ページ | - |
| 特定商取引法など | `/legal` | 静的ページ | - |

### 4.3 認証ページ一覧

| 画面名 | URL |
|---|---|
| ログイン | `/auth/login` |
| 会員登録 | `/auth/signup` |
| パスワードリセット申請 | `/auth/reset-password` |
| パスワード更新 | `/auth/update-password` |
| OAuthコールバック | `/auth/callback`（Route Handler） |
| ログアウト | `/auth/logout`（POST、UIはボタン） |

### 4.4 ログインユーザー専用ページ

| 画面名 | URL | 概要 | 主な使用テーブル |
|---|---|---|---|
| マイページ | `/mypage` | プロフィール、ブックマーク・レビューへの導線 | profiles |
| プロフィール編集 | `/mypage/profile` | username, avatar 編集 | profiles |
| ブックマーク一覧 | `/mypage/bookmarks` | 自分の行きたいリスト | bookmarks, spots, images |
| 自分のレビュー一覧 | `/mypage/reviews` | 自分が書いたレビューの一覧・編集 | reviews, spots |

### 4.5 管理者専用ページ（`/admin/*`）

全ページ admin ロール必須。Next.js Middleware で認証・権限チェック。

| 画面名 | URL | 概要 | 主な使用テーブル |
|---|---|---|---|
| 管理ダッシュボード | `/admin` | 公開待ちスポット数、AI利用状況など | spots, ai_usage_logs |
| スポット一覧 | `/admin/spots` | 全スポット（未公開含む）一覧 | spots, prefectures |
| スポット新規作成 | `/admin/spots/new` | 手動でスポットを作成 | spots, images |
| 公開待ちスポット | `/admin/spots/pending` | is_published=false の一覧 | spots |
| スポット詳細・編集 | `/admin/spots/[id]` | 出典を確認して公開 | spots, images |
| 花マスター管理 | `/admin/flowers` | 花の追加・編集・画像登録 | flowers, images |
| 花マスター詳細・編集 | `/admin/flowers/[id]` | 花情報・画像の編集 | flowers, images |
| ユーザー管理 | `/admin/users` | ユーザー一覧、role変更（user ⇄ admin） | profiles |
| ユーザー詳細 | `/admin/users/[id]` | ユーザー詳細、レビュー履歴、BAN（論理削除） | profiles, reviews, bookmarks |
| レビュー管理 | `/admin/reviews` | 全レビュー一覧、不適切レビューの論理削除 | reviews, profiles, spots |
| AI利用ログ | `/admin/ai-usage` | 日別/月別のAI利用回数、コスト推計 | ai_usage_logs |
| 画像管理 | `/admin/images` | 画像一覧・差し替え・論理削除 | images |

---

## 5. APIエンドポイント

### 5.1 ユーザー向け

Route Handlers として `app/api/*/route.ts` に実装。認証が必要なエンドポイントは `getUser()` で確認。

| メソッド | エンドポイント | 概要 | 認証 |
|---|---|---|---|
| GET | `/api/spots` | スポット一覧（クエリで絞り込み: prefecture, flower, month） | 不要 |
| GET | `/api/spots/[id]` | スポット詳細 | 不要 |
| GET | `/api/flowers` | 花マスター一覧 | 不要 |
| GET | `/api/flowers/[id]` | 花の詳細 | 不要 |
| GET | `/api/prefectures` | 都道府県マスター（地方区分でグループ化可） | 不要 |
| POST | `/api/ai/identify-flower` | AI花判定（画像送信→花情報+関連スポット返却） | 不要（レート制限あり） |
| POST | `/api/bookmarks` | ブックマーク追加 | 必要 |
| DELETE | `/api/bookmarks/[spot_id]` | ブックマーク削除（論理削除） | 必要 |
| GET | `/api/me/bookmarks` | 自分のブックマーク一覧 | 必要 |
| PATCH | `/api/me/profile` | プロフィール更新 | 必要 |

### 5.2 管理者向け

全エンドポイントで `getUser()` → `profiles.role === 'admin'` のチェックを共通ユーティリティ `requireAdmin()` で行う。

| メソッド | エンドポイント | 概要 |
|---|---|---|
| GET | `/api/admin/spots` | 全スポット（未公開含む）一覧 |
| POST | `/api/admin/spots` | スポット新規作成 |
| PATCH | `/api/admin/spots/[id]` | スポット更新・公開フラグ変更 |
| GET | `/api/admin/flowers` | 花マスター一覧 |
| POST | `/api/admin/flowers` | 花マスター新規作成 |
| PATCH | `/api/admin/flowers/[id]` | 花マスター更新 |
| GET | `/api/admin/users` | ユーザー一覧 |
| PATCH | `/api/admin/users/[id]` | ユーザー role 変更等 |
| GET | `/api/admin/reviews` | 全レビュー（管理用） |
| DELETE | `/api/admin/reviews/[id]` | レビュー強制論理削除 |
| GET | `/api/admin/ai-usage/stats` | AI利用状況の集計 |

---

## 6. ディレクトリ構成

```
app/
├── layout.tsx
├── page.tsx                           # トップ（/）
├── spots/
│   ├── page.tsx
│   └── [id]/page.tsx
├── areas/[prefecture_id]/page.tsx
├── flowers/
│   ├── page.tsx
│   └── [id]/page.tsx
├── identify/
│   ├── page.tsx
│   ├── result/page.tsx
│   └── story/page.tsx
├── mypage/
│   ├── page.tsx
│   ├── profile/page.tsx
│   ├── bookmarks/page.tsx
│   └── reviews/page.tsx
├── auth/
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── reset-password/page.tsx
│   ├── update-password/page.tsx
│   └── callback/route.ts
├── admin/
│   ├── layout.tsx                     # admin専用レイアウト（権限チェック含む）
│   ├── page.tsx
│   ├── spots/
│   │   ├── page.tsx
│   │   ├── new/page.tsx
│   │   ├── pending/page.tsx
│   │   └── [id]/page.tsx
│   ├── flowers/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── users/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── reviews/page.tsx
│   ├── ai-usage/page.tsx
│   └── images/page.tsx
├── api/
│   ├── spots/route.ts
│   ├── spots/[id]/route.ts
│   ├── flowers/route.ts
│   ├── flowers/[id]/route.ts
│   ├── prefectures/route.ts
│   ├── ai/identify-flower/route.ts
│   ├── bookmarks/route.ts
│   ├── bookmarks/[spot_id]/route.ts
│   ├── me/bookmarks/route.ts
│   ├── me/profile/route.ts
│   └── admin/
│       ├── spots/route.ts
│       ├── flowers/route.ts
│       ├── users/route.ts
│       ├── reviews/route.ts
│       └── ai-usage/stats/route.ts
├── terms/page.tsx
├── privacy/page.tsx
└── legal/page.tsx
middleware.ts
lib/
├── ng-words.ts                        # NGワード辞書（バージョン管理）
├── supabase/
│   ├── client.ts                      # クライアントサイド用
│   └── server.ts                      # サーバーサイド用
└── utils/
    ├── seasonUtils.ts                 # 見頃判定ヘルパー
    ├── imageValidator.ts              # 多態関連の整合性バリデーション
    └── requireAdmin.ts               # 管理者権限チェック共通ユーティリティ
components/
└── StoryCardGenerator.tsx
data_collector/                        # 初期データ投入用Pythonスクリプト
├── requirements.txt
├── .env
├── config/
│   ├── sources.yaml
│   └── prefecture_map.py
├── scripts/
│   ├── 01_scrape.py
│   ├── 02_normalize.py
│   ├── 03_geocode.py
│   ├── 04_validate.py
│   └── 05_upload.py
└── output/
    ├── raw_data.json
    └── normalized_data.json
```

---

## 7. Middleware（認証・権限チェック）

実装は **「Supabase Auth（App Router）実装ルール」セクション** の `lib/supabase/middleware.ts` (`updateSession`) と `middleware.ts` を参照。

ポイント：

- `middleware.ts` 直下では `updateSession(request)` を呼ぶだけにし、保護ロジックは `updateSession` 内に集約する。
- Cookie API は `@supabase/ssr` の **`getAll` / `setAll`** を使う（旧 `get/set/remove` は非推奨）。
- `createServerClient` 直後に `supabase.auth.getUser()` を呼び、その間に処理を挟まない。
- API Route（`app/api/**`）は middleware で保護せず、各 Route Handler 内で `createClient()` → `getUser()` → 必要なら `requireAdmin()` で個別保護する。
- matcher は静的アセットを除外する広めパターン（`/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)`）にしておくと、トークンリフレッシュが全リクエストで動く。

---

## 8. データベース設計

### 8.1 全テーブル共通ルール

- **論理削除**：物理削除は行わない。`deleted_at TIMESTAMPTZ DEFAULT NULL` で管理。有効データは `deleted_at IS NULL` のみ。
- **全クエリで `WHERE deleted_at IS NULL` を必須とする**。
- `updated_at` は共通トリガーで自動更新。

```sql
-- 共通関数
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 8.2 ER図

```
prefectures (47件固定マスター)
   ↑
   │ (FK)
spots ──────────────────────────────────────────────
   │                                                │
   ├──< spot_flowers >── flowers ──< flower_aliases │
   │                        │                       │
   ├──< images (spot用)     ├──< images (flower用)  │
   │                                                │
   ├──< bookmarks >── profiles ────────────────────┘
   │                     │
   ├──< reviews          └──< ai_usage_logs
```

### 8.3 テーブル定義

#### `prefectures`

都道府県マスター。47件固定。アプリからは変更しない。

```sql
CREATE TABLE prefectures (
  id SMALLINT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  region TEXT NOT NULL,
  display_order SMALLINT NOT NULL
);

INSERT INTO prefectures (id, name, region, display_order) VALUES
  (1, '北海道', '北海道', 1),
  (2, '青森県', '東北', 2),
  (3, '岩手県', '東北', 3),
  (4, '宮城県', '東北', 4),
  (5, '秋田県', '東北', 5),
  (6, '山形県', '東北', 6),
  (7, '福島県', '東北', 7),
  (8, '茨城県', '関東', 8),
  (9, '栃木県', '関東', 9),
  (10, '群馬県', '関東', 10),
  (11, '埼玉県', '関東', 11),
  (12, '千葉県', '関東', 12),
  (13, '東京都', '関東', 13),
  (14, '神奈川県', '関東', 14),
  (15, '新潟県', '中部', 15),
  (16, '富山県', '中部', 16),
  (17, '石川県', '中部', 17),
  (18, '福井県', '中部', 18),
  (19, '山梨県', '中部', 19),
  (20, '長野県', '中部', 20),
  (21, '岐阜県', '中部', 21),
  (22, '静岡県', '中部', 22),
  (23, '愛知県', '中部', 23),
  (24, '三重県', '近畿', 24),
  (25, '滋賀県', '近畿', 25),
  (26, '京都府', '近畿', 26),
  (27, '大阪府', '近畿', 27),
  (28, '兵庫県', '近畿', 28),
  (29, '奈良県', '近畿', 29),
  (30, '和歌山県', '近畿', 30),
  (31, '鳥取県', '中国', 31),
  (32, '島根県', '中国', 32),
  (33, '岡山県', '中国', 33),
  (34, '広島県', '中国', 34),
  (35, '山口県', '中国', 35),
  (36, '徳島県', '四国', 36),
  (37, '香川県', '四国', 37),
  (38, '愛媛県', '四国', 38),
  (39, '高知県', '四国', 39),
  (40, '福岡県', '九州・沖縄', 40),
  (41, '佐賀県', '九州・沖縄', 41),
  (42, '長崎県', '九州・沖縄', 42),
  (43, '熊本県', '九州・沖縄', 43),
  (44, '大分県', '九州・沖縄', 44),
  (45, '宮崎県', '九州・沖縄', 45),
  (46, '鹿児島県', '九州・沖縄', 46),
  (47, '沖縄県', '九州・沖縄', 47);
```

#### `profiles`

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX profiles_role_idx ON profiles (role) WHERE deleted_at IS NULL;

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Auth signup時に自動でprofiles作成
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'user_' || substr(NEW.id::text, 1, 8))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

#### `spots`

```sql
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE spots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_kana TEXT,
  description TEXT,
  prefecture_id SMALLINT NOT NULL REFERENCES prefectures(id),
  location TEXT NOT NULL,                 -- 住所テキスト（人間が読む用）
  coordinates GEOGRAPHY(POINT, 4326) NOT NULL, -- 緯度経度（地図・距離計算用）
  official_url TEXT,                      -- NULL許可（ない場合はsource必須）
  access_info TEXT,
  parking_info TEXT,
  entrance_fee TEXT,
  best_season_start SMALLINT NOT NULL CHECK (best_season_start BETWEEN 1 AND 12),
  best_season_end SMALLINT NOT NULL CHECK (best_season_end BETWEEN 1 AND 12),
  source TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX spots_coordinates_idx ON spots USING GIST (coordinates);
CREATE INDEX spots_prefecture_idx ON spots (prefecture_id);
CREATE INDEX spots_season_idx ON spots (best_season_start, best_season_end);
CREATE INDEX spots_published_idx ON spots (is_published) WHERE deleted_at IS NULL;

CREATE TRIGGER set_updated_at_spots
  BEFORE UPDATE ON spots
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE spots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published spots are viewable by everyone"
  ON spots FOR SELECT
  USING (is_published = true AND deleted_at IS NULL);
```

> **`location` vs `coordinates` の使い分け**
> - `location` (TEXT): 人間が読む住所。詳細ページ表示・住所コピー・経路アプリ起動に使う
> - `coordinates` (GEOGRAPHY): 地図上のピン表示・距離計算（PostGIS）に使う

> **月またぎ見頃判定クエリ（例：12〜2月の梅）**
> ```sql
> WHERE (best_season_start <= best_season_end
>        AND :current_month BETWEEN best_season_start AND best_season_end)
>    OR (best_season_start > best_season_end
>        AND (:current_month >= best_season_start OR :current_month <= best_season_end))
> ```

#### `flowers`

`name` は最も一般的な総称（例：「桜」「チューリップ」）。品種名は `flower_aliases` で管理。

```sql
CREATE TABLE flowers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  default_season_start SMALLINT CHECK (default_season_start BETWEEN 1 AND 12),
  default_season_end SMALLINT CHECK (default_season_end BETWEEN 1 AND 12),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE TRIGGER set_updated_at_flowers
  BEFORE UPDATE ON flowers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE flowers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Flowers are viewable by everyone"
  ON flowers FOR SELECT USING (deleted_at IS NULL);
```

#### `flower_aliases`

AI判定で返ってくる花名（品種名・表記揺れ）と `flowers.name`（総称）を紐付けるテーブル。

```sql
CREATE TABLE flower_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flower_id UUID NOT NULL REFERENCES flowers(id) ON DELETE CASCADE,
  alias TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  UNIQUE (alias)  -- エイリアスは全体でユニーク
);

CREATE INDEX flower_aliases_flower_idx ON flower_aliases (flower_id) WHERE deleted_at IS NULL;
CREATE INDEX flower_aliases_alias_idx ON flower_aliases (alias) WHERE deleted_at IS NULL;

CREATE TRIGGER set_updated_at_flower_aliases
  BEFORE UPDATE ON flower_aliases
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE flower_aliases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Flower aliases are viewable by everyone"
  ON flower_aliases FOR SELECT USING (deleted_at IS NULL);
```

データ例：
```
flowers:   id=A, name='桜'  /  id=B, name='チューリップ'
aliases:   flower_id=A, alias='ソメイヨシノ'
           flower_id=A, alias='ヤマザクラ'
           flower_id=A, alias='シダレザクラ'
           flower_id=B, alias='チューリップ'（カタカナ）
           flower_id=B, alias='鬱金香'（漢字）
```

#### `images`（多態関連）

`spots` と `flowers` 両方の画像を一元管理。外部キー制約なし（多態のため）。整合性は2層で保証する。

```sql
CREATE TABLE images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type TEXT NOT NULL CHECK (owner_type IN ('spot', 'flower')),
  owner_id UUID NOT NULL,
  url TEXT NOT NULL,
  caption TEXT,
  display_order SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX images_owner_idx
  ON images (owner_type, owner_id, display_order)
  WHERE deleted_at IS NULL;

CREATE TRIGGER set_updated_at_images
  BEFORE UPDATE ON images
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Images are viewable by everyone"
  ON images FOR SELECT USING (deleted_at IS NULL);
```

**整合性の2層防御**

A層（アプリ）：Route Handler内で `validateImageOwner()` ヘルパーを呼び出してからINSERT。

```typescript
// lib/utils/imageValidator.ts
export async function validateImageOwner(
  ownerType: 'spot' | 'flower',
  ownerId: string
): Promise<boolean> {
  const table = ownerType === 'spot' ? 'spots' : 'flowers';
  const { data } = await supabaseAdmin
    .from(table)
    .select('id')
    .eq('id', ownerId)
    .is('deleted_at', null)
    .maybeSingle();
  return !!data;
}

export async function insertImage(
  ownerType: 'spot' | 'flower',
  ownerId: string,
  url: string,
  displayOrder: number
) {
  if (!(await validateImageOwner(ownerType, ownerId))) {
    throw new Error(`Invalid owner reference: ${ownerType} ${ownerId}`);
  }
  return supabaseAdmin.from('images').insert({
    owner_type: ownerType,
    owner_id: ownerId,
    url,
    display_order: displayOrder,
  });
}
```

B層（DB）：INSERTトリガーで親レコードの存在を検証。

```sql
CREATE OR REPLACE FUNCTION public.validate_image_owner()
RETURNS TRIGGER AS $$
DECLARE
  exists_count INTEGER;
BEGIN
  IF NEW.owner_type = 'spot' THEN
    SELECT COUNT(*) INTO exists_count FROM spots
    WHERE id = NEW.owner_id AND deleted_at IS NULL;
  ELSIF NEW.owner_type = 'flower' THEN
    SELECT COUNT(*) INTO exists_count FROM flowers
    WHERE id = NEW.owner_id AND deleted_at IS NULL;
  ELSE
    RAISE EXCEPTION 'Invalid owner_type: %', NEW.owner_type;
  END IF;

  IF exists_count = 0 THEN
    RAISE EXCEPTION 'owner_id % does not exist in % table', NEW.owner_id, NEW.owner_type;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_image_owner_trigger
  BEFORE INSERT OR UPDATE OF owner_type, owner_id ON images
  FOR EACH ROW EXECUTE FUNCTION public.validate_image_owner();
```

親の論理削除時に子をカスケード論理削除するトリガー（spots用・flowers用それぞれ）：

```sql
CREATE OR REPLACE FUNCTION public.cascade_soft_delete_spot_images()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    UPDATE images SET deleted_at = NOW()
    WHERE owner_type = 'spot' AND owner_id = NEW.id AND deleted_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cascade_soft_delete_spot_images_trigger
  AFTER UPDATE ON spots
  FOR EACH ROW EXECUTE FUNCTION public.cascade_soft_delete_spot_images();

CREATE OR REPLACE FUNCTION public.cascade_soft_delete_flower_images()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    UPDATE images SET deleted_at = NOW()
    WHERE owner_type = 'flower' AND owner_id = NEW.id AND deleted_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cascade_soft_delete_flower_images_trigger
  AFTER UPDATE ON flowers
  FOR EACH ROW EXECUTE FUNCTION public.cascade_soft_delete_flower_images();
```

**画像取得の実装例**

```typescript
// spots の画像を表示順で取得
const { data: spotImages } = await supabase
  .from('images')
  .select('id, url, caption, display_order')
  .eq('owner_type', 'spot')
  .eq('owner_id', spotId)
  .is('deleted_at', null)
  .order('display_order', { ascending: true });

// スポット詳細と画像を取得（imagesは別クエリ：多態関連のため）
const { data: spot } = await supabase
  .from('spots')
  .select(`*, prefecture:prefectures(id, name, region)`)
  .eq('id', spotId)
  .is('deleted_at', null)
  .single();
```

#### `spot_flowers`

スポットと花の中間テーブル。スポット固有の開花月も保持する。

```sql
CREATE TABLE spot_flowers (
  spot_id UUID NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  flower_id UUID NOT NULL REFERENCES flowers(id) ON DELETE CASCADE,
  bloom_start_month SMALLINT CHECK (bloom_start_month BETWEEN 1 AND 12),
  bloom_end_month SMALLINT CHECK (bloom_end_month BETWEEN 1 AND 12),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  PRIMARY KEY (spot_id, flower_id)
);

CREATE INDEX spot_flowers_flower_idx ON spot_flowers (flower_id) WHERE deleted_at IS NULL;
CREATE INDEX spot_flowers_bloom_idx ON spot_flowers (bloom_start_month, bloom_end_month) WHERE deleted_at IS NULL;

CREATE TRIGGER set_updated_at_spot_flowers
  BEFORE UPDATE ON spot_flowers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE spot_flowers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Spot-flowers are viewable by everyone"
  ON spot_flowers FOR SELECT USING (deleted_at IS NULL);
```

**見頃情報の3層構造**

| カラム | 粒度 | 用途 |
|---|---|---|
| `flowers.default_season_*` | 花全体の一般的な開花時期 | フォールバック（NULLの場合に表示） |
| `spot_flowers.bloom_*_month` | スポット固有のその花の開花時期（最も正確） | スポット詳細・絞り込み |
| `spots.best_season_*` | スポット全体の見頃ピーク | 一覧検索の主フィルタ |

`spot_flowers.bloom_*_month` が NULL の場合は `flowers.default_season_*` をフォールバック表示する。

```typescript
// lib/utils/seasonUtils.ts
export function isInBestSeason(start: number, end: number, currentMonth: number): boolean {
  if (start <= end) {
    return currentMonth >= start && currentMonth <= end;
  } else {
    // 月またぎ（例: 12〜2月）
    return currentMonth >= start || currentMonth <= end;
  }
}
```

#### `bookmarks`

```sql
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  spot_id UUID NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  UNIQUE (user_id, spot_id)
);

CREATE INDEX bookmarks_user_idx ON bookmarks (user_id) WHERE deleted_at IS NULL;

CREATE TRIGGER set_updated_at_bookmarks
  BEFORE UPDATE ON bookmarks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookmarks"
  ON bookmarks FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can insert own bookmarks"
  ON bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookmarks"
  ON bookmarks FOR UPDATE USING (auth.uid() = user_id);
```

#### `reviews`

```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  spot_id UUID NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT CHECK (LENGTH(comment) <= 200),
  visited_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  UNIQUE (user_id, spot_id)  -- 1ユーザー1スポット1レビュー
);

CREATE INDEX reviews_spot_idx ON reviews (spot_id) WHERE deleted_at IS NULL;

CREATE TRIGGER set_updated_at_reviews
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are viewable by everyone"
  ON reviews FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "Users can insert own reviews"
  ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE USING (auth.uid() = user_id);
```

レビューのNGワードフィルタ：辞書ベースで `lib/ng-words.ts` に配置（バージョン管理）。簡単な部分一致のみ（リアルタイム性能優先）。すり抜けたものは管理者が手動で論理削除。

退会ユーザーのレビューは「退会済ユーザー」表示で残す方針。`profiles.deleted_at IS NOT NULL` の場合に username の代わりに「退会済ユーザー」を表示する。

#### `ai_usage_logs`

```sql
CREATE TABLE ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- NULLの場合は匿名
  anonymous_id TEXT,
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reward_unlocked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX ai_usage_logs_user_idx ON ai_usage_logs (user_id, used_at) WHERE deleted_at IS NULL;
CREATE INDEX ai_usage_logs_anon_idx ON ai_usage_logs (anonymous_id, used_at) WHERE deleted_at IS NULL;

ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own usage"
  ON ai_usage_logs FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);
```

---

## 9. AI花判定（`/api/ai/identify-flower`）

### 9.1 フロー

1. クライアントが画像を `FormData` で送信（クライアント側で2MB以下にリサイズ済み）
2. `ai_usage_logs` で本日の利用回数をチェック（レート制限）
3. Gemini API (`gemini-2.5-flash`) に画像 + プロンプトを送信
4. 返却された `flower_name`（総称）を `flowers.name` → `flower_aliases.alias` の順でマッチング（3段階フォールバック）
5. マッチした花に紐づくスポットを最大5件取得して返却
6. `ai_usage_logs` にレコードを挿入

AIに「総称（マッチング用）」と「品種名（表示用）」の両方を返させることでマッチング成功率を上げる。

### 9.2 実装（`app/api/ai/identify-flower/route.ts`）

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkRateLimit(userId: string | null, anonId: string) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  let query = supabaseAdmin
    .from('ai_usage_logs')
    .select('id, reward_unlocked')
    .gte('used_at', todayStart.toISOString())
    .is('deleted_at', null);

  if (userId) {
    query = query.eq('user_id', userId);
  } else {
    query = query.eq('anonymous_id', anonId);
  }

  const { data, error } = await query;
  if (error) throw error;

  const baseLimit = userId ? 3 : 1;
  const rewardCount = data?.filter(r => r.reward_unlocked).length || 0;
  const usedCount = data?.length || 0;
  const totalLimit = baseLimit + rewardCount * 5;

  return {
    allowed: usedCount < totalLimit,
    used: usedCount,
    limit: totalLimit,
    remaining: Math.max(0, totalLimit - usedCount),
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const userId = formData.get('userId') as string | null;
    const anonId = formData.get('anonId') as string;

    if (!imageFile) {
      return NextResponse.json({ error: 'image is required' }, { status: 400 });
    }

    const limit = await checkRateLimit(userId, anonId);
    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: 'rate_limit_exceeded',
          message: '本日のAI判定回数の上限に達しました',
          remaining: 0,
          showAdReward: true,
        },
        { status: 429 }
      );
    }

    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const base64Image = buffer.toString('base64');

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
あなたは日本の植物分類学の専門家です。
この画像に写っている花を判定し、必ず以下のJSON形式のみで回答してください。
他のテキストや説明、マークダウンは絶対に含めないでください。

{
  "flower_name": "日本で一般的に使われる総称（マッチング用。例：「ソメイヨシノ」ではなく「桜」）",
  "flower_variety": "品種名（例：ソメイヨシノ、ヤマザクラ）",
  "confidence": 0.0から1.0の数値,
  "bloom_status": "つぼみ/見頃/終わりかけ のいずれか",
  "description": "花の特徴を120文字以内で説明（色、形状、葉、香りなど）",
  "flower_language": "代表的な花言葉を2〜3個（例：愛、思いやり、永遠の幸せ）",
  "fun_fact": "豆知識を100文字以内で（由来、見分け方、文化的背景など）",
  "best_viewing_months": "一般的な開花時期（例：4月〜5月）",
  "is_flower": true か false（花以外なら false）
}

判定が難しい場合は confidence を低く設定してください。
flower_name は必ず総称（マッチング用）を返し、flower_variety で品種名を補足してください。
`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { mimeType: imageFile.type, data: base64Image } },
    ]);

    const responseText = result.response.text();
    const cleanJson = responseText.replace(/```json\n?|\n?```/g, '').trim();

    let aiResult;
    try {
      aiResult = JSON.parse(cleanJson);
    } catch {
      return NextResponse.json({ error: 'AI response parse failed' }, { status: 500 });
    }

    // flowersマスターとのマッチング（3段階フォールバック）
    // 1. flowers.name に完全一致
    let { data: flowerMatch } = await supabaseAdmin
      .from('flowers')
      .select('*')
      .eq('name', aiResult.flower_name)
      .is('deleted_at', null)
      .maybeSingle();

    // 2. flower_aliases.alias に完全一致
    if (!flowerMatch) {
      const { data: aliasMatch } = await supabaseAdmin
        .from('flower_aliases')
        .select('flower_id, flowers!inner(*)')
        .eq('alias', aiResult.flower_name)
        .is('deleted_at', null)
        .maybeSingle();

      if (aliasMatch) {
        flowerMatch = (aliasMatch as any).flowers;
      } else if (aiResult.flower_variety) {
        // 3. flower_variety（品種名）でエイリアス検索
        const { data: varietyMatch } = await supabaseAdmin
          .from('flower_aliases')
          .select('flower_id, flowers!inner(*)')
          .eq('alias', aiResult.flower_variety)
          .is('deleted_at', null)
          .maybeSingle();

        if (varietyMatch) {
          flowerMatch = (varietyMatch as any).flowers;
        }
      }
    }

    // 花マスターの画像を取得
    let flowerImages: any[] = [];
    if (flowerMatch) {
      const { data } = await supabaseAdmin
        .from('images')
        .select('id, url, caption, display_order')
        .eq('owner_type', 'flower')
        .eq('owner_id', flowerMatch.id)
        .is('deleted_at', null)
        .order('display_order');
      flowerImages = data || [];
    }

    // 利用ログ記録
    await supabaseAdmin.from('ai_usage_logs').insert({
      user_id: userId,
      anonymous_id: anonId,
    });

    // 関連スポットを取得（最大5件）
    let recommendedSpots: any[] = [];
    if (flowerMatch) {
      const { data: spotsData } = await supabaseAdmin
        .from('spots')
        .select(`
          id, name, location, official_url, best_season_start, best_season_end,
          prefecture:prefectures(id, name, region),
          spot_flowers!inner(flower_id)
        `)
        .eq('spot_flowers.flower_id', flowerMatch.id)
        .eq('is_published', true)
        .is('deleted_at', null)
        .limit(5);

      if (spotsData && spotsData.length > 0) {
        const spotIds = spotsData.map(s => s.id);
        const { data: spotImagesData } = await supabaseAdmin
          .from('images')
          .select('owner_id, url')
          .eq('owner_type', 'spot')
          .in('owner_id', spotIds)
          .eq('display_order', 0)
          .is('deleted_at', null);

        const imageMap = new Map(
          (spotImagesData || []).map(img => [img.owner_id, img.url])
        );

        recommendedSpots = spotsData.map(spot => ({
          ...spot,
          cover_image: imageMap.get(spot.id) || null,
        }));
      }
    }

    return NextResponse.json({
      success: true,
      ai_result: aiResult,
      flower_master: flowerMatch,
      flower_images: flowerImages,
      recommended_spots: recommendedSpots,
      rate_limit: {
        remaining: limit.remaining - 1,
        limit: limit.limit,
      },
    });
  } catch (error) {
    console.error('AI判定エラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
```

### 9.3 判定結果UIレイアウト（PictureThis風）

```
┌──────────────────────────┐
│  [ユーザーが撮った写真]   │
├──────────────────────────┤
│  🌸 チューリップ          │
│  信頼度: 95%             │
│  📊 開花状況: 見頃        │
│                          │
│  📝 特徴                 │
│  カップ状の花を持つ早春の  │
│  代表的な球根植物。       │
│                          │
│  💐 花言葉               │
│  愛、思いやり、永遠の幸せ  │
│                          │
│  💡 豆知識               │
│  オランダが原産地と思われ  │
│  がちだが実は中央アジア。  │
│                          │
│  📍 この花が見られるスポット│
│  [スポットカード×最大5件]  │
│                          │
│  [🎨 旅のしおりを作る]    │
└──────────────────────────┘
```

---

## 10. 旅のしおり生成（Canvas API）

サーバーコスト¥0のクライアントサイド完結。

| 方式 | コスト | レスポンス |
|---|---|---|
| サーバーサイド（sharp/satori） | サーバーCPU + Vercel Function | 1〜3秒 |
| **クライアントサイド（Canvas API）** ✅ | **¥0** | **即時** |

### `components/StoryCardGenerator.tsx`

```typescript
'use client';

import { useRef, useState } from 'react';

interface StoryCardProps {
  userImageUrl: string;
  flowerName: string;
  flowerLanguage?: string;
  spotName?: string;
  visitedDate: string;
  comment?: string;
}

export default function StoryCardGenerator(props: StoryCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = async () => {
    setIsGenerating(true);
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    canvas.width = 1080;
    canvas.height = 1920;

    const img = await loadImage(props.userImageUrl);
    drawImageCover(ctx, img, 0, 0, canvas.width, canvas.height);

    // 下部グラデーションオーバーレイ
    const gradient = ctx.createLinearGradient(0, canvas.height * 0.5, 0, canvas.height);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.7)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, canvas.height * 0.5, canvas.width, canvas.height * 0.5);

    // 花名
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 96px "Noto Sans JP", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(props.flowerName, canvas.width / 2, 1450);

    // 花言葉
    if (props.flowerLanguage) {
      ctx.font = 'italic 42px "Noto Sans JP", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.fillText(`〜 ${props.flowerLanguage} 〜`, canvas.width / 2, 1530);
    }

    // スポット名
    if (props.spotName) {
      ctx.font = '48px "Noto Sans JP", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillText(`@ ${props.spotName}`, canvas.width / 2, 1620);
    }

    // 日付
    ctx.font = '36px "Noto Sans JP", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText(props.visitedDate, canvas.width / 2, 1700);

    // コメント
    if (props.comment) {
      ctx.font = '40px "Noto Sans JP", sans-serif';
      wrapText(ctx, `"${props.comment}"`, canvas.width / 2, 1790, canvas.width - 200, 50);
    }

    // ロゴ（右下）
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillText('🌸 hana nav', canvas.width - 60, canvas.height - 60);

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);
        setIsGenerating(false);
      }
    }, 'image/png');
  };

  const loadImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });

  const drawImageCover = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    x: number, y: number, w: number, h: number
  ) => {
    const imgRatio = img.width / img.height;
    const canvasRatio = w / h;
    let sx = 0, sy = 0, sw = img.width, sh = img.height;

    if (imgRatio > canvasRatio) {
      sw = img.height * canvasRatio;
      sx = (img.width - sw) / 2;
    } else {
      sh = img.width / canvasRatio;
      sy = (img.height - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  };

  const wrapText = (
    ctx: CanvasRenderingContext2D,
    text: string, x: number, y: number,
    maxWidth: number, lineHeight: number
  ) => {
    const words = text.split('');
    let line = '';
    let yPos = y;
    for (const char of words) {
      const testLine = line + char;
      if (ctx.measureText(testLine).width > maxWidth && line) {
        ctx.fillText(line, x, yPos);
        line = char;
        yPos += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, yPos);
  };

  const shareToSns = async () => {
    if (!downloadUrl) return;
    const blob = await fetch(downloadUrl).then(r => r.blob());
    const file = new File([blob], 'hananav-story.png', { type: 'image/png' });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: '旅のしおり | hana nav',
          text: `${props.flowerName}を見つけました🌸 #花ナビ`,
        });
      } catch (err) {
        console.log('シェアキャンセル', err);
      }
    } else {
      // フォールバック：ダウンロード
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = 'hananav-story.png';
      a.click();
    }
  };

  return (
    <div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <button onClick={generate} disabled={isGenerating}>
        {isGenerating ? '生成中...' : '🎨 旅のしおりを作る'}
      </button>
      {downloadUrl && (
        <>
          <img src={downloadUrl} alt="preview" style={{ maxWidth: '300px' }} />
          <button onClick={shareToSns}>📤 SNSにシェア</button>
        </>
      )}
    </div>
  );
}
```

---

## 11. 初期データ投入（Python）

`data_collector/` 以下のスクリプトで観光協会等からスクレイピング→AI整形→ジオコーディング→バリデーション→Supabase投入。**スクレイピング前に `robots.txt` を必ず確認すること。**

実行順：`01_scrape.py` → `02_normalize.py` → `03_geocode.py` → `04_validate.py` → `05_upload.py`

投入後は `is_published=false`。管理者がSupabaseのDashboardまたは管理画面で内容を確認してから `is_published=true` で公開する。

### データソース候補

| ソース | robots.txt | 信頼性 | 備考 |
|---|---|---|---|
| 全国花畑ガイドサイト | 確認必須 | 中 | スクレイピング対象の主力 |
| 都道府県観光協会公式サイト | 低リスク | 高 | 公式情報のため信頼性が高い |
| 国営公園公式サイト | 低リスク | 高 | 17箇所（管理された公開情報） |
| 自治体オープンデータ | 高（CC） | 高 | CSV/JSON配布あり、ライセンス確認必須 |
| Wikipedia（花名所カテゴリ） | 低リスク | 中 | CC BY-SAで利用可 |

### 週次バッチ運用フロー

```
[週1回バッチ実行]
  01_scrape.py
    ↓
  02_normalize.py（Geminiで構造化）
    ↓
  03_geocode.py（住所→緯度経度）
    ↓
  04_validate.py（URL生存確認・必須項目チェック）
    ↓
  05_upload.py（Supabaseへ投入、is_published=false）
    ↓
[管理者レビュー（/admin/spots/pending）]
  スポット情報・出典を確認
  説明文の不適切表現チェック
    ↓
[is_published=true で公開]
```

### `config/prefecture_map.py`

```python
PREFECTURE_MAP = {
    "北海道": 1, "青森県": 2, "岩手県": 3, "宮城県": 4, "秋田県": 5,
    "山形県": 6, "福島県": 7, "茨城県": 8, "栃木県": 9, "群馬県": 10,
    "埼玉県": 11, "千葉県": 12, "東京都": 13, "神奈川県": 14, "新潟県": 15,
    "富山県": 16, "石川県": 17, "福井県": 18, "山梨県": 19, "長野県": 20,
    "岐阜県": 21, "静岡県": 22, "愛知県": 23, "三重県": 24, "滋賀県": 25,
    "京都府": 26, "大阪府": 27, "兵庫県": 28, "奈良県": 29, "和歌山県": 30,
    "鳥取県": 31, "島根県": 32, "岡山県": 33, "広島県": 34, "山口県": 35,
    "徳島県": 36, "香川県": 37, "愛媛県": 38, "高知県": 39, "福岡県": 40,
    "佐賀県": 41, "長崎県": 42, "熊本県": 43, "大分県": 44, "宮崎県": 45,
    "鹿児島県": 46, "沖縄県": 47,
}

def to_prefecture_id(name: str) -> int | None:
    if name in PREFECTURE_MAP:
        return PREFECTURE_MAP[name]
    for full_name, pref_id in PREFECTURE_MAP.items():
        if name in full_name or full_name.startswith(name):
            return pref_id
    return None
```

### `scripts/01_scrape.py`

```python
import requests
from bs4 import BeautifulSoup
import json
import time
import yaml
from tqdm import tqdm
from urllib.robotparser import RobotFileParser

def can_fetch(url: str) -> bool:
    rp = RobotFileParser()
    from urllib.parse import urlparse
    parsed = urlparse(url)
    robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
    rp.set_url(robots_url)
    try:
        rp.read()
        return rp.can_fetch('HanaNavBot/1.0', url)
    except Exception:
        return False

def scrape_source(source_config: dict) -> list[dict]:
    url = source_config["url"]
    if not can_fetch(url):
        print(f"⚠️  Skipped (robots.txt): {url}")
        return []

    headers = {"User-Agent": "HanaNavBot/1.0 (+https://hananav.example.com/bot)"}
    time.sleep(2)
    response = requests.get(url, headers=headers, timeout=10)
    soup = BeautifulSoup(response.text, "html.parser")

    items = []
    for elem in soup.select(source_config["item_selector"]):
        image_urls = [
            img["src"] for img in elem.select("img")
            if img.get("src", "").startswith("http")
        ][:5]

        item = {
            "raw_name": elem.select_one(source_config["name_selector"]).get_text(strip=True),
            "raw_address": elem.select_one(source_config["address_selector"]).get_text(strip=True),
            "raw_description": elem.select_one(source_config["description_selector"]).get_text(strip=True),
            "official_url": elem.select_one("a")["href"] if elem.select_one("a") else None,
            "image_urls": image_urls,
            "source": source_config["source_name"],
            "source_url": url,
        }
        items.append(item)
    return items

def main():
    with open("config/sources.yaml", "r", encoding="utf-8") as f:
        sources = yaml.safe_load(f)

    all_items = []
    for source in tqdm(sources, desc="Scraping sources"):
        items = scrape_source(source)
        all_items.extend(items)
        print(f"✅ {source['source_name']}: {len(items)} items")

    with open("output/raw_data.json", "w", encoding="utf-8") as f:
        json.dump(all_items, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()
```

### `scripts/02_normalize.py`

```python
import google.generativeai as genai
import json
import os
from tqdm import tqdm
from dotenv import load_dotenv
from config.prefecture_map import to_prefecture_id

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.5-flash")

PROMPT_TEMPLATE = """
以下の花畑スポットの生データを、必ずJSON形式のみで構造化してください。
他のテキストやマークダウンは絶対に含めないでください。

【入力データ】
{raw_data}

【出力形式】
{{
  "name": "正式名称",
  "name_kana": "ひらがな読み",
  "prefecture_name": "都道府県（例：東京都）",
  "location": "市区町村+番地を含む住所",
  "main_flowers": ["花の種類", "..."],
  "best_season_start": 開花開始月(1-12の整数),
  "best_season_end": 開花終了月(1-12の整数),
  "description": "100文字以内の説明",
  "access_info": "アクセス情報",
  "parking_info": "駐車場情報",
  "entrance_fee": "入場料"
}}

不明な項目は null にしてください。憶測で埋めないでください。
"""

def normalize_item(raw_item: dict) -> dict | None:
    prompt = PROMPT_TEMPLATE.format(raw_data=json.dumps(raw_item, ensure_ascii=False))
    response = model.generate_content(prompt)
    clean_json = response.text.replace("```json\n", "").replace("\n```", "").strip()

    try:
        normalized = json.loads(clean_json)
    except Exception:
        return None

    pref_name = normalized.get("prefecture_name")
    if pref_name:
        pref_id = to_prefecture_id(pref_name)
        if pref_id is None:
            print(f"⚠️  都道府県不明: {pref_name}")
            return None
        normalized["prefecture_id"] = pref_id

    normalized["official_url"] = raw_item.get("official_url")
    normalized["image_urls"] = raw_item.get("image_urls", [])
    normalized["source"] = raw_item.get("source")
    return normalized

def main():
    with open("output/raw_data.json", "r", encoding="utf-8") as f:
        raw_items = json.load(f)

    normalized_items = []
    for item in tqdm(raw_items, desc="Normalizing"):
        result = normalize_item(item)
        if result:
            normalized_items.append(result)

    with open("output/normalized_data.json", "w", encoding="utf-8") as f:
        json.dump(normalized_items, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()
```

### `scripts/03_geocode.py`

```python
import googlemaps
import json
import os
import time
from dotenv import load_dotenv
from tqdm import tqdm

load_dotenv()
gmaps = googlemaps.Client(key=os.getenv("GOOGLE_MAPS_API_KEY"))

def geocode(address: str) -> tuple[float, float] | None:
    try:
        result = gmaps.geocode(address, region="jp")
        if result:
            loc = result[0]["geometry"]["location"]
            return loc["lat"], loc["lng"]
    except Exception as e:
        print(f"⚠️  Geocode失敗: {address}: {e}")
    return None

def main():
    with open("output/normalized_data.json", "r", encoding="utf-8") as f:
        items = json.load(f)

    for item in tqdm(items, desc="Geocoding"):
        if item.get("location"):
            coords = geocode(item["location"])
            if coords:
                item["latitude"], item["longitude"] = coords
            time.sleep(0.1)

    with open("output/geocoded_data.json", "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()
```

### `scripts/04_validate.py`

```python
import requests
import json
from tqdm import tqdm

def validate(item: dict) -> bool:
    if item.get("official_url"):
        try:
            r = requests.head(item["official_url"], timeout=5, allow_redirects=True)
            if r.status_code >= 400:
                item["official_url"] = None
        except Exception:
            item["official_url"] = None

    # official_url が無い場合は source（出典）が必須
    if not item.get("official_url") and not item.get("source"):
        return False

    required = ["name", "prefecture_id", "location", "latitude", "longitude",
                "best_season_start", "best_season_end", "main_flowers"]
    return all(item.get(f) is not None for f in required)

def main():
    with open("output/geocoded_data.json", "r", encoding="utf-8") as f:
        items = json.load(f)

    valid_items = [item for item in tqdm(items, desc="Validating") if validate(item)]
    print(f"✅ Valid: {len(valid_items)}/{len(items)}")

    with open("output/validated_data.json", "w", encoding="utf-8") as f:
        json.dump(valid_items, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()
```

### `scripts/05_upload.py`

```python
import os
import json
from tqdm import tqdm
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

def upload_to_supabase(items: list[dict]):
    for item in tqdm(items, desc="Uploading"):
        # 1. spots テーブルにINSERT
        spot_data = {
            "name": item["name"],
            "name_kana": item.get("name_kana"),
            "prefecture_id": item["prefecture_id"],
            "location": item["location"],
            "coordinates": f"POINT({item['longitude']} {item['latitude']})",
            "official_url": item.get("official_url"),
            "access_info": item.get("access_info"),
            "parking_info": item.get("parking_info"),
            "entrance_fee": item.get("entrance_fee"),
            "best_season_start": item["best_season_start"],
            "best_season_end": item["best_season_end"],
            "description": item.get("description"),
            "source": item.get("source"),
            "is_published": False,  # 人手レビュー後にtrue化
        }
        spot_res = supabase.table("spots").insert(spot_data).execute()
        spot_id = spot_res.data[0]["id"]

        # 2. images テーブルに投入（display_orderは配列インデックス）
        for idx, url in enumerate(item.get("image_urls", [])):
            supabase.table("images").insert({
                "owner_type": "spot",
                "owner_id": spot_id,
                "url": url,
                "display_order": idx,
            }).execute()

        # 3. spot_flowers に投入（flowersテーブルとマッチング）
        for flower_name in item.get("main_flowers", []):
            flower = supabase.table("flowers")\
                .select("id")\
                .eq("name", flower_name)\
                .is_("deleted_at", "null")\
                .execute()

            if flower.data:
                supabase.table("spot_flowers").insert({
                    "spot_id": spot_id,
                    "flower_id": flower.data[0]["id"],
                    "bloom_start_month": item["best_season_start"],
                    "bloom_end_month": item["best_season_end"],
                }).execute()

def main():
    with open("output/validated_data.json", "r", encoding="utf-8") as f:
        items = json.load(f)
    upload_to_supabase(items)
    print(f"✅ Uploaded: {len(items)}")

if __name__ == "__main__":
    main()
```

### CSVフォーマット（手動投入用: `spots_seed.csv`）

```csv
name,name_kana,prefecture_id,location,latitude,longitude,official_url,access_info,parking_info,entrance_fee,best_season_start,best_season_end,main_flowers,description,source,image_urls
ひたち海浜公園,ひたちかいひんこうえん,8,茨城県ひたちなか市馬渡字大沼605-4,36.4029,140.5933,https://hitachikaihin.jp,...
```

| カラム | 型 | 必須 | 対応先 |
|---|---|---|---|
| name | string | ✅ | spots.name |
| name_kana | string | | spots.name_kana |
| prefecture_id | int(1-47) | ✅ | spots.prefecture_id |
| location | string | ✅ | spots.location |
| latitude | float | ✅ | spots.coordinates（POINT変換） |
| longitude | float | ✅ | spots.coordinates（POINT変換） |
| official_url | string | | spots.official_url |
| access_info | string | | spots.access_info |
| parking_info | string | | spots.parking_info |
| entrance_fee | string | | spots.entrance_fee |
| best_season_start | int(1-12) | ✅ | spots.best_season_start |
| best_season_end | int(1-12) | ✅ | spots.best_season_end |
| main_flowers | string | ✅ | spot_flowers経由（カンマ区切り） |
| description | string | | spots.description |
| source | string | ✅ | spots.source |
| image_urls | string | | images（セミコロン区切りで複数） |

---

## 12. SEO実装

### 12.1 各ページのメタデータ（動的生成）

```typescript
// app/spots/[id]/page.tsx
export async function generateMetadata({ params }: { params: { id: string } }) {
  const { data: spot } = await supabase
    .from('spots')
    .select('name, description, location, prefecture:prefectures(name), best_season_start, best_season_end')
    .eq('id', params.id)
    .is('deleted_at', null)
    .single();

  if (!spot) return { title: 'スポットが見つかりません | hana nav' };

  const prefName = (spot.prefecture as any)?.name || '';
  const seasonText = `${spot.best_season_start}月〜${spot.best_season_end}月`;

  return {
    title: `${spot.name}の見頃情報 | hana nav`,
    description: `${prefName}の${spot.name}は${seasonText}が見頃。${spot.description ?? ''}アクセス、見どころ情報をhana navがお届けします。`,
    openGraph: {
      title: `${spot.name}の見頃情報`,
      description: spot.description ?? '',
      type: 'article',
      images: [/* OGP画像URL */],
    },
  };
}
```

### 12.2 ルートレイアウトのデフォルトメタデータ

```typescript
// app/layout.tsx
export const metadata: Metadata = {
  title: {
    default: '花ナビ | 全国花畑・絶景スポット検索',
    template: '%s | hana nav',
  },
  description: '全国の花畑・絶景スポットを検索できる花ナビ。AI花判定で撮った花を即特定、SNS映えする旅のしおりも生成できます。',
  openGraph: {
    siteName: 'hana nav',
    locale: 'ja_JP',
    type: 'website',
    images: ['/og-default.png'],  // 1200x630px
  },
  twitter: {
    card: 'summary_large_image',
  },
};
```

### 12.3 サイトマップ（`app/sitemap.ts`）

```typescript
import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: spots } = await supabase
    .from('spots')
    .select('id, updated_at')
    .eq('is_published', true)
    .is('deleted_at', null);

  const { data: flowers } = await supabase
    .from('flowers')
    .select('id, updated_at')
    .is('deleted_at', null);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://hananav.example.com';

  return [
    { url: baseUrl, lastModified: new Date(), priority: 1.0 },
    { url: `${baseUrl}/spots`, lastModified: new Date(), priority: 0.9 },
    { url: `${baseUrl}/flowers`, lastModified: new Date(), priority: 0.8 },
    { url: `${baseUrl}/identify`, lastModified: new Date(), priority: 0.7 },
    ...(spots ?? []).map(s => ({
      url: `${baseUrl}/spots/${s.id}`,
      lastModified: new Date(s.updated_at),
      priority: 0.7,
    })),
    ...(flowers ?? []).map(f => ({
      url: `${baseUrl}/flowers/${f.id}`,
      lastModified: new Date(f.updated_at),
      priority: 0.6,
    })),
    ...Array.from({ length: 47 }, (_, i) => ({
      url: `${baseUrl}/areas/${i + 1}`,
      lastModified: new Date(),
      priority: 0.6,
    })),
  ];
}
```

### 12.4 robots.txt（`app/robots.ts`）

```typescript
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/auth/', '/mypage/'],
      },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_BASE_URL}/sitemap.xml`,
  };
}
```

### 12.5 構造化データ（JSON-LD、時間あれば）

```typescript
// app/spots/[id]/page.tsx 内
function SpotJsonLd({ spot }: { spot: Spot }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name: spot.name,
    description: spot.description,
    address: {
      '@type': 'PostalAddress',
      addressRegion: spot.prefecture?.name,
      streetAddress: spot.location,
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
```

### 12.6 SEO実装上の注意点

| ポイント | 注意点 |
|---|---|
| `alt`属性 | `images.caption` を `<img alt="">` に設定する |
| 見出し階層 | `<h1>` はページに1つ、`<h2>`, `<h3>` は階層を守る |
| 内部リンク | 関連スポット・関連花への内部リンクを充実させる |
| 重複コンテンツ | 検索結果ページには `noindex` を推奨（クエリパラメータで無限に重複ページが生成されるため） |

---

## 13. オーバーツーリズム・私有地侵入対策

| 制約 | 実装 |
|---|---|
| 出典の明示を必須化 | `official_url` が NULL の場合は `source` 必須（validateスクリプトでチェック） |
| 公開前の人手レビュー | `is_published=false` で投入 → 管理者が出典の信頼性を確認 → 公開 |
| 位置情報の意図的なボカし | ピンは公式駐車場/入口に統一（私有地の特定を防ぐ） |
| 「秘境」訴求の排除 | UIコピーで「誰も知らない」「穴場」を使わない |
| 混雑度サインの表示 | 見頃ピーク警告 + 「平日推奨」明記 |
| マナー啓発 | スポット詳細ページに「ゴミを持ち帰ろう」「花は摘まない」を明記 |

---

## 14. コスト管理

| 対策 | 詳細 |
|---|---|
| **レート制限** | `ai_usage_logs` ベースの匿名/ログイン別カウント |
| **画像圧縮** | クライアントで max-width: 1024px、JPEG品質 0.8 にリサイズしてから送信 |
| **同一画像キャッシュ** | SHA-256ハッシュをキーに24時間キャッシュして重複呼び出しをゼロ化 |
| **Google Cloud月予算アラート** | ¥5,000超でメール通知（必須） |
| **Vercel Spend Management** | 設定必須 |
| **Supabase DBサイズ監視** | 無料枠500MB。画像はStorageではなく外部URL参照で節約 |

---

## 15. 開発ロードマップ（4週間）

| 週 | テーマ | 完了基準 |
|---|---|---|
| Week 1 | 基盤構築 | 開発環境 + DB + 認証が動く |
| Week 2 | コア機能 | 検索・詳細・ブックマークが動く |
| Week 3 | AI機能 | 花判定・しおり生成・SNSシェアが動く |
| Week 4 | データ投入 + 本番化 | 200件公開 + Vercelデプロイ + SEO基盤 |

### Week 1（Day 1〜7）：基盤構築

| Day | タスク | 工数目安 |
|---|---|---|
| 1 | Supabaseプロジェクト作成 + 全テーブル定義 + RLS設定 | 5h |
| 2 | Supabase Auth設定（Email + Google OAuth） | 3h |
| 3 | Next.js + TypeScript + Tailwind CSS v4 + shadcn/ui セットアップ | 4h |
| 4 | Supabase クライアント設定（server.ts / client.ts） + Middleware実装 | 4h |
| 5 | prefecturesマスター47件投入 + flowersマスター手動投入（30種類）+ 画像紐付け | 3h |
| 6 | 共通レイアウト + ナビゲーション + ログインUI | 5h |
| 7 | バッファ/ドキュメント整備 | 3h |

**Week 1 完了基準**:
- [ ] `npm run dev` で起動する
- [ ] ログイン/ログアウトができる
- [ ] prefecturesに47件、flowersに30件以上のマスターデータがある
- [ ] 全テーブルでRLSが効いている

### Week 2（Day 8〜14）：検索・詳細・ブックマーク

| Day | タスク | 工数目安 |
|---|---|---|
| 8 | スポット一覧（Server Component）+ 都道府県絞り込み | 5h |
| 9 | 見頃カレンダーフィルタ（今月/来月） | 4h |
| 10 | 花の種類タグ検索 | 4h |
| 11 | Google Maps連携 + ピン表示 | 6h |
| 12 | スポット詳細ページ（imagesテーブルから複数画像スライダー表示） | 5h |
| 13 | ブックマーク機能（追加/削除/一覧） | 4h |
| 14 | バッファ + 動作確認 | 2h |

### Week 3（Day 15〜21）：AI機能

| Day | タスク | 工数目安 |
|---|---|---|
| 15 | Gemini API連携 + `/api/ai/identify-flower` 実装 | 6h |
| 16 | 花判定結果UI（PictureThis風レイアウト） | 5h |
| 17 | flowersマスターとのマッチング + 関連スポット表示 | 4h |
| 18 | レート制限UI（残回数表示・上限到達時の表示） | 6h |
| 19 | Canvas APIでしおり画像生成 | 6h |
| 20 | Web Share API連携 + デザインブラッシュアップ | 4h |
| 21 | バッファ + 動作確認 | 5h |

**Week 3 完了基準**:
- [ ] 花の写真をアップして種類が判定される
- [ ] 花言葉・特徴・関連スポットが表示される
- [ ] 旅のしおり画像が生成・SNSシェアできる
- [ ] レート制限が機能する

### Week 4（Day 22〜28）：データ投入 + 本番化

| Day | タスク | 工数目安 |
|---|---|---|
| 22 | Pythonスクレイパー実装（5〜10件で動作確認） | 5h |
| 23 | normalize/geocode/validate スクリプト | 5h |
| 24 | 100件投入 → 人手レビュー → 公開 | 6h |
| 25 | 200件追加投入 → レビュー → 公開 | 6h |
| 26 | SEO実装（メタタグ動的生成 + OGP + sitemap.xml + robots.txt） | 4h |
| 27 | Vercelデプロイ + 独自ドメイン + Lighthouse改善 + Search Console登録 | 5h |
| 28 | プライバシーポリシー + 利用規約 + 最終動作確認 | 4h |

### スケジュール遅延時の削減優先度

```
削減可（高→低）：
1. アフィリエイトリンク埋め込み
2. リワード広告連携（ロジックは仕込むがUIなしでもOK）
3. 簡易レビュー機能
4. 地図UI（リスト表示のみで代替）
5. Google OAuth（Emailログインのみで代替）

削減禁止（コアバリュー）：
- スポット検索（エリア/花種類/見頃）
- スポット詳細表示
- ブックマーク機能
- AI花判定
- 旅のしおり画像生成 + SNSシェア
- レート制限
```

---

## 16. 技術的懸念点

### 高優先度

| 懸念 | リスク | 対策 |
|---|---|---|
| **Gemini APIコスト爆発** | バズって$1,000超請求 | レート制限 + Google Cloud月予算アラート(¥5,000) + Vercel Spend Management |
| **Supabase無料枠（500MB）超過** | 突然のサービス停止 | DBは軽量データのみ。画像はStorageではなく外部URL参照 |
| **imagesテーブル整合性** | 孤立画像発生 | A: アプリ層の共通バリデータ + B: DBトリガーで親存在検証（2層防御）+ 運用ルールで物理削除を禁止 |

### 中優先度

| 懸念 | 対策 |
|---|---|
| **AIの誤判定** | `confidence` が低い場合は「自信なし」と明示。マスター未登録時は関連スポット非表示で運用 |
| **レビューの誹謗中傷** | NGワードフィルタ（辞書ベース、`lib/ng-words.ts`）+ 管理者画面から手動論理削除 |
| **地図APIコスト** | Google Maps無料枠($200/月)超過時はMapbox無料枠に移行検討 |
| **モバイルでのCanvas性能** | 端末性能で重い場合は1080→720pxに落とす分岐 |
| **画像アップロードサイズ** | クライアント側で2MB以下にリサイズ |
| **論理削除のクエリ漏れ** | 全クエリで `WHERE deleted_at IS NULL` を必須。Supabaseのビューで「アクティブのみ」を別名公開する手も検討 |
| **退会ユーザーのレビュー扱い** | レビューは物理削除しない。`profiles.deleted_at IS NOT NULL` の場合に「退会済ユーザー」と表示 |

---

## 17. v2以降の拡張ロードマップ

| 優先度 | 機能 | 想定時期 |
|---|---|---|
| 高 | ユーザー写真投稿（CGM） | リリース1ヶ月後 |
| 高 | リアルタイム開花情報投稿 | リリース1ヶ月後 |
| 中 | プッシュ通知（PWA） | リリース2ヶ月後 |
| 中 | AI判定結果の保存（自分のコレクション） | リリース2ヶ月後 |
| 低 | AIコンシェルジュ（旅程提案） | リリース3ヶ月後 |
| 低 | 法人向けAPI（観光協会向け） | リリース6ヶ月後 |

---

## 18. ローンチチェックリスト

### コスト・監視

- [ ] Google Cloud コンソールで月予算アラート設定（¥5,000超でメール通知）
- [ ] Vercel Spend Management 設定
- [ ] Supabase Dashboard でDBサイズ監視を確認
- [ ] エラーログ収集設定（Vercel Logs / Sentry）
- [ ] 緊急時のAPIキー無効化手順をドキュメント化

### セキュリティ・権限

- [ ] 全テーブルでRLSが有効になっていることを確認
- [ ] `SUPABASE_SERVICE_ROLE_KEY` がクライアントサイドに漏れていないことを確認（`NEXT_PUBLIC_` プレフィックスなし）
- [ ] 管理者アカウント（`role='admin'`）を本番DBに設定
- [ ] Middleware のマッチャーで保護パスが正しく設定されていることを確認

### SEO・公開設定

- [ ] Google Search Console にサイトマップ（`/sitemap.xml`）を送信
- [ ] OGP画像（`/og-default.png`、1200×630px）を配置
- [ ] robots.txt で `/admin/`, `/api/`, `/auth/`, `/mypage/` がブロックされていることを確認
- [ ] 独自ドメイン設定 + HTTPS確認

### コンテンツ

- [ ] `is_published=true` のスポットが最低100件以上あること
- [ ] flowersマスターに30種類以上あること
- [ ] 利用規約・プライバシーポリシー・特定商取引法ページが公開されていること
- [ ] スポット詳細ページにマナー啓発文言が表示されていること

---

## 付録：未確定事項

| 項目 | 状態 |
|---|---|
| ドメイン取得（hana-nav.jp 等） | 未着手 |
| 商標調査 | 未着手 |
| 法人登記の必要性 | 未検討 |
