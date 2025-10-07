// src/modules/instagram/interfaces/instagram.interface.ts

export interface InstagramConfig {
  appId: string;
  appSecret: string;
  redirectUri: string;
  webhookVerifyToken: string;
  baseUrl: string;
  apiVersion: string;
  crmApiUrl: string;
}

export interface FacebookUser {
  id: string;
  username: string;
  email?: string;
  accessToken: string;
  refreshToken?: string;
}

export interface InstagramBusinessAccount {
  id: string;
  username: string;
  name: string;
  profile_picture_url: string;
}

export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: InstagramBusinessAccount;
}

export interface SendMessageDto {
  pageId: string;
  userId: string;
  pageAccessToken: string;
  recipientId: string;
  message: string;
}

export interface SubscribeWebhookDto {
  pageId: string;
  userId: string;
}

export interface ServiceResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface AuthCallbackResult {
  success: boolean;
  user: FacebookUser;
  accessToken: string;
  pages: FacebookPage[];
}

export interface SetupWebhookResult {
  appWebhook: FacebookApiResponse;
  pages: PageSetupResult[];
}

export interface WebhookSubscription {
  object: 'page' | 'instagram';
  callback_url: string;
  verify_token: string;
  fields: string[];
}

export interface FacebookApiResponse<T = any> {
  data?: T;
  success?: boolean;
  error?: ApiErrorResponse['error'];
}

export interface ApiErrorResponse {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
}

export interface WebhookStatus {
  success: boolean;
  data: PageSubscription[];
}

export interface PageSubscription {
  success: boolean;
  data?: WebhookSubscriptionData[];
}

export interface WebhookSubscriptionData {
  object: string;
  callback_url: string;
  fields: string[];
  active: boolean;
}

export interface PageSetupResult {
  pageId: string;
  pageName: string;
  instagram?: string;
  success: boolean;
  status?: PageSubscription;
  error?: string;
}

export interface DebugInfo {
  appWebhook: FacebookApiResponse;
  pages: PageDebugInfo[];
  summary: {
    totalPages: number;
    pagesWithWebhook: number;
  };
}

export interface PageDebugInfo {
  pageId: string;
  pageName: string;
  instagram?: string;
  webhookStatus?: WebhookStatus;
  hasWebhook: boolean;
  error?: string;
}

export interface IncomingMessage {
  sender: {
    id: string;
  };
  recipient: {
    id: string;
  };
  timestamp: number;
  message?: {
    mid: string;
    text: string;
    attachments?: any[];
  };
  postback?: {
    title: string;
    payload: string;
  };
}

export interface WebhookEvent {
  object: string;
  entry: WebhookEntry[];
}

export interface WebhookEntry {
  id: string;
  time: number;
  messaging: IncomingMessage[];
}

export interface CrmUserData {
  facebookId: string;
  username: string;
  email?: string;
  accessToken: string;
  pages: FacebookPage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CrmApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CrmMessageData {
  senderId: string;
  pageId: string;
  message: string;
  timestamp: Date;
  messageType: 'text' | 'image' | 'video' | 'audio' | 'file';
  attachments?: any[];
}

export interface InstagramServiceError extends Error {
  code?: string;
  statusCode?: number;
  details?: any;
}