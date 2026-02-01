/**
 * Utilidades para manejo de fechas y horas
 */

// Formatear hora a HH:MM:SS (PostgreSQL TIME)
const formatearHora = (hora) => {
  if (!hora) return null;
  // Si ya tiene formato HH:MM:SS, devolverlo
  if (/^\d{2}:\d{2}:\d{2}$/.test(hora)) return hora;
  // Si es HH:MM, agregar :00
  if (/^\d{2}:\d{2}$/.test(hora)) return `${hora}:00`;
  // Si es H:MM, formatear
  if (/^\d{1}:\d{2}$/.test(hora)) return `0${hora}:00`;
  return hora;
};

// Calcular hora fin dado hora inicio y duración en minutos
const calcularHoraFin = (horaInicio, duracionMinutos) => {
  const [h, m] = horaInicio.split(':').map(Number);
  const totalMinutos = h * 60 + m + duracionMinutos;
  const horas = Math.floor(totalMinutos / 60) % 24;
  const minutos = totalMinutos % 60;
  return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:00`;
};

// Verificar solapamiento de horarios
const haySolapamiento = (inicio1, fin1, inicio2, fin2) => {
  const toMinutos = (hora) => {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
  };
  
  const i1 = toMinutos(inicio1);
  const f1 = toMinutos(fin1);
  const i2 = toMinutos(inicio2);
  const f2 = toMinutos(fin2);
  
  return (i1 >= i2 && i1 < f2) || (f1 > i2 && f1 <= f2) || (i1 <= i2 && f1 >= f2);
};

// Convertir hora a minutos desde medianoche
const horaAMinutos = (hora) => {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
};

// Convertir minutos a formato HH:MM
const minutosAHora = (minutos) => {
  const h = Math.floor(minutos / 60) % 24;
  const m = minutos % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

// Obtener fecha actual en formato YYYY-MM-DD
const fechaHoy = () => {
  return new Date().toISOString().split('T')[0];
};

// Obtener hora actual en formato HH:MM:SS
const horaAhora = () => {
  return new Date().toTimeString().split(' ')[0];
};

// Validar que una fecha no sea pasada
const esFechaFutura = (fecha) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fechaObj = new Date(fecha);
  return fechaObj >= hoy;
};

// Validar que una fecha+hora no sea pasada
const esFechaHoraFutura = (fecha, hora) => {
  const ahora = new Date();
  const fechaHoraObj = new Date(`${fecha}T${hora}`);
  return fechaHoraObj > ahora;
};

// Obtener día de la semana (0=Domingo, 6=Sábado)
const obtenerDiaSemana = (fecha) => {
  return new Date(fecha).getDay();
};

// Sumar días a una fecha
const sumarDias = (fecha, dias) => {
  const d = new Date(fecha);
  d.setDate(d.getDate() + dias);
  return d.toISOString().split('T')[0];
};

// Diferencia en días entre dos fechas
const diferenciaDias = (fecha1, fecha2) => {
  const d1 = new Date(fecha1);
  const d2 = new Date(fecha2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Diferencia en horas entre ahora y una fecha+hora
const diferenciaHorasDesdeAhora = (fecha, hora) => {
  const ahora = new Date();
  const fechaHoraObj = new Date(`${fecha}T${hora}`);
  const diffMs = fechaHoraObj - ahora;
  return diffMs / (1000 * 60 * 60);
};

module.exports = {
  formatearHora,
  calcularHoraFin,
  haySolapamiento,
  horaAMinutos,
  minutosAHora,
  fechaHoy,
  horaAhora,
  esFechaFutura,
  esFechaHoraFutura,
  obtenerDiaSemana,
  sumarDias,
  diferenciaDias,
  diferenciaHorasDesdeAhora
};
