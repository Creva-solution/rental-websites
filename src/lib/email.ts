import nodemailer from 'nodemailer';

// ─── Transporter ─────────────────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL || '';
export const FROM_ADDRESS = process.env.SMTP_FROM || process.env.SMTP_USER || '';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://crevasolution.in';

// ─── Core sender ─────────────────────────────────────────────────────────────

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[Email] SMTP credentials not configured — skipping:', subject);
    return;
  }
  if (!to) {
    console.warn('[Email] No recipient for:', subject);
    return;
  }
  await transporter.sendMail({ from: FROM_ADDRESS, to, subject, html });
}

// ─── Shared layout ────────────────────────────────────────────────────────────

const logoUrl = `${APP_URL}/logo-creva.svg`;

function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr><td style="background:#0f172a;padding:20px 32px;">
          <img src="${logoUrl}" alt="Creva Webzz" height="36" style="display:block;" />
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          ${body}
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 32px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">© 2026 Creva Webzz. All rights reserved.</p>
          <p style="margin:6px 0 0;font-size:12px;color:#94a3b8;">This is an automated message — please do not reply directly.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function btn(text: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;background:#3c77c3;color:#ffffff;font-size:14px;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;margin-top:20px;">${text}</a>`;
}

function pill(label: string, color: string): string {
  return `<span style="display:inline-block;background:${color}20;color:${color};font-size:11px;font-weight:700;padding:3px 10px;border-radius:999px;border:1px solid ${color}40;text-transform:uppercase;letter-spacing:0.05em;">${label}</span>`;
}

// ─── Template 1: Welcome email (to new store owner) ──────────────────────────

export async function sendWelcomeEmail(opts: {
  to: string;
  ownerName: string;
  storeName: string;
  storeUrl: string;
  subdomain: string;
}): Promise<void> {
  const body = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0f172a;">Welcome, ${opts.ownerName}! 🎉</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#475569;">Your store <strong>${opts.storeName}</strong> has been successfully registered on Creva Webzz.</p>

    <table style="width:100%;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;padding:20px;margin-bottom:24px;" cellpadding="0" cellspacing="0">
      <tr><td style="padding:6px 0;"><span style="font-size:13px;color:#64748b;font-weight:600;">Store Name</span><br><span style="font-size:14px;color:#0f172a;">${opts.storeName}</span></td></tr>
      <tr><td style="padding:6px 0;"><span style="font-size:13px;color:#64748b;font-weight:600;">Subdomain</span><br><span style="font-size:14px;color:#0f172a;">${opts.subdomain}.crevasolution.in</span></td></tr>
      <tr><td style="padding:6px 0;"><span style="font-size:13px;color:#64748b;font-weight:600;">Status</span><br>${pill('Pending Activation', '#f59e0b')}</td></tr>
    </table>

    <p style="font-size:14px;color:#475569;margin:0 0 8px;">Our team will verify your payment and activate your store within <strong>24 hours</strong>. You'll receive another email once your store is live.</p>
    <p style="font-size:14px;color:#475569;margin:0 0 24px;">In the meantime, you can log in to your admin panel and configure your products, appearance, and settings.</p>

    ${btn('Go to Admin Panel', `${APP_URL}/admin`)}

    <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0;" />
    <p style="font-size:13px;color:#94a3b8;margin:0;">Need help? Contact us at <a href="mailto:${FROM_ADDRESS}" style="color:#3c77c3;">${FROM_ADDRESS}</a></p>
  `;
  await sendEmail(opts.to, `Welcome to Creva Webzz — ${opts.storeName}`, layout('Welcome', body));
}

// ─── Template 2: New store notification (to superadmin) ───────────────────────

export async function sendNewStoreNotification(opts: {
  storeName: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  subdomain: string;
  plan: string;
}): Promise<void> {
  if (!SUPERADMIN_EMAIL) return;
  const body = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0f172a;">New Store Registration 🏪</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#475569;">A new merchant has completed registration and is awaiting activation.</p>

    <table style="width:100%;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;padding:20px;margin-bottom:24px;" cellpadding="0" cellspacing="0">
      <tr><td style="padding:6px 12px;"><span style="font-size:13px;color:#64748b;font-weight:600;">Store Name</span><br><span style="font-size:14px;color:#0f172a;font-weight:700;">${opts.storeName}</span></td></tr>
      <tr><td style="padding:6px 12px;"><span style="font-size:13px;color:#64748b;font-weight:600;">Owner</span><br><span style="font-size:14px;color:#0f172a;">${opts.ownerName}</span></td></tr>
      <tr><td style="padding:6px 12px;"><span style="font-size:13px;color:#64748b;font-weight:600;">Email</span><br><a href="mailto:${opts.ownerEmail}" style="font-size:14px;color:#3c77c3;">${opts.ownerEmail}</a></td></tr>
      <tr><td style="padding:6px 12px;"><span style="font-size:13px;color:#64748b;font-weight:600;">Phone</span><br><span style="font-size:14px;color:#0f172a;">${opts.ownerPhone}</span></td></tr>
      <tr><td style="padding:6px 12px;"><span style="font-size:13px;color:#64748b;font-weight:600;">Subdomain</span><br><span style="font-size:14px;color:#0f172a;">${opts.subdomain}.crevasolution.in</span></td></tr>
      <tr><td style="padding:6px 12px;"><span style="font-size:13px;color:#64748b;font-weight:600;">Plan</span><br>${pill(opts.plan, '#3c77c3')}</td></tr>
    </table>

    <p style="font-size:14px;color:#475569;margin:0 0 24px;">Please verify the payment screenshot in the Super Admin panel and activate this store.</p>

    ${btn('Open Super Admin Panel', `${APP_URL}/superadmin`)}
  `;
  await sendEmail(SUPERADMIN_EMAIL, `New Store Registration: ${opts.storeName}`, layout('New Store', body));
}

// ─── Template 3: New support ticket (to superadmin) ──────────────────────────

export async function sendNewTicketEmail(opts: {
  ticketNumber: string;
  subject: string;
  category: string;
  priority: string;
  storeName: string;
  ownerEmail: string;
  message: string;
  ticketId: string;
}): Promise<void> {
  if (!SUPERADMIN_EMAIL) return;
  const priorityColor = opts.priority === 'high' ? '#ef4444' : opts.priority === 'medium' ? '#f59e0b' : '#22c55e';
  const body = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0f172a;">New Support Ticket 🎫</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#475569;">A store owner has submitted a new support ticket requiring your attention.</p>

    <table style="width:100%;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;padding:20px;margin-bottom:24px;" cellpadding="0" cellspacing="0">
      <tr><td style="padding:6px 12px;"><span style="font-size:13px;color:#64748b;font-weight:600;">Ticket</span><br><span style="font-size:14px;color:#0f172a;font-weight:700;">${opts.ticketNumber}</span></td></tr>
      <tr><td style="padding:6px 12px;"><span style="font-size:13px;color:#64748b;font-weight:600;">Subject</span><br><span style="font-size:14px;color:#0f172a;">${opts.subject}</span></td></tr>
      <tr><td style="padding:6px 12px;"><span style="font-size:13px;color:#64748b;font-weight:600;">Store</span><br><span style="font-size:14px;color:#0f172a;">${opts.storeName}</span></td></tr>
      <tr><td style="padding:6px 12px;"><span style="font-size:13px;color:#64748b;font-weight:600;">Contact</span><br><a href="mailto:${opts.ownerEmail}" style="font-size:14px;color:#3c77c3;">${opts.ownerEmail}</a></td></tr>
      <tr><td style="padding:6px 12px;"><span style="font-size:13px;color:#64748b;font-weight:600;">Category / Priority</span><br>${pill(opts.category, '#64748b')} ${pill(opts.priority, priorityColor)}</td></tr>
    </table>

    <div style="background:#fafafa;border-left:4px solid #3c77c3;border-radius:0 8px 8px 0;padding:16px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#64748b;font-weight:600;margin-bottom:6px;">Message</p>
      <p style="margin:0;font-size:14px;color:#334155;white-space:pre-wrap;">${opts.message}</p>
    </div>

    ${btn('Reply to Ticket', `${APP_URL}/superadmin`)}
  `;
  await sendEmail(SUPERADMIN_EMAIL, `[${opts.ticketNumber}] New Ticket: ${opts.subject}`, layout('New Ticket', body));
}

// ─── Template 4: Support reply from admin (to store owner) ───────────────────

export async function sendSupportReplyEmail(opts: {
  to: string;
  ticketNumber: string;
  subject: string;
  replyText: string;
  storeName: string;
}): Promise<void> {
  const body = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0f172a;">Support Update 💬</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#475569;">Our support team has replied to your ticket <strong>${opts.ticketNumber}</strong>.</p>

    <table style="width:100%;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;padding:20px;margin-bottom:24px;" cellpadding="0" cellspacing="0">
      <tr><td style="padding:6px 12px;"><span style="font-size:13px;color:#64748b;font-weight:600;">Ticket</span><br><span style="font-size:14px;color:#0f172a;font-weight:700;">${opts.ticketNumber}</span></td></tr>
      <tr><td style="padding:6px 12px;"><span style="font-size:13px;color:#64748b;font-weight:600;">Subject</span><br><span style="font-size:14px;color:#0f172a;">${opts.subject}</span></td></tr>
    </table>

    <div style="background:#fafafa;border-left:4px solid #22c55e;border-radius:0 8px 8px 0;padding:16px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#64748b;font-weight:600;margin-bottom:6px;">Reply from Support Team</p>
      <p style="margin:0;font-size:14px;color:#334155;white-space:pre-wrap;">${opts.replyText}</p>
    </div>

    <p style="font-size:14px;color:#475569;margin:0 0 24px;">You can view the full conversation and reply in your admin support panel.</p>
    ${btn('View Ticket', `${APP_URL}/admin/support`)}
  `;
  await sendEmail(opts.to, `[${opts.ticketNumber}] Support replied: ${opts.subject}`, layout('Support Reply', body));
}

// ─── Template 5: Owner reply (to superadmin) ─────────────────────────────────

export async function sendOwnerReplyEmail(opts: {
  ticketNumber: string;
  subject: string;
  replyText: string;
  storeName: string;
  ownerEmail: string;
  ticketId: string;
}): Promise<void> {
  if (!SUPERADMIN_EMAIL) return;
  const body = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0f172a;">Ticket Reply 💬</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#475569;"><strong>${opts.storeName}</strong> replied to ticket <strong>${opts.ticketNumber}</strong>.</p>

    <table style="width:100%;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;padding:20px;margin-bottom:24px;" cellpadding="0" cellspacing="0">
      <tr><td style="padding:6px 12px;"><span style="font-size:13px;color:#64748b;font-weight:600;">Ticket</span><br><span style="font-size:14px;color:#0f172a;font-weight:700;">${opts.ticketNumber}</span></td></tr>
      <tr><td style="padding:6px 12px;"><span style="font-size:13px;color:#64748b;font-weight:600;">Subject</span><br><span style="font-size:14px;color:#0f172a;">${opts.subject}</span></td></tr>
      <tr><td style="padding:6px 12px;"><span style="font-size:13px;color:#64748b;font-weight:600;">Store</span><br><span style="font-size:14px;color:#0f172a;">${opts.storeName}</span></td></tr>
      <tr><td style="padding:6px 12px;"><span style="font-size:13px;color:#64748b;font-weight:600;">Contact</span><br><a href="mailto:${opts.ownerEmail}" style="font-size:14px;color:#3c77c3;">${opts.ownerEmail}</a></td></tr>
    </table>

    <div style="background:#fafafa;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:16px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#64748b;font-weight:600;margin-bottom:6px;">Owner's Reply</p>
      <p style="margin:0;font-size:14px;color:#334155;white-space:pre-wrap;">${opts.replyText}</p>
    </div>

    ${btn('Open Super Admin Panel', `${APP_URL}/superadmin`)}
  `;
  await sendEmail(SUPERADMIN_EMAIL, `[${opts.ticketNumber}] Owner replied: ${opts.subject}`, layout('Owner Reply', body));
}

// ─── Template 6: Subscription reminder (to store owner) ──────────────────────

export async function sendSubscriptionReminderEmail(opts: {
  to: string;
  storeName: string;
  daysLeft: number;
  expiryDate: string;
}): Promise<void> {
  const isExpired = opts.daysLeft === 0;
  const urgency = isExpired ? '#ef4444' : opts.daysLeft === 1 ? '#f97316' : '#f59e0b';
  const headline = isExpired
    ? `Your subscription has expired ⚠️`
    : `Your subscription expires in ${opts.daysLeft} day${opts.daysLeft === 1 ? '' : 's'} ⏰`;
  const detail = isExpired
    ? `Your store <strong>${opts.storeName}</strong> is now paused. Renew now to restore access immediately.`
    : `Your store <strong>${opts.storeName}</strong> will be paused on <strong>${opts.expiryDate}</strong>. Renew before it expires to avoid any downtime.`;

  const body = `
    <div style="background:${urgency}10;border:1px solid ${urgency}40;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
      <h1 style="margin:0;font-size:22px;font-weight:800;color:${urgency};">${headline}</h1>
    </div>

    <p style="font-size:15px;color:#475569;margin:0 0 24px;">${detail}</p>

    <table style="width:100%;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;padding:20px;margin-bottom:24px;" cellpadding="0" cellspacing="0">
      <tr><td style="padding:6px 12px;"><span style="font-size:13px;color:#64748b;font-weight:600;">Store</span><br><span style="font-size:14px;color:#0f172a;font-weight:700;">${opts.storeName}</span></td></tr>
      <tr><td style="padding:6px 12px;"><span style="font-size:13px;color:#64748b;font-weight:600;">Expiry Date</span><br><span style="font-size:14px;color:${urgency};font-weight:700;">${opts.expiryDate}</span></td></tr>
      ${!isExpired ? `<tr><td style="padding:6px 12px;"><span style="font-size:13px;color:#64748b;font-weight:600;">Days Remaining</span><br><span style="font-size:20px;color:${urgency};font-weight:800;">${opts.daysLeft}</span></td></tr>` : ''}
    </table>

    <p style="font-size:14px;color:#475569;margin:0 0 24px;">Contact our support team to renew your plan and keep your storefront running.</p>
    ${btn('Renew Subscription', `${APP_URL}/admin/settings`)}
  `;
  const subject = isExpired
    ? `Action Required: ${opts.storeName} subscription has expired`
    : `Reminder: ${opts.storeName} subscription expires in ${opts.daysLeft} day${opts.daysLeft === 1 ? '' : 's'}`;
  await sendEmail(opts.to, subject, layout('Subscription Reminder', body));
}
