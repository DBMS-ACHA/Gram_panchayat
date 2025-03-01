const express = require('express');
const Pool = require('../config/db');
const router = express.Router();

router.get('/citizen/vaccinations', async (req, res) => {
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

module.exports = router;