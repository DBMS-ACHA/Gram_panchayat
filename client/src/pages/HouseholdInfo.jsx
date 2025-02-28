import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/HouseholdInfo.css'; // Create this CSS file for styling the table

const HouseholdInfo = () => {
  const [householdData, setHouseholdData] = useState([]);
  const [filterBy, setFilterBy] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [sortBy, setSortBy] = useState('');
  const navigate = useNavigate();

  const fetchHouseholdInfo = async () => {
    try {
      const response = await axios.get('http://localhost:3535/citizen/household-info', {
        params: {
          filter: filterValue,
          sort: sortBy
        }
      });
      setHouseholdData(response.data);
    } catch (error) {
      console.error('Error fetching household information:', error);
    }
  };

  useEffect(() => {
    fetchHouseholdInfo();
  }, []);

  const handleApply = () => {
    fetchHouseholdInfo();
  };

  return (
    <div className="household-info">
      <h1>Household Information</h1>
      <div className="filters">
        <div>
          <label htmlFor="filterBy">Filter By:</label>
          <select id="filterBy" value={filterBy} onChange={(e) => setFilterBy(e.target.value)}>
            <option value="">Select</option>
            <option value="address">Address</option>
            <option value="income">Income</option>
          </select>
        </div>
        <div>
          <label htmlFor="filterValue">Filter Value:</label>
          <input
            id="filterValue"
            type="text"
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="sortBy">Sort By:</label>
          <select id="sortBy" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="">Select</option>
            <option value="household_id">Household ID</option>
            <option value="address">Address</option>
            <option value="income">Income</option>
          </select>
        </div>
        <button onClick={handleApply}>Apply</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Household ID</th>
            <th>Address</th>
            <th>Income</th>
          </tr>
        </thead>
        <tbody>
          {householdData.map((item, index) => (
            <tr key={index}>
              <td>{item.household_id}</td>
              <td>{item.address}</td>
              <td>{item.income}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={() => navigate('/citizen/dashboard')}>Back to Dashboard</button>
    </div>
  );
};

export default HouseholdInfo;