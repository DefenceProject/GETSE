const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const commonPasswords = ['password', 'postgres', 'admin', 'root', '1234', '123456', ''];
let successfulPassword = null;
let client = null;

const run = async () => {
  console.log('Attempting to connect to PostgreSQL...');
  
  for (const password of commonPasswords) {
    try {
      console.log(`Trying password: "${password || '(empty)'}"...`);
      client = new Client({
        user: 'postgres',
        host: 'localhost',
        database: 'postgres', // Connect to default db first
        password: password,
        port: 5433,
      });
      await client.connect();
      successfulPassword = password;
      console.log('✓ Successfully connected to PostgreSQL server!');
      break;
    } catch (err) {
      // Continue trying next password
      if (client) {
        try { await client.end(); } catch (e) {}
      }
    }
  }

  if (successfulPassword === null) {
    console.error('✗ Failed to connect with common passwords. Please create a backend/.env file manually and set your DB_PASSWORD.');
    process.exit(1);
  }

  try {
    // Check if getse_db exists
    console.log('Checking if "getse_db" database exists...');
    const dbCheck = await client.query("SELECT 1 FROM pg_database WHERE datname = 'getse_db'");
    if (dbCheck.rows.length === 0) {
      console.log('Database "getse_db" does not exist. Creating it...');
      // CREATE DATABASE cannot run inside a transaction block, so we run it directly
      await client.query('CREATE DATABASE getse_db');
      console.log('✓ Created "getse_db" database.');
    } else {
      console.log('✓ Database "getse_db" already exists.');
    }
    await client.end();

    // Now connect to getse_db
    console.log('Connecting to "getse_db" database...');
    const dbClient = new Client({
      user: 'postgres',
      host: 'localhost',
      database: 'getse_db',
      password: successfulPassword,
      port: 5433,
    });
    await dbClient.connect();

    // Read and run schema.sql
    console.log('Reading schema.sql...');
    const schemaPath = path.join(__dirname, '..', 'models', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Applying database schema...');
    // Split by semicolons (simple parser, ignoring comments)
    const queries = schemaSql
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0 && !q.startsWith('--'));

    for (const query of queries) {
      await dbClient.query(query);
    }
    console.log('✓ Database schema applied successfully.');

    // Seed database
    console.log('Seeding database tables...');
    // Truncate tables first
    await dbClient.query('TRUNCATE TABLE recommendations, purchases, books, users CASCADE');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    // Insert Users
    const usersQuery = `
      INSERT INTO users (username, email, password_hash, role)
      VALUES 
        ($1, $2, $3, $4), -- Author
        ($5, $6, $3, $7), -- Reader
        ($8, $9, $3, $10)  -- Admin
      RETURNING id, username, role;
    `;
    const userValues = [
      'kebede_author', 'kebede@getse.com', passwordHash, 'AUTHOR',
      'almaz_reader', 'almaz@getse.com', 'READER',
      'admin_user', 'admin@getse.com', 'ADMIN'
    ];
    const userResult = await dbClient.query(usersQuery, userValues);
    const users = userResult.rows;
    const author = users.find(u => u.role === 'AUTHOR');
    const reader = users.find(u => u.role === 'READER');
    console.log(`✓ Seeded users: ${users.map(u => `${u.username} (${u.role})`).join(', ')}`);

    // Insert Books
    const books = [
      {
        title: 'Fikir Eske Mekabir',
        description: 'በሃዲስ ዓለማየሁ የተጻፈ፣ የፊውዳሉን ስርዓት ማህበራዊ መሰናክሎች እና የተከለከለ ፍቅርን የሚዳስስ ድንቅ የኢትዮጵያ የፍቅር ታሪክ ልቦለድ።',
        cover_image_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400',
        file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        price: 150.00,
        language: 'Amharic'
      },
      {
        title: 'Oromay',
        description: 'በበዓሉ ግርማ የተጻፈ፣ በኤርትራ የቀይ ኮከብ ዘመቻ ጊዜ የተፈጸመውን የጦርነት ሰብአዊ ኪሳራና የፖለቲካ ሴራ የሚያሳይ ድንቅ ታሪክ።',
        cover_image_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400',
        file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        price: 120.00,
        language: 'Amharic'
      },
      {
        title: 'The River Between',
        description: 'Ngugi wa Thiong\'o\'s classic novel depicting the struggle between traditional Gikuyu values and Christian/colonial influences.',
        cover_image_url: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=400',
        file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        price: 200.00,
        language: 'English'
      },
      {
        title: 'Chaltu as a Soldier',
        description: 'A captivating historical fiction following an Ethiopian female combatant during the resistance against Italian occupation.',
        cover_image_url: 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&q=80&w=400',
        file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        price: 100.00,
        language: 'English'
      }
    ];

    for (const book of books) {
      await dbClient.query(
        `INSERT INTO books (author_id, title, description, cover_image_url, file_url, patent_url, price, language)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [author.id, book.title, book.description, book.cover_image_url, book.file_url, null, book.price, book.language]
      );
    }
    console.log('✓ Seeded books successfully.');

    // Seed a purchase
    const bookResult = await dbClient.query('SELECT id FROM books WHERE title = $1', ['Fikir Eske Mekabir']);
    if (bookResult.rows[0]) {
      await dbClient.query(
        'INSERT INTO purchases (user_id, book_id) VALUES ($1, $2)',
        [reader.id, bookResult.rows[0].id]
      );
      console.log('✓ Seeded purchase of Fikir Eske Mekabir for reader almaz.');
    }

    await dbClient.end();
    console.log('✓ Database seeding complete.');

    // Create .env file
    console.log('Writing backend/.env file...');
    const envPath = path.join(__dirname, '..', '.env');
    const envContent = `PORT=5000
DB_USER=postgres
DB_HOST=localhost
DB_NAME=getse_db
DB_PASSWORD=${successfulPassword}
DB_PORT=5433
JWT_SECRET=development_secret_key_getse_2026
NODE_ENV=development
`;
    fs.writeFileSync(envPath, envContent);
    console.log('✓ Successfully wrote backend/.env file!');
    process.exit(0);
  } catch (err) {
    console.error('Error during database initialization:', err);
    process.exit(1);
  }
};

run();
