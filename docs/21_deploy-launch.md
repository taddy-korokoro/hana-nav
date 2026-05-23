# 21. デプロイ・ローンチ

## 概要

Vercel へのデプロイ、本番環境変数、独自ドメイン接続、コスト監視・ローンチチェックリストの完遂。

> **MVP 方針**：本番 URL は **`https://hananav.site`**（ムームードメインで取得 + ムームー DNS 運用）。Vercel の環境は **Production（本番）** と **Development（ローカル）** の 2 つだけにし、Preview は使わない。本格 Custom SMTP（Resend + SPF/DKIM/DMARC）と Preview 運用は v2 送り。

## 依存チケット

ほぼ全チケット完了後

## 関連ファイル

- `vercel.json`（必要に応じて）
- `.env.local`（リポジトリ外、ローカル開発用）
- `.env.example`（本番想定のコメントを整備済み）
- `next.config.ts`（image domains 等）
- `docs/launch-runbook.md`（外部サービス側の作業手順書）
- `docs/auth-email-templates.md`（Supabase Auth メールテンプレ master）

## TODO

> ユーザー（人手）作業は [`launch-runbook.md`](./launch-runbook.md) に手順をまとめてある。本チケットでは進捗管理のみ。

### Vercel デプロイ

- [ ] Vercel プロジェクト作成、GitHub リポジトリと連携
- [ ] 環境変数を Vercel の **Production にのみ** 登録（Preview / Development はチェックを外す）
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`（Sensitive）
  - [ ] `GEMINI_API_KEY`（Sensitive）
  - [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
  - [ ] `NEXT_PUBLIC_BASE_URL=https://hananav.site`
  - ※ `TZ` は Vercel 予約変数のため登録不可。JST はコード側で `lib/utils/dateUtils.ts` のヘルパーを使う
- [ ] Preview Deployments を無効化（Ignored Build Step もしくは Settings から OFF）
- [x] `next.config.ts` の `images.remotePatterns` に Supabase Storage / 出典サイトを設定
- [ ] デプロイ成功を確認
- [ ] `https://hananav.site` でトップページ表示確認

### 独自ドメイン接続（hananav.site）

- [x] ムームードメインで `hananav.site` を取得
- [x] ムームー DNS の「設定 2」に A レコード（Apex → `76.76.21.21`）と CNAME（`www` → `cname.vercel-dns.com`）を追加
- [x] Vercel Dashboard > Settings > Domains に `hananav.site` / `www.hananav.site` を追加。Primary を Apex に、`www` は Apex に 301 リダイレクト
- [x] HTTPS 自動発行を確認（Valid Configuration）
- [ ] Search Console の所有権確認用 TXT レコードをムームー DNS に追加（§SEO で実施）
- 詳細手順は [`launch-runbook.md` §1「独自ドメイン接続」](./launch-runbook.md#独自ドメイン接続ムームードメイン--vercel) 参照

### Google Maps API リファラー制限

- [x] HTTP リファラー制限を以下のみに絞る
  - `https://hananav.site/*`
  - `https://www.hananav.site/*`
  - `http://localhost:3000/*`
- [ ] API restrictions で Maps JavaScript API のみに限定（hana nav の Web で使う API は Maps JS のみ。Geocoding / Places は `data_collector/` 用に別キーで運用）

### Auth メールテンプレ反映 / Custom SMTP（Gmail）

メール本文の master は [`auth-email-templates.md`](./auth-email-templates.md) で管理。Dashboard には docs から貼り直す運用。

- [x] メールテンプレ docs を作成（[`auth-email-templates.md`](./auth-email-templates.md)）
- [ ] Supabase Dashboard > Authentication > Email Templates に反映
  - [ ] Confirm signup（サインアップ確認）
  - [ ] Reset Password（パスワード再設定）
  - [ ] Change Email Address（メールアドレス変更）
- [ ] 送信専用 Gmail（`hananav.noreply@gmail.com`）で 2 段階認証 + アプリパスワードを発行
- [ ] Supabase の Custom SMTP を有効化し、`smtp.gmail.com:587` / アプリパスワード / Sender email = `hananav.noreply@gmail.com` / Sender name = `hana nav` を入力（手順は [`launch-runbook.md` §3](./launch-runbook.md#custom-smtpgmail設定) 参照）
- [ ] テスト送信：Gmail / 携帯キャリアで受信 → 差出人 `hana nav` 表示・件名・本文・リンク遷移を確認

> 独自ドメイン `hananav.site` 自体は MVP で取得済みだが、**Resend + SPF/DKIM/DMARC** の本格 Custom SMTP は **v2 送り**。MVP では Gmail SMTP で代替する（Sender name を変えるために Default SMTP は使えない）。

### コスト監視

- [ ] Google Cloud 月予算アラート ¥5,000 設定
- [ ] Vercel Spend Management 設定
- [ ] Supabase Dashboard で DB サイズ監視を有効化
- [ ] エラーログ収集（Vercel Logs / Sentry）
- [x] 緊急時 API キー無効化手順をドキュメント化（[`specs/operations.md`](./specs/operations.md#緊急時-api-キー無効化手順)）

### セキュリティ最終確認

- [ ] 全テーブルで RLS が有効
- [x] `SUPABASE_SERVICE_ROLE_KEY` が `NEXT_PUBLIC_` に漏れていない（コード監査済み：参照は `app/api/ai/identify-flower/route.ts` と `lib/supabase/admin.ts` のみ）
- [ ] 管理者アカウントを本番 DB に1名作成
- [x] middleware の matcher が想定通り（`/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)`）
- [x] `/api/admin/*` で `requireAdmin()` が呼ばれている（全 9 ルート確認済み）

### SEO 最終確認

- [ ] Google Search Console にプロパティ追加（**プロパティタイプ「ドメイン」**で `hananav.site` を登録 → 表示される TXT をムームー DNS に追加して所有権確認）
- [ ] サイトマップ送信：`https://hananav.site/sitemap.xml`
- [ ] OGP デフォルト画像配置済み
- [x] robots.txt で `/admin/`, `/api/`, `/auth/`, `/mypage/` ブロック確認（`app/robots.ts`）
- [ ] Lighthouse モバイルスコア（Performance / SEO）80+

### コンテンツ最終確認

- [ ] `is_published=true` のスポットが100件以上
- [ ] flowers マスター30種類以上
- [ ] flowers の代表画像（`images.owner_type='flower'`）が全種に最低 1 枚登録されている（チケット [16](./16_admin-content.md) で curate 済み）
- [ ] 利用規約 / プライバシーポリシー公開（特定商取引法表記は MVP では作成しない。理由はチケット [20](./20_static-pages.md)）
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

- [launch-runbook.md](./launch-runbook.md) — 外部サービス設定の作業手順書（Vercel / Supabase Dashboard / Google Cloud / Search Console）
- [auth-email-templates.md](./auth-email-templates.md) — Supabase Auth メールテンプレ master
- [specs/operations.md](./specs/operations.md) — コスト管理 / ローンチチェックリスト / 緊急時 API キー無効化手順
- [specs/roadmap.md](./specs/roadmap.md) — 開発ロードマップ（本格 Custom SMTP は v2）
