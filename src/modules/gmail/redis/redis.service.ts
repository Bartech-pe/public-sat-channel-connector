import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: Number(process.env.REDIS_PORT) || 6379,
    });
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const data = JSON.stringify(value);
    if (ttlSeconds) {
      await this.client.set(key, data, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, data);
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      return data as unknown as T;
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  // 🔒 Lock distribuido compatible con todas las versiones de ioredis
  async acquireLock(
    key: string,
    ttlMs = 5000,
    retryMs = 200,
    maxRetries = 3,
  ): Promise<string | null> {
    const token = `${Date.now()}:${Math.random().toString(36).slice(2)}`;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      // ✅ Forma tradicional de usar NX PX compatible con todas las versiones
      const result = await this.client.set(key, token, 'PX', ttlMs, 'NX');

      if (result === 'OK') {
        this.logger.debug(`🔒 Lock adquirido en ${key}`);
        return token;
      }

      this.logger.warn(
        `⚠️ Lock ocupado (${attempt + 1}/${maxRetries}) en ${key}, reintentando...`,
      );
      await new Promise((res) => setTimeout(res, retryMs));
    }

    this.logger.error(
      `❌ No se pudo adquirir lock en ${key} después de ${maxRetries} intentos`,
    );
    return null;
  }

  async releaseLock(key: string, token: string): Promise<boolean> {
    const luaScript = `
      if redis.call("get",KEYS[1]) == ARGV[1] then
        return redis.call("del",KEYS[1])
      else
        return 0
      end
    `;
    const result = await this.client.eval(luaScript, 1, key, token);
    if (result === 1) {
      this.logger.debug(`🔓 Lock liberado en ${key}`);
      return true;
    } else {
      this.logger.warn(`⚠️ No se pudo liberar lock en ${key} (token no coincide)`);
      return false;
    }
  }
}
