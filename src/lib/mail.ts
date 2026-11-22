/**
 * Outgoing mail via SMTP (env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM, MAIL_TO_RESTAURANT).
 * Without SMTP settings (local dev) mails are written to the server log instead. Failures never break a booking:
 * every submission is stored before mailing.
 */
import nodemailer from 'nodemailer';

const env = process.env;
const transport = env.SMTP_HOST
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: Number(env.SMTP_PORT || 465),
      secure: Number(env.SMTP_PORT || 465) === 465,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    })
  : null;

export const FROM = env.MAIL_FROM || 'Dat swarte Peerd <noreply@mein-ziel-bongsiel.de>';
/** Comma-separated list is fine here (the old plugin failed on lists). */
export const RESTAURANT = (env.MAIL_TO_RESTAURANT || 'reservierung@mein-ziel-bongsiel.de')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export async function send(to: string | string[], subject: string, text: string, replyTo?: string) {
  const list = (Array.isArray(to) ? to : [to]).filter(Boolean);
  if (!list.length) return;
  if (!transport) {
    console.log(`[mail:dev] to=${list.join(',')} subject=${subject}\n${text}\n`);
    return;
  }
  try {
    await transport.sendMail({ from: FROM, to: list, subject, text, replyTo });
  } catch (e) {
    console.error('[mail] failed', subject, e);
  }
}

export const esc = (s: unknown) =>
  String(s ?? '')
    .replace(/[\r\n]+/g, ' ')
    .trim();
