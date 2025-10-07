import { PartialType } from '@nestjs/mapped-types';
import { CreateWhatsappOfficialDto } from './create-whatsapp-official.dto';

export class UpdateWhatsappOfficialDto extends PartialType(CreateWhatsappOfficialDto) {}
