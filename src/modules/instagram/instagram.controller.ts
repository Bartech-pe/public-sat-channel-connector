import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Res,
  UseGuards,
  Logger,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InstagramService } from './instagram.service';
import { Response, Request } from 'express';
import { envConfig } from 'config/env';

@Controller('auth/instagram')
export class InstagramController {
  private readonly logger = new Logger(InstagramController.name);

  constructor(private readonly svc: InstagramService) {}

  @Get('login')
  @UseGuards(AuthGuard('facebook'))
  login() {}

  @Get('callback')
  @UseGuards(AuthGuard('facebook'))
  async callback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as any;
    try {
      const longToken = await this.svc.extendUserToken(user.accessToken);
      const { pages, subscriptions } = await this.svc.setupAfterAuth(longToken);
      const redirectUrl = `${envConfig.crmApiUrl}/auth/success?access_token=${longToken}&pages=${pages.length}`;
      res.redirect(redirectUrl);
    } catch (err) {
      this.logger.error(err.message);
      res.redirect(
        `${envConfig.crmApiUrl}/auth/error?msg=${encodeURIComponent(err.message)}`,
      );
    }
  }
  @Get('pages')
  async pages(@Query('access_token') token: string, @Res() res: Response) {
    if (!token) throw new BadRequestException('access_token required');
    const data = await this.svc.getUserPages(token);
    res.json({ success: true, data });
  }

  @Post('configure-app-webhook')
  async configureAppWebhook(@Res() res: Response) {
    const data = await this.svc.configureAppWebhook();
    res.json({ success: true, data });
  }

  @Post('subscribe-page/:pageId')
  async subscribePage(
    @Param('pageId') pageId: string,
    @Query('access_token') token: string,
    @Res() res: Response,
  ) {
    if (!token) throw new BadRequestException('access_token required');
    const data = await this.svc.subscribePageWebhook(pageId, token);
    res.json({ success: true, data });
  }

  @Get('webhook-app-status')
  async webhookAppStatus(@Res() res: Response) {
    const data = await this.svc.checkAppWebhook();
    res.json({ success: true, data });
  }

  @Get('webhook-page-status/:pageId')
  async webhookPageStatus(
    @Param('pageId') pageId: string,
    @Query('access_token') token: string,
    @Res() res: Response,
  ) {
    if (!token) throw new BadRequestException('access_token required');
    const data = await this.svc.checkPageWebhook(pageId, token);
    res.json({ success: true, data });
  }

  @Get('debug')
  async debug(@Query('access_token') token: string, @Res() res: Response) {
    if (!token) throw new BadRequestException('access_token required');
    const data = await this.svc.debugWebhook(token);
    res.json({ success: true, data });
  }
}
