const express = require('express');
const Pool = require('../config/db');
const router = express.Router();

// Endpoint to get all vaccination records
// Get all land records with owner name joined from citizens table
router.get('/employee/land-records', async (req, res) => {
    try {
        const result = await Pool.query(`
            SELECT l.*, c.name 
            FROM land_records l
            JOIN citizens c ON l.citizen_id = c.citizen_id
            ORDER BY l.land_id
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching land records:', error);
        res.status(500).json({ error: 'Failed to fetch land records' });
    }
});

// Add new land record
router.post('/employee/land-records', async (req, res) => {
    try {
        const { citizen_id, area_acres, crop_type } = req.body;
        
        // Get the next land_id
        const maxIdResult = await Pool.query('SELECT MAX(land_id) FROM land_records');
        const nextId = (maxIdResult.rows[0].max || 0) + 1;
        
        const result = await Pool.query(
            'INSERT INTO land_records (land_id, citizen_id, area_acres, crop_type) VALUES ($1, $2, $3, $4) RETURNING *',
            [nextId, citizen_id, area_acres, crop_type]
        );
        
        // Get the citizen name to include in response
        const citizenResult = await Pool.query('SELECT name FROM citizens WHERE citizen_id = $1', [citizen_id]);
        const landRecord = result.rows[0];
        landRecord.name = citizenResult.rows[0].name;
        
        res.status(201).json(landRecord);
    } catch (error) {
        console.error('Error adding land record:', error);
        res.status(500).json({ error: 'Failed to add land record' });
    }
});

// Update existing land record
router.put('/employee/land-records/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { citizen_id, area_acres, crop_type } = req.body;
        
        const result = await Pool.query(
            'UPDATE land_records SET citizen_id = $1, area_acres = $2, crop_type = $3 WHERE land_id = $4 RETURNING *',
            [citizen_id, area_acres, crop_type, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Land record not found' });
        }
        
        // Get the citizen name to include in response
        const citizenResult = await Pool.query('SELECT name FROM citizens WHERE citizen_id = $1', [citizen_id]);
        const landRecord = result.rows[0];
        landRecord.name = citizenResult.rows[0].name;
        
        res.json(landRecord);
    } catch (error) {
        console.error('Error updating land record:', error);
        res.status(500).json({ error: 'Failed to update land record' });
    }
});

// Delete land record
router.delete('/employee/land-records/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await Pool.query('DELETE FROM land_records WHERE land_id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Land record not found' });
        }
        
        res.json({ message: 'Land record deleted successfully' });
    } catch (error) {
        console.error('Error deleting land record:', error);
        res.status(500).json({ error: 'Failed to delete land record' });
    }
});

module.exports = router;