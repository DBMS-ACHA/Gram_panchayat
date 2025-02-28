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
  // get the data from the database from household table
  try{
    const householdData = await Pool.query(
      'SELECT * FROM households'
    );
    res.json(householdData.rows);
  }catch(err){
    console.error(err.message);
  }
});

// Add the new vaccinations endpoint
app.get('/citizen/vaccinations', async (req, res) => {
  try {
    const vaccinationData = await Pool.query(
      'SELECT * FROM vaccinations'
    );
    res.json(vaccinationData.rows);
  } catch (err) {
    console.error('Error fetching vaccination records:', err.message);
    res.status(500).json({ error: 'Failed to fetch vaccination records' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});