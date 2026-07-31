import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.provider';

interface ContextoPendiente {
  entidad: string;
  accion: 'create' | 'update';
  dataAcumulada: Record<string, any>;
  faltantes: string[];
}

interface MensajeHistorial {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable()
export class ContextoService {
  private readonly MAX_HISTORIAL = 5;
  private readonly TTL_CONTEXTO = 5 * 60; // segundos

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) { }

  async get(userId: string): Promise<Omit<ContextoPendiente, 'expiresAt'> | null> {
    const raw = await this.redis.get(`ctx:${userId}`);
    return raw ? JSON.parse(raw) : null;
  }

  async set(userId: string, data: Omit<ContextoPendiente, 'expiresAt'>): Promise<void> {
    await this.redis.set(`ctx:${userId}`, JSON.stringify(data), 'EX', this.TTL_CONTEXTO);
  }

  async clear(userId: string): Promise<void> {
    await this.redis.del(`ctx:${userId}`);
  }

  // ---------- Historial de conversación ----------
  async getHistorial(userId: string): Promise<MensajeHistorial[]> {
    const raw = await this.redis.get(`hist:${userId}`);
    return raw ? JSON.parse(raw) : [];
  }

  async agregarHistorial(userId: string, role: 'user' | 'assistant', content: string): Promise<void> {
    const historial = await this.getHistorial(userId);
    historial.push({ role, content });
    while (historial.length > this.MAX_HISTORIAL * 2) {
      historial.shift();
    }
    await this.redis.set(`hist:${userId}`, JSON.stringify(historial), 'EX', this.TTL_CONTEXTO);
  }

  async limpiarHistorial(userId: string): Promise<void> {
    await this.redis.del(`hist:${userId}`);
  }

  // ---------- Vista y último resultado ----------
  async getUltimaVista(userId: string): Promise<string | null> {
    return await this.redis.get(`vista:${userId}`);
  }

  async setUltimaVista(userId: string, vista: string): Promise<void> {
    await this.redis.set(`vista:${userId}`, vista, 'EX', this.TTL_CONTEXTO);
  }

  async getUltimoResultado(userId: string): Promise<{ entidad: string; ids: number[] } | null> {
    const raw = await this.redis.get(`ultres:${userId}`);
    return raw ? JSON.parse(raw) : null;
  }

  async setUltimoResultado(userId: string, entidad: string, ids: number[]): Promise<void> {
    await this.redis.set(`ultres:${userId}`, JSON.stringify({ entidad, ids }), 'EX', this.TTL_CONTEXTO);
  }
}