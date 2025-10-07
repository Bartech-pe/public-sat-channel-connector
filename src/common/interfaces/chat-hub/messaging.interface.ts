export enum ChannelType {
  WHATSAPP = 'whatsapp',
  INSTAGRAM = 'instagram',
  TELEGRAM = 'telegram',
  SMS = 'sms',
  EMAIL = 'email',
  CHATSAT = 'chatsat',
}

export enum MessageType {
  INCOMING = 'message.incoming',
  OUTGOING = 'message.outgoing',
  CONVERSATION_STATUS = 'conversation.status',
  SESSION_STATUS = 'session.status',
}

export enum MessageStatus {
  SEEN = 'seen',
  DELIVERED = 'delivered',
  FAILED = 'failed',
}

export enum ChannelStatus {
  CONNECTED = 'connected',
  AUTH_FAILURE = 'auth_failure',
  DISCONNECTED = 'disconnected',
}

export interface Attachment
{
    type?: 'file' | 'image',
    name?: string;
    extension?: string | null,
    content?: string | null,
}