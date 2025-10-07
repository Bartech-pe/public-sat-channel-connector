// instagram.service.ts
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  FacebookPage,
  WebhookStatus,
  FacebookApiResponse,
  PageSubscription,
  DebugInfo,
  PageDebugInfo,
  IncomingMessage,
  WebhookEvent,
} from './interfaces/instagram.interface';

@Injectable()
export class InstagramService {
  private readonly logger = new Logger(InstagramService.name);
  private readonly apiVersion = 'v23.0';
  private readonly appId: string;
  private readonly appSecret: string;
  private readonly webhookVerifyToken: string;
  private readonly baseUrl: string;

  constructor(private cfg: ConfigService) {
    this.appId = this.cfg.get<string>('FACEBOOK_APP_ID')!;
    this.appSecret = this.cfg.get<string>('FACEBOOK_APP_SECRET')!;
    this.webhookVerifyToken = this.cfg.get<string>('INSTAGRAM_VERIFY_TOKEN')!;
    this.baseUrl = this.cfg.get<string>('BASE_URL')!;
  }

  /** Exchange a short-lived token for a long-lived (~60 days) user token */
  async extendUserToken(shortToken: string): Promise<string> {
    try {
      const res = await axios.get(
        `https://graph.facebook.com/oauth/access_token`,
        {
          params: {
            grant_type: 'fb_exchange_token',
            client_id: this.appId,
            client_secret: this.appSecret,
            fb_exchange_token: shortToken,
          },
        }
      );
      return res.data.access_token;
    } catch (err: any) {
      this.logger.error('extendUserToken error', err.message);
      throw new BadRequestException('Failed to extend user token');
    }
  }

  /** Fetch pages the user manages that have an Instagram Business account */
  async getUserPages(userAccessToken: string): Promise<FacebookPage[]> {
    try {
      const { data } = await axios.get<FacebookApiResponse<FacebookPage[]>>(
        `https://graph.facebook.com/${this.apiVersion}/me/accounts`,
        {
          params: {
            access_token: userAccessToken,
            fields:
              'access_token,name,id,instagram_business_account{id,username}',
          },
        }
      );
      return (data.data || []).filter((p) => p.instagram_business_account);
    } catch (err: any) {
      this.logger.error('getUserPages error', this.extractErr(err));
      throw new BadRequestException('Failed to get user pages');
    }
  }

  /** Configure app‑level webhooks for both Facebook Page and Instagram */
  async configureAppWebhook(): Promise<FacebookApiResponse> {
    try {
      // Subscribe to Facebook Page events
      const pageSub = await axios.post<FacebookApiResponse>(
        `https://graph.facebook.com/${this.apiVersion}/${this.appId}/subscriptions`,
        {
          object: 'page',
          callback_url: `${this.baseUrl}/instagram/webhook`,
          verify_token: this.webhookVerifyToken,
          fields: [
            'messages',
            'messaging_postbacks',
            'messaging_optins',
            'message_deliveries',
            'message_reads',
            'messaging_referrals',
          ],
        },
        { params: { access_token: `${this.appId}|${this.appSecret}` } }
      );

      // Subscribe to Instagram events
      await axios.post(
        `https://graph.facebook.com/${this.apiVersion}/${this.appId}/subscriptions`,
        {
          object: 'instagram',
          callback_url: `${this.baseUrl}/instagram/webhook`,
          verify_token: this.webhookVerifyToken,
          fields: ['messages', 'message_reactions'],
        },
        { params: { access_token: `${this.appId}|${this.appSecret}` } }
      );

      return pageSub.data;
    } catch (err: any) {
      this.logger.error('configureAppWebhook error', this.extractErr(err));
      throw new BadRequestException('Failed to configure app webhook');
    }
  }

  /** After user login, automatically setup webhooks for app, pages, and IG accounts */
  async setupAfterAuth(userAccessToken: string): Promise<{
    pages: FacebookPage[];
    subscriptions: PageSubscription[];
  }> {
    await this.configureAppWebhook();
    const pages = await this.getUserPages(userAccessToken);
    const subscriptions: PageSubscription[] = [];

    for (const p of pages) {
      try {
        // Subscribe page
        const pageSub = await this.subscribePageWebhook(
          p.id,
          p.access_token
        );
        subscriptions.push(pageSub);
        this.logger.log(`Proveedor suscribe página cliente ${p.name}`);

        // Subscribe Instagram Business
        const igId = p.instagram_business_account!.id;
        await axios.post(
          `https://graph.facebook.com/${this.apiVersion}/${igId}/subscribed_apps`,
          null,
          {
            params: {
              access_token: p.access_token,
              subscribed_fields: ['messages', 'message_reactions'].join(','),
            },
          }
        );
        this.logger.log(
          `Proveedor suscribió IG Business ${p.instagram_business_account!.username}`
        );
      } catch (err: any) {
        this.logger.error(
          `Failed page subscription ${p.name}`,
          this.extractErr(err)
        );
      }
    }

    return { pages, subscriptions };
  }

  /** Subscribe a single Facebook Page to the webhook */
  async subscribePageWebhook(
    pageId: string,
    pageAccessToken: string
  ): Promise<PageSubscription> {
    try {
      const res = await axios.post<PageSubscription>(
        `https://graph.facebook.com/${this.apiVersion}/${pageId}/subscribed_apps`,
        null,
        {
          params: {
            access_token: pageAccessToken,
            subscribed_fields: [
              'messages',
              'messaging_postbacks',
              'messaging_optins',
              'messaging_referrals',
              'message_reactions',
              'messaging_handovers',
              'standby',
            ].join(','),
          },
        }
      );
      return res.data;
    } catch (err: any) {
      this.logger.error(
        'subscribePageWebhook error',
        this.extractErr(err)
      );
      throw new BadRequestException(
        `Failed to subscribe page webhook: ${this.extractErr(err)}`
      );
    }
  }

  /** Check app‑level subscriptions */
  async checkAppWebhook(): Promise<FacebookApiResponse> {
    try {
      const res = await axios.get<FacebookApiResponse>(
        `https://graph.facebook.com/${this.apiVersion}/${this.appId}/subscriptions`,
        {
          params: {
            access_token: `${this.appId}|${this.appSecret}`,
          },
        }
      );
      return res.data;
    } catch (err: any) {
      this.logger.error('checkAppWebhook error', this.extractErr(err));
      throw new BadRequestException('Failed to check app webhook');
    }
  }

  /** Check page‑level subscription status */
  async checkPageWebhook(
    pageId: string,
    pageAccessToken: string
  ): Promise<WebhookStatus> {
    try {
      const res = await axios.get<FacebookApiResponse>(
        `https://graph.facebook.com/${this.apiVersion}/${pageId}/subscribed_apps`,
        { params: { access_token: pageAccessToken } }
      );
      return { success: true, data: res.data.data || [] };
    } catch (err: any) {
      this.logger.error('checkPageWebhook error', this.extractErr(err));
      throw new BadRequestException('Failed to check page webhook');
    }
  }

  /** Debug all webhook setups */
  async debugWebhook(accessToken: string): Promise<DebugInfo> {
    const appWebhook = await this.checkAppWebhook();
    const pages     = await this.getUserPages(accessToken);
    const info: PageDebugInfo[] = [];

    for (const p of pages) {
      try {
        const ws = await this.checkPageWebhook(p.id, p.access_token);
        info.push({
          pageId: p.id,
          pageName: p.name,
          instagram: p.instagram_business_account!.username,
          webhookStatus: ws,
          hasWebhook: ws.data.length > 0,
        });
      } catch (err: any) {
        info.push({
          pageId: p.id,
          pageName: p.name,
          hasWebhook: false,
          error: this.extractErr(err),
        });
      }
    }

    return {
      appWebhook,
      pages: info,
      summary: {
        totalPages: pages.length,
        pagesWithWebhook: info.filter((x) => x.hasWebhook).length,
      },
    };
  }

  /** Process a single incoming message from webhook */
  public async processIncomingMessage(m: IncomingMessage): Promise<void> {
    this.logger.log(
      `Proveedor recibió mensaje del cliente ${m.sender.id}: ${m.message?.text ||
        '[media]'}`
    );
  }

  /** Handle the full webhook event */
  async handleWebhookEvent(evt: WebhookEvent): Promise<void> {
    if (!evt.entry) return;
    for (const e of evt.entry) {
      (e.messaging || []).forEach((m) => this.processIncomingMessage(m));
    }
  }

  private extractErr(err: any): string {
    if (axios.isAxiosError(err))
      return err.response?.data?.error?.message || err.message;
    return err.message || 'Unknown error';
  }
}
