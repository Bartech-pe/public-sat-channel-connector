  /* eslint-disable @typescript-eslint/no-unsafe-return */
  import {
    Injectable,
    InternalServerErrorException,
    Logger,
    UnauthorizedException,
  } from '@nestjs/common';
  import { google } from 'googleapis';
  import { ConfigService } from '@nestjs/config';
  import axios, { AxiosInstance } from 'axios';
import { RedisService } from './redis/redis.service';

  /* eslint-disable prettier/prettier */
  /* eslint-disable @typescript-eslint/no-unsafe-member-access */
  /* eslint-disable @typescript-eslint/no-unsafe-assignment */
  /* eslint-disable @typescript-eslint/no-unsafe-call */
  @Injectable()
  export class AuthGmailService {
    private readonly logger = new Logger(AuthGmailService.name);
    private oauth2Client: any;
      private client: AxiosInstance;

    constructor(
      private redisService: RedisService,
      private readonly configService: ConfigService
    ) {
      this.client = axios.create({
        baseURL: this.configService.get<string>('REDIRECT_URL'),
        timeout: 10000,
        headers: {
          Accept: 'application/json',
        },
      });

      this.client.interceptors.response.use(
        (response) => response,
        (error) => {
          const message =
            error.response?.data?.message ||
            error.message ||
            'Error desconocido en GmailChannelService';

          console.error(`Error Axios: ${message}`);

          return Promise.resolve({
            error: true,
            message: `Error Axios: ${message}`,
            status: error.response?.status || 500,
          });
        },
      );
    }
    async setOauthClient(clientId: string, clientSecret: string) {
      const redirect = `${this.configService.get<string>('REDIRECT_URL')}v1/mail-configuration/createCredential`;
      // solo crea el cliente y guarda configuración, NO intercambia tokens
      this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirect);
      await this.redisService.set('gmail:client_config', { clientId, clientSecret, redirect });
      this.logger.log('OAuth client configurado y guardado en Redis');
    }

    async restoreOauthClient() {
      if (this.oauth2Client) return this.oauth2Client;

      const config = await this.redisService.get('gmail:client_config');
      if (!config) {
        this.logger.warn('No hay config OAuth en Redis');
        return null;
      }

      this.oauth2Client = new google.auth.OAuth2(config.clientId, config.clientSecret, config.redirect);

      const creds = await this.redisService.get('gmail:credentials'); // { refresh_token, access_token, expiry_date }
      if (creds) {
        this.oauth2Client.setCredentials(creds);
        this.logger.log('🔄 Cliente OAuth restaurado desde Redis con credenciales');
      } else {
        this.logger.log('Cliente OAuth restaurado sin credenciales (esperando refresh token)');
      }

      return this.oauth2Client;
    }

    async GetAuthClient() {
      if (!this.oauth2Client) {
        await this.restoreOauthClient();
      }
      return this.oauth2Client;
    }

    
    async setCode(code: string) {
      return this.client.get('v1/mail-configuration/createCredential', {
        params: { code },
      });
    }
    authenticateWithCredentials(email: string) {
      try {
        const authUrl = this.oauth2Client.generateAuthUrl({
          access_type: 'offline',
          scope: [
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.send',
            'https://www.googleapis.com/auth/gmail.modify',
            'https://www.googleapis.com/auth/userinfo.email',
          ],
          login_hint: email,
          prompt: 'consent',
        });
        return {
          authUrl,
          email,
          message: 'Redirect user to this URL to complete authentication',
        };
      } catch (error) {
        throw new UnauthorizedException(
          `Authentication failed: ${error.message}`,
        );
      }
    }
    async RefrestToken(refreshToken: string) {
      if (!refreshToken) {
        throw new InternalServerErrorException('No hay refresh token disponible');
      }

      const oauth2Client = await this.GetAuthClient();
      if (!oauth2Client) throw new InternalServerErrorException('OAuth client no configurado');

      const lockKey = 'lock:gmail:refresh';
      const lock = await this.redisService.acquireLock(lockKey, 5000); 
      try {
        oauth2Client.setCredentials({ refresh_token: refreshToken });
        try {
          const tokenInfo = await oauth2Client.getAccessToken(); 
          if (!tokenInfo?.token) throw new Error('No se obtuvo access token');

          const credentials = {
            refresh_token: refreshToken,
            access_token: tokenInfo.token,
            expiry_date: Date.now() + 3500 * 1000,
          };
          await this.redisService.set('gmail:credentials', credentials);

          return {
            accessToken: tokenInfo.token,
            refreshToken,
            authenticated: true,
          };
        } catch (err) {
          const msg = (err?.response?.data || err?.message || '').toString();
          if (msg.includes('invalid_grant') || msg.includes('Token has been expired or revoked')) {
            this.logger.error('Refresh token revocado/expirado (invalid_grant)');
            await this.redisService.set('gmail:credentials:invalid', true);
            throw new UnauthorizedException('refresh_token_revoked');
          }
          throw err;
        }
      } finally {
        if (lock) await this.redisService.releaseLock(lockKey, lock);
      }
    }

    isExpired(expiryDate?: number): boolean {
    if (!expiryDate) return true; 
    return Date.now() >= expiryDate - 5000; 
  }
    async authenticateWithTokens(accessToken: string, refreshToken?: string) {
      try {
        this.oauth2Client.setCredentials({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        const tokenInfo = await this.oauth2Client.getAccessToken();
        if (!tokenInfo.token) {
          throw new Error('Invalid token');
        }
        return {
          accessToken: tokenInfo.token,
          refreshToken,
          authenticated: true,
        };
      } catch (error) {
        throw new UnauthorizedException(
          `Token authentication failed: ${error.message}`,
        );
      }
    }
      async exchangeCodeForTokens(code: string) {
      try {
        const { tokens } = await this.oauth2Client.getToken(code);
        this.oauth2Client.setCredentials(tokens);
        const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
        const userInfo = await oauth2.userinfo.get();
        return {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          email: userInfo.data.email,
          authenticated: true,
        };
      } catch (error) {
        throw new UnauthorizedException(`Token exchange failed: ${error.message}`);
      }
    }
  }
