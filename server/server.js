const express = require('express');
const cors = require('cors');
require('dotenv').config();
const Pool = require('./config/db');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

const app = express();
// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Replace with your frontend URL
  credentials: true
}));
app.use(express.json());

Pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Database connected successfully');
    console.log('Current database time:', res.rows[0].now);
  }
});

app.use(cookieParser());

const verifyToken = (req, res, next) => {
  // First check authorization header
  const bearerHeader = req.headers['authorization'];
  
  // Then check cookies
  const cookieToken = req.cookies.token;
  
  // Use either the bearer token or cookie token
  const token = bearerHeader ? bearerHeader.split(' ')[1] : cookieToken;
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const PORT = process.env.PORT || 3535;

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

    // Generate a JWT token
    const token = jwt.sign({ "username": username,"role": role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    //update in the table for the last login and the refresh token
    const updateQuery = 'UPDATE users SET last_login = NOW(), refresh_token = $1 WHERE username = $2';
    await Pool.query(updateQuery, [token, username]);

    res.cookie('token', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
    console.log('Login successful');
    console.log('Token:', token);
    console.log('Role:', role);
    console.log('Username:', username);
    console.log('cookie:', res.cookie);
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

app.get('/citizen/profile', verifyToken, async (req, res) => {
  try {
    const username = req.user.username;

    const citizenData = await Pool.query(
      `SELECT citizen_id from users WHERE username = $1`,
      [username]
    );
    if(citizenData.rows.length === 0) {
      return res.status(404).json({ error: 'Citizen not found' });
    }

    const citizenId = citizenData.rows[0].citizen_id;

    // Comprehensive query joining multiple tables to get all citizen information
    const query = `
      SELECT 
        c.citizen_id,
        c.name,
        c.gender,
        c.dob,
        c.educational_qualification,
        h.household_id,
        h.address,
        h.income,
        u.username,
        u.role,
        u.last_login,
        (
          SELECT json_agg(json_build_object(
            'land_id', lr.land_id,
            'area_acres', lr.area_acres,
            'crop_type', lr.crop_type
          ))
          FROM land_records lr
          WHERE lr.citizen_id = c.citizen_id
        ) AS land_records,
        (
          SELECT json_agg(json_build_object(
            'employee_id', pe.employee_id,
            'role', pe.role
          ))
          FROM panchayat_employees pe
          WHERE pe.citizen_id = c.citizen_id
        ) AS employment_details,
        (
          SELECT json_agg(json_build_object(
            'vaccination_id', v.vaccination_id,
            'vaccine_type', v.vaccine_type,
            'date_administered', v.date_administered
          ))
          FROM vaccinations v
          WHERE v.citizen_id = c.citizen_id
        ) AS vaccination_history,
        (
          SELECT json_agg(json_build_object(
            'enrollment_id', se.enrollment_id,
            'scheme_id', ws.scheme_id,
            'scheme_name', ws.name,
            'description', ws.description,
            'enrollment_date', se.enrollment_date,
            'status', ws.status,
            'expiry_date', ws.expiry_date
          ))
          FROM scheme_enrollments se
          JOIN welfare_schemes ws ON se.scheme_id = ws.scheme_id
          WHERE se.citizen_id = c.citizen_id
        ) AS enrolled_schemes,
        (
          SELECT json_agg(json_build_object(
            'scheme_id', ws.scheme_id,
            'scheme_name', ws.name,
            'description', ws.description
          ))
          FROM scheme_applications sa
          JOIN welfare_schemes ws ON sa.scheme_id = ws.scheme_id
          WHERE sa.citizen_id = c.citizen_id
        ) AS scheme_applications,
        (
          SELECT json_agg(json_build_object(
            'event_type', cd.event_type,
            'event_date', cd.event_date
          ))
          FROM census_data cd
          WHERE cd.citizen_id = c.citizen_id
        ) AS census_events,
        (
          SELECT json_agg(json_build_object(
            'citizen_id', other.citizen_id,
            'name', other.name,
            'gender', other.gender,
            'dob', other.dob,
            'educational_qualification', other.educational_qualification
          ))
          FROM citizens other
          WHERE other.household_id = c.household_id AND other.citizen_id != c.citizen_id
        ) AS family_members
      FROM citizens c
      LEFT JOIN households h ON c.household_id = h.household_id
      LEFT JOIN users u ON c.citizen_id = u.citizen_id
      WHERE c.citizen_id = $1
    `;
    
    const result = await Pool.query(query, [citizenId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Citizen not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching citizen profile:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Authentication verification endpoint
app.get('/api/auth/verify', verifyToken, (req, res) => {
  // If verifyToken middleware passes, the user is authenticated
  res.status(200).json({ 
    authenticated: true,
    user: {
      username: req.user.username,
      role: req.user.role
    }
  });
});

app.post('/api/auth/logout', verifyToken, (req, res) => {
  // Clear the refresh token from the database
  const username = req.user.username;
  const query = 'UPDATE users SET refresh_token = NULL WHERE username = $1';
  Pool.query(query, [username]);
  res.clearCookie('token', {
    httpOnly: true,
  });
  res.status(200).json({ message: 'Logged out successfully' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});