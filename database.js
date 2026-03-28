const { Pool } = require('pg');
require('dotenv').config();

// We use the DATABASE_URL environment variable if provided
// Otherwise, fallback to a local postgres instance (default testing).
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/nutritionist';

const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Create tables
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS patients (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        age INTEGER NOT NULL,
        height REAL NOT NULL,
        goal TEXT,
        phone VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS consultations (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        weight REAL NOT NULL,
        bmi REAL NOT NULL,
        notes TEXT
      );
    `);
    console.log('PostgreSQL Database initialized successfully');
  } catch (err) {
    console.error('Error initializing PostgreSQL database:', err);
  }
};

initDB();

module.exports = pool;
