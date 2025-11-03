/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { google } from 'googleapis';
import axios, { AxiosInstance } from 'axios';
import { RedisService } from './redis/redis.service';
import { envConfig } from 'config/env';

/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
@Injectable()
export class AuthGmailService {
  private readonly logger = new Logger(AuthGmailService.name);
  private client: AxiosInstance;

  constructor(private redisService: RedisService) {
    this.client = axios.create({
      baseURL: envConfig.crmApiUrl,
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

    /* redisService.clearAll(); */
  }

  private createOAuthClient(
    clientId: string,
    clientSecret: string,
    redirectUri: string,
  ) {
    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  }

  async setClientConfig(
    clientId: string,
    clientSecret: string,
    redirectUri: string,
    email: string,
  ) {
    await this.redisService.set(`gmail:${clientId}:${email}:client_config`, {
      clientId,
      clientSecret,
      redirectUri,
      email,
    });
  }

  async setClientEmail(
    clientId: string,
    clientSecret: string,
    redirectUri: string,
    email: string,
  ) {
    await this.redisService.set(`gmail:${email}:client_id`, {
      clientId,
      clientSecret,
      redirectUri,
    });
  }

  async setClientCredentials(
    clientId: string,
    email: string,
    credentials: {
      refresh_token: string;
      access_token: string;
      expiry_date: number;
    },
  ) {
    await this.redisService.set(
      `gmail:${clientId}:${email}:credentials`,
      credentials,
    );
  }

  getClientCredentials(clientId: string, email: string) {
    return this.redisService.get<{
      refresh_token: string;
      access_token: string;
      expiry_date: number;
    }>(`gmail:${clientId}:${email}:credentials`);
  }

  getClientConfig(clientId: string, email: string) {
    return this.redisService.get<{
      clientId: string;
      clientSecret: string;
      redirectUri: string;
      email: string;
    }>(`gmail:${clientId}:${email}:client_config`);
  }

  getClientEmail(email: string) {
    return this.redisService.get<{
      clientId: string;
      clientSecret: string;
      redirectUri: string;
    }>(`gmail:${email}:client_id`);
  }

  async getOAuthClient(clientId: string, email: string) {
    // Obtener configuración del cliente
    const config = await this.getClientConfig(clientId, email);
    if (!config) {
      this.logger.error(
        `getOAuthClient: Configuración para clientId "${clientId}" no encontrada`,
      );
      throw new InternalServerErrorException(
        `No se encontró configuración de OAuth2 para ${clientId}`,
      );
    }

    const { clientSecret, redirectUri } = config;

    // Obtener credenciales guardadas
    const creds = await this.getClientCredentials(clientId, email);
    if (!creds) {
      this.logger.warn(`⚠️ No hay credenciales guardadas para ${email}`);
      throw new UnauthorizedException(
        `No hay credenciales guardadas para ${email}`,
      );
    }

    // Crear cliente OAuth2
    const oauth2Client = await this.createOAuthClient(
      clientId,
      clientSecret,
      redirectUri,
    );
    oauth2Client.setCredentials(creds);

    // Verificar expiración
    const isExpired =
      !creds.expiry_date || Date.now() >= creds.expiry_date - 60000; // margen de 1 min

    if (isExpired && creds.refresh_token) {
      this.logger.warn(`Token expirado. Renovando token para ${email}...`);
      try {
        const { credentials: newCreds } =
          await oauth2Client.refreshAccessToken();

        // Guardamos los nuevos tokens en Redis
        await this.setClientCredentials(clientId, email, {
          ...creds,
          access_token: newCreds.access_token!,
          expiry_date: newCreds.expiry_date || Date.now() + 3500 * 1000,
        });

        // Actualizamos las credenciales activas
        oauth2Client.setCredentials(newCreds);
        this.logger.log(`Token renovado automáticamente para ${email}`);
      } catch (error) {
        this.logger.error(
          `Error al renovar token para ${email}: ${error.message}`,
        );
        throw new UnauthorizedException(
          `No se pudo renovar el token de ${email}`,
        );
      }
    }

    this.logger.log(`Cliente OAuth2 activo para ${email}`);
    return oauth2Client;
  }

  async setCode(code: string) {
    return this.client.get('v1/mail-configuration/createCredential', {
      params: { code },
    });
  }

  async generateAuthUrl(
    clientId: string,
    clientSecret: string,
    redirectUri: string,
    email: string,
    state: string,
  ) {
    const oauth2Client = await this.createOAuthClient(
      clientId,
      clientSecret,
      redirectUri,
    );

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      login_hint: email,
      scope: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
      state,
    });

    await this.setClientConfig(clientId, clientSecret, redirectUri, email);

    await this.setClientEmail(clientId, clientSecret, redirectUri, email);

    return { authUrl, email };
  }

  isExpired(expiryDate?: number): boolean {
    if (!expiryDate) return true;
    return Date.now() >= expiryDate - 5000;
  }

  async exchangeCodeForTokens(code: string, clientId: string, email: string) {
    try {
      const config = await this.getClientConfig(clientId, email);

      if (!config) {
        this.logger.error(
          `exchangeCodeForTokens: Configuración para clientId  "${clientId}" no encontrada`,
        );
        throw new InternalServerErrorException(
          `No se encontró configuración de OAuth2 para ${clientId}`,
        );
      }

      const { clientSecret, redirectUri } = config;

      // Crear cliente OAuth2
      const oauth2Client = await this.createOAuthClient(
        clientId,
        clientSecret,
        redirectUri,
      );

      const { tokens } = await oauth2Client.getToken(code);

      oauth2Client.setCredentials(tokens);

      const credentials = {
        access_token: tokens.access_token!,
        refresh_token: tokens.refresh_token!,
        expiry_date: Date.now() + 3500 * 1000, // aprox 1 hora
      };

      await this.setClientCredentials(clientId, email, credentials);

      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });

      const userInfo = await oauth2.userinfo.get();
      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        email: userInfo.data.email,
        authenticated: true,
      };
    } catch (error) {
      throw new UnauthorizedException(
        `Token exchange failed: ${error.message}`,
      );
    }
  }
}
