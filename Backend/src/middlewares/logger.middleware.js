/**
 * Middleware de logging para requests
 */

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

// Obtener color según status code
const getStatusColor = (statusCode) => {
  if (statusCode >= 500) return colors.red;
  if (statusCode >= 400) return colors.yellow;
  if (statusCode >= 300) return colors.cyan;
  return colors.green;
};

// Middleware de logging
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Capturar cuando termina la respuesta
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusColor = getStatusColor(res.statusCode);
    
    const logLine = [
      colors.gray + new Date().toISOString() + colors.reset,
      req.method.padEnd(7),
      req.originalUrl,
      statusColor + res.statusCode + colors.reset,
      colors.gray + duration + 'ms' + colors.reset
    ].join(' | ');
    
    console.log(logLine);
  });
  
  next();
};

// Logger para desarrollo con más detalle
const devLogger = (req, res, next) => {
  console.log('\n--- REQUEST ---');
  console.log('Method:', req.method);
  console.log('URL:', req.originalUrl);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  if (Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  console.log('---------------\n');
  next();
};

module.exports = { requestLogger, devLogger };
