const express = require('express');
const pool = require('../config/db');

const router = express.Router();

// Get all village statistics
router.get('/monitor/village', async (req, res) => {
    try {
        const allStats = await pool.query(
            'SELECT * FROM citizens'
        );
        res.json(allStats.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;