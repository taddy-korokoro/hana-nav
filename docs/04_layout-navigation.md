# 04. 共通レイアウト・ナビゲーション

## 概要

全ページ共通のヘッダー・ナビゲーション・フッター・トーストを `app/layout.tsx` に配置し、レスポンシブ対応する。ログイン状態によってヘッダー右端の表示を切り替える。

## 依存チケット

- [01](./01_project-setup.md), [03](./03_auth.md)

## 関連ファイル

- `app/layout.tsx`
- `components/layout/Header.tsx`
- `components/layout/Footer.tsx`
- `components/layout/MobileNav.tsx`
- `components/layout/UserMenu.tsx`

## TODO

### グローバル

- [ ] `app/layout.tsx` に `lang="ja"` と Geist フォント設定
- [ ] ルートメタデータ（title template, description, OGP デフォルト）を定義
- [ ] Toaster（shadcn/ui sonner）を配置
- [ ] PostHog/GA 等の解析タグ用プレースホルダ（任意）

### ヘッダー

- [ ] ロゴ（hana nav）→ `/` リンク
- [ ] グローバルナビ：`スポット検索 / 花の種類 / AI花判定`
- [ ] 検索アイコン（モバイルでは検索ページへ遷移、PCではヘッダー内検索）
- [ ] 未ログイン：`ログイン / 会員登録` ボタン
- [ ] ログイン済：`UserMenu`（アバター、マイページ、ブックマーク、ログアウト）
- [ ] 管理者ロールの場合は管理画面へのリンクを追加表示

### フッター

- [ ] サイトリンク（利用規約 / プライバシーポリシー / 特定商取引法）
- [ ] ロゴ + コピーライト
- [ ] お問い合わせ（mailto: でも可）

### モバイルナビ

- [ ] ハンバーガーメニュー（shadcn/ui Sheet）
- [ ] 主要遷移先・ログイン/ログアウトを格納

### 動作確認

- [ ] iPhone / iPad / Desktop でレイアウトが崩れない
- [ ] ログイン状態の切替がヘッダーに反映される（Server Component で `getUser`）
- [ ] アクティブなナビ項目がハイライトされる

## 完了基準

- [ ] 全ページで共通ヘッダー・フッターが表示される
- [ ] ログイン状態に応じて表示が切り替わる
- [ ] モバイルでメニューが操作できる

## 参考

- [specs/tech-stack.md](./specs/tech-stack.md) — ディレクトリ構成
- CLAUDE.md「Next.js App Router ベストプラクティス」
