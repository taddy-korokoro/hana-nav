# hana-nav

全国の花畑スポット検索 MVP。Next.js 16 (App Router) + Supabase + Vercel。

## セットアップ

```bash
cp .env.example .env.local   # 必要なキーを埋める
npm install
npm run dev                  # http://localhost:3000
```

その他のスクリプト：

```bash
npm run build          # プロダクションビルド
npm run lint           # ESLint
npm run format         # Prettier --write
npm run format:check   # Prettier 確認のみ
```

## 必須環境変数

`.env.example` に列挙。Supabase / Gemini / Google Maps の API キーと、サイト基準 URL（`NEXT_PUBLIC_BASE_URL`）。`SUPABASE_SERVICE_ROLE_KEY` と `GEMINI_API_KEY` はサーバー側専用（Client Component から参照禁止）。

## 技術スタック

- Next.js 16.2.4 (App Router) + React 19.2.4 + TypeScript
- Tailwind CSS v4（`@tailwindcss/postcss`、`@theme` トークン定義）
- shadcn/ui（`components/ui/`）+ lucide-react
- Supabase（PostgreSQL + Auth + Storage）
- Vercel ホスティング

## ディレクトリ構成

詳細は `docs/specs/tech-stack.md`。要点だけ：

- `app/` — App Router のルート定義。サンプル UI は `app/demo/`
- `components/ui/` — shadcn プリミティブ
- `lib/` — Supabase クライアント・共通ユーティリティ
- `docs/` — チケット（`NN_*.md`）と仕様（`specs/*.md`）

## ドキュメント

- `CLAUDE.md` — 全コミット必須の規約（App Router / Supabase Auth / 論理削除等）
- `docs/00_overview.md` — チケット INDEX
- `docs/specs/` — プロダクト・API・DB・デザイン規約
