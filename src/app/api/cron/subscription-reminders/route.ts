import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendSubscriptionReminderEmail, SUPERADMIN_EMAIL, sendEmail, APP_URL } from '@/lib/email';
import { pool, ensureSupportSchema } from '@/lib/renderDb';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const REMINDER_DAYS = [7, 3, 1, 0];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

async function createInAppNotification(storeId: string, title: string, body: string) {
  try {
    await ensureSupportSchema();
    const client = await pool.connect();
    try {
      const nId = 'notif_' + Date.now() + Math.random().toString(36).substring(2, 6);
      await client.query(
        `INSERT INTO "support_notifications"
         (id, type, for_role, store_id, ticket_id, title, body)
         VALUES ($1,'subscription_reminder','owner',$2,NULL,$3,$4)`,
        [nId, storeId, title, body],
      );
    } finally {
      client.release();
    }
  } catch (e) {
    console.warn('[cron] Failed to create in-app notification:', e);
  }
}

export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorized calls
  const cronSecret = req.headers.get('x-cron-secret') || req.nextUrl.searchParams.get('secret');
  if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const results: { storeId: string; email: string; daysLeft: number; sent: boolean }[] = [];

  try {
    for (const days of REMINDER_DAYS) {
      // Calculate date window: stores expiring exactly `days` days from now (±12 hours)
      const targetStart = new Date(now.getTime() + days * 86400000 - 43200000).toISOString();
      const targetEnd   = new Date(now.getTime() + days * 86400000 + 43200000).toISOString();

      const { data: stores, error } = await supabaseAdmin
        .from('stores')
        .select('id, store_name, contact_email, subscription_expires_at, is_paused')
        .gte('subscription_expires_at', targetStart)
        .lte('subscription_expires_at', targetEnd)
        .neq('subdomain', '__creva_saas_global_settings__');

      if (error) {
        console.error('[cron] Supabase query error for days=' + days, error);
        continue;
      }

      for (const store of (stores || [])) {
        if (!store.contact_email) continue;

        const expiryLabel = formatDate(store.subscription_expires_at);
        try {
          await sendSubscriptionReminderEmail({
            to: store.contact_email,
            storeName: store.store_name,
            daysLeft: days,
            expiryDate: expiryLabel,
          });

          // In-app notification for the store owner
          const title = days === 0
            ? `Your subscription has expired`
            : `Subscription expires in ${days} day${days === 1 ? '' : 's'}`;
          const body = days === 0
            ? `${store.store_name} subscription expired on ${expiryLabel}. Renew now to restore access.`
            : `${store.store_name} subscription expires on ${expiryLabel}. Renew to avoid downtime.`;

          await createInAppNotification(store.id, title, body);

          results.push({ storeId: store.id, email: store.contact_email, daysLeft: days, sent: true });
        } catch (e: any) {
          console.error('[cron] Failed for store', store.id, e.message);
          results.push({ storeId: store.id, email: store.contact_email, daysLeft: days, sent: false });
        }
      }
    }

    // Send summary to superadmin
    if (SUPERADMIN_EMAIL && results.length > 0) {
      const rows = results.map(r =>
        `<tr><td style="padding:6px 8px;border:1px solid #e2e8f0;font-size:12px;">${r.storeId}</td>
         <td style="padding:6px 8px;border:1px solid #e2e8f0;font-size:12px;">${r.email}</td>
         <td style="padding:6px 8px;border:1px solid #e2e8f0;font-size:12px;">${r.daysLeft}</td>
         <td style="padding:6px 8px;border:1px solid #e2e8f0;font-size:12px;color:${r.sent ? '#22c55e' : '#ef4444'};">${r.sent ? 'Sent' : 'Failed'}</td></tr>`
      ).join('');
      const html = `<p style="font-family:sans-serif;font-size:14px;">Daily subscription reminder cron ran at ${now.toISOString()}.</p>
        <table style="border-collapse:collapse;width:100%;">
          <thead><tr style="background:#f8fafc;">
            <th style="padding:6px 8px;border:1px solid #e2e8f0;font-size:12px;text-align:left;">Store ID</th>
            <th style="padding:6px 8px;border:1px solid #e2e8f0;font-size:12px;text-align:left;">Email</th>
            <th style="padding:6px 8px;border:1px solid #e2e8f0;font-size:12px;text-align:left;">Days Left</th>
            <th style="padding:6px 8px;border:1px solid #e2e8f0;font-size:12px;text-align:left;">Status</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>`;
      await sendEmail(SUPERADMIN_EMAIL, `[Creva Cron] Subscription Reminders — ${results.length} processed`, html).catch(() => {});
    }

    return NextResponse.json({ success: true, processed: results.length, results });
  } catch (err: any) {
    console.error('[cron/subscription-reminders]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
