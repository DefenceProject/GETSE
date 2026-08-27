require('dotenv').config();
const { Client } = require('pg');

const run = async () => {
  const client = new Client({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'getse_db',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5433,
  });

  try {
    await client.connect();
    
    await client.query(`
      ALTER TABLE books 
      ADD COLUMN patent_url VARCHAR(255);
    `);

    console.log('Successfully added patent_url to books table!');
  } catch (err) {
    if (err.code === '42701') {
      console.log('Column patent_url already exists.');
    } else {
      console.error('Error:', err);
    }
  } finally {
    await client.end();
  }
};

run();
