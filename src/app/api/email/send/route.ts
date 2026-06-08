import { NextRequest, NextResponse } from 'next/server';
import {
  sendWelcomeEmail,
  sendNewStoreNotification,
  sendNewTicketEmail,
  sendSupportReplyEmail,
  sendOwnerReplyEmail,
  sendSubscriptionReminderEmail,
  sendApprovalEmail,
  sendRejectionEmail,
} from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type } = body;

    switch (type) {
      case 'welcome':
        await sendWelcomeEmail({
          to: body.to,
          ownerName: body.ownerName,
          storeName: body.storeName,
          storeUrl: body.storeUrl,
          subdomain: body.subdomain,
          phone: body.phone,
          registrationDate: body.registrationDate,
        });
        break;

      case 'new_store':
        await sendNewStoreNotification({
          storeName: body.storeName,
          ownerName: body.ownerName,
          ownerEmail: body.ownerEmail,
          ownerPhone: body.ownerPhone,
          subdomain: body.subdomain,
          plan: body.plan,
          registrationDate: body.registrationDate,
        });
        break;

      case 'approval':
        await sendApprovalEmail({
          to: body.to,
          ownerName: body.ownerName,
          storeName: body.storeName,
          subdomain: body.subdomain,
          plan: body.plan,
        });
        break;

      case 'rejection':
        await sendRejectionEmail({
          to: body.to,
          ownerName: body.ownerName,
          storeName: body.storeName,
          reason: body.reason,
        });
        break;

      case 'new_ticket':
        await sendNewTicketEmail({
          ticketNumber: body.ticketNumber,
          subject: body.subject,
          category: body.category,
          priority: body.priority,
          storeName: body.storeName,
          ownerEmail: body.ownerEmail,
          message: body.message,
          ticketId: body.ticketId,
        });
        break;

      case 'support_reply':
        await sendSupportReplyEmail({
          to: body.to,
          ticketNumber: body.ticketNumber,
          subject: body.subject,
          replyText: body.replyText,
          storeName: body.storeName,
        });
        break;

      case 'owner_reply':
        await sendOwnerReplyEmail({
          ticketNumber: body.ticketNumber,
          subject: body.subject,
          replyText: body.replyText,
          storeName: body.storeName,
          ownerEmail: body.ownerEmail,
          ticketId: body.ticketId,
        });
        break;

      case 'subscription_reminder':
        await sendSubscriptionReminderEmail({
          to: body.to,
          storeName: body.storeName,
          daysLeft: body.daysLeft,
          expiryDate: body.expiryDate,
        });
        break;

      default:
        return NextResponse.json({ error: 'Unknown email type: ' + type }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[/api/email/send]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
