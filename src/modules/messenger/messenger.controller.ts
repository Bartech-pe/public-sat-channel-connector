import { Controller, Post, Get, Body, Query, Param, Headers, RawBodyRequest, Req, Res, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { FacebookCredentials } from './interfaces/common.interface';

@Controller('facebook-messenger')
export class FacebookMessengerController {
  private readonly logger = new Logger(FacebookMessengerController.name);

  // constructor(private readonly facebookService: FacebookMessengerService) {}

  // @Post('authenticate')
  // async authenticate(@Body() credentials: FacebookCredentials): Promise<{ success: boolean; userId: string }> {
  //   return this.facebookService.authenticateUser(credentials);
  // }

  // @Post('send-message/:userId')
  // async sendMessage(
  //   @Param('userId') userId: string,
  //   @Body() body: { recipientId: string; message: FacebookOutgoingMessage }
  // ): Promise<FacebookMessageResponse> {
  //   return this.facebookService.sendMessage(userId, body.recipientId, body.message);
  // }

  // @Get('user-profile/:userId/:profileId')
  // async getUserProfile(
  //   @Param('userId') userId: string,
  //   @Param('profileId') profileId: string
  // ): Promise<FacebookUser> {
  //   return this.facebookService.getUserProfile(userId, profileId);
  // }

  // @Get('webhook/:userId')
  // async verifyWebhook(
  //   @Param('userId') userId: string,
  //   @Query('hub.mode') mode: string,
  //   @Query('hub.verify_token') token: string,
  //   @Query('hub.challenge') challenge: string,
  //   @Res() res: Response
  // ): Promise<void> {
  //   try {
  //     const result = this.facebookService.verifyWebhook(mode, token, challenge, userId);
  //     res.status(HttpStatus.OK).send(result);
  //   } catch (error) {
  //     this.logger.error(`Webhook verification failed: ${error.message}`);
  //     res.status(HttpStatus.FORBIDDEN).send('Forbidden');
  //   }
  // }

  // @Post('webhook/:userId')
  // async handleWebhook(
  //   @Param('userId') userId: string,
  //   @Body() payload: FacebookWebhookPayload,
  //   @Headers('x-hub-signature-256') signature: string,
  //   @Req() req: RawBodyRequest<Request>
  // ): Promise<{ success: boolean }> {
  //   try {
  //     // En un entorno real, deberías verificar la firma del webhook
  //     // const rawBody = req.rawBody?.toString('utf8') || '';
  //     // const credentials = await this.getUserCredentials(userId);
  //     // const isValidSignature = this.facebookService.verifySignature(rawBody, signature, credentials.appSecret);
      
  //     // if (!isValidSignature) {
  //     //   throw new UnauthorizedException('Invalid signature');
  //     // }

  //     await this.facebookService.processWebhookPayload(payload, userId);
      
  //     return { success: true };
  //   } catch (error) {
  //     this.logger.error(`Webhook processing failed: ${error.message}`);
  //     throw error;
  //   }
  // }
}
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta
// Borrar para respuesta