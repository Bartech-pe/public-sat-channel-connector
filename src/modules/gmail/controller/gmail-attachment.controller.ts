import { Body, Controller, Post, Res } from '@nestjs/common';
import { AttachementBody } from '../dto/AttachementBody';
import { GmailService } from '../gmail.service';
import { Response } from 'express';

@Controller('mailAttachment')
export class GmailAttachmentController {
  constructor(private readonly attachmnetService: GmailService) {}
  @Post('AttachmentFile')
  async PostMailAttachment(@Body() body: AttachementBody) {
    return await this.attachmnetService.GetFile(
      body.messageId,
      body.attachmentId,
      body.clientId,
      body.email,
    );
  }
  @Post('see')
  async SeeFile(@Body() body: AttachementBody, @Res() res: Response) {
    const buffer = await this.attachmnetService.GetFile(
      body.messageId,
      body.attachmentId,
      body.clientId,
      body.email,
    );
    res.setHeader('Content-Type', body.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${body.filename}"`,
    );
    res.send(buffer);
  }
}
