import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import '../../styles/citizens/Schemes.css';

const Schemes = () => {
  const [schemesData, setSchemesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applyingScheme, setApplyingScheme] = useState(null);
  const [applicationStatus, setApplicationStatus] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSchemesData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/');
          return;
        }
        
        const response = await axios.get('http://localhost:3535/citizen/schemes', {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setSchemesData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching schemes data:', error);
        setError('Failed to load schemes. Please try again later.');
        setLoading(false);
        
        if (error.response && error.response.status === 401) {
          navigate('/');
        }
      }
    };

    fetchSchemesData();
  }, [navigate]);

  const handleApply = async (schemeId) => {
    try {
      setApplyingScheme(schemeId);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }
      
      await axios.post('http://localhost:3535/citizen/schemes/apply', 
        { schemeId }, 
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setApplicationStatus({
        ...applicationStatus,
        [schemeId]: { success: true, message: 'Application submitted successfully!' }
      });
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setApplicationStatus({
          ...applicationStatus,
          [schemeId]: null
        });
      }, 3000);
    } catch (error) {
      console.error('Error applying for scheme:', error);
      
      let errorMessage = 'Failed to submit application. Please try again.';
      
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      
      setApplicationStatus({
        ...applicationStatus,
        [schemeId]: { success: false, message: errorMessage }
      });
    } finally {
      setApplyingScheme(null);
    }
  };

  // Calculate remaining time for a scheme
  const calculateTimeRemaining = (expiryDate) => {
    if (!expiryDate) return { expired: true };
    
    const now = new Date();
    const expiry = new Date(expiryDate);
    
    if (now >= expiry) {
      return { expired: true };
    }
    
    const totalSeconds = Math.floor((expiry - now) / 1000);
    const days = Math.floor(totalSeconds / (60 * 60 * 24));
    const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    
    return { expired: false, days, hours, minutes };
  };

  return (
    <div className="schemes-container">
      <div className="schemes-header">
        <h1>Welfare Schemes</h1>
        <Link to="/citizen/dashboard" className="back-link">Back to Dashboard</Link>
      </div>
      
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading schemes...</p>
        </div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="schemes-list">
          {schemesData.length === 0 ? (
            <div className="no-schemes">No welfare schemes currently available.</div>
          ) : (
            schemesData.map((scheme) => {
              const timeRemaining = calculateTimeRemaining(scheme.expiry_date);
              
              return (
                <div key={scheme.scheme_id} className="scheme-card">
                  <div className="scheme-header">
                    <h2>{scheme.name}</h2>
                    <div className={`scheme-status ${scheme.status ? 'active' : 'inactive'}`}>
                      {scheme.status ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                  
                  <div className="scheme-description">
                    {scheme.description}
                  </div>
                  
                  <div className="scheme-expiry">
                    {scheme.expiry_date ? (
                      timeRemaining.expired ? (
                        <div className="expired">Expired</div>
                      ) : (
                        <div className="timer">
                          Expires in: 
                          {timeRemaining.days > 0 && <span> {timeRemaining.days} days</span>}
                          {timeRemaining.hours > 0 && <span> {timeRemaining.hours} hours</span>}
                          {timeRemaining.minutes > 0 && <span> {timeRemaining.minutes} minutes</span>}
                        </div>
                      )
                    ) : (
                      <div className="no-expiry">No expiration date</div>
                    )}
                  </div>
                  
                  <div className="scheme-action">
                    {scheme.status && !timeRemaining.expired ? (
                      <>
                        <button 
                          className="apply-button" 
                          onClick={() => handleApply(scheme.scheme_id)} 
                          disabled={applyingScheme === scheme.scheme_id}
                        >
                          {applyingScheme === scheme.scheme_id ? 'Applying...' : 'Apply Now'}
                        </button>
                        
                        {applicationStatus[scheme.scheme_id] && (
                          <div className={`application-status ${applicationStatus[scheme.scheme_id].success ? 'success' : 'error'}`}>
                            {applicationStatus[scheme.scheme_id].message}
                          </div>
                        )}
                      </>
                    ) : (
                      <button className="apply-button disabled" disabled>
                        Not Available
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default Schemes;