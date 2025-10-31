import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
// import { HttpService } from '@nestjs/axios';

@Injectable()
export class FacebookMessengerService {
  // private readonly logger = new Logger(FacebookMessengerService.name);
  // private readonly baseUrl = 'https://graph.facebook.com/v18.0';
  // constructor(
  //   // private readonly httpService: HttpService,
  //   private readonly configService: ConfigService,
  // ) {}
  // async authenticateUser(credentials: FacebookCredentials): Promise<{ success: boolean; userId: string }> {
  //   try {
  //     // Validar credenciales con Facebook API
  //     const isValid = await this.validateCredentials(credentials);
  //     if (!isValid) {
  //       throw new UnauthorizedException('Invalid Facebook credentials');
  //     }
  //     // Enviar credenciales a la API externa
  //     const response = await this.externalApiService.saveCredentials({
  //       userId: credentials.userId,
  //       platform: 'facebook_messenger',
  //       credentials,
  //       isActive: true,
  //       createdAt: new Date(),
  //       updatedAt: new Date(),
  //     });
  //     if (!response.success) {
  //       throw new Error(`Failed to save credentials: ${response.error}`);
  //     }
  //     this.logger.log(`User ${credentials.userId} authenticated successfully for Facebook Messenger`);
  //     return {
  //       success: true,
  //       userId: credentials.userId,
  //     };
  //   } catch (error) {
  //     this.logger.error(`Authentication failed: ${error.message}`);
  //     throw error;
  //   }
  // }
  // private async validateCredentials(credentials: FacebookCredentials): Promise<boolean> {
  //   try {
  //     const url = `${this.baseUrl}/me`;
  //     const response = await firstValueFrom(
  //       this.httpService.get<FacebookApiResponse<{ id: string; name: string }>>(url, {
  //         params: {
  //           access_token: credentials.pageAccessToken,
  //         },
  //       })
  //     );
  //     return response.data?.data?.id === credentials.pageId;
  //   } catch (error) {
  //     this.logger.error(`Credential validation failed: ${error.message}`);
  //     return false;
  //   }
  // }
  // async sendMessage(userId: string, recipientId: string, message: FacebookOutgoingMessage): Promise<FacebookMessageResponse> {
  //   try {
  //     const credentials = await this.getUserCredentials(userId);
  //     const payload: FacebookSendMessagePayload = {
  //       recipient: { id: recipientId },
  //       message,
  //       messaging_type: 'RESPONSE',
  //     };
  //     const url = `${this.baseUrl}/me/messages`;
  //     const response = await firstValueFrom(
  //       this.httpService.post<FacebookMessageResponse>(url, payload, {
  //         params: {
  //           access_token: credentials.pageAccessToken,
  //         },
  //       })
  //     );
  //     this.logger.log(`Message sent successfully to ${recipientId}`);
  //     return response.data;
  //   } catch (error) {
  //     this.logger.error(`Failed to send message: ${error.message}`);
  //     throw error;
  //   }
  // }
  // async getUserProfile(userId: string, profileId: string): Promise<FacebookUser> {
  //   try {
  //     const credentials = await this.getUserCredentials(userId);
  //     const url = `${this.baseUrl}/${profileId}`;
  //     const response = await firstValueFrom(
  //       this.httpService.get<FacebookUser>(url, {
  //         params: {
  //           fields: 'first_name,last_name,profile_pic,locale,timezone,gender',
  //           access_token: credentials.pageAccessToken,
  //         },
  //       })
  //     );
  //     return response.data;
  //   } catch (error) {
  //     this.logger.error(`Failed to get user profile: ${error.message}`);
  //     throw error;
  //   }
  // }
  // verifyWebhook(mode: string, token: string, challenge: string, userId: string): string {
  //   if (mode === 'subscribe') {
  //     // En un entorno real, deberías validar que el token corresponde al usuario
  //     // Por ahora, usamos un token genérico desde la configuración
  //     const verifyToken = this.configService.get<string>('FACEBOOK_VERIFY_TOKEN');
  //     if (token === verifyToken) {
  //       this.logger.log(`Webhook verified for user ${userId}`);
  //       return challenge;
  //     }
  //   }
  //   throw new BadRequestException('Invalid verification token');
  // }
  // async processWebhookPayload(payload: FacebookWebhookPayload, userId: string): Promise<void> {
  //   try {
  //     const credentials = await this.getUserCredentials(userId);
  //     // Verificar la firma del payload si se proporciona
  //     // En un entorno real, deberías validar la firma usando el app secret
  //     for (const entry of payload.entry) {
  //       for (const messaging of entry.messaging) {
  //         await this.processMessaging(messaging, credentials);
  //       }
  //     }
  //   } catch (error) {
  //     this.logger.error(`Failed to process webhook payload: ${error.message}`);
  //     throw error;
  //   }
  // }
  // private async processMessaging(messaging: FacebookMessaging, credentials: FacebookCredentials): Promise<void> {
  //   try {
  //     if (messaging.message) {
  //       await this.handleIncomingMessage(messaging, credentials);
  //     } else if (messaging.postback) {
  //       await this.handlePostback(messaging, credentials);
  //     } else if (messaging.delivery) {
  //       await this.handleDelivery(messaging, credentials);
  //     } else if (messaging.read) {
  //       await this.handleRead(messaging, credentials);
  //     }
  //   } catch (error) {
  //     this.logger.error(`Failed to process messaging: ${error.message}`);
  //   }
  // }
  // private async handleIncomingMessage(messaging: FacebookMessaging, credentials: FacebookCredentials): Promise<void> {
  //   const { sender, message } = messaging;
  //   this.logger.log(`Received message from ${sender.id}: ${message?.text || 'non-text message'}`);
  //   // Aquí puedes implementar la lógica para procesar mensajes entrantes
  //   // Por ejemplo, enviar a un webhook interno o procesar con un bot
  //   // Ejemplo de respuesta automática
  //   await this.sendMessage(credentials.userId, sender.id, {
  //     text: `Received your message: ${message?.text || 'attachment'}`,
  //   });
  // }
  // private async handlePostback(messaging: FacebookMessaging, credentials: FacebookCredentials): Promise<void> {
  //   const { sender, postback } = messaging;
  //   this.logger.log(`Received postback from ${sender.id}: ${postback?.payload}`);
  //   // Implementar lógica para manejar postbacks
  // }
  // private async handleDelivery(messaging: FacebookMessaging, credentials: FacebookCredentials): Promise<void> {
  //   const { delivery } = messaging;
  //   this.logger.log(`Message delivered: ${delivery?.mids.join(', ')}`);
  //   // Implementar lógica para manejar confirmaciones de entrega
  // }
  // private async handleRead(messaging: FacebookMessaging, credentials: FacebookCredentials): Promise<void> {
  //   const { read } = messaging;
  //   this.logger.log(`Message read: watermark ${read?.watermark}`);
  //   // Implementar lógica para manejar confirmaciones de lectura
  // }
  // private async getUserCredentials(userId: string): Promise<FacebookCredentials> {
  //   const response = await this.externalApiService.getCredentials(userId, 'facebook_messenger');
  //   if (!response.success || !response.data) {
  //     throw new UnauthorizedException('User credentials not found');
  //   }
  //   return response.data.credentials;
  // }
  // verifySignature(payload: string, signature: string, appSecret: string): boolean {
  //   const expectedSignature = crypto
  //     .createHmac('sha256', appSecret)
  //     .update(payload)
  //     .digest('hex');
  //   return crypto.timingSafeEqual(
  //     Buffer.from(signature),
  //     Buffer.from(`sha256=${expectedSignature}`)
  //   );
  // }
}
