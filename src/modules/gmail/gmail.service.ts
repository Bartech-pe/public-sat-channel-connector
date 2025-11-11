/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable no-unsafe-optional-chaining */
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { gmail_v1, google } from 'googleapis';
import { AuthGmailService } from './auth-gmail.service';
import { BuildCenterEmail, WatchMail } from './dto/BuildEmail';
import {
  AttachmentContent,
  EmailSent,
  EmailSentContent,
} from './dto/EmailSent.dto';
import { GmailGateway } from './gateway/gmail-gateway';
import { ReplyBody, ReplyEmail } from './dto/reply-email.dto';
import { ForwardBody, ForwardTo } from './dto/forward-to.dto';
import { GmailActionService } from './gmail-actions.service';
import { GmailAttachmentService } from './gmaill-attachment.service';
import { RedisService } from './redis/redis.service';
import { getHeader } from 'src/common/helpers/mail.helper';

/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
@Injectable()
export class GmailService {
  constructor(
    private readonly authService: AuthGmailService,
    private readonly gateway: GmailGateway,
    private readonly gmailActionService: GmailActionService,
    private readonly attachmnetService: GmailAttachmentService,
    private readonly redisService: RedisService,
  ) {}

  async onModuleInit() {}

  async setWatch(body: WatchMail) {
    try {
      const { clientId } = body;

      const oauth2Client = await this.authService.getOAuthClient(clientId);

      const gmail = google.gmail({
        version: 'v1',
        auth: oauth2Client,
      });

      const watchRequest = {
        userId: 'me',
        requestBody: {
          labelIds: ['INBOX'],
          topicName: `projects/${body.projectId}/topics/${body.topicName}`,
          labelFilterAction: 'include',
        },
      };
      const response = await gmail.users.watch(watchRequest);
      console.log('watch', response.data);
      return response.data;
    } catch (error) {
      console.error('Error en StarWatch', error);
    }
  }

  // async handleGmailNotification(payload: any): Promise<void> {
  //   const { emailAddress, historyId } = payload;

  //   // Buscar a qué cliente pertenece ese correo
  //   const clientId = await this.getClientIdByEmail(emailAddress);
  //   if (!clientId) {
  //     this.logger.warn(`No se encontró cliente para ${emailAddress}`);
  //     return;
  //   }
  //   const { expiry_date, refresh_token } = (
  //     await this.authService.getAuthClient()
  //   )?.credentials;
  //   if (this.authService.isExpired(expiry_date)) {
  //     const infoToken = await this.authService.refrestToken(refresh_token);
  //     await this.setToken(infoToken.accessToken, infoToken.refreshToken);
  //   }
  //   const history = await this.gmail.users.history.list({
  //     userId: 'me',
  //     startHistoryId: this.historyNumber,
  //     historyTypes: ['messageAdded'],
  //   });
  //   console.log('Hisotry:', history.data.history);
  //   for (const record of history.data.history || []) {
  //     if (Array.isArray(record.messagesAdded)) {
  //       for (const added of record.messagesAdded) {
  //         const message = added.message;
  //         if (
  //           message?.labelIds?.includes(headers, 'UNREAD') ||
  //           message?.labelIds?.includes(headers, 'SENT')
  //         ) {
  //           console.log(
  //             'Mensaje con label SENT:',
  //             message.id,
  //             message.labelIds,
  //           );
  //           await this.GetEmail(message.id ?? '');
  //         }
  //       }
  //     }
  //   }
  // }

  async handleGmailNotification(payload: any) {
    const { emailAddress, historyId } = payload;
    console.log(
      `Notificación recibida para ${emailAddress}, historyId: ${historyId}`,
    );

    try {
      const config = await this.authService.getClientEmail(emailAddress);
      if (!config) {
        console.error(`Configuración para "${emailAddress}" no encontrada`);
        return;
      }

      const { clientId } = config;

      // Recuperar el cliente OAuth2 del usuario desde Redis
      const oauth2Client = await this.authService.getOAuthClient(clientId);

      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      // Obtener el historial desde el último historyId guardado
      const lastHistoryIdKey = `gmail:${emailAddress}:lastHistoryId`;
      const lastHistoryId = await this.redisService.get(lastHistoryIdKey);

      const response = await gmail.users.history.list({
        userId: 'me',
        startHistoryId: lastHistoryId || historyId,
        historyTypes: ['messageAdded'],
      });

      const history = response.data.history || [];
      if (history.length === 0) {
        console.log(`Sin mensajes nuevos para ${emailAddress}`);
        await this.redisService.set(lastHistoryIdKey, historyId);
        return;
      }

      for (const h of history) {
        for (const m of h.messages || []) {
          const messageId = m.id!;
          const msg = await gmail.users.messages.get({
            userId: 'me',
            id: messageId,
            format: 'full',
          });

          await this.processIncomingMessage(gmail, msg.data, emailAddress);
        }
      }

      // Guardar el último historyId procesado
      await this.redisService.set(lastHistoryIdKey, historyId);

      // Guardar el último historyId procesado
      await this.redisService.set(lastHistoryIdKey, historyId);
    } catch (error) {
      console.error(`Error procesando notificación de Gmail: ${error.message}`);
    }
  }

  /**
   * Busca recursivamente el cuerpo HTML de un mensaje.
   */
  private extractHtmlBody(payload: gmail_v1.Schema$MessagePart | undefined): {
    content: string;
  } {
    let content = '';

    const parts = this.getAllParts(payload);

    const htmlParts = parts.filter((p) => p.mimeType.includes('text/html'));

    // Helper para decodificar base64url
    const decode = (data: string): string => {
      try {
        const normalized = data.replace(/-/g, '+').replace(/_/g, '/');
        return Buffer.from(normalized, 'base64').toString('utf8');
      } catch (e) {
        console.error('Error decoding body', e);
        return '';
      }
    };

    // Caso 1: este mismo part es HTML
    if (htmlParts[0]) {
      const part = htmlParts[0];
      content = decode(part.body.data);
    }

    return { content };
  }

  private extractReplyContent(body: string): string {
    if (!body) return '';

    // Busca los patrones típicos de inicio de cita
    const patterns = [
      /<div class=["']?gmail_quote["']?[^>]*>/i,
      /<blockquote/i,
      /<div class=["']?gmail_attr["']?[^>]*>/i,
      /On .* wrote:/i,
      /El .* escribió:/i,
      /^>+/m,
    ];

    let cutIndex = -1;

    for (const pattern of patterns) {
      const match = body.match(pattern);
      if (match) {
        cutIndex = match.index!;
        break;
      }
    }

    // Si se encontró un bloque citado, corta el HTML antes de él
    const cleaned =
      cutIndex !== -1 ? body.substring(0, cutIndex).trim() : body.trim();

    // Opcional: limpia espacios y etiquetas vacías
    return cleaned
      .replace(/(\s*<br\s*\/?>\s*)+$/i, '') // elimina <br> finales
      .replace(/\n+/g, '') // elimina saltos
      .trim();
  }

  /**
   * Extrae adjuntos y los devuelve en base64 (sin guardarlos)
   */
  private async extractAttachmentsBase64(
    gmail: gmail_v1.Gmail,
    messageId: string,
    payload: gmail_v1.Schema$MessagePart | undefined,
  ) {
    const attachments: AttachmentContent[] = [];
    const parts = this.getAllParts(payload);

    for (const part of parts) {
      if (part.filename && part.body?.attachmentId) {
        const attach = await gmail.users.messages.attachments.get({
          userId: 'me',
          messageId: messageId,
          id: part.body.attachmentId,
        });

        const data = attach.data.data;
        if (!data) continue;

        const headers = part?.headers || [];
        const contentID = getHeader(headers, 'Content-ID');

        attachments.push({
          attachmentId: part.body?.attachmentId,
          cid: contentID.match(/<(.*?)>/)[1],
          filename: part.filename,
          mimeType: part.mimeType,
          size: part.body.size,
          content: data, // Base64 directo
        });
      }
    }

    return attachments;
  }

  /**
   * Recolecta recursivamente todas las partes MIME
   */
  private getAllParts(payload: gmail_v1.Schema$MessagePart | undefined): any[] {
    const parts: gmail_v1.Schema$MessagePart[] = [];
    if (!payload) return parts;

    if (payload.parts) {
      const payParts = payload.parts;

      for (const part of payParts) {
        parts.push(part);
        parts.push(...this.getAllParts(part));
      }
    }
    return parts;
  }

  private async processIncomingMessage(
    gmail: gmail_v1.Gmail,
    message: gmail_v1.Schema$Message,
    email: string,
  ) {
    const messageId = message.id!;
    const threadId = message.threadId!;
    const headers = message.payload?.headers || [];

    const subject = getHeader(headers, 'Subject');
    const from = getHeader(headers, 'From');
    const to = getHeader(headers, 'To');
    const cc = getHeader(headers, 'Cc');
    const bcc = getHeader(headers, 'Bcc');
    const date = getHeader(headers, 'Date');
    const referencesMail = getHeader(headers, 'Message-ID');
    const references = getHeader(headers, 'References');
    const reply = getHeader(headers, 'In-Reply-To');
    const forward = getHeader(headers, 'X-Forwarded-From-Thread');

    const { content } = this.extractHtmlBody(message.payload);

    const replyContent = this.extractReplyContent(content);

    let attachments = await this.extractAttachmentsBase64(
      gmail,
      messageId,
      message.payload,
    );

    console.log('attachments', attachments);

    const payload: EmailSent = {
      messageId: messageId,
      referencesMail: referencesMail,
      threadId: threadId,
      subject: subject,
      from: from,
      to: to,
      date: date,
      references: references,
      inReplyTo: reply,
      content: replyContent,
      forward: forward,
      attachments: attachments,
    };
    this.gateway.emitMailUpdated(payload);
    return email;
  }

  async forwardTo(body: ForwardTo) {
    const { messageId, forwardTo, message, clientId } = body;

    const oauth2Client = await this.authService.getOAuthClient(clientId);

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const original = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });
    if (!original.data.payload?.headers) {
      throw new InternalServerErrorException('Message not found');
    }
    const content = this.gmailActionService.getGmailContentPart(
      original.data.payload,
    );
    const contentHmtl = content.content.find(
      (item) => item.mimeType == 'text/html',
    );
    const headers = original.data.payload.headers;
    const subject = headers.find((h) => h.name === 'Subject')?.value || '';
    const from = headers.find((h) => h.name === 'From')?.value || '';
    const date = headers.find((h) => h.name === 'Date')?.value || '';
    const threadId = original.data.threadId;
    const forward: ForwardBody = {
      from: from,
      subject: subject,
      date: date,
      forwardTo: forwardTo,
      snippet: contentHmtl?.content ?? '',
      threadId: threadId ?? '',
      messageId: messageId,
      message: message,
    };
    const encodedMessage = this.gmailActionService.BuildForward(forward);
    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });
    const data = res.data;
    const emailForward = await this.gmailActionService.getEmailMessageForward(
      gmail,
      data.id ?? '',
    );
    this.gateway.emitMailUpdated(emailForward);
    return emailForward;
  }

  async getMessages(options: {
    query?: string;
    maxResults?: number;
    pageToken?: string;
    refreshToken: string;
    clientId: string;
  }): Promise<{ emails: any[]; nextPageToken?: string }> {
    try {
      const oauth2Client = await this.authService.getOAuthClient(
        options.clientId,
      );

      const gmail = google.gmail({
        version: 'v1',
        auth: oauth2Client,
      });

      const { query = '', maxResults = 10, pageToken } = options || {};
      const messagesResponse = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults,
        pageToken,
      });

      const messages = messagesResponse.data.messages || [];
      console.log('data', messages);
      const emails: any[] = [];
      return {
        emails,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Error getting messages: ${error.message}`,
      );
    }
  }

  private GetParts(part: gmail_v1.Schema$MessagePart) {
    if (part.body?.data) {
      const content = Buffer.from(part.body.data, 'base64url').toString(
        'utf-8',
      );
      const bodyContent: EmailSentContent = {
        mimeType: part.mimeType ?? '',
        content: content,
      };
      return bodyContent;
    }
  }

  async SendEmail(body: BuildCenterEmail) {
    const raw = this.gmailActionService.BuildEmail(body);

    const oauth2Client = await this.authService.getOAuthClient(body.clientId);

    const gmail = google.gmail({
      version: 'v1',
      auth: oauth2Client,
    });
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw },
    });
    return response.data;
  }

  async ProcessEmail(body: BuildCenterEmail) {
    const send = await this.SendEmail(body);

    const oauth2Client = await this.authService.getOAuthClient(body.clientId);

    const gmail = google.gmail({
      version: 'v1',
      auth: oauth2Client,
    });

    const response = await gmail.users.messages.get({
      userId: 'me',
      id: send.id ?? '',
      format: 'full',
    });
    const message = response.data;
    const headers = message.payload?.headers || [];

    const subject = getHeader(headers, 'Subject');
    const from = getHeader(headers, 'From');
    const to = getHeader(headers, 'To');
    const date = getHeader(headers, 'date');
    const referencesMail = getHeader(headers, 'Message-ID');
    const references = getHeader(headers, 'References');
    const reply = getHeader(headers, 'In-Reply-To');
    const forward = getHeader(headers, 'X-Forwarded-From-Thread');

    const { content } = this.extractHtmlBody(message.payload);

    let attachments = await this.extractAttachmentsBase64(
      gmail,
      message.id!,
      message.payload,
    );

    console.log('content', content);
    console.log('attachments', attachments);

    const email: EmailSent = {
      messageId: message.id ?? '',
      referencesMail: referencesMail ?? '',
      threadId: message.threadId ?? '',
      subject: subject ?? '',
      from: from ?? '',
      to: to ?? '',
      date: date,
      references: references,
      inReplyTo: reply,
      content: content,
      forward: forward,
      attachments: attachments,
    };
    return email;
  }

  async GetEmail(messageId: string, gmail) {
    const response = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });
    const message = response.data;
    const headers = message.payload?.headers || [];

    const subject = getHeader(headers, 'Subject');
    const from = getHeader(headers, 'From');
    const to = getHeader(headers, 'To');
    const cc = getHeader(headers, 'Cc');
    const bcc = getHeader(headers, 'Bcc');
    const date = getHeader(headers, 'Date');
    const referencesMail = getHeader(headers, 'Message-ID');
    const references = getHeader(headers, 'References');
    const reply = getHeader(headers, 'In-Reply-To');
    const forward = getHeader(headers, 'X-Forwarded-From-Thread');

    const { content } = this.extractHtmlBody(message.payload);

    let attachments = await this.extractAttachmentsBase64(
      gmail,
      message.id,
      message.payload,
    );

    console.log('content', content);
    console.log('attachments', attachments);

    const email: EmailSent = {
      messageId: message.id ?? '',
      referencesMail: referencesMail ?? '',
      threadId: message.threadId ?? '',
      subject: subject ?? '',
      from: from ?? '',
      to: to ?? '',
      date: date,
      references: references,
      inReplyTo: reply,
      content: content,
      forward: forward,
      attachments: attachments,
    };
    this.gateway.emitMailUpdated(email);
    return email;
  }

  async ReplyEmail(body: ReplyEmail) {
    const messageId = body.messageId;

    const oauth2Client = await this.authService.getOAuthClient(body.clientId);

    const gmail = google.gmail({
      version: 'v1',
      auth: oauth2Client,
    });

    const message = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
    });
    if (!message.data.payload?.headers) {
      throw new InternalServerErrorException('Message not found');
    }
    const threadId = message.data.threadId;
    const headers = message.data.payload.headers;
    const subject = headers.find((h) => h.name === 'Subject')?.value || '';
    const from = headers.find((h) => h.name === 'From')?.value || '';
    const messageIdHeader =
      headers.find((h) => h.name === 'Message-Id')?.value || '';
    const replyBody: ReplyBody = {
      from: from,
      subject: subject,
      messageIdHeader: messageIdHeader,
      content: body.content,
    };

    const encodedMessage = this.gmailActionService.BuildReply(replyBody);
    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
        threadId: threadId,
      },
    });
    const data = res.data;
    await this.GetEmail(data.id ?? '', gmail);
  }

  async GetFile(messageId: string, attachmentId: string, clientId: string) {
    const oauth2Client = await this.authService.getOAuthClient(clientId);

    const gmail = google.gmail({
      version: 'v1',
      auth: oauth2Client,
    });
    return await this.attachmnetService.GetFile(messageId, attachmentId, gmail);
  }
}
