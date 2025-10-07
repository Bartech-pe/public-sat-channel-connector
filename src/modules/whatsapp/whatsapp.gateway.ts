import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { IncomingMessage } from 'src/common/interfaces/chat-hub/incoming/incoming.interface';



export interface WhatsappAuthDto
{
    status: "failed" | "success" | "loading" | "disconnected",
    message?: string;
}


@WebSocketGateway({ cors: { origin: '*' } }) 
export class WhatsappGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;


  private readonly logger = new Logger(WhatsappGateway.name);

  handleConnection(client: Socket) {
    client.join('whatsapp');
    
    const sessionId = client.handshake.query.sessionId as string;
    if (sessionId) {
      client.join(sessionId);
      console.log(`🔌 Cliente conectado a la sesión: ${sessionId}`);
    }
  } 

  handleDisconnect(client: Socket) {
    console.log('Cliente desconectado');
  }
  
  // emitMessageOficialApi(message: any) {
  //   this.server.emit('new_message_from_whatsapp', message);
  // }
  

  notifyAuthStatus(phoneNumber: string, status: WhatsappAuthDto)
  {
      this.server.to("whatsapp").emit(phoneNumber, status)
  }


  broadcastMessage(message: IncomingMessage) {
    try {
      this.server.emit('message.incoming', message);
    } catch (error) {
      this.logger.error(`Error al emitir mensaje: ${error.message}`);
    }
  }
}



