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
  
  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() data: { assistanceId: any },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.debug(`joined room ${data}`);
    this.logger.debug(`room: ${data.assistanceId}`);
    client.join(data.assistanceId.toString());
    this.logger.debug(client.rooms);
    this.server.to(data.assistanceId.toString()).emit("room", `Cliente ${client.id} se unió a ${data.assistanceId}`)
    console.log(`Cliente ${client.id} se unió a ${data.assistanceId}`);
    return { joined: data.assistanceId };
  }

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

  // @SubscribeMessage('message.incoming')
  // async handleIncoming(
  //   @MessageBody() data: IncomingMessage,
  //   @ConnectedSocket() client: Socket
  // ): Promise<void> {
  //   const { attachments } = data.payload;
  //   const token  = client.handshake.auth?.token || client.handshake.headers['authorization'];


  //   if (attachments?.length) {
  //     data.payload.attachments = attachments.map(att => ({
  //       ...att,
  //       type: att.extension ? this.getFileType(att.extension) : att.type,
  //     }));
  //   }

  //   this.chatHubGateway.broadcastMessage({...data, token: token});
  // }

  @SubscribeMessage('chat.init')
  async handleChatInit(
    @ConnectedSocket() client: Socket
  ): Promise<void> {
    const token  = client.handshake.auth?.token || client.handshake.headers['authorization'];
    this.logger.debug(token)
    // this.chatHubGateway.broadcastMessage({...data, token: token});
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
      this.logger.debug("diavlo ", message.assistanceId)
      if (message.assistanceId) {
        this.server.to(message.assistanceId?.toString()).emit('message.outgoing', message);
      } else {
        this.server.emit('message.outgoing', message);
      }
      this.logger.debug(message)
    } catch (error) {
      this.logger.error(`Error al emitir mensaje: ${error.message}`);
    }
  }

  broadcastCompletedChatEvent(payload: IChannelChatInformation)
  {
    try {
      this.logger.debug("diavlo ", payload.assistanceId)
      this.logger.debug(String(payload.assistanceId))
      if (!payload.assistanceId) {
        this.server.emit('chat.status.completed', payload)
      } else {
        this.server.to(String(payload.assistanceId)).emit('chat.status.completed', payload)
      }
    } catch (error) {
      this.logger.error(error.toString())
    }
  }

  broadcastTypingIndicator(payload: IChannelChatInformation)
  {
    try {
      if (!payload.assistanceId) {
        this.server.emit('chat.status.typing.indicator', payload)
      } else {
        this.server.to(String(payload.assistanceId)).emit('chat.status.typing.indicator', payload)
      }
      
      this.logger.debug(payload)
    } catch (error) {
      this.logger.error(error.toString())
    }
  }
}
