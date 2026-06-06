/**
 * Gmail SMTP（Supabase Custom SMTP と同じ認証情報）経由でメール送信する薄いラッパ。
 *
 * - サーバー専用。Server Action / Route Handler / バッチ以外から触らない。
 * - 失敗時は throw せずに `{ ok: false }` を返す。呼び出し側で DB 保存と分離して、
 *   メール失敗時もユーザーへの成功表示は維持する（受信履歴は admin 画面で確認できる前提）。
 *
 * 環境変数（必要最小限の 2 つ）:
 *   - SMTP_USER  例: hananav.noreply@gmail.com
 *   - SMTP_PASS  Gmail アプリパスワード（Supabase Custom SMTP と同じ）
 *
 * 設計判断:
 *   - SMTP ホスト・ポートは Gmail 固定（`smtp.gmail.com:587`）なので env ではなく定数化。
 *     Resend / SendGrid 等への移行時はこのファイルを書き換える。
 *   - お問い合わせ通知の宛先は `SMTP_USER` 自身（運用 Gmail に自己宛で送る）に固定する。
 *     別宛先に転送したくなったら envに `CONTACT_NOTIFICATION_TO` を復活させる想定。
 */

import nodemailer from 'nodemailer';

const SMTP_HOST = 'smtp.gmail.com';
const SMTP_PORT = 587;

type SendResult = { ok: true } | { ok: false; reason: string };

let cachedTransporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (cachedTransporter) return cachedTransporter;
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  if (!user || !pass) {
    return null;
  }

  cachedTransporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
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
 * 運用 Gmail（`SMTP_USER` 自身宛）にお問い合わせ通知を送る。
 * 件名・本文は plain text のみ（HTML は使わない：font 崩れ・spam 判定の回避）。
 */
export async function sendContactNotification(
  input: SendContactNotificationInput,
): Promise<SendResult> {
  const from = process.env.SMTP_USER?.trim();

  if (!from) {
    console.warn('[mailer] SMTP_USER is not set. Skipping notification.');
    return { ok: false, reason: 'env_missing' };
  }

  const transporter = getTransporter();
  if (!transporter) {
    console.warn('[mailer] SMTP_USER or SMTP_PASS is not set. Skipping notification.');
    return { ok: false, reason: 'env_missing' };
  }

  // 管理画面リンクは sitemap / OGP 等で既に使っている NEXT_PUBLIC_BASE_URL を再利用。
  // env を増やさず本番固定の直書きも避ける。Preview Deploy では引き続き本番 URL を
  // 指してしまう制約は残るが、MVP 用途では許容範囲とする。
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.trim() ?? '';
  const adminLink = baseUrl ? `${baseUrl}/admin/contact/${input.contactId}` : null;

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
    adminLink ? `Admin: ${adminLink}` : null,
  ]
    .filter((line) => line !== null)
    .join('\n');

  try {
    await transporter.sendMail({
      from: `"hana nav" <${from}>`,
      to: from, // 自己宛
      subject,
      text,
    });
    return { ok: true };
  } catch (error) {
    console.warn('[mailer] sendContactNotification failed', { error });
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
    console.warn('[mailer] SMTP_USER or SMTP_PASS is not set. Skipping reply.');
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
