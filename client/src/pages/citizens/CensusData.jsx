import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../styles/CensusData.css';

const CensusData = () => {
  const [censusData, setCensusData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterBy, setFilterBy] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [sortBy, setSortBy] = useState('');

  const fetchCensusData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3535/citizen/census', {
        params: {
          filter: filterValue,
          sort: sortBy
        }
      });
      setCensusData(response.data);
      setLoading(false);
    } catch (error) {
      setError('Failed to load census data');
      setLoading(false);
      console.error('Error fetching census data:', error);
    }
  };

  useEffect(() => {
    fetchCensusData();
  }, []);

  return (
    <div className="census-info">
      <div className="census-header">
        <h1>Census Data</h1>
        <div className="filter-section">
          <select 
            className="filter-select"
            value={filterBy} 
            onChange={(e) => setFilterBy(e.target.value)}
          >
            <option value="">Filter By</option>
            <option value="citizen_id">Citizen ID</option>
            <option value="household_id">Household ID</option>
            <option value="event_type">Event Type</option>
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
            <option value="citizen_id">Citizen ID</option>
            <option value="household_id">Household ID</option>
            <option value="event_date">Event Date</option>
          </select>
          <button className="apply-button" onClick={fetchCensusData}>Apply</button>
        </div>
        <Link to="/citizen/dashboard" className="back-link">Back to Dashboard</Link>
      </div>
      
      {loading ? (
        <p>Loading census data...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : (
        <div className="census-table-container">
          {censusData.length === 0 ? (
            <p>No census records found.</p>
          ) : (
            <table className="census-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Household ID</th>
                  <th>Event Type</th>
                  <th>Event Date</th>
                </tr>
              </thead>
              <tbody>
                {censusData.map((item) => (
                  <tr key={item.citizen_id}>
                    <td>{item.name}</td>
                    <td>{item.household_id}</td>
                    <td>{item.event_type}</td>
                    <td>{new Date(item.event_date).toLocaleDateString()}</td>
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

export default CensusData;