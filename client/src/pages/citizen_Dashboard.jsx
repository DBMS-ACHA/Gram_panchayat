import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Dashboard.css'; // You'll need to create this CSS file with the styles from the HTML

// This will be your main dashboard component
const Dashboard = () => {
  const [citizenName, setCitizenName] = useState('');
  const [village, setVillage] = useState('Phulera');
  const navigate = useNavigate();
  
  // You would fetch user data on component mount
  useEffect(() => {
    // This is where you'd make an API call to get user data
    // Example:
    // const fetchUserData = async () => {
    //   try {
    //     const response = await api.get('/citizen/profile');
    //     setCitizenName(response.data.name);
    //     setVillage(response.data.village);
    //   } catch (error) {
    //     console.error('Error fetching user data:', error);
    //   }
    // };
    // fetchUserData();
    
    // For now, using placeholder data
    setCitizenName('John Doe');
  }, []);
  
  const handleLogout = () => {
    // Implement logout logic here
    // Clear local storage, cookies, etc.
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="dashboard">
      <div className="sidebar">
        <div className="user-info">
          <h2>Citizen Portal</h2>
          <p id="citizenName">Welcome, {citizenName}</p>
        </div>
        <nav>
          <Link to="/citizen/profile" className="menu-item">My Profile</Link>
          <Link to="/citizen/employees" className="menu-item">Panchayat Committee</Link>
          <Link to="/citizen/schemes" className="menu-item">Welfare Schemes</Link>
          <Link to="/citizen/assets" className="menu-item">Village Assets</Link>
          <Link to="/citizen/land-records" className="menu-item">Land Records</Link>
          <Link to="/citizen/census" className="menu-item">Census Data</Link>
          <button onClick={handleLogout} className="menu-item logout-button">Logout</button>
        </nav>
      </div>
      <div className="main-content">
        <div className="welcome-header">
          <h1>Citizen Dashboard</h1>
          <p>Village: {village}</p>
        </div>
        <div className="card-container">
          <div className="card">
            <Link to="/citizen/schemes">
              <h3>Active Schemes</h3>
              <p>List of Schemes available</p>
            </Link>
          </div>
          <div className="card">
            <Link to="/citizen/applications">
              <h3>My Applications</h3>
              <p>Track your applications</p>
            </Link>
          </div>
          <div className="card">
            <Link to="/citizen/vaccinations">
              <h3>Vaccination Records</h3>
              <p>View your vaccination history</p>
            </Link>
          </div>
          <div className="card">
            <Link to="/citizen/household">
              <h3>Household Information</h3>
              <p>View your household details</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;