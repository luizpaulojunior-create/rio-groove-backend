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
