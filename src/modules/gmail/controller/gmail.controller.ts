/* eslint-disable @typescript-eslint/no-unused-vars */
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AuthGmailService } from '../auth-gmail.service';
import { GmailService } from '../gmail.service';
import { BuildCenterEmail, Watchail } from '../dto/BuildEmail';
import { ReplyEmail } from '../dto/reply-email.dto';
import { ForwardTo } from '../dto/forward-to.dto';
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
@Controller('mail')
export class GmailController {
  constructor(
        private readonly authService:AuthGmailService,
        private readonly emailService:GmailService,
    ) { }
    @Post()
    Login(@Body() body:any){
      return  this.authService.authenticateWithCredentials(body.email)
    }
    @Post('setOAuth')
    SetOAuth(@Body() body:any){
      return  this.authService.setOauthClient(body.clientId,body.clientSecret)
    }
     @Post('code')
    async GetCode(@Body() body:{code:string}){
        return await this.authService.exchangeCodeForTokens(body.code)
    }
    @Get('refresh/:email')
    async RefreshToken( @Param('email') email:string){
       return await this.authService.RefrestToken(email); 
    }
     @Get('refreshset/:email')
    async refreshset( @Param('email') email:string){
       return await this.emailService.RefreshSetToken(email); 
    }
    @Post('sendemail')
    async SendEmail(@Body() body:BuildCenterEmail){
       return await this.emailService.ProcessEmail(body);
    }
    @Post('messages')
    async GetMessages(@Body() options: {
    query?: string;
    maxResults?: number;
    pageToken?: string;
    accessToken:string;
    refreshToken:string;
    }){
        return await this.emailService.getMessages(options)
    }
    @Get('messages/:messageId')
    async GetMessage(@Param('messageId') messageId:string){
       return await this.emailService.GetEmail(messageId);
    }
    @Post('replyemail')
    async ReplyEmail(@Body() body:ReplyEmail){
      return await this.emailService.ReplyEmail(body)
    }
    @Post('forwardto')
    async forwardTo(@Body() body:ForwardTo){
      return await this.emailService.forwardTo(body)
    }
    @Post('setWatch')
    async setWatch(@Body() body:Watchail){
       return await this.emailService.setWatch(body)
    }
   @Get('createCredential')
   async createCredentialByEmail(@Query() body: { code: string }) {
      return await this.authService.setCode(body.code)
   }

}


