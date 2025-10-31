import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WhatsappOfficialService } from './whatsapp-official.service';
import { IncomingMessage } from 'src/common/interfaces/chat-hub/incoming/incoming.interface';
import { OutgoingPayload } from 'src/common/interfaces/chat-hub/outgoing/outgoing.interface';
import { forwardRef, Inject } from '@nestjs/common';

@WebSocketGateway({ cors: { origin: '*' } })
export class WhatsappOfficialGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    @Inject(forwardRef(() => WhatsappOfficialService))
    private readonly whatsappOfficialService: WhatsappOfficialService) {}

  handleConnection(client: Socket) {
    const { sessionId, accessToken, phoneNumberId, businessId } = client.handshake.query;

    client.data = {
      sessionId,
      accessToken,
      phoneNumberId,
      businessId,
    };

    client.join('whatsapp');
    if (sessionId) {
      client.join(sessionId.toString());
      console.log(`🔌 Cliente conectado a la sesión: ${sessionId}`);
    }

    client.on('message.outgoing', async (payload: OutgoingPayload) => {
      try {
        const { accessToken, phoneNumberId } = client.data;

        if (!accessToken || !phoneNumberId) {
          client.emit('message.error', { error: 'Faltan credenciales en la conexión' });
          return;
        }
        // if(payload.customMessage?.type == 'interactive'){
        //   this.whatsappOfficialService.handleSendDocumentTypeButtons(
        //       phoneNumberId,
        //       accessToken,
        //       payload.to
        //   )
        //   return
        // }
        // await this.whatsappOfficialService.sendMessageDirect(
        //   phoneNumberId,
        //   accessToken,
        //   payload.to,
        //   payload.message,
        // );
      } catch (error) {
        console.error(`Error enviando mensaje: ${error.message}`);
        client.emit('message.error', { error: error.message });
      }
    });
  }

  handleDisconnect(client: Socket) {
    console.log('Cliente desconectado');
  }

  broadcastMessage(message: IncomingMessage) {
    this.server.emit('message.incoming', message);
  }
}
