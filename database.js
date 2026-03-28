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

    // Add new columns safely for the new features (Tags & Next Appointment)
    try {
      await pool.query('ALTER TABLE patients ADD COLUMN tags JSONB DEFAULT \'[]\'::jsonb');
      console.log('Added tags column to patients table');
    } catch (err) {
      // 42701 is the Postgres error code for "duplicate_column"
      if (err.code !== '42701') console.error('Error adding tags column:', err);
    }

    try {
      await pool.query('ALTER TABLE patients ADD COLUMN next_appointment TIMESTAMP');
      console.log('Added next_appointment column to patients table');
    } catch (err) {
      if (err.code !== '42701') {
         console.error('Error adding next_appointment column:', err);
      } else {
         // Si ya existía (probablemente como DATE), lo convertimos a TIMESTAMP para soportar horas
         try {
           await pool.query('ALTER TABLE patients ALTER COLUMN next_appointment TYPE TIMESTAMP');
         } catch(e) {}
      }
    }

    console.log('PostgreSQL Database initialized successfully');
  } catch (err) {
    console.error('Error initializing PostgreSQL database:', err);
  }
};

initDB();

module.exports = pool;
