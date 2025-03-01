const express = require('express');
const Pool = require('../../config/db');
const verifyToken = require('../../middleware/verifyJWT');
const router = express.Router();

// Get all welfare schemes for employee
router.get('/employee/schemes', verifyToken, async (req, res) => {
    try {
        // Verify the user is an employee
        if (req.user.role !== 'employee') {
            return res.status(403).json({ error: 'Access denied. Only employees can view this resource.' });
        }

        const query = `
        SELECT 
          scheme_id,
          name,
          description,
          status,
          expiry_date
        FROM welfare_schemes
        ORDER BY status DESC, expiry_date DESC
      `;

        const result = await Pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching schemes:', err.message);
        res.status(500).json({ error: 'Failed to fetch schemes' });
    }
});

// Get a specific scheme
router.get('/employee/schemes/:id', verifyToken, async (req, res) => {
    try {
        // Verify the user is an employee
        if (req.user.role !== 'employee') {
            return res.status(403).json({ error: 'Access denied. Only employees can view this resource.' });
        }

        const schemeId = req.params.id;

        const query = `
        SELECT 
          ws.scheme_id,
          ws.name,
          ws.description,
          ws.status,
          ws.expiry_date,
          COUNT(DISTINCT se.citizen_id) as enrolled_count,
          COUNT(DISTINCT sa.citizen_id) as pending_applications
        FROM welfare_schemes ws
        LEFT JOIN scheme_enrollments se ON ws.scheme_id = se.scheme_id
        LEFT JOIN scheme_applications sa ON ws.scheme_id = sa.scheme_id AND sa.status = 'pending'
        WHERE ws.scheme_id = $1
        GROUP BY ws.scheme_id
      `;

        const result = await Pool.query(query, [schemeId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Scheme not found' });
        }

        // Get details of enrolled citizens
        const enrolledQuery = `
        SELECT 
          c.citizen_id,
          c.name,
          se.enrollment_date
        FROM scheme_enrollments se
        JOIN citizens c ON se.citizen_id = c.citizen_id
        WHERE se.scheme_id = $1
        ORDER BY se.enrollment_date DESC
      `;

        const enrolledResult = await Pool.query(enrolledQuery, [schemeId]);

        // Get details of pending applications
        const applicationsQuery = `
        SELECT 
          c.citizen_id,
          c.name,
          sa.application_date,
          sa.status
        FROM scheme_applications sa
        JOIN citizens c ON sa.citizen_id = c.citizen_id
        WHERE sa.scheme_id = $1
        ORDER BY sa.application_date DESC
      `;

        const applicationsResult = await Pool.query(applicationsQuery, [schemeId]);

        // Combine all the data
        const schemeData = {
            ...result.rows[0],
            enrolled_citizens: enrolledResult.rows,
            applications: applicationsResult.rows
        };

        res.json(schemeData);
    } catch (err) {
        console.error('Error fetching scheme:', err.message);
        res.status(500).json({ error: 'Failed to fetch scheme details' });
    }
});

// Create a new scheme
router.post('/employee/schemes', verifyToken, async (req, res) => {
    try {
        // Verify the user is an employee
        if (req.user.role !== 'employee') {
            return res.status(403).json({ error: 'Access denied. Only employees can create schemes.' });
        }

        const { scheme_id, name, description, status, expiry_date } = req.body;

        // Validate required fields
        if (!scheme_id || !name) {
            return res.status(400).json({ error: 'Scheme ID and name are required fields' });
        }

        // Check if scheme_id already exists
        const existingCheck = await Pool.query('SELECT scheme_id FROM welfare_schemes WHERE scheme_id = $1', [scheme_id]);
        if (existingCheck.rows.length > 0) {
            return res.status(409).json({ error: 'A scheme with this ID already exists' });
        }

        // Handle expiry_date (can be null)
        let formattedExpiryDate = null;
        if (expiry_date) {
            formattedExpiryDate = expiry_date;
        }

        const query = `
        INSERT INTO welfare_schemes(scheme_id, name, description, status, expiry_date)
        VALUES($1, $2, $3, $4, $5)
        RETURNING *
      `;

        const values = [scheme_id, name, description, status, formattedExpiryDate];
        const result = await Pool.query(query, values);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating scheme:', err.message);
        res.status(500).json({ error: 'Failed to create scheme' });
    }
});

// Update an existing scheme
router.put('/employee/schemes/:id', verifyToken, async (req, res) => {
    try {
        // Verify the user is an employee
        if (req.user.role !== 'employee') {
            return res.status(403).json({ error: 'Access denied. Only employees can update schemes.' });
        }

        const schemeId = req.params.id;
        const { name, description, status, expiry_date } = req.body;

        // Validate required fields
        if (!name) {
            return res.status(400).json({ error: 'Scheme name is required' });
        }

        // Check if scheme exists
        const schemeCheck = await Pool.query('SELECT scheme_id FROM welfare_schemes WHERE scheme_id = $1', [schemeId]);
        if (schemeCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Scheme not found' });
        }

        // Handle expiry_date (can be null)
        let formattedExpiryDate = null;
        if (expiry_date) {
            formattedExpiryDate = expiry_date;
        }

        const query = `
        UPDATE welfare_schemes
        SET name = $1, description = $2, status = $3, expiry_date = $4
        WHERE scheme_id = $5
        RETURNING *
      `;

        const values = [name, description, status, formattedExpiryDate, schemeId];
        const result = await Pool.query(query, values);

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating scheme:', err.message);
        res.status(500).json({ error: 'Failed to update scheme' });
    }
});

// Delete a scheme
router.delete('/employee/schemes/:id', verifyToken, async (req, res) => {
    try {
        // Verify the user is an employee
        if (req.user.role !== 'employee') {
            return res.status(403).json({ error: 'Access denied. Only employees can delete schemes.' });
        }

        const schemeId = req.params.id;

        // Check if scheme exists
        const schemeCheck = await Pool.query('SELECT scheme_id FROM welfare_schemes WHERE scheme_id = $1', [schemeId]);
        if (schemeCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Scheme not found' });
        }

        // Check for dependencies before deletion
        const enrollmentsCheck = await Pool.query('SELECT COUNT(*) FROM scheme_enrollments WHERE scheme_id = $1', [schemeId]);
        const applicationsCheck = await Pool.query('SELECT COUNT(*) FROM scheme_applications WHERE scheme_id = $1', [schemeId]);

        const enrollmentCount = parseInt(enrollmentsCheck.rows[0].count);
        const applicationCount = parseInt(applicationsCheck.rows[0].count);

        if (enrollmentCount > 0 || applicationCount > 0) {
            // Instead of failing, we can set the scheme to inactive
            const updateQuery = `
          UPDATE welfare_schemes
          SET status = false
          WHERE scheme_id = $1
          RETURNING *
        `;

            const result = await Pool.query(updateQuery, [schemeId]);
            return res.json({
                message: 'Scheme has enrollments or applications. It has been set to inactive instead of being deleted.',
                scheme: result.rows[0]
            });
        }

        // Delete the scheme if no dependencies
        const query = `DELETE FROM welfare_schemes WHERE scheme_id = $1`;
        await Pool.query(query, [schemeId]);

        res.json({ message: 'Scheme deleted successfully' });
    } catch (err) {
        console.error('Error deleting scheme:', err.message);
        res.status(500).json({ error: 'Failed to delete scheme' });
    }
});

// Get scheme applications for employee review
router.get('/employee/scheme-applications', verifyToken, async (req, res) => {
    try {
        // Verify the user is an employee
        if (req.user.role !== 'employee') {
            return res.status(403).json({ error: 'Access denied. Only employees can view scheme applications.' });
        }

        const query = `
        SELECT 
          sa.citizen_id,
          sa.scheme_id,
          sa.application_date,
          sa.status,
          c.name as citizen_name,
          ws.name as scheme_name
        FROM scheme_applications sa
        JOIN citizens c ON sa.citizen_id = c.citizen_id
        JOIN welfare_schemes ws ON sa.scheme_id = ws.scheme_id
        ORDER BY sa.application_date DESC
      `;

        const result = await Pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching scheme applications:', err.message);
        res.status(500).json({ error: 'Failed to fetch scheme applications' });
    }
});

// Process a scheme application (approve/reject)
router.put('/employee/scheme-applications/:citizenId/:schemeId', verifyToken, async (req, res) => {
    try {
        // Verify the user is an employee
        if (req.user.role !== 'employee') {
            return res.status(403).json({ error: 'Access denied. Only employees can process applications.' });
        }

        const { citizenId, schemeId } = req.params;
        const { status, notes } = req.body; // status should be 'approved' or 'rejected'

        if (!status || !['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Status must be either approved or rejected' });
        }

        // Update the application status
        const updateQuery = `
        UPDATE scheme_applications
        SET status = $1
        WHERE citizen_id = $2 AND scheme_id = $3
        RETURNING *
      `;

        const updateResult = await Pool.query(updateQuery, [status, citizenId, schemeId]);

        if (updateResult.rows.length === 0) {
            return res.status(404).json({ error: 'Application not found' });
        }

        // If approved, create an enrollment record
        if (status === 'approved') {
            const enrollQuery = `
          INSERT INTO scheme_enrollments (citizen_id, scheme_id, enrollment_date)
          VALUES ($1, $2, NOW())
          ON CONFLICT (citizen_id, scheme_id) DO NOTHING
        `;

            await Pool.query(enrollQuery, [citizenId, schemeId]);
        }

        res.json({
            message: `Application ${status}`,
            application: updateResult.rows[0]
        });
    } catch (err) {
        console.error('Error processing application:', err.message);
        res.status(500).json({ error: 'Failed to process application' });
    }
});

// Get scheme enrollments (citizens enrolled in schemes)
router.get('/employee/scheme-enrollments', verifyToken, async (req, res) => {
    try {
        // Verify the user is an employee
        if (req.user.role !== 'employee') {
            return res.status(403).json({ error: 'Access denied. Only employees can view enrollments.' });
        }

        const query = `
        SELECT 
          se.enrollment_id,
          se.citizen_id,
          se.scheme_id,
          se.enrollment_date,
          c.name as citizen_name,
          ws.name as scheme_name,
          ws.status as scheme_status,
          ws.expiry_date
        FROM scheme_enrollments se
        JOIN citizens c ON se.citizen_id = c.citizen_id
        JOIN welfare_schemes ws ON se.scheme_id = ws.scheme_id
        ORDER BY se.enrollment_date DESC
      `;

        const result = await Pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching scheme enrollments:', err.message);
        res.status(500).json({ error: 'Failed to fetch scheme enrollments' });
    }
});

// Get scheme statistics for dashboard
router.get('/employee/scheme-statistics', verifyToken, async (req, res) => {
    try {
        // Verify the user is an employee
        if (req.user.role !== 'employee') {
            return res.status(403).json({ error: 'Access denied. Only employees can view scheme statistics.' });
        }

        // Get total schemes count
        const schemesCountQuery = `SELECT COUNT(*) FROM welfare_schemes`;
        const schemesCount = await Pool.query(schemesCountQuery);

        // Get active schemes count
        const activeSchemesQuery = `
        SELECT COUNT(*) FROM welfare_schemes 
        WHERE status = true AND (expiry_date IS NULL OR expiry_date > NOW())
      `;
        const activeSchemes = await Pool.query(activeSchemesQuery);

        // Get expired schemes count
        const expiredSchemesQuery = `
        SELECT COUNT(*) FROM welfare_schemes 
        WHERE status = true AND expiry_date IS NOT NULL AND expiry_date <= NOW()
      `;
        const expiredSchemes = await Pool.query(expiredSchemesQuery);

        // Get total beneficiaries
        const beneficiariesQuery = `SELECT COUNT(DISTINCT citizen_id) FROM scheme_enrollments`;
        const beneficiaries = await Pool.query(beneficiariesQuery);

        // Get pending applications
        const pendingApplicationsQuery = `SELECT COUNT(*) FROM scheme_applications WHERE status = 'pending'`;
        const pendingApplications = await Pool.query(pendingApplicationsQuery);

        res.json({
            total_schemes: parseInt(schemesCount.rows[0].count),
            active_schemes: parseInt(activeSchemes.rows[0].count),
            expired_schemes: parseInt(expiredSchemes.rows[0].count),
            inactive_schemes: parseInt(schemesCount.rows[0].count) -
                parseInt(activeSchemes.rows[0].count) -
                parseInt(expiredSchemes.rows[0].count),
            total_beneficiaries: parseInt(beneficiaries.rows[0].count),
            pending_applications: parseInt(pendingApplications.rows[0].count)
        });
    } catch (err) {
        console.error('Error fetching scheme statistics:', err.message);
        res.status(500).json({ error: 'Failed to fetch scheme statistics' });
    }
});

module.exports = router;