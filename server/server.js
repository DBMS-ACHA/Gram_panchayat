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

app.post('/api/auth/login', async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ message: 'Please provide username, password and role' });
  }

  try {
    // Query for the user with matching credentials and role
    const userQuery = 'SELECT * FROM users WHERE username = $1 AND role = $2';
    const userResult = await Pool.query(userQuery, [username, role]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid username or role' });
    }

    const user = userResult.rows[0];

    // In a real app, you would compare hashed passwords
    // This is a simplified example
    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Generate a simple token (in production, use JWT)
    const token = Buffer.from(`${username}-${role}-${Date.now()}`).toString('base64');

    res.json({
      message: 'Login successful',
      token,
      role,
      username
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error during login' });
  }
});

app.get('/citizen/assets', async (req, res) => {
  const { filter, sort } = req.query;
  let query = 'SELECT * FROM assets';

  if (filter) {
    query += ` WHERE location ILIKE '%${filter}%' OR type ILIKE '%${filter}%'`;
  }

  if (sort) {
    query += ` ORDER BY ${sort}`;
  }

  try {
    const assetData = await Pool.query(query);
    res.json(assetData.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

app.get('/citizen/census', async (req, res) => {
  const { filter, sort } = req.query;
  let query = 'SELECT * FROM census_data, citizens WHERE census_data.citizen_id = citizens.citizen_id';

  if (filter) {
    query += ` WHERE event_type ILIKE '%${filter}%'`;
  }

  if(sort) {
    query += ` ORDER BY ${sort}`;
  }

  try {
    const censusData = await Pool.query(query);
    res.json(censusData.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

app.get('/citizen/land-records', async (req, res) => {
  const { filter, sort } = req.query;
  let query = 'SELECT * FROM land_records, citizens WHERE land_records.citizen_id = citizens.citizen_id';

  if (filter) {
    query += ` WHERE crop_type ILIKE '%${filter}%'`;
  }

  if (sort) {
    query += ` ORDER BY ${sort}`;
  }

  try {
    const landRecords = await Pool.query(query);
    res.json(landRecords.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});