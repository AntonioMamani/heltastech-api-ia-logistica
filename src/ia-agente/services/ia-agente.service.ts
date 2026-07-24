import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { ExtraccionLlm, RutaLlm } from '../interfaces/llm.interface';

@Injectable()
export class LlmClientService {
  private readonly logger = new Logger(LlmClientService.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) { }

  async llamarLlmRuta(messages: any[]): Promise<RutaLlm> {
    const texto = await this.llamarLlmTexto(messages, 0.1);
    try {
      const limpio = texto.replace(/```json|```/g, '').trim();
      return JSON.parse(limpio);
    } catch {
      this.logger.warn('El router no devolvió JSON válido: ' + texto);
      return { tipo: 'accion_entidad', respuesta_directa: null }; // fail-safe: si el router falla, dejamos pasar a la Etapa 1 normal
    }
  }

  async llamarLlmJson(messages: any[]): Promise<ExtraccionLlm> {
    const texto = await this.llamarLlmTexto(messages, 0.1);
    try {
      const limpio = texto.replace(/```json|```/g, '').trim();
      return JSON.parse(limpio);
    } catch {
      this.logger.warn('El LLM no devolvió JSON válido: ' + texto);
      return {
        status: 'no_reconocido',
        tipo: 'fuera_dominio',
        entidad: '',
        accion: 'get',
        data: {},
        respuesta_directa: 'No pude procesar tu solicitud, intentá reformularla.',
      };
    }
  }

  async llamarLlmTexto(messages: any[], temperature = 0.4): Promise<string> {
    const response = await firstValueFrom(
      this.http.post(
        this.config.get('GROQ_URL')!,
        {
          model: this.config.get('GROQ_MODEL'),
          messages,
          temperature,
        },
        {
          headers: {
            Authorization: `Bearer ${this.config.get('GROQ_API_KEY')}`,
            'Content-Type': 'application/json',
          },
        },
      ),
    );
    return response.data.choices[0].message.content;
  }
}