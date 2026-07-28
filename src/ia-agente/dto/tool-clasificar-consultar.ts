import { CATALOGO_ENTIDADES } from './catalogo-entidades';

export const CLASIFICAR_CONSULTAR_TOOL = {
  type: 'function',
  function: {
    name: 'procesar_solicitud',
    description: 'Clasifica la intencion del usuario y, si es una consulta de datos, extrae los parametros para consultarlos',
    parameters: {
      type: 'object',
      properties: {
        tipo: {
          type: 'string',
          enum: ['accion_entidad', 'conversacion', 'fuera_dominio', 'navegacion'],
          description: 'accion_entidad=consulta de datos del sistema; conversacion=charla trivial/saludos/hora/preguntas sobre la conversacion o pantalla actual; fuera_dominio=temas sin relacion con logistica; navegacion=ir/abrir/entrar a una pantalla'
        },
        respuesta_directa: {
          type: 'string',
          description: 'Respuesta en texto para tipo conversacion o fuera_dominio. Null para accion_entidad y navegacion.'
        },
        destino: {
          type: 'string',
          description: 'Pantalla que el usuario menciono, con sus propias palabras. Solo si tipo=navegacion.'
        },
        entidad: {
          type: 'string',
          enum: Object.keys(CATALOGO_ENTIDADES),
          description: `Entidad a consultar, solo si tipo=accion_entidad. Alias: ${Object.entries(CATALOGO_ENTIDADES).map(([k, v]) => `${k} (${v.alias.join(', ')})`).join('; ')}`
        },
        accion: {
          type: 'string',
          enum: ['get', 'count', 'sum', 'avg'],
          description: 'get=listar, count=contar, sum=total, avg=promedio. Solo si tipo=accion_entidad.'
        },
        filtros: {
          type: 'object',
          description: 'Filtros genericos, solo si tipo=accion_entidad: texto_busqueda, fecha_desde, fecha_hasta, monto_min, monto_max, estado, tipo, moneda, esta_activo',
          properties: {
            texto_busqueda: { type: 'string' },
            fecha_desde: { type: 'string', format: 'date' },
            fecha_hasta: { type: 'string', format: 'date' },
            monto_min: { type: 'number' },
            monto_max: { type: 'number' },
            estado: { type: 'string' },
            tipo: { type: 'string' },
            moneda: { type: 'string' },
            esta_activo: { type: 'boolean' }
          }
        },
        campo: {
          type: 'string',
          description: 'Campo numerico para sum/avg, solo si tipo=accion_entidad'
        },
        referencias_texto: {
          type: 'object',
          description: 'Nombres en texto libre para resolver a ID, solo si tipo=accion_entidad: { conductor: "nombre", cliente: "nombre", vehiculo: "placa", taller: "nombre", contrato: "codigo" }',
          additionalProperties: { type: 'string' }
        }
      },
      required: ['tipo']
    }
  }
} as const;