import { Injectable } from '@nestjs/common';

interface ContextoPendiente {
  entidad: string;
  accion: 'create' | 'update';
  dataAcumulada: Record<string, any>;
  faltantes: string[];
  expiresAt: number;
}

@Injectable()
export class ContextoService {
  private contextos = new Map<string, ContextoPendiente>();

  get(userId: string): Omit<ContextoPendiente, 'expiresAt'> | null {
    const ctx = this.contextos.get(userId);
    if (!ctx) return null;

    if (ctx.expiresAt < Date.now()) {
      this.contextos.delete(userId);
      return null;
    }

    const { expiresAt, ...resto } = ctx;
    return resto;
  }

  set(userId: string, data: Omit<ContextoPendiente, 'expiresAt'>): void {
    this.contextos.set(userId, {
      ...data,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutos
    });
  }

  clear(userId: string): void {
    this.contextos.delete(userId);
  }
}