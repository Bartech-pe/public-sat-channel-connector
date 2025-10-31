import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ChatHubModule } from './modules/chat-hub/chat-hub.module';
import { WhatsappOfficialModule } from './modules/whatsapp-official/whatsapp-official.module';
import { InstagramModule } from './modules/instagram/instagram.module';
import { MessengerModule } from './modules/messenger/messenger.module';
import { ChatsatModule } from './modules/chatsat/chatsat.module';
import { GmailModule } from './modules/gmail/gmail.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ChatHubModule,
    WhatsappOfficialModule,
    InstagramModule,
    MessengerModule,
    ChatsatModule,
    GmailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
