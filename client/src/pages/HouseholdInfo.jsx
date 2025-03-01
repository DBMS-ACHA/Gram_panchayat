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
  const [selectedHousehold, setSelectedHousehold] = useState(null);
  const [householdMembers, setHouseholdMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

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

  const fetchHouseholdMembers = async (householdId) => {
    if (selectedHousehold === householdId) {
      // If clicking the same household, toggle visibility
      setSelectedHousehold(null);
      setHouseholdMembers([]);
      return;
    }

    try {
      setLoadingMembers(true);
      setSelectedHousehold(householdId);
      // Replace with your actual API endpoint for fetching household members
      const response = await axios.get(`http://localhost:3535/citizen/household-members/${householdId}`);
      setHouseholdMembers(response.data);
      setLoadingMembers(false);
    } catch (error) {
      console.error('Error fetching household members:', error);
      setLoadingMembers(false);
      setHouseholdMembers([]);
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {householdData.map((item) => (
                  <React.Fragment key={item.household_id}>
                    <tr>
                      <td>{item.household_id}</td>
                      <td>{item.address}</td>
                      <td>
                        <button 
                          onClick={() => fetchHouseholdMembers(item.household_id)}
                          className="view-members-btn"
                        >
                          {selectedHousehold === item.household_id ? 'Hide Members' : 'View Members'}
                        </button>
                      </td>
                    </tr>
                    {selectedHousehold === item.household_id && (
                      <tr className="members-row">
                        <td colSpan="3">
                          {loadingMembers ? (
                            <p>Loading members...</p>
                          ) : householdMembers.length > 0 ? (
                            <div className="members-list">
                              <h3>Household Members</h3>
                              <ul>
                                {householdMembers.map((member) => (
                                  <li key={member.citizen_id}>
                                    {member.name} ({member.age} years) - {member.gender}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : (
                            <p>No members found for this household</p>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
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