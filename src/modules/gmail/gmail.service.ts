/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable no-unsafe-optional-chaining */
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { gmail_v1, google } from 'googleapis';
import { AuthGmailService } from './auth-gmail.service';
import { BuildCenterEmail, Watchail } from './dto/BuildEmail';
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
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
@Injectable()
export class GmailService {
  private readonly logger = new Logger(GmailService.name);
  private gmail: gmail_v1.Gmail;
  constructor(
    private readonly authService: AuthGmailService,
    private readonly gateway:GmailGateway,
    private readonly gmailActionService:GmailActionService,
    private readonly attachmnetService: GmailAttachmentService
  ) {}

  async onModuleInit() {
    const oauthClient = await this.authService.restoreOauthClient();
    if (oauthClient) {
      this.gmail = google.gmail({ version: 'v1', auth: oauthClient });
      console.log('✅ Gmail client restaurado automáticamente desde Redis');
    } else {
      console.log('⚠️ Gmail client no restaurado: configuración faltante');
    }
  }

  private async setToken(access_token: string, refresh_token: string) {
    const oauth2Client = await this.authService.GetAuthClient();
    if (!oauth2Client) throw new Error('OAuth client no disponible');
    oauth2Client.setCredentials({
      access_token,
      refresh_token,
    });
    this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  }

  async RefreshSetToken(refreshToken: string) {
    const infoToken = await this.authService.RefrestToken(refreshToken);
    await this.setToken(infoToken.accessToken, infoToken.refreshToken)
  }
  private historyNumber;
   
  async setWatch(body: Watchail) {
    try {
      const infoToken = await this.authService.RefrestToken(body.refreshToken);
      await this.setToken(infoToken.accessToken, infoToken.refreshToken);

      const response = await this.gmail.users.watch({
        userId: 'me',
        requestBody: {
          labelIds: ['INBOX'],
          topicName: `projects/${body.projectId}/topics/${body.topicName}`,
          labelFilterAction: 'include',
        },
      });
      console.log('watch', response.data);
      this.historyNumber = response.data.historyId;
      return response.data;
    } catch (err) {
      if (err?.message === 'refresh_token_revoked' || err?.response?.data?.error === 'invalid_grant') {
        console.error('Refresh token inválido. Notificando al CRM para reautorización.');
        await this.notifyCrmRefreshNeeded();
        throw new InternalServerErrorException('Refresh token inválido, se requiere reautenticación.');
      }
      console.error('Error en StarWatch', err);
      throw err;
    }
  }

  private async notifyCrmRefreshNeeded() {
    this.logger.debug("Token is dead")
  }
  
async handleGmailNotification(data: any): Promise<void> {
    try {
      const oauthCli = await this.authService.GetAuthClient();
      const { expiry_date, refresh_token } = oauthCli?.credentials || {};
      if (this.authService.isExpired(expiry_date)) {
        // usar el refresh token guardado en Redis/CRM para renovar
        const infoToken = await this.authService.RefrestToken(refresh_token);
        await this.setToken(infoToken.accessToken, infoToken.refreshToken);
      }
      const history = await this.gmail.users.history.list({
        userId: 'me',
        startHistoryId: this.historyNumber,
        historyTypes: ['messageAdded'],
      });
      for (const record of history.data.history || []) {
      if (Array.isArray(record.messagesAdded)) {
        for (const added of record.messagesAdded) {
          const message = added.message;
          if (message?.labelIds?.includes('UNREAD')||message?.labelIds?.includes('SENT')) {
            console.log('📩 Mensaje con label SENT:', message.id, message.labelIds);
            await this.GetEmail(message.id ?? '')
          }
        }
      }
    }
    } catch (err) {
      if (err?.message === 'refresh_token_revoked' || (err?.response?.data && err.response.data.error === 'invalid_grant')) {
        // no intentar refrescar mas, notificar CRM
        await this.notifyCrmRefreshNeeded();
        return;
      }
      throw err;
    }
  }
  
  async forwardTo(body:ForwardTo) {
    const {messageId,forwardTo,message}=body;
    const original = await this.gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });
    if(!original.data.payload?.headers){
      throw new InternalServerErrorException('Message not found');
    }
    const content = this.gmailActionService.getGmailContentPart(original.data.payload)
    const contentHmtl = content.content.find((item)=>item.mimeType=='text/html')
    const headers = original.data.payload.headers;
    const subject = headers.find(h => h.name === 'Subject')?.value || '';
    const from = headers.find(h => h.name === 'From')?.value || '';
    const date = headers.find(h => h.name === 'Date')?.value || '';
    const threadId = original.data.threadId;
    const forward: ForwardBody= {
      from: from,
      subject: subject,
      date: date,
      forwardTo: forwardTo,
      snippet: contentHmtl?.content ?? '',
      threadId: threadId ?? '',
      messageId: messageId,
      message: message
    }
    const encodedMessage = this.gmailActionService.BuildForward(forward)
    const res = await this.gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });
    const data = res.data;
    const emailForward = await  this.gmailActionService.getEmailMessageForward(this.gmail,data.id ?? '')
    this.gateway.emitProductUpdated(emailForward)
    return emailForward;
  }





    async getMessages(options?: {
    query?: string;
    maxResults?: number;
    pageToken?: string;
    refreshToken:string;
  }): Promise<{ emails: any[]; nextPageToken?: string }> {
    try {
      const refresh = options?.refreshToken ?? '';
      const emailFrom = await this.authService.RefrestToken(refresh);
      await this.setToken(emailFrom.accessToken, emailFrom.refreshToken);
      const { query = '', maxResults = 10, pageToken } = options || {};
      const messagesResponse = await this.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults,
        pageToken,
      });

      const messages = messagesResponse.data.messages || [];
      console.log('data',messages)
      const emails: any[] = [];
      return {
        emails,
      };
    } catch (error) {
      throw new InternalServerErrorException(`Error getting messages: ${error.message}`);
    }
  }
  private GetParts(part: gmail_v1.Schema$MessagePart) {
    if (part.body?.data) {
      const content = Buffer.from(part.body.data, 'base64url').toString(
        'utf-8',
      );
      const bodyContent:EmailSentContent={
        mimeType: part.mimeType ?? '',
        content: content
      }
      return bodyContent;
     }
    }
 
  async SendEmail(body: BuildCenterEmail) {
    const raw = this.gmailActionService.BuildEmail(body);
    const emailFrom = await this.authService.RefrestToken(body.refreshToken);
    await this.setToken(emailFrom.accessToken, emailFrom.refreshToken);
    const response = await this.gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw },
    });
    return response.data;
  }
  async ProcessEmail(body:BuildCenterEmail){
     const send = await this.SendEmail(body)
     const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: send.id ?? '',
        format: 'full', 
    });
    const message = response.data;
    const headers = message.payload?.headers || [];
    const getHeader = (name: string) => 
    headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || null;
    const subject = getHeader('Subject');
    const from = getHeader('From');
    const to = getHeader('To');
    const referencesMail = getHeader('Message-ID');
    const references = getHeader('References')
    const reply =  getHeader('In-Reply-To');
    const forward =  getHeader('X-Forwarded-From-Thread');

    let content:EmailSentContent[]=[];
    let files: AttachmentContent[]=[];
    if (message.payload) {
      content = this.gmailActionService.getGmailContentPart(message.payload).content;
      files  = this.gmailActionService.getGmailContentPart(message.payload).files;
    }
    const email:EmailSent={
      messageId: message.id ?? '',
      referencesMail: referencesMail ?? '',
      threadId: message.threadId ?? '',
      subject: subject ?? '',
      from: from ?? '',
      to: to ?? '',
      references: references,
      inReplyTo: reply,
      content: content.length == 0 ? [{ mimeType: 'text/plain', content: body.text ?? '' }] : content,
      forward: forward,
      attachment: files
    }
    return email;
  }
  async GetEmail(messageId:string){
    const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full', 
    });
    const message = response.data;
    const headers = message.payload?.headers || [];
    const getHeader = (name: string) => 
    headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || null;
    const subject = getHeader('Subject');
    const from = getHeader('From');
    const to = getHeader('To');
    //const cc = getHeader('Cc');
    //const bcc = getHeader('Bcc');
    //const date = getHeader('Date');
    const referencesMail = getHeader('Message-ID');
    const references = getHeader('References')
    const reply =  getHeader('In-Reply-To');
    const forward =  getHeader('X-Forwarded-From-Thread');

    let content:EmailSentContent[]=[];
    let files: AttachmentContent[]=[];
    if (message.payload) {
      content = this.gmailActionService.getGmailContentPart(message.payload).content;
      files  = this.gmailActionService.getGmailContentPart(message.payload).files;
    }
    
    console.log('content',content)
    console.log('content',files)

    const email:EmailSent={
      messageId: message.id ?? '',
      referencesMail: referencesMail ?? '',
      threadId: message.threadId ?? '',
      subject: subject ?? '',
      from: from ?? '',
      to: to ?? '',
      references: references,
      inReplyTo: reply,
      content: content,
      forward: forward,
      attachment: files,
    }
    this.gateway.emitProductUpdated(email)
    return email;
  }
  async ReplyEmail(body: ReplyEmail) {
    const messageId = body.messageId;
    const message = await this.gmail.users.messages.get({
      userId: 'me',
      id: messageId,
    });
    if(!message.data.payload?.headers){
      throw new InternalServerErrorException('Message not found');
    }
    const threadId = message.data.threadId;
    const headers = message.data.payload.headers;
    const subject = headers.find(h => h.name === 'Subject')?.value || '';
    const from = headers.find(h => h.name === 'From')?.value || '';
    const messageIdHeader = headers.find(h => h.name === 'Message-Id')?.value || '';
    const replyBody:ReplyBody={
      from: from,
      subject: subject,
      messageIdHeader: messageIdHeader,
      content: body.content
    }
    const encodedMessage = this.gmailActionService.BuildReply(replyBody)
    const res = await this.gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
        threadId: threadId,  
      },
    })
    const data = res.data;
    await this.GetEmail(data.id ?? '')
  }
  async GetFile(messageId:string,attachmentId:string){
     return await this.attachmnetService.GetFile(messageId,attachmentId,this.gmail)
  }
}
