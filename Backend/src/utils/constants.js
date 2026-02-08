/**
 * Constantes del sistema
 */

// Estados de reserva (deben coincidir con estados_reserva en BD)
const ESTADOS_RESERVA = {
  PENDIENTE: 1,
  CONFIRMADA: 2,
  CANCELADA: 3,
  COMPLETADA: 4,
  NO_SHOW: 5,
  EN_GRACIA: 6,
  PENDIENTE_PAGO: 7
};

const ESTADOS_RESERVA_NOMBRES = {
  1: 'pendiente',
  2: 'confirmada',
  3: 'cancelada',
  4: 'completada',
  5: 'no_show',
  6: 'en_gracia',
  7: 'pendiente_pago'
};

// Roles (deben coincidir con roles en BD)
const ROLES = {
  MANAGER: 1,
  CLIENTE: 2,
  AGENTE_IA: 3
};

const ROLES_NOMBRES = {
  1: 'manager',
  2: 'cliente',
  3: 'agente_ia'
};

// Tipos de pago
const TIPOS_PAGO = {
  ANTICIPO: 'anticipo',
  CUENTA_FINAL: 'cuenta_final'
};

// Estados de pago
const ESTADOS_PAGO = {
  PENDIENTE: 'pendiente',
  COMPLETADO: 'completado',
  FALLIDO: 'fallido',
  REEMBOLSADO: 'reembolsado',
  PENDIENTE_REVISION: 'pendiente_revision'
};

// Métodos de pago (deben coincidir con metodos_pago en BD)
const METODOS_PAGO = {
  EFECTIVO: 1,
  TARJETA: 2,
  TRANSFERENCIA: 3
};

// Estados de pedido
const ESTADOS_PEDIDO = {
  RECIBIDO: 'recibido',
  EN_PREPARACION: 'en_preparacion',
  SERVIDO: 'servido'
};

// Estados de asignación de mesa
const ESTADOS_ASIGNACION = {
  OCUPADA: 'ocupada',
  LIBERADA: 'liberada',
  RESERVADA: 'reservada'
};

// Tipos de notificación
const TIPOS_NOTIFICACION = {
  RECORDATORIO: 'recordatorio',
  CONFIRMACION: 'confirmacion',
  AVISO: 'aviso',
  CANCELACION: 'cancelacion'
};

// Tipos de movimiento de puntos
const TIPOS_PUNTOS = {
  RESERVA: 'reserva',
  CANJE: 'canje',
  PROMOCION: 'promocion',
  AJUSTE: 'ajuste'
};

// Días de la semana
const DIAS_SEMANA = {
  DOMINGO: 0,
  LUNES: 1,
  MARTES: 2,
  MIERCOLES: 3,
  JUEVES: 4,
  VIERNES: 5,
  SABADO: 6
};

const DIAS_SEMANA_NOMBRES = {
  0: 'Domingo',
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado'
};

// Configuración por defecto
const CONFIG_DEFAULTS = {
  DURACION_RESERVA_MINUTOS: 120,
  ANTICIPACION_MINIMA_HORAS: 2,
  ANTICIPACION_MAXIMA_DIAS: 30,
  PUNTOS_POR_RESERVA: 10
};

// Claves de parámetros (deben coincidir con parametros en BD)
const PARAMETROS = {
  MONTO_ANTICIPO: 'monto_anticipo',
  HORAS_ANTICIPO_CANCELACION: 'horas_anticipo_cancelacion',
  DEVOLVER_ANTICIPO_SI_CANCELA: 'devolver_anticipo_si_cancela',
  DIAS_ANTICIPO_RESERVA_MAX: 'dias_anticipo_reserva_max'
};

module.exports = {
  ESTADOS_RESERVA,
  ESTADOS_RESERVA_NOMBRES,
  ROLES,
  ROLES_NOMBRES,
  TIPOS_PAGO,
  ESTADOS_PAGO,
  METODOS_PAGO,
  ESTADOS_PEDIDO,
  ESTADOS_ASIGNACION,
  TIPOS_NOTIFICACION,
  TIPOS_PUNTOS,
  DIAS_SEMANA,
  DIAS_SEMANA_NOMBRES,
  CONFIG_DEFAULTS,
  PARAMETROS
};
