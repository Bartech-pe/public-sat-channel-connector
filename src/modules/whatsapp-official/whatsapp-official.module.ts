import { Module } from '@nestjs/common';
import { WhatsappOfficialService } from './whatsapp-official.service';
import { WhatsappOfficialGateway } from './whatsapp-official.gateway';
import { WhatsappOfficialController } from './whatsapp-official.controller';
import { WebhookController } from './webhook/webhook.controller';

@Module({
  controllers: [WhatsappOfficialController, WebhookController],
  providers: [WhatsappOfficialService, WhatsappOfficialGateway],
  exports: [WhatsappOfficialService, WhatsappOfficialGateway]
})
export class WhatsappOfficialModule {}
