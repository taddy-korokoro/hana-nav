# Supabase Auth（App Router）実装ルール

公式 Quickstart（<https://supabase.com/docs/guides/auth/quickstarts/nextjs>）と SSR ガイド（<https://supabase.com/docs/guides/auth/server-side/nextjs>）の構成を **そのまま踏襲する**。独自アレンジを加えない。

## 1. パッケージとライブラリ

- 認証ライブラリは **`@supabase/ssr`** + `@supabase/supabase-js` を使う。`@supabase/auth-helpers-nextjs` は **deprecated なので使わない**。
  ```bash
  npm install @supabase/supabase-js @supabase/ssr
  ```
- Cookie API は **必ず `getAll()` / `setAll(cookiesToSet)` ペア** を使う。古い `get` / `set` / `remove` の3メソッド形式（`@supabase/auth-helpers-nextjs` 時代の API）は **使わない**。`@supabase/ssr` で書くと型エラー or 黙ってセッション破壊が起きる。

## 2. 環境変数

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=         # 既存。legacy anon key として当面動作
# NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=  # 新方式（sb_publishable_...）。Supabase が legacy 廃止予告したら移行
SUPABASE_SERVICE_ROLE_KEY=             # サーバー専用。NEXT_PUBLIC_ プレフィックスは絶対に付けない
```

`SUPABASE_SERVICE_ROLE_KEY` は **Route Handler / Server Action / バッチスクリプト内のみで使用**。Server Component から呼ぶときも RLS をバイパスする自覚を持って使う。

## 3. ファイル構成（公式テンプレート準拠）

```
lib/supabase/
├── client.ts        # Client Component 用（createBrowserClient）
├── server.ts        # Server Component / Route Handler / Server Action 用（createServerClient + cookies()）
└── middleware.ts    # updateSession ヘルパー（middleware.ts から呼ばれる）
middleware.ts        # ルート直下。updateSession を呼ぶ
app/auth/callback/route.ts   # OAuth / Magic Link コールバック
```

## 4. `lib/supabase/client.ts`（Client Component 専用）

```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

## 5. `lib/supabase/server.ts`（Server 側専用）

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

## 6. `lib/supabase/middleware.ts`（updateSession ヘルパー）

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

## 7. `middleware.ts`(ルート直下)

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

## 8. Auth Callback（`app/auth/callback/route.ts`）

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

## 9. ログイン / サインアップは Server Action で

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

## 10. 絶対に守るルール（DO / DON'T）

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
