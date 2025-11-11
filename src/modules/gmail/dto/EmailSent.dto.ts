export class EmailSent {
  messageId: string;
  referencesMail?: string;
  threadId?: string;
  subject?: string;
  from?: string;
  to?: string;
  date?: string;
  references?: string | null;
  inReplyTo?: string | null;
  forward?: string | null;
  content: string;
  attachments: AttachmentContent[];
}

export class EmailSentContent {
  mimeType: string;
  content: string;
}

export class AttachmentContent {
  attachmentId: string;
  cid: string;
  filename: string;
  mimeType: string;
  size: number;
  content?: string;
}
