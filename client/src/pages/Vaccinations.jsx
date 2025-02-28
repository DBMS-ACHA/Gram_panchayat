import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/Vaccinations.css';

const Vaccinations = () => {
  const [vaccinations, setVaccinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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
  
  return (
    <div className="vaccination-container">
      <div className="vaccination-header">
        <h1>My Vaccination Records</h1>
        <Link to="/citizen/dashboard" className="back-link">Back to Dashboard</Link>
      </div>
      
      {loading ? (
        <p>Loading vaccination records...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : (
        <div className="vaccination-table-container">
          {vaccinations.length === 0 ? (
            <p>No vaccination records found.</p>
          ) : (
            <table className="vaccination-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Vaccine Type</th>
                  <th>Date Administered</th>
                </tr>
              </thead>
              <tbody>
                {vaccinations.map(vacc => (
                  <tr key={vacc.vaccination_id}>
                    <td>{vacc.vaccination_id}</td>
                    <td>{vacc.vaccine_type}</td>
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