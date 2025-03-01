import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../styles/Dashboard.css';
import axios from 'axios';

// filepath: /Users/aryansanghi/Desktop/CSE Dep/DBMS/LA4/Gram_Panchayat/client/src/pages/monitorDashboard.jsx

const MonitorDashboard = () => {
    const [monitorName, setMonitorName] = useState('');
    const [village, setVillage] = useState('Phulera');
    const navigate = useNavigate();

    // Fetch user data on component mount
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/');
                    return;
                }
                const response = await axios.get('http://localhost:3535/monitor/profile', {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                
                if (response.data && response.data.name) {
                    setMonitorName(response.data.name);
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
            navigate('/login');
        }
    };

    return (
        <div className="dashboard">
            <div className="sidebar">
                <div className="user-info">
                    <h2>Monitor Portal</h2>
                    <p id="monitorName">Welcome, {monitorName}</p>
                </div>
                <nav>
                    <button onClick={handleLogout} className="menu-item logout-button">Logout</button>
                </nav>
            </div>
            <div className="main-content">
                <div className="welcome-header">
                    <h1>Monitor Dashboard</h1>
                    <p>Village: {village}</p>
                </div>
                <div className="card-container">
                    <div className="card">
                        <Link to="/monitor/village">
                            <h3>Village Statistics</h3>
                            <p>View and report village statistics</p>
                        </Link>
                    </div>
                    <div className="card">
                        <Link to="/monitor/vaccination-records">
                            <h3>Vaccination Data</h3>
                            <p>Manage vaccination records</p>
                        </Link>
                    </div>
                    <div className="card">
                        <Link to="/monitor/citizen-registry">
                            <h3>Citizen Registry</h3>
                            <p>Manage citizen information</p>
                        </Link>
                    </div>
                    <div className="card">
                        <Link to="/monitor/household-data">
                            <h3>Household Data</h3>
                            <p>Manage household information</p>
                        </Link>
                    </div>
                    <div className="card">
                        <Link to="/monitor/census-reporting">
                            <h3>Census Reporting</h3>
                            <p>Update and view census data</p>
                        </Link>
                    </div>
                    <div className="card">
                        <Link to="/monitor/asset-tracking">
                            <h3>Asset Tracking</h3>
                            <p>Monitor panchayat assets</p>
                        </Link>
                    </div>
                    <div className="card">
                        <Link to="/monitor/land">
                            <h3>Land Records</h3>
                            <p>Verify land records</p>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MonitorDashboard;