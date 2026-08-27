const bcrypt = require('bcryptjs');
const db = require('../config/db');

const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');

    // 1. Clean existing data
    console.log('Cleaning existing tables...');
    await db.query('TRUNCATE TABLE recommendations, purchases, books, users CASCADE');

    // 2. Hash default passwords
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    // 3. Insert Users
    console.log('Seeding users...');
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
      'almaz_reader', 'almaz@getse.com', passwordHash, 'READER',
      'admin_user', 'admin@getse.com', passwordHash, 'ADMIN'
    ];
    const userResult = await db.query(usersQuery, userValues);
    const users = userResult.rows;

    const author = users.find(u => u.role === 'AUTHOR');
    const reader = users.find(u => u.role === 'READER');

    console.log(`Seeded users: ${users.map(u => `${u.username} (${u.role})`).join(', ')}`);

    // 4. Insert Books
    console.log('Seeding books...');
    const books = [
      {
        title: 'Fikir Eske Mekabir',
        description: 'Classic Ethiopian romantic drama novel by Haddis Alemayehu, exploring feudal-era social barriers and forbidden love.',
        cover_image_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400',
        file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', // Using a valid public dummy PDF for easy testing
        price: 150.00,
        language: 'Amharic'
      },
      {
        title: 'Oromay',
        description: 'A masterpiece by Baalu Girma set during the Red Star Campaign in Eritrea, detailing the human cost and political intrigue of war.',
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
      await db.query(
        `INSERT INTO books (author_id, title, description, cover_image_url, file_url, price, language)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [author.id, book.title, book.description, book.cover_image_url, book.file_url, book.price, book.language]
      );
    }
    console.log('Seeded books successfully.');

    // 5. Seed a purchase for the reader (so they have one book owned)
    console.log('Seeding initial purchases...');
    const bookResult = await db.query('SELECT id FROM books WHERE title = $1', ['Fikir Eske Mekabir']);
    if (bookResult.rows[0]) {
      await db.query(
        'INSERT INTO purchases (user_id, book_id) VALUES ($1, $2)',
        [reader.id, bookResult.rows[0].id]
      );
      console.log('Seeded initial purchase of Fikir Eske Mekabir for reader almaz.');
    }

    console.log('Database seeding finished successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
