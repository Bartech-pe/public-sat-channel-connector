import { PartialType } from '@nestjs/mapped-types';
import { CreateInstagramDto } from './create-instagram.dto';

export class UpdateInstagramDto extends PartialType(CreateInstagramDto) {}
