// import { Injectable, Logger } from '@nestjs/common';
// import { TelegramSession } from '../models/sessions/telegram-session.model';

// @Injectable()
// export class TelegramSessionsService {
//   private readonly logger = new Logger(TelegramSessionsService.name);

//   constructor(
//     private readonly sessionRepository: TelegramSessionRepository,
//   ) {}

//   async saveSession(phoneNumber: string, sessionData: string, isActive: boolean): Promise<TelegramSession> {
//     try {
//       const session = await this.sessionRepository.saveSession(phoneNumber, sessionData, isActive);
//       this.logger.log(`✅ Sesión guardada para ${phoneNumber}`);
//       return session;
//     } catch (error) {
//       this.logger.error(`❌ Error al guardar sesión: ${error.message}`);
//       throw error;
//     }
//   }

//   async getSession(phoneNumber: string): Promise<TelegramSession | null> {
//     try {
//       const session = await this.sessionRepository.getSession(phoneNumber);
//       if (session) {
//         this.logger.log(`ℹ️ Sesión encontrada para ${phoneNumber}`);
//       } else {
//         this.logger.log(`ℹ️ No se encontró sesión para ${phoneNumber}`);
//       }
//       return session || null;
//     } catch (error) {
//       this.logger.error(`❌ Error al obtener sesión: ${error.message}`);
//       return null;
//     }
//   }

//   async deleteSession(phoneNumber: string): Promise<boolean> {
//     try {
//       const result = await this.sessionRepository.deleteSession(phoneNumber);
//       this.logger.log(`🗑️ Sesión eliminada para ${phoneNumber}`);
//       return result;
//     } catch (error) {
//       this.logger.error(`❌ Error al eliminar sesión: ${error.message}`);
//       return false;
//     }
//   }

//   async getActiveSessions(): Promise<{ id: string; phoneNumber: string }[]> {
//     try {
//       const sessions = await this.sessionRepository.getActiveSessions();
//       this.logger.log(`ℹ️ ${sessions.length} sesiones activas encontradas`);
//       return sessions.map((session) => ({
//         id: session.id,
//         phoneNumber: session.phoneNumber,
//       }));
//     } catch (error) {
//       this.logger.error(`❌ Error al obtener sesiones activas: ${error.message}`);
//       return [];
//     }
//   }
// }