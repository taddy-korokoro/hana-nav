# 21. デプロイ・ローンチ

## 概要

Vercel へのデプロイ、独自ドメイン設定、本番環境変数、コスト監視・ローンチチェックリストの完遂。

## 依存チケット

ほぼ全チケット完了後

## 関連ファイル

- `vercel.json`（必要に応じて）
- `.env.production`（リポジトリ外）
- `next.config.ts`（image domains 等）

## TODO

### Vercel デプロイ

- [ ] Vercel プロジェクト作成、GitHub リポジトリと連携
- [ ] 環境変数を Vercel に登録
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `GEMINI_API_KEY`
  - [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
  - [ ] `NEXT_PUBLIC_BASE_URL`
- [ ] Production / Preview / Development の環境別設定
- [ ] `next.config.ts` の `images.remotePatterns` に Supabase Storage / 出典サイトを追加
- [ ] デプロイ成功を確認

### 独自ドメイン

- [ ] ドメイン取得（hana-nav.jp 等）
- [ ] 商標調査
- [ ] DNS 設定（Vercel に CNAME / A レコード）
- [ ] HTTPS 自動発行を確認
- [ ] Supabase Auth の Site URL / Redirect URLs を本番ドメインに更新

### Auth メール文面・送信元のカスタマイズ

独自ドメイン設定後に実施。Supabase デフォルト SMTP は送信レート上限と差出人ドメインの信頼性が低いため、本番では Custom SMTP に切り替える。

- [ ] Supabase Dashboard > Authentication > Email Templates で各テンプレを日本語化・hana nav ブランディングに統一
  - [ ] Confirm signup（サインアップ確認）
  - [ ] Reset Password（パスワードリセット）
  - [ ] Change Email Address（メールアドレス変更）
  - [ ] Magic Link（採用する場合のみ）
  - [ ] Invite User（管理者招待を使う場合のみ）
- [ ] 件名・本文・差出名（From Name）を hana nav 仕様に変更
- [ ] テンプレ内のプレースホルダ（`{{ .ConfirmationURL }}` / `{{ .SiteURL }}` / `{{ .Email }}` 等）が本番ドメインで正しく展開されることを実機確認
- [ ] Custom SMTP を設定（Supabase Dashboard > Project Settings > Auth > SMTP Settings）
  - [ ] Resend / SendGrid 等のプロバイダ選定
  - [ ] 送信ドメインの SPF / DKIM / DMARC レコードを DNS に登録
  - [ ] 送信元アドレス（例：`noreply@hana-nav.jp`）と差出名を設定
- [ ] テスト送信：実アドレスでサインアップ → 受信トレイ・迷惑メールフォルダ両方を確認（Gmail / iCloud / 携帯キャリア各1件以上）

### コスト監視

- [ ] Google Cloud 月予算アラート ¥5,000 設定
- [ ] Vercel Spend Management 設定
- [ ] Supabase Dashboard で DB サイズ監視を有効化
- [ ] エラーログ収集（Vercel Logs / Sentry）
- [ ] 緊急時 API キー無効化手順をドキュメント化

### セキュリティ最終確認

- [ ] 全テーブルで RLS が有効
- [ ] `SUPABASE_SERVICE_ROLE_KEY` が `NEXT_PUBLIC_` に漏れていない
- [ ] 管理者アカウントを本番 DB に1名作成
- [ ] middleware の matcher が想定通り
- [ ] `/api/admin/*` で `requireAdmin()` が呼ばれている

### SEO 最終確認

- [ ] Google Search Console にサイトマップ送信
- [ ] OGP デフォルト画像配置済み
- [ ] robots.txt で `/admin/`, `/api/`, `/auth/`, `/mypage/` ブロック確認
- [ ] Lighthouse モバイルスコア（Performance / SEO）80+

### コンテンツ最終確認

- [ ] `is_published=true` のスポットが100件以上
- [ ] flowers マスター30種類以上
- [ ] flowers の代表画像（`images.owner_type='flower'`）が全種に最低 1 枚登録されている（チケット [16](./16_admin-content.md) で curate 済み）
- [ ] 利用規約 / プライバシーポリシー / 特商法ページ公開
- [ ] スポット詳細にマナー啓発文言

### 動作確認（本番）

- [ ] サインアップ → 確認メール → ログイン
- [ ] Google ログイン
- [ ] スポット検索 → 詳細 → ブックマーク
- [ ] AI 花判定（匿名/ログイン両方でレート制限が動く）
- [ ] 旅のしおり生成 → SNS シェア（iOS/Android 実機）
- [ ] 管理画面の認可制御
- [ ] エラーページ（404, 500）

### ローンチ後すぐの監視

- [ ] 初日：エラーログを 1 時間ごとに確認
- [ ] AI 利用回数の急増を監視
- [ ] DB サイズの推移を確認

## 完了基準

- [ ] 本番 URL で全機能が動作する
- [ ] コストアラートが設定されている
- [ ] ローンチチェックリスト全項目が完了している

## 参考

- [specs/operations.md](./specs/operations.md) — コスト管理 / ローンチチェックリスト
- [specs/roadmap.md](./specs/roadmap.md) — 開発ロードマップ
