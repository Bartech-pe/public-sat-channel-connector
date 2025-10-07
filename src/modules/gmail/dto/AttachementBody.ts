import { IsOptional, IsString } from 'class-validator';

export class AttachementBody {
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
