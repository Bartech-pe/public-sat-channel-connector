import { Module } from '@nestjs/common';
import { InstagramService } from './instagram.service';
import { InstagramController } from './instagram.controller';
import { WebhookController } from './webhook/webhook.controller';
import { PassportModule } from '@nestjs/passport';
import { FacebookStrategy } from './strategies/facebook.strategy';


@Module({
  imports: [PassportModule.register({ defaultStrategy: 'facebook' })],
  controllers: [InstagramController, WebhookController],
  providers: [InstagramService, FacebookStrategy],
})
export class InstagramModule {}
