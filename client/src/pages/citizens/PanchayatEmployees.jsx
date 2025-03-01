import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../../styles/citizens/PanchayatEmployees.css';

const PanchayatEmployees = () => {
  const [employeeData, setEmployeeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterBy, setFilterBy] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [sortBy, setSortBy] = useState('');

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3535/citizen/employees', {
        params: {
          filter: filterValue,
          sort: sortBy
        }
      });
      setEmployeeData(response.data);
      setLoading(false);
    } catch (error) {
      setError('Failed to load employee information');
      setLoading(false);
      console.error('Error fetching employee data:', error);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
  }, []);

  return (
    <div className="employee-container">
      <div className="employee-header">
        <h1>Panchayat Employees</h1>
        <div className="filter-section">
          <select 
            className="filter-select"
            value={filterBy} 
            onChange={(e) => setFilterBy(e.target.value)}
          >
            <option value="">Filter By</option>
            <option value="name">Name</option>
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
            <option value="employee_id">Employee ID</option>
            <option value="name">Name</option>
          </select>
          <button className="apply-button" onClick={fetchEmployeeData}>Apply</button>
        </div>
        <Link to="/citizen/dashboard" className="back-link">Back to Dashboard</Link>
      </div>
      
      {loading ? (
        <p>Loading employee information...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : (
        <div className="employee-table-container">
          {employeeData.length === 0 ? (
            <p>No employee records found.</p>
          ) : (
            <table className="employee-table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Position</th>
                </tr>
              </thead>
              <tbody>
                {employeeData.map((item) => (
                  <tr key={item.employee_id}>
                    <td>{item.employee_id}</td>
                    <td>{item.name}</td>
                    <td>{item.role}</td>
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

export default PanchayatEmployees;