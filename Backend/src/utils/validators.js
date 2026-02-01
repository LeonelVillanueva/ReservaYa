/**
 * Funciones de validación
 */

// Validar email
const esEmailValido = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// Validar teléfono (formato general)
const esTelefonoValido = (telefono) => {
  // Acepta formatos: +504 9999-9999, 99999999, +1234567890, etc.
  const regex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/;
  return regex.test(telefono.replace(/\s/g, ''));
};

// Validar formato de hora HH:MM o HH:MM:SS
const esHoraValida = (hora) => {
  const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
  return regex.test(hora);
};

// Validar formato de fecha YYYY-MM-DD
const esFechaValida = (fecha) => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(fecha)) return false;
  const d = new Date(fecha);
  return d instanceof Date && !isNaN(d);
};

// Validar que sea un número positivo
const esNumeroPositivo = (valor) => {
  const num = parseFloat(valor);
  return !isNaN(num) && num > 0;
};

// Validar que sea un entero positivo
const esEnteroPositivo = (valor) => {
  const num = parseInt(valor);
  return !isNaN(num) && num > 0 && Number.isInteger(num);
};

// Validar que sea un monto válido (decimal con hasta 2 decimales)
const esMontoValido = (valor) => {
  const regex = /^\d+(\.\d{1,2})?$/;
  return regex.test(valor.toString()) && parseFloat(valor) >= 0;
};

// Validar URL
const esUrlValida = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Validar contraseña (mínimo 8 caracteres, al menos 1 número)
const esContrasenaValida = (password) => {
  return password.length >= 8 && /\d/.test(password);
};

// Validar que un string no esté vacío
const noEstaVacio = (valor) => {
  return typeof valor === 'string' && valor.trim().length > 0;
};

// Validar longitud máxima
const longitudMaxima = (valor, max) => {
  return typeof valor === 'string' && valor.length <= max;
};

// Validar rango numérico
const enRango = (valor, min, max) => {
  const num = parseFloat(valor);
  return !isNaN(num) && num >= min && num <= max;
};

// Validar que esté en una lista de valores permitidos
const enLista = (valor, lista) => {
  return lista.includes(valor);
};

module.exports = {
  esEmailValido,
  esTelefonoValido,
  esHoraValida,
  esFechaValida,
  esNumeroPositivo,
  esEnteroPositivo,
  esMontoValido,
  esUrlValida,
  esContrasenaValida,
  noEstaVacio,
  longitudMaxima,
  enRango,
  enLista
};
