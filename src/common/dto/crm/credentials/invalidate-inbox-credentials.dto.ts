import {
  IsBoolean,
  IsDate,
  isDate,
  IsNotEmpty,
  isNumber,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ValidationMessages as v } from 'src/common/messages/validation-messages';
import { Transform } from 'class-transformer';

export class InvalidateInboxCredentialDto {
  @IsOptional()
  @IsString({ message: v.isString('phoneNumber') })
  phoneNumber?: string;

  @IsOptional()
  @IsString({ message: v.isString('accessToken') })
  accessToken?: string;
}
