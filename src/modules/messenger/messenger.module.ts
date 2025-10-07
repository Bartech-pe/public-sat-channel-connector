import { Module } from '@nestjs/common';
import { FacebookMessengerService } from './messenger.service';
import { FacebookMessengerController } from './messenger.controller';

@Module({
  controllers: [FacebookMessengerController],
  providers: [FacebookMessengerService],
})
export class MessengerModule {}
