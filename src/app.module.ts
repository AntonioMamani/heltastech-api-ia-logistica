import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { IaAgenteModule } from './ia-agente/ia-agente.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    IaAgenteModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}