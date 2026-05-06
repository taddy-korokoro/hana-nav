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

- [ ] Next.js 16.2.4 + React 19.2.4 のバージョン確認（`package.json`）
- [ ] TypeScript strict 設定の確認（`tsconfig.json`）
- [ ] Tailwind CSS v4 の動作確認（`@tailwindcss/postcss` 経由、`tailwind.config.*` は無し）
- [ ] `next/font/google`（Geist Sans / Geist Mono）が CSS 変数で読み込まれていることを確認
- [ ] shadcn/ui を初期化（`npx shadcn@latest init`）
- [ ] よく使うコンポーネントを追加（button, input, card, dialog, dropdown-menu, sheet, form, select, label, textarea, badge, avatar, skeleton, toast）
- [ ] `.env.example` を作成して必要な環境変数キーを列挙
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `GEMINI_API_KEY`
  - [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
  - [ ] `NEXT_PUBLIC_BASE_URL`
- [ ] `lib/supabase/`, `lib/utils/`, `components/` のディレクトリを作成
- [ ] `node_modules/next/dist/docs/` の App Router ガイドを軽く眺める
- [ ] `npm run dev` でトップページが表示されることを確認
- [ ] `npm run build` が通ることを確認
- [ ] `npm run lint` が通ることを確認
- [ ] AGENTS.md / README.md を最低限更新

## 完了基準

- [ ] `npm run dev` でローカル起動できる
- [ ] `npm run build` が成功する
- [ ] shadcn/ui のコンポーネントが import して使える
- [ ] `.env.example` がコミットされている

## 参考

- CLAUDE.md「重要：Next.jsバージョンについて」
- CLAUDE.md「Next.js App Router ベストプラクティス」
- [specs/tech-stack.md](./specs/tech-stack.md)
