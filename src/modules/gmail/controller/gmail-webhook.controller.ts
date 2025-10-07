/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Body, Controller, Post, Req } from '@nestjs/common';
import { GmailService } from '../gmail.service';

@Controller('gmail/webhook')
export class GmailWebhookController {
  constructor(private readonly gmailService: GmailService) {}
  @Post()
  async handlePubSub(@Body() body: any, @Req() req: any) {
    try {
      const message = body?.message;
      const data = Buffer.from(message.data, 'base64').toString();
      const payload = JSON.parse(data);
      await this.gmailService.handleGmailNotification(payload);
    } catch (error) {
      console.error('Error procesando notificación Pub/Sub:', error);
    }
  }
}
