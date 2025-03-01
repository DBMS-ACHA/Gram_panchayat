import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../../styles/citizens/Vaccinations.css';

const Vaccinations = () => {
  const [vaccinations, setVaccinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    const fetchVaccinations = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:3535/citizen/vaccinations');
        setVaccinations(response.data);
        setLoading(false);
      } catch (error) {
        setError('Failed to load vaccination records');
        setLoading(false);
        console.error('Error fetching vaccination records:', error);
      }
    };

    fetchVaccinations();
  }, []);

  const filteredVaccinations = vaccinations.filter(vacc => 
    filterType === 'all' ? true : vacc.vaccine_type === filterType
  );

  const uniqueTypes = [...new Set(vaccinations.map(vacc => vacc.vaccine_type))];

  return (
    <div className="vaccination-container">
      <div className="vaccination-header">
        <h1>My Vaccination Records</h1>
        <div className="filter-section">
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            {uniqueTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <Link to="/citizen/dashboard" className="back-link">Back to Dashboard</Link>
      </div>
      
      {loading ? (
        <p>Loading vaccination records...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : (
        <div className="vaccination-table-container">
          {filteredVaccinations.length === 0 ? (
            <p>No vaccination records found.</p>
          ) : (
            <table className="vaccination-table">
              <thead>
                <tr>
                  <th>Vaccine Type</th>
                  <th>Citizen Name</th>
                  <th>Gender</th>
                  <th>Date Administered</th>
                </tr>
              </thead>
              <tbody>
                {filteredVaccinations.map(vacc => (
                  <tr key={vacc.vaccination_id}>
                    <td>{vacc.vaccine_type}</td>
                    <td>{vacc.citizen_name}</td>
                    <td>{vacc.gender}</td>
                    <td>{new Date(vacc.date_administered).toLocaleDateString()}</td>
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

export default Vaccinations;