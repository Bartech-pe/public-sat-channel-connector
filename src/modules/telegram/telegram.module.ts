import { Module } from '@nestjs/common';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';
import { TelegramGateway } from './telegram.gateway';
// import { TelegramSessionsService } from './sessions/telegram-sessions.service';
// import { TelegramSessionRepository } from 'src/modules/telegram/repositories/telegram-sessions/telegram-session.repository';
import { SequelizeModule } from '@nestjs/sequelize';
import { TelegramSession } from './models/sessions/telegram-session.model';
import { ConfigModule } from '@nestjs/config';
import { ChatHubService } from '../chat-hub/chat-hub.service';

@Module({
  imports: [ConfigModule],
  providers: [TelegramService, TelegramGateway, ChatHubService],
  controllers: [TelegramController],
  exports: [TelegramService],
})
export class TelegramModule {}
