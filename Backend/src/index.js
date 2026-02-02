const express = require('express');
const cors = require('cors');

// Configuración
const config = require('./config');

// Middlewares
const { requestLogger, errorHandler, notFoundHandler } = require('./middlewares');

// Rutas
const authRoutes = require('./routes/auth.routes');
const reservasRoutes = require('./routes/reservas.routes');
const mesasRoutes = require('./routes/mesas.routes');
const menuRoutes = require('./routes/menu.routes');
const pedidosRoutes = require('./routes/pedidos.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const parametrosRoutes = require('./routes/parametros.routes');
const debugRoutes = require('./routes/debug.routes');

const app = express();

// === MIDDLEWARES GLOBALES ===
app.use(cors(config.cors));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger de requests (solo en desarrollo)
if (config.isDev) {
  app.use(requestLogger);
}

// === RUTA RAÍZ ===
app.get('/', (req, res) => {
  res.json({ 
    success: true,
    message: 'API Sistema de Reservas de Restaurante',
    version: '1.0.0',
    environment: config.nodeEnv,
    endpoints: {
      auth: '/api/auth',
      reservas: '/api/reservas',
      mesas: '/api/mesas',
      menu: '/api/menu',
      pedidos: '/api/pedidos',
      usuarios: '/api/usuarios',
      parametros: '/api/parametros',
      debug: '/api/debug'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    status: 'ok', 
    timestamp: new Date().toISOString() 
  });
});

// === RUTAS API ===
app.use('/api/auth', authRoutes);
app.use('/api/reservas', reservasRoutes);
app.use('/api/mesas', mesasRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/parametros', parametrosRoutes);
app.use('/api/debug', debugRoutes);

// === MANEJO DE ERRORES ===
app.use(notFoundHandler);
app.use(errorHandler);

// === INICIAR SERVIDOR ===
app.listen(config.port, () => {
  console.log('========================================');
  console.log('  Sistema de Reservas - Backend API');
  console.log('========================================');
  console.log(`  Entorno:    ${config.nodeEnv}`);
  console.log(`  Puerto:     ${config.port}`);
  console.log(`  URL:        http://localhost:${config.port}`);
  console.log('========================================');
});

module.exports = app;
