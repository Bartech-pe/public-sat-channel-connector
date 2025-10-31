import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { ChatsatService } from './chatsat.service';
import { Server, Socket } from 'socket.io';
import { OutgoingPayload } from 'src/common/interfaces/chat-hub/outgoing/outgoing.interface';
import { IncomingMessage } from 'src/common/interfaces/chat-hub/incoming/incoming.interface';
import { forwardRef, Inject, Logger } from '@nestjs/common';
import { ChatHubGateway, IChannelChatInformation } from '../chat-hub/chat-hub.gateway';



@WebSocketGateway({ namespace: '/chatsat', cors: { origin: '*' } })
export class ChatsatGateway {
  private readonly logger = new Logger(ChatsatGateway.name);
	private accessToken: string | null = null;
  
  @WebSocketServer()
  server: Server;

  constructor(
    @Inject(forwardRef(() => ChatHubGateway))
    private readonly chatHubGateway: ChatHubGateway,
  ) {}

  handleConnection(client: Socket) {
    this.accessToken = client.handshake.auth?.token || client.handshake.headers['authorization'];
    if (!this.accessToken) {
      client.emit('error', { message: 'No autorizado: falta token' });

      client.disconnect(true);
      this.logger.error("Cliente desconectado por falta de autorización.");
      return;
    }
    this.logger.log(`La conexión con el cliente ${client.id} se ha establecido correctamente.`, )
	}

  @SubscribeMessage('message.incoming')
  async handleIncoming(
    @MessageBody() data: IncomingMessage,
    @ConnectedSocket() client: Socket
  ): Promise<void> {
    const { attachments } = data.payload;
    const token  = client.handshake.auth?.token || client.handshake.headers['authorization'];


    if (attachments?.length) {
      data.payload.attachments = attachments.map(att => ({
        ...att,
        type: att.extension ? this.getFileType(att.extension) : att.type,
      }));
    }

    this.chatHubGateway.broadcastMessage({...data, token: token});
  }



  getFileType(extension: string): 'image' | 'file' {
    const imageExtensions = new Set([
      'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'tiff', 'ico', 'heic', 'heif'
    ]);

    const ext = extension.toLowerCase().replace('.', '');

    return imageExtensions.has(ext) ? 'image' : 'file';
  }

  broadcastMessage(message: OutgoingPayload) {
    try {
      this.server.emit('message.outgoing', message);
      this.logger.debug(message)
    } catch (error) {
      this.logger.error(`Error al emitir mensaje: ${error.message}`);
    }
  }

  broadcastCompletedChatEvent(payload: IChannelChatInformation)
  {
    try {
      this.server.emit('chat.status.completed', payload)
    } catch (error) {
      this.logger.error(error.toString())
    }
  }

  broadcastTypingIndicator(payload: IChannelChatInformation)
  {
    try {
      this.server.emit('chat.status.typing.indicator', payload)
      this.logger.debug(payload)
    } catch (error) {
      this.logger.error(error.toString())
    }
  }
}
