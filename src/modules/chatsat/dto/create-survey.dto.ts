import { IsInt, IsString, IsOptional, Min, Max, IsNotEmpty } from 'class-validator';
import { ValidationMessages as v} from 'src/common/messages/validation-messages';

export class CreateSurveyDto {
  @IsInt({ message: v.isInt('assistanceId') })
  @IsNotEmpty({ message: v.isNotEmpty('assistanceId') })
  assistanceId: number;

  @IsInt({ message: v.isInt('channelRoomId') })
  @IsNotEmpty({ message: v.isNotEmpty('channelRoomId') })
  channelRoomId: number;

  @IsInt({ message: v.isInt('citizenId') })
  @IsNotEmpty({ message: v.isNotEmpty('citizenId') })
  citizenId: number;

  @IsOptional()
  @IsString({ message: v.isString('comment') })
  comment?: string;

  @IsInt({ message: v.isInt('rating') })
  @IsNotEmpty({ message: v.isNotEmpty('rating') })
  rating: number;

  @IsOptional()
  userId?: number | null;
}