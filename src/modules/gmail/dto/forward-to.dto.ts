import { IsString } from 'class-validator';

export class ForwardTo {
  @IsString()
  clientId: string;
  @IsString()
  messageId: string;
  @IsString()
  forwardTo: string;
  @IsString()
  message: string;
}

export class ForwardBody {
  from: string;
  subject: string;
  date: string;
  forwardTo: string;
  snippet: string;
  threadId: string;
  messageId: string;
  message: string;
}
