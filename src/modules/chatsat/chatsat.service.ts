import { Injectable, Logger, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { IncomingMessage } from 'src/common/interfaces/chat-hub/incoming/incoming.interface';
import { ChatsatGateway } from './chatsat.gateway';
import { ChatHubGateway, IChannelChatInformation } from '../chat-hub/chat-hub.gateway';

@Injectable()
export class ChatsatService {
	private readonly logger = new Logger(ChatsatService.name);
	private readonly MESSAGE_TIMEOUT = 30000; // 30 segundos timeout
	private readonly MAX_BASE64_SIZE = 15 * 1024 * 1024; // 15MB en base64 (~11MB archivo real)
	private readonly MAX_ATTACHMENTS = 10; // Máximo número de attachments
	
	constructor(private chatHubGateway: ChatHubGateway) {}

	public async sendMessage(data: IncomingMessage): Promise<any> {
		try {
			// Validación de token
			if (!data.token) {
				throw new UnauthorizedException("Unauthorized");
			}

			// Validación de payload
			if (!data.payload) {
				throw new BadRequestException("Payload is required");
			}

			const { attachments } = data.payload;

			if (attachments?.length) {
				if (attachments.length > this.MAX_ATTACHMENTS) {
					throw new BadRequestException(`Too many attachments. Max: ${this.MAX_ATTACHMENTS}`);
				}

				// Validar tamaño de base64 en cada attachment
				for (const att of attachments) {
					if (att.content) {
						const base64Data = att.content;
						const estimatedSize = this.getBase64Size(base64Data);
						
						if (estimatedSize > this.MAX_BASE64_SIZE) {
							throw new BadRequestException(
								`Attachment too large: ${(estimatedSize / 1024 / 1024).toFixed(2)}MB. Max: ${(this.MAX_BASE64_SIZE / 1024 / 1024).toFixed(2)}MB`
							);
						}
						
						this.logger.debug(`Attachment size: ${(estimatedSize / 1024).toFixed(2)}KB`);
					}
				}

				// Procesar attachments sin loggear el base64
				data.payload.attachments = attachments.map((att, index) => {
					try {
						return {
							...att,
							type: att.extension ? this.getFileType(att.extension) : att.type,
						};
					} catch (err) {
						this.logger.warn(`Error processing attachment ${index}: ${err.message}`);
						return att;
					}
				});
			}

			// Enviar mensaje con timeout
			return await this.broadcastWithTimeout(data);

		} catch (error) {
			// No loggear el objeto completo si tiene base64
			this.logger.error(`Error in sendMessage: ${error.message}`);
			throw error;
		}
	}

	private getBase64Size(base64String: string): number {
		try {
			if (!base64String) return 0;
			
			// Remover el data URI prefix si existe (data:image/png;base64,...)
			const base64Data = base64String.split(',')[1] || base64String;
			
			// Calcular tamaño aproximado
			const padding = (base64Data.match(/=/g) || []).length;
			return (base64Data.length * 0.75) - padding;
		} catch (error) {
			this.logger.warn(`Error calculating base64 size: ${error.message}`);
			return 0;
		}
	}

	private broadcastWithTimeout(data: IncomingMessage): Promise<IChannelChatInformation> {
		return new Promise((resolve, reject) => {
			let isResolved = false;

			// Timeout para evitar que la promesa quede pendiente
			const timeoutId = setTimeout(() => {
				if (!isResolved) {
					isResolved = true;
					this.logger.error('Broadcast timeout exceeded');
					reject(new Error('Message broadcast timeout'));
				}
			}, this.MESSAGE_TIMEOUT);

			try {
				this.chatHubGateway.broadcastMessageWithCallback(
					data, 
					(crmResponse: IChannelChatInformation) => {
						if (!isResolved) {
							isResolved = true;
							clearTimeout(timeoutId);
							
							// Log sin datos pesados
							this.logger.debug(`Message broadcast successful  }`);
							resolve(crmResponse);
						}
					}
				);
			} catch (error) {
				if (!isResolved) {
					isResolved = true;
					clearTimeout(timeoutId);
					this.logger.error(`Error in broadcastMessageWithCallback: ${error.message}`);
					reject(error);
				}
			}
		});
	}

	getFileType(extension: string): 'image' | 'file' {
		try {
			const imageExtensions = new Set([
				'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'tiff', 'ico', 'heic', 'heif'
			]);

			const ext = extension.toLowerCase().replace('.', '');
			return imageExtensions.has(ext) ? 'image' : 'file';
		} catch (error) {
			this.logger.warn(`Error determining file type for extension ${extension}: ${error.message}`);
			return 'file';
		}
	}
}