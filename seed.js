const db = require('./database'); // This initializes the tables

console.log('Clearing existing data...');
db.exec('DELETE FROM consultations');
db.exec('DELETE FROM patients');

console.log('Seeding patients...');
const insertPatient = db.prepare('INSERT INTO patients (first_name, last_name, age, height, goal) VALUES (?, ?, ?, ?, ?)');

const p1 = insertPatient.run('María', 'González', 34, 1.65, 'Bajar 5kg y mejorar energía');
const p2 = insertPatient.run('Carlos', 'López', 45, 1.78, 'Aumentar masa muscular');
const p3 = insertPatient.run('Ana', 'Martínez', 28, 1.60, 'Mantener peso y comer más sano');

console.log('Seeding consultations...');
const insertConsultation = db.prepare(`INSERT INTO consultations (patient_id, date, weight, bmi, notes) VALUES (?, datetime('now', ?), ?, ?, ?)`);

// Patient 1
insertConsultation.run(p1.lastInsertRowid, '-2 months', 72.5, +(72.5 / (1.65 * 1.65)).toFixed(2), 'Primera consulta. Paciente motivada.');
insertConsultation.run(p1.lastInsertRowid, '-1 months', 70.0, +(70.0 / (1.65 * 1.65)).toFixed(2), 'Buen progreso con la dieta baja en carbos.');
insertConsultation.run(p1.lastInsertRowid, '0 months', 68.5, +(68.5 / (1.65 * 1.65)).toFixed(2), 'Alcanzando meta. Ajuste en porciones.');

// Patient 2
insertConsultation.run(p2.lastInsertRowid, '-1 months', 82.0, +(82.0 / (1.78 * 1.78)).toFixed(2), 'Inicio de rutina de fuerza. Dieta hipercalórica recomendada.');

console.log('Seed complete!');
db.close();
