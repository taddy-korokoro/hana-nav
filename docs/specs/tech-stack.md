# 技術スタック・ディレクトリ構成

## 技術スタック

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

Tailwind CSS v4 は `@tailwindcss/postcss` 経由。`tailwind.config.*` ファイルは存在せず設定は CSS 内。フォントは `next/font/google`（Geist Sans / Geist Mono）で CSS 変数として読み込む。

## 想定月額コスト（MAU 5,000 想定）

| サービス | プラン | 月額 |
|---|---|---|
| Vercel | Hobby（無料）→ Pro で $20 | ¥0〜3,000 |
| Supabase | Free（500MB）→ Pro で $25 | ¥0〜3,800 |
| Gemini API | gemini-2.5-flash 従量課金 | ¥3,000〜10,000 |
| Google Maps | 従量課金（$200/月無料枠） | ¥0〜5,000 |
| **合計** | | **¥3,000〜21,800** |

## 環境変数（`.env.local`）

```bash
GEMINI_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_BASE_URL=
```

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
