import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';
const logger = new Logger('RedisProvider');

export const RedisProvider = {
  provide: REDIS_CLIENT,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const client = new Redis({
      host: config.get<string>('REDIS_HOST', 'localhost'),
      port: config.get<number>('REDIS_PORT', 6379),
      password: config.get<string>('REDIS_PASSWORD'),
      lazyConnect: false,
      retryStrategy: (times: number) => Math.min(times * 200, 2000),
    });

    client.on('error', (err) => {
      logger.error(`Error de conexion a Redis: ${err.message}`);
    });

    return client;
  },
};