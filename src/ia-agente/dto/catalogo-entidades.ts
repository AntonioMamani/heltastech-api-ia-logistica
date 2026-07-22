export interface EntidadConfig {
  endpoint: string;
  idField: string;
  scoped: boolean; // true = filtra por id_empresa
  referencias: string[]; // campos de texto libre a resolver por nombre (ver mapaBusqueda en el service)
  camposNumericos?: string[]; // campos válidos para sum/avg (debe reflejar TABLAS_PERMITIDAS del backend)
}

export const CATALOGO_ENTIDADES: Record<string, EntidadConfig> = {
  // ____ scoped por empresa ____
  clientes: { endpoint: 'clientes', idField: 'id_cliente', scoped: true, referencias: [] },
  conductores: { endpoint: 'conductores', idField: 'id_conductor', scoped: true, referencias: [] },
  vehiculos: { endpoint: 'vehiculos', idField: 'id_unidad', scoped: true, referencias: [] },
  vehiculos_apoyo: { endpoint: 'vehiculos_apoyo', idField: 'id_vehiculo_apoyo', scoped: true, referencias: [] },
  unidades_arrastre: { endpoint: 'unidades_arrastre', idField: 'id_unidad_arrastre', scoped: true, referencias: [] },
  viajes: { endpoint: 'viajes', idField: 'id_viaje', scoped: true, referencias: ['cliente', 'conductor'], camposNumericos: ['distancia'] },
  contratos: { endpoint: 'contratos', idField: 'id_contrato', scoped: true, referencias: ['cliente'], camposNumericos: ['costo_total'] },
  cotizaciones: { endpoint: 'cotizaciones', idField: 'id_cotizacion', scoped: true, referencias: ['cliente'], camposNumericos: ['costo_total'] },
  pagos: { endpoint: 'pagos', idField: 'id_pago', scoped: true, referencias: [], camposNumericos: ['monto_pagado'] },
  mantenimiento: { endpoint: 'mantenimiento', idField: 'id_mantenimiento', scoped: true, referencias: [], camposNumericos: ['costo_total'] },
  mantenimiento_arrastre: { endpoint: 'mantenimiento_arrastre', idField: 'id_mantenimiento_arrastre', scoped: true, referencias: [] },
  cuentas_por_cobrar: { endpoint: 'cuentas_por_cobrar', idField: 'id_cuenta', scoped: true, referencias: [] },
  sistemas_vehiculo: { endpoint: 'sistemas_vehiculo', idField: 'id_sistema', scoped: true, referencias: [] },
  componentes_vehiculo_insumos: { endpoint: 'componentes_vehiculo_insumos', idField: 'id_componente', scoped: true, referencias: [] },
  talleres: { endpoint: 'talleres', idField: 'id_taller', scoped: true, referencias: [] },
  movimientos: { endpoint: 'movimientos', idField: 'id_movimiento', scoped: true, referencias: [] },
  asignacion_viaticos: { endpoint: 'asignacion_viaticos', idField: 'id_asignacion', scoped: true, referencias: [] },
  correlativo_documentos: { endpoint: 'correlativo_documentos', idField: 'id', scoped: true, referencias: [] },
  formato_impresion_correlativo: { endpoint: 'formato_impresion_correlativo', idField: 'id_formato', scoped: true, referencias: [] },
  planes_empresas: { endpoint: 'planes_empresas', idField: 'id_plan_empresa', scoped: true, referencias: [] },
  usuario: { endpoint: 'usuario', idField: 'id', scoped: true, referencias: [] },
  documentos_generales: { endpoint: 'documentos_generales', idField: 'id_documento_general', scoped: true, referencias: [] },
  // ____ generales (no scoped por empresa) ____
  ubicaciones: { endpoint: 'ubicaciones', idField: 'id_ubicacion', scoped: false, referencias: [] },
  tablas_parametricas: { endpoint: 'tablas_parametricas', idField: 'id_tabla_parametrica', scoped: false, referencias: [] },
  claves_valores: { endpoint: 'claves_valores', idField: 'id', scoped: false, referencias: [] },
  feriados: { endpoint: 'feriados', idField: 'id_feriado', scoped: false, referencias: [] },
  tipos_cambio: { endpoint: 'tipos_cambio', idField: 'id_tipo_cambio', scoped: false, referencias: [] },
  tipo_cambio_referencial: { endpoint: 'tipo_cambio_referencial', idField: 'id_tipo_cambio_ref', scoped: false, referencias: [] },
  planes_subscripciones: { endpoint: 'planes_subscripciones', idField: 'id_plan', scoped: false, referencias: [] },
  cargas: { endpoint: 'cargas', idField: 'id_carga', scoped: false, referencias: ['viaje'] },
  cargas_detalles: { endpoint: 'cargas_detalles', idField: 'id_detalle', scoped: false, referencias: [] },
  incidencias: { endpoint: 'incidencias', idField: 'id_incidencia', scoped: false, referencias: ['conductor', 'viaje'], camposNumericos: ['costo_estimado'] },
  estados_unidades: { endpoint: 'estados_unidades', idField: 'id_estados_unidad', scoped: false, referencias: [] },
  detalle_gasto_viaje: { endpoint: 'detalle_gasto_viaje', idField: 'id_detalle', scoped: false, referencias: ['viaje'], camposNumericos: ['monto', 'litros_gastados'] },
  rutas: { endpoint: 'rutas', idField: 'id_ruta', scoped: false, referencias: ['viaje'] },
  componentes_mantenimiento: { endpoint: 'componentes_mantenimiento', idField: 'id', scoped: false, referencias: [] },
  componentes_mantenimiento_arrastre: { endpoint: 'componentes_mantenimiento_arrastre', idField: 'id', scoped: false, referencias: [] },
  notificaciones: { endpoint: 'notificaciones', idField: 'id_notificacion', scoped: false, referencias: [] },
  salarios_conductores: { endpoint: 'salarios_conductores', idField: 'id_salario', scoped: false, referencias: ['conductor'] },
  catalogos_precios: { endpoint: 'catalogos_precios', idField: 'id_catalogo', scoped: false, referencias: [] },
};