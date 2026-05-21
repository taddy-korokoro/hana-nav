# ローンチ作業手順書（runbook）

外部サービス側の設定手順をまとめたチェックリスト。**コード変更では完結しない作業**を集約している。チケット [21](./21_deploy-launch.md) と対応。

実施したらこのファイルの `[ ]` を `[x]` に更新する。

---

## 0. 事前確認

- [ ] `main` ブランチが緑（lint / build 通過）
- [ ] `npm run build` がローカルで成功する
- [ ] `is_published=true` のスポットが 100 件以上ある（チケット [18](./18_data-collector.md)）
- [ ] flowers マスター 30 種類以上、各種に代表画像が 1 枚以上（チケット [16](./16_admin-content.md)）

---

## 1. Vercel デプロイ

### プロジェクト作成

1. <https://vercel.com/new> から GitHub リポジトリを連携
2. Framework Preset: **Next.js**（自動検出されるはず）
3. Build / Output 設定はデフォルトでよい
4. Environment Variables を登録（次節）

### 環境変数登録（Vercel Dashboard > Settings > Environment Variables）

`.env.example` の各キーを **Production / Preview / Development** の 3 つに登録する。値は Supabase Dashboard / Google Cloud Console から取得。

| Key                               | 環境                                                                                                                  | 備考                                               |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`        | All                                                                                                                   | Supabase Project URL                               |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | All                                                                                                                   | anon public key                                    |
| `SUPABASE_SERVICE_ROLE_KEY`       | All（Sensitive にチェック）                                                                                           | **絶対に NEXT*PUBLIC* を付けない**                 |
| `GEMINI_API_KEY`                  | All（Sensitive）                                                                                                      | Google AI Studio で発行                            |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | All                                                                                                                   | リファラー制限を本番ドメインに掛けてから本番に登録 |
| `NEXT_PUBLIC_BASE_URL`            | Production: `https://<本番ドメイン>` / Preview: `https://<vercel-preview-url>` / Development: `http://localhost:3000` | sitemap / robots / Auth リダイレクトに影響         |
| `TZ`                              | All: `Asia/Tokyo`                                                                                                     | AI 利用回数の「今日」判定                          |

- [ ] 上記 7 キーを Production / Preview / Development に登録
- [ ] `SUPABASE_SERVICE_ROLE_KEY` / `GEMINI_API_KEY` は **Sensitive** にチェック
- [ ] デプロイをトリガーして成功を確認（Deployments タブ）
- [ ] 本番 URL（`*.vercel.app`）でトップページ表示確認

### Vercel Spend Management

- [ ] Settings > Spend Management で月予算を設定（Hobby は無料枠内、Pro で上限超過時に自動シャットダウン）
- [ ] 通知メールアドレスを登録

---

## 2. 独自ドメイン

### 取得・商標調査

- [ ] ドメイン候補（例：`hana-nav.jp`）の商標調査（J-PlatPat）
- [ ] レジストラでドメイン取得

### Vercel への接続

1. Vercel Dashboard > Settings > Domains
2. Add Domain で `hana-nav.jp` と `www.hana-nav.jp` を追加
3. Vercel が表示する DNS レコード（A / CNAME）をレジストラで設定
4. HTTPS 証明書の自動発行を待つ（数分〜数時間）

- [ ] `https://hana-nav.jp` でアクセスできる
- [ ] `http://hana-nav.jp` → `https://` リダイレクトが効く
- [ ] `www.hana-nav.jp` → apex（または逆）のリダイレクトを Vercel で設定

### `NEXT_PUBLIC_BASE_URL` 更新

- [ ] Vercel Environment Variables の Production を `https://hana-nav.jp` に更新
- [ ] Production を再デプロイ（既存ビルドは古い値で固められているため）

### Google Maps API リファラー制限

- [ ] Google Cloud Console > APIs & Services > Credentials > `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` のキー
- [ ] Application restrictions: **HTTP referrers**
- [ ] `https://hana-nav.jp/*`、`https://*.vercel.app/*`、`http://localhost:3000/*` を許可
- [ ] API restrictions で Maps JavaScript API などプロジェクトで使う API のみに限定

---

## 3. Supabase Auth 本番設定

### Site URL / Redirect URLs

Supabase Dashboard > Authentication > URL Configuration

- [ ] Site URL を `https://hana-nav.jp` に変更
- [ ] Redirect URLs に以下を追加
  - `https://hana-nav.jp/auth/callback`
  - `https://*.vercel.app/auth/callback`（Preview 用）
  - `http://localhost:3000/auth/callback`（ローカル用）

### Email Templates 日本語化

Supabase Dashboard > Authentication > Email Templates

各テンプレを hana nav ブランディング・日本語に統一する。`{{ .ConfirmationURL }}` / `{{ .SiteURL }}` / `{{ .Email }}` などプレースホルダはそのまま使う。

- [ ] **Confirm signup**（サインアップ確認）
- [ ] **Reset Password**（パスワードリセット）
- [ ] **Change Email Address**（メールアドレス変更）
- [ ] Magic Link / Invite User は採用時のみ
- [ ] From Name を `hana nav` に変更

### Custom SMTP

Supabase デフォルト SMTP は送信レート上限と差出人ドメインの信頼性が低いため本番では切り替える。

1. SMTP プロバイダ選定（**Resend** 推奨。SendGrid / AWS SES でも可）
2. プロバイダ側で送信ドメイン（例：`hana-nav.jp`）を追加し、SPF / DKIM / DMARC レコードを取得
3. レジストラ DNS にレコードを登録
4. プロバイダ側で「Verified」になったことを確認
5. Supabase Dashboard > Project Settings > Auth > SMTP Settings で以下を入力
   - Sender email: `noreply@hana-nav.jp`
   - Sender name: `hana nav`
   - Host / Port / Username / Password: プロバイダの値

- [ ] DNS に SPF / DKIM / DMARC を登録
- [ ] プロバイダ管理画面でドメインが Verified
- [ ] Supabase に SMTP 設定を入力
- [ ] テスト送信：実アドレスでサインアップ → 受信トレイ / 迷惑メールフォルダを確認
  - [ ] Gmail
  - [ ] iCloud
  - [ ] 携帯キャリア（docomo / au / softbank いずれか）

### Google OAuth Redirect

Google Cloud Console > APIs & Services > Credentials > OAuth 2.0 Client IDs

- [ ] Authorized redirect URIs に Supabase の callback URL（`https://<project-ref>.supabase.co/auth/v1/callback`）が登録されているか確認
- [ ] 本番アプリのドメインを「Authorized JavaScript origins」に追加（`https://hana-nav.jp`）

---

## 4. コスト監視・アラート

### Google Cloud 月予算アラート（**必須**）

Gemini / Maps の暴走対策。最重要。

1. Google Cloud Console > Billing > Budgets & alerts > Create Budget
2. Scope: 該当プロジェクトの全サービス
3. Amount: **¥5,000 / 月**
4. Threshold rules: 50% / 90% / 100% でメール通知

- [ ] 予算アラート設定済み
- [ ] 通知先メールアドレスが受信可能

### Sentry（任意・推奨）

- [ ] Sentry プロジェクト作成
- [ ] `@sentry/nextjs` 導入は別チケットで（ローンチ後でも可。Vercel Logs で代替可能）

### Supabase DB サイズ監視

- [ ] Supabase Dashboard > Project Settings > Usage で DB サイズが 500MB 無料枠の何 % か確認
- [ ] 80% 超過時のアラート設定（プランによってはダッシュボード通知のみ）

---

## 5. セキュリティ最終確認

コード側の監査はチケット [21](./21_deploy-launch.md) で完了済み。残るは本番 DB / 設定の確認。

- [ ] Supabase Dashboard > Table Editor で全テーブルが RLS Enabled になっている（ガード行が green）
- [ ] Supabase Dashboard > Authentication > Users で本番管理者を 1 名作成
  - 該当ユーザーの `profiles.role` を SQL Editor で `'admin'` に更新
  - SQL: `UPDATE profiles SET role = 'admin' WHERE id = '<user-uuid>';`
- [ ] 本番ドメインで `/admin` にアクセス → 非管理者は `/` にリダイレクトされる
- [ ] 本番ドメインで `/mypage` にアクセス → 未ログインは `/auth/login` にリダイレクトされる
- [ ] `/api/admin/*` を未ログインで叩く → 401 / リダイレクト

---

## 6. SEO 最終確認

- [ ] Google Search Console にプロパティ追加（ドメイン or URL プレフィックス）
- [ ] DNS TXT で所有権確認
- [ ] サイトマップ送信：`https://hana-nav.jp/sitemap.xml`
- [ ] robots.txt が `https://hana-nav.jp/robots.txt` で配信されている
- [ ] OGP 確認：[Twitter Card Validator](https://cards-dev.twitter.com/validator) / [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) に本番 URL を投入
- [ ] Lighthouse モバイル：Performance / SEO ともに 80+

---

## 7. 本番動作確認

実機・実ブラウザで一通り触る。

- [ ] サインアップ → 確認メール受信 → ログイン
- [ ] Google ログイン
- [ ] スポット検索 → 詳細ページ → ブックマーク
- [ ] AI 花判定（匿名 1/日、ログイン 3/日のレート制限が動く）
- [ ] 旅のしおり生成 → SNS シェア（iOS Safari / Android Chrome 実機）
- [ ] 管理画面 `/admin/*` が管理者でアクセス可、非管理者でブロック
- [ ] 404（`/this-page-does-not-exist`）でカスタム not-found 表示
- [ ] 500 ページのフォールバック確認

---

## 8. ローンチ後 24 時間の監視

- [ ] 初日：Vercel Logs を 1 時間ごとに確認、500 系エラーがないか
- [ ] AI 利用回数（`ai_usage_logs`）の急増を確認。バズ検知時は API キー無効化を即決
- [ ] Supabase DB サイズの推移
- [ ] Google Cloud Billing で当日使用額

---

## 緊急時 API キー無効化手順

コスト爆発・キー流出時は **即座に無効化**。詳細は [`specs/operations.md`](./specs/operations.md#緊急時-api-キー無効化手順) を参照。
