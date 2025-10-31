import {
  Controller,
  Get,
  Post,
  Query,
  Res,
  Body,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { InstagramService } from '../instagram.service';
import { WebhookEvent } from '../interfaces/instagram.interface';
import { channelConfig, envConfig } from 'config/env';

@Controller('instagram/webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private readonly svc: InstagramService) {}

  @Get()
  verify(@Query() q: any, @Res() res: Response) {
    const mode = q['hub.mode'],
      token = q['hub.verify_token'],
      challenge = q['hub.challenge'];
    this.logger.log(`Verify attempt: mode=${mode}`);
    if (mode === 'subscribe' && token === channelConfig.igVerifyToken)
      return res.status(200).send(challenge);
    return res.sendStatus(403);
  }

  @Post()
  async receive(@Body() body: WebhookEvent, @Res() res: Response) {
    this.logger.log('Webhook received');
    if (body.object === 'instagram' || body.object === 'page') {
      await this.svc.handleWebhookEvent(body);
      return res.sendStatus(200);
    }
    return res.sendStatus(404);
  }

  @Post('simulate')
  async simulate(@Body() data: any, @Res() res: Response) {
    if (!data.message) throw new BadRequestException('message required');
    this.logger.log('Simulate');
    await this.svc.processIncomingMessage({
      sender: { id: data.senderId },
      recipient: { id: data.pageId },
      timestamp: Date.now(),
      message: {
        text: data.message,
        mid: '',
      },
    });
    res.json({ success: true });
  }

  @Get('status')
  status(@Res() res: Response) {
    res.json({
      success: true,
      verifyToken: channelConfig.igVerifyToken ? 'set' : 'not set',
      timestamp: new Date().toISOString(),
    });
  }

  @Get('config')
  config(@Res() res: Response) {
    res.json({
      success: true,
      webhookUrl: `${envConfig.baseUrl}/instagram/webhook`,
      verifyToken: channelConfig.igVerifyToken ? 'set' : 'not set',
    });
  }
}
