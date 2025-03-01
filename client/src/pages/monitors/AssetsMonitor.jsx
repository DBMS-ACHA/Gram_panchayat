import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/monitors/AssetMonitor.css';

const AssetsMonitor = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('asset_id');
  const [sortDirection, setSortDirection] = useState('asc');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          navigate('/');
          return;
        }
        
        const response = await axios.get('http://localhost:3535/monitor/asset-tracking', {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        setAssets(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching assets:', error);
        setError('Failed to load assets. Please try again later.');
        setLoading(false);
        
        if (error.response && error.response.status === 401) {
          navigate('/');
        }
      }
    };

    fetchAssets();
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

  const getAssetAge = (installationDate) => {
    if (!installationDate) return "Unknown";
    
    const installed = new Date(installationDate);
    const today = new Date();
    
    const yearDiff = today.getFullYear() - installed.getFullYear();
    const monthDiff = today.getMonth() - installed.getMonth();
    
    if (monthDiff < 0) {
      return `${yearDiff - 1} years, ${12 + monthDiff} months`;
    }
    
    return `${yearDiff} years, ${monthDiff} months`;
  };

  const filteredAndSortedAssets = assets
    .filter(asset => 
      (asset.type && asset.type.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (asset.location && asset.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      String(asset.asset_id).includes(searchTerm)
    )
    .sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      
      // Handle numeric fields
      if (sortField === 'asset_id') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      }
      
      // Handle date fields
      if (sortField === 'installation_date') {
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

  return (
    <div className="assets-monitor-container">
      <div className="assets-monitor-header">
        <div className="title-section">
          <h1>Panchayat Asset Tracking</h1>
          <Link to="/monitor/dashboard" className="back-link">Back to Dashboard</Link>
        </div>
        <div className="search-section">
          <input
            type="text"
            placeholder="Search assets by type, location, or ID..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading assets information...</p>
        </div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="assets-table-container">
          {filteredAndSortedAssets.length === 0 ? (
            <div className="no-assets">
              {searchTerm ? 'No matching assets found' : 'No assets available'}
            </div>
          ) : (
            <>
              <div className="asset-stats">
                <div className="stat-card">
                  <div className="stat-value">{assets.length}</div>
                  <div className="stat-label">Total Assets</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">
                    {Object.keys(assets.reduce((acc, asset) => {
                      if (asset.location) acc[asset.location] = true;
                      return acc;
                    }, {})).length}
                  </div>
                  <div className="stat-label">Locations</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">
                    {Object.keys(assets.reduce((acc, asset) => {
                      if (asset.type) acc[asset.type] = true;
                      return acc;
                    }, {})).length}
                  </div>
                  <div className="stat-label">Asset Types</div>
                </div>
              </div>
            
              <table className="assets-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('asset_id')}>
                      Asset ID {getSortIcon('asset_id')}
                    </th>
                    <th onClick={() => handleSort('type')}>
                      Type {getSortIcon('type')}
                    </th>
                    <th onClick={() => handleSort('location')}>
                      Location {getSortIcon('location')}
                    </th>
                    <th onClick={() => handleSort('installation_date')}>
                      Installation Date {getSortIcon('installation_date')}
                    </th>
                    <th>
                      Age
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedAssets.map((asset) => (
                    <tr key={asset.asset_id}>
                      <td>{asset.asset_id}</td>
                      <td>{asset.type || "Not specified"}</td>
                      <td>{asset.location || "Not specified"}</td>
                      <td>{formatDate(asset.installation_date)}</td>
                      <td>{getAssetAge(asset.installation_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div className="location-distribution">
                <h2>Asset Distribution by Location</h2>
                <div className="location-cards">
                  {Object.entries(assets.reduce((acc, asset) => {
                    const location = asset.location || "Unknown";
                    acc[location] = (acc[location] || 0) + 1;
                    return acc;
                  }, {})).map(([location, count]) => (
                    <div className="location-card" key={location}>
                      <div className="location-name">{location}</div>
                      <div className="location-count">{count} assets</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AssetsMonitor;