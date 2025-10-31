import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { InvalidateInboxCredentialDto } from 'src/common/dto/crm/credentials/invalidate-inbox-credentials.dto';
import { CreateChannelCitizenDto } from '../chatsat/dto/create-channel-citizen.dto';
import { CreateSurveyDto } from '../chatsat/dto/create-survey.dto';
import { HttpException } from '@nestjs/common';
import { envConfig } from 'config/env';

@Injectable()
export class ChatHubService {
  private readonly logger = new Logger(ChatHubService.name);

  private client: AxiosInstance;
  constructor() {
    this.client = axios.create({
      baseURL: envConfig.crmApiUrl,
      timeout: 10000,
      headers: {
        Accept: 'application/json',
      },
    });
  }

  private handleErrorFromCRM(error: any): HttpException {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      return new HttpException(data, status);
    }
    return new HttpException('Error al comunicarse con el CRM', 500);
  }

  async invalidateCredentials(payload: InvalidateInboxCredentialDto) {
    try {
      await this.client.post('v1/inboxs/credentials/invalidate', payload);
    } catch (error) {
      this.logger.error(
        `No se pudo encontrar un registro en la aplicacion externa`,
      );
      this.logger.error(error);
    }
  }

  async checkForAvailableAdvisors(): Promise<{ availableAdvisors: number }> {
    try {
      const crmResponse = await this.client.get(
        'v1/channel-room/check-available-advisors',
      );
      return crmResponse.data;
    } catch (error) {
      this.logger.error('Error checking available advisors:', error);
      throw this.handleErrorFromCRM(error);
    }
  }

  async getAutomaticMessages(authHeader: string): Promise<string[]> {
    try {
      const crmResponse = await this.client.get(
        `v1/automatic-messages/descriptions-by-channel/${3}`,
        {
          headers: {
            Authorization: authHeader,
          },
        },
      );
      return crmResponse.data;
    } catch (error) {
      this.logger.error('Error getting automatic messages:', error);
      throw this.handleErrorFromCRM(error);
    }
  }

  async createCitizenInCrm(payload: CreateChannelCitizenDto): Promise<any> {
    try {
      this.logger.debug('entra');
      const crmResponse = await this.client.post('v1/channel-citizen', payload);
      return crmResponse.data;
    } catch (error) {
      this.logger.error('Error creating citizen in CRM:', error);
      throw this.handleErrorFromCRM(error);
    }
  }

  async sendMessagesHtmlFromChannelAttentionForChatsat(
    attentionId: number,
    authHeader: string,
  ): Promise<any> {
    try {
      const crmResponse = await this.client.post(
        `v1/channel-room/assistances/${attentionId}/chatsat/send-to-email`,
        {},
        {
          headers: {
            Authorization: authHeader,
          },
        },
      );
      return crmResponse.data;
    } catch (error) {
      this.logger.error('Error sending messages HTML:', error);
      throw this.handleErrorFromCRM(error);
    }
  }

  async SurveyCreate(
    payload: CreateSurveyDto,
    authHeader: string,
  ): Promise<any> {
    try {
      const crmResponse = await this.client.post(
        'v1/channel-citizen/create-survey',
        payload,
        {
          headers: {
            Authorization: authHeader,
          },
        },
      );
      this.logger.debug(payload);
      this.logger.debug(authHeader);
      this.logger.debug(crmResponse);
      return crmResponse.data;
    } catch (error) {
      this.logger.error('Error creating survey:', error);
      throw this.handleErrorFromCRM(error);
    }
  }
}
