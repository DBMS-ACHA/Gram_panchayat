const express = require('express');
const router = express.Router();
const Pool = require('../../config/db');
const verifyToken = require('../../middleware/verifyJWT');

// Get all assets
router.get('/employee/assets', verifyToken, async (req, res) => {
  try {
    // Verify the user is an employee
    if (req.user.role !== 'employee') {
      return res.status(403).json({ error: 'Access denied. Only employees can access assets.' });
    }

    // Query for all assets, ordered by installation date
    const assetsQuery = `
      SELECT * FROM assets
      ORDER BY installation_date DESC
    `;

    const result = await Pool.query(assetsQuery);
    res.json(result.rows);
    
  } catch (err) {
    console.error('Error fetching assets:', err.message);
    res.status(500).json({ error: 'Failed to retrieve assets' });
  }
});

// Get a single asset by ID
router.get('/employee/assets/:id', verifyToken, async (req, res) => {
  try {
    // Verify the user is an employee
    if (req.user.role !== 'employee') {
      return res.status(403).json({ error: 'Access denied. Only employees can access asset details.' });
    }

    const { id } = req.params;

    // Get asset details
    const assetQuery = `SELECT * FROM assets WHERE asset_id = $1`;
    const result = await Pool.query(assetQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    res.json(result.rows[0]);
    
  } catch (err) {
    console.error('Error fetching asset details:', err.message);
    res.status(500).json({ error: 'Failed to retrieve asset details' });
  }
});

// Create a new asset
router.post('/employee/assets', verifyToken, async (req, res) => {
  try {
    // Verify the user is an employee
    if (req.user.role !== 'employee') {
      return res.status(403).json({ error: 'Access denied. Only employees can add assets.' });
    }

    const { asset_id, type, location, installation_date } = req.body;

    // Validate required fields
    if (!asset_id || !type || !location || !installation_date) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if asset_id already exists
    const checkQuery = `SELECT * FROM assets WHERE asset_id = $1`;
    const checkResult = await Pool.query(checkQuery, [asset_id]);

    if (checkResult.rows.length > 0) {
      return res.status(409).json({ error: 'Asset ID already exists' });
    }

    // Insert the new asset
    const insertQuery = `
      INSERT INTO assets (asset_id, type, location, installation_date)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await Pool.query(insertQuery, [
      asset_id,
      type,
      location,
      installation_date
    ]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating asset:', err.message);
    res.status(500).json({ error: 'Failed to create asset' });
  }
});

// Update an asset
router.put('/employee/assets/:id', verifyToken, async (req, res) => {
  try {
    // Verify the user is an employee
    if (req.user.role !== 'employee') {
      return res.status(403).json({ error: 'Access denied. Only employees can update assets.' });
    }

    const { id } = req.params;
    const { type, location, installation_date } = req.body;

    // Validate required fields
    if (!type || !location || !installation_date) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if asset exists
    const checkQuery = `SELECT * FROM assets WHERE asset_id = $1`;
    const checkResult = await Pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // Update the asset
    const updateQuery = `
      UPDATE assets
      SET type = $1,
          location = $2,
          installation_date = $3
      WHERE asset_id = $4
      RETURNING *
    `;

    const result = await Pool.query(updateQuery, [
      type,
      location,
      installation_date,
      id
    ]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating asset:', err.message);
    res.status(500).json({ error: 'Failed to update asset' });
  }
});

// Delete an asset
router.delete('/employee/assets/:id', verifyToken, async (req, res) => {
  try {
    // Verify the user is an employee
    if (req.user.role !== 'employee') {
      return res.status(403).json({ error: 'Access denied. Only employees can delete assets.' });
    }

    const { id } = req.params;

    // Check if asset exists
    const checkQuery = `SELECT * FROM assets WHERE asset_id = $1`;
    const checkResult = await Pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // Delete the asset
    const deleteQuery = `DELETE FROM assets WHERE asset_id = $1`;
    await Pool.query(deleteQuery, [id]);

    res.json({ message: 'Asset deleted successfully' });
  } catch (err) {
    console.error('Error deleting asset:', err.message);
    res.status(500).json({ error: 'Failed to delete asset' });
  }
});

// Get asset statistics
router.get('/employee/assets/statistics/summary', verifyToken, async (req, res) => {
  try {
    // Verify the user is an employee
    if (req.user.role !== 'employee') {
      return res.status(403).json({ error: 'Access denied. Only employees can access asset statistics.' });
    }

    const statsQuery = `
      SELECT 
        COUNT(*) as total_assets,
        COUNT(DISTINCT type) as asset_types,
        MAX(installation_date) as newest_asset_date,
        MIN(installation_date) as oldest_asset_date
      FROM assets
    `;

    const statsResult = await Pool.query(statsQuery);

    // Get assets by type
    const typeDistributionQuery = `
      SELECT type, COUNT(*) as count
      FROM assets
      GROUP BY type
      ORDER BY count DESC
    `;

    const typeDistributionResult = await Pool.query(typeDistributionQuery);

    // Get assets by location
    const locationDistributionQuery = `
      SELECT location, COUNT(*) as count
      FROM assets
      GROUP BY location
      ORDER BY count DESC
    `;

    const locationDistributionResult = await Pool.query(locationDistributionQuery);

    res.json({
      summary: statsResult.rows[0],
      typeDistribution: typeDistributionResult.rows,
      locationDistribution: locationDistributionResult.rows
    });
  } catch (err) {
    console.error('Error fetching asset statistics:', err.message);
    res.status(500).json({ error: 'Failed to retrieve asset statistics' });
  }
});

// Get assets by year of installation
router.get('/employee/assets/by-year', verifyToken, async (req, res) => {
  try {
    // Verify the user is an employee
    if (req.user.role !== 'employee') {
      return res.status(403).json({ error: 'Access denied. Only employees can access this data.' });
    }

    const yearQuery = `
      SELECT 
        EXTRACT(YEAR FROM installation_date) as year,
        COUNT(*) as count
      FROM assets
      GROUP BY EXTRACT(YEAR FROM installation_date)
      ORDER BY year
    `;

    const result = await Pool.query(yearQuery);
    res.json(result.rows);
    
  } catch (err) {
    console.error('Error fetching assets by year:', err.message);
    res.status(500).json({ error: 'Failed to retrieve asset data by year' });
  }
});

module.exports = router;