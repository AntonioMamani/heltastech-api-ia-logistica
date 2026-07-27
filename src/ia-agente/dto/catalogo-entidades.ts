export class EntidadConfig {
  constructor(
    public readonly endpoint: string,
    public readonly idField: string,
    public readonly scoped: boolean,
    public readonly referencias: string[] = [],
    public readonly camposNumericos: string[] = [],
    public readonly campoEstado: string | null = null,
    public readonly estadosValidos: string[] = [],
  ) {}

  tieneCampoNumerico(campo: string): boolean {
    return this.camposNumericos.includes(campo);
  }

  esEstadoValido(estado: string): boolean {
    return this.estadosValidos.length === 0 || this.estadosValidos.includes(estado);
  }

  requiereResolucion(campo: string): boolean {
    return this.referencias.includes(campo);
  }
}

export const CATALOGO_ENTIDADES: Record<string, EntidadConfig> = {
  // con id_empresa
  clientes: new EntidadConfig('clientes', 'id_cliente', true),
  conductores: new EntidadConfig('conductores', 'id_conductor', true),
  vehiculos: new EntidadConfig('vehiculos', 'id_unidad', true),
  vehiculos_apoyo: new EntidadConfig('vehiculos_apoyo', 'id_vehiculo_apoyo', true),
  unidades_arrastre: new EntidadConfig('unidades_arrastre', 'id_unidad_arrastre', true),
  viajes: new EntidadConfig('viajes', 'id_viaje', true, ['cliente', 'conductor'], ['distancia'], 'estado_viaje', ['PROGRAMADO', 'ASIGNADO', 'RUTA_PROGRAMADA', 'FINALIZADO', 'CANCELADO']),
  contratos: new EntidadConfig('contratos', 'id_contrato', true, ['cliente'], ['costo_total']),
  cotizaciones: new EntidadConfig('cotizaciones', 'id_cotizacion', true, ['cliente'], ['costo_total'], 'estado_cotizacion', ['PENDIENTE', 'COTIZADA', 'ACEPTADA', 'RECHAZADA']),
  pagos: new EntidadConfig('pagos', 'id_pago', true, [], ['monto_pagado'], 'estado_pago', ['PENDIENTE', 'PARCIAL', 'COMPLETADO']),
  mantenimiento: new EntidadConfig('mantenimiento', 'id_mantenimiento', true, [], ['costo_total'], 'estado_ot', ['PENDIENTE', 'EN_PROCESO', 'CERRADA', 'CANCELADA']),
  mantenimiento_arrastre: new EntidadConfig('mantenimiento_arrastre', 'id_mantenimiento_arrastre', true, [], [], 'estado_ot', ['PENDIENTE', 'EN_PROCESO', 'CERRADA', 'CANCELADA']),
  cuentas_por_cobrar: new EntidadConfig('cuentas_por_cobrar', 'id_cuenta', true),
  sistemas_vehiculo: new EntidadConfig('sistemas_vehiculo', 'id_sistema', true),
  componentes_vehiculo_insumos: new EntidadConfig('componentes_vehiculo_insumos', 'id_componente', true),
  movimientos: new EntidadConfig('movimientos', 'id_movimiento', true),
  asignacion_viaticos: new EntidadConfig('asignacion_viaticos', 'id_asignacion', true),
  correlativo_documentos: new EntidadConfig('correlativo_documentos', 'id', true),
  formato_impresion_correlativo: new EntidadConfig('formato_impresion_correlativo', 'id_formato', true),
  planes_empresas: new EntidadConfig('planes_empresas', 'id_plan_empresa', true),
  usuario: new EntidadConfig('usuario', 'id', true),
  documentos_generales: new EntidadConfig('documentos_generales', 'id_documento_general', true),
  talleres: new EntidadConfig('talleres', 'id_taller', true),

  // sin id_empresa
  ubicaciones: new EntidadConfig('ubicaciones', 'id_ubicacion', false),
  tablas_parametricas: new EntidadConfig('tablas_parametricas', 'id_tabla_parametrica', false),
  claves_valores: new EntidadConfig('claves_valores', 'id', false),
  feriados: new EntidadConfig('feriados', 'id_feriado', false),
  tipos_cambio: new EntidadConfig('tipos_cambio', 'id_tipo_cambio', false),
  tipo_cambio_referencial: new EntidadConfig('tipo_cambio_referencial', 'id_tipo_cambio_ref', false),
  planes_subscripciones: new EntidadConfig('planes_subscripciones', 'id_plan', false),
  cargas: new EntidadConfig('cargas', 'id_carga', false, ['viaje']),
  cargas_detalles: new EntidadConfig('cargas_detalles', 'id_detalle', false),
  incidencias: new EntidadConfig('incidencias', 'id_incidencia', false, ['conductor', 'viaje'], ['costo_estimado'], 'estado_incidencia', ['Reportada', 'En revisión', 'En reparación', 'Resuelta', 'Cancelada']),
  estados_unidades: new EntidadConfig('estados_unidades', 'id_estados_unidad', false),
  detalle_gasto_viaje: new EntidadConfig('detalle_gasto_viaje', 'id_detalle', false, ['viaje'], ['monto', 'litros_gastados']),
  rutas: new EntidadConfig('rutas', 'id_ruta', false, ['viaje'], [], 'estado', ['PENDIENTE', 'EN_RUTA', 'FINALIZADO', 'CANCELADO']),
  componentes_mantenimiento: new EntidadConfig('componentes_mantenimiento', 'id', false),
  componentes_mantenimiento_arrastre: new EntidadConfig('componentes_mantenimiento_arrastre', 'id', false),
  notificaciones: new EntidadConfig('notificaciones', 'id_notificacion', false),
  salarios_conductores: new EntidadConfig('salarios_conductores', 'id_salario', false, ['conductor']),
  catalogos_precios: new EntidadConfig('catalogos_precios', 'id_catalogo', false),
};