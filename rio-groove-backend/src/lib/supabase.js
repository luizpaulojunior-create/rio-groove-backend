/**
 * Cliente Supabase único do backend (service role). Toda leitura/escrita de Postgres e Storage
 * deve usar este módulo — exceção conhecida: stock.service.js (duplicado, ver ARCHITECTURE.md).
 */
const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');
const env = require('../config/env');

const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  },
  realtime: {
    transport: WebSocket
  }
});

module.exports = supabase;
