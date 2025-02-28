const express = require('express');
const cors = require('cors');
require('dotenv').config();
const Pool = require('./config/db');

Pool.query('SELECT NOW()', (err, res) => {
  if (err) {
      console.error('Database connection error:', err.message);
  } else {
      console.log('Database connected successfully');
      console.log('Current database time:', res.rows[0].now);
  }
});

const app = express();
const PORT = process.env.PORT || 3535;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('Gram Panchayat Management System API');
});

app.get('/citizen/household-info', async (req, res) => {
  const { filter, sort } = req.query;
  let query = 'SELECT * FROM households';
  
  if (filter) {
    query += ` WHERE address ILIKE '%${filter}%' OR income::text ILIKE '%${filter}%'`;
  }
  
  if (sort) {
    query += ` ORDER BY ${sort}`;
  }

  try {
    const householdData = await Pool.query(query);
    res.json(householdData.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Add the new vaccinations endpoint
app.get('/citizen/vaccinations', async (req, res) => {
  try {
    const vaccinationData = await Pool.query(
      `SELECT 
      v.vaccine_type,
      v.date_administered,
      c.name as citizen_name,
      c.gender
      FROM vaccinations v
      JOIN citizens c ON v.citizen_id = c.citizen_id`
    );
    res.json(vaccinationData.rows);
  } catch (err) {
    console.error('Error fetching vaccination records:', err.message);
    res.status(500).json({ error: 'Failed to fetch vaccination records' });
  }
});

app.get('/citizen/employees', async (req, res) => {
  const { filter, sort } = req.query;
  let query = 'SELECT * FROM panchayat_employees, citizens WHERE panchayat_employees.citizen_id = citizens.citizen_id';
  
  if (filter) {
    query += ` WHERE name ILIKE '%${filter}%'`;
  }
  
  if (sort) {
    query += ` ORDER BY ${sort}`;
  }

  try {
    const employeeData = await Pool.query(query);
    res.json(employeeData.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});