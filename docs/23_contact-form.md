# 23. お問い合わせフォーム

## 概要

ユーザーから運用へお問い合わせ・ご要望・不具合報告を送れるフォーム、および管理者が一覧・詳細・返信を扱う管理画面を実装する。

## 設置箇所

| 配置                  | 用途                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------ |
| `/contact`            | ユーザー向け送信フォーム（名前・メール・カテゴリ・関連 URL[任意]・本文・プライバシー同意）。匿名でも送信可。 |
| `/contact/thanks`     | 送信完了。お問い合わせ番号（`contact_messages.id`）を表示。`robots: noindex`。                               |
| `/admin/contact`      | 管理者向け一覧。ステータス（NEW / IN_PROGRESS / RESOLVED）絞り込み。                                         |
| `/admin/contact/[id]` | 管理者向け詳細。本文表示・**SMTP 経由の返信**・status 切替。                                                 |

## 関連ファイル

### 新規

- `supabase/migrations/20260606000001_contact_messages.sql` — メイン受信箱テーブル + RLS + index
- `supabase/migrations/20260606000002_contact_replies.sql` — 管理者の返信履歴テーブル + RLS
- `supabase/migrations/20260606000003_contact_replies_insert_policy.sql` — admin INSERT ポリシー追加
- `app/(site)/contact/page.tsx` / `actions.ts` / `_components/ContactForm.tsx` / `thanks/page.tsx`
- `app/admin/contact/page.tsx` / `[id]/page.tsx` / `actions.ts` / `_components/ContactReplyForm.tsx`
- `lib/contact/constants.ts` — Server/Client 共用 enum
- `lib/queries/contact.ts` — admin 用クエリ + レート制限カウント
- `lib/email/mailer.ts` — nodemailer 経由の SMTP ラッパ

### 変更

- `components/layout/site-footer.tsx` — `mailto:` → `/contact` 内部リンク
- `app/admin/_components/admin-nav.tsx` — admin nav に「お問い合わせ」追加
- `lib/constants/copy.ts` — `contact.*` と `admin.contact.*` を追加
- `.env.example` / `README.md` — SMTP 用 env を 2 つ追加
- `docs/specs/database.md` — `contact_messages` のスキーマを追記

## 環境変数

```bash
SMTP_USER=hananav.noreply@gmail.com   # 運用 Gmail
SMTP_PASS=                            # Gmail アプリパスワード（Supabase Custom SMTP と同じ）
```

- SMTP ホスト・ポート（`smtp.gmail.com:587`）は `lib/email/mailer.ts` で定数化（env 不要）
- 通知メールの宛先は `SMTP_USER` 自身宛で固定（別宛先転送は env を復活させれば対応可）

## アンチスパム

- **honeypot**: フォームに隠しフィールド `website` を仕込み、値が入っていたら静かに成功扱いで弾く
- **NG ワード**: `lib/ng-words.ts` を本文に適用し、検知時はバリデーションで弾く
- **レート制限**: 同一 `user_id`（ログイン）または同一 `email`（匿名）から **直近 24 時間で 3 件まで**

## ユーザー返信（受信側）の扱い

### 現状（MVP / A 案）

管理者が `/admin/contact/[id]` から SMTP 経由で送る返信メールは、`Reply-To: SMTP_USER` を立てているため、ユーザーが「返信」を打ち返すと **運用 Gmail の受信トレイに届く**。MVP 段階ではここで完結させ、ユーザー返信を管理画面に取り込む処理は実装しない。

| 項目                           | 場所                            |
| ------------------------------ | ------------------------------- |
| ユーザーの新規お問い合わせ     | 管理画面 `/admin/contact`       |
| 管理者からユーザーへの返信     | 管理画面 `/admin/contact/[id]`  |
| **ユーザーから管理者への返信** | **運用 Gmail の受信トレイのみ** |

監査・追跡は Gmail のスレッドで行う。必要があれば返信内容を手動で `contact_replies` に転記する運用も可能。

### 将来（B 案：Gmail API ポーリングで取り込み）

流量が増えて Gmail を開かないと運用が回らなくなったタイミングでアップグレードする想定。実装の流れ:

1. Gmail API（OAuth2 / Service Account）で運用 Gmail の受信トレイを定期ポーリング
2. 件名 or `In-Reply-To` ヘッダ or 本文内に埋め込んだ contact_messages.id をキーに、元のお問い合わせと突き合わせ
3. 新規返信を `contact_replies`（または新規 `contact_inbound` テーブル）に保存し、`contact_messages.status` を自動更新
4. 管理画面の `/admin/contact/[id]` でスレッド全体を時系列表示

判断ポイント:

- ポーリング間隔：5〜10 分が現実的（Gmail API には quota がある）
- 認証：Service Account より OAuth2 が無難（運用者 Gmail なので個人 Google アカウントで承認）
- 重複検知：`Message-ID` ヘッダを `contact_replies` に保存して二重取り込みを防ぐ
- DB スキーマ変更：`contact_replies.direction`（`OUTBOUND` / `INBOUND`）等で送信/受信を区別

## DB スキーマ

`docs/specs/database.md` を参照（`contact_messages` / `contact_replies`）。

## TODO

- [x] `contact_messages` / `contact_replies` テーブル作成 + RLS
- [x] `/contact` フォーム実装（honeypot / NG ワード / レート制限）
- [x] `/contact/thanks` 完了ページ
- [x] `/admin/contact` 一覧・詳細
- [x] 管理画面からの返信機能（SMTP 経由 + 履歴保存 + status 自動昇格）
- [x] フッターと admin nav の動線追加
- [x] env を必要最小限の 2 つに削減
- [ ] **B 案アップグレード**：Gmail API ポーリングでユーザー返信を `contact_replies` に取り込む（流量増加後に着手）
