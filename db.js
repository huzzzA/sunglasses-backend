require('dotenv').config(); // Load environment variables

const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DATABASE_USER,
  host: process.env.DATABASE_HOST,
  database: process.env.DATABASE_NAME,
  password: process.env.DATABASE_PASSWORD,
  port: process.env.DATABASE_PORT,
  ssl: {
    rejectUnauthorized: false, // Required for cloud databases like Render
  },
});

pool.connect()
  .then(() => console.log("✅ Connected to the database"))
  .catch((err) => console.error("❌ Database connection error:", err));

  
module.exports = pool;