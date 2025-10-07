import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { IncomingMessage } from 'src/common/interfaces/chat-hub/incoming/incoming.interface';
import { ChatsatGateway } from './chatsat.gateway';
import { ChatHubGateway, IChannelChatInformation } from '../chat-hub/chat-hub.gateway';

@Injectable()
export class ChatsatService {
	  private readonly logger = new Logger(ChatsatService.name);
	
	constructor(private chatHubGateway: ChatHubGateway){

	}

	public async sendMessage(data: IncomingMessage): Promise<any> {
		return new Promise((resolve, reject) => {
			try {
				if (!data.token) {
					return reject(new UnauthorizedException("Unauthorized"));
				}
				const { attachments } = data.payload;
				this.logger.debug(data)
				if (attachments?.length) {
				data.payload.attachments = attachments.map(att => ({
					...att,
					type: att.extension ? this.getFileType(att.extension) : att.type,
				}));
				}
				this.chatHubGateway.broadcastMessageWithCallback(data, (crmResponse: IChannelChatInformation) => {
					this.logger.debug(crmResponse)
					resolve(crmResponse);
				});
			} catch (error) {	
				reject(error);
			}
		});
	}

	getFileType(extension: string): 'image' | 'file' {
		const imageExtensions = new Set([
		'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'tiff', 'ico', 'heic', 'heif'
		]);

		const ext = extension.toLowerCase().replace('.', '');

		return imageExtensions.has(ext) ? 'image' : 'file';
	}

}
