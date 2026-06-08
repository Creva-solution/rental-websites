import nodemailer from 'nodemailer';
import { pool } from '@/lib/renderDb';

// ─── Transporter ─────────────────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  pool: true,
  maxConnections: 3,
  rateDelta: 1000,
  rateLimit: 5,
});

export const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL || '';
export const FROM_ADDRESS = process.env.SMTP_FROM || process.env.SMTP_USER || '';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://rweb.crevasolution.in';

// ─── Fetch all active super admin emails from Render DB ───────────────────────

export async function getSuperAdminEmails(): Promise<string[]> {
  try {
    const client = await pool.connect();
    try {
      const r = await client.query(
        `SELECT email FROM "users" WHERE role = 'superadmin' AND email IS NOT NULL AND email != ''`
      );
      const emails = r.rows.map((row: any) => row.email as string).filter(Boolean);
      // Always include the env fallback superadmin if present and not already in list
      if (SUPERADMIN_EMAIL && !emails.includes(SUPERADMIN_EMAIL)) {
        emails.push(SUPERADMIN_EMAIL);
      }
      return emails;
    } finally {
      client.release();
    }
  } catch (e) {
    console.warn('[Email] getSuperAdminEmails failed, falling back to env:', e);
    return SUPERADMIN_EMAIL ? [SUPERADMIN_EMAIL] : [];
  }
}

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
  await transporter.sendMail({
    from: FROM_ADDRESS,
    to,
    subject,
    html,
    // Anti-spam headers
    replyTo: FROM_ADDRESS,
    headers: {
      'X-Mailer': 'Creva Webzz Mailer',
      'X-Priority': '3',
      'X-MSMail-Priority': 'Normal',
      'Importance': 'Normal',
      'Precedence': 'bulk',
      'List-Unsubscribe': `<mailto:${process.env.SMTP_USER}?subject=unsubscribe>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      'Message-ID': `<${Date.now()}.${Math.random().toString(36).slice(2)}@crevasolution.in>`,
    },
  });
}

// Send to multiple recipients (fire-and-forget for each)
export async function sendEmailToMany(recipients: string[], subject: string, html: string): Promise<void> {
  await Promise.allSettled(recipients.map(to => sendEmail(to, subject, html)));
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

function detailsTable(rows: { label: string; value: string }[]): string {
  return `<table style="width:100%;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;padding:4px;margin-bottom:24px;" cellpadding="0" cellspacing="0">
    ${rows.map(r => `
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;width:35%;">
          <span style="font-size:12px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;">${r.label}</span>
        </td>
        <td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;">
          <span style="font-size:14px;color:#0f172a;font-weight:500;">${r.value}</span>
        </td>
      </tr>`).join('')}
  </table>`;
}

// ─── Template 1: Welcome / Registration Confirmation (to store owner) ─────────

export async function sendWelcomeEmail(opts: {
  to: string;
  ownerName: string;
  storeName: string;
  storeUrl: string;
  subdomain: string;
  phone?: string;
  registrationDate?: string;
}): Promise<void> {
  const date = opts.registrationDate || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const body = `
    <h1 style="margin:0 0 6px;font-size:24px;font-weight:800;color:#0f172a;">Hello ${opts.ownerName},</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">
      Thank you for registering with <strong>Creva Webzz</strong>.<br/>
      Your registration request has been received successfully and is currently <strong>awaiting verification</strong>.
    </p>

    <p style="font-size:13px;font-weight:700;color:#0f172a;margin:0 0 10px;text-transform:uppercase;letter-spacing:0.05em;">Registration Details</p>
    ${detailsTable([
      { label: 'Store Name',         value: opts.storeName },
      { label: 'Owner Name',         value: opts.ownerName },
      { label: 'Email',              value: opts.to },
      { label: 'Phone Number',       value: opts.phone || '—' },
      { label: 'Registration Date',  value: date },
      { label: 'Status',             value: '<span style="color:#f59e0b;font-weight:700;">⏳ Awaiting Verification</span>' },
    ])}

    <p style="font-size:14px;color:#475569;margin:0 0 24px;line-height:1.6;">
      Our team will review and verify your account shortly. You will receive another email once your store is approved and activated.
    </p>

    ${btn('Go to Admin Panel', `${APP_URL}/admin`)}

    <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0 20px;" />
    <p style="font-size:13px;color:#94a3b8;margin:0;">
      Thank you,<br/><strong style="color:#0f172a;">Creva Webzz Team</strong>
    </p>
  `;
  await sendEmail(opts.to, `Welcome to Creva Webzz – Registration Received`, layout('Registration Received', body));
}

// ─── Template 2: New store notification (to ALL super admins) ─────────────────

export async function sendNewStoreNotification(opts: {
  storeName: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  subdomain: string;
  plan: string;
  registrationDate?: string;
}): Promise<void> {
  const superAdminEmails = await getSuperAdminEmails();
  if (superAdminEmails.length === 0) return;

  const date = opts.registrationDate || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  const body = `
    <h1 style="margin:0 0 6px;font-size:24px;font-weight:800;color:#0f172a;">New Store Registration 🏪</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">
      A new store owner has registered and is <strong>awaiting verification</strong>.
    </p>

    <p style="font-size:13px;font-weight:700;color:#0f172a;margin:0 0 10px;text-transform:uppercase;letter-spacing:0.05em;">Registration Details</p>
    ${detailsTable([
      { label: 'Store Name',        value: `<strong>${opts.storeName}</strong>` },
      { label: 'Owner Name',        value: opts.ownerName },
      { label: 'Email',             value: `<a href="mailto:${opts.ownerEmail}" style="color:#3c77c3;">${opts.ownerEmail}</a>` },
      { label: 'Phone Number',      value: opts.ownerPhone || '—' },
      { label: 'Registration Date', value: date },
      { label: 'Plan',              value: pill(opts.plan, '#3c77c3') },
    ])}

    <p style="font-size:14px;color:#475569;margin:0 0 24px;line-height:1.6;">
      Please review and verify this account from the Super Admin Dashboard.
    </p>

    ${btn('Open Super Admin Dashboard', `${APP_URL}/superadmin`)}

    <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0 20px;" />
    <p style="font-size:13px;color:#94a3b8;margin:0;">
      This notification was sent to all active Super Admins (${superAdminEmails.length} recipients).
    </p>
  `;

  await sendEmailToMany(
    superAdminEmails,
    `New Store Registration Requires Verification – ${opts.storeName}`,
    layout('New Store Registration', body),
  );
}

// ─── Template 3: Store Approved (to store owner) ──────────────────────────────

export async function sendApprovalEmail(opts: {
  to: string;
  ownerName: string;
  storeName: string;
  subdomain: string;
  plan?: string;
}): Promise<void> {
  const storeUrl = `https://${opts.subdomain}.crevasolution.in`;
  const body = `
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
      <h1 style="margin:0;font-size:22px;font-weight:800;color:#15803d;">✅ Your Store Has Been Approved!</h1>
    </div>

    <p style="font-size:15px;color:#475569;margin:0 0 24px;line-height:1.6;">
      Hello <strong>${opts.ownerName}</strong>,<br/><br/>
      Great news! Your registration for <strong>${opts.storeName}</strong> has been verified and your store is now <strong>live and active</strong>.
    </p>

    ${detailsTable([
      { label: 'Store Name', value: opts.storeName },
      { label: 'Store URL',  value: `<a href="${storeUrl}" style="color:#3c77c3;">${storeUrl}</a>` },
      { label: 'Status',     value: '<span style="color:#15803d;font-weight:700;">✅ Active & Live</span>' },
      ...(opts.plan ? [{ label: 'Plan', value: pill(opts.plan, '#3c77c3') }] : []),
    ])}

    <p style="font-size:14px;color:#475569;margin:0 0 24px;line-height:1.6;">
      You can now log in to your Admin Panel to add products, customize your storefront, and start selling.
    </p>

    ${btn('Go to Admin Panel', `${APP_URL}/admin`)}

    <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0 20px;" />
    <p style="font-size:13px;color:#94a3b8;margin:0;">
      Thank you,<br/><strong style="color:#0f172a;">Creva Webzz Team</strong>
    </p>
  `;
  await sendEmail(opts.to, `Your Store Has Been Approved – Welcome to Creva Webzz!`, layout('Store Approved', body));
}

// ─── Template 4: Store Rejected (to store owner) ──────────────────────────────

export async function sendRejectionEmail(opts: {
  to: string;
  ownerName: string;
  storeName: string;
  reason?: string;
}): Promise<void> {
  const body = `
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
      <h1 style="margin:0;font-size:22px;font-weight:800;color:#dc2626;">Registration Verification – Action Required</h1>
    </div>

    <p style="font-size:15px;color:#475569;margin:0 0 24px;line-height:1.6;">
      Hello <strong>${opts.ownerName}</strong>,<br/><br/>
      Unfortunately, we were unable to verify your payment for <strong>${opts.storeName}</strong>.
      ${opts.reason ? `<br/><br/><strong>Reason:</strong> ${opts.reason}` : ''}
    </p>

    ${detailsTable([
      { label: 'Store Name', value: opts.storeName },
      { label: 'Status',     value: '<span style="color:#dc2626;font-weight:700;">❌ Verification Failed</span>' },
    ])}

    <p style="font-size:14px;color:#475569;margin:0 0 24px;line-height:1.6;">
      Please re-upload a valid payment screenshot from your Admin Panel subscription page. Our team will re-review within 24 hours.
    </p>

    ${btn('Re-Upload Payment Screenshot', `${APP_URL}/admin/subscription`)}

    <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0 20px;" />
    <p style="font-size:13px;color:#94a3b8;margin:0;">
      Need help? Contact us at <a href="mailto:${FROM_ADDRESS}" style="color:#3c77c3;">${FROM_ADDRESS}</a><br/>
      Thank you,<br/><strong style="color:#0f172a;">Creva Webzz Team</strong>
    </p>
  `;
  await sendEmail(opts.to, `Registration Verification – Action Required for ${opts.storeName}`, layout('Verification Failed', body));
}

// ─── Template 5: New support ticket (to all super admins) ────────────────────

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
  const superAdminEmails = await getSuperAdminEmails();
  if (superAdminEmails.length === 0) return;
  const priorityColor = opts.priority === 'high' ? '#ef4444' : opts.priority === 'medium' ? '#f59e0b' : '#22c55e';
  const body = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0f172a;">New Support Ticket 🎫</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#475569;">A store owner has submitted a new support ticket requiring your attention.</p>

    ${detailsTable([
      { label: 'Ticket',    value: `<strong>${opts.ticketNumber}</strong>` },
      { label: 'Subject',   value: opts.subject },
      { label: 'Store',     value: opts.storeName },
      { label: 'Contact',   value: `<a href="mailto:${opts.ownerEmail}" style="color:#3c77c3;">${opts.ownerEmail}</a>` },
      { label: 'Category',  value: pill(opts.category, '#64748b') },
      { label: 'Priority',  value: pill(opts.priority, priorityColor) },
    ])}

    <div style="background:#fafafa;border-left:4px solid #3c77c3;border-radius:0 8px 8px 0;padding:16px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#64748b;font-weight:600;margin-bottom:6px;">Message</p>
      <p style="margin:0;font-size:14px;color:#334155;white-space:pre-wrap;">${opts.message}</p>
    </div>

    ${btn('Reply to Ticket', `${APP_URL}/superadmin`)}
  `;
  await sendEmailToMany(
    superAdminEmails,
    `[${opts.ticketNumber}] New Ticket: ${opts.subject}`,
    layout('New Ticket', body),
  );
}

// ─── Template 6: Support reply from admin (to store owner) ───────────────────

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

    ${detailsTable([
      { label: 'Ticket',  value: `<strong>${opts.ticketNumber}</strong>` },
      { label: 'Subject', value: opts.subject },
    ])}

    <div style="background:#fafafa;border-left:4px solid #22c55e;border-radius:0 8px 8px 0;padding:16px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#64748b;font-weight:600;margin-bottom:6px;">Reply from Support Team</p>
      <p style="margin:0;font-size:14px;color:#334155;white-space:pre-wrap;">${opts.replyText}</p>
    </div>

    <p style="font-size:14px;color:#475569;margin:0 0 24px;">You can view the full conversation and reply in your admin support panel.</p>
    ${btn('View Ticket', `${APP_URL}/admin/support`)}
  `;
  await sendEmail(opts.to, `[${opts.ticketNumber}] Support replied: ${opts.subject}`, layout('Support Reply', body));
}

// ─── Template 7: Owner reply (to all super admins) ───────────────────────────

export async function sendOwnerReplyEmail(opts: {
  ticketNumber: string;
  subject: string;
  replyText: string;
  storeName: string;
  ownerEmail: string;
  ticketId: string;
}): Promise<void> {
  const superAdminEmails = await getSuperAdminEmails();
  if (superAdminEmails.length === 0) return;
  const body = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0f172a;">Ticket Reply 💬</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#475569;"><strong>${opts.storeName}</strong> replied to ticket <strong>${opts.ticketNumber}</strong>.</p>

    ${detailsTable([
      { label: 'Ticket',  value: `<strong>${opts.ticketNumber}</strong>` },
      { label: 'Subject', value: opts.subject },
      { label: 'Store',   value: opts.storeName },
      { label: 'Contact', value: `<a href="mailto:${opts.ownerEmail}" style="color:#3c77c3;">${opts.ownerEmail}</a>` },
    ])}

    <div style="background:#fafafa;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:16px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#64748b;font-weight:600;margin-bottom:6px;">Owner's Reply</p>
      <p style="margin:0;font-size:14px;color:#334155;white-space:pre-wrap;">${opts.replyText}</p>
    </div>

    ${btn('Open Super Admin Panel', `${APP_URL}/superadmin`)}
  `;
  await sendEmailToMany(
    superAdminEmails,
    `[${opts.ticketNumber}] Owner replied: ${opts.subject}`,
    layout('Owner Reply', body),
  );
}

// ─── Template 8: Subscription reminder (to store owner) ──────────────────────

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

    ${detailsTable([
      { label: 'Store',         value: `<strong>${opts.storeName}</strong>` },
      { label: 'Expiry Date',   value: `<span style="color:${urgency};font-weight:700;">${opts.expiryDate}</span>` },
      ...(!isExpired ? [{ label: 'Days Remaining', value: `<span style="font-size:20px;color:${urgency};font-weight:800;">${opts.daysLeft}</span>` }] : []),
    ])}

    <p style="font-size:14px;color:#475569;margin:0 0 24px;">Contact our support team to renew your plan and keep your storefront running.</p>
    ${btn('Renew Subscription', `${APP_URL}/admin/settings`)}
  `;
  const subject = isExpired
    ? `Action Required: ${opts.storeName} subscription has expired`
    : `Reminder: ${opts.storeName} subscription expires in ${opts.daysLeft} day${opts.daysLeft === 1 ? '' : 's'}`;
  await sendEmail(opts.to, subject, layout('Subscription Reminder', body));
}
