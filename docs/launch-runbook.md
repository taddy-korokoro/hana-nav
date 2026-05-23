# ローンチ作業手順書（runbook）

外部サービス側の設定手順をまとめたチェックリスト。**コード変更では完結しない作業**を集約している。チケット [21](./21_deploy-launch.md) と対応。

実施したらこのファイルの `[ ]` を `[x]` に更新する。

> **MVP 方針**
>
> - 本番 URL は **`https://hananav.site`**（ムームードメインで取得した独自ドメイン）。Vercel が払い出す `*.vercel.app` の URL は OAuth ブランディング検証や SEO 観点で不利なため、MVP の段階で独自ドメインを取得する判断にした。レジストラはムームードメイン、DNS もムームー DNS で運用。
> - 環境は **Production（Vercel）** と **Development（ローカル）** の 2 つだけ。Vercel の Preview Deployments は使わない（環境変数も登録しない）。
> - Supabase Auth のメール本文・件名・差出名は [`auth-email-templates.md`](./auth-email-templates.md) を master としてドキュメント管理する。Supabase Dashboard には docs を見ながら手動で貼り直す（§3「Email Templates 反映」参照）。
> - メール送信は **Gmail SMTP を Supabase の Custom SMTP として使用**（送信元：`hananav.noreply@gmail.com`、差出名：`hana nav`）。独自ドメインに紐づく本格 Custom SMTP（Resend + SPF/DKIM/DMARC）は **v2 送り**。Supabase Default SMTP では `Sender name` を変更できない UI 仕様のため、MVP でも Custom SMTP を有効化する。設定手順は §3「Custom SMTP（Gmail）設定」を参照。

---

## 0. 事前確認

- [x] `main` ブランチが緑（lint / build 通過）
- [x] `npm run build` がローカルで成功する
- [x] `is_published=true` のスポットが 100 件以上ある（チケット [18](./18_data-collector.md)）
- [x] flowers マスター 30 種類以上、各種に代表画像が 1 枚以上（チケット [16](./16_admin-content.md)）

---

## 1. Vercel デプロイ

### プロジェクト作成

1. <https://vercel.com/new> から GitHub リポジトリを連携
2. Framework Preset: **Next.js**（自動検出されるはず）
3. Build / Output 設定はデフォルトでよい
4. Environment Variables を登録（次節）
5. Vercel が払い出す `*.vercel.app` URL（例：`hana-nav-chi.vercel.app`）は HTTPS の動作確認用に控えておくが、本番 URL は §1 末尾の「独自ドメイン接続」で **`https://hananav.site`** に切り替える

### Preview Deployments を無効化（任意・推奨）

MVP では Preview を使わないため、PR ごとのビルドを止めてコストとビルド時間を節約する。

- [ ] Settings > Git > **Ignored Build Step** に `if [ "$VERCEL_GIT_COMMIT_REF" != "main" ]; then exit 0; else exit 1; fi` を入れる
  - もしくは Vercel ダッシュボードから Preview を OFF に切り替え（プランによる）

### 独自ドメイン接続（ムームードメイン × Vercel）

MVP の本番 URL は **`https://hananav.site`**。ムームードメインで取得し、ムームー DNS で運用する。

**1. ムームードメインでの DNS 設定**

- [x] ドメイン `hananav.site` を取得
- [x] ムームー コントロールパネル > **ドメイン操作 > ネームサーバ設定変更** で「GMOペパボ『ムームードメイン』のネームサーバを使用する」が選択されていることを確認
- [x] **ドメイン操作 > ムームー DNS** で `hananav.site` の **変更** をクリックし、「設定 2」（カスタム設定）に以下を登録

  | サブドメイン | 種別  | 内容                   | 優先度   |
  | ------------ | ----- | ---------------------- | -------- |
  | （空欄）     | A     | `76.76.21.21`          | （空欄） |
  | `www`        | CNAME | `cname.vercel-dns.com` | （空欄） |

  > Apex には CNAME を張れない（DNS 仕様）ため A レコード固定。ムームー DNS は ALIAS 非対応。Vercel が IP を変更した場合は Apex 側の手動更新が必要。値は Vercel Dashboard が示すものを優先する。

- [x] 「設定 1」（ムームーメール / ロリポップ用）は触らない
- [x] parking / forwarding 等の不要なレコードが残っていれば削除（衝突して HTTPS 発行が失敗するため）

**2. Vercel でのドメイン追加**

- [x] Vercel Dashboard > Project > **Settings > Domains** に `hananav.site` を追加
- [x] `www.hananav.site` も追加し、**Primary Domain を `hananav.site`**（Apex）に設定 → `www.hananav.site` は Apex に 301 リダイレクト
- [x] Domain ステータスが **Valid Configuration** + 鍵アイコン緑になるまで待つ（HTTPS 自動発行）
- [x] `https://hananav.site` / `https://www.hananav.site`（→ Apex にリダイレクト）でアクセスできることを確認

**3. Search Console 用 TXT レコード（§6 で後ほど使用）**

- [x] Google Search Console でドメイン所有権確認時に表示される `google-site-verification=...` TXT を、ムームー DNS の「設定 2」にサブドメイン空欄・種別 TXT で追加

### 環境変数登録（Vercel Dashboard > Settings > Environment Variables）

各キーを **Production のみ** に登録する。**Preview / Development には登録しない**（Development はローカルの `.env.local` を使う）。値は Supabase Dashboard / Google AI Studio から取得。

| Key                               | 環境       | 値の例 / 備考                                                                                              |
| --------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`        | Production | Supabase Project URL                                                                                       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | Production | anon public key                                                                                            |
| `SUPABASE_SERVICE_ROLE_KEY`       | Production | **Sensitive にチェック**。絶対に `NEXT_PUBLIC_` プレフィックスを付けない                                   |
| `GEMINI_API_KEY`                  | Production | **Sensitive にチェック**。Google AI Studio で発行                                                          |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Production | HTTP リファラー制限を `hananav.site` に掛けてから登録                                                      |
| `NEXT_PUBLIC_BASE_URL`            | Production | `https://hananav.site`（sitemap / robots / OGP の絶対 URL に使う。独自ドメイン接続が完了してから設定する） |

- [x] 上記 6 キーを **Production にのみ** 登録（Preview / Development のチェックは外す）
- [x] `SUPABASE_SERVICE_ROLE_KEY` / `GEMINI_API_KEY` が Sensitive で隠れていること
- [x] デプロイをトリガーして成功を確認（Deployments タブ）
- [x] Vercel の `*.vercel.app` URL でトップページ表示確認（独自ドメイン接続前の動作確認用）
- [x] 独自ドメイン接続後、`https://hananav.site` でトップページ表示確認

> `TZ` は Vercel の [予約環境変数](https://vercel.com/docs/environment-variables/reserved-environment-variables)（AWS Lambda 由来）で、登録するとエラーになる。本番ランタイムは UTC 固定で動くため、JST が必要な処理は `lib/utils/dateUtils.ts` のヘルパーを使う（詳細：[`specs/tech-stack.md`](./specs/tech-stack.md#タイムゾーン)）。

### Vercel Spend Management

MVP は基本 Hobby プランで運用する想定。Hobby と Pro で挙動が異なる。

**Hobby プランの場合**

Spend Management 機能は **使えない**（Pro 以上限定）。無料枠を超えると Vercel が自動で **プロジェクトを pause** する。明示設定は不要だが、自動 pause が走ると本番が止まるので Usage を監視する。

- [x] <https://vercel.com/dashboard/usage> で Bandwidth / Function Invocations / Edge Requests など主要メトリクスの残量を定期的に確認
- [x] Usage の閾値通知（Settings > Notifications > Usage）が有効になっていることを確認

**Pro 以上にアップグレードした場合**

`Spend Management` で月の上限金額と上限到達時のアクションを設定できる。Owner または Billing ロールが必要。

1. Vercel Dashboard でチームを選択 > **Settings > Billing** を開く
2. ページ内の **Spend Management** セクションのトグルを **Enabled** に切り替え
3. **Spend amount** に月の上限金額を USD で入力（hana nav MVP の目安：`$10`〜`$20`）
4. 上限到達時のアクションを 1 つ以上選ぶ
   - **Pause all projects** — 全プロジェクトの実行を停止（本番が落ちる代わりに追加課金ゼロを保証）
   - **Send notifications** — Owner / Billing ロールに通知メール
   - **Trigger a webhook URL** — Slack や PagerDuty に飛ばしたい場合
5. **Save** で確定
6. Usage Notifications（しきい値 50% / 90% / 100% など）も Settings > Notifications で有効化

チェックリスト：

- [ ] Settings > Billing > Spend Management が Enabled
- [ ] Spend amount が設定済み
- [ ] アクションに **Pause all projects** と **Send notifications** の両方を選択
- [ ] 通知の受信先（Owner / Billing ロールのメール）を確認
- [ ] Webhook を使う場合は URL を登録

> Hobby のままなら、Vercel 側のコスト爆発リスクは構造的に発生しない（無料枠超過＝自動 pause）。一方バックエンド側（Gemini / Maps / Supabase）の暴走はこの仕組みでは防げないので、次節の Google Cloud 月予算アラートと Supabase Usage 監視で必ずカバーする。
>
> 参考：[Vercel Spend Management](https://vercel.com/docs/spend-management) / [Hobby Plan limits](https://vercel.com/docs/plans/hobby)

---

## 2. Google Maps API リファラー制限

`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` は Client に露出するため、リファラーで縛る。

- [x] Google Cloud Console > APIs & Services > Credentials > Maps API キーを開く
- [x] Application restrictions: **HTTP referrers**
- [x] 以下のリファラーを許可
  - `https://hananav.site/*`
  - `https://www.hananav.site/*`
  - `http://localhost:3000/*`
- [x] API restrictions で Maps JavaScript API などプロジェクトで使う API のみに限定

---

## 3. Supabase Auth 本番設定

### Site URL / Redirect URLs

Supabase Dashboard > Authentication > URL Configuration

- [x] Site URL を `https://hananav.site` に設定
- [x] Redirect URLs に以下を登録（不要な URL は登録しない）
  - `https://hananav.site/auth/callback`
  - `http://localhost:3000/auth/callback`（ローカル用）

### Email Templates 反映

メール本文の master は [`auth-email-templates.md`](./auth-email-templates.md) で管理している。
このファイルを編集 → PR マージ → Supabase Dashboard に貼り直しの順で運用する。

- [x] [`auth-email-templates.md`](./auth-email-templates.md) を参照しながら以下を Dashboard に反映
  - [x] **Confirm signup**（サインアップ確認）— 件名 / 本文
  - [x] **Reset Password**（パスワード再設定）— 件名 / 本文
  - [x] **Change Email Address**（メールアドレス変更）— 件名 / 本文
- [x] テスト送信：実アドレスでサインアップ → 受信トレイ / 迷惑メールフォルダを確認
  - [x] Gmail
  - [x] 携帯キャリア（docomo / au / softbank いずれか）

> **`Sender name`（差出名）を `hana nav` に変更するには Custom SMTP の有効化が必要**。Supabase Default SMTP のままだと `Sender name` の入力欄が編集できないため、次節「Custom SMTP（Gmail）設定」をあわせて実施する。

### Custom SMTP（Gmail）設定

独自ドメイン `hananav.site` 自体は取得済みだが、Resend 等の本格 Custom SMTP（独自ドメイン送信元 + SPF/DKIM/DMARC）は **v2 送り**としている（メール到達率の問題が顕在化していないため）。MVP では Gmail SMTP を Supabase の Custom SMTP として使い、Sender name を `hana nav` に表示させる。

**1. 送信用 Gmail アカウントを準備**

- [x] 送信専用 Gmail を取得（hana nav では `hananav.noreply@gmail.com` を使用）
- [x] そのアカウントで **2 段階認証を有効化**（<https://myaccount.google.com/security>）
  - 2 段階認証が OFF だとアプリパスワードを発行できない
- [x] **アプリパスワードを発行**（<https://myaccount.google.com/apppasswords>）
  - アプリ名は任意（例：`hana-nav-supabase`）
  - 表示される 16 桁を控える（`abcd efgh ijkl mnop` の形式で表示される）

> ⚠️ **アプリパスワードはコピー時に空白が混入しやすい**。Supabase に貼る前に `abcdefghijklmnop` の **16 桁連続**になっていることを必ず確認する。スペースを含めて貼ると `535 5.7.8 Username and Password not accepted (BadCredentials)` で必ず失敗する。

**2. Supabase Dashboard に Custom SMTP を登録**

Authentication > Emails > SMTP Settings で「Enable Custom SMTP」を ON にして以下を入力：

| フィールド   | 値                                                        |
| ------------ | --------------------------------------------------------- |
| SMTP Host    | `smtp.gmail.com`                                          |
| SMTP Port    | `587`                                                     |
| SMTP User    | `hananav.noreply@gmail.com`                               |
| SMTP Pass    | アプリパスワード 16 桁（**空白なし**）                    |
| Sender email | `hananav.noreply@gmail.com`（SMTP User と完全一致させる） |
| Sender name  | `hana nav`                                                |

> Gmail SMTP は **`From` が SMTP 認証アカウントと一致しない送信を拒否**するため、`Sender email` と `SMTP User` は同じアドレスにする必要がある。

- [x] 上記 6 フィールドを入力
- [x] **Save** をクリック（`Host URL is required` 等のエラーが出ないこと）

**3. 動作確認**

- [x] アプリでサインアップを試行 → 確認メールが受信できる
- [x] 受信トレイで差出人が **`hana nav <hananav.noreply@gmail.com>`** と表示されている
- [x] Supabase Auth Logs（Dashboard > Logs > Auth Logs）に `Error sending confirmation email` が出ていない

**4. 送信制限の注意**

Gmail 通常アカウントの送信上限は **1 日あたり 500 通**（Google Workspace は 2,000 通）。MVP のスケールなら十分だが、急増した場合は本格 Custom SMTP（v2）への切替を前倒しする。

### Google OAuth Redirect

> 認可フローは「ユーザー → アプリ → Supabase → Google → Supabase → アプリ」。Google が叩く Redirect URI は **Supabase の URL**（アプリの URL ではない）。

**A. Google Cloud Console**

A-1. OAuth consent screen（APIs & Services > OAuth consent screen）

- [x] User Type: **External**
- [x] アプリ名: `hana nav`
- [x] ユーザーサポートメール / デベロッパー連絡先: 運用 Gmail
- [x] アプリのホームページ: `https://hananav.site/`
- [x] プライバシーポリシー URL: `https://hananav.site/privacy`
- [x] 利用規約 URL: `https://hananav.site/terms`
- [x] 承認済みドメイン: `hananav.site`
- [x] スコープは `openid` / `.../userinfo.email` / `.../userinfo.profile` のみ（他は審査が必要）
- [ ] 公開ステータス：Testing（Test users にテストアカウントを登録）→ Search Console で `hananav.site` の所有権確認後に **`PUBLISH APP`** で Production に切替

A-2. OAuth Client ID（APIs & Services > Credentials > Create Credentials > OAuth client ID）

- [x] Application type: **Web application**
- [x] Authorized JavaScript origins
  - `https://hananav.site`
  - `http://localhost:3000`
- [x] Authorized redirect URIs
  - `https://<project-ref>.supabase.co/auth/v1/callback` のみ（**アプリの `/auth/callback` は入れない**）

A-3. 発行情報の保管

- [x] **Client ID** をコピー
- [x] **Client Secret** をコピー（後から再表示できない）

**B. Supabase Dashboard**（Authentication > Providers > Google）

- [x] **Enable Sign in with Google** を ON
- [x] Client IDs に A-3 の Client ID を入力
- [x] Client Secret に A-3 の Client Secret を入力
- [x] 画面に表示される **Callback URL (for OAuth)** が A-2 の Authorized redirect URIs と **完全一致** していることを確認
- [x] Save

**E. 動作確認**

- [x] Testing 状態のときは Test users に自分の Google アカウントを登録済み
- [x] アプリ `/auth/login` で「Google でログイン」を押す → Google 同意画面が表示される
- [x] 同意後、`/auth/callback?code=...` 経由でアプリにログイン状態で戻る
- [x] Supabase Dashboard > Authentication > Users に Google アカウントのレコードが追加され、`raw_user_meta_data` に `email` / `name` 等が入っている
- [x] エラー時は Supabase Dashboard > Logs > Auth Logs と Google Cloud Console > APIs & Services > Credentials のイベント履歴を確認

---

## 4. コスト監視・アラート

### Google Cloud 月予算アラート（**必須**）

Gemini / Maps の暴走対策。最重要。

1. Google Cloud Console > Billing > Budgets & alerts > Create Budget
2. Scope: 該当プロジェクトの全サービス
3. Amount: **¥5,000 / 月**
4. Threshold rules: 50% / 90% / 100% でメール通知

- [x] 予算アラート設定済み
- [x] 通知先メールアドレスが受信可能

### Sentry（任意・推奨）

- [ ] Sentry プロジェクト作成
- [ ] `@sentry/nextjs` 導入は別チケットで（ローンチ後でも可。Vercel Logs で代替可能）

### Supabase DB サイズ監視

- [x] Supabase Dashboard > Project Settings > Usage で DB サイズが 500MB 無料枠の何 % か確認
- [ ] 80% 超過時のアラート設定（プランによってはダッシュボード通知のみ）

---

## 5. セキュリティ最終確認

コード側の監査はチケット [21](./21_deploy-launch.md) で完了済み。残るは本番 DB / 設定の確認。

### RLS 確認（2 段で実施）

- [x] **Supabase Dashboard > Advisors > Security Advisor** を開き、`RLS Disabled in Public` のヒットが **`spatial_ref_sys` のみ** であることを確認（後述の許容リスト運用）
- [x] **SQL Editor で以下の「許容リスト除外クエリ」を実行し、結果が 0 行**

  ```sql
  SELECT
    c.relname AS table_name,
    c.relrowsecurity AS rls_enabled,
    COALESCE(p.policy_count, 0) AS policy_count
  FROM pg_class c
  JOIN pg_namespace n ON c.relnamespace = n.oid
  LEFT JOIN (
    SELECT schemaname, tablename, COUNT(*) AS policy_count
    FROM pg_policies GROUP BY schemaname, tablename
  ) p ON p.schemaname = n.nspname AND p.tablename = c.relname
  WHERE c.relkind = 'r'
    AND n.nspname = 'public'
    AND c.relname NOT IN ('spatial_ref_sys')   -- PostGIS 仕様のため許容
    AND (NOT c.relrowsecurity OR COALESCE(p.policy_count, 0) = 0)
  ORDER BY c.relname;
  ```

  許容リスト（`NOT IN (...)`）以外で `rls_enabled = false` または `policy_count = 0` のテーブルがあると結果に出る。新たに許容したい既知ケースが増えたらリストを拡張する。

> **`spatial_ref_sys`（PostGIS）の扱い ― 許容運用**
>
> PostGIS 拡張が作成するシステムテーブル（SRID リファレンス）。Supabase の通常クライアント権限・MCP（service role）からは `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` を打てず（所有者は拡張側）、Dashboard の SQL Editor（postgres ロール）でも環境によっては `42501: must be owner of table` で弾かれる。
>
> エンドユーザー側に書き込み経路がない（PostGIS 内部の参照テーブル）ため、**Advisor の警告は許容**して進める。Supabase Dashboard の現行 UI には個別 issue の Dismiss / Ignore ボタンが見当たらないため、確認は上の「許容リスト除外クエリ」で代替し、月次の確認時には Advisor 画面に `spatial_ref_sys` 以外のヒットが出ていないことを目視する運用にする。
>
> 将来 Supabase 側で書き換え権限が開放されたら、以下の SQL を Dashboard の SQL Editor から実行して許容リストから外す：
>
> ```sql
> ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;
> CREATE POLICY "Allow public read access to spatial_ref_sys"
>   ON public.spatial_ref_sys FOR SELECT USING (true);
> ```

### その他のセキュリティ確認

- [x] Supabase Dashboard > Authentication > Users で本番管理者を 1 名作成
  - 該当ユーザーの `profiles.role` を SQL Editor で `'admin'` に更新
  - SQL: `UPDATE profiles SET role = 'admin' WHERE id = '<user-uuid>';`
- [x] 本番 URL で `/admin` にアクセス → 非管理者は `/` にリダイレクトされる
- [x] 本番 URL で `/mypage` にアクセス → 未ログインは `/auth/login` にリダイレクトされる
- [x] `/api/admin/*` を未ログインで叩く → 401 / リダイレクト

---

## 6. SEO 最終確認

- [x] Google Search Console にプロパティ追加。**プロパティタイプは「ドメイン」を選択**（`hananav.site` 入力でワイルドカード対応）
- [x] 表示される TXT レコードをムームー DNS の「設定 2」にサブドメイン空欄・種別 TXT で追加し、所有権確認を完了
- [x] サイトマップ送信：`https://hananav.site/sitemap.xml`
- [x] robots.txt が `https://hananav.site/robots.txt` で配信されている
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

---

## v2 で再検討する項目

MVP では実施しないが、ユーザーが定着してきたら順次着手。

- 本格 Custom SMTP（Resend など）+ `hananav.site` 送信元の **SPF / DKIM / DMARC** 設定で送信ドメインを独自化（Gmail SMTP からの卒業）
- Vercel Preview Deployments を活用したステージング運用
- 商標調査（`hananav` 表記のリスク確認。本格マーケティング前に実施）
- `.com` / `.jp` 等の追加ドメイン取得 + 301 リダイレクト（SEO・ブランド保護の観点で）
