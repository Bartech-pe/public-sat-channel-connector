export class EmailSent {
  messageId: string;
  referencesMail: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  references?: string | null;
  inReplyTo?: string | null;
  forward?: string | null;
  content: EmailSentContent[];
  attachment: AttachmentContent[];
}
export class EmailSentContent {
  mimeType: string;
  content: string;
}
export class AttachmentContent {
  attachmentId: string;
  filename: string;
  mimeType: string;
}
