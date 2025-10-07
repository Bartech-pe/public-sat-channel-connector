import { Attachment, ChannelType, MessageType } from "../messaging.interface";

export interface IncomingMessage {
  type: MessageType.INCOMING;
  payload: IncomingPayload;
  token?: string;
}

export interface Participant
{
    id?: string | number;
    full_name?: string;
    alias?: string;
    avatar?: string;
    phone_number?: string;
    status?: string;
}
export interface Message
{
    id: string | number,  
    body?: string | null,
    botReply?: boolean,
}

export interface IncomingPayload {
  channel: ChannelType;
  chat_id: string | number;
  fromMe?: boolean;
  sender?: Participant;
  receiver?: Participant;
  message: Message;
  attachments?: Attachment[];
  timestamp: string | number; 
}

