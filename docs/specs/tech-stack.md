# 技術スタック・ディレクトリ構成

## 技術スタック

```
フロントエンド: Next.js 16.2.4 (App Router) + TypeScript + Tailwind CSS v4
UIライブラリ:   shadcn/ui（Radix UIベース）
状態管理:       React Server Components + URL検索パラメータ
データベース:   Supabase (PostgreSQL + PostGIS拡張)
認証:           Supabase Auth (Email + Google OAuth)
ストレージ:     Supabase Storage（画像アップロード）
ホスティング:   Netlify
AI:             Google Gemini API (gemini-2.5-flash)
地図:           Google Maps JavaScript API
画像合成:       Canvas API（クライアントサイド）
```

Tailwind CSS v4 は `@tailwindcss/postcss` 経由。`tailwind.config.*` ファイルは存在せず設定は CSS 内。フォントは `next/font/google`（Geist Sans / Geist Mono）で CSS 変数として読み込む。

## 想定月額コスト（MAU 5,000 想定）

| サービス    | プラン                      | 月額               |
| ----------- | --------------------------- | ------------------ |
| Netlify     | Starter（無料）→ Pro で $19 | ¥0〜3,000          |
| Supabase    | Free（500MB）→ Pro で $25   | ¥0〜3,800          |
| Gemini API  | gemini-2.5-flash 従量課金   | ¥3,000〜10,000     |
| Google Maps | 従量課金（$200/月無料枠）   | ¥0〜5,000          |
| **合計**    |                             | **¥3,000〜21,800** |

## 環境変数（`.env.local`）

```bash
GEMINI_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_BASE_URL=
```

> **Netlify Functions は AWS Lambda ベースで `TZ` が UTC 固定**になる。`TZ=Asia/Tokyo` を設定しても Functions ランタイムに反映されないため、ローカル開発でも `TZ` は設定しない方針に統一する（環境差をなくすため）。JST 基準が必要な箇所は `lib/utils/dateUtils.ts` のヘルパー（`tokyoMonth()` / `tokyoYmd()` / `tokyoTodayStartIso()` / `tokyoMonthStartIso()`）を使う。

## 画像ホスティング

画像（`images.url`）は **Supabase Storage の公開バケット 1 本** に統一する。スポット・花マスターどちらも `images` バケットに保管し、CDN 経由（`*.supabase.co/storage/v1/object/public/**`）で配信する。

**バケット構成**

| バケット  | 公開   | パス規約                                             | 備考                                                                                             |
| --------- | ------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `images`  | public | `{owner_type}/{owner_id}/{display_order}-{slug}.jpg` | `images` テーブルと同名。`owner_type` ('spot' / 'flower') で物理的に分かれる                     |
| `avatars` | public | `{user_id}/avatar-{timestamp}.jpg`                   | プロフィール画像。RLS で `auth.uid()::text = (storage.foldername(name))[1]` のフォルダのみ書込可 |

**バケットを 1 本に統一した理由**

- `images` テーブルと命名が揃って迷わない
- `owner_type/{owner_id}/...` の path から spot / flower が自明（バケットを分けても結局 owner で分けるため重複した区別になる）
- RLS・`file_size_limit`・`allowed_mime_types` を 1 箇所で管理できる
- MVP では「spot 画像だけライフサイクルを変える」「flower 画像だけ署名 URL に切り替える」等の個別要件が無い（将来必要になったら prefix で分けて対応 or バケット分割を検討する）

**運用ルール**

- 元画像はクライアント側で 1024px / JPEG 0.8 / 2MB 以下にリサイズしてからアップロード（CLAUDE.md「コスト・セキュリティ境界」）
- ファイル名は `{owner_type}/{owner_id}/{display_order}-{slug}.jpg` の規約で衝突を避ける（詳細はチケット 16）
- 商用利用可能なライセンス（Wikimedia Commons / Pixabay / 自前撮影）の画像のみ採用。出典は `images.caption` または `flowers.description` 末尾に明記
- アップロードは管理画面（チケット 15/16）の Route Handler から `SUPABASE_SERVICE_ROLE_KEY` を使って書き込む。RLS で SELECT のみ public、INSERT / UPDATE / DELETE は service role に限定する

**外部 URL 直リンクを採用しない理由**

- 画像 URL の失効リスク（hotlink 禁止・ファイル名変更）
- パフォーマンス（Supabase CDN 経由が安定）
- 管理画面（チケット 16）で「アップロード」フローを 1 本化したい（spots と挙動を揃える）
- 出典・ライセンス管理は `caption` / `description` への明記で十分代替できる

**Next.js 画像ホスト設定**

`next.config.ts` の `images.remotePatterns` は既に `*.supabase.co/storage/v1/object/public/**` を許可済みなので追加作業は不要。

**Free tier 容量の見積もり**

Supabase Free は Storage 1GB。flower 32 種 × 平均 2 枚 + spot 数百件 × 平均 2 枚 を合計しても 200KB/枚換算で数百 MB に収まる見込み（Pro 移行時の閾値判断はチケット 16 で確認）。

### `avatars` バケット初期化（チケット 13 で必要）

プロフィールアバター用の `avatars` バケットは MVP の `/mypage/profile` で使う。Dashboard → Storage → New bucket、または以下の SQL を Supabase SQL Editor で実行：

```sql
-- バケット作成（public read）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- 公開読み取り
CREATE POLICY "Avatars are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- 自分のフォルダ配下のみ INSERT / UPDATE / DELETE 可
CREATE POLICY "Users can upload to own avatar folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own avatars"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own avatars"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

クライアントは `createBrowserClient` で直接 `avatars/{user.id}/avatar-{ts}.jpg` にアップロードし、`getPublicUrl()` で得た URL を Server Action `setAvatarUrl` に渡して `profiles.avatar_url` を更新する。古いファイルの物理削除は MVP では行わない（Storage 容量が問題になったら lifecycle policy を追加）。

## タイムゾーン

本サービスは日本国内向けのため **JST（Asia/Tokyo）を基準とする**。

- **Node.js ランタイム**：Netlify Functions は AWS Lambda ベースで実行時 TZ が **UTC 固定**。`TZ=Asia/Tokyo` を環境変数に登録しても Functions ランタイムには反映されず、`new Date()` をそのまま使うと本番では UTC で動く。
- **JST が必要な箇所**：`lib/utils/dateUtils.ts` のヘルパーを必ず経由する。
  - `tokyoMonth()` — JST の月（1-12）。「今月見頃」判定に使う。
  - `tokyoYmd()` — JST の `{ year, month, day }`。年・月・日を個別に使うとき。
  - `tokyoTodayStartIso()` — JST 今日 00:00 を UTC ISO で返す。`ai_usage_logs` の「今日」カウントに使う。
  - `tokyoMonthStartIso()` — JST 今月 1 日 00:00 を UTC ISO で返す。月次集計の下限に使う。
- **DB（Supabase）**：全ての時刻カラムは `TIMESTAMPTZ` で UTC 保管する。DB セッションの TZ は変更しない（アプリ層で変換する前提を崩さない）。
- **表示**：日付・時刻を画面表示する箇所では `Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', ... })` か dayjs/date-fns 等で明示的に `Asia/Tokyo` に変換する。`toLocaleString()` の暗黙ロケール依存に頼らない。
- **Client Component の `new Date()`**：ブラウザ側ではユーザーの端末 TZ で動くため、国内ユーザーには JST で表示される。ただし SSR で同じコンポーネントを描いた直後にハイドレーションすると差分が出るので、SSR と Client の双方を跨ぐ日付値は **Server で JST 化してから props で渡す**。

## ディレクトリ構成

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
│   ├── server.ts                      # サーバーサイド用
│   └── middleware.ts                  # updateSession ヘルパー
└── utils/
    ├── seasonUtils.ts                 # 見頃判定ヘルパー
    ├── imageValidator.ts              # 多態関連の整合性バリデーション
    └── requireAdmin.ts                # 管理者権限チェック共通ユーティリティ
components/
└── StoryCardGenerator.tsx
data_collector/                        # 初期データ投入用 Python スクリプト
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
