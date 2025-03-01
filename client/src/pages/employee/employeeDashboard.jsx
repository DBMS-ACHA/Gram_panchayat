import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../styles/Dashboard.css';
import axios from 'axios';

const EmployeeDashboard = () => {
    const [employeeName, setEmployeeName] = useState('');
    const [employeeRole, setEmployeeRole] = useState('');
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
                const response = await axios.get('http://localhost:3535/employee/profile', {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                
                if (response.data && response.data.name) {
                    setEmployeeName(response.data.name);
                }
                
                if (response.data && response.data.role) {
                    setEmployeeRole(response.data.role);
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
            navigate('/');
        }
    };

    return (
        <div className="dashboard">
            <div className="sidebar">
                <div className="user-info">
                    <h2>Employee Portal</h2>
                    <p id="employeeName">Welcome, {employeeName}</p>
                    <p id="employeeRole">{employeeRole}</p>
                </div>
                <nav>
                    <button onClick={handleLogout} className="menu-item logout-button">Logout</button>
                </nav>
            </div>
            <div className="main-content">
                <div className="welcome-header">
                    <h1>Employee Dashboard</h1>
                    <p>Village: {village}</p>
                </div>
                <div className="card-container">
                    <div className="card">
                        <Link to="/employee/village">
                            <h3>Citizen Registry</h3>
                            <p>Manage citizen records and profiles</p>
                        </Link>
                    </div>
                    <div className="card">
                        <Link to="/employee/welfare-schemes">
                            <h3>Welfare Schemes</h3>
                            <p>Process applications and manage enrollments</p>
                        </Link>
                    </div>
                    <div className="card">
                        <Link to="/employee/census">
                            <h3>Census Management</h3>
                            <p>Record births, deaths, and migrations</p>
                        </Link>
                    </div>
                    <div className="card">
                        <Link to="/employee/land-records">
                            <h3>Land Records</h3>
                            <p>Manage land ownership and usage records</p>
                        </Link>
                    </div>
                    <div className="card">
                        <Link to="/employee/vaccinations">
                            <h3>Vaccination Records</h3>
                            <p>Schedule and record vaccinations</p>
                        </Link>
                    </div>
                    <div className="card">
                        <Link to="/employee/assets">
                            <h3>Asset Management</h3>
                            <p>Update and maintain panchayat assets</p>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeDashboard;