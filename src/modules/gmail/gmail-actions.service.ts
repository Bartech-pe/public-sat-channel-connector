/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable no-unsafe-optional-chaining */
import { Injectable } from '@nestjs/common';
import { BuildCenterEmail } from './dto/BuildEmail';
import { ReplyBody } from './dto/reply-email.dto';
import { ForwardBody } from './dto/forward-to.dto';
import { gmail_v1 } from 'googleapis';
import {
  AttachmentContent,
  EmailSent,
  EmailSentContent,
} from './dto/EmailSent.dto';

@Injectable()
export class GmailActionService {
  constructor() {}
  private toBase64Url(input: string) {
    return Buffer.from(input, 'utf-8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
  private encodeMessage(input: string) {
    return Buffer.from(input)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
  BuildForward(body: ForwardBody) {
    const {
      subject,
      from,
      date,
      snippet,
      forwardTo,
      threadId,
      messageId,
      message,
    } = body;
    const rawMessage = [
      `From: me`,
      `To: ${forwardTo}`,
      `Subject: Fwd: ${subject}`,
      `X-Forwarded-From-Thread: ${threadId}`,
      `X-Forwarded-Original-Message: ${messageId}`,
      `Content-Type: text/html; charset="UTF-8"`,
      ``,
      message ? `${message}<hr/>` : ``,
      `<b>---------- Mensaje reenviado ----------</b><br/>`,
      `<b>De:</b> ${from}<br/>`,
      `<b>Fecha:</b> ${date}<br/>`,
      `<b>Asunto:</b> ${subject}<br/><br/>`,
      `${snippet}`,
    ].join('\n');
    const encodedMessage = this.encodeMessage(rawMessage);
    return encodedMessage;
  }
  BuildReply(body: ReplyBody) {
    const rawMessage = [
      `To: ${body.from}`,
      `Subject: Re: ${body.subject}`,
      `In-Reply-To: ${body.messageIdHeader}`,
      `References: ${body.messageIdHeader}`,
      `Content-Type: text/html; charset="UTF-8"`,
      '',
      body.content,
    ].join('\n');
    const encodedMessage = this.encodeMessage(rawMessage);
    return encodedMessage;
  }
  BuildEmail(body: BuildCenterEmail) {
    const headers: string[] = [];
    headers.push(`From: ${body.from}`);
    headers.push(`To: ${body.to.join(', ')}`);
    if (body.cc) headers.push(`Cc: ${body.cc}`);
    if (body.bcc?.length) headers.push(`Bcc: ${body.bcc.join(', ')}`);
    const encodedSubject = `=?UTF-8?B?${Buffer.from(body.subject, 'utf-8').toString('base64')}?=`;
    headers.push(`Subject: ${encodedSubject}`);
    headers.push(`MIME-Version: 1.0`);
    const boundary = `mime_boundary_${Date.now()}`;
    let content = '';
    if (body.attachments?.length) {
      const mixedBoundary = `mixed_boundary_${Date.now()}`;
      headers.push(
        `Content-Type: multipart/mixed; boundary="${mixedBoundary}"`,
      );
      if (body.text && body.html) {
        const altBoundary = `alt_boundary_${Date.now()}`;
        content += [
          `--${mixedBoundary}`,
          `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
          ``,
          `--${altBoundary}`,
          `Content-Type: text/plain; charset="UTF-8"`,
          ``,
          body.text,
          `--${altBoundary}`,
          `Content-Type: text/html; charset="UTF-8"`,
          ``,
          body.html,
          `--${altBoundary}--`,
          ``,
        ].join('\r\n');
      } else if (body.html) {
        content += [
          `--${mixedBoundary}`,
          `Content-Type: text/html; charset="UTF-8"`,
          ``,
          body.html,
          ``,
        ].join('\r\n');
      } else if (body.text) {
        content += [
          `--${mixedBoundary}`,
          `Content-Type: text/plain; charset="UTF-8"`,
          ``,
          body.text,
          ``,
        ].join('\r\n');
      }
      for (const file of body.attachments) {
        const fileContent = Buffer.from(file.content).toString('base64');
        content += [
          `--${mixedBoundary}`,
          `Content-Type: ${file.mimeType}; name="${file.filename}"`,
          `Content-Disposition: attachment; filename="${file.filename}"`,
          `Content-Transfer-Encoding: base64`,
          ``,
          fileContent,
          ``,
        ].join('\r\n');
        content += `--${mixedBoundary}--`;
      }
    } else {
      if (body.text && body.html) {
        headers.push(
          `Content-Type: multipart/alternative; boundary="${boundary}"`,
        );
        content = [
          `--${boundary}`,
          `Content-Type: text/plain; charset="UTF-8"`,
          ``,
          body.text,
          `--${boundary}`,
          `Content-Type: text/html; charset="UTF-8"`,
          ``,
          body.html,
          `--${boundary}--`,
        ].join('\r\n');
      } else if (body.html) {
        headers.push(`Content-Type: text/html; charset="UTF-8"`);
        content = body.html;
      } else if (body.text) {
        headers.push(`Content-Type: text/plain; charset="UTF-8"`);
        content = body.text;
      } else {
        headers.push(`Content-Type: text/plain; charset="UTF-8"`);
        content = '';
      }
    }
    const mime = `${headers.join('\r\n')}\r\n\r\n${content}`;
    const raw = this.toBase64Url(mime);
    return raw;
  }
  async getEmailMessageForward(gmail: gmail_v1.Gmail, messageId: string) {
    const response = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });
    const message = response.data;
    const headers = message.payload?.headers || [];
    const getHeader = (name: string) =>
      headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())
        ?.value || null;
    const subject = getHeader('Subject');
    const from = getHeader('From');
    const to = getHeader('To');
    const referencesMail = getHeader('Message-ID');
    const references = getHeader('References');
    const reply = getHeader('In-Reply-To');
    const forward = getHeader('X-Forwarded-From-Thread');
    let content: EmailSentContent[] = [];
    let files: AttachmentContent[] = [];
    if (message.payload) {
      content = this.getGmailContentPart(message.payload).content;
      files = this.getGmailContentPart(message.payload).files;
    }
    const email: EmailSent = {
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
    };
    return email;
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
    } else if (part.body?.attachmentId) {
      const bodyContent: AttachmentContent = {
        mimeType: part.mimeType ?? '',
        attachmentId: part.body?.attachmentId,
        filename: part.filename ?? '',
      };
      return bodyContent;
    }
  }
  isEmailSentContent(content: any): content is EmailSentContent {
    return (content as EmailSentContent).content !== undefined;
  }

  isAttachmentContent(content: any): content is AttachmentContent {
    return (content as AttachmentContent).attachmentId !== undefined;
  }
  getGmailContentPart(payload: gmail_v1.Schema$MessagePart) {
    const content: EmailSentContent[] = [];
    const files: AttachmentContent[] = [];
    if (payload?.parts) {
      for (const subPart of payload?.parts) {
        const body = subPart.body;
        if (body) {
          const partContent = this.GetParts(subPart);
          if (partContent) {
            if (this.isEmailSentContent(partContent)) {
              content.push(partContent);
            } else if (this.isAttachmentContent(partContent)) {
              files.push(partContent);
            }
          }
        }
        const parts = subPart.parts;
        if (parts) {
          for (const minSubPart of parts) {
            const nestedContent = this.GetParts(minSubPart);
            if (nestedContent && this.isEmailSentContent(nestedContent)) {
              content.push(nestedContent);
            } else if (
              nestedContent &&
              this.isAttachmentContent(nestedContent)
            ) {
              files.push(nestedContent);
            }
          }
        }
      }
    } else if (payload?.body?.data) {
      const data = payload.body?.data ?? '';
      const encoded = Buffer.from(data, 'base64url').toString('utf-8');
      const bodyContent: EmailSentContent = {
        mimeType: payload.mimeType ?? '',
        content: encoded,
      };
      content.push(bodyContent);
    }
    return { content, files };
  }
}
