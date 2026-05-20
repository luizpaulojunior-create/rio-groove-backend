const fs = require('fs');
const { Client } = require('pg');

async function applyFix() {
  try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const match = envContent.match(/DATABASE_URL=(.*)/);
    
    if (!match) {
      console.error('DATABASE_URL not found in .env');
      return;
    }

    const client = new Client({ connectionString: match[1].trim() });
    await client.connect();

    console.log('Connected to DB');

    const sql = fs.readFileSync('../../rio-groove-admin/fix_orders_status_constraint.sql', 'utf8');
    
    console.log('Applying constraint fix...');
    await client.query(sql);
    
    console.log('Constraint updated successfully.');
    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

applyFix();
