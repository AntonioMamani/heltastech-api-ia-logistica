export interface RutaConfig {
  ruta: string;
  rolesPermitidos: string[];
  descripcion: string;
  alias: string[];
}

const r = (ruta: string, roles: string[], desc: string, alias: string[]): RutaConfig => ({ ruta, rolesPermitidos: roles, descripcion: desc, alias });

export const CATALOGO_RUTAS: Record<string, RutaConfig> = {
  // SUPERADMIN
  dashboard_superadmin: r('/superadmin/dashboard', ['superadmin'], 'Dashboard de Superadmin', ['dashboard superadmin', 'panel superadmin', 'dashboard', 'panel', 'principal', 'inicio']),
  empresas: r('/superadmin/empresas', ['superadmin'], 'Listado de empresas', ['empresas', 'listado de empresas']),
  unidades_gps_empresas: r('/superadmin/unidades-empresas', ['superadmin'], 'Unidades GPS por empresa', ['unidades gps empresas']),
  planes_empresa: r('/superadmin/plan-empresa', ['superadmin'], 'Planes de empresas', ['planes de empresa']),
  tipos_cambio: r('/superadmin/tipos-cambio', ['superadmin'], 'Tipos de cambio', ['tipos de cambio', 'tipo de cambio']),
  feriados: r('/superadmin/feriados', ['superadmin'], 'Feriados', ['feriados']),

  // ADMIN
  dashboard_admin: r('/admin/dashboard', ['admin'], 'Dashboard de Admin', ['dashboard admin', 'panel admin', 'inicio admin', 'dashboard', 'panel', 'principal', 'inicio']),
  dashboard_operador: r('/operador/dashboard', ['operador_logistica'], 'Dashboard de Operador Logístico', ['dashboard operador', 'panel operador', 'dashboard', 'panel', 'principal', 'inicio']),
  conductores: r('/operador/conductores', ['admin', 'operador_logistica'], 'Conductores', ['conductores', 'choferes']),
  vehiculos: r('/operador/unidades-vehiculares', ['admin', 'operador_logistica'], 'Vehículos / Unidades vehiculares', ['vehiculos', 'unidades vehiculares', 'camiones']),
  viajes: r('/operador/viajes', ['admin', 'operador_logistica'], 'Viajes', ['viajes', 'fletes']),
  seguimiento_fletes: r('/administrativo/viajes-tablero', ['admin'], 'Seguimiento de fletes', ['seguimiento de fletes', 'tablero de viajes']),
  nominaciones: r('/administrativo/nominaciones', ['admin'], 'Nominaciones', ['nominaciones']),
  unidades_arrastre: r('/operador/vehiculos-arrastre', ['admin', 'operador_logistica'], 'Unidades de arrastre', ['unidades de arrastre', 'arrastres']),
  vehiculos_apoyo: r('/operador/vehiculos-apoyo', ['admin', 'operador_logistica'], 'Vehículos de apoyo', ['vehiculos de apoyo']),

  // FINANZAS
  cuentas_por_cobrar: r('/cuentas-por-cobrar', ['admin'], 'Cuentas por cobrar', ['cuentas por cobrar']),
  ingresos_egresos: r('/administrativo/ingresos-egresos', ['admin'], 'Ingresos y egresos', ['ingresos y egresos', 'movimientos']),
  pagos: r('/administrativo/pagos', ['admin'], 'Ingresos / Pagos', ['pagos', 'ingresos']),
  clientes: r('/operador/registrar', ['admin'], 'Clientes', ['clientes']),
  contratos: r('/administrativo/contratos', ['admin'], 'Contratos', ['contratos']),
  cotizaciones: r('/administrativo/cotizaciones', ['admin'], 'Cotizaciones', ['cotizaciones']),
  planes_empresas_admin: r('/administrativo/planes-empresas', ['admin'], 'Plan de la empresa', ['plan empresa', 'mi plan']),

  // GPS
  dashboard_gps: r('/administrativo/dashboard-unidades-gps', ['admin'], 'Dashboard de geolocalización', ['dashboard gps', 'geolocalizacion']),
  monitoreo_unidades: r('/administrativo/monitoreo-unidades', ['admin'], 'Rastreo en tiempo real', ['rastreo tiempo real', 'monitoreo de unidades']),
  geocercas: r('/administrativo/geocercas', ['admin'], 'Geocercas', ['geocercas']),
  historial_gps: r('/administrativo/gps/historial', ['admin'], 'Historial y reportes GPS', ['historial gps', 'reportes gps']),

  // DOCUMENTOS
  dashboard_documentos: r('/administrativo/dashboard-documentos', ['admin', 'asistente_administrativo'], 'Dashboard de documentos', ['dashboard documentos']),
  documentos_generales: r('/administrativo/generales', ['admin', 'asistente_administrativo'], 'Documentos generales', ['documentos generales', 'documentos']),

  // MANTENIMIENTO
  dashboard_mantenimiento: r('/operador/dashboard-mantenimiento', ['admin', 'operador_logistica'], 'Dashboard de mantenimiento', ['dashboard mantenimiento']),
  mantenimiento: r('/operador/mantenimiento', ['admin', 'operador_logistica'], 'Mantenimiento de vehículos', ['mantenimiento']),
  mantenimiento_arrastre: r('/operador/mantenimiento-arrastre', ['admin', 'operador_logistica'], 'Mantenimiento de unidades de arrastre', ['mantenimiento arrastre', 'mantenimiento de arrastre', 'mantenimiento de unidades de arrastre']),
  compra_repuestos: r('/operador/compra-repuestos', ['admin', 'operador_logistica'], 'Compra de repuestos', ['compra de repuestos', 'repuestos']),
  componentes: r('/operador/componentes', ['admin', 'operador_logistica'], 'Componentes / insumos', ['componentes', 'insumos']),
  talleres: r('/operador/talleres', ['admin', 'operador_logistica'], 'Talleres', ['talleres']),
  sistemas: r('/operador/sistemas', ['admin', 'operador_logistica'], 'Sistemas de mantenimiento', ['sistemas']),

  // USUARIOS
  gestionar_usuarios: r('/administrativo/registrar', ['admin'], 'Gestionar usuarios', ['gestionar usuarios', 'usuarios']),
  configuraciones: r('/administrativo/configuraciones', ['admin'], 'Datos generales / configuraciones', ['configuraciones', 'datos generales']),
  parametricas: r('/administrativo/parametrica', ['admin'], 'Tablas paramétricas', ['parametricas', 'tablas parametricas']),
  ubicaciones: r('/operador/rutas', ['admin'], 'Ubicaciones', ['ubicaciones', 'rutas']),
  formato_impresion: r('/administrativo/formato-impresion', ['admin'], 'Formato de impresión de correlativos', ['formato de impresion', 'correlativos']),

  // REPORTES
  reporte_mantenimiento: r('/operador/reportes-mantenimiento', ['admin', 'operador_logistica'], 'Reporte de mantenimiento', ['reporte de mantenimiento', 'reportes de mantenimiento']),
  reporte_viajes: r('/reporte-viaje', ['admin'], 'Reporte de viajes', ['reporte de viajes', 'reportes de viajes']),

  // ASISTENTE
  dashboard_asistente: r('/asistente-administrativo/dashboard-documentos', ['asistente_administrativo'], 'Dashboard del asistente', ['dashboard asistente', 'dashboard', 'panel', 'principal', 'inicio']),

  // CONDUCTOR
  dashboard_conductor: r('/conductor/dashboard', ['conductor'], 'Dashboard del conductor', ['dashboard conductor', 'mi panel', 'dashboard', 'panel', 'principal', 'inicio']),
  perfil_conductor: r('/conductor-perfil', ['conductor'], 'Perfil del conductor', ['mi perfil']),
  mis_viajes_conductor: r('/viajes/mis-viajes', ['conductor'], 'Mis viajes', ['mis viajes']),
  incidencias: r('/incidencias/registro-incidencias', ['conductor'], 'Registro de incidencias', ['incidencias', 'registrar incidencia']),

  // CLIENTE
  dashboard_cliente: r('/cliente/dashboard', ['cliente'], 'Dashboard del cliente', ['dashboard cliente', 'mi panel', 'dashboard', 'panel', 'principal', 'inicio']),
  perfil_cliente: r('/usuario/perfil', ['cliente'], 'Perfil personal', ['mi perfil']),
  cotizar_viaje: r('/usuario/cotizacion', ['cliente'], 'Cotizar viaje', ['cotizar viaje', 'cotizacion']),
  mis_viajes_cliente: r('/usuario/viajes', ['cliente'], 'Mis viajes', ['mis viajes']),
  contratos_cliente: r('/usuario/contratos', ['cliente'], 'Contratos', ['mis contratos']),
  historial_pagos_cliente: r('/usuario/pagos', ['cliente'], 'Historial de pagos', ['historial de pagos', 'mis pagos']),
};