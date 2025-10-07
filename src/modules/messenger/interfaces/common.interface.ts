export interface FacebookCredentials {
  pageId: string;
  pageAccessToken: string;
  appSecret: string;
  verifyToken: string;
  userId: string;
}

export interface FacebookUser {
  id: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  profile_pic?: string;
  locale?: string;
  timezone?: number;
  gender?: string;
}

export interface FacebookMessage {
  mid: string;
  text?: string;
  attachments?: FacebookAttachment[];
  quick_reply?: FacebookQuickReply;
  reply_to?: FacebookReplyTo;
}

export interface FacebookAttachment {
  type: 'image' | 'audio' | 'video' | 'file' | 'template' | 'fallback';
  payload: {
    url?: string;
    template_type?: string;
    text?: string;
    buttons?: FacebookButton[];
    elements?: FacebookElement[];
    [key: string]: any;
  };
}

export interface FacebookButton {
  type: 'web_url' | 'postback' | 'phone_number' | 'element_share' | 'payment';
  title: string;
  url?: string;
  payload?: string;
  phone_number?: string;
}

export interface FacebookElement {
  title: string;
  subtitle?: string;
  image_url?: string;
  default_action?: FacebookButton;
  buttons?: FacebookButton[];
}

export interface FacebookQuickReply {
  payload: string;
}

export interface FacebookReplyTo {
  mid: string;
}

export interface FacebookMessaging {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: FacebookMessage;
  postback?: FacebookPostback;
  delivery?: FacebookDelivery;
  read?: FacebookRead;
}

export interface FacebookPostback {
  title: string;
  payload: string;
  referral?: FacebookReferral;
}

export interface FacebookDelivery {
  mids: string[];
  watermark: number;
}

export interface FacebookRead {
  watermark: number;
}

export interface FacebookReferral {
  ref: string;
  source: string;
  type: string;
}

export interface FacebookWebhookEntry {
  id: string;
  time: number;
  messaging: FacebookMessaging[];
}

export interface FacebookWebhookPayload {
  object: string;
  entry: FacebookWebhookEntry[];
}

export interface FacebookSendMessagePayload {
  recipient: { id: string };
  message: FacebookOutgoingMessage;
  messaging_type?: 'RESPONSE' | 'UPDATE' | 'MESSAGE_TAG';
  tag?: string;
}

export interface FacebookOutgoingMessage {
  text?: string;
  attachment?: FacebookAttachment;
  quick_replies?: FacebookQuickReplyOption[];
}

export interface FacebookQuickReplyOption {
  content_type: 'text' | 'user_phone_number' | 'user_email';
  title?: string;
  payload?: string;
  image_url?: string;
}

export interface FacebookApiResponse<T = any> {
  data?: T;
  error?: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
}

export interface FacebookMessageResponse {
  recipient_id: string;
  message_id: string;
}

export interface ExternalApiCredentials {
  userId: string;
  platform: 'facebook_messenger';
  credentials: FacebookCredentials;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExternalApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
