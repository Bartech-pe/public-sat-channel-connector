import { Body, Controller, Headers, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { IncomingMessage } from 'src/common/interfaces/chat-hub/incoming/incoming.interface';
import { ChatsatService } from './chatsat.service';

@Controller('chatsat')
export class ChatsatController {

	constructor(private chatsatService: ChatsatService){}

	@Post('send-message')
	@HttpCode(HttpStatus.OK)
	async initiateLogin(
		@Body() data: IncomingMessage,
		@Headers('authorization') authHeader: string,
	) {
		return await this.chatsatService.sendMessage({
			...data,
			token: authHeader,
		});
	}

}
