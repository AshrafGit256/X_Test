const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function test() {
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL!');
    
    const res = await client.query('SELECT current_database(), current_user');
    console.log('Database:', res.rows[0].current_database);
    console.log('User:', res.rows[0].current_user);
    
    await client.end();
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    console.log('Trying to connect to default "postgres" database...');
    
    // Try connecting to default postgres database
    const client2 = new Client({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: 'postgres',  // Default database
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    });
    
    try {
      await client2.connect();
      console.log('✅ Connected to default "postgres" database');
      await client2.end();
    } catch (err2) {
      console.error('❌ Even default connection failed:', err2.message);
    }
  }
}

test();