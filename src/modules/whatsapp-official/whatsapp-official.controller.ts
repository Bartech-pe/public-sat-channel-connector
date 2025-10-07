import { Controller, Get, Post, Query, Req, Res, Body, HttpStatus, Logger, BadRequestException } from '@nestjs/common';
import { WhatsappOfficialService } from './whatsapp-official.service';
import { Request, Response } from 'express';

@Controller('whatsapp')
export class WhatsappOfficialController {
    constructor(private readonly whatsappOfficialService: WhatsappOfficialService) {}

    // @Post()
    // handleWebhook(@Req() req: Request, @Res() res: Response) {
    //     //
    // }
}
