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
      UPDATE books 
      SET description = 'በሃዲስ ዓለማየሁ የተጻፈ፣ የፊውዳሉን ስርዓት ማህበራዊ መሰናክሎች እና የተከለከለ ፍቅርን የሚዳስስ ድንቅ የኢትዮጵያ የፍቅር ታሪክ ልቦለድ።' 
      WHERE title = 'Fikir Eske Mekabir';
    `);

    await client.query(`
      UPDATE books 
      SET description = 'በበዓሉ ግርማ የተጻፈ፣ በኤርትራ የቀይ ኮከብ ዘመቻ ጊዜ የተፈጸመውን የጦርነት ሰብአዊ ኪሳራና የፖለቲካ ሴራ የሚያሳይ ድንቅ ታሪክ።' 
      WHERE title = 'Oromay';
    `);

    console.log('Descriptions updated successfully!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
};

run();
