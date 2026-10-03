import { prisma } from '../db';
import { NotificationChannel } from '@prisma/client';

export class WhatsAppService {
  private static readonly API_VERSION = 'v17.0';

  /**
   * Send a WhatsApp message using the configured connection.
   */
  public static async sendMessage(to: string, message: string, employeeId: string, projectId?: string, documentId?: string) {
    const connection = await prisma.whatsAppConnection.findUnique({
      where: { employeeId }
    });

    if (!connection) {
      console.warn(`No WhatsApp connection found for employee ${employeeId}. Logging as DRAFT.`);
      return prisma.communicationLog.create({
        data: {
          channel: NotificationChannel.WHATSAPP,
          direction: 'OUTBOUND',
          from: 'unknown',
          to: to,
          body: message,
          status: 'DRAFT',
          projectId: projectId,
          documentId: documentId,
        }
      });
    }

    const token = process.env.WHATSAPP_TOKEN;
    const phoneNumberId = connection.phoneNumberId;

    if (!token) {
      console.warn('WhatsApp API Token not configured. Logging as DRAFT.');
      return prisma.communicationLog.create({
        data: {
          channel: NotificationChannel.WHATSAPP,
          direction: 'OUTBOUND',
          from: phoneNumberId,
          to: to,
          body: message,
          status: 'DRAFT',
          projectId: projectId,
          documentId: documentId,
        }
      });
    }

    try {
      const response = await fetch(`https://graph.facebook.com/${this.API_VERSION}/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to,
          type: 'text',
          text: { body: message }
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`WhatsApp API error: ${JSON.stringify(data)}`);
      }

      const log = await prisma.communicationLog.create({
        data: {
          channel: NotificationChannel.WHATSAPP,
          direction: 'OUTBOUND',
          from: phoneNumberId,
          to: to,
          body: message,
          status: 'SENT',
          externalId: data.messages?.[0]?.id,
          projectId: projectId,
          documentId: documentId,
        }
      });

      // Update last used at
      await prisma.whatsAppConnection.update({
        where: { employeeId },
        data: { lastUsedAt: new Date() }
      });

      return log;
    } catch (error: unknown) {
      console.error('Failed to send WhatsApp message:', error);
      return prisma.communicationLog.create({
        data: {
          channel: NotificationChannel.WHATSAPP,
          direction: 'OUTBOUND',
          from: phoneNumberId,
          to: to,
          body: message,
          status: 'FAILED',
          projectId: projectId,
          documentId: documentId,
        }
      });
    }
  }
}
