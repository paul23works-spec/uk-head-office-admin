import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { NotificationChannel } from '@prisma/client';

/**
 * Webhook for receiving inbound WhatsApp messages via Meta Cloud API.
 */

// Verification endpoint for Meta webhook setup
export async function GET(req: NextRequest) {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
  const url = new URL(req.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (mode && token) {
    if (mode === 'subscribe' && token === verifyToken) {
      return new NextResponse(challenge, { status: 200 });
    }
    return new NextResponse('Forbidden', { status: 403 });
  }
  return new NextResponse('Bad Request', { status: 400 });
}

import crypto from 'crypto';

// Message receiving endpoint
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-hub-signature-256');
    const appSecret = process.env.WHATSAPP_APP_SECRET;

    if (appSecret && signature) {
      const expectedSignature = 'sha256=' + crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');
      if (signature !== expectedSignature) {
        return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 401 });
      }
    }

    const body = JSON.parse(rawBody);

    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.value && change.value.messages) {
            const message = change.value.messages[0];
            const contact = change.value.contacts[0];

            await prisma.communicationLog.create({
              data: {
                channel: NotificationChannel.WHATSAPP,
                direction: 'INBOUND',
                from: contact.wa_id,
                to: change.value.metadata.display_phone_number,
                body: message.text?.body || '[Non-text message]',
                status: 'RECEIVED',
                externalId: message.id
              }
            });
          }
        }
      }
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false }, { status: 404 });
    }
  } catch (error) {
    console.error('Error processing WhatsApp webhook:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
