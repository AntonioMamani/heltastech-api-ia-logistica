// Catálogo de rutas del sistema para el redireccionamiento por voz/texto del agente IA.
// Cada clave es un identificador corto que el LLM (o el matching por alias) usa para
// saber a qué pantalla quiere ir el usuario. "rolesPermitidos" son los roles (en
// minúscula, igual que vienen del JWT) que tienen esa ruta en su menú.
//
// Para agregar una ruta nueva: copiar una entrada, cambiar clave/ruta/roles/alias.
// No hace falta tocar el resolver de más abajo.

export interface RutaConfig {
  ruta: string;              // path real de Angular (coincide con app.routes.ts)
  rolesPermitidos: string[]; // roles que ven esta ruta en su menú (paginas.ts -> filtrarMenuPorRol)
  descripcion: string;       // texto humano, útil para mensajes de error/ayuda
  alias: string[];           // palabras clave para matchear el texto libre del usuario
}

export const CATALOGO_RUTAS: Record<string, RutaConfig> = {

  // ===================== SUPERADMIN =====================
  dashboard_superadmin: {
    ruta: '/superadmin/dashboard',
    rolesPermitidos: ['superadmin'],
    descripcion: 'Dashboard de Superadmin',
    alias: ['dashboard superadmin', 'panel superadmin', 'dashboard', 'panel', 'principal', 'inicio'],
  },
  empresas: {
    ruta: '/superadmin/empresas',
    rolesPermitidos: ['superadmin'],
    descripcion: 'Listado de empresas',
    alias: ['empresas', 'listado de empresas'],
  },
  unidades_gps_empresas: {
    ruta: '/superadmin/unidades-empresas',
    rolesPermitidos: ['superadmin'],
    descripcion: 'Unidades GPS por empresa',
    alias: ['unidades gps empresas'],
  },
  planes_empresa: {
    ruta: '/superadmin/plan-empresa',
    rolesPermitidos: ['superadmin'],
    descripcion: 'Planes de empresas (superadmin)',
    alias: ['planes de empresa'],
  },
  tipos_cambio: {
    ruta: '/superadmin/tipos-cambio',
    rolesPermitidos: ['superadmin'],
    descripcion: 'Tipos de cambio',
    alias: ['tipos de cambio', 'tipo de cambio'],
  },
  feriados: {
    ruta: '/superadmin/feriados',
    rolesPermitidos: ['superadmin'],
    descripcion: 'Feriados',
    alias: ['feriados'],
  },

  // ===================== OPERACIONES (admin + operador_logistica) =====================
  dashboard_admin: {
    ruta: '/admin/dashboard',
    rolesPermitidos: ['admin'],
    descripcion: 'Dashboard de Admin',
    alias: ['dashboard admin', 'panel admin', 'inicio admin', 'dashboard', 'panel', 'principal', 'inicio'],
  },
  dashboard_operador: {
    ruta: '/operador/dashboard',
    rolesPermitidos: ['operador_logistica'],
    descripcion: 'Dashboard de Operador Logístico',
    alias: ['dashboard operador', 'panel operador', 'dashboard', 'panel', 'principal', 'inicio'],
  },
  conductores: {
    ruta: '/operador/conductores',
    rolesPermitidos: ['admin', 'operador_logistica'],
    descripcion: 'Conductores',
    alias: ['conductores', 'choferes'],
  },
  vehiculos: {
    ruta: '/operador/unidades-vehiculares',
    rolesPermitidos: ['admin', 'operador_logistica'],
    descripcion: 'Vehículos / Unidades vehiculares',
    alias: ['vehiculos', 'unidades vehiculares', 'camiones'],
  },
  viajes: {
    ruta: '/operador/viajes',
    rolesPermitidos: ['admin', 'operador_logistica'],
    descripcion: 'Viajes',
    alias: ['viajes', 'fletes'],
  },
  seguimiento_fletes: {
    ruta: '/administrativo/viajes-tablero',
    rolesPermitidos: ['admin'],
    descripcion: 'Seguimiento de fletes (tablero de viajes)',
    alias: ['seguimiento de fletes', 'tablero de viajes'],
  },
  nominaciones: {
    ruta: '/administrativo/nominaciones',
    rolesPermitidos: ['admin'],
    descripcion: 'Nominaciones',
    alias: ['nominaciones'],
  },
  unidades_arrastre: {
    ruta: '/operador/vehiculos-arrastre',
    rolesPermitidos: ['admin', 'operador_logistica'],
    descripcion: 'Unidades de arrastre',
    alias: ['unidades de arrastre', 'arrastres'],
  },
  vehiculos_apoyo: {
    ruta: '/operador/vehiculos-apoyo',
    rolesPermitidos: ['admin', 'operador_logistica'],
    descripcion: 'Vehículos de apoyo',
    alias: ['vehiculos de apoyo'],
  },

  // ===================== FINANZAS (admin) =====================
  cuentas_por_cobrar: {
    ruta: '/cuentas-por-cobrar',
    rolesPermitidos: ['admin'],
    descripcion: 'Cuentas por cobrar',
    alias: ['cuentas por cobrar'],
  },
  ingresos_egresos: {
    ruta: '/administrativo/ingresos-egresos',
    rolesPermitidos: ['admin'],
    descripcion: 'Ingresos y egresos',
    alias: ['ingresos y egresos', 'movimientos'],
  },
  pagos: {
    ruta: '/administrativo/pagos',
    rolesPermitidos: ['admin'],
    descripcion: 'Ingresos / Pagos',
    alias: ['pagos', 'ingresos'],
  },
  clientes: {
    ruta: '/operador/registrar',
    rolesPermitidos: ['admin'],
    descripcion: 'Clientes',
    alias: ['clientes'],
  },
  contratos: {
    ruta: '/administrativo/contratos',
    rolesPermitidos: ['admin'],
    descripcion: 'Contratos',
    alias: ['contratos'],
  },
  cotizaciones: {
    ruta: '/administrativo/cotizaciones',
    rolesPermitidos: ['admin'],
    descripcion: 'Cotizaciones',
    alias: ['cotizaciones'],
  },
  planes_empresas_admin: {
    ruta: '/administrativo/planes-empresas',
    rolesPermitidos: ['admin'],
    descripcion: 'Plan de la empresa',
    alias: ['plan empresa', 'mi plan'],
  },

  // ===================== GPS (admin) =====================
  dashboard_gps: {
    ruta: '/administrativo/dashboard-unidades-gps',
    rolesPermitidos: ['admin'],
    descripcion: 'Dashboard de geolocalización',
    alias: ['dashboard gps', 'geolocalizacion'],
  },
  monitoreo_unidades: {
    ruta: '/administrativo/monitoreo-unidades',
    rolesPermitidos: ['admin'],
    descripcion: 'Rastreo en tiempo real',
    alias: ['rastreo tiempo real', 'monitoreo de unidades'],
  },
  geocercas: {
    ruta: '/administrativo/geocercas',
    rolesPermitidos: ['admin'],
    descripcion: 'Geocercas',
    alias: ['geocercas'],
  },
  historial_gps: {
    ruta: '/administrativo/gps/historial',
    rolesPermitidos: ['admin'],
    descripcion: 'Historial y reportes GPS',
    alias: ['historial gps', 'reportes gps'],
  },

  // ===================== DOCUMENTOS (admin + asistente_administrativo) =====================
  dashboard_documentos: {
    ruta: '/administrativo/dashboard-documentos',
    rolesPermitidos: ['admin', 'asistente_administrativo'],
    descripcion: 'Dashboard de documentos',
    alias: ['dashboard documentos'],
  },
  documentos_generales: {
    ruta: '/administrativo/generales',
    rolesPermitidos: ['admin', 'asistente_administrativo'],
    descripcion: 'Documentos generales',
    alias: ['documentos generales'],
  },

  // ===================== MANTENIMIENTO (admin + operador_logistica) =====================
  dashboard_mantenimiento: {
    ruta: '/operador/dashboard-mantenimiento',
    rolesPermitidos: ['admin', 'operador_logistica'],
    descripcion: 'Dashboard de mantenimiento',
    alias: ['dashboard mantenimiento'],
  },
  mantenimiento: {
    ruta: '/operador/mantenimiento',
    rolesPermitidos: ['admin', 'operador_logistica'],
    descripcion: 'Mantenimiento de vehículos',
    alias: ['mantenimiento'],
  },
  mantenimiento_arrastre: {
    ruta: '/operador/mantenimiento-arrastre',
    rolesPermitidos: ['admin', 'operador_logistica'],
    descripcion: 'Mantenimiento de unidades de arrastre',
    alias: ['mantenimiento arrastre', 'mantenimiento de arrastre'],
  },
  compra_repuestos: {
    ruta: '/operador/compra-repuestos',
    rolesPermitidos: ['admin', 'operador_logistica'],
    descripcion: 'Compra de repuestos',
    alias: ['compra de repuestos', 'repuestos'],
  },
  componentes: {
    ruta: '/operador/componentes',
    rolesPermitidos: ['admin', 'operador_logistica'],
    descripcion: 'Componentes / insumos',
    alias: ['componentes', 'insumos'],
  },
  talleres: {
    ruta: '/operador/talleres',
    rolesPermitidos: ['admin', 'operador_logistica'],
    descripcion: 'Talleres',
    alias: ['talleres'],
  },
  sistemas: {
    ruta: '/operador/sistemas',
    rolesPermitidos: ['admin', 'operador_logistica'],
    descripcion: 'Sistemas de mantenimiento',
    alias: ['sistemas'],
  },

  // ===================== USUARIOS Y CONFIGURACIÓN (admin) =====================
  gestionar_usuarios: {
    ruta: '/administrativo/registrar',
    rolesPermitidos: ['admin'],
    descripcion: 'Gestionar usuarios',
    alias: ['gestionar usuarios', 'usuarios'],
  },
  configuraciones: {
    ruta: '/administrativo/configuraciones',
    rolesPermitidos: ['admin'],
    descripcion: 'Datos generales / configuraciones',
    alias: ['configuraciones', 'datos generales'],
  },
  parametricas: {
    ruta: '/administrativo/parametrica',
    rolesPermitidos: ['admin'],
    descripcion: 'Tablas paramétricas',
    alias: ['parametricas', 'tablas parametricas'],
  },
  ubicaciones: {
    ruta: '/operador/rutas',
    rolesPermitidos: ['admin'],
    descripcion: 'Ubicaciones',
    alias: ['ubicaciones', 'rutas'],
  },
  formato_impresion: {
    ruta: '/administrativo/formato-impresion',
    rolesPermitidos: ['admin'],
    descripcion: 'Formato de impresión de correlativos',
    alias: ['formato de impresion', 'correlativos'],
  },

  // ===================== REPORTES =====================
  reporte_mantenimiento: {
    ruta: '/operador/reportes-mantenimiento',
    rolesPermitidos: ['admin', 'operador_logistica'],
    descripcion: 'Reporte de mantenimiento',
    alias: ['reporte de mantenimiento', 'reportes de mantenimiento'],
  },
  reporte_viajes: {
    ruta: '/reporte-viaje',
    rolesPermitidos: ['admin'],
    descripcion: 'Reporte de viajes',
    alias: ['reporte de viajes', 'reportes de viajes'],
  },

  // ===================== ASISTENTE ADMINISTRATIVO =====================
  dashboard_asistente: {
    ruta: '/asistente-administrativo/dashboard-documentos',
    rolesPermitidos: ['asistente_administrativo'],
    descripcion: 'Dashboard del asistente administrativo',
    alias: ['dashboard asistente', 'dashboard', 'panel', 'principal', 'inicio'],
  },

  // ===================== CONDUCTOR =====================
  dashboard_conductor: {
    ruta: '/conductor/dashboard',
    rolesPermitidos: ['conductor'],
    descripcion: 'Dashboard del conductor',
    alias: ['dashboard conductor', 'mi panel', 'dashboard', 'panel', 'principal', 'inicio'],
  },
  perfil_conductor: {
    ruta: '/conductor-perfil',
    rolesPermitidos: ['conductor'],
    descripcion: 'Perfil del conductor',
    alias: ['mi perfil'],
  },
  mis_viajes_conductor: {
    ruta: '/viajes/mis-viajes',
    rolesPermitidos: ['conductor'],
    descripcion: 'Mis viajes (conductor)',
    alias: ['mis viajes'],
  },
  incidencias: {
    ruta: '/incidencias/registro-incidencias',
    rolesPermitidos: ['conductor'],
    descripcion: 'Registro de incidencias',
    alias: ['incidencias', 'registrar incidencia'],
  },

  // ===================== CLIENTE =====================
  dashboard_cliente: {
    ruta: '/cliente/dashboard',
    rolesPermitidos: ['cliente'],
    descripcion: 'Dashboard del cliente',
    alias: ['dashboard cliente', 'mi panel', 'dashboard', 'panel', 'principal', 'inicio'],
  },
  perfil_cliente: {
    ruta: '/usuario/perfil',
    rolesPermitidos: ['cliente'],
    descripcion: 'Perfil personal',
    alias: ['mi perfil'],
  },
  cotizar_viaje: {
    ruta: '/usuario/cotizacion',
    rolesPermitidos: ['cliente'],
    descripcion: 'Cotizar viaje',
    alias: ['cotizar viaje', 'cotizacion'],
  },
  mis_viajes_cliente: {
    ruta: '/usuario/viajes',
    rolesPermitidos: ['cliente'],
    descripcion: 'Mis viajes (cliente)',
    alias: ['mis viajes'],
  },
  contratos_cliente: {
    ruta: '/usuario/contratos',
    rolesPermitidos: ['cliente'],
    descripcion: 'Contratos (cliente)',
    alias: ['mis contratos'],
  },
  historial_pagos_cliente: {
    ruta: '/usuario/pagos',
    rolesPermitidos: ['cliente'],
    descripcion: 'Historial de pagos (cliente)',
    alias: ['historial de pagos', 'mis pagos'],
  },
};
