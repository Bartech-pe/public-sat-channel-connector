import { Controller, Post, Get, Body, HttpException, HttpStatus, HttpCode } from '@nestjs/common';
import { TelegramService } from './telegram.service';
// import { TelegramSessionsService } from './sessions/telegram-sessions.service';

@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Post('init')
  @HttpCode(HttpStatus.OK)
  async initiateLogin(@Body() body: { phoneNumber: string; force?: boolean, email?: string }) {
    return this.telegramService.initiateLogin(body.phoneNumber, body.force, body.email);
  }

  @Post('confirm-code')
  @HttpCode(HttpStatus.OK)
  async confirmCode(@Body() body: { phoneNumber: string; code: string }) {
    return this.telegramService.confirmCode(body.phoneNumber, body.code);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body('phoneNumber') phoneNumber: string) {
    return this.telegramService.logout(phoneNumber);
  }

  @Post('send-message')
  @HttpCode(HttpStatus.OK)
  async sendMessage(@Body() body: { phoneNumber: string; chatId: number; text: string }) {
    return this.telegramService.sendMessage(body.phoneNumber, body.chatId, body.text);
  }

  @Post('get-chats')
  async getChats(@Body() body: { phoneNumber: string; limit?: number }) {
    return this.telegramService.getChats(body.phoneNumber, body.limit || 20);
  }

  @Post('get-chat-messages')
  @HttpCode(HttpStatus.OK)
  async getChatMessages(@Body() body: { phoneNumber: string; chatId: number; limit?: number }) {
    return this.telegramService.getChatMessages(body.phoneNumber, body.chatId, body.limit || 50);
  }

  // @Get('active-sessions')
  // @HttpCode(HttpStatus.OK)
  // async getActiveSessions() {
  //   return this.telegramSessionsService.getActiveSessions();
  // }
}