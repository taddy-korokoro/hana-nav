# 04. 共通レイアウト・ナビゲーション

## 概要

全ページ共通のヘッダー・ナビゲーション・フッター・トーストを `app/layout.tsx` に配置し、レスポンシブ対応する。ログイン状態によってヘッダー右端の表示を切り替える。

## 依存チケット

- [01](./01_project-setup.md), [03](./03_auth.md)

## 関連ファイル

- `app/layout.tsx` — ルート shell（html/body・フォント・metadata・Toaster）。Header/Footer はここには置かない
- `app/(site)/layout.tsx` — 公開サイト用 route group。`SiteHeader` + `<main>` + `SiteFooter` を組む
- `app/(site)/page.tsx` — トップページ（チケット 05 で本実装）
- `components/layout/site-header.tsx` — Server Component。`getUser()` + `profiles.role` を引いてログイン状態と admin リンクを出し分け
- `components/layout/site-footer.tsx`
- `components/layout/mobile-nav.tsx` — Client Component。shadcn `Sheet` で右からスライドイン
- `components/layout/user-menu.tsx` — Client Component。shadcn `DropdownMenu` + ログアウト用 `<form action={logout}>`（Server Action）
- `components/layout/nav-link.tsx` — `usePathname` でアクティブ判定する小さな Client Component
- `components/layout/nav-items.ts` — Header / MobileNav 共通のナビ定義
- `components/layout/icons.tsx` — レイアウト用 SVG アイコン

## TODO

### グローバル

- [x] `app/layout.tsx` に `lang="ja"` と Geist フォント設定
- [x] ルートメタデータ（title template, description, OGP デフォルト）を定義
- [x] Toaster（shadcn/ui sonner）を配置
- [ ] PostHog/GA 等の解析タグ用プレースホルダ（任意）

### ヘッダー

- [x] ロゴ（hana nav）→ `/` リンク
- [x] グローバルナビ：`スポット検索 / 花の種類 / AI花判定`
- [x] 検索アイコン（モバイル：検索アイコン → `/spots`。PC はナビの「スポット検索」リンクで代替。ヘッダー内インライン検索バーはチケット 06 のスポット検索 UI 実装と合わせて再検討）
- [x] 未ログイン：`ログイン / 会員登録` ボタン
- [x] ログイン済：`UserMenu`（アバター、マイページ、ブックマーク、ログアウト）
- [x] 管理者ロールの場合は管理画面へのリンクを追加表示

### フッター

- [x] サイトリンク（利用規約 / プライバシーポリシー / 特定商取引法）
- [x] ロゴ + コピーライト
- [x] お問い合わせ（mailto: でも可）

### モバイルナビ

- [x] ハンバーガーメニュー（shadcn/ui Sheet）
- [x] 主要遷移先・ログイン/ログアウトを格納

### 動作確認

- [x] iPhone / iPad / Desktop でレイアウトが崩れない（Playwright で 1280px / 390px を確認。iPad 幅は未検証）
- [x] ログイン状態の切替がヘッダーに反映される（`SiteHeader` で `supabase.auth.getUser()` → `profiles.role` を引いて分岐）
- [x] アクティブなナビ項目がハイライトされる（`NavLink` が `usePathname` で `text-brand` を当てる）

## 完了基準

- [x] 全ページで共通ヘッダー・フッターが表示される（`app/(site)/layout.tsx` 配下のルート。`/auth/*` は専用レイアウトのため対象外）
- [x] ログイン状態に応じて表示が切り替わる
- [x] モバイルでメニューが操作できる

## 参考

- [specs/tech-stack.md](./specs/tech-stack.md) — ディレクトリ構成
- CLAUDE.md「Next.js App Router ベストプラクティス」
