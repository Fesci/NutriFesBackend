const express = require('express');
const db = require('./database');

const router = express.Router();

/**
 * PATIENTS ENDPOINTS
 */

// List all patients
router.get('/patients', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM patients ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new patient
router.post('/patients', async (req, res) => {
  const { first_name, last_name, age, height, goal, phone } = req.body;
  if (!first_name || !last_name || !age || !height) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Chequear duplicidad
    const existing = await db.query(
      'SELECT id FROM patients WHERE first_name = $1 AND last_name = $2 AND age = $3', 
      [first_name, last_name, parseInt(age)]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Ya existe un paciente registrado con ese mismo nombre, apellido y edad.' });
    }
    const result = await db.query(
      'INSERT INTO patients (first_name, last_name, age, height, goal, phone) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [first_name, last_name, parseInt(age), parseFloat(height), goal || null, phone || null]
    );
    res.status(201).json({ id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single patient
router.get('/patients/:id', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM patients WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Patient not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a patient's goal
router.put('/patients/:id/goal', async (req, res) => {
  const { goal } = req.body;
  try {
    await db.query('UPDATE patients SET goal = $1 WHERE id = $2', [goal, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * CONSULTATIONS ENDPOINTS
 */

// Get history of consultations for a patient
router.get('/patients/:id/consultations', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM consultations WHERE patient_id = $1 ORDER BY date DESC', [req.params.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new consultation
router.post('/patients/:id/consultations', async (req, res) => {
  const patient_id = req.params.id;
  const { weight, notes, date } = req.body;

  if (!weight) {
    return res.status(400).json({ error: 'Weight is required' });
  }

  try {
    const patientResult = await db.query('SELECT height FROM patients WHERE id = $1', [patient_id]);
    if (patientResult.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const height = patientResult.rows[0].height;
    // Soporte para alturas en cm (ej. 175) o en metros (ej. 1.75)
    const heightInMeters = height > 3 ? height / 100 : height;
    const bmi = parseFloat(weight) / (heightInMeters * heightInMeters);

    let result;
    if (date) {
      result = await db.query(
        'INSERT INTO consultations (patient_id, date, weight, bmi, notes) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [patient_id, date, weight, bmi.toFixed(2), notes || null]
      );
    } else {
      // Forzar fecha de Buenos Aires (GMT-3) si no se provee desde Frontend
      result = await db.query(
        "INSERT INTO consultations (patient_id, date, weight, bmi, notes) VALUES ($1, CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'America/Argentina/Buenos_Aires', $2, $3, $4) RETURNING id",
        [patient_id, weight, bmi.toFixed(2), notes || null]
      );
    }
    
    res.status(201).json({ id: result.rows[0].id, bmi: bmi.toFixed(2) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
