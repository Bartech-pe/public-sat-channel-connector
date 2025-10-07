import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';



@Controller('whatsapp')
export class WhatsappController {
	constructor(
		private readonly whatsappService: WhatsappService,
	) {}

	@Post('init')
	async init(@Body() body: { phoneNumber: string }) {
		const result = await this.whatsappService.createClientAndGetQR(body.phoneNumber);
		return result;
	}

	@Post('initialize/:phoneNumber')
		async initialize(@Param('phoneNumber') phoneNumber: string) {
		return this.whatsappService.initializeSession(phoneNumber);
	}
}
