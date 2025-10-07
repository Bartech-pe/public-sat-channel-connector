import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { EmailSent } from '../dto/EmailSent.dto';
@WebSocketGateway({ cors: { origin: '*' } })
export class GmailGateway implements OnGatewayConnection, OnGatewayDisconnect {
  handleConnection(client: Socket, ...args: any[]) {
    console.log(`🔌 Cliente conectado a la sesión: ${client.id}`);
  }
  handleDisconnect(client: Socket) {
    console.log(`🔌 Cliente Desconectado a la sesión: ${client.id}`);
  }
  @WebSocketServer()
  server: Server;
  emitProductUpdated(email: EmailSent) {
    this.server.emit('email.sent', email);
  }
}
