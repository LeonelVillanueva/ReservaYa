/**
 * Utilidades generales / helpers
 */

// Generar código aleatorio (para referencias, confirmaciones, etc.)
const generarCodigo = (longitud = 8) => {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let codigo = '';
  for (let i = 0; i < longitud; i++) {
    codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return codigo;
};

// Capitalizar primera letra
const capitalizar = (texto) => {
  if (!texto) return '';
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
};

// Capitalizar cada palabra
const capitalizarPalabras = (texto) => {
  if (!texto) return '';
  return texto.split(' ').map(p => capitalizar(p)).join(' ');
};

// Limpiar texto (quitar espacios extra, etc.)
const limpiarTexto = (texto) => {
  if (!texto) return '';
  return texto.trim().replace(/\s+/g, ' ');
};

// Formatear monto como moneda
const formatearMoneda = (monto, simbolo = 'L') => {
  const num = parseFloat(monto);
  if (isNaN(num)) return `${simbolo} 0.00`;
  return `${simbolo} ${num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

// Parsear booleano desde string
const parseBoolean = (valor) => {
  if (typeof valor === 'boolean') return valor;
  if (typeof valor === 'string') {
    return valor.toLowerCase() === 'true' || valor === '1';
  }
  return Boolean(valor);
};

// Omitir propiedades de un objeto
const omitir = (obj, ...keys) => {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
};

// Seleccionar solo ciertas propiedades de un objeto
const seleccionar = (obj, ...keys) => {
  const result = {};
  keys.forEach(key => {
    if (obj.hasOwnProperty(key)) {
      result[key] = obj[key];
    }
  });
  return result;
};

// Esperar (para desarrollo/testing)
const esperar = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Reintentar una función async
const reintentar = async (fn, intentos = 3, delay = 1000) => {
  for (let i = 0; i < intentos; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === intentos - 1) throw error;
      await esperar(delay);
    }
  }
};

// Agrupar array por una propiedad
const agruparPor = (array, propiedad) => {
  return array.reduce((acc, item) => {
    const key = item[propiedad];
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
};

// Eliminar duplicados de un array
const unicos = (array, propiedad = null) => {
  if (propiedad) {
    const seen = new Set();
    return array.filter(item => {
      const key = item[propiedad];
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  return [...new Set(array)];
};

module.exports = {
  generarCodigo,
  capitalizar,
  capitalizarPalabras,
  limpiarTexto,
  formatearMoneda,
  parseBoolean,
  omitir,
  seleccionar,
  esperar,
  reintentar,
  agruparPor,
  unicos
};
