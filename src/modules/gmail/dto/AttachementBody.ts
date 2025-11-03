import { IsOptional, IsString } from 'class-validator';

export class AttachementBody {
  @IsString()
  clientId: string;
  @IsString()
  email: string;
  @IsString()
  messageId: string;
  @IsString()
  attachmentId: string;
  @IsString()
  @IsOptional()
  mimeType: string;
  @IsString()
  @IsOptional()
  filename: string;
}
