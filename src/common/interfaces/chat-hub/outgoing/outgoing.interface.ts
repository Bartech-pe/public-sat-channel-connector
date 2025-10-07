import { dateRange } from "tdlib-types";
import { Attachment, ChannelType, MessageType } from "../messaging.interface";
import { WhatsappMessageOptions } from "src/modules/whatsapp-official/whatsapp-official.service";

export interface MessagingCredentials {
  accessToken?: string;
  phoneNumberId?: string;
}
export interface CustomMessage{
  type: string;
}

export interface OutgoingPayload {
  channel: ChannelType;
  chat_id:  string | number;
  assistanceId?: number;
  channelRoomId?: number;
  citizenId?: number;
  userId?: number;
  phoneNumber: string;
  botReply?: boolean;
  customMessage?: CustomMessage;
  credentials: MessagingCredentials;
  lastMessageId?: string;
  to: string;
  attachments?: MessageAttachment[];
  options?: WhatsappMessageOptions;
  message: string;
  timestamp: dateRange; 
}

export interface MessageAttachment
{
  id?: number;
  size?: number;
  name?: string;
  type: 'file' | 'image';
  content: string;
  extension: string
}