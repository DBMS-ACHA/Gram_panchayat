import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import '../../styles/citizens/Applications.css';

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/');
          return;
        }
        
        const response = await axios.get('http://localhost:3535/citizen/applications', {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        setApplications(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching applications:', error);
        setError('Failed to load applications. Please try again later.');
        setLoading(false);
        
        if (error.response && error.response.status === 401) {
          navigate('/');
        }
      }
    };

    fetchApplications();
  }, [navigate]);

  const getStatusClass = (status) => {
    switch(status.toLowerCase()) {
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      case 'pending':
        return 'status-pending';
      default:
        return '';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="applications-container">
      <div className="applications-header">
        <h1>My Applications</h1>
        <Link to="/citizen/dashboard" className="back-link">Back to Dashboard</Link>
      </div>
      
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your applications...</p>
        </div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <>
          {applications.length === 0 ? (
            <div className="no-applications">
              <p>You have not applied for any schemes yet.</p>
              <Link to="/citizen/schemes" className="apply-now-button">
                Browse Available Schemes
              </Link>
            </div>
          ) : (
            <div className="applications-list">
              {applications.map((application) => (
                <div key={`${application.citizen_id}-${application.scheme_id}`} className="application-card">
                  <div className="scheme-name">{application.scheme_name}</div>
                  <div className="application-details">
                    <div className="detail-row">
                      <span className="label">Application Date:</span>
                      <span className="value">{formatDate(application.application_date)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Status:</span>
                      <span className={`value ${getStatusClass(application.status)}`}>
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Scheme Description:</span>
                      <span className="value description">{application.description}</span>
                    </div>
                    {application.status.toLowerCase() === 'approved' && (
                      <div className="detail-row">
                        <span className="label">Expiry Date:</span>
                        <span className="value">{formatDate(application.expiry_date) || 'No Expiry'}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Applications;