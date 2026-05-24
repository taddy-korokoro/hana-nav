# Supabase Auth メールテンプレート

Supabase Dashboard > Authentication > Email Templates に登録するメール本文の **master**。
ダッシュボードを編集する前に、まずこのファイルを更新して PR にする。

## 運用フロー

1. このファイルを編集して PR を出す（差分レビュー）
2. PR マージ後、編集者が **Supabase Dashboard > Authentication > Email Templates** に貼り直す
   - 件名（Subject）・本文（Message Body）・差出名（From Name）の 3 つを反映
3. 実アドレス（Gmail / 携帯キャリアいずれか）でテスト送信して着信確認
4. 同じ操作を本番プロジェクトに対しても実施（プロジェクトが分かれている場合）

> Supabase のテンプレ反映はダッシュボード手動。Management API でも更新できるが MVP では手動で運用する。

## 共通方針

- **差出名（From Name / Sender name）**: `hana nav`
- **送信元アドレス**: `hananav.noreply@gmail.com`（Gmail SMTP を Supabase の Custom SMTP として使用）
  - Supabase Default SMTP では `Sender name` を変更できない UI 仕様のため、MVP でも Custom SMTP を有効化している
  - 設定手順は [`launch-runbook.md` §3「Custom SMTP（Gmail）設定」](./launch-runbook.md#custom-smtpgmail設定)
  - 独自ドメイン `hananav.site` 自体は MVP で取得済みだが、`hananav.site` を送信元とする本格 Custom SMTP（Resend + SPF/DKIM/DMARC）は v2 送り
- **言語**: 日本語
- **トーン**: 丁寧・簡潔。装飾・画像は使わない（迷惑メール判定回避）
- **リンク**: `{{ .ConfirmationURL }}` をそのまま埋め込む（Supabase が署名付き URL を生成）

## 使える変数

Supabase が自動で展開する変数。テンプレ内で `{{ .VarName }}` の形で書く。

| 変数                     | 内容                                        | 使えるテンプレ            |
| ------------------------ | ------------------------------------------- | ------------------------- |
| `{{ .ConfirmationURL }}` | アクション完了用の署名付き URL              | すべて                    |
| `{{ .Token }}`           | 6 桁 OTP（リンクの代わりに OTP を出す場合） | すべて                    |
| `{{ .TokenHash }}`       | OTP のハッシュ。OTP 検証 API に渡す         | すべて                    |
| `{{ .SiteURL }}`         | Supabase Dashboard で設定した Site URL      | すべて                    |
| `{{ .Email }}`           | 受信者のメールアドレス                      | すべて                    |
| `{{ .NewEmail }}`        | 変更後のメールアドレス                      | Change Email Address のみ |
| `{{ .Data }}`            | サインアップ時に渡したメタデータ            | Confirm signup のみ       |
| `{{ .RedirectTo }}`      | リダイレクト先 URL                          | すべて                    |

---

## 1. Confirm signup（サインアップ確認）

**用途**: Email + パスワードでサインアップした直後の確認メール。

**Subject**:

```
【hana nav】メールアドレスを確認してください
```

**Message Body (HTML)**:

```html
<h2>hana nav へようこそ</h2>
<p>{{ .Email }} で hana nav にご登録いただきありがとうございます。</p>
<p>以下のリンクをクリックしてメールアドレスを確認し、登録を完了してください。</p>
<p>
  <a href="{{ .ConfirmationURL }}">メールアドレスを確認する</a>
</p>
<p>このリンクの有効期限は 24 時間です。</p>
<p>このメールに心当たりがない場合は、お手数ですがそのまま破棄してください。</p>
<hr />
<p style="color: #888; font-size: 12px">hana nav — 日本の花畑スポットを見つけるサービス</p>
```

---

## 2. Reset Password（パスワード再設定）

**用途**: `/auth/forgot-password` などからパスワード再設定を依頼したとき。

**Subject**:

```
【hana nav】パスワード再設定のご案内
```

**Message Body (HTML)**:

```html
<h2>パスワード再設定のご案内</h2>
<p>{{ .Email }} のアカウントで、パスワード再設定のリクエストを受け付けました。</p>
<p>以下のリンクから新しいパスワードを設定してください。</p>
<p>
  <a href="{{ .ConfirmationURL }}">パスワードを再設定する</a>
</p>
<p>このリンクの有効期限は 1 時間です。</p>
<p>
  心当たりがない場合は、このメールを破棄してください。アカウントの安全のため、パスワードは変更されません。
</p>
<hr />
<p style="color: #888; font-size: 12px">hana nav</p>
```

---

## 3. Change Email Address（メールアドレス変更）

**用途**: マイページからメールアドレス変更を依頼したとき。**変更前・変更後の両方** に確認メールが送られる（Supabase の "Secure email change" が ON の場合）。

**Subject**:

```
【hana nav】メールアドレス変更の確認
```

**Message Body (HTML)**:

```html
<h2>メールアドレス変更の確認</h2>
<p>
  hana nav のアカウントで、メールアドレスを
  <strong>{{ .NewEmail }}</strong> に変更するリクエストを受け付けました。
</p>
<p>以下のリンクをクリックして変更を完了してください。</p>
<p>
  <a href="{{ .ConfirmationURL }}">メールアドレスを変更する</a>
</p>
<p>このリンクの有効期限は 24 時間です。</p>
<p>変更を依頼していない場合は、このメールを破棄してください。</p>
<hr />
<p style="color: #888; font-size: 12px">hana nav</p>
```

---

## 4. Magic Link（採用する場合のみ）

> MVP では Email + パスワード認証と Google OAuth のみを使用するため、**Magic Link は無効化** している。
> 採用する場合のテンプレ案を残しておく。

**Subject**:

```
【hana nav】ログイン用リンクをお送りします
```

**Message Body (HTML)**:

```html
<h2>ログイン用リンク</h2>
<p>{{ .Email }} のアカウントへログインするためのリンクです。</p>
<p>
  <a href="{{ .ConfirmationURL }}">hana nav にログインする</a>
</p>
<p>このリンクの有効期限は 1 時間です。</p>
<p>心当たりがない場合は、このメールを破棄してください。</p>
<hr />
<p style="color: #888; font-size: 12px">hana nav</p>
```

---

## 5. Invite User（管理者招待・採用する場合のみ）

> MVP では管理者は Supabase Dashboard 経由で手動で `profiles.role = 'admin'` を立てる運用とし、Invite フローは使わない。
> 将来 Invite を有効化する場合のテンプレ案。

**Subject**:

```
【hana nav】管理者アカウントへのご招待
```

**Message Body (HTML)**:

```html
<h2>管理者アカウントへのご招待</h2>
<p>hana nav の管理者として招待されました。</p>
<p>以下のリンクからパスワードを設定し、アカウントを有効化してください。</p>
<p>
  <a href="{{ .ConfirmationURL }}">アカウントを有効化する</a>
</p>
<p>このリンクの有効期限は 24 時間です。</p>
<hr />
<p style="color: #888; font-size: 12px">hana nav</p>
```

---

## テスト送信チェックリスト

テンプレ更新後、本番反映前に必ず実施。

- [ ] Gmail で受信 → 件名・本文の改行・リンク遷移を確認
- [ ] 携帯キャリア（docomo / au / softbank いずれか）で受信 → 迷惑メール扱いされていないか
- [ ] リンク先が想定の `{{ .SiteURL }}` ベースに展開されている
- [ ] 24 時間経過後にリンクが失効する（少なくとも Confirm signup で確認）
- [ ] 差出名が `hana nav` で表示される

## 参考

- Supabase 公式: [Auth Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- 反映先プロジェクトの URL: `https://supabase.com/dashboard/project/<project-ref>/auth/templates`
- ローンチ作業全体は [`launch-runbook.md`](./launch-runbook.md) §3 参照
