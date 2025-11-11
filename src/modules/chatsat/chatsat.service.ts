import { Injectable, Logger, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { IncomingMessage } from 'src/common/interfaces/chat-hub/incoming/incoming.interface';
import { ChatHubGateway, IChannelChatInformation } from '../chat-hub/chat-hub.gateway';

@Injectable()
export class ChatsatService {
	private readonly logger = new Logger(ChatsatService.name);
	private readonly MESSAGE_TIMEOUT = 30000; // 30 segundos timeout
	private readonly MAX_BASE64_SIZE = 15 * 1024 * 1024; // 15MB en base64 (~11MB archivo real)
	private readonly MAX_ATTACHMENTS = 10; // Máximo número de attachments

	constructor(private chatHubGateway: ChatHubGateway) {}

	/**
	 * Envío sin timeout (solo para mensajes sin attachments)
	 */
	private async broadcastWithoutTimeout(data: any): Promise<IChannelChatInformation> {
		return new Promise((resolve, reject) => {
			try {
				this.chatHubGateway.broadcastMessageWithCallback(
					data,
					(crmResponse: IChannelChatInformation) => resolve(crmResponse)
				);
			} catch (error) {
				this.logger.error(`Error in broadcastWithoutTimeout: ${error.message}`);
				reject(error);
			}
		});
	}

	/**
	 * Envío con timeout (solo para mensajes con attachments)
	 */
	private broadcastWithTimeout(data: IncomingMessage, timeoutMs = this.MESSAGE_TIMEOUT): Promise<IChannelChatInformation> {
		return new Promise((resolve, reject) => {
			let isResolved = false;

			const timeoutId = setTimeout(() => {
				if (!isResolved) {
					isResolved = true;
					this.logger.error('Broadcast timeout exceeded');
					reject(new Error('Message broadcast timeout'));
				}
			}, timeoutMs);

			try {
				this.chatHubGateway.broadcastMessageWithCallback(
					data,
					(crmResponse: IChannelChatInformation) => {
						if (!isResolved) {
							isResolved = true;
							clearTimeout(timeoutId);
							this.logger.debug(`Message broadcast successful`);
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

	/**
	 * Método principal de envío
	 */
	public async sendMessage(data: IncomingMessage): Promise<IChannelChatInformation> {
		try {
			// --- Validaciones básicas ---
			if (!data.token) throw new UnauthorizedException('Unauthorized');
			if (!data.payload) throw new BadRequestException('Payload is required');

			const { attachments } = data.payload;

			// === CASO 1: con attachments ===
			if (attachments?.length) {
				if (attachments.length > this.MAX_ATTACHMENTS) {
					throw new BadRequestException(`Too many attachments. Max: ${this.MAX_ATTACHMENTS}`);
				}

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

				// --- Envío con timeout controlado ---
				this.logger.debug(`Sending message with attachments (timeout ${this.MESSAGE_TIMEOUT}ms)`);
				const crmResponse = await this.broadcastWithTimeout(data);
				return crmResponse;
			}

			// === CASO 2: sin attachments ===
			this.logger.debug(`Sending message without attachments`);
			const crmResponse = await this.broadcastWithoutTimeout(data);
			return crmResponse;
			
		} catch (error) {
			this.logger.error(`Error in sendMessage: ${error.message}`);
			throw error; // ⬅️ IMPORTANTE: lanzamos el error para que el caller lo maneje
		}
	}


	/**
	 * Utilidades
	 */
	private getBase64Size(base64String: string): number {
		try {
			if (!base64String) return 0;
			const base64Data = base64String.split(',')[1] || base64String;
			const padding = (base64Data.match(/=/g) || []).length;
			return base64Data.length * 0.75 - padding;
		} catch (error) {
			this.logger.warn(`Error calculating base64 size: ${error.message}`);
			return 0;
		}
	}

	getFileType(extension: string): 'image' | 'file' {
		try {
			const imageExtensions = new Set([
				'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'tiff', 'ico', 'heic', 'heif',
			]);
			const ext = extension.toLowerCase().replace('.', '');
			return imageExtensions.has(ext) ? 'image' : 'file';
		} catch (error) {
			this.logger.warn(`Error determining file type for extension ${extension}: ${error.message}`);
			return 'file';
		}
	}
}
