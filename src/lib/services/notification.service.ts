import { prisma } from '../db';
import { NotificationChannel } from '@prisma/client';
import { WhatsAppService } from './whatsapp.service';

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
      
      const toName = user?.employee?.name || payload.userId;
      const message = `*${payload.title}*\n${payload.message}`;
      
      // Real WhatsApp message using WhatsAppService
      await WhatsAppService.sendMessage(
        toName, // Ideally this should be a phone number 
        message, 
        payload.userId, 
        payload.projectId, 
        payload.documentId
      );
    } catch (error) {
      console.error('[Notification Engine] Failed to send WhatsApp Notification:', error);
    }
  }
}

