import { NextRequest, NextResponse } from 'next/server';
import {
  sendWelcomeEmail,
  sendNewStoreNotification,
  sendSubscriptionReminderEmail,
  sendNewTicketEmail,
  sendApprovalEmail,
  sendRejectionEmail,
  SUPERADMIN_EMAIL,
  FROM_ADDRESS,
  APP_URL,
} from '@/lib/email';

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type') || 'welcome';
  const to   = req.nextUrl.searchParams.get('to')   || SUPERADMIN_EMAIL;

  if (!to) {
    return NextResponse.json({ error: 'No recipient — pass ?to=your@email.com or set SUPERADMIN_EMAIL' }, { status: 400 });
  }

  const config = {
    smtpUser: process.env.SMTP_USER || '(not set)',
    smtpHost: process.env.SMTP_HOST || '(not set)',
    smtpPort: process.env.SMTP_PORT || '(not set)',
    from: FROM_ADDRESS || '(not set)',
    superadminEmail: SUPERADMIN_EMAIL || '(not set)',
    appUrl: APP_URL,
  };

  // Block early if SMTP is not configured — do not silently skip
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return NextResponse.json({
      success: false,
      error: 'SMTP credentials not set in environment variables. Add SMTP_USER and SMTP_PASS in Vercel → Settings → Environment Variables, then redeploy.',
      config,
    }, { status: 503 });
  }

  try {
    switch (type) {
      case 'welcome':
        await sendWelcomeEmail({
          to,
          ownerName: 'Test Owner',
          storeName: 'Test Store',
          storeUrl: `${APP_URL}/store/test-store`,
          subdomain: 'test-store',
        });
        break;

      case 'new_store':
        await sendNewStoreNotification({
          storeName: 'Test Store',
          ownerName: 'Test Owner',
          ownerEmail: to,
          ownerPhone: '+91 98765 43210',
          subdomain: 'test-store',
          plan: '1 Month (30 Days)',
        });
        break;

      case 'reminder':
        await sendSubscriptionReminderEmail({
          to,
          storeName: 'Test Store',
          daysLeft: 3,
          expiryDate: '15 June 2026',
        });
        break;

      case 'expired':
        await sendSubscriptionReminderEmail({
          to,
          storeName: 'Test Store',
          daysLeft: 0,
          expiryDate: '08 June 2026',
        });
        break;

      case 'ticket':
        await sendNewTicketEmail({
          ticketNumber: 'TKT-123456',
          subject: 'Test Support Ticket',
          category: 'technical',
          priority: 'high',
          storeName: 'Test Store',
          ownerEmail: to,
          message: 'This is a test support message to verify email delivery.',
          ticketId: 'tkt_test123',
        });
        break;

      case 'approval':
        await sendApprovalEmail({
          to,
          ownerName: 'Test Owner',
          storeName: 'Test Store',
          subdomain: 'test-store',
          plan: '1 Month (30 Days)',
        });
        break;

      case 'rejection':
        await sendRejectionEmail({
          to,
          ownerName: 'Test Owner',
          storeName: 'Test Store',
        });
        break;

      default:
        return NextResponse.json({
          error: `Unknown type "${type}"`,
          availableTypes: ['welcome', 'new_store', 'reminder', 'expired', 'ticket', 'approval', 'rejection'],
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      sent: { type, to },
      config,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message,
      config,
    }, { status: 500 });
  }
}
