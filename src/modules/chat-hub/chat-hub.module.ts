import { forwardRef, Module } from '@nestjs/common';
import { TelegramModule } from '../telegram/telegram.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { ChatHubGateway } from './chat-hub.gateway';
import { WhatsappOfficialModule } from '../whatsapp-official/whatsapp-official.module';
import { WhatsappOfficialService } from '../whatsapp-official/whatsapp-official.service';
import { TelegramService } from '../telegram/telegram.service';
import { WhatsappOfficialGateway } from '../whatsapp-official/whatsapp-official.gateway';
import { ChatHubService } from './chat-hub.service';
import { ChatsatModule } from '../chatsat/chatsat.module';


@Module({
  imports: [TelegramModule, WhatsappOfficialModule, forwardRef(() => ChatsatModule)],
  providers: [
    ChatHubGateway, 
    ChatHubService,
  ], 
  exports: [ChatHubService, ChatHubGateway]
})
export class ChatHubModule {}
