const express = require('express');
const Pool = require('../config/db');
const router = express.Router();

router.get('/citizen/household-info', async (req, res) => {
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

module.exports = router;