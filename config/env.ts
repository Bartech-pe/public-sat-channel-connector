import * as dotenv from 'dotenv';
import * as Joi from 'joi';

// Cargar .env
dotenv.config();

// Validación con Joi
const envSchema = Joi.object({
  // # App Environment
  NODE_ENV: Joi.string().valid('development', 'production').required(),
  PORT: Joi.number().required(),
  CRM_API_URL: Joi.string().required(),
  BASE_URL: Joi.string().required(),
  VERIFY_TOKEN: Joi.string().required(),
  // # Configuración redis
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().required(),
  // # Configuración de Telegram
  TELEGRAM_API_ID: Joi.string().required(),
  TELEGRAM_API_HASH: Joi.string().required(),
  // # Configuración de instagram
  INSTAGRAM_APP_ID: Joi.string().required(),
  INSTAGRAM_APP_NAME: Joi.string().required(),
  // # Configuración de facebook
  FACEBOOK_APP_ID: Joi.string().required(),
  FACEBOOK_APP_SECRET: Joi.string().required(),
}).unknown();

const { error, value: ev } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Error de configuración del entorno: ${error.message}`);
}

export const envConfig = {
  isDev: ev.NODE_ENV === 'development',
  port: ev.PORT,
  crmApiUrl: ev.CRM_API_URL,
  verifyToken: ev.VERIFY_TOKEN,
  baseUrl: ev.BASE_URL,
};

export const redisConfig = {
  port: ev.REDIS_PORT,
  host: ev.REDIS_HOST,
};

export const channelConfig = {
  telegramId: ev.TELEGRAM_API_ID,
  telegramHash: ev.TELEGRAM_API_HASH,
  igAppName: ev.INSTAGRAM_APP_NAME,
  igVerifyToken: ev.INSTAGRAM_VERIFY_TOKEN,
  fbAppId: ev.FACEBOOK_APP_ID,
  fbAppSecret: ev.FACEBOOK_APP_SECRET,
};
