import { CATALOGO_ENTIDADES } from './catalogo-entidades';

export const CONSULTAR_DATOS_TOOL = {
  type: 'function',
  function: {
    name: 'consultar_datos',
    description: 'Consulta datos del sistema HeltasTruck',
    parameters: {
      type: 'object',
      properties: {
        entidad: {
          type: 'string',
          enum: Object.keys(CATALOGO_ENTIDADES),
          description: `Entidad a consultar. Alias: ${Object.entries(CATALOGO_ENTIDADES).map(([k, v]) => `${k} (${v.alias.join(', ')})`).join('; ')}`
        },
        accion: {
          type: 'string',
          enum: ['get', 'count', 'sum', 'avg'],
          description: 'get=listar, count=contar, sum=total, avg=promedio'
        },
        filtros: {
          type: 'object',
          description: 'Filtros genericos: texto_busqueda, fecha_desde, fecha_hasta, monto_min, monto_max, estado, tipo, moneda, esta_activo, relaciones',
          properties: {
            texto_busqueda: { type: 'string' },
            fecha_desde: { type: 'string', format: 'date' },
            fecha_hasta: { type: 'string', format: 'date' },
            monto_min: { type: 'number' },
            monto_max: { type: 'number' },
            estado: { type: 'string' },
            tipo: { type: 'string' },
            moneda: { type: 'string' },
            esta_activo: { type: 'boolean' },
            relaciones: { 
              type: 'object',
              description: 'Cualquier foreign key: { conductor: 123, cliente: 456, vehiculo: 789 }',
              additionalProperties: { type: 'number' }
            }
          }
        },
        campo: { 
          type: 'string', 
          description: 'Campo numerico para sum/avg' 
        }
      },
      required: ['entidad', 'accion']
    }
  }
} as const;