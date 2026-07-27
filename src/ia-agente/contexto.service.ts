import { Injectable } from '@nestjs/common';

interface ContextoPendiente {
  entidad: string;
  accion: 'create' | 'update';
  dataAcumulada: Record<string, any>;
  faltantes: string[];
  expiresAt: number;
}

interface MensajeHistorial {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable()
export class ContextoService {
  private contextos = new Map<string, ContextoPendiente>();
  private historiales = new Map<string, MensajeHistorial[]>();
  private readonly MAX_HISTORIAL = 5;

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

  // ---------- Historial de conversación ----------
  getHistorial(userId: string): MensajeHistorial[] {
    return this.historiales.get(userId) ?? [];
  }

  agregarHistorial(userId: string, role: 'user' | 'assistant', content: string): void {
    const historial = this.historiales.get(userId) ?? [];
    historial.push({ role, content });
    while (historial.length > this.MAX_HISTORIAL * 2) {
      historial.shift(); // guarda 5 turnos (user+assistant = 10 mensajes)
    }
    this.historiales.set(userId, historial);
  }

  limpiarHistorial(userId: string): void {
    this.historiales.delete(userId);
  }
}