const express = require('express');
const Pool = require('../config/db');
const verifyToken = require('../middleware/verifyJWT');

// filepath: /Users/aryansanghi/Desktop/CSE Dep/DBMS/LA4/Gram_Panchayat/server/routes/adminUsers.js
const router = express.Router();

// Get all users
router.get('/admin/users', verifyToken, async (req, res) => {
    try {
        // Verify admin role
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Admin access required.' });
        }

        // Join with citizens table to get citizen names for users with citizen_id
        const result = await Pool.query(`
            SELECT u.*, c.name 
            FROM users u
            LEFT JOIN citizens c ON u.citizen_id = c.citizen_id
            ORDER BY u.user_id
        `);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Get all citizens for dropdown selection
router.get('/admin/citizens', verifyToken, async (req, res) => {
    try {
        // Verify admin role
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Admin access required.' });
        }

        const result = await Pool.query(`
            SELECT citizen_id, name 
            FROM citizens 
            ORDER BY name
        `);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching citizens:', error);
        res.status(500).json({ error: 'Failed to fetch citizens' });
    }
});

// Add new user
router.post('/admin/users', verifyToken, async (req, res) => {
    try {
        // Verify admin role
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Admin access required.' });
        }

        const { username, password, role, citizen_id } = req.body;
        
        // Check if username already exists
        const existingUser = await Pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // In a real application, you would hash the password here
        // const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insert the new user
        const result = await Pool.query(
            'INSERT INTO users (username, password, role, citizen_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [username, password, role, citizen_id || null]
        );
        
        // If citizen_id is provided, fetch citizen information
        if (citizen_id) {
            const citizenData = await Pool.query('SELECT name FROM citizens WHERE citizen_id = $1', [citizen_id]);
            if (citizenData.rows.length > 0) {
                result.rows[0].name = citizenData.rows[0].name;
            }
        }
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// Update existing user
router.put('/admin/users/:id', verifyToken, async (req, res) => {
    try {
        // Verify admin role
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Admin access required.' });
        }

        const { id } = req.params;
        const { username, password, role, citizen_id } = req.body;
        
        // Check if username exists for another user
        const existingUser = await Pool.query('SELECT * FROM users WHERE username = $1 AND user_id != $2', [username, id]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Get current user data
        const currentUser = await Pool.query('SELECT * FROM users WHERE user_id = $1', [id]);
        if (currentUser.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Build update query based on whether password is provided
        let query, params;
        if (password) {
            // In a real application, you would hash the password here
            // const hashedPassword = await bcrypt.hash(password, 10);
            query = 'UPDATE users SET username = $1, password = $2, role = $3, citizen_id = $4 WHERE user_id = $5 RETURNING *';
            params = [username, password, role, citizen_id || null, id];
        } else {
            query = 'UPDATE users SET username = $1, role = $2, citizen_id = $3 WHERE user_id = $4 RETURNING *';
            params = [username, role, citizen_id || null, id];
        }
        
        const result = await Pool.query(query, params);
        
        // If citizen_id is provided, fetch citizen information
        if (citizen_id) {
            const citizenData = await Pool.query('SELECT name FROM citizens WHERE citizen_id = $1', [citizen_id]);
            if (citizenData.rows.length > 0) {
                result.rows[0].name = citizenData.rows[0].name;
            }
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// Delete user
router.delete('/admin/users/:id', verifyToken, async (req, res) => {
    try {
        // Verify admin role
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Admin access required.' });
        }

        const { id } = req.params;
        
        // Check if user exists
        const user = await Pool.query('SELECT * FROM users WHERE user_id = $1', [id]);
        if (user.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Delete the user
        await Pool.query('DELETE FROM users WHERE user_id = $1', [id]);
        
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

module.exports = router;