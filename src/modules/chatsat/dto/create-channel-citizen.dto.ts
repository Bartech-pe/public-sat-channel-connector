import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ValidationMessages as v } from 'src/common/messages/validation-messages';
export type CitizenDocType = 'DNI' | 'CE' | 'OTROS';


export class CreateChannelCitizenDto {
  @IsNotEmpty({ message: v.isNotEmpty('name') })
  @IsString({ message: v.isString('name') })
  name: string;

  @IsOptional()
  @IsString({ message: v.isString('externalUserId') })
  externalUserId?: string;

  @IsOptional()
  @IsString({ message: v.isString('phoneNumber') })
  phoneNumber?: string;

  @IsOptional()
  @IsString({ message: v.isString('documentNumber') })
  documentNumber?: string;

  @IsOptional()
  @IsString({ message: v.isString('documentType') })
  documentType?: CitizenDocType;

  @IsNotEmpty({ message: v.isNotEmpty('isExternal') })
  @IsBoolean({ message: v.isBoolean('isExternal') })
  isExternal: boolean;

  @IsOptional()
  @IsString({ message: v.isString('email') })
  email?: string;

  @IsOptional()
  @IsString({ message: v.isString('avatarUrl') })
  avatarUrl?: string;
}
