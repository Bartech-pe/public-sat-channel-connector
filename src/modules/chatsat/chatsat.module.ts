import { forwardRef, Module } from '@nestjs/common';
import { ChatsatService } from './chatsat.service';
import { ChatsatGateway } from './chatsat.gateway';
import { ChatHubModule } from '../chat-hub/chat-hub.module';
import { ChatsatController } from './chatsat.controller';

@Module({
  imports: [forwardRef(() => ChatHubModule)],
  providers: [ChatsatGateway, ChatsatService],
  exports: [ChatsatGateway],
  controllers: [ChatsatController]
})
export class ChatsatModule {}
