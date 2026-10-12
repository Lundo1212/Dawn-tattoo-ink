import nodemailer from "nodemailer";

type BookingEmailData = {
  name: string;
  email: string;
  ticketNumber: string;
  service: string;
  depositAmount: number;
  date: string;
  time: string;
  paymentMethod: string;
};

const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
const getAppUrl = () =>
  (process.env.APP_URL || "https://dawn-tattoo-ink.vercel.app").replace(/\/+$/, "");

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");

function createEmailLayout({
  title,
  intro,
  buttonText,
  buttonUrl,
  cta,
}: {
  title: string;
  intro: string;
  buttonText: string;
  buttonUrl: string;
  cta: string;
}) {
  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(title)}</title>
      </head>
      <body style="margin:0; background:#120d0b; font-family: Arial, Helvetica, sans-serif; color:#f5efe7;">
        <div style="max-width:640px; margin:0 auto; padding:32px 20px; background:linear-gradient(135deg,#120d0b,#1d120d 35%,#2d1e15 100%);">
          <div style="background:#111111; border:1px solid rgba(247,191,84,.3); border-radius:18px; overflow:hidden;">
            <div style="background:linear-gradient(90deg,#f7bf54,#d69a2a); color:#120d0b; padding:18px 24px; text-align:center; font-weight:700; letter-spacing:0.12em; text-transform:uppercase;">
              Dawn Tattoo Ink
            </div>
            <div style="padding:32px 24px 24px;">
              <h1 style="margin:0 0 16px; color:#f7bf54; font-size:28px; letter-spacing:0.04em;">${escapeHtml(title)}</h1>
              <p style="margin:0 0 18px; line-height:1.7; color:#f4efe8; font-size:16px;">${escapeHtml(intro)}</p>
              <div style="background:#1a1a1a; border:1px solid rgba(247,191,84,.2); border-radius:12px; padding:18px; margin:20px 0;">
                <p style="margin:0 0 10px; color:#d9d0c6; font-size:13px; text-transform:uppercase; letter-spacing:0.08em;">Next step</p>
                <p style="margin:0; font-size:18px; color:#ffffff; font-weight:600; line-height:1.5;">${escapeHtml(cta)}</p>
              </div>
              <div style="text-align:center; margin:28px 0 10px;">
                <a href="${escapeHtml(buttonUrl)}" style="display:inline-block; background:#f7bf54; color:#120d0b; text-decoration:none; font-weight:700; border-radius:999px; padding:14px 26px;">${escapeHtml(buttonText)}</a>
              </div>
              <p style="margin:24px 0 0; line-height:1.7; color:#d9d0c6;">Warm regards,<br /><strong>The Dawn Tattoo Ink team</strong></p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

async function sendConfiguredEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error("Email delivery is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS.");
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || smtpUser,
    to,
    subject,
    text,
    html,
  });
}

export async function sendBookingReminderEmail({
  name,
  email,
  ticketNumber,
  service,
  depositAmount,
  date,
  time,
  paymentMethod,
}: BookingEmailData) {
  const appUrl = getAppUrl();
  const buttonUrl = `${appUrl}/track?ticketNumber=${encodeURIComponent(ticketNumber)}`;
  const subject = `Payment required: ${ticketNumber}`;
  const html = createEmailLayout({
    title: "Payment Required",
    intro: `Dear ${name}, thank you for choosing Dawn Tattoo Ink. We have received your appointment request for ${service}. To confirm your booking and have your ticket issued, please pay the ${paymentMethod} deposit of ${formatCurrency(depositAmount)}.`,
    buttonText: "Track Booking or Pay Deposit",
    buttonUrl,
    cta: `Ticket: ${ticketNumber} • ${date} at ${time}`,
  });

  await sendConfiguredEmail({
    to: email,
    subject,
    html,
    text: `Dear ${name},\n\nThank you for choosing Dawn Tattoo Ink. We have received your appointment request for ${service} on ${date} at ${time}. Please pay the ${formatCurrency(depositAmount)} ${paymentMethod} deposit so we can confirm your booking and issue your ticket.\n\nTicket number: ${ticketNumber}\nTrack your booking or pay your deposit: ${buttonUrl}\n\nWarm regards,\nThe Dawn Tattoo Ink team`,
  });
}

export async function sendPaymentConfirmationEmail({
  name,
  email,
  ticketNumber,
  service,
  date,
  time,
  paymentMethod,
}: BookingEmailData) {
  const appUrl = getAppUrl();
  const buttonUrl = `${appUrl}/track?ticketNumber=${encodeURIComponent(ticketNumber)}`;
  const subject = `Welcome to Dawn Tattoo Ink — payment confirmed for ${ticketNumber}`;
  const html = createEmailLayout({
    title: "Welcome to Dawn Tattoo Ink",
    intro: `Dear ${name}, thank you for choosing Dawn Tattoo Ink. Your deposit payment for ${service} has been received and your appointment on ${date} at ${time} is confirmed. We warmly welcome you to our studio and look forward to helping bring your vision to life.`,
    buttonText: "Track Your Booking",
    buttonUrl,
    cta: `Ticket: ${ticketNumber} • ${date} at ${time} • Payment: ${paymentMethod}`,
  });

  await sendConfiguredEmail({
    to: email,
    subject,
    html,
    text: `Dear ${name},\n\nWelcome to Dawn Tattoo Ink, and thank you for choosing our studio. Your deposit payment for ${service} on ${date} at ${time} has been confirmed. We look forward to welcoming you and helping bring your vision to life.\n\nTicket number: ${ticketNumber}\nTrack your booking: ${buttonUrl}\n\nWarm regards,\nThe Dawn Tattoo Ink team`,
  });
}

export async function sendVisitorQuestionResponseEmail({
  name,
  email,
  question,
  response,
}: {
  name: string;
  email: string;
  question: string;
  response: string;
}) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error("Email delivery is not configured. Add SMTP settings before replying.");
  }

  const greeting = name ? `Hi ${escapeHtml(name)},` : "Hello,";
  const subject = "A reply from Dawn Tattoo Ink";
  const html = `
    <!doctype html>
    <html lang="en">
      <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
      <body style="margin:0;background:#120d0b;font-family:Arial,Helvetica,sans-serif;color:#f5efe7;">
        <div style="max-width:640px;margin:0 auto;padding:32px 20px;background:#1d120d;">
          <div style="border:1px solid rgba(247,191,84,.3);border-radius:16px;overflow:hidden;background:#111;">
            <div style="padding:18px 24px;text-align:center;background:#f7bf54;color:#120d0b;font-weight:700;letter-spacing:.12em;text-transform:uppercase;">Dawn Tattoo Ink</div>
            <div style="padding:28px 24px;">
              <h1 style="margin:0 0 18px;color:#f7bf54;font-size:24px;">A reply from the studio</h1>
              <p style="line-height:1.7;">${greeting}</p>
              <p style="line-height:1.7;">${escapeHtml(response).replace(/\n/g, "<br />")}</p>
              <div style="margin-top:24px;padding:16px;border-radius:10px;background:#1a1a1a;color:#d9d0c6;">
                <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;">Your question</p>
                <p style="margin:0;line-height:1.6;">${escapeHtml(question).replace(/\n/g, "<br />")}</p>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || smtpUser,
    to: email,
    subject,
    text: `${name ? `Hi ${name},\n\n` : "Hello,\n\n"}${response}\n\nYour question: ${question}`,
    html,
  });
}
