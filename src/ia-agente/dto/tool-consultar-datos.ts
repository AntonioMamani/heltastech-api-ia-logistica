
export const CONSULTAR_DATOS_TOOL = {
  type: 'function',
  function: {
    name: 'consultar_datos',
    description: 'Consulta cualquier tabla del sistema con filtros dinámicos.',
    parameters: {
      type: 'object',
      properties: {
        tabla: { type: 'string', description: 'Nombre exacto de la tabla' },
        operacion: { type: 'string', enum: ['get', 'count', 'sum', 'avg'] },
        campo: { type: 'string', description: 'Columna numérica, solo para sum/avg' },
        filtros: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              columna: { type: 'string' },
              valor: { type: 'string' },
              operador: { type: 'string', enum: ['eq', 'contains', 'gt', 'lt', 'gte', 'lte'] },
            },
            required: ['columna', 'valor'],
          },
        },
        id_directo: { type: 'number' },
      },
      required: ['tabla', 'operacion'],
    },
  },
};