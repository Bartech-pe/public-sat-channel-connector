import { ChannelType, MessageStatus, MessageType } from "../messaging.interface";

export interface ConversationStatusMessage {
  type: MessageType.CONVERSATION_STATUS;
  payload: ConversationStatusPayload;
}

export interface ConversationStatusPayload {
  messageId: string;
  channel: ChannelType;
  sessionId: string;
  contactId: string;
  status: MessageStatus;
  timestamp: string;
}
