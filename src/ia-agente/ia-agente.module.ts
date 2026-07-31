import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ContextoService } from './contexto.service';
import { IaAgenteController } from './ia-agente.controller';
import { IaAgenteService } from './ia-agente.service';
import { RedisProvider } from './redis.provider';

@Module({
  imports: [HttpModule],
  controllers: [IaAgenteController],
  providers: [
    IaAgenteService,
    ContextoService,
    RedisProvider,
  ],
})
export class IaAgenteModule { }