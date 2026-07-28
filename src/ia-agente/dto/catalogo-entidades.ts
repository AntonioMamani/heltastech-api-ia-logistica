export class EntidadConfig {
  constructor(
    public readonly endpoint: string,
    public readonly idField: string,
    public readonly scoped: boolean,
    public readonly referencias: string[] = [],
    public readonly camposNumericos: string[] = [],
    public readonly campoEstado: string | null = null,
    public readonly estadosValidos: string[] = [],
    public readonly campoFecha: string | null = null,
    public readonly camposAgrupables: string[] = [],
    public readonly alias: string[] = [],
  ) { }

  tieneCampoNumerico(campo: string): boolean {
    return this.camposNumericos.includes(campo);
  }

  esEstadoValido(estado: string): boolean {
    return this.estadosValidos.length === 0 || this.estadosValidos.includes(estado);
  }

  requiereResolucion(campo: string): boolean {
    return this.referencias.includes(campo);
  }

  esAgrupableValido(campo: string): boolean {
    return this.camposAgrupables.includes(campo);
  }
}

export const CATALOGO_ENTIDADES: Record<string, EntidadConfig> = {
  clientes: new EntidadConfig('clientes', 'id_cliente', true, [], [], null, [], 'fecha_registro', ['tipo_cliente'], ['clientes']),
  conductores: new EntidadConfig('conductores', 'id_conductor', true, [], [], null, [], 'fecha_registro', ['categoria'], ['conductores', 'choferes']),
  vehiculos: new EntidadConfig('vehiculos', 'id_unidad', true, [], [], null, [], 'fecha_registro', ['tipo_unidad', 'marca'], ['vehiculos', 'unidades', 'camiones']),
  vehiculos_apoyo: new EntidadConfig('vehiculos_apoyo', 'id_vehiculo_apoyo', true, [], [], null, [], 'fecha_registro', ['tipo_vehiculo'], ['vehiculos de apoyo']),
  unidades_arrastre: new EntidadConfig('unidades_arrastre', 'id_unidad_arrastre', true, [], [], null, [], 'fecha_registro', ['tipo_unidad_arrastre'], ['unidades de arrastre', 'remolques', 'semirremolques']),
  viajes: new EntidadConfig('viajes', 'id_viaje', true, ['cliente', 'conductor'], ['distancia'], 'estado_viaje', ['PROGRAMADO', 'ASIGNADO', 'RUTA_PROGRAMADA', 'FINALIZADO', 'CANCELADO'], 'fecha_programada', ['id_conductor', 'id_unidad', 'estado_viaje'], ['viajes', 'fletes']),
  contratos: new EntidadConfig('contratos', 'id_contrato', true, ['cliente'], ['costo_total'], null, [], 'fecha_inicio', ['id_cliente', 'tipo_flete'], ['contratos']),
  cotizaciones: new EntidadConfig('cotizaciones', 'id_cotizacion', true, ['cliente'], ['costo_total'], 'estado_cotizacion', ['PENDIENTE', 'COTIZADA', 'ACEPTADA', 'RECHAZADA'], 'fecha_cotizacion', ['id_cliente', 'estado_cotizacion'], ['cotizaciones']),
  pagos: new EntidadConfig('pagos', 'id_pago', true, ['contrato'], ['monto_pagado'], 'estado_pago', ['PENDIENTE', 'PARCIAL', 'COMPLETADO'], 'fecha_pago', ['id_contrato', 'estado_pago'], ['pagos']),
  mantenimiento: new EntidadConfig('mantenimiento', 'id_mantenimiento', true, ['taller'], ['costo_total'], 'estado_ot', ['PENDIENTE', 'EN_PROCESO', 'CERRADA', 'CANCELADA'], 'fecha_inicio_mantenimiento', ['id_vehiculo'], ['mantenimientos', 'mantenimiento de vehiculos', 'ordenes de trabajo']),
  mantenimiento_arrastre: new EntidadConfig('mantenimiento_arrastre', 'id_mantenimiento_arrastre', true, [], [], 'estado_ot', ['PENDIENTE', 'EN_PROCESO', 'CERRADA', 'CANCELADA'], 'fecha_inicio_mantenimiento', ['id_unidad_arrastre'], ['mantenimiento de arrastre', 'mantenimiento de remolques']),
  cuentas_por_cobrar: new EntidadConfig('cuentas_por_cobrar', 'id_cuenta', true, [], [], null, [], 'fecha_registro', [], ['cuentas por cobrar']),
  sistemas_vehiculo: new EntidadConfig('sistemas_vehiculo', 'id_sistema', true, [], [], null, [], 'fecha_registro', ['tipo_unidad'], ['sistemas', 'sistemas de vehiculo']),
  componentes_vehiculo_insumos: new EntidadConfig('componentes_vehiculo_insumos', 'id_componente', true, [], [], null, [], 'fecha_registro', ['sistema_id'], ['componentes', 'insumos']),
  movimientos: new EntidadConfig('movimientos', 'id_movimiento', true, [], [], null, [], 'fecha', ['categoria', 'tipo'], ['ingresos', 'egresos', 'movimientos de caja']),
  asignacion_viaticos: new EntidadConfig('asignacion_viaticos', 'id_asignacion', true, [], ['costo'], null, [], 'fecha_asignacion', ['id_viaje'], ['viaticos']),
  correlativo_documentos: new EntidadConfig('correlativo_documentos', 'id', true, [], [], null, [], 'fecha_registro', ['entidad'], ['correlativos']),
  formato_impresion_correlativo: new EntidadConfig('formato_impresion_correlativo', 'id_formato', true, [], [], null, [], 'fecha_registro', ['entidad'], ['formatos de impresion']),
  planes_empresas: new EntidadConfig('planes_empresas', 'id_plan_empresa', true, [], ['precio_final_acordado'], 'estado_plan', [], 'fecha_inicio', ['id_plan'], ['planes de empresa']),
  usuario: new EntidadConfig('usuario', 'id', true, [], [], null, [], 'fecha_registro', ['rol'], ['usuarios']),
  documentos_generales: new EntidadConfig('documentos_generales', 'id_documento_general', true, ['conductor', 'cliente', 'vehiculo'], [], null, [], 'fecha_registro', ['tipo_documento'], ['documentos']),
  talleres: new EntidadConfig('talleres', 'id_taller', true, [], [], null, [], 'fecha_registro', ['id_ubicacion'], ['talleres']),

  ubicaciones: new EntidadConfig('ubicaciones', 'id_ubicacion', false, [], [], null, [], 'fecha_registro', ['nivel'], ['ubicaciones']),
  tablas_parametricas: new EntidadConfig('tablas_parametricas', 'id_tabla_parametrica', false, [], [], null, [], 'fecha_registro', ['grupo'], ['parametros']),
  claves_valores: new EntidadConfig('claves_valores', 'id', false, [], [], null, [], 'fecha_registro', ['tipo'], ['claves']),
  feriados: new EntidadConfig('feriados', 'id_feriado', false, [], [], null, [], 'fecha_feriado', ['tipo_feriado'], ['feriados']),
  tipos_cambio: new EntidadConfig('tipos_cambio', 'id_tipo_cambio', false, [], [], null, [], 'fecha_vigencia', ['moneda_origen'], ['tipos de cambio']),
  tipo_cambio_referencial: new EntidadConfig('tipo_cambio_referencial', 'id_tipo_cambio_ref', false, [], [], null, [], 'fecha_vigencia', ['fuente'], ['tipo de cambio referencial']),
  planes_subscripciones: new EntidadConfig('planes_subscripciones', 'id_plan', false, [], ['precio'], null, [], 'fecha_registro', [], ['planes de suscripcion']),
  cargas: new EntidadConfig('cargas', 'id_carga', false, ['viaje'], [], null, [], 'fecha_registro', ['tipo_carga'], ['cargas']),
  cargas_detalles: new EntidadConfig('cargas_detalles', 'id_detalle', false, [], [], null, [], 'fecha_registro', ['tipo_embalaje'], ['detalles de carga']),
  incidencias: new EntidadConfig('incidencias', 'id_incidencia', false, ['conductor', 'viaje'], ['costo_estimado'], 'estado_incidencia', ['Reportada', 'En revisión', 'En reparación', 'Resuelta', 'Cancelada'], 'fecha_incidencia', ['id_conductor', 'id_viaje'], ['incidencias']),
  estados_unidades: new EntidadConfig('estados_unidades', 'id_estados_unidad', false, [], [], null, [], 'fecha_registro', ['id_vehiculo', 'tipo_estado'], ['estados de unidad']),
  detalle_gasto_viaje: new EntidadConfig('detalle_gasto_viaje', 'id_detalle', false, ['viaje'], ['monto', 'litros_gastados'], null, [], 'fecha_registro', ['id_viaje', 'tipo_gasto'], ['gastos', 'gastos operativos', 'gasto de viaje']),
  rutas: new EntidadConfig('rutas', 'id_ruta', false, ['viaje'], ['distancia'], 'estado', ['PENDIENTE', 'EN_RUTA', 'FINALIZADO', 'CANCELADO'], 'fecha_registro', ['id_viaje', 'estado'], ['rutas']),
  componentes_mantenimiento: new EntidadConfig('componentes_mantenimiento', 'id', false, [], ['costo_total'], null, [], 'fecha_registro', ['id_mantenimiento', 'id_componente'], ['componentes usados']),
  componentes_mantenimiento_arrastre: new EntidadConfig('componentes_mantenimiento_arrastre', 'id', false, [], ['costo_total'], null, [], 'fecha_registro', ['id_mantenimiento_arrastre'], ['componentes usados arrastre']),
  notificaciones: new EntidadConfig('notificaciones', 'id_notificacion', false, [], [], 'estado_envio', [], 'fecha_envio', ['tipo_notificacion'], ['notificaciones']),
  salarios_conductores: new EntidadConfig('salarios_conductores', 'id_salario', false, ['conductor'], ['monto'], 'estado_pago', ['pendiente'], 'mes', ['id_conductor'], ['salarios', 'sueldos']),
  catalogos_precios: new EntidadConfig('catalogos_precios', 'id_catalogo', false, [], ['costo_base'], null, [], 'fecha_registro', ['origen', 'destino'], ['catalogos de precios']),
};