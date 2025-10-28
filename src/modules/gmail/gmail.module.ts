import { Module } from '@nestjs/common';
import { AuthGmailService } from './auth-gmail.service';
import { GmailService } from './gmail.service';
import { GmailController } from './controller/gmail.controller';
import { GmailAttachmentController } from './controller/gmail-attachment.controller';

import { GmailAttachmentService } from './gmaill-attachment.service';
import { GmailWebhookController } from './controller/gmail-webhook.controller';
import { GmailGateway } from './gateway/gmail-gateway';
import { GmailActionService } from './gmail-actions.service';
import { RedisService } from './redis/redis.service';
@Module({
  imports: [],
  exports: [],
  controllers: [
    GmailController,
    GmailAttachmentController,
    GmailWebhookController,
  ],
  providers: [
    AuthGmailService,
    GmailGateway,
    RedisService,
    GmailService,
    GmailAttachmentService,
    GmailActionService,
  ],
})
export class GmailModule {}
