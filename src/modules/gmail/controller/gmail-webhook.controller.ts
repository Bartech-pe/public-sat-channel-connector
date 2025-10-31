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
  async handlePubSub(@Body() body: any) {
    console.log('Mensaje recibido de Gmail Pub/Sub', body);
    const message = body?.message;
    if (!message?.data) return;

    const decoded = Buffer.from(message.data, 'base64').toString();
    const payload = JSON.parse(decoded);

    await this.gmailService.handleGmailNotification(payload);
  }
}
