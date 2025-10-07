  import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
  import { ConfigService } from '@nestjs/config';
  import { Client, createClient, TDLibError } from 'tdl';
  import { TelegramGateway } from './telegram.gateway';
  // import { TelegramSessionsService } from './sessions/telegram-sessions.service';
  import { profilePhoto, updateNewMessage, User } from 'tdlib-types';
  import { IncomingMessage, IncomingPayload } from 'src/common/interfaces/chat-hub/incoming/incoming.interface';
  import { ChannelType, MessageType } from 'src/common/interfaces/chat-hub/messaging.interface';
  import { readdir, rm, stat } from 'fs/promises';
  import path, { join } from 'path';
  import { promises as fs } from 'fs';
  import { ChatHubService } from '../chat-hub/chat-hub.service';

  export interface AuthStatuses{
    authMethod: 'EMAIL' | 'DEFAULT',
    emailRequired: boolean;
    codeSended: boolean;
  }
  export interface BaseResponseDto{
    message: string;
    success: boolean;
    authStatuses?: AuthStatuses;
  }

  @Injectable()
  export class TelegramService implements OnModuleInit {
    private readonly logger = new Logger(TelegramService.name);
    private clients: Map<string, any> = new Map();
    private authStates: Map<string, { phoneNumber: string; awaitingCode?: boolean, awaitingEmailCode?: boolean }> = new Map();
    private readonly sessionDir = 'tdlib';
    private readonly filesSessionDir = 'files';

    constructor(
      private readonly configService: ConfigService,
      private readonly chathubService: ChatHubService,
      private readonly gateway: TelegramGateway
    ) {}

    async onModuleInit() {
      if (!this.clients.size) {
        try {
          const sessions = await this.getAllSessionFolders();
          for (const sessionName of sessions) {
            await this.initializeClient(sessionName);
            const currentState = await this.checkSession(sessionName);
            if (currentState.state == 'authorizationStateWaitPhoneNumber' || !currentState.isLoggedIn) {
              await this.deleteSessionFolder(sessionName);
              this.clients.delete(sessionName);
              this.chathubService.invalidateCredentials({ phoneNumber: sessionName });
              this.logger.warn(`Cliente eliminado para ${sessionName} por falta de autorización`);
              continue;
            }
            this.logger.log(`ℹ️ Cliente ya inicializado para ${sessionName}`);
          }
        } catch (error) {
          this.logger.error(`❌ Error en onModuleInit: ${error.message}`);
        }
      }
    }

    private async getAllSessionFolders(): Promise<string[]> {
      try {
        const entries = await readdir(this.sessionDir);
        const sessionNames: string[] = [];

        for (const entry of entries) {
          const fullPath = join(this.sessionDir, entry);
          const entryStat = await stat(fullPath);

          if (entryStat.isDirectory()) {
            sessionNames.push(entry);
          }
        }

        return sessionNames;
      } catch (error) {
        this.logger.error('❌ Error al leer carpetas de sesión:', error.message);
        return [];
      }
    }

    private async initializeClient(phoneNumber: string) {
      try {
        phoneNumber = phoneNumber.trim().replace('+', '');
        if (this.clients.has(phoneNumber)) {
          this.logger.log(`ℹ️ Cliente ya inicializado para ${phoneNumber}`);
          return { success: true };
        }

        const client = createClient({
          apiId: parseInt(this.configService.get<string>('TELEGRAM_API_ID') || '0', 10),
          apiHash: this.configService.get<string>('TELEGRAM_API_HASH') || '',
          databaseDirectory: `./tdlib/${phoneNumber.replace(/\+/g, '')}`,
          filesDirectory: `./files/${phoneNumber.replace(/\+/g, '')}`,
          tdlibParameters: {
              use_test_dc: false,
              use_file_database: true,
              use_chat_info_database: true,
              use_message_database: true,
              use_secret_chats: true,
              system_language_code: 'en',
              device_model: 'Server',
              system_version: '1.0',
              application_version: '1.0',
          }
        });
        client.on('error', (err) => {
          console.log(err);
        });

        client.on('update', async (update: updateNewMessage) => {
          try {
            if (
              update?.['_'] === 'updateNewMessage' &&
              update.message?.content?.['_'] === 'messageText' &&
              update.message?.sender_id?.['_'] === 'messageSenderUser' &&
              !update.message.is_outgoing
            ) {
              
              const MY_USER: User = await client.invoke({ _: 'getMe' });
              
              const USER_SENDER: User = update.message.is_outgoing
                ? MY_USER
                : await client.invoke({
                    _: 'getUser',
                    user_id: update.message.chat_id,
                  });
              const USER_RECEIVER: User = update.message.is_outgoing
                ? await client.invoke({
                    _: 'getUser',
                    user_id: update.message.chat_id,
                  })
                : MY_USER;


              const INCOMING_MESSAGE: IncomingMessage = {
                type: MessageType.INCOMING,
                payload: {
                  chat_id: update.message.chat_id,
                  channel: ChannelType.TELEGRAM,
                  fromMe: update.message.is_outgoing,
                  message: {
                    botReply: false,
                    id: update.message.id,
                    body: update.message.content.text.text,
                  },
                  receiver: {
                    id: USER_RECEIVER.id,
                    full_name: USER_RECEIVER.first_name + ' ' + USER_RECEIVER.last_name,
                    phone_number: USER_RECEIVER.phone_number,
                    alias: USER_RECEIVER.usernames?.editable_username,
                  },
                  sender: {
                    id: USER_SENDER.id,
                    full_name: USER_SENDER.first_name,
                    phone_number: USER_SENDER.phone_number,
                    alias: USER_SENDER.usernames?.editable_username,
                  },
                  timestamp: update.message.date,
                },
              };
              this.gateway.broadcastMessage(INCOMING_MESSAGE);
            }
          } 
          
          catch (err) {
            if (err instanceof TDLibError) {
              // if(err.message == 'Invalid user identifier'){
                // await this.deleteSessionFolder(phoneNumber);
                // this.clients.delete(phoneNumber);
                // this.chathubService.invalidateCredentials({ phoneNumber: phoneNumber });
                // this.logger.warn(`Cliente eliminado para ${phoneNumber} por falta de autorización`);
              // }
            } else {
              this.logger.error(`⚠️ Error procesando update (${phoneNumber}): ${err.message}`);
            }
            
          }
        });

        this.clients.set(phoneNumber, client);
        this.logger.log(`Cliente Telegram inicializado para ${phoneNumber}`);
        return { success: true };
      } catch (error) {
        this.logger.error(`❌ Error al inicializar cliente (${phoneNumber}): ${error.message}`);
        return { success: false, error: error.message };
      }
    }

    async deleteSessionFolder(phoneNumber: string) {
      const sessionPath = join(this.sessionDir, phoneNumber);
      const filesSessionPath = join(this.filesSessionDir, phoneNumber);
      try {
        await rm(sessionPath, { recursive: true, force: true });
        await rm(filesSessionPath, { recursive: true, force: true });
        this.logger.warn(`🗑 Carpeta de sesión eliminada: ${sessionPath}`);
        this.logger.warn(`🗑 Carpeta de sesión eliminada: ${filesSessionPath}`);
        return { success: true };
      } catch (error) {
        this.logger.error(`❌ Error al eliminar sesión de ${phoneNumber}: ${error.message}`);
        return { success: false, error: error.message };
      }
    }

    async checkSession(phoneNumber: string) {
      try {
        phoneNumber = phoneNumber.trim().replace('+', '');
        if (!this.clients.has(phoneNumber)) {
          await this.initializeClient(phoneNumber);
        }

        const client = this.clients.get(phoneNumber);
        const state = await client.invoke({ _: 'getAuthorizationState' });
        this.logger.log(`ℹ️ Estado de autorización (${phoneNumber}): ${state._}`);

        let isLoggedIn = false;
        switch (state._) {
          case 'authorizationStateReady':
            isLoggedIn = true;
            this.authStates.set(phoneNumber, { phoneNumber, awaitingCode: false });
            this.logger.log(`✅ Sesión existente encontrada y activa para ${phoneNumber}`);
            break;
          case 'authorizationStateLoggingOut':
            isLoggedIn = false;
            await this.deleteSessionFolder(phoneNumber);
            this.clients.delete(phoneNumber);
            this.authStates.delete(phoneNumber);
            break;
          case 'authorizationStateClosed':
            isLoggedIn = true;
            this.authStates.set(phoneNumber, { phoneNumber, awaitingCode: false });
            this.logger.log(`✅ Sesión existente encontrada y activa para ${phoneNumber}`);
            break;
          case 'authorizationStateWaitPhoneNumber':
            this.authStates.set(phoneNumber, { phoneNumber, awaitingCode: false });
            this.logger.log(`ℹ️ Cliente listo para recibir número de teléfono (${phoneNumber})`);
            break;
          case 'authorizationStateWaitCode':
            this.authStates.set(phoneNumber, { phoneNumber, awaitingCode: true });
            this.logger.log(`ℹ️ Cliente esperando código de autenticación (${phoneNumber})`);
            break;
          case 'authorizationStateWaitPassword':
            this.authStates.set(phoneNumber, { phoneNumber, awaitingCode: false });
            this.logger.log(`ℹ️ Cliente esperando contraseña 2FA (${phoneNumber})`);
            break;
          case 'authorizationStateWaitTdlibParameters':
              await client.invoke({
                _: 'setTdlibParameters',
                parameters: {
                  use_test_dc: false,
                  use_file_database: true,
                  use_chat_info_database: true,
                  use_message_database: true,
                  use_secret_chats: true,
                  api_id: parseInt(this.configService.get<string>('TELEGRAM_API_ID') || '0', 10),
                  api_hash: this.configService.get<string>('TELEGRAM_API_HASH') || '',
                  database_directory: `./tdlib/${phoneNumber.replace(/\+/g, '')}`,
                  files_directory: `./files/${phoneNumber.replace(/\+/g, '')}`,
                  system_language_code: 'en',
                  device_model: 'Server',
                  system_version: '1.0',
                  application_version: '1.0',
                  enable_storage_optimizer: true,
                  ignore_file_names: false,
                },
              });
              this.logger.log(`✅ Parámetros TDLib establecidos para ${phoneNumber}`);
            break;
          default:
            this.authStates.set(phoneNumber, { phoneNumber, awaitingCode: false });
            this.logger.log(`ℹ️ Estado desconocido (${phoneNumber}): ${state._}`);
        }

        return { isLoggedIn, state: state._ };
      } catch (error) {
        this.logger.error(`❌ Error al verificar sesión (${phoneNumber}): ${error.message}`);
        return { isLoggedIn: false, state: 'unknown' };
      }
    }

    async resetClientState(phoneNumber: string) {
      try {
        phoneNumber = phoneNumber.trim().replace('+', '');
        const client = this.clients.get(phoneNumber);
        if (client) {
          this.logger.log(`🔄 Reseteando estado del cliente (${phoneNumber})`);
          await client.invoke({ _: 'destroy' });
          this.clients.delete(phoneNumber);
          this.authStates.delete(phoneNumber);
          await this.initializeClient(phoneNumber);
          this.logger.log(`✅ Cliente reseteado exitosamente (${phoneNumber})`);
          return { success: true };
        }
        return { success: false, error: 'No hay cliente para este número' };
      } catch (error) {
        this.logger.error(`❌ Error al resetear cliente (${phoneNumber}): ${error.message}`);
        return { success: false, error: error.message };
      }
    }

    async logout(phoneNumber: string) {
      try {
        phoneNumber = phoneNumber.trim().replace('+', '');
        const client = this.clients.get(phoneNumber);
        if (!client) {
          this.logger.warn(`No hay cliente para ${phoneNumber}`);
          return { success: false, error: `No hay cliente para ${phoneNumber}` };
        }
        const { isLoggedIn } = await this.checkSession(phoneNumber);
        if (!isLoggedIn) {
          this.logger.warn('No hay sesión activa para cerrar');
          return { success: false, error: 'No hay sesión activa para cerrar' };
        }

        this.clients.delete(phoneNumber);
        await client.invoke({ _: 'logOut' });
        this.authStates.delete(phoneNumber);
        this.deleteSessionFolder(phoneNumber)
        this.logger.log(`✅ Sesión cerrada exitosamente para ${phoneNumber}`);
        return { success: true, message: 'Sesión cerrada' };
      } catch (error) {
        this.logger.error(`❌ Error al cerrar sesión (${phoneNumber}): ${error.message}`);
        return { success: false, error: error.message };
      }
    }

    async initiateLogin(phoneNumber: string, force: boolean = false, email?: string): Promise<BaseResponseDto> {
      try {
        if (!phoneNumber) {
          const errMsg = 'Número de teléfono no proporcionado';
          this.logger.error(errMsg);
          return { success: false, message: errMsg };
        }
        phoneNumber = phoneNumber.trim().replace('+', '');
        const { isLoggedIn, state } = await this.checkSession(phoneNumber);
        if (isLoggedIn && !force) {
          return { success: false, message: 'Ya se encuentra autenticado. reintente para iniciar una nueva sesión.' };
        }
        if ((isLoggedIn || state !== 'authorizationStateWaitPhoneNumber') && force) {
          await this.logout(phoneNumber);
          await this.resetClientState(phoneNumber);
        }
        const client = this.clients.get(phoneNumber);
        await client.invoke({ _: 'setAuthenticationPhoneNumber', phone_number: phoneNumber });

        // Check state after setting phone
        const authStateResponse = await client.invoke({ _: 'getAuthorizationState' });
        if (authStateResponse._ === 'authorizationStateWaitEmailAddress') {
          if (!email) {
            const errMsg = 'Email requerido para esta cuenta. Proporcione uno.';
            this.logger.error(errMsg);
            this.deleteSessionFolder(phoneNumber)
            this.clients.delete(phoneNumber);
            this.authStates.delete(phoneNumber);
            return { success: false, message: errMsg, authStatuses: {
              authMethod: 'EMAIL',
              codeSended: false,
              emailRequired: true
            }};
          }
          await this.handleEmailAddress(phoneNumber, email, client);
          const currentStatus = await this.checkSession(phoneNumber)
          console.log("currentIsLoggedIn:",currentStatus.isLoggedIn) 
          console.log("current_status",currentStatus.state)
          this.authStates.set(phoneNumber, { phoneNumber, awaitingCode: false, awaitingEmailCode: true });
          console.log("authstates",this.authStates)
          this.logger.log(`📩 Código de autenticación solicitado vía email para ${phoneNumber}`);
          return { success: true, message: 'Código enviado al email.', authStatuses: {
              authMethod: 'EMAIL',
              codeSended: true,
              emailRequired: true
            }};
        } else {
          this.authStates.set(phoneNumber, { phoneNumber, awaitingCode: true });
          this.logger.log(`📩 Código de autenticación solicitado para ${phoneNumber}`);
          return { success: true, message: 'Código de autenticación enviado.', authStatuses: {
              authMethod: 'DEFAULT',
              codeSended: true,
              emailRequired: false
            }};
        }
      } catch (error) {
        this.logger.error(`❌ Error al iniciar login (${phoneNumber}): ${error.message}`);
        this.authStates.delete(phoneNumber);
        return { success: false, message: error.message,  authStatuses: {
              authMethod: 'DEFAULT',
              codeSended: false,
              emailRequired: false
        }}; 
      }
    }

    async handleEmailAddress(phoneNumber: string, email: string, client: Client) {
      try {
        await client.invoke({
          _: 'setAuthenticationEmailAddress',
          email_address: email.trim(),
        });
        return { success: true };
      } catch (error) {
        this.logger.error(`❌ Error al establecer email para ${phoneNumber}: ${error.message}`);
        return { success: false, error: `Error al establecer email: ${error.message}` };
      }
    }

    async confirmEmailCode(phoneNumber: string, code: string) {
      try {
        phoneNumber = phoneNumber.trim().replace('+', '');
        if (!phoneNumber || !code) {
          const errMsg = 'phoneNumber y code requeridos';
          this.logger.error(errMsg);
          return { success: false, error: errMsg };
        }
        const authState = this.authStates.get(phoneNumber);
          console.log("authstates",authState)

        if (!authState?.awaitingEmailCode) {
          const errMsg = 'No se está esperando un código de email';
          this.logger.error(errMsg);
          return { success: false, error: errMsg };
        }
        const client = this.clients.get(phoneNumber);
        if (!client) {
          const errMsg = `No hay cliente para ${phoneNumber}`;
          this.logger.error(errMsg);
          return { success: false, error: errMsg };
        }
        await client.invoke({
          _: 'checkAuthenticationEmailCode',
          code: { _: 'emailAddressAuthenticationCode', code: code.trim() },
        });
        // Proceed to check if further steps needed (e.g., password)
        const authStateResponse = await client.invoke({ _: 'getAuthorizationState' });
        if (authStateResponse._ === 'authorizationStateWaitPassword') {
          const password = this.configService.get<string>('TELEGRAM_2FA_PASSWORD') || '';
          if (!password) {
            const errMsg = 'Se requiere contraseña 2FA';
            this.logger.error(errMsg);
            return { success: false, error: errMsg };
          }
          await client.invoke({ _: 'checkAuthenticationPassword', password });
        }
        this.authStates.delete(phoneNumber);
        this.clients.set(phoneNumber, client);
        this.logger.log(`✅ Sesión creada exitosamente para ${phoneNumber}`);
        return { success: true, message: 'Autenticación completada vía email' };
      } catch (error) {
        this.logger.error(`❌ Error al confirmar código de email (${phoneNumber}): ${error.message}`);
        this.authStates.delete(phoneNumber);
        return { success: false, error: error.message };
      }
    }

    async confirmCode(phoneNumber: string, code: string) {
      try {
        phoneNumber = phoneNumber.trim().replace('+', '');
        if (!phoneNumber || phoneNumber.trim() === '') {
          const errMsg = 'phoneNumber is required and cannot be empty';
          this.logger.error(errMsg);
          return { success: false, error: errMsg };
        }

        if (!code || code.trim() === '') {
          const errMsg = 'Código no proporcionado';
          this.logger.error(errMsg);
          return { success: false, error: errMsg };
        }
        const authState = this.authStates.get(phoneNumber);
        console.log("authstate",authState)
        if(authState?.awaitingEmailCode && !authState?.awaitingCode){
          return await this.confirmEmailCode(phoneNumber, code);
        }
        if (!authState?.awaitingCode) {
          const errMsg = 'No se está esperando un código';
          this.logger.error(`❌ No se está esperando un código para ${phoneNumber}. Estado actual: ${JSON.stringify(authState)}`);
          return { success: false, error: errMsg };
        }
        await this.checkSession(phoneNumber);
        const client = this.clients.get(phoneNumber);
        if (!client) {
          const errMsg = `No hay cliente para ${phoneNumber}`;
          this.logger.error(errMsg);
          return { success: false, error: errMsg };
        }

        await client.invoke({
          _: 'checkAuthenticationCode',
          code: code.trim(),
        });

        const authStateResponse = await client.invoke({ _: 'getAuthorizationState' });

        if (authStateResponse._ === 'authorizationStateWaitPassword') {
          const password = this.configService.get<string>('TELEGRAM_2FA_PASSWORD') || '';
          if (!password) {
            const errMsg = 'Se requiere contraseña 2FA';
            this.logger.error(errMsg);
            return { success: false, error: errMsg };
          }

          await client.invoke({
            _: 'checkAuthenticationPassword',
            password,
          });
        }

        this.authStates.delete(phoneNumber);
        this.clients.set(phoneNumber, client);
        this.logger.log(`✅ Sesión creada exitosamente para ${phoneNumber}`);
        return { success: true, message: 'Autenticación completada' };
      } catch (error) {
        this.logger.error(`❌ Error al confirmar código (${phoneNumber || 'undefined'}): ${error.message}`);

        if (phoneNumber) {
          this.authStates.delete(phoneNumber.trim());
        }

        return { success: false, error: error.message };
      }
    }

    async getChatMessages(phoneNumber: string, chatId: number, limit = 50) {
      try {
        phoneNumber = phoneNumber.trim().replace('+', '');
        const client = this.clients.get(phoneNumber);
        if (!client) {
          const errMsg = `No hay cliente para ${phoneNumber}`;
          this.logger.error(errMsg);
          return { success: false, error: errMsg, messages: [] };
        }
        const { isLoggedIn } = await this.checkSession(phoneNumber);
        if (!isLoggedIn) {
          const errMsg = 'Cliente no autenticado';
          this.logger.error(errMsg);
          return { success: false, error: errMsg, messages: [] };
        }

        const history = await client.invoke({
          _: 'getChatHistory',
          chat_id: chatId,
          limit,
          from_message_id: 0,
          offset: 0,
          only_local: false,
        });

        const messages = history.messages
          .filter((m) => m.content && m.content._ === 'messageText')
          .map((m) => ({
            id: m.id,
            senderUserId: m.sender_user_id,
            date: m.date,
            text: m.content.text.text,
          }));

        return { success: true, messages };
      } catch (error) {
        this.logger.error(`❌ Error al obtener mensajes de chat ${chatId} (${phoneNumber}): ${error.message}`);
        return { success: false, error: error.message, messages: [] };
      }
    }

    async sendMessage(phoneNumber: string, chatId: string | number, text: string, botReply?: boolean) {
      try {
        phoneNumber = phoneNumber.trim().replace('+', '');
        const client = this.clients.get(phoneNumber);
        if (!client) {
          const errMsg = `No hay cliente para ${phoneNumber}`;
          this.logger.error(errMsg);
          return { success: false, error: errMsg };
        }
        const { isLoggedIn } = await this.checkSession(phoneNumber);
        if (!isLoggedIn) {
          const errMsg = 'Cliente no autenticado';
          this.logger.error(errMsg);
          return { success: false, error: errMsg };
        }

        let message = await client.invoke({
          _: 'sendMessage',
          chat_id: chatId,
          input_message_content: {
            _: 'inputMessageText',
            text: { _: 'formattedText', text },
          },
        });

        this.logger.log(`📤 Mensaje enviado a ${message}`);
        this.logger.log(`📤 Mensaje enviado a ${chatId} (${phoneNumber}): ${text}`);
        return { success: true };
      } catch (error) {
        this.logger.error(`❌ Error al enviar mensaje (${phoneNumber}): ${error.message}`);
        return { success: false, error: error.message };
      }
    }

    async getChats(phoneNumber: string, limit = 20) {
      try {
        phoneNumber = phoneNumber.trim().replace('+', '');
        const client = this.clients.get(phoneNumber);
        if (!client) {
          const errMsg = `No hay cliente para ${phoneNumber}`;
          this.logger.error(errMsg);
          return { success: false, error: errMsg, chats: [] };
        }
        const { isLoggedIn } = await this.checkSession(phoneNumber);
        if (!isLoggedIn) {
          const errMsg = 'Cliente no autenticado';
          this.logger.error(errMsg);
          return { success: false, error: errMsg, chats: [] };
        }

        const { chat_ids } = await client.invoke({
          _: 'getChats',
          limit,
        });

        const chats = await Promise.all(
          chat_ids.map(async (id) => {
            const chat = await client.invoke({ _: 'getChat', chat_id: id });
            return { id: chat.id, title: chat.title || 'Sin título' };
          }),
        );

        return { success: true, chats };
      } catch (error) {
        this.logger.error(`❌ Error al obtener chats (${phoneNumber}): ${error.message}`);
        return { success: false, error: error.message, chats: [] };
      }
    }
  }