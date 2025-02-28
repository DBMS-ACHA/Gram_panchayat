import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css'; // You'll need to create this CSS file with the styles from the HTML
import axios from 'axios';

// This will be your main dashboard component
const Dashboard = () => {
  const [citizenName, setCitizenName] = useState('');
  const [village, setVillage] = useState('Phulera');
  const navigate = useNavigate();

  // You would fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/');
          return
        }
        const response = await axios.get('http://localhost:3535/citizen/profile', {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (response.data && response.data.name) {
          setCitizenName(response.data.name);
        }
      
      } catch (error) {
        console.error('Error fetching user data:', error);
        // If there's an authentication error, redirect to login
        if (error.response && error.response.status === 401) {
          navigate('/');
        }
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      // Call logout endpoint to clear the server-side cookie
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }
      await axios.post('http://localhost:3535/api/auth/logout', {}, {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Clear any client-side storage
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('username');
      
      // Redirect to login page
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      // Redirect to login anyway
      navigate('/login');
    }
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
          <Link to="/citizen/schemes" className="menu-item">Welfare Schemes</Link>
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
          <div className="card">
            <Link to="/citizen/employees">
              <h3>Panchayat Employees</h3>
              <p>View Panchayat Employees</p>
            </Link>
          </div>
          <div className='card'>
            <Link to="/citizen/assets">
              <h3>Assets</h3>
              <p>Assets owned by panchayat</p>
            </Link>
          </div>
          <div className='card'>
            <Link to="/citizen/census">
              <h3>Census Data</h3>
              <p>View census data</p>
            </Link>
          </div>
          <div className='card'>
            <Link to="/citizen/land-records">
              <h3>Land Records</h3>
              <p>View land records</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;