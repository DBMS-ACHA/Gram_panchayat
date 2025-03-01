import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/monitors/LandRecordsMonitor.css';

const LandRecordsMonitor = () => {
  const [landRecords, setLandRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('land_id');
  const [sortDirection, setSortDirection] = useState('asc');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLandRecords = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          navigate('/');
          return;
        }
        
        const response = await axios.get('http://localhost:3535/monitor/land-records', {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        setLandRecords(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching land records:', error);
        setError('Failed to load land records. Please try again later.');
        setLoading(false);
        
        if (error.response && error.response.status === 401) {
          navigate('/');
        }
      }
    };

    fetchLandRecords();
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

  const filteredAndSortedRecords = landRecords
    .filter(record => 
      record.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      record.crop_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(record.land_id).includes(searchTerm) ||
      String(record.household_id).includes(searchTerm)
    )
    .sort((a, b) => {
      if (a[sortField] < b[sortField]) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (a[sortField] > b[sortField]) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });

  return (
    <div className="land-records-monitor-container">
      <div className="land-records-monitor-header">
        <div className="title-section">
          <h1>Land Records Verification</h1>
          <Link to="/monitor/dashboard" className="back-link">Back to Dashboard</Link>
        </div>
        <div className="search-section">
          <input
            type="text"
            placeholder="Search by owner name, crop type, land ID, or household ID..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading land records...</p>
        </div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="land-records-table-container">
          {filteredAndSortedRecords.length === 0 ? (
            <div className="no-records">
              {searchTerm ? 'No matching records found' : 'No land records available'}
            </div>
          ) : (
            <table className="land-records-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('land_id')}>
                    Land ID {getSortIcon('land_id')}
                  </th>
                  <th onClick={() => handleSort('owner_name')}>
                    Owner Name {getSortIcon('owner_name')}
                  </th>
                  <th onClick={() => handleSort('household_id')}>
                    Household ID {getSortIcon('household_id')}
                  </th>
                  <th onClick={() => handleSort('area_acres')}>
                    Area (acres) {getSortIcon('area_acres')}
                  </th>
                  <th onClick={() => handleSort('crop_type')}>
                    Crop Type {getSortIcon('crop_type')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedRecords.map((record) => (
                  <tr key={record.land_id}>
                    <td>{record.land_id}</td>
                    <td>{record.owner_name}</td>
                    <td>{record.household_id}</td>
                    <td>{record.area_acres}</td>
                    <td>{record.crop_type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default LandRecordsMonitor;