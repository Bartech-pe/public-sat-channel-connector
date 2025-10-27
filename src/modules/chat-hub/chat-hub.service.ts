import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError, AxiosInstance } from 'axios';
import WebSocket from 'ws';
import { InvalidateInboxCredentialDto } from 'src/common/dto/crm/credentials/invalidate-inbox-credentials.dto';
import { CreateChannelCitizenDto } from '../chatsat/dto/create-channel-citizen.dto';
import { CreateSurveyDto } from '../chatsat/dto/create-survey.dto';
import { HttpException } from '@nestjs/common';

@Injectable()
export class ChatHubService {
  private readonly logger = new Logger(ChatHubService.name);

  private client: AxiosInstance;
  constructor(private readonly configService: ConfigService) {
    this.client = axios.create({
      baseURL: this.configService.get<string>('CRM_API_URL') ?? '',
      timeout: 10000,
      headers: {
        Accept: 'application/json',
      },
    });
  }

  private handleErrorFromCRM(error: any)
  {
    if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        throw new HttpException(data, status);
    }
    throw new HttpException('Error al comunicarse con el CRM', 500);
  }

  async invalidateCredentials(payload: InvalidateInboxCredentialDto){
    try {
      await this.client.post("v1/inboxs/credentials/invalidate",payload)
      
    } catch (error) {
      this.logger.error(`❌ No se pudo encontrar un registro en la aplicacion externa`);
      
    }
  }

  async checkForAvailableAdvisors(): Promise<{ availableAdvisors: number }> {
    return new Promise(async (resolve, reject) => {
      try {
        const crmResponse = await this.client.get("v1/channel-room/check-available-advisors")
        resolve(crmResponse.data);
      } catch (error) {	
        this.handleErrorFromCRM(error)
      }
    });
  }

  async createCitizenInCrm(payload: CreateChannelCitizenDto): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const crmResponse = await this.client.post("v1/channel-citizen", payload)
        resolve(crmResponse.data);
      } catch (error) {	
        this.handleErrorFromCRM(error)
      }
    });
  }


  async sendMessagesHtmlFromChannelAttentionForChatsat(attentionId: number, authHeader: string): Promise<any> {
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
      this.handleErrorFromCRM(error)
    }
  }


  async SurveyCreate(payload: CreateSurveyDto, authHeader: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const crmResponse = await this.client.post("v1/channel-citizen/create-survey", payload,
          {
            headers: {
              Authorization: authHeader, 
            },
          }
        )
        resolve(crmResponse.data);
      } catch (error) {	
        this.handleErrorFromCRM(error)
      }
    });
  }
}
