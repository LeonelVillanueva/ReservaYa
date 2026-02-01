const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Cliente para operaciones normales (con RLS)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente admin para operaciones sin RLS (usar con cuidado)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

module.exports = { supabase, supabaseAdmin };
