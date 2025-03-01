import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/monitors/VaccinationMonitor.css';

// filepath: /Users/aryansanghi/Desktop/CSE Dep/DBMS/LA4/Gram_Panchayat/client/src/pages/monitors/VaccinationMonitor.jsx

const VaccinationMonitor = () => {
    const [vaccinations, setVaccinations] = useState([]);
    const [loading, setLoading] = useState(true);

    
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState('vaccination_id');
    const [sortDirection, setSortDirection] = useState('asc');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchVaccinations = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                
                if (!token) {
                    navigate('/');
                    return;
                }
                
                const response = await axios.get('http://localhost:3535/monitor/vaccination-records', {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                
                setVaccinations(Array.isArray(response.data) ? response.data : []);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching vaccinations:', error);
                setError('Failed to load vaccination data. Please try again later.');
                setLoading(false);
                
                if (error.response && error.response.status === 401) {
                    navigate('/');
                }
            }
        };

        fetchVaccinations();
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

    const filteredAndSortedVaccinations = (Array.isArray(vaccinations) ? vaccinations : [])
        .filter(vaccination => 
            (vaccination.name && vaccination.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (vaccination.vaccine_type && vaccination.vaccine_type.toLowerCase().includes(searchTerm.toLowerCase())) ||
            String(vaccination.vaccination_id).includes(searchTerm)
        )
        .sort((a, b) => {
            let valA = a[sortField];
            let valB = b[sortField];
            
            // Handle numeric fields
            if (sortField === 'vaccination_id') {
                valA = Number(valA) || 0;
                valB = Number(valB) || 0;
            }
            
            // Handle date fields
            if (sortField === 'date_administered') {
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
        <div className="vaccinations-monitor-container">
            <div className="vaccinations-monitor-header">
                <div className="title-section">
                    <h1>Panchayat Vaccination Tracking</h1>
                    <Link to="/monitor/dashboard" className="back-link">Back to Dashboard</Link>
                </div>
                <div className="search-section">
                    <input
                        type="text"
                        placeholder="Search by name, vaccine type, or ID..."
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading vaccination information...</p>
                </div>
            ) : error ? (
                <div className="error-message">{error}</div>
            ) : (
                <div className="vaccinations-table-container">
                    {filteredAndSortedVaccinations.length === 0 ? (
                        <div className="no-vaccinations">
                            {searchTerm ? 'No matching vaccination records found' : 'No vaccination records available'}
                        </div>
                    ) : (
                        <>
                            <div className="vaccination-stats">
                                <div className="stat-card">
                                    <div className="stat-value">{vaccinations.length}</div>
                                    <div className="stat-label">Total Vaccinated</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-value">
                                        {Object.keys(vaccinations.reduce((acc, vaccination) => {
                                            if (vaccination.vaccine_type) acc[vaccination.vaccine_type] = true;
                                            return acc;
                                        }, {})).length}
                                    </div>
                                    <div className="stat-label">Vaccine Types</div>
                                </div>
                            </div>
                        
                            <table className="vaccinations-table">
                                <thead>
                                    <tr>
                                        <th onClick={() => handleSort('vaccination_id')}>
                                            ID {getSortIcon('vaccination_id')}
                                        </th>
                                        <th onClick={() => handleSort('name')}>
                                            Name {getSortIcon('name')}
                                        </th>
                                        <th onClick={() => handleSort('vaccine_type')}>
                                            Vaccine Type {getSortIcon('vaccine_type')}
                                        </th>
                                        <th onClick={() => handleSort('date_administered')}>
                                            Date {getSortIcon('date_administered')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAndSortedVaccinations.map((vaccination) => (
                                        <tr key={vaccination.vaccination_id}>
                                            <td>{vaccination.vaccination_id}</td>
                                            <td>{vaccination.name || "Not specified"}</td>
                                            <td>{vaccination.vaccine_type || "Not specified"}</td>
                                            <td>{formatDate(vaccination.date_administered)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            
                            <div className="vaccine-type-distribution">
                                <h2>Vaccinations by Vaccine Type</h2>
                                <div className="vaccine-type-cards">
                                    {Object.entries(vaccinations.reduce((acc, vaccination) => {
                                        const vaccineType = vaccination.vaccine_type || "Unknown";
                                        acc[vaccineType] = (acc[vaccineType] || 0) + 1;
                                        return acc;
                                    }, {})).map(([type, count]) => (
                                        <div className="vaccine-type-card" key={type}>
                                            <div className="vaccine-type-name">{type}</div>
                                            <div className="vaccine-type-count">{count} vaccinations</div>
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

export default VaccinationMonitor;
