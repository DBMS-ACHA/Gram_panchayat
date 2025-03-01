const express = require('express');
const cors = require('cors');
require('dotenv').config();
const Pool = require('./config/db');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const householdRouter = require('./routes/citizenHouseholdInfo');
const verifyToken = require('./middleware/verifyJWT');

const app = express();

app.use(cors({
  origin: ['http://localhost:3000', 'http://10.145.96.128:3000'],
  credentials: true
}));
app.use(express.json());

app.use(cookieParser());

const PORT = process.env.PORT || 3535;

// Routes
app.get('/', (req, res) => {
  res.send('Gram Panchayat Management System API');
});

app.use('/', householdRouter);
app.use('/', require('./routes/VillageStats'));
app.use('/', require('./routes/citizenVaccinations'));
app.use('/', require('./routes/monitorVaccinations'));
app.use('/', require('./routes/employeeLandRecords'));

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
    const token = jwt.sign({ "username": username, "role": role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    //update in the table for the last login and the refresh token
    const updateQuery = 'UPDATE users SET last_login = NOW(), refresh_token = $1 WHERE username = $2';
    await Pool.query(updateQuery, [token, username]);

    res.cookie('token', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });

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

  if (sort) {
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
    if (citizenData.rows.length === 0) {
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
        c.income,
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

// Get all welfare schemes
app.get('/citizen/schemes', verifyToken, async (req, res) => {
  try {
    const schemesQuery = `
      SELECT 
        scheme_id, 
        name, 
        description, 
        status, 
        expiry_date 
      FROM welfare_schemes
      ORDER BY status DESC, expiry_date DESC
    `;

    const schemesData = await Pool.query(schemesQuery);
    res.json(schemesData.rows);
  } catch (err) {
    console.error('Error fetching welfare schemes:', err.message);
    res.status(500).json({ error: 'Failed to fetch welfare schemes' });
  }
});

// Apply for a scheme
app.post('/citizen/schemes/apply', verifyToken, async (req, res) => {
  const { schemeId } = req.body;
  const username = req.user.username;

  const citizenQuery = 'SELECT citizen_id FROM users WHERE username = $1';
  const citizenResult = await Pool.query(citizenQuery, [username]);

  if (citizenResult.rows.length === 0) {
    return res.status(404).json({ message: 'Citizen not found' });
  }

  const citizenId = citizenResult.rows[0].citizen_id;

  if (!schemeId) {
    return res.status(400).json({ message: 'Scheme ID is required' });
  }

  try {
    // Check if scheme exists and is active
    const schemeQuery = `
      SELECT * FROM welfare_schemes 
      WHERE scheme_id = $1 AND status = true 
      AND (expiry_date IS NULL OR expiry_date > NOW())
    `;
    const schemeResult = await Pool.query(schemeQuery, [schemeId]);

    if (schemeResult.rows.length === 0) {
      return res.status(404).json({ message: 'Scheme not found or not active' });
    }

    // Check if user has already applied for this scheme
    const existingApplicationQuery = `
      SELECT * FROM scheme_applications 
      WHERE citizen_id = $1 AND scheme_id = $2
    `;
    const existingApplication = await Pool.query(existingApplicationQuery, [citizenId, schemeId]);

    if (existingApplication.rows.length > 0) {
      return res.status(400).json({ message: 'You have already applied for this scheme' });
    }

    // Submit the application
    const insertQuery = `
      INSERT INTO scheme_applications (citizen_id, scheme_id, application_date, status) 
      VALUES ($1, $2, NOW(), 'pending') 
    `;
    const newApplication = await Pool.query(insertQuery, [citizenId, schemeId]);

    res.status(201).json({
      message: 'Application submitted successfully'
    });
  } catch (err) {
    console.error('Error applying for scheme:', err.message);
    res.status(500).json({ message: 'Server error while submitting application' });
  }
});

// Get citizen's scheme applications
app.get('/citizen/applications', verifyToken, async (req, res) => {
  try {

    const username = req.user.username;

    const citizenQuery = 'SELECT citizen_id FROM users WHERE username = $1';
    const citizenResult = await Pool.query(citizenQuery, [username]);

    if (citizenResult.rows.length === 0) {
      return res.status(404).json({ message: 'Citizen not found' });
    }

    const citizenId = citizenResult.rows[0].citizen_id;

    if (!citizenId) {
      return res.status(400).json({ error: 'Citizen ID not found in token' });
    }

    const applicationsQuery = `
      SELECT 
        sa.citizen_id,
        sa.scheme_id,
        sa.application_date,
        sa.status,
        ws.name AS scheme_name,
        ws.description,
        ws.expiry_date
      FROM scheme_applications sa
      JOIN welfare_schemes ws ON sa.scheme_id = ws.scheme_id
      WHERE sa.citizen_id = $1
      ORDER BY sa.application_date DESC
    `;

    const applications = await Pool.query(applicationsQuery, [citizenId]);
    res.json(applications.rows);
  } catch (err) {
    console.error('Error fetching citizen applications:', err.message);
    res.status(500).json({ error: 'Failed to fetch applications' });
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

// Add this route to your existing auth.js file

// Verify user role
app.get('/auth/verify-role', verifyToken, (req, res) => {
  try {
    res.json({ role: req.user.role });
  } catch (err) {
    console.error('Error verifying role:', err.message);
    res.status(401).json({ error: 'Authentication failed' });
  }
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

// Get all land records for monitor
app.get('/monitor/land-records', verifyToken, async (req, res) => {
  try {
    // Verify the user is a monitor
    if (req.user.role !== 'monitor') {
      return res.status(403).json({ error: 'Access denied. Only monitors can view this resource.' });
    }

    const query = `
      SELECT 
        l.land_id, 
        l.area_acres, 
        l.crop_type,
        c.citizen_id,
        c.name AS owner_name, 
        c.household_id
      FROM land_records l
      JOIN citizens c ON l.citizen_id = c.citizen_id
      ORDER BY l.land_id
    `;

    const result = await Pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching land records:', err.message);
    res.status(500).json({ error: 'Failed to fetch land records' });
  }
});

// Get all assets for monitor
app.get('/monitor/asset-tracking', verifyToken, async (req, res) => {
  try {
    // Verify the user is a monitor
    if (req.user.role !== 'monitor') {
      return res.status(403).json({ error: 'Access denied. Only monitors can view this resource.' });
    }

    const query = `
      SELECT 
        asset_id, 
        type,
        location,
        installation_date
      FROM assets
      ORDER BY asset_id
    `;

    const result = await Pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching assets:', err.message);
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

// Get individual citizen profile for monitor
app.get('/monitor/citizen/:id', verifyToken, async (req, res) => {
  try {
    // Verify the user is a monitor
    if (req.user.role !== 'monitor' && req.user.role !== 'employee') {
      return res.status(403).json({ error: 'Access denied. Only monitors can view this resource.' });
    }
    
    const citizenId = req.params.id;
    
    // Validate citizen ID is a number
    if (!citizenId || isNaN(Number(citizenId))) {
      return res.status(400).json({ error: 'Invalid citizen ID. Must be a number.' });
    }
    
    const query = `
      SELECT 
        c.citizen_id,
        c.name,
        c.gender,
        c.dob,
        c.income,
        c.educational_qualification,
        h.household_id,
        h.address,
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
      WHERE c.citizen_id = $1
    `;
    
    const result = await Pool.query(query, [citizenId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Citizen not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching citizen profile:', err.message);
    res.status(500).json({ error: 'Failed to fetch citizen profile' });
  }
});

// Get census data for monitor
app.get('/monitor/census', verifyToken, async (req, res) => {
  try {
    // Verify the user is a monitor
    if (req.user.role !== 'monitor') {
      return res.status(403).json({ error: 'Access denied. Only monitors can view this resource.' });
    }
    
    const query = `
      SELECT 
        cd.household_id,
        cd.citizen_id,
        cd.event_type,
        cd.event_date,
        c.name AS citizen_name,
        h.address AS household_address
      FROM census_data cd
      LEFT JOIN citizens c ON cd.citizen_id = c.citizen_id
      LEFT JOIN households h ON cd.household_id = h.household_id
      ORDER BY cd.event_date DESC
    `;
    
    const result = await Pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching census data:', err.message);
    res.status(500).json({ error: 'Failed to fetch census data' });
  }
});

app.get('/employee/profile', verifyToken, async (req, res) => {
  try {
    const username = req.user.username;

    const employeeData = await Pool.query(
      `SELECT citizen_id from users WHERE username = $1`,
      [username]
    );
    if (employeeData.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const employeedata = await Pool.query(
      `SELECT employee_id from panchayat_employees WHERE citizen_id = $1`,
      [employeeData.rows[0].citizen_id]
    );
    if (employeedata.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const employeeId = employeedata.rows[0].employee_id;

    // Comprehensive query joining multiple tables to get all employee information
    const query = `
      SELECT 
        e.employee_id,
        e.role,
        c.citizen_id,
        c.name,
        c.gender,
        c.dob,
        c.educational_qualification,
        u.username,
        u.role as user_role,
        u.last_login
      FROM panchayat_employees e
      LEFT JOIN citizens c ON e.citizen_id = c.citizen_id
      LEFT JOIN users u ON e.citizen_id = u.citizen_id
      WHERE e.employee_id = $1
    `;

    const result = await Pool.query(query, [employeeId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching employee profile:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add these routes to your server.js file

// Get all vaccination records with citizen names
app.get('/employee/vaccinations', verifyToken, async (req, res) => {
  try {
    // Verify the user is an employee
    if (req.user.role !== 'employee') {
      return res.status(403).json({ error: 'Access denied. Only employees can view this resource.' });
    }

    const query = `
      SELECT 
        v.vaccination_id, 
        v.citizen_id, 
        v.vaccine_type, 
        v.date_administered,
        c.name
      FROM vaccinations v
      LEFT JOIN citizens c ON v.citizen_id = c.citizen_id
      ORDER BY v.vaccination_id
    `;
    
    const result = await Pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching vaccinations:', err.message);
    res.status(500).json({ error: 'Failed to fetch vaccination records' });
  }
});

// Get a specific vaccination record
app.get('/employee/vaccinations/:id', verifyToken, async (req, res) => {
  try {
    // Verify the user is an employee
    if (req.user.role !== 'employee') {
      return res.status(403).json({ error: 'Access denied. Only employees can view this resource.' });
    }

    const vaccinationId = req.params.id;
    
    const query = `
      SELECT 
        v.vaccination_id, 
        v.citizen_id, 
        v.vaccine_type, 
        v.date_administered,
        c.name
      FROM vaccinations v
      LEFT JOIN citizens c ON v.citizen_id = c.citizen_id
      WHERE v.vaccination_id = $1
    `;
    
    const result = await Pool.query(query, [vaccinationId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vaccination record not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching vaccination record:', err.message);
    res.status(500).json({ error: 'Failed to fetch vaccination record' });
  }
});

// Create a new vaccination record
app.post('/employee/vaccinations', verifyToken, async (req, res) => {
  try {
    // Verify the user is an employee
    if (req.user.role !== 'employee') {
      return res.status(403).json({ error: 'Access denied. Only employees can create vaccination records.' });
    }

    const { citizen_id, vaccine_type, date_administered } = req.body;
    
    // Validate required fields
    if (!citizen_id || !vaccine_type || !date_administered) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Validate citizen exists
    const citizenCheck = await Pool.query('SELECT citizen_id FROM citizens WHERE citizen_id = $1', [citizen_id]);
    if (citizenCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Citizen ID does not exist' });
    }
    
    // Generate a new vaccination ID (or use auto-increment if your DB supports it)
    const maxIdResult = await Pool.query('SELECT MAX(vaccination_id) FROM vaccinations');
    const newId = (maxIdResult.rows[0].max || 0) + 1;
    
    const query = `
      INSERT INTO vaccinations(vaccination_id, citizen_id, vaccine_type, date_administered)
      VALUES($1, $2, $3, $4)
      RETURNING vaccination_id
    `;
    
    const values = [newId, citizen_id, vaccine_type, date_administered];
    const result = await Pool.query(query, values);
    
    // Fetch the complete new record with citizen name
    const newRecordQuery = `
      SELECT 
        v.vaccination_id, 
        v.citizen_id, 
        v.vaccine_type, 
        v.date_administered,
        c.name
      FROM vaccinations v
      LEFT JOIN citizens c ON v.citizen_id = c.citizen_id
      WHERE v.vaccination_id = $1
    `;
    
    const newRecord = await Pool.query(newRecordQuery, [result.rows[0].vaccination_id]);
    
    res.status(201).json(newRecord.rows[0]);
  } catch (err) {
    console.error('Error creating vaccination record:', err.message);
    res.status(500).json({ error: 'Failed to create vaccination record' });
  }
});

// Update a vaccination record
app.put('/employee/vaccinations/:id', verifyToken, async (req, res) => {
  try {
    // Verify the user is an employee
    if (req.user.role !== 'employee') {
      return res.status(403).json({ error: 'Access denied. Only employees can update vaccination records.' });
    }

    const vaccinationId = req.params.id;
    const { citizen_id, vaccine_type, date_administered } = req.body;
    
    // Validate required fields
    if (!citizen_id || !vaccine_type || !date_administered) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Validate citizen exists
    const citizenCheck = await Pool.query('SELECT citizen_id FROM citizens WHERE citizen_id = $1', [citizen_id]);
    if (citizenCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Citizen ID does not exist' });
    }
    
    // Check if vaccination record exists
    const vaccinationCheck = await Pool.query('SELECT vaccination_id FROM vaccinations WHERE vaccination_id = $1', [vaccinationId]);
    if (vaccinationCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Vaccination record not found' });
    }
    
    const query = `
      UPDATE vaccinations
      SET citizen_id = $1, vaccine_type = $2, date_administered = $3
      WHERE vaccination_id = $4
    `;
    
    const values = [citizen_id, vaccine_type, date_administered, vaccinationId];
    await Pool.query(query, values);
    
    // Fetch the updated record with citizen name
    const updatedRecordQuery = `
      SELECT 
        v.vaccination_id, 
        v.citizen_id, 
        v.vaccine_type, 
        v.date_administered,
        c.name
      FROM vaccinations v
      LEFT JOIN citizens c ON v.citizen_id = c.citizen_id
      WHERE v.vaccination_id = $1
    `;
    
    const updatedRecord = await Pool.query(updatedRecordQuery, [vaccinationId]);
    
    res.json(updatedRecord.rows[0]);
  } catch (err) {
    console.error('Error updating vaccination record:', err.message);
    res.status(500).json({ error: 'Failed to update vaccination record' });
  }
});

// Delete a vaccination record
app.delete('/employee/vaccinations/:id', verifyToken, async (req, res) => {
  try {
    // Verify the user is an employee
    if (req.user.role !== 'employee') {
      return res.status(403).json({ error: 'Access denied. Only employees can delete vaccination records.' });
    }

    const vaccinationId = req.params.id;
    
    // Check if vaccination record exists
    const vaccinationCheck = await Pool.query('SELECT vaccination_id FROM vaccinations WHERE vaccination_id = $1', [vaccinationId]);
    if (vaccinationCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Vaccination record not found' });
    }
    
    const query = `DELETE FROM vaccinations WHERE vaccination_id = $1`;
    await Pool.query(query, [vaccinationId]);
    
    res.json({ message: 'Vaccination record deleted successfully' });
  } catch (err) {
    console.error('Error deleting vaccination record:', err.message);
    res.status(500).json({ error: 'Failed to delete vaccination record' });
  }
});

// Get all citizens (simplified for dropdown)
app.get('/employee/citizens', verifyToken, async (req, res) => {
  try {
    // Verify the user is an employee
    if (req.user.role !== 'employee') {
      return res.status(403).json({ error: 'Access denied. Only employees can view this resource.' });
    }

    const query = `
      SELECT citizen_id, name
      FROM citizens
      ORDER BY name
    `;
    
    const result = await Pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching citizens:', err.message);
    res.status(500).json({ error: 'Failed to fetch citizens' });
  }
});

// Search citizens by name or ID
app.get('/employee/citizens/search', verifyToken, async (req, res) => {
  try {
    // Verify the user is an employee
    if (req.user.role !== 'employee') {
      return res.status(403).json({ error: 'Access denied. Only employees can view this resource.' });
    }

    const searchTerm = req.query.term;
    
    if (!searchTerm) {
      return res.status(400).json({ error: 'Search term is required' });
    }
    
    const query = `
      SELECT citizen_id, name
      FROM citizens
      WHERE 
        name ILIKE $1 OR 
        citizen_id::text LIKE $2
      ORDER BY name
      LIMIT 10
    `;
    
    const values = [`%${searchTerm}%`, `%${searchTerm}%`];
    const result = await Pool.query(query, values);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error searching citizens:', err.message);
    res.status(500).json({ error: 'Failed to search citizens' });
  }
});

// Add these routes to your server.js file

// Get all census records with household and citizen details
app.get('/employee/census', verifyToken, async (req, res) => {
  try {
    // Verify the user is an employee
    if (req.user.role !== 'employee') {
      return res.status(403).json({ error: 'Access denied. Only employees can view this resource.' });
    }

    const query = `
      SELECT 
        cd.household_id,
        cd.citizen_id,
        cd.event_type,
        cd.event_date,
        c.name AS citizen_name,
        h.address AS household_address
      FROM census_data cd
      LEFT JOIN citizens c ON cd.citizen_id = c.citizen_id
      LEFT JOIN households h ON cd.household_id = h.household_id
      ORDER BY cd.event_date DESC
    `;
    
    const result = await Pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching census data:', err.message);
    res.status(500).json({ error: 'Failed to fetch census data' });
  }
});

// Get a specific census record
app.get('/employee/census/:householdId/:citizenId/:eventType/:eventDate', verifyToken, async (req, res) => {
  try {
    // Verify the user is an employee
    if (req.user.role !== 'employee') {
      return res.status(403).json({ error: 'Access denied. Only employees can view this resource.' });
    }

    const { householdId, citizenId, eventType, eventDate } = req.params;
    
    const query = `
      SELECT 
        cd.household_id,
        cd.citizen_id,
        cd.event_type,
        cd.event_date,
        c.name AS citizen_name,
        h.address AS household_address
      FROM census_data cd
      LEFT JOIN citizens c ON cd.citizen_id = c.citizen_id
      LEFT JOIN households h ON cd.household_id = h.household_id
      WHERE cd.household_id = $1 
      AND cd.citizen_id = $2
      AND cd.event_type = $3
      AND cd.event_date::date = $4::date
    `;
    
    const values = [householdId, citizenId, eventType, eventDate];
    const result = await Pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Census record not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching census record:', err.message);
    res.status(500).json({ error: 'Failed to fetch census record' });
  }
});

// Create a new census record
app.post('/employee/census', verifyToken, async (req, res) => {
  try {
    // Verify the user is an employee
    if (req.user.role !== 'employee') {
      return res.status(403).json({ error: 'Access denied. Only employees can create census records.' });
    }

    const { household_id, citizen_id, event_type, event_date } = req.body;
    
    // Validate required fields
    if (!household_id || !citizen_id || !event_type || !event_date) {
      return res.status(400).json({ error: 'All fields are required: household_id, citizen_id, event_type, event_date' });
    }
    
    // Validate event type is one of the allowed values
    const allowedEventTypes = ['birth', 'death', 'marriage', 'migration_in', 'migration_out'];
    if (!allowedEventTypes.includes(event_type.toLowerCase())) {
      return res.status(400).json({ 
        error: `Invalid event type. Must be one of: ${allowedEventTypes.join(', ')}`
      });
    }
    
    // Validate household exists
    const householdCheck = await Pool.query('SELECT household_id FROM households WHERE household_id = $1', [household_id]);
    if (householdCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Household ID does not exist' });
    }
    
    // Validate citizen exists
    const citizenCheck = await Pool.query('SELECT citizen_id FROM citizens WHERE citizen_id = $1', [citizen_id]);
    if (citizenCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Citizen ID does not exist' });
    }
    
    // Check if record already exists
    const existingCheck = await Pool.query(`
      SELECT * FROM census_data 
      WHERE household_id = $1 
      AND citizen_id = $2 
      AND event_type = $3 
      AND event_date::date = $4::date
    `, [household_id, citizen_id, event_type, event_date]);
    
    if (existingCheck.rows.length > 0) {
      return res.status(409).json({ 
        error: 'A census record with these details already exists. Each event can only be recorded once.'
      });
    }
    
    // Perform special validations based on event type
    if (event_type.toLowerCase() === 'death') {
      // Check if person is already marked as deceased
      const deathCheck = await Pool.query(`
        SELECT * FROM census_data 
        WHERE citizen_id = $1 
        AND event_type = 'death'
      `, [citizen_id]);
      
      if (deathCheck.rows.length > 0) {
        return res.status(409).json({ error: 'This citizen is already marked as deceased' });
      }
    }
    
    // Insert the record
    const query = `
      INSERT INTO census_data(household_id, citizen_id, event_type, event_date)
      VALUES($1, $2, $3, $4)
      RETURNING *
    `;
    
    const values = [household_id, citizen_id, event_type, event_date];
    const result = await Pool.query(query, values);
    
    // Get the complete record with citizen and household info
    const completeRecord = await Pool.query(`
      SELECT 
        cd.household_id,
        cd.citizen_id,
        cd.event_type,
        cd.event_date,
        c.name AS citizen_name,
        h.address AS household_address
      FROM census_data cd
      LEFT JOIN citizens c ON cd.citizen_id = c.citizen_id
      LEFT JOIN households h ON cd.household_id = h.household_id
      WHERE cd.household_id = $1 
      AND cd.citizen_id = $2 
      AND cd.event_type = $3 
      AND cd.event_date::date = $4::date
    `, [household_id, citizen_id, event_type, event_date]);
    
    res.status(201).json(completeRecord.rows[0]);
  } catch (err) {
    console.error('Error creating census record:', err.message);
    res.status(500).json({ error: 'Failed to create census record' });
  }
});

// Update a census record
app.put('/employee/census', verifyToken, async (req, res) => {
  try {
    // Verify the user is an employee
    if (req.user.role !== 'employee') {
      return res.status(403).json({ error: 'Access denied. Only employees can update census records.' });
    }

    const { oldEvent, newEvent } = req.body;
    
    // Validate both events have all required fields
    if (!oldEvent || !newEvent) {
      return res.status(400).json({ error: 'Both old and new event details are required' });
    }
    
    const requiredFields = ['household_id', 'citizen_id', 'event_type', 'event_date'];
    for (const field of requiredFields) {
      if (!oldEvent[field] || !newEvent[field]) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }
    
    // Validate event types
    const allowedEventTypes = ['birth', 'death', 'marriage', 'migration_in', 'migration_out'];
    if (!allowedEventTypes.includes(newEvent.event_type.toLowerCase())) {
      return res.status(400).json({ 
        error: `Invalid event type. Must be one of: ${allowedEventTypes.join(', ')}`
      });
    }
    console.log('oldEvent', oldEvent);
    // Validate the old record exists
    const existingCheck = await Pool.query(`
      SELECT * FROM census_data 
      WHERE household_id = $1 
      AND citizen_id = $2 
      AND event_type = $3 
      AND event_date::date = $4::date
    `, [oldEvent.household_id, oldEvent.citizen_id, oldEvent.event_type, oldEvent.event_date]);
    
    if (existingCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Original census record not found' });
    }
    
    // Validate household exists
    const householdCheck = await Pool.query('SELECT household_id FROM households WHERE household_id = $1', [newEvent.household_id]);
    if (householdCheck.rows.length === 0) {
      return res.status(400).json({ error: 'New household ID does not exist' });
    }
    
    // Validate citizen exists
    const citizenCheck = await Pool.query('SELECT citizen_id FROM citizens WHERE citizen_id = $1', [newEvent.citizen_id]);
    if (citizenCheck.rows.length === 0) {
      return res.status(400).json({ error: 'New citizen ID does not exist' });
    }
    
    // Check for conflicts with existing records (if updating to a different combination)
    if (
      oldEvent.household_id !== newEvent.household_id ||
      oldEvent.citizen_id !== newEvent.citizen_id ||
      oldEvent.event_type !== newEvent.event_type ||
      new Date(oldEvent.event_date).toDateString() !== new Date(newEvent.event_date).toDateString()
    ) {
      const conflictCheck = await Pool.query(`
        SELECT * FROM census_data 
        WHERE household_id = $1 
        AND citizen_id = $2 
        AND event_type = $3 
        AND event_date::date = $4::date
      `, [newEvent.household_id, newEvent.citizen_id, newEvent.event_type, newEvent.event_date]);
      
      if (conflictCheck.rows.length > 0) {
        return res.status(409).json({ error: 'A census record with the new details already exists' });
      }
    }
    
    // Delete the old record and insert the new one (since the PK might change)
    await Pool.query(`
      DELETE FROM census_data 
      WHERE household_id = $1 
      AND citizen_id = $2 
      AND event_type = $3 
      AND event_date::date = $4::date
    `, [oldEvent.household_id, oldEvent.citizen_id, oldEvent.event_type, oldEvent.event_date]);
    
    // Insert the new record
    await Pool.query(`
      INSERT INTO census_data(household_id, citizen_id, event_type, event_date)
      VALUES($1, $2, $3, $4)
    `, [newEvent.household_id, newEvent.citizen_id, newEvent.event_type, newEvent.event_date]);
    
    // Get the complete updated record with citizen and household info
    const updatedRecord = await Pool.query(`
      SELECT 
        cd.household_id,
        cd.citizen_id,
        cd.event_type,
        cd.event_date,
        c.name AS citizen_name,
        h.address AS household_address
      FROM census_data cd
      LEFT JOIN citizens c ON cd.citizen_id = c.citizen_id
      LEFT JOIN households h ON cd.household_id = h.household_id
      WHERE cd.household_id = $1 
      AND cd.citizen_id = $2 
      AND cd.event_type = $3 
      AND cd.event_date::date = $4::date
    `, [newEvent.household_id, newEvent.citizen_id, newEvent.event_type, newEvent.event_date]);
    
    res.json(updatedRecord.rows[0]);
  } catch (err) {
    console.error('Error updating census record:', err.message);
    res.status(500).json({ error: 'Failed to update census record' });
  }
});

// Delete a census record

app.delete('/employee/census', verifyToken, async (req, res) => {
  try {
    // Verify the user is an employee
    if (req.user.role !== 'employee') {
      return res.status(403).json({ error: 'Access denied. Only employees can delete census records.' });
    }

    const { household_id, citizen_id, event_type, event_date } = req.body;
    
    // Validate all required parameters
    if (!household_id || !citizen_id || !event_type || !event_date) {
      return res.status(400).json({ error: 'All fields are required for deletion' });
    }
    
    // Check if the record exists with the exact event_date
    const existingCheck = await Pool.query(`
      SELECT * FROM census_data 
      WHERE household_id = $1 
      AND citizen_id = $2 
      AND event_type = $3 
      AND event_date::date = $4::date
    `, [household_id, citizen_id, event_type, event_date]);
    
    if (existingCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Census record not found' });
    }
    
    // Delete the record
    const result = await Pool.query(`
      DELETE FROM census_data 
      WHERE household_id = $1 
      AND citizen_id = $2 
      AND event_type = $3 
      AND event_date::date = $4::date
    `, [household_id, citizen_id, event_type, event_date]);
    
    if (result.rowCount === 0) {
      return res.status(500).json({ error: 'Failed to delete census record' });
    }
    
    res.json({ message: 'Census record deleted successfully' });
  } catch (err) {
    console.error('Error deleting census record:', err.message);
    res.status(500).json({ error: 'Failed to delete census record' });
  }
});

// Get all citizens for dropdown selection
app.get('/employee/citizens', verifyToken, async (req, res) => {
  try {
    // Verify the user is an employee
    if (req.user.role !== 'employee') {
      return res.status(403).json({ error: 'Access denied. Only employees can view this resource.' });
    }

    const query = `
      SELECT 
        c.citizen_id, 
        c.name,
        c.household_id
      FROM citizens c
      ORDER BY c.name
    `;
    
    const result = await Pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching citizens:', err.message);
    res.status(500).json({ error: 'Failed to fetch citizens' });
  }
});

// Get all households for dropdown selection
app.get('/employee/households', verifyToken, async (req, res) => {
  try {
    // Verify the user is an employee
    if (req.user.role !== 'employee') {
      return res.status(403).json({ error: 'Access denied. Only employees can view this resource.' });
    }

    const query = `
      SELECT 
        household_id, 
        address
      FROM households
      ORDER BY address
    `;
    
    const result = await Pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching households:', err.message);
    res.status(500).json({ error: 'Failed to fetch households' });
  }
});

app.use('/', require('./routes/employees/EmloyeeSchemes'));
app.use('/', require('./routes/employees/EmployeeAssets'));

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});