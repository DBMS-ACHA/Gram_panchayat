import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/monitors/CitizenProfileMonitor.css';

const CitizenProfileMonitor = () => {
  const { id } = useParams();
  const [citizenProfile, setCitizenProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCitizenProfile = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          navigate('/');
          return;
        }
        
        const response = await axios.get(`http://localhost:3535/monitor/citizen/${id}`, {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        setCitizenProfile(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching citizen profile:', error);
        setError('Failed to load citizen profile. Please try again later.');
        setLoading(false);
        
        if (error.response && error.response.status === 401) {
          navigate('/');
        } else if (error.response && error.response.status === 404) {
          setError('Citizen not found.');
        }
      }
    };

    fetchCitizenProfile();
  }, [id, navigate]);

  const formatDate = (dateString) => {
    if (!dateString) return "Not available";
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const calculateAge = (dob) => {
    if (!dob) return "Not available";
    
    const birthDate = new Date(dob);
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "Not available";
    return '₹' + Number(amount).toLocaleString('en-IN');
  };

  return (
    <div className="citizen-profile-monitor-container">
      <div className="citizen-profile-header">
        <div className="title-section">
          <h1>Citizen Profile</h1>
          <Link to="/employee/village" className="back-link">Back to Citizens Registry</Link>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading citizen profile...</p>
        </div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : citizenProfile ? (
        <div className="profile-sections">
          <section className="profile-card personal-info">
            <h2>Personal Information</h2>
            <div className="card-content">
              <div className="info-item">
                <span className="label">Name:</span>
                <span className="value">{citizenProfile.name}</span>
              </div>
              <div className="info-item">
                <span className="label">Citizen ID:</span>
                <span className="value">{citizenProfile.citizen_id}</span>
              </div>
              <div className="info-item">
                <span className="label">Gender:</span>
                <span className="value">{citizenProfile.gender}</span>
              </div>
              <div className="info-item">
                <span className="label">Date of Birth:</span>
                <span className="value">{formatDate(citizenProfile.dob)}</span>
              </div>
              <div className="info-item">
                <span className="label">Age:</span>
                <span className="value">{calculateAge(citizenProfile.dob)} years</span>
              </div>
              <div className="info-item">
                <span className="label">Educational Qualification:</span>
                <span className="value">{citizenProfile.educational_qualification || "Not specified"}</span>
              </div>
              <div className='info-item'>   
                <span className="label">Income:</span>
                <span className="value">{formatCurrency(citizenProfile.income)}</span>
              </div>
            </div>
          </section>

          <section className="profile-card household-info">
            <h2>Household Information</h2>
            <div className="card-content">
              <div className="info-item">
                <span className="label">Household ID:</span>
                <span className="value">{citizenProfile.household_id || "Not assigned"}</span>
              </div>
              <div className="info-item">
                <span className="label">Address:</span>
                <span className="value">{citizenProfile.address || "Not available"}</span>
              </div>
            </div>
          </section>

          {/* Family Members */}
          <section className="profile-card family-members">
            <h2>Family Members</h2>
            <div className="card-content">
              {citizenProfile.family_members && citizenProfile.family_members.length > 0 ? (
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Gender</th>
                        <th>Date of Birth</th>
                        <th>Education</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {citizenProfile.family_members.map(member => (
                        <tr key={member.citizen_id}>
                          <td>{member.name}</td>
                          <td>{member.gender}</td>
                          <td>{formatDate(member.dob)}</td>
                          <td>{member.educational_qualification || "Not specified"}</td>
                          <td>
                            <button 
                              className="view-profile-button"
                              onClick={() => navigate(`/employee/citizens/${member.citizen_id}`)}
                            >
                              View Profile
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="no-data">No family members recorded</div>
              )}
            </div>
          </section>

          {/* Land Records */}
          <section className="profile-card land-records">
            <h2>Land Records</h2>
            <div className="card-content">
              {citizenProfile.land_records && citizenProfile.land_records.length > 0 ? (
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Land ID</th>
                        <th>Area (acres)</th>
                        <th>Crop Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {citizenProfile.land_records.map(record => (
                        <tr key={record.land_id}>
                          <td>{record.land_id}</td>
                          <td>{record.area_acres}</td>
                          <td>{record.crop_type || "Not specified"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="no-data">No land records found</div>
              )}
            </div>
          </section>

          {/* Employment Details */}
          <section className="profile-card employment">
            <h2>Employment in Panchayat</h2>
            <div className="card-content">
              {citizenProfile.employment_details && citizenProfile.employment_details.length > 0 ? (
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Employee ID</th>
                        <th>Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {citizenProfile.employment_details.map((employment, index) => (
                        <tr key={index}>
                          <td>{employment.employee_id}</td>
                          <td>{employment.role}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="no-data">Not employed by the panchayat</div>
              )}
            </div>
          </section>

          {/* Vaccination History */}
          <section className="profile-card vaccinations">
            <h2>Vaccination History</h2>
            <div className="card-content">
              {citizenProfile.vaccination_history && citizenProfile.vaccination_history.length > 0 ? (
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Vaccine Type</th>
                        <th>Date Administered</th>
                      </tr>
                    </thead>
                    <tbody>
                      {citizenProfile.vaccination_history.map((vaccination, index) => (
                        <tr key={index}>
                          <td>{vaccination.vaccine_type}</td>
                          <td>{formatDate(vaccination.date_administered)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="no-data">No vaccination records found</div>
              )}
            </div>
          </section>

          {/* Welfare Schemes */}
          <section className="profile-card welfare">
            <h2>Welfare Schemes</h2>
            <div className="card-content">
              <div className="welfare-tabs">
                <h3>Enrolled Schemes</h3>
                {citizenProfile.enrolled_schemes && citizenProfile.enrolled_schemes.length > 0 ? (
                  <div className="table-responsive">
                    <table>
                      <thead>
                        <tr>
                          <th>Scheme Name</th>
                          <th>Enrollment Date</th>
                          <th>Status</th>
                          <th>Expiry Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {citizenProfile.enrolled_schemes.map((scheme, index) => (
                          <tr key={index}>
                            <td>{scheme.scheme_name}</td>
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
                ) : (
                  <div className="no-data">No enrolled schemes</div>
                )}
                
                <h3>Applied Schemes</h3>
                {citizenProfile.scheme_applications && citizenProfile.scheme_applications.length > 0 ? (
                  <div className="table-responsive">
                    <table>
                      <thead>
                        <tr>
                          <th>Scheme Name</th>
                          <th>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {citizenProfile.scheme_applications.map((application, index) => (
                          <tr key={index}>
                            <td>{application.scheme_name}</td>
                            <td>{application.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="no-data">No pending applications</div>
                )}
              </div>
            </div>
          </section>

          {/* Census Data */}
          <section className="profile-card census">
            <h2>Census Events</h2>
            <div className="card-content">
              {citizenProfile.census_events && citizenProfile.census_events.length > 0 ? (
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Event Type</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {citizenProfile.census_events.map((event, index) => (
                        <tr key={index}>
                          <td>{event.event_type}</td>
                          <td>{formatDate(event.event_date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="no-data">No census events recorded</div>
              )}
            </div>
          </section>
        </div>
      ) : (
        <div className="error-message">Citizen not found</div>
      )}
    </div>
  );
};

export default CitizenProfileMonitor;