import { Controller, Get, Post, Query, Req, Res, Body, HttpStatus, Logger, BadRequestException } from '@nestjs/common';
import { WhatsappOfficialService } from '../whatsapp-official.service';
import { Request, Response } from 'express';

@Controller('whatsapp/webhook')
export class WebhookController {
	private readonly logger = new Logger(WebhookController.name);
	private readonly VERIFY_TOKEN = process.env.VERIFY_TOKEN;
	constructor(private readonly whatsappOfficialService: WhatsappOfficialService) {}

	@Get()
	verify(@Query() q: any, @Res() res: Response) {
		const mode = q['hub.mode'], token = q['hub.verify_token'], challenge = q['hub.challenge'];
		this.logger.log(`Verify attempt: mode=${mode}`);
		if (mode === 'subscribe' && token === this.VERIFY_TOKEN) return res.status(200).send(challenge);
		return res.sendStatus(403);
	}

	@Post()
	handleWebhook(@Req() req: Request, @Res() res: Response) {
		this.whatsappOfficialService.handleIncomingMessage(req.body);
		res.sendStatus(200);
	}
}
