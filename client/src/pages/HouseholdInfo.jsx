import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/HouseholdInfo.css'; // Create this CSS file for styling the table

const HouseholdInfo = () => {
  const [householdData, setHouseholdData] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHouseholdInfo = async () => {
      try {
        const response = await axios.get('http://localhost:3535/citizen/household-info');
        setHouseholdData(response.data);
      } catch (error) {
        console.error('Error fetching household information:', error);
      }
    };

    fetchHouseholdInfo();
  }, []);

  return (
    <div className="household-info">
      <h1>Household Information</h1>
      <table>
        <thead>
          <tr>
            <th>Household Id</th>
            <th>Address</th>
            <th>Income</th>
            {/* Add more fields as needed */}
          </tr>
        </thead>
        <tbody>
          {householdData.map((item, index) => (
            <tr key={index}>
              <td>{item.field1}</td>
              <td>{item.field2}</td>
              <td>{item.field3}</td>
              {/* Add more fields as needed */}
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={() => navigate('/citizen/dashboard')}>Back to Dashboard</button>
    </div>
  );
};

export default HouseholdInfo;