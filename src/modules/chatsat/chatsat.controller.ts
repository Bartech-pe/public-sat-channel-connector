import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { IncomingMessage } from 'src/common/interfaces/chat-hub/incoming/incoming.interface';
import { ChatsatService } from './chatsat.service';
import { ChatHubService } from '../chat-hub/chat-hub.service';
import { CreateChannelCitizenDto } from './dto/create-channel-citizen.dto';
import { CreateSurveyDto } from './dto/create-survey.dto';

@Controller('chatsat')
export class ChatsatController {

	constructor(
		private chatsatService: ChatsatService,
		private chathubService: ChatHubService
	){}

	@Get('check-available-advisors')
	@HttpCode(HttpStatus.OK)
	async checkForAvailableAdvisors() {
		return await this.chathubService.checkForAvailableAdvisors();
	}

	@Post('create-citizen')
	@HttpCode(HttpStatus.OK)
	async createCitizenInCrm(@Body() payload: CreateChannelCitizenDto) {
		return await this.chathubService.createCitizenInCrm(payload);
	}
	
	@Post('attention/:assistanceId/send-to-email')
	@HttpCode(HttpStatus.OK)
	async sendMessagesHtmlFromChannelAttentionForChatsat(
		@Param('assistanceId') assistanceId: number,
		@Headers('authorization') authHeader: string
	) 
	{
		return await this.chathubService
			.sendMessagesHtmlFromChannelAttentionForChatsat(assistanceId, authHeader);
	}

	@Post('create-survey')
	@HttpCode(HttpStatus.OK)
	async SurveyCreate(
		@Body() dto: CreateSurveyDto,
		@Headers('authorization') authHeader: string,
	) 
	{	
		return await this.chathubService.SurveyCreate(dto, authHeader);
	}

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
