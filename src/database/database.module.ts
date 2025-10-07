import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Dialect } from 'sequelize';

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        dialect: configService.getOrThrow<Dialect>('DB_DIALECT'),
        host: configService.getOrThrow<string>('DB_HOST'),
        port: parseInt(configService.getOrThrow('DB_PORT'), 10),
        username: configService.getOrThrow<string>('DB_USER'),
        password: configService.getOrThrow<string>('DB_PASSWORD'),
        database: configService.getOrThrow<string>('DB_NAME'),
        autoLoadModels: true,
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        logging:
          configService.get('NODE_ENV') !== 'production' ? console.log : false,
        retryAttempts: 5,
        retryDelay: 3000,
        define: {
          timestamps: true,
          underscored: false,
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
