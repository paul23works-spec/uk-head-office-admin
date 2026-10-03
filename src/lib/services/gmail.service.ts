import { google } from 'googleapis';
import prisma from '@/lib/db';
import { AuditService } from '@/lib/services/audit.service';

export class GmailService {
  private static getOAuthClient() {
    return new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/gmail/callback`
    );
  }

  public static getAuthUrl(employeeId: string) {
    const oauth2Client = this.getOAuthClient();
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.modify',
    ];

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes,
      state: employeeId,
    });
  }

  public static async handleCallback(code: string, employeeId: string) {
    const oauth2Client = this.getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    console.log(`[GmailService Diagnostics] handleCallback: employeeId=${employeeId}, hasRefreshToken=${!!tokens.refresh_token}, hasAccessToken=${!!tokens.access_token}`);
    oauth2Client.setCredentials(tokens);
    
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const profile = await gmail.users.getProfile({ userId: 'me' });
    const emailAddress = profile.data.emailAddress;

    if (!emailAddress) {
      throw new Error('Failed to retrieve email address');
    }

    const existingConnection = await prisma.gmailConnection.findUnique({
      where: { employeeId },
    });

    const refreshTokenToSave = tokens.refresh_token || existingConnection?.encryptedToken || '';
    
    console.log(`[GmailService Diagnostics] handleCallback: employeeId=${employeeId}, hasNewRefreshToken=${!!tokens.refresh_token}, hasExistingToken=${!!existingConnection?.encryptedToken}`);

    const connection = await prisma.gmailConnection.upsert({
      where: { employeeId },
      update: {
        emailAddress,
        encryptedToken: refreshTokenToSave, // Preserve existing if new one is missing
        status: 'CONNECTED',
        historyId: profile.data.historyId?.toString(),
        lastUsedAt: new Date(),
        scopes: tokens.scope,
      },
      create: {
        employeeId,
        emailAddress,
        encryptedToken: refreshTokenToSave,
        status: 'CONNECTED',
        historyId: profile.data.historyId?.toString(),
        scopes: tokens.scope,
      },
    });

    await AuditService.log(
      { employeeId },
      'UPDATE',
      'User',
      employeeId,
      { integration: 'Gmail', emailAddress }
    );

    return connection;
  }

  public static async disconnect(employeeId: string, actorId: string) {
    const connection = await prisma.gmailConnection.findUnique({
      where: { employeeId },
    });

    if (!connection) {
      return false;
    }

    if (connection.encryptedToken) {
      try {
        const oauth2Client = this.getOAuthClient();
        await oauth2Client.revokeToken(connection.encryptedToken);
      } catch (error) {
        console.error('Error revoking Google token:', error);
      }
    }

    const emailAddress = connection.emailAddress;

    await prisma.gmailConnection.delete({
      where: { employeeId },
    });

    await AuditService.log(
      { employeeId: actorId },
      'DELETE',
      'System',
      employeeId,
      { integration: 'Gmail', emailAddress, action: 'disconnected' }
    );

    return true;
  }

  private static async getAuthenticatedGmailClient(employeeId: string) {
    const connection = await prisma.gmailConnection.findUnique({
      where: { employeeId },
    });

    console.log(`[GmailService Diagnostics] getClient: employeeId=${employeeId}, connectionFound=${!!connection}, status=${connection?.status}, hasEncryptedToken=${!!connection?.encryptedToken}`);

    if (!connection || !connection.encryptedToken) {
      throw new Error('GMAIL_NOT_CONNECTED');
    }

    const oauth2Client = this.getOAuthClient();
    oauth2Client.setCredentials({ refresh_token: connection.encryptedToken });

    return google.gmail({ version: 'v1', auth: oauth2Client });
  }

  private static handleError(error: unknown): never {
    console.error(`[GmailService Diagnostics] handleError raw error:`, error);
    if (typeof error === 'object' && error !== null) {
      const err = error as Record<string, unknown>;
      console.error(`[GmailService Diagnostics] handleError code=${err.code}, message=${err.message}`);
      if (err.code === 401 || (typeof err.message === 'string' && (err.message.includes('invalid_grant') || err.message.includes('invalid request')))) {
        throw new Error('GMAIL_AUTH_FAILED');
      }
    }
    throw error;
  }

  public static async listMessages(employeeId: string, pageToken?: string, maxResults = 25) {
    try {
      const gmail = await this.getAuthenticatedGmailClient(employeeId);
      
      const res = await gmail.users.messages.list({
        userId: 'me',
        labelIds: ['INBOX'],
        maxResults,
        pageToken,
      });

      const messages = res.data.messages || [];
      const nextPageToken = res.data.nextPageToken || null;

      if (messages.length === 0) {
        return { messages: [], nextPageToken: null };
      }

      // Fetch details (metadata only) for each message
      const detailedMessages = await Promise.all(
        messages.map(async (msg) => {
          const msgRes = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id!,
            format: 'metadata',
            metadataHeaders: ['From', 'To', 'Subject', 'Date'],
          });

          const headers = msgRes.data.payload?.headers || [];
          const getHeader = (name: string) => headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

          return {
            id: msgRes.data.id,
            threadId: msgRes.data.threadId,
            snippet: msgRes.data.snippet,
            labelIds: msgRes.data.labelIds || [],
            from: getHeader('from'),
            to: getHeader('to'),
            subject: getHeader('subject'),
            date: getHeader('date'),
            isUnread: msgRes.data.labelIds?.includes('UNREAD') || false,
            isStarred: msgRes.data.labelIds?.includes('STARRED') || false,
          };
        })
      );

      return {
        messages: detailedMessages,
        nextPageToken,
      };
    } catch (error: unknown) {
      this.handleError(error as Error);
    }
  }

  public static async getMessage(employeeId: string, messageId: string) {
    try {
      const gmail = await this.getAuthenticatedGmailClient(employeeId);
      
      const res = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full',
      });

      return res.data;
    } catch (error: unknown) {
      this.handleError(error as Error);
    }
  }

  public static async modifyMessage(employeeId: string, messageId: string, addLabelIds: string[] = [], removeLabelIds: string[] = []) {
    try {
      const gmail = await this.getAuthenticatedGmailClient(employeeId);
      
      const res = await gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          addLabelIds,
          removeLabelIds,
        },
      });

      return res.data;
    } catch (error: unknown) {
      this.handleError(error as Error);
    }
  }

  public static async trashMessage(employeeId: string, messageId: string) {
    try {
      const gmail = await this.getAuthenticatedGmailClient(employeeId);
      
      const res = await gmail.users.messages.trash({
        userId: 'me',
        id: messageId,
      });

      return res.data;
    } catch (error: unknown) {
      this.handleError(error as Error);
    }
  }

  public static async sendMessage(
    employeeId: string, 
    to: string, 
    cc: string, 
    bcc: string, 
    subject: string, 
    textBody: string,
    htmlBody: string = '',
    attachments: Array<{ filename: string; mimeType: string; data: Buffer }> = []
  ) {
    try {
      const gmail = await this.getAuthenticatedGmailClient(employeeId);
      
      const chunkBase64 = (str: string) => str.match(/.{1,76}/g)?.join('\r\n') || '';
      
      const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
      
      const boundary = '----=_NextPart_' + Date.now().toString(16);
      const altBoundary = '----=_AltPart_' + Date.now().toString(16);
      
      const messageParts = [];
      messageParts.push(`To: ${to}`);
      if (cc) messageParts.push(`Cc: ${cc}`);
      if (bcc) messageParts.push(`Bcc: ${bcc}`);
      messageParts.push(`Subject: ${utf8Subject}`);
      messageParts.push('MIME-Version: 1.0');
      messageParts.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
      messageParts.push('');
      
      // Alternative part (text + html)
      messageParts.push(`--${boundary}`);
      messageParts.push(`Content-Type: multipart/alternative; boundary="${altBoundary}"`);
      messageParts.push('');
      
      // Text body
      messageParts.push(`--${altBoundary}`);
      messageParts.push('Content-Type: text/plain; charset="UTF-8"');
      messageParts.push('Content-Transfer-Encoding: base64');
      messageParts.push('');
      messageParts.push(chunkBase64(Buffer.from(textBody).toString('base64')));
      
      // HTML body
      if (htmlBody) {
        messageParts.push(`--${altBoundary}`);
        messageParts.push('Content-Type: text/html; charset="UTF-8"');
        messageParts.push('Content-Transfer-Encoding: base64');
        messageParts.push('');
        messageParts.push(chunkBase64(Buffer.from(htmlBody).toString('base64')));
      }
      
      messageParts.push(`--${altBoundary}--`);
      
      // Attachments
      for (const att of attachments) {
        messageParts.push(`--${boundary}`);
        messageParts.push(`Content-Type: ${att.mimeType}; name="${att.filename}"`);
        messageParts.push(`Content-Disposition: attachment; filename="${att.filename}"`);
        messageParts.push('Content-Transfer-Encoding: base64');
        messageParts.push('');
        messageParts.push(chunkBase64(att.data.toString('base64')));
      }
      
      messageParts.push(`--${boundary}--`);
      
      const email = messageParts.join('\r\n');
      
      const raw = Buffer.from(email)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      
      const res = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: raw
        }
      });

      await AuditService.log(
        { employeeId },
        'CREATE',
        'System',
        employeeId,
        { integration: 'Gmail', action: 'EMAIL_SENT', to, cc, bcc, messageId: res.data.id }
      );

      return res.data;
    } catch (error: unknown) {
      this.handleError(error as Error);
    }
  }
}
