import { IsArray, IsOptional, IsString } from 'class-validator';

export class MailClient {
  @IsString()
  clientId: string;
  @IsString()
  clientSecret: string;
  @IsString()
  redirectUri: string;
  @IsString()
  email: string;
  @IsString()
  state: string;
}

export class BuildEmail {
  @IsString()
  from: string;
  @IsArray()
  to: string;
  @IsString()
  @IsOptional()
  cc?: string;
  @IsString()
  @IsOptional()
  bcc?: string[];
  @IsString()
  subject: string;
  @IsString()
  @IsOptional()
  text?: string;
  @IsString()
  @IsOptional()
  html?: string;
  @IsOptional()
  @IsArray()
  attachments?: FileEmail[];
}

export class FileEmail {
  filename: string;
  content: Buffer | string;
  mimeType: string;
}

export class BuildCenterEmail extends BuildEmail {
  refreshToken: string;
  name?: string;
  clientId: string;
}

export class WatchMail {
  @IsString()
  clientId: string;
  @IsString()
  refreshToken: string;
  @IsString()
  projectId: string;
  @IsString()
  topicName: string;
}
