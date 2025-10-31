import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { WhatsappOfficialGateway } from './whatsapp-official.gateway';
import { IncomingMessage } from 'src/common/interfaces/chat-hub/incoming/incoming.interface';
import { ChannelType, MessageType } from 'src/common/interfaces/chat-hub/messaging.interface';

export interface WhatsappOptionsButtons{
  id: string;
  title: string 
}

export interface WhatsappFooterOptions{
  text: string 
}
export interface WhatsappMessageOptions{
  type: "text" | "interactive";
  text?: string;
  buttons?: WhatsappOptionsButtons[];
  footer?: WhatsappFooterOptions
}

@Injectable()
export class WhatsappOfficialService {
  private readonly logger = new Logger(WhatsappOfficialService.name);
  private readonly baseUrl = "https://graph.facebook.com/v19.0";
  constructor(private readonly whatsappOfficialGateway: WhatsappOfficialGateway) {}

    async sendMessage(
      phoneNumberId: string,
      accessToken: string,
      to: string,
      options?: WhatsappMessageOptions
    ): Promise<AxiosResponse<any, any> | undefined> {
      try {
        let payload: Record<string, any> = {
          messaging_product: "whatsapp",
          to,
        };

        if (options?.type === "text") {
          payload = {
            ...payload,
            type: "text",
            text: { body: options?.text },
          };
        }

        if (options?.type === "interactive" && options?.buttons) {
          payload = {
            ...payload,
            type: "interactive",
            interactive: {
              type: "button",
              body: { text: options.text ?? "" },
              action: {
                buttons: options.buttons.map((btn) => ({
                  type: "reply",
                  reply: { id: btn.id, title: btn.title },
                })),
              },
            },
          };
        }
        if(options?.type === "interactive" && options?.footer){
          const interactiveModel = payload.interactive
          payload = {
            ...payload,
            interactive: {
              ...interactiveModel,
              footer: options.footer
            }
          }
        }
        const response = await axios.post(
          `${this.baseUrl}/${phoneNumberId}/messages`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );
        
        return response;
      } catch (error) {
        this.logger.error(`Error enviando mensaje: ${JSON.stringify(error)}`);
      }
  }


  async handleViewMessageActivatingTypingIndicator(
    phoneNumberId: string,
    accessToken: string,
    messageId: string,
  ):  Promise<AxiosResponse<any, any>| undefined> {
    try {
      const response = await axios.post(
        `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          status: "read",
          message_id: messageId,
          typing_indicator: {
            type: 'text'
          }
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return response;
    } catch (error) {
      this.logger.error(`Error del cliente : ${JSON.stringify(error)}`);
    }
  }

  handleIncomingMessage(webhookPayload: any) {
    const entry = webhookPayload?.entry?.[0];
    const change = entry?.changes?.[0];
    const contacts = change?.value?.contacts?.[0];
    const message = change?.value?.messages?.[0];
    const metadata = change?.value?.metadata;

    if (!message || !metadata) return;
    const incomingMessage: IncomingMessage = {
      type: MessageType.INCOMING,
      payload: {
        chat_id: message.id,
        channel: ChannelType.WHATSAPP,
        message: {
          id: message.id,
          body: message.text?.body || message?.interactive?.button_reply?.title || '',
          botReply: false
        },
        sender: {
          id: message.from,
          full_name: '',
          alias: contacts.name,
          phone_number: message.from,
        },
        receiver: {
          id: metadata.phone_number_id,
          full_name: '',
          alias: '',
          phone_number: metadata.display_phone_number || '',
        },
        timestamp: parseInt(message.timestamp),
      },
    };

    this.logger.log(`📥 Mensaje entrante de ${message.from}: ${message.text?.body}`);
    this.whatsappOfficialGateway.broadcastMessage(incomingMessage);
  }
}
