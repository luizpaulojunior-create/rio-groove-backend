const fs = require('fs');
const { Client } = require('pg');

async function checkConstraint() {
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

    // Get all check constraints for the orders table
    const query = `
      SELECT conname, pg_get_constraintdef(oid) AS def 
      FROM pg_constraint 
      WHERE conrelid = 'orders'::regclass
    `;
    const res = await client.query(query);
    
    console.log('CONSTRAINTS:');
    res.rows.forEach(row => {
      console.log(`- ${row.conname}: ${row.def}`);
    });

    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkConstraint();