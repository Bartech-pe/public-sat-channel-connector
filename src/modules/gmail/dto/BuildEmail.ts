import { IsArray, IsOptional, IsString } from 'class-validator';

export class BuildEmail {
  @IsString()
  from: string;
  @IsArray()
  to: string[];
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
}
export class Watchail {
  @IsString()
  refreshToken: string;
  @IsString()
  projectId: string;
  @IsString()
  topicName: string;
}
