# 01. プロジェクト初期セットアップ

## 概要

Next.js 16.2.4 + React 19.2.4 + TypeScript + Tailwind CSS v4 + shadcn/ui を準備し、`npm run dev` で起動できる状態にする。

## 依存チケット

なし（最初のチケット）

## 関連ファイル

- `package.json`
- `tsconfig.json`
- `next.config.ts`
- `app/layout.tsx`
- `app/globals.css`
- `.env.local`（リポジトリ外）
- `.env.example`（リポジトリ内）

## TODO

- [x] Next.js 16.2.4 + React 19.2.4 のバージョン確認（`package.json`）
- [x] TypeScript strict 設定の確認（`tsconfig.json`）
- [x] Tailwind CSS v4 の動作確認（`@tailwindcss/postcss` 経由、`tailwind.config.*` は無し）
- [x] `next/font/google`（Geist Sans / Geist Mono）が CSS 変数で読み込まれていることを確認
- [x] shadcn/ui を初期化（`npx shadcn@latest init`）
- [x] よく使うコンポーネントを追加（button, input, card, dialog, dropdown-menu, sheet, form, select, label, textarea, badge, avatar, skeleton, sonner ※toast 後継）
- [x] `.env.example` を作成して必要な環境変数キーを列挙
  - [x] `NEXT_PUBLIC_SUPABASE_URL`
  - [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [x] `SUPABASE_SERVICE_ROLE_KEY`
  - [x] `GEMINI_API_KEY`
  - [x] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
  - [x] `NEXT_PUBLIC_BASE_URL`
- [x] `lib/supabase/`, `lib/utils/`, `components/` のディレクトリを作成
- [x] `node_modules/next/dist/docs/` の App Router ガイドを軽く眺める
- [x] `npm run dev` でトップページが表示されることを確認（`/demo` / `/demo/spots` でリネーム後のトークンが意図通り表示されることも確認済み）
- [x] `npm run build` が通ることを確認
- [x] `npm run lint` が通ることを確認
- [x] AGENTS.md / README.md を最低限更新

## 完了基準

- [x] `npm run dev` でローカル起動できる
- [x] `npm run build` が成功する
- [x] shadcn/ui のコンポーネントが import して使える
- [x] `.env.example` がコミットされている

## 補足（実装メモ）

- shadcn の `--color-muted` トークンと当プロジェクトの `text-muted` が衝突したため、デザイントークンを `text-ink-muted` / `text-ink-faint` にリネーム。`docs/specs/design.md`、`app/globals.css`、`app/demo/` を一括更新済み。
- `form` コンポーネントは shadcn の `radix-nova` ベースに含まれていなかったため、`new-york` スタイルから個別追加（`react-hook-form` / `@hookform/resolvers` / `zod` を依存に追加）。
- ダークモードは MVP では非対応のため、shadcn init が生成した `.dark` ブロックは削除し、`@layer base` の `body` 既定色も削除（`body { background: var(--color-surface); ... }` に一本化）。

## 参考

- CLAUDE.md「重要：技術スタックのバージョン」
- [specs/nextjs-conventions.md](./specs/nextjs-conventions.md) — Next.js App Router 規約
- [specs/tech-stack.md](./specs/tech-stack.md)
