import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/monitors/VillageStatisticsMonitor.css';
import { FaSearch, FaFilter, FaSort } from 'react-icons/fa';

// filepath: /Users/aryansanghi/Desktop/CSE Dep/DBMS/LA4/Gram_Panchayat/client/src/pages/VillageStatisticsMonitor.jsx

const VillageStatisticsMonitor = () => {
    const [citizens, setCitizens] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState('citizen_id');
    const [sortDirection, setSortDirection] = useState('asc');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCitizens = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                
                if (!token) {
                    navigate('/');
                    return;
                }
                
                const response = await axios.get('http://localhost:3535/monitor/village', {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                
                setCitizens(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching citizens data:', error);
                setError('Failed to load citizens data. Please try again later.');
                setLoading(false);
                
                if (error.response && error.response.status === 401) {
                    navigate('/');
                }
            }
        };

        fetchCitizens();
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

    const viewCitizenProfile = (citizenId) => {
        navigate(`/monitor/citizen/${citizenId}`);
    };

    const filteredAndSortedCitizens = citizens
        .filter(citizen => 
            citizen.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
            citizen.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(citizen.citizen_id).includes(searchTerm) ||
            String(citizen.household_id).includes(searchTerm)
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
        <div className="village-statistics-container">
            <div className="village-statistics-header">
                <div className="title-section">
                    <h1>Village Citizens Registry</h1>
                    <Link to="/monitor/dashboard" className="back-link">Back to Dashboard</Link>
                </div>
                <div className="search-section">
                    <div className="search-input-container">
                        <FaSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search by name, address, citizen ID, or household ID..."
                            className="search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading citizens data...</p>
                </div>
            ) : error ? (
                <div className="error-message">{error}</div>
            ) : (
                <div className="citizens-table-container">
                    {filteredAndSortedCitizens.length === 0 ? (
                        <div className="no-records">
                            {searchTerm ? 'No matching citizens found' : 'No citizens data available'}
                        </div>
                    ) : (
                        <table className="citizens-table">
                            <thead>
                                <tr>
                                    <th onClick={() => handleSort('citizen_id')}>
                                        Citizen ID {getSortIcon('citizen_id')}
                                    </th>
                                    <th onClick={() => handleSort('name')}>
                                        Name {getSortIcon('name')}
                                    </th>
                                    <th onClick={() => handleSort('household_id')}>
                                        Household ID {getSortIcon('household_id')}
                                    </th>
                                    <th onClick={() => handleSort('gender')}>
                                        Gender {getSortIcon('gender')}
                                    </th>
                                    <th onClick={() => handleSort('dob')}>
                                        Date of Birth {getSortIcon('dob')}
                                    </th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAndSortedCitizens.map((citizen) => (
                                    <tr key={citizen.citizen_id}>
                                        <td>{citizen.citizen_id}</td>
                                        <td>{citizen.name}</td>
                                        <td>{citizen.household_id}</td>
                                        <td>{citizen.gender}</td>
                                        <td>
                                            {citizen.dob ? new Date(citizen.dob).toLocaleDateString('en-IN') : 'N/A'}
                                        </td>
                                        <td>
                                            <button 
                                                className="view-profile-button"
                                                onClick={() => viewCitizenProfile(citizen.citizen_id)}
                                            >
                                                View Profile
                                            </button>
                                        </td>
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

export default VillageStatisticsMonitor;