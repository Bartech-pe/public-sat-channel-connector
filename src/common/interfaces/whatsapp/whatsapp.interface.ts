export interface WebhookMessageText {
  body: string;
}

export interface WebhookMessage {
  from: string;
  id: string;
  timestamp: string;
  type: 'text';
  text: WebhookMessageText;
}

export interface WebhookContactProfile {
  name: string;
}

export interface WebhookContact {
  wa_id: string;
  profile: WebhookContactProfile;
}

export interface WebhookValue {
  messaging_product: 'whatsapp';
  metadata?: {
    display_phone_number: string;
    phone_number_id: string;
  };
  messages?: WebhookMessage[];
  contacts?: WebhookContact[];
}

export interface WebhookChange {
  field: string;
  value: WebhookValue;
}

export interface WebhookEntry {
  id: string;
  changes: WebhookChange[];
}

export interface WebhookPayload {
  object: 'whatsapp_business_account';
  entry: WebhookEntry[];
}
