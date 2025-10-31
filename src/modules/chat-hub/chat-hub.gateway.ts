import { forwardRef, Inject, Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { ChannelType } from 'src/common/interfaces/chat-hub/messaging.interface';
import { OutgoingPayload } from 'src/common/interfaces/chat-hub/outgoing/outgoing.interface';
import { TelegramService } from '../telegram/telegram.service';
import { Server, Socket } from 'socket.io';
import { WhatsappOfficialService } from '../whatsapp-official/whatsapp-official.service';
import { IncomingMessage } from 'src/common/interfaces/chat-hub/incoming/incoming.interface';
import { WhatsappOfficialGateway } from '../whatsapp-official/whatsapp-official.gateway';
import { ChatsatGateway } from '../chatsat/chatsat.gateway';
import { envConfig } from 'config/env';
export interface IChannelChatInformation {
  channelRoomId?: number | null;
  assistanceId?: number | null;
  userId?: number | null;
  registered: boolean;
}
@WebSocketGateway({ cors: { origin: '*' } })
export class ChatHubGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  private crmSocket: Socket | null = null;

  private readonly logger = new Logger(ChatHubGateway.name);

  constructor(
    @Inject(forwardRef(() => TelegramService))
    private readonly telegramService: TelegramService,
    @Inject(forwardRef(() => WhatsappOfficialService))
    private readonly whatsappOfficialService: WhatsappOfficialService,
    @Inject(forwardRef(() => ChatsatGateway))
    private readonly chatsatGateway: ChatsatGateway,
    @Inject(forwardRef(() => WhatsappOfficialGateway))
    private readonly whatsappOfficialGateway: WhatsappOfficialGateway,
  ) {}

  handleConnection(client: Socket) {
    const token =
      client.handshake.auth?.token || client.handshake.headers['authorization'];
    if (token !== envConfig.verifyToken) {
      client.emit('error', { message: 'No autorizado' });
      client.disconnect(true);
      this.logger.error('Cliente desconectado por falta de autorización.');
      return;
    }

    this.logger.debug('Una conexión se ha establecido correctamente');
    this.crmSocket = client;
  }

  getCrmSocket(): Socket | null {
    return this.crmSocket;
  }

  @SubscribeMessage('chat.status.typing.indicator')
  async handleTypingIndicator(
    @MessageBody() data: IChannelChatInformation,
    @ConnectedSocket() client: Socket,
  ) {
    this.chatsatGateway.broadcastTypingIndicator(data);
  }

  @SubscribeMessage('chat.status.completed')
  async handleChatCompleted(
    @MessageBody() data: IChannelChatInformation,
    @ConnectedSocket() client: Socket,
  ) {
    this.chatsatGateway.broadcastCompletedChatEvent(data);
  }

  @SubscribeMessage('message.outgoing')
  async handleOutgoing(
    @MessageBody() data: OutgoingPayload,
    @ConnectedSocket() client: Socket,
  ) {
    let chat_id = data.chat_id.toString().replace('+', '');
    try {
      switch (data.channel) {
        case ChannelType.TELEGRAM:
          const telegramResponse = await this.telegramService.sendMessage(
            data.phoneNumber,
            chat_id,
            data.message,
          );
          return { status: 'success', data: telegramResponse };

        case ChannelType.CHATSAT:
          this.chatsatGateway.broadcastMessage(data);
          return { status: 'success', data: [] };

        case ChannelType.WHATSAPP:
          if (!data.credentials) {
            return { status: 'error', message: 'Missing credentials' };
          }

          if (data.lastMessageId) {
            await this.whatsappOfficialService.handleViewMessageActivatingTypingIndicator(
              data.credentials.phoneNumberId as string,
              data.credentials.accessToken as string,
              data.lastMessageId as string,
            );
            await this.sleep(500);
          }

          const whatsappResponse =
            await this.whatsappOfficialService.sendMessage(
              data.credentials.phoneNumberId as string,
              data.credentials.accessToken as string,
              data.to,
              data.options,
            );

          return { status: 'success', data: whatsappResponse?.data };

        default:
          return { status: 'error', message: 'Unsupported channel' };
      }
    } catch (error) {
      return { status: 'error', message: error.message || 'Unknown error' };
    }
  }

  private async sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  broadcastMessage(message: IncomingMessage) {
    try {
      this.server.emit('message.incoming', message);
    } catch (error) {
      this.logger.error(`Error al emitir mensaje: ${error.message}`);
    }
  }

  broadcastMessageWithCallback(
    message: IncomingMessage,
    callback: (response: IChannelChatInformation) => void,
  ) {
    try {
      if (this.crmSocket) {
        const payloadWithToken = {
          ...message,
          token: message.token,
        };
        this.logger.debug(payloadWithToken);
        this.crmSocket.emit(
          'message.incoming',
          payloadWithToken,
          (crmResponse: IChannelChatInformation) => {
            callback(crmResponse);
          },
        );
      } else {
        this.logger.error('No hay CRM conectado');
        callback({ registered: false });
      }
    } catch (error) {
      this.logger.error(`Error al emitir mensaje: ${error.message}`);
      callback({ registered: false });
    }
  }
}
