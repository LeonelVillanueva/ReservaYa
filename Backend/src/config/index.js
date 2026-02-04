/**
 * Configuración centralizada de la aplicación
 */

require('dotenv').config();

const config = {
  // Servidor
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',
  
  // Supabase
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  },
  
  // Token de sesión (firmado). En producción usar TOKEN_SECRET de al menos 16 caracteres.
  tokenSecret: process.env.TOKEN_SECRET || 'dev-secret-cambiar-en-produccion',

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  
  // Rate limiting (para implementar después)
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100 // máximo 100 requests por ventana
  }
};

// Validar configuración requerida
const validarConfig = () => {
  const requeridas = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
  const faltantes = requeridas.filter(key => !process.env[key]);
  
  if (faltantes.length > 0) {
    console.error('⚠️  Variables de entorno faltantes:', faltantes.join(', '));
    console.error('   Copia .env.example a .env y configura las variables.');
  }
};

validarConfig();

module.exports = config;
