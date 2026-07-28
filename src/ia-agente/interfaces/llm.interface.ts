export interface ExtraccionLlm {
  status: 'ok' | 'incompleto' | 'no_reconocido';
  tipo: 'accion_entidad' | 'conversacion' | 'fuera_dominio';
  entidad: string;
  accion: string;
  data: Record<string, any>;
  campo?: string | null; // <--- AGREGAR
  referencias_texto?: Record<string, string>;
  id_directo?: number;
  faltantes?: string[];
  mensaje_usuario?: string | null;
  respuesta_directa?: string | null;
}

export interface RutaLlm {
  tipo: 'accion_entidad' | 'conversacion' | 'fuera_dominio' | 'navegacion';
  respuesta_directa: string | null;
  destino?: string;
}