const express = require('express');
const Pool = require('../config/db');
const router = express.Router();

// Endpoint to get all vaccination records
router.get('/monitor/vaccination-records', async (req, res) => {
    try {
        // Join vaccination_records with persons to get person names
        const vaccinationData = await Pool.query(`
            SELECT 
            v.vaccination_id,
            c.name, 
            v.vaccine_type, 
            v.date_administered,
            c.citizen_id
            FROM 
            vaccinations v
            JOIN 
            citizens c ON v.citizen_id = c.citizen_id
            ORDER BY v.vaccination_id DESC
        `);
        res.json(vaccinationData.rows);
    } catch (error) {
        console.error('Error fetching vaccination records:', error);
        res.status(500).json({ message: 'Failed to fetch vaccination records', error: error.message });
    }
});

module.exports = router;