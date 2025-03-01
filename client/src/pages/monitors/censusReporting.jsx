import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/monitors/CensusReporting.css';

const CensusReporting = () => {
  const [censusData, setCensusData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('event_date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filterEventType, setFilterEventType] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCensusData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          navigate('/');
          return;
        }
        
        const response = await axios.get('http://localhost:3535/monitor/census', {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        setCensusData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching census data:', error);
        setError('Failed to load census data. Please try again later.');
        setLoading(false);
        
        if (error.response && error.response.status === 401) {
          navigate('/');
        }
      }
    };

    fetchCensusData();
  }, [navigate]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return '⇅';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not available";
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getEventTypeClass = (eventType) => {
    switch(eventType.toLowerCase()) {
      case 'birth':
        return 'event-birth';
      case 'death':
        return 'event-death';
      case 'marriage':
        return 'event-marriage';
      case 'migration_in':
        return 'event-migration-in';
      case 'migration_out':
        return 'event-migration-out';
      default:
        return '';
    }
  };

  // Extract unique event types for filter dropdown
  const eventTypes = [...new Set(censusData.map(item => item.event_type))];

  const filteredAndSortedCensusData = censusData
    .filter(item => 
      (filterEventType === '' || item.event_type === filterEventType) && 
      (
        (item.citizen_name && item.citizen_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.event_type && item.event_type.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.household_address && item.household_address.toLowerCase().includes(searchTerm.toLowerCase())) ||
        String(item.citizen_id).includes(searchTerm) ||
        String(item.household_id).includes(searchTerm)
      )
    )
    .sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      
      // Handle date fields
      if (sortField === 'event_date') {
        valA = valA ? new Date(valA).getTime() : 0;
        valB = valB ? new Date(valB).getTime() : 0;
      }
      
      if (valA < valB) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (valA > valB) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });

  // Calculate statistics
  const getEventStats = () => {
    const stats = {
      birth: 0,
      death: 0,
      marriage: 0,
      migration_in: 0,
      migration_out: 0
    };
    
    censusData.forEach(item => {
      const eventType = item.event_type?.toLowerCase();
      if (stats.hasOwnProperty(eventType)) {
        stats[eventType]++;
      }
    });
    
    return stats;
  };
  
  const eventStats = getEventStats();
  
  // Calculate net population change
  const netPopulationChange = eventStats.birth + eventStats.migration_in - eventStats.death - eventStats.migration_out;

  return (
    <div className="census-reporting-container">
      <div className="census-reporting-header">
        <div className="title-section">
          <h1>Census Reporting</h1>
          <Link to="/monitor/dashboard" className="back-link">Back to Dashboard</Link>
        </div>
        
        <div className="filters-section">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search by citizen name, address, event type..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="event-type-filter">
            <select 
              value={filterEventType} 
              onChange={(e) => setFilterEventType(e.target.value)}
              className="event-type-select"
            >
              <option value="">All Event Types</option>
              {eventTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading census data...</p>
        </div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="census-content">
          <div className="census-stats">
            <div className="stat-card">
              <div className="stat-value">{censusData.length}</div>
              <div className="stat-label">Total Events</div>
            </div>
            <div className="stat-card event-birth">
              <div className="stat-value">{eventStats.birth}</div>
              <div className="stat-label">Births</div>
            </div>
            <div className="stat-card event-death">
              <div className="stat-value">{eventStats.death}</div>
              <div className="stat-label">Deaths</div>
            </div>
            <div className="stat-card event-marriage">
              <div className="stat-value">{eventStats.marriage}</div>
              <div className="stat-label">Marriages</div>
            </div>
            <div className="stat-card event-migration-in">
              <div className="stat-value">{eventStats.migration_in}</div>
              <div className="stat-label">Migration In</div>
            </div>
            <div className="stat-card event-migration-out">
              <div className="stat-value">{eventStats.migration_out}</div>
              <div className="stat-label">Migration Out</div>
            </div>
            <div className={`stat-card ${netPopulationChange >= 0 ? 'net-positive' : 'net-negative'}`}>
              <div className="stat-value">{netPopulationChange >= 0 ? '+' : ''}{netPopulationChange}</div>
              <div className="stat-label">Net Population Change</div>
            </div>
          </div>
        
          <div className="census-table-container">
            {filteredAndSortedCensusData.length === 0 ? (
              <div className="no-data">
                {searchTerm || filterEventType ? 'No matching census records found' : 'No census data available'}
              </div>
            ) : (
              <table className="census-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('event_date')}>
                      Event Date {getSortIcon('event_date')}
                    </th>
                    <th onClick={() => handleSort('event_type')}>
                      Event Type {getSortIcon('event_type')}
                    </th>
                    <th onClick={() => handleSort('household_id')}>
                      Household ID {getSortIcon('household_id')}
                    </th>
                    <th onClick={() => handleSort('household_address')}>
                      Address {getSortIcon('household_address')}
                    </th>
                    <th onClick={() => handleSort('citizen_id')}>
                      Citizen ID {getSortIcon('citizen_id')}
                    </th>
                    <th onClick={() => handleSort('citizen_name')}>
                      Name {getSortIcon('citizen_name')}
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedCensusData.map((record, index) => (
                    <tr key={index}>
                      <td>{formatDate(record.event_date)}</td>
                      <td className={getEventTypeClass(record.event_type)}>
                        {record.event_type}
                      </td>
                      <td>{record.household_id}</td>
                      <td>{record.household_address || "N/A"}</td>
                      <td>{record.citizen_id}</td>
                      <td>{record.citizen_name || "N/A"}</td>
                      <td>
                        {record.citizen_id && (
                          <button
                            className="view-profile-button"
                            onClick={() => navigate(`/monitor/citizen/${record.citizen_id}`)}
                          >
                            View Citizen
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          <div className="census-timeline">
            <h2>Census Events Timeline</h2>
            <div className="timeline-container">
              {filteredAndSortedCensusData.map((record, index) => (
                <div className={`timeline-item ${getEventTypeClass(record.event_type)}`} key={index}>
                  <div className="timeline-date">{formatDate(record.event_date)}</div>
                  <div className="timeline-content">
                    <div className="timeline-title">{record.event_type}</div>
                    <div className="timeline-details">
                      {record.citizen_name && (
                        <div className="timeline-person">
                          Citizen: {record.citizen_name} (ID: {record.citizen_id})
                        </div>
                      )}
                      {record.household_address && (
                        <div className="timeline-household">
                          Household: ID {record.household_id} - {record.household_address}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CensusReporting;