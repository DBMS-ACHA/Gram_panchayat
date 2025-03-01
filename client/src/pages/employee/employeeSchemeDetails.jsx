import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/employee/SchemeDetailsPage.css';

const SchemeDetailsPage = () => {
    const params = useParams();
    const { schemeId } = params;
    const navigate = useNavigate();

    console.log('URL params:', params);
    console.log('Scheme ID:', schemeId);
    
    const [scheme, setScheme] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    
    // For application management
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [processingNotes, setProcessingNotes] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    
    // Fetch scheme details
    useEffect(() => {
        const fetchSchemeDetails = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                
                if (!token) {
                    navigate('/');
                    return;
                }
                
                const response = await axios.get(`http://localhost:3535/employee/schemes/${schemeId}`, {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                
                setScheme(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching scheme details:', error);
                setError(error.response?.data?.error || 'Failed to load scheme details. Please try again.');
                setLoading(false);
                
                if (error.response && error.response.status === 401) {
                    navigate('/');
                }
            }
        };

        fetchSchemeDetails();
    }, [schemeId, navigate]);
    
    const formatDate = (dateString) => {
        if (!dateString) return "Not available";
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };
    
    const getStatusClass = () => {
        if (!scheme) return '';
        
        if (!scheme.status) return 'status-inactive';
        if (scheme.expiry_date && new Date(scheme.expiry_date) < new Date()) return 'status-expired';
        
        // Check if scheme is expiring soon (within 30 days)
        if (scheme.expiry_date) {
            const expiryDate = new Date(scheme.expiry_date);
            const today = new Date();
            const daysUntilExpiry = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));
            
            if (daysUntilExpiry <= 30) return 'status-expiring-soon';
        }
        
        return 'status-active';
    };

    const getStatusLabel = () => {
        if (!scheme) return '';
        
        if (!scheme.status) return 'Inactive';
        if (scheme.expiry_date && new Date(scheme.expiry_date) < new Date()) return 'Expired';
        
        // Check if scheme is expiring soon (within 30 days)
        if (scheme.expiry_date) {
            const expiryDate = new Date(scheme.expiry_date);
            const today = new Date();
            const daysUntilExpiry = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));
            
            if (daysUntilExpiry <= 30) return `Expires in ${daysUntilExpiry} days`;
        }
        
        return 'Active';
    };
    
    const openProcessingModal = (application) => {
        setSelectedApplication(application);
        setProcessingNotes('');
        setIsModalOpen(true);
    };
    
    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedApplication(null);
        setProcessingNotes('');
    };
    
    const handleProcessApplication = async (status) => {
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                navigate('/');
                return;
            }
            
            await axios.put(
                `http://localhost:3535/employee/scheme-applications/${selectedApplication.citizen_id}/${schemeId}`, 
                {
                    status,
                    notes: processingNotes
                },
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            
            // Refresh scheme data
            const response = await axios.get(`http://localhost:3535/employee/schemes/${schemeId}`, {
                withCredentials: true,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            
            setScheme(response.data);
            setSuccessMessage(`Application ${status === 'approved' ? 'approved' : 'rejected'} successfully!`);
            closeModal();
            
            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccessMessage('');
            }, 3000);
            
        } catch (error) {
            console.error('Error processing application:', error);
            setError(error.response?.data?.error || 'Failed to process application. Please try again.');
        }
    };
    
    if (loading) {
        return (
            <div className="scheme-details-container">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading scheme details...</p>
                </div>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="scheme-details-container">
                <div className="error-message">
                    {error}
                    <Link to="/employee/welfare-schemes" className="back-link">Back to Schemes</Link>
                </div>
            </div>
        );
    }
    
    if (!scheme) {
        return (
            <div className="scheme-details-container">
                <div className="not-found-message">
                    <h2>Scheme not found</h2>
                    <p>The requested scheme could not be found.</p>
                    <Link to="/employee/welfare-schemes" className="back-link">Back to Schemes</Link>
                </div>
            </div>
        );
    }
    
    return (
        <div className="scheme-details-container">
            <div className="scheme-details-header">
                <div className="breadcrumb">
                    <Link to="/employee/dashboard">Dashboard</Link> &gt; 
                    <Link to="/employee/welfare-schemes"> Schemes</Link> &gt; 
                    <span> {scheme.name}</span>
                </div>
                
                <div className="scheme-header-content">
                    <h1>{scheme.name}</h1>
                    <div className="scheme-actions">
                        <button 
                            className="edit-scheme-button"
                            onClick={() => navigate(`/employee/welfare-schemes`, { state: { editSchemeId: scheme.scheme_id } })}
                        >
                            Edit Scheme
                        </button>
                        <Link to="/employee/welfare-schemes" className="back-to-schemes">
                            All Schemes
                        </Link>
                    </div>
                </div>
                
                <div className={`scheme-status-banner ${getStatusClass()}`}>
                    {getStatusLabel()}
                </div>
                
                {successMessage && (
                    <div className="success-message">
                        {successMessage}
                    </div>
                )}
            </div>
            
            <div className="scheme-details-tabs">
                <button 
                    className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    Overview
                </button>
                <button 
                    className={`tab ${activeTab === 'enrollments' ? 'active' : ''}`}
                    onClick={() => setActiveTab('enrollments')}
                >
                    Enrollments ({scheme.enrolled_citizens?.length || 0})
                </button>
                <button 
                    className={`tab ${activeTab === 'applications' ? 'active' : ''}`}
                    onClick={() => setActiveTab('applications')}
                >
                    Applications ({scheme.applications?.length || 0})
                </button>
            </div>
            
            <div className="scheme-details-content">
                {activeTab === 'overview' && (
                    <div className="scheme-overview">
                        <div className="scheme-summary">
                            <div className="scheme-info-card">
                                <h2>Scheme Information</h2>
                                <div className="info-row">
                                    <div className="info-label">Scheme ID:</div>
                                    <div className="info-value">{scheme.scheme_id}</div>
                                </div>
                                <div className="info-row">
                                    <div className="info-label">Name:</div>
                                    <div className="info-value">{scheme.name}</div>
                                </div>
                                <div className="info-row">
                                    <div className="info-label">Status:</div>
                                    <div className="info-value">
                                        <span className={`status-badge ${getStatusClass()}`}>
                                            {getStatusLabel()}
                                        </span>
                                    </div>
                                </div>
                                <div className="info-row">
                                    <div className="info-label">Expiry Date:</div>
                                    <div className="info-value">
                                        {scheme.expiry_date ? formatDate(scheme.expiry_date) : "No expiry date"}
                                    </div>
                                </div>
                                <div className="info-row description-row">
                                    <div className="info-label">Description:</div>
                                    <div className="info-value description-text">
                                        {scheme.description || "No description available"}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="scheme-stats-card">
                                <h2>Scheme Statistics</h2>
                                <div className="scheme-stats-grid">
                                    <div className="stat-item">
                                        <div className="stat-number">
                                            {scheme.enrolled_count || 0}
                                        </div>
                                        <div className="stat-label">Enrolled Citizens</div>
                                    </div>
                                    <div className="stat-item">
                                        <div className="stat-number">
                                            {scheme.pending_applications || 0}
                                        </div>
                                        <div className="stat-label">Pending Applications</div>
                                    </div>
                                </div>
                                <div className="scheme-timeline">
                                    {scheme.applications && scheme.applications.length > 0 ? (
                                        <>
                                            <h3>Recent Activity</h3>
                                            <ul className="activity-timeline">
                                                {scheme.applications.slice(0, 3).map((app, index) => (
                                                    <li key={index} className="timeline-item">
                                                        <div className="timeline-date">
                                                            {formatDate(app.application_date)}
                                                        </div>
                                                        <div className="timeline-content">
                                                            <strong>{app.name}</strong> applied for this scheme
                                                            <span className={`timeline-status status-${app.status}`}>
                                                                {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                                                            </span>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </>
                                    ) : (
                                        <p className="no-activity">No recent activity for this scheme</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {activeTab === 'enrollments' && (
                    <div className="scheme-enrollments">
                        <div className="enrollments-header">
                            <h2>Enrolled Citizens</h2>
                            <div className="enrolled-count">
                                Total: <strong>{scheme.enrolled_citizens?.length || 0}</strong> citizens
                            </div>
                        </div>
                        
                        {scheme.enrolled_citizens?.length > 0 ? (
                            <table className="enrollments-table">
                                <thead>
                                    <tr>
                                        <th>Citizen ID</th>
                                        <th>Name</th>
                                        <th>Enrollment Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {scheme.enrolled_citizens.map((citizen) => (
                                        <tr key={citizen.citizen_id}>
                                            <td>{citizen.citizen_id}</td>
                                            <td>{citizen.name}</td>
                                            <td>{formatDate(citizen.enrollment_date)}</td>
                                            <td>
                                                <button 
                                                    className="view-citizen-button"
                                                    onClick={() => navigate(`/employee/citizens/${citizen.citizen_id}`)}
                                                >
                                                    View Profile
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="no-data-message">
                                No citizens are currently enrolled in this scheme.
                            </div>
                        )}
                    </div>
                )}
                
                {activeTab === 'applications' && (
                    <div className="scheme-applications">
                        <div className="applications-header">
                            <h2>Scheme Applications</h2>
                            <div className="applications-filter">
                                <label>Filter by status:</label>
                                <select className="status-filter">
                                    <option value="all">All Applications</option>
                                    <option value="pending">Pending</option>
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>
                        </div>
                        
                        {scheme.applications?.length > 0 ? (
                            <table className="applications-table">
                                <thead>
                                    <tr>
                                        <th>Application Date</th>
                                        <th>Citizen ID</th>
                                        <th>Name</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {scheme.applications.map((application, index) => (
                                        <tr key={index} className={`status-${application.status}`}>
                                            <td>{formatDate(application.application_date)}</td>
                                            <td>{application.citizen_id}</td>
                                            <td>{application.name}</td>
                                            <td>
                                                <span className={`application-status status-${application.status}`}>
                                                    {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="application-actions">
                                                <button 
                                                    className="view-citizen-button"
                                                    onClick={() => navigate(`/employee/citizens/${application.citizen_id}`)}
                                                >
                                                    View Citizen
                                                </button>
                                                
                                                {application.status === 'pending' && (
                                                    <button 
                                                        className="process-button"
                                                        onClick={() => openProcessingModal(application)}
                                                    >
                                                        Process
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="no-data-message">
                                No applications have been submitted for this scheme.
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            {/* Modal for processing applications */}
            {isModalOpen && selectedApplication && (
                <div className="modal-overlay">
                    <div className="modal process-application-modal">
                        <div className="modal-header">
                            <h2>Process Application</h2>
                            <button className="close-button" onClick={closeModal}>×</button>
                        </div>
                        
                        <div className="modal-content">
                            <div className="application-details">
                                <h3>Application Information</h3>
                                
                                <div className="application-info-row">
                                    <div className="info-label">Citizen:</div>
                                    <div className="info-value">{selectedApplication.name} (ID: {selectedApplication.citizen_id})</div>
                                </div>
                                
                                <div className="application-info-row">
                                    <div className="info-label">Scheme:</div>
                                    <div className="info-value">{scheme.name}</div>
                                </div>
                                
                                <div className="application-info-row">
                                    <div className="info-label">Applied on:</div>
                                    <div className="info-value">{formatDate(selectedApplication.application_date)}</div>
                                </div>
                                
                                <div className="form-group">
                                    <label>Processing Notes:</label>
                                    <textarea 
                                        value={processingNotes}
                                        onChange={(e) => setProcessingNotes(e.target.value)}
                                        placeholder="Add notes about this application processing"
                                        rows={4}
                                    ></textarea>
                                </div>
                                
                                <div className="processing-warning">
                                    <strong>Note:</strong> This decision will be recorded and visible to the citizen.
                                </div>
                                
                                <div className="processing-actions">
                                    <button 
                                        className="reject-button"
                                        onClick={() => handleProcessApplication('rejected')}
                                    >
                                        Reject Application
                                    </button>
                                    
                                    <button 
                                        className="approve-button"
                                        onClick={() => handleProcessApplication('approved')}
                                    >
                                        Approve Application
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SchemeDetailsPage;