import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

// This component checks if the user has the required role
const RoleGuard = ({ requiredRole, children }) => {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const verifyRole = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setHasAccess(false);
          setLoading(false);
          return;
        }

        const response = await axios.get('http://localhost:3535/auth/verify-role', {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        // Check if user has the required role
        setHasAccess(response.data.role === requiredRole);
        setLoading(false);
      } catch (error) {
        console.error('Error verifying role:', error);
        setHasAccess(false);
        setLoading(false);
      }
    };

    verifyRole();
  }, [requiredRole]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Verifying access...</p>
      </div>
    );
  }

  if (!hasAccess) {
    return <Navigate to="/" />;
  }

  return children;
};

export default RoleGuard;