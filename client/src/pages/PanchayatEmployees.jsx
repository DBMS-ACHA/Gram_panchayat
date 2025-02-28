import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/PanchayatEmployees.css'; // Create this CSS file for styling the table

const PanchayatEmployees = () => {
  const [employeeData, setEmployeeData] = useState([]);
  const [filterBy, setFilterBy] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [sortBy, setSortBy] = useState('');
  const navigate = useNavigate();

  const fetchEmployeeData = async () => {
    try {
      const response = await axios.get('http://localhost:3535/citizen/employees', {
        params: {
          filter: filterValue,
          sort: sortBy
        }
      });
      setEmployeeData(response.data);
    } catch (error) {
      console.error('Error fetching employee data:', error);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
  }, []);

  const handleApply = () => {
    fetchEmployeeData();
  };

  return (
    <div className="employee-info">
      <h1>Panchayat Employees</h1>
      <div className="filters">
        <div>
          <label htmlFor="filterBy">Filter By:</label>
          <select id="filterBy" value={filterBy} onChange={(e) => setFilterBy(e.target.value)}>
            <option value="">Select</option>
            <option value="name">Name</option>
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
            <option value="employee_id">Employee ID</option>
            <option value="name">Name</option>
          </select>
        </div>
        <button onClick={handleApply}>Apply</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Employee ID</th>
            <th>Name</th>
            <th>Position</th>
          </tr>
        </thead>
        <tbody>
          {employeeData.map((item, index) => (
            <tr key={index}>
              <td>{item.employee_id}</td>
              <td>{item.name}</td>
              <td>{item.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={() => navigate('/citizen/dashboard')}>Back to Dashboard</button>
    </div>
  );
};

export default PanchayatEmployees;