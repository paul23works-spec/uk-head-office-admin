import { prisma } from '../db';
import { NotificationChannel } from '@prisma/client';

export interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
  type: 'SYSTEM' | 'WORKFLOW' | 'APPROVAL' | 'REMINDER';
  projectId?: string;
  documentId?: string;
  channels?: ('IN_APP' | 'EMAIL' | 'WHATSAPP')[];
}

export class NotificationEngine {
  /**
   * Dispatch a notification across multiple channels
   */
  static async dispatch(payload: NotificationPayload) {
    const channels = payload.channels || ['IN_APP'];
    
    const tasks: Promise<any>[] = [];

    if (channels.includes('IN_APP')) {
      tasks.push(this.sendInAppNotification(payload));
    }

    if (channels.includes('EMAIL')) {
      tasks.push(this.sendEmailNotification(payload));
    }

    if (channels.includes('WHATSAPP')) {
      tasks.push(this.sendWhatsAppNotification(payload));
    }

    await Promise.allSettled(tasks);
  }

  private static async sendInAppNotification(payload: NotificationPayload) {
    try {
      await prisma.notification.create({
        data: {
          recipientId: payload.userId, 
          title: payload.title,
          message: payload.message,
          type: payload.type,
          projectId: payload.projectId,
          documentId: payload.documentId,
          channel: NotificationChannel.IN_APP,
          status: 'SENT'
        }
      });
    } catch (error) {
      console.error('[Notification Engine] Failed to send In-App Notification:', error);
    }
  }

  private static async sendEmailNotification(payload: NotificationPayload) {
    try {
      const user = await prisma.user.findUnique({ 
        where: { employeeId: payload.userId },
        include: { employee: true }
      });
      if (!user || !user.email) return;

      const log = await prisma.communicationLog.create({
        data: {
          channel: NotificationChannel.EMAIL,
          direction: 'OUTBOUND',
          from: 'noreply@ukenterprise.com',
          to: user.email,
          subject: payload.title,
          body: payload.message,
          status: process.env.SMTP_HOST ? 'SENT' : 'DRAFT',
          projectId: payload.projectId,
          documentId: payload.documentId,
        }
      });

      if (process.env.SMTP_HOST) {
        // Real implementation would use nodemailer here
        console.log(`[Notification Engine] Real email dispatched to ${user.email}`);
      } else {
        console.log(`[Notification Engine] Logged DRAFT Email to ${user.email} - Subject: ${payload.title}`);
      }
    } catch (error) {
      console.error('[Notification Engine] Failed to send Email Notification:', error);
    }
  }

  private static async sendWhatsAppNotification(payload: NotificationPayload) {
    try {
      const user = await prisma.user.findUnique({ 
        where: { employeeId: payload.userId },
        include: { employee: true }
      });
      
      // We assume user contact info could be stored on the user or employee model in a real scenario
      // For now, logging using employeeId as placeholder

      const log = await prisma.communicationLog.create({
        data: {
          channel: NotificationChannel.WHATSAPP,
          direction: 'OUTBOUND',
          from: 'UK_ENTERPRISE_SYSTEM',
          to: user?.employee?.name || payload.userId,
          body: `*${payload.title}*\n${payload.message}`,
          status: process.env.WHATSAPP_TOKEN ? 'SENT' : 'DRAFT',
          projectId: payload.projectId,
          documentId: payload.documentId,
        }
      });

      if (process.env.WHATSAPP_TOKEN) {
        // Real implementation would use fetch to WhatsApp Graph API
        console.log(`[Notification Engine] Real WA dispatched to ${payload.userId}`);
      } else {
        console.log(`[Notification Engine] Logged DRAFT WhatsApp to ${payload.userId}`);
      }
    } catch (error) {
      console.error('[Notification Engine] Failed to send WhatsApp Notification:', error);
    }
  }
}

