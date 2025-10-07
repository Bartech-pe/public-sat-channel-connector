import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import WebSocket from 'ws';
import { InvalidateInboxCredentialDto } from 'src/common/dto/crm/credentials/invalidate-inbox-credentials.dto';

@Injectable()
export class ChatHubService {
  private readonly logger = new Logger(ChatHubService.name);

  private client: AxiosInstance;
  constructor(private readonly configService: ConfigService) {
    this.client = axios.create({
      baseURL: this.configService.get<string>('CRM_API_URL') ?? '',
      timeout: 10000,
      headers: {
        Accept: 'application/json',
      },
    });
  }



  async invalidateCredentials(payload: InvalidateInboxCredentialDto){
    try {
      await this.client.post("v1/inboxs/credentials/invalidate",payload)
      
    } catch (error) {
      this.logger.error(`❌ No se pudo encontrar un registro en la aplicacion externa`);
      
    }
  }

//   connect() {
//     this.webSocket = new WebSocket('ws://localhost:3001');

//     this.webSocket.on('open', () => {
//       console.log('Conectado al WebSocket local');
//       this.sendMessage({
//         type: 'session.status',
//         payload: {
//           channel: 'crm',
//           sessionId: 'canal-crm1',
//           status: 'connected',
//           timestamp: new Date().toISOString(),
//         },
//       });
//     });

//     this.webSocket.on('message', (data) => {
//       try {
//         const message = JSON.parse(data.toString());
//         console.log('Mensaje recibido:', message);
//       } catch (err) {
//         console.error('Error parseando mensaje JSON:', err);
//       }
//     });

//     this.webSocket.on('close', () => {
//       console.log('Conexión WebSocket cerrada');
//     });

//     this.webSocket.on('error', (error) => {
//       console.error('Error WebSocket:', error);
//     });
//   }

//   sendMessage(message: any) {
//     if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
//       this.webSocket.send(JSON.stringify(message));
//     } else {
//       console.warn('WebSocket no está abierto, no se pudo enviar mensaje');
//     }
//   }
}
