/**
 * Gmail SMTP（Supabase Custom SMTP と同じ認証情報）経由でメール送信する薄いラッパ。
 *
 * - サーバー専用。Server Action / Route Handler / バッチ以外から触らない。
 * - 失敗時は throw せずに `{ ok: false }` を返す。呼び出し側で DB 保存と分離して、
 *   メール失敗時もユーザーへの成功表示は維持する（受信履歴は admin 画面で確認できる前提）。
 * - SMTP_* と CONTACT_NOTIFICATION_TO のどれかが欠けていれば `{ ok: false }` を返し
 *   `console.warn` で原因を残す。
 *
 * 環境変数:
 *   SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS
 *   CONTACT_NOTIFICATION_TO   通知の送信先（運用 Gmail）
 */

import nodemailer from 'nodemailer';

type SendResult = { ok: true } | { ok: false; reason: string };

let cachedTransporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (cachedTransporter) return cachedTransporter;
  const host = process.env.SMTP_HOST?.trim();
  const port = process.env.SMTP_PORT?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  if (!host || !port || !user || !pass) {
    return null;
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: false, // 587 は STARTTLS（secure=false で OK、自動でアップグレード）
    auth: { user, pass },
  });
  return cachedTransporter;
}

export type SendContactNotificationInput = {
  /** 受信した contact_messages.id */
  contactId: string;
  name: string;
  email: string;
  categoryLabel: string;
  message: string;
  referenceUrl?: string | null;
};

/**
 * 運用 Gmail（`CONTACT_NOTIFICATION_TO`）宛にお問い合わせ通知を送る。
 * 件名・本文は plain text のみ（HTML は使わない：font 崩れ・spam 判定の回避）。
 */
export async function sendContactNotification(
  input: SendContactNotificationInput,
): Promise<SendResult> {
  const to = process.env.CONTACT_NOTIFICATION_TO?.trim();
  const from = process.env.SMTP_USER?.trim();

  if (!to || !from) {
    console.warn('[mailer] CONTACT_NOTIFICATION_TO or SMTP_USER is not set. Skipping.', {
      hasTo: Boolean(to),
      hasFrom: Boolean(from),
    });
    return { ok: false, reason: 'env_missing' };
  }

  const transporter = getTransporter();
  if (!transporter) {
    console.warn('[mailer] SMTP_* env is not fully set. Skipping.');
    return { ok: false, reason: 'env_missing' };
  }

  const subject = `[hana nav] お問い合わせ受信: ${input.categoryLabel}`;
  const text = [
    `カテゴリ: ${input.categoryLabel}`,
    `名前: ${input.name}`,
    `メール: ${input.email}`,
    input.referenceUrl ? `関連 URL: ${input.referenceUrl}` : null,
    '',
    '本文:',
    input.message,
    '',
    '----',
    `Contact ID: ${input.contactId}`,
    `Admin: https://hananav.site/admin/contact/${input.contactId}`,
  ]
    .filter((line) => line !== null)
    .join('\n');

  try {
    await transporter.sendMail({
      from: `"hana nav" <${from}>`,
      to,
      subject,
      text,
    });
    return { ok: true };
  } catch (error) {
    console.warn('[mailer] sendMail failed', { error });
    return { ok: false, reason: 'send_failed' };
  }
}

export type SendContactReplyInput = {
  to: string;
  subject: string;
  body: string;
};

/**
 * 管理者からお問い合わせユーザー宛に返信メールを送る。
 * From は SMTP_USER（運用 Gmail）。Reply-To も同じ Gmail にして、ユーザーが
 * メーラーで返信を打ち返すと運用宛に届く動線を作る（noreply ではあるが運用が読んでいる前提）。
 */
export async function sendContactReply(input: SendContactReplyInput): Promise<SendResult> {
  const from = process.env.SMTP_USER?.trim();
  if (!from) {
    console.warn('[mailer] SMTP_USER is not set. Skipping reply.');
    return { ok: false, reason: 'env_missing' };
  }

  const transporter = getTransporter();
  if (!transporter) {
    console.warn('[mailer] SMTP_* env is not fully set. Skipping reply.');
    return { ok: false, reason: 'env_missing' };
  }

  try {
    await transporter.sendMail({
      from: `"hana nav" <${from}>`,
      replyTo: from,
      to: input.to,
      subject: input.subject,
      text: input.body,
    });
    return { ok: true };
  } catch (error) {
    console.warn('[mailer] sendContactReply failed', { error });
    return { ok: false, reason: 'send_failed' };
  }
}
