import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../styles/Assets.css';

const Assets = () => {
  const [assetData, setAssetData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterBy, setFilterBy] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [sortBy, setSortBy] = useState('');

  const fetchAssetData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3535/citizen/assets', {
        params: {
          filter: filterValue,
          sort: sortBy
        }
      });
      setAssetData(response.data);
      setLoading(false);
    } catch (error) {
      setError('Failed to load asset information');
      setLoading(false);
      console.error('Error fetching asset information:', error);
    }
  };

  useEffect(() => {
    fetchAssetData();
  }, []);

  return (
    <div className="asset-info">
      <div className="asset-header">
        <h1>Assets</h1>
        <div className="filter-section">
          <select 
            className="filter-select"
            value={filterBy} 
            onChange={(e) => setFilterBy(e.target.value)}
          >
            <option value="">Filter By</option>
            <option value="location">Location</option>
            <option value="type">Type</option>
          </select>
          <input
            className="filter-input"
            type="text"
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            placeholder="Enter filter value..."
          />
          <select 
            className="filter-select"
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="">Sort By</option>
            <option value="asset_id">Asset ID</option>
            <option value="type">Type</option>
          </select>
          <button className="apply-button" onClick={fetchAssetData}>Apply</button>
        </div>
        <Link to="/citizen/dashboard" className="back-link">Back to Dashboard</Link>
      </div>
      
      {loading ? (
        <p>Loading asset information...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : (
        <div className="asset-table-container">
          {assetData.length === 0 ? (
            <p>No asset records found.</p>
          ) : (
            <table className="asset-table">
              <thead>
                <tr>
                  <th>Asset ID</th>
                  <th>Location</th>
                  <th>Type</th>
                  <th>Installation date</th>
                </tr>
              </thead>
              <tbody>
                {assetData.map((item) => (
                  <tr key={item.asset_id}>
                    <td>{item.asset_id}</td>
                    <td>{item.location}</td>
                    <td>{item.type}</td>
                    <td>{new Date(item.installation_date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default Assets;