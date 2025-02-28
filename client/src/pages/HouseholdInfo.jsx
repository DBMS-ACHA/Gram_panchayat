import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../styles/HouseholdInfo.css';

const HouseholdInfo = () => {
  const [householdData, setHouseholdData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterBy, setFilterBy] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [sortBy, setSortBy] = useState('');

  const fetchHouseholdInfo = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3535/citizen/household-info', {
        params: {
          filter: filterValue,
          sort: sortBy
        }
      });
      setHouseholdData(response.data);
      setLoading(false);
    } catch (error) {
      setError('Failed to load household information');
      setLoading(false);
      console.error('Error fetching household information:', error);
    }
  };

  useEffect(() => {
    fetchHouseholdInfo();
  }, []);

  return (
    <div className="household-info">
      <div className="household-header">
        <h1>Household Information</h1>
        <div className="filter-section">
          <select 
            className="filter-select"
            value={filterBy} 
            onChange={(e) => setFilterBy(e.target.value)}
          >
            <option value="">Filter By</option>
            <option value="address">Address</option>
            <option value="income">Income</option>
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
            <option value="household_id">Household ID</option>
            <option value="address">Address</option>
            <option value="income">Income</option>
          </select>
          <button className="apply-button" onClick={fetchHouseholdInfo}>Apply</button>
        </div>
        <Link to="/citizen/dashboard" className="back-link">Back to Dashboard</Link>
      </div>
      
      {loading ? (
        <p>Loading household information...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : (
        <div className="household-table-container">
          {householdData.length === 0 ? (
            <p>No household records found.</p>
          ) : (
            <table className="household-table">
              <thead>
                <tr>
                  <th>Household ID</th>
                  <th>Address</th>
                  <th>Income</th>
                </tr>
              </thead>
              <tbody>
                {householdData.map((item) => (
                  <tr key={item.household_id}>
                    <td>{item.household_id}</td>
                    <td>{item.address}</td>
                    <td>{item.income}</td>
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

export default HouseholdInfo;