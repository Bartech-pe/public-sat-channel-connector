import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { EmailSent } from '../dto/EmailSent.dto';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ cors: { origin: '*' } })
export class GmailGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(GmailGateway.name);

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Cliente conectado a la sesión: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.warn(`Cliente Desconectado a la sesión: ${client.id}`);
  }

  @WebSocketServer()
  server: Server;
  emitMailUpdated(email: EmailSent) {
    this.server.emit('email.sent', email);
  }
}
