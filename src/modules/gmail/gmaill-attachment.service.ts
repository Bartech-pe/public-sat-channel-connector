import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { gmail_v1 } from 'googleapis';

@Injectable()
export class GmailAttachmentService {
  async GetFile(
    messageId: string,
    attachmentId: string,
    gmail: gmail_v1.Gmail,
  ) {
    const attachment = await gmail.users.messages.attachments.get({
      userId: 'me',
      messageId,
      id: attachmentId,
    });
    if (!attachment.data.data)
      throw new InternalServerErrorException('Adjunto no evidenciado');
    const buffer = Buffer.from(attachment.data.data, 'base64');
    return buffer;
  }
}
