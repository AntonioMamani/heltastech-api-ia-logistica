import { Body, Controller, Headers, Post } from '@nestjs/common';
import { decode } from 'jsonwebtoken';
import { ChatAgenteDto } from './dto/chat-agente.dto';
import { IaAgenteService } from './ia-agente.service';

@Controller('ia-agente')
export class IaAgenteController {
  constructor(private readonly iaAgenteService: IaAgenteService) {}

  @Post('chat')
  async chat(@Body() dto: ChatAgenteDto, @Headers('authorization') token: string) {
    if (!token) {
      return { mensaje: 'Falta el token de autorización.' };
    }

    const payload: any = decode(token.replace('Bearer ', ''));
    const rol = payload?.rol ?? 'usuario';
    const userId = payload?.sub;

    if (!userId) {
      return { mensaje: 'No se pudo identificar al usuario.' };
    }

    return this.iaAgenteService.procesarMensaje(dto.mensaje, token, rol, userId);
  }
}