import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';

const Login = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: 'citizen'
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData({
            ...formData,
            [id]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const { username, password, role } = formData;
        
        if (!username || !password || !role) {
            showError('Please enter both username and password and role.');
            return;
        }
        
        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password, role })
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Invalid username or password.');
                }
                throw new Error('An error occurred during login.');
            }
            
            const data = await response.json();
            
            // Store the tokens and role
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('role', data.role);
            
            // Redirect to dashboard
            navigate(data.redirectUrl);
            
        } catch (err) {
            showError(err.message);
        }
    };
    
    const showError = (message) => {
        setError(message);
        setTimeout(() => {
            setError('');
        }, 3000);
    };

    return (
        <div className="login-page">
            <h1>Gram Panchayat Management System</h1>
            
            <div className="login-container">
                <h2>User Login</h2>
                <form id="loginForm" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="role">Role:</label>
                        <select 
                            id="role"
                            value={formData.role}
                            onChange={handleChange}
                        >
                            <option value="citizen">Citizen</option>
                            <option value="admin">Admin</option>
                            <option value="panchayat">Panchayat</option>
                            <option value="monitor">Government Monitor</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="username">Username:</label>
                        <input 
                            type="text" 
                            id="username" 
                            value={formData.username}
                            onChange={handleChange}
                            required 
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password:</label>
                        <input 
                            type="password" 
                            id="password" 
                            value={formData.password}
                            onChange={handleChange}
                            required 
                        />
                    </div>
                    {error && <div className="error-message">{error}</div>}
                    <button type="submit">Login</button>
                </form>
                <p><small>New user? Ask admin to create an id</small></p>
            </div>

            <div className="section">
                <h3>Latest Updates</h3>
                <p>View recent announcements and updates from the Panchayat</p>
            </div>

            <div className="section">
                <h3>Schemes</h3>
                <p>Information about various government schemes</p>
            </div>

            <div className="section">
                <h3>Services</h3>
                <p>Access various Panchayat services</p>
            </div>
        </div>
    );
};

export default Login;