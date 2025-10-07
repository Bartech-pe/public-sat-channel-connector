import { Injectable, Logger } from '@nestjs/common';
import { Client, LocalAuth, Message, Chat, Contact } from 'whatsapp-web.js';
import { WhatsappGateway } from './whatsapp.gateway';
import * as QRCode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';
import { IncomingMessage } from 'src/common/interfaces/chat-hub/incoming/incoming.interface';
import { ChannelType, MessageType } from 'src/common/interfaces/chat-hub/messaging.interface';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private clients: Map<string, Client> = new Map();
  private initializingClients: Set<string> = new Set();

  constructor(private readonly whatsappGateway: WhatsappGateway) {}

  private getClientConfig(phoneNumber: string): Client {
    return new Client({
      authStrategy: new LocalAuth({ clientId: phoneNumber }),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
    });
  }

  async initializeSession(phoneNumber: string): Promise<{ status: string }> {
    const sessionPath = path.join(process.cwd(), '.wwebjs_auth', `session-${phoneNumber}`);

    if (!fs.existsSync(sessionPath)) {
      return { status: 'No se encontró la sesión' };
    }

    if (this.clients.has(phoneNumber)) {
      return { status: 'Sesión ya estaba iniciada' };
    }

    if (this.initializingClients.has(phoneNumber)) {
      this.logger.log(`⏳ Esperando inicialización existente para [${phoneNumber}]...`);
      return new Promise((resolve, reject) => {
        const interval = setInterval(() => {
          if (this.clients.has(phoneNumber)) {
            clearInterval(interval);
            resolve({ status: 'Sesión iniciada' });
          }
        }, 500);
        setTimeout(() => {
          clearInterval(interval);
          reject(new Error('Tiempo de espera agotado al iniciar la sesión'));
        }, 15000);
      });
    }

    return new Promise((resolve, reject) => {
      this.logger.log(`⚙️ Iniciando sesión manual para [${phoneNumber}]...`);
      this.initializingClients.add(phoneNumber);

      const client = this.getClientConfig(phoneNumber);
      this.attachCommonListeners(client, phoneNumber, resolve, reject);
      client.initialize();
    });
  }

  async createClientAndGetQR(phoneNumber: string): Promise<{ loginQr: string }> {
    if (this.clients.has(phoneNumber) || this.initializingClients.has(phoneNumber)) {
      this.logger.log(`🟢 Cliente ya inicializado o en proceso para sesión [${phoneNumber}]`);
      throw new Error('Sesión ya inicializada o en proceso');
    }

    this.initializingClients.add(phoneNumber);
  
    return new Promise((resolve, reject) => {
      const client = this.getClientConfig(phoneNumber);
      client.once('qr', async (qr) => {
        this.logger.log(`🟡 QR generado para sesión [${phoneNumber}]`);
        try {
          const loginQr = await QRCode.toDataURL(qr);
          resolve({ loginQr });
        } catch {
          this.initializingClients.delete(phoneNumber);
          reject('Error generando el QR en base64');
        }
      });

      this.attachCommonListeners(client, phoneNumber, resolve, reject);
        client.initialize();
      });
  }

  
  private attachCommonListeners(client: Client, phoneNumber: string, resolve?: Function, reject?: Function): void {
    client.on('loading_screen', () => {
      this.logger.log(`Pantalla Loading de whatsapp [${phoneNumber}]`);
      this.whatsappGateway.notifyAuthStatus(phoneNumber, {status: 'loading'})

    });
    client.on('authenticated', () => {
      this.logger.log(`Sesión autenticada para [${phoneNumber}]`);
      this.whatsappGateway.notifyAuthStatus(phoneNumber, {status: 'loading'})

    });

    client.on('ready', () => {
      this.logger.log(`Cliente listo para sesión [${phoneNumber}]`);
      this.clients.set(phoneNumber, client);
      this.initializingClients.delete(phoneNumber);
      this.whatsappGateway.notifyAuthStatus(phoneNumber, {status: 'success'})
      resolve?.({ status: 'Sesión iniciada' });
    });

    client.on('auth_failure', (msg) => {
      this.logger.error(`Fallo de autenticación [${phoneNumber}]: ${msg}`);
      this.initializingClients.delete(phoneNumber);
      this.whatsappGateway.notifyAuthStatus(phoneNumber, {status: 'failed', message: `Fallo de autenticación [${phoneNumber}]: ${msg}`})
      reject?.(new Error('Fallo de autenticación'));
    });

    client.on('disconnected', (reason) => {
      this.logger.warn(`Cliente desconectado [${phoneNumber}]: ${reason}`);
      this.clients.delete(phoneNumber);
      this.initializingClients.delete(phoneNumber);
      this.whatsappGateway.notifyAuthStatus(phoneNumber, {status: 'disconnected'})
    });

    client.on('message_create', async (message: Message) => {
      try {
        const chat: Chat = await message.getChat();
        if (chat.isGroup) return;

        const isOwnMessage = message.fromMe;
        const myContact: Contact = await client.getContactById(client.info.wid._serialized);
        
        const otherContactId = isOwnMessage ? message.to : message.from;
        const otherContact: Contact = await client.getContactById(otherContactId);

        const sender: Contact = isOwnMessage ? myContact : otherContact;
        const receiver: Contact = isOwnMessage ? otherContact : myContact;

        const incomingMessage: IncomingMessage = {
        type: MessageType.INCOMING,
        payload: {
          chat_id: chat.id._serialized,
          channel: ChannelType.WHATSAPP,
        message: {
            id: message.id.id,
            body: message.body,
          },
          sender: {
            id: sender.id._serialized,
            full_name: sender.name || "",
            alias: sender.pushname || "",
            phone_number: sender.number || "",
          },
          receiver: {
            id: receiver.id._serialized,
            full_name: receiver.name || "",
            alias: receiver.pushname || "",
            phone_number: receiver.number || ""
          },
          timestamp: message.timestamp,
        }
      };

      this.whatsappGateway.broadcastMessage(incomingMessage);

    } catch (error) {
      this.logger.error(`❌ Error procesando mensaje de WhatsApp: ${error.message}`);
    }
    });
  }

  async sendMessage(phoneNumber: string, to: string, message: string): Promise<void> {
    const client = this.clients.get(phoneNumber);

    if (!client) {
      if (this.initializingClients.has(phoneNumber)) {
        throw new Error(`Cliente está inicializándose para sesión [${phoneNumber}], intenta más tarde`);
      }
      throw new Error(`Cliente no inicializado para sesión [${phoneNumber}]`);
    }

    const chatId = to.endsWith('@c.us') ? to : `${to}@c.us`;
    await client.sendMessage(chatId, message);
  }
}
