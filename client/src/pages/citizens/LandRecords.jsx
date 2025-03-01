import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../../styles/citizens/LandRecords.css';

const LandRecords = () => {
  const [landRecordsData, setLandRecordsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterBy, setFilterBy] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [sortBy, setSortBy] = useState('');

  const fetchLandRecordsData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3535/citizen/land-records', {
        params: {
          filter: filterValue,
          sort: sortBy
        }
      });
      setLandRecordsData(response.data);
      setLoading(false);
    } catch (error) {
      setError('Failed to load land records data');
      setLoading(false);
      console.error('Error fetching land records data:', error);
    }
  };

  useEffect(() => {
    fetchLandRecordsData();
  }, []);

  return (
    <div className="land-records-info">
      <div className="land-records-header">
        <h1>Land Records</h1>
        <div className="filter-section">
          <select 
            className="filter-select"
            value={filterBy} 
            onChange={(e) => setFilterBy(e.target.value)}
          >
            <option value="">Filter By</option>
            <option value="name">Name</option>
            <option value="crop_type">Crop Type</option>
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
            <option value="land_id">Land ID</option>
            <option value="name">Owner Name</option>
            <option value="area_acres">Area</option>
          </select>
          <button className="apply-button" onClick={fetchLandRecordsData}>Apply</button>
        </div>
        <Link to="/citizen/dashboard" className="back-link">Back to Dashboard</Link>
      </div>
      
      {loading ? (
        <p>Loading land records data...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : (
        <div className="land-records-table-container">
          {landRecordsData.length === 0 ? (
            <p>No land records found.</p>
          ) : (
            <table className="land-records-table">
              <thead>
                <tr>
                  <th>Record ID</th>
                  <th>Owner Name</th>
                  <th>Crop Type</th>
                  <th>Area(in acres)</th>
                </tr>
              </thead>
              <tbody>
                {landRecordsData.map((item) => (
                  <tr key={item.land_id}>
                    <td>{item.land_id}</td>
                    <td>{item.name}</td>
                    <td>{item.crop_type}</td>
                    <td>{item.area_acres}</td>
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

export default LandRecords;