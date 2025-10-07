import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Logger } from '@nestjs/common';
import { IncomingMessage } from 'src/common/interfaces/chat-hub/incoming/incoming.interface';

interface Message {
  chatId: number;
  text: string;
  phoneNumber: string;
}

@WebSocketGateway({ cors: { origin: '*' } })
export class TelegramGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TelegramGateway.name);

  constructor() {}

  broadcastMessage(message: IncomingMessage) {
    try {
      // this.server.to("all-channels").emit('message.incoming', message);
      this.server.emit('message.incoming', message);
    } catch (error) {
      this.logger.error(`Error al emitir mensaje: ${error.message}`);
    }
  }
}