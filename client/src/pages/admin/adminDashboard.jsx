import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../styles/Dashboard.css';
import axios from 'axios';

const AdminDashboard = () => {
    const [village, setVillage] = useState('Phulera');
    const navigate = useNavigate();

    // Fetch admin data on component mount
    useEffect(() => {
        const validateToken = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/');
                    return;
                }
                // Just verify the token is valid, without setting name/role
                await axios.get('http://localhost:3535/admin/profile', {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
            } catch (error) {
                console.error('Authentication error:', error);
                // If there's an authentication error, redirect to login
                if (error.response && error.response.status === 401) {
                    navigate('/');
                }
            }
        };

        validateToken();
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
                    <h2>Admin Portal</h2>
                </div>
                <nav>
                    <button onClick={handleLogout} className="menu-item logout-button">Logout</button>
                </nav>
            </div>
            <div className="main-content">
                <div className="welcome-header">
                    <h1>Admin Dashboard</h1>
                    <p>Village: {village}</p>
                </div>
                <div className="card-container">
                    <div className="card">
                        <Link to="/admin/user-management">
                            <h3>User Management</h3>
                            <p>Add, remove, or update user accounts</p>
                        </Link>
                    </div>
                    <div className="card">
                        <Link to="/admin/employee-management">
                            <h3>Employee Management</h3>
                            <p>Manage employee profiles and access privileges</p>
                        </Link>
                    </div>
                    <div className="card">
                        <Link to="/admin/reports">
                            <h3>Reports & Statistics</h3>
                            <p>Generate and view system reports</p>
                        </Link>
                    </div>
                    <div className="card">
                        <Link to="/admin/system-logs">
                            <h3>System Logs</h3>
                            <p>View audit trails and system activities</p>
                        </Link>
                    </div>
                    <div className="card">
                        <Link to="/admin/configurations">
                            <h3>System Configuration</h3>
                            <p>Manage application settings and parameters</p>
                        </Link>
                    </div>
                    <div className="card">
                        <Link to="/admin/backup">
                            <h3>Backup & Recovery</h3>
                            <p>Manage data backup and system recovery</p>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;