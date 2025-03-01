import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaHome, FaUsers, FaFileAlt, FaLeaf, FaBriefcase, FaSyringe, FaHandHoldingHeart, FaClipboardList, FaUserFriends } from 'react-icons/fa';
import '../../styles/citizens/Profile.css';

const Profile = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/');
          return;
        }
        const response = await axios.get('http://localhost:3535/citizen/profile', {
          headers: {
            Authorization: `Bearer ${token}`
          },
          withCredentials: true // Necessary for sending cookies with the request
        });
        setProfileData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching profile data:', error);
        setError('Could not load your profile. Please try again later.');
        setLoading(false);
        
        if (error.response && error.response.status === 401) {
          navigate('/');
        }
      }
    };

    fetchProfileData();
  }, [navigate]);

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return "Not available";
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">!</div>
        <h2>Error Loading Profile</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/citizen/dashboard')}>Return to Dashboard</button>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="error-container">
        <div className="error-icon">!</div>
        <h2>No Profile Data Found</h2>
        <p>We couldn't find any profile information for your account.</p>
        <button onClick={() => navigate('/citizen/dashboard')}>Return to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-title">
          <h1>My Profile</h1>
          <p className="last-login">Last login: {formatDate(profileData.last_login)}</p>
        </div>
        <Link to="/citizen/dashboard" className="back-button">
          Back to Dashboard
        </Link>
      </div>

      <div className="profile-grid">
        {/* Personal Information Card */}
        <div className="profile-card">
          <div className="card-header">
            <FaUser className="card-icon" />
            <h2>Personal Information</h2>
          </div>
          <div className="card-body">
            <div className="info-group">
              <label>Name</label>
              <p>{profileData.name || "Not available"}</p>
            </div>
            <div className="info-group">
              <label>Citizen ID</label>
              <p>{profileData.citizen_id || "Not available"}</p>
            </div>
            <div className="info-group">
              <label>Gender</label>
              <p>{profileData.gender || "Not available"}</p>
            </div>
            <div className="info-group">
              <label>Date of Birth</label>
              <p>{formatDate(profileData.dob)}</p>
            </div>
            <div className="info-group">
              <label>Education</label>
              <p>{profileData.educational_qualification || "Not available"}</p>
            </div>
          </div>
        </div>

        {/* Household Information Card */}
        <div className="profile-card">
          <div className="card-header">
            <FaHome className="card-icon" />
            <h2>Household Information</h2>
          </div>
          <div className="card-body">
            <div className="info-group">
              <label>Household ID</label>
              <p>{profileData.household_id || "Not available"}</p>
            </div>
            <div className="info-group">
              <label>Address</label>
              <p>{profileData.address || "Not available"}</p>
            </div>
            <div className="info-group">
              <label>Annual Income</label>
              <p>₹{profileData.income?.toLocaleString() || "Not available"}</p>
            </div>
          </div>
        </div>

        {/* Family Members Card */}
        {profileData.family_members && profileData.family_members.length > 0 && (
          <div className="profile-card wide">
            <div className="card-header">
              <FaUserFriends className="card-icon" />
              <h2>Family Members</h2>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Gender</th>
                      <th>Date of Birth</th>
                      <th>Education</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profileData.family_members.map((member, index) => (
                      <tr key={index}>
                        <td>{member.name || "Not available"}</td>
                        <td>{member.gender || "Not available"}</td>
                        <td>{formatDate(member.dob)}</td>
                        <td>{member.educational_qualification || "Not available"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Land Records Card */}
        {profileData.land_records && profileData.land_records.length > 0 && (
          <div className="profile-card wide">
            <div className="card-header">
              <FaLeaf className="card-icon" />
              <h2>Land Records</h2>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Land ID</th>
                      <th>Area (acres)</th>
                      <th>Crop Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profileData.land_records.map((record, index) => (
                      <tr key={index}>
                        <td>{record.land_id || "Not available"}</td>
                        <td>{record.area_acres || "Not available"}</td>
                        <td>{record.crop_type || "Not available"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Employment Details Card */}
        {profileData.employment_details && profileData.employment_details.length > 0 && (
          <div className="profile-card">
            <div className="card-header">
              <FaBriefcase className="card-icon" />
              <h2>Employment Details</h2>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Employee ID</th>
                      <th>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profileData.employment_details.map((job, index) => (
                      <tr key={index}>
                        <td>{job.employee_id || "Not available"}</td>
                        <td>{job.role || "Not available"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Vaccination History Card */}
        {profileData.vaccination_history && profileData.vaccination_history.length > 0 && (
          <div className="profile-card wide">
            <div className="card-header">
              <FaSyringe className="card-icon" />
              <h2>Vaccination History</h2>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Vaccination ID</th>
                      <th>Vaccine Type</th>
                      <th>Date Administered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profileData.vaccination_history.map((vaccination, index) => (
                      <tr key={index}>
                        <td>{vaccination.vaccination_id || "Not available"}</td>
                        <td>{vaccination.vaccine_type || "Not available"}</td>
                        <td>{formatDate(vaccination.date_administered)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Enrolled Schemes Card */}
        {profileData.enrolled_schemes && profileData.enrolled_schemes.length > 0 && (
          <div className="profile-card wide">
            <div className="card-header">
              <FaHandHoldingHeart className="card-icon" />
              <h2>Welfare Schemes</h2>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Scheme Name</th>
                      <th>Description</th>
                      <th>Enrollment Date</th>
                      <th>Status</th>
                      <th>Expiry Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profileData.enrolled_schemes.map((scheme, index) => (
                      <tr key={index}>
                        <td>{scheme.scheme_name || "Not available"}</td>
                        <td>{scheme.description || "Not available"}</td>
                        <td>{formatDate(scheme.enrollment_date)}</td>
                        <td className={scheme.status ? "status-active" : "status-inactive"}>
                          {scheme.status ? "Active" : "Inactive"}
                        </td>
                        <td>{formatDate(scheme.expiry_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Scheme Applications Card */}
        {profileData.scheme_applications && profileData.scheme_applications.length > 0 && (
          <div className="profile-card wide">
            <div className="card-header">
              <FaClipboardList className="card-icon" />
              <h2>Scheme Applications</h2>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Scheme Name</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profileData.scheme_applications.map((application, index) => (
                      <tr key={index}>
                        <td>{application.scheme_name || "Not available"}</td>
                        <td>{application.description || "Not available"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Census Events Card */}
        {profileData.census_events && profileData.census_events.length > 0 && (
          <div className="profile-card">
            <div className="card-header">
              <FaFileAlt className="card-icon" />
              <h2>Census Events</h2>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Event Type</th>
                      <th>Event Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profileData.census_events.map((event, index) => (
                      <tr key={index}>
                        <td>{event.event_type || "Not available"}</td>
                        <td>{formatDate(event.event_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;