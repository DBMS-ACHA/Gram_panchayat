import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/employee/EmployeeCensus.css';

const EmployeeCensus = () => {
    const [censusData, setCensusData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState('event_date');
    const [sortDirection, setSortDirection] = useState('desc');
    const [filterEventType, setFilterEventType] = useState('');
    const navigate = useNavigate();
    
    // State for modal and form
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', or 'delete'
    const [formData, setFormData] = useState({
        household_id: '',
        citizen_id: '',
        event_type: '',
        event_date: ''
    });
    
    const [citizens, setCitizens] = useState([]);
    const [households, setHouseholds] = useState([]);
    const [eventTypes] = useState(['birth', 'death', 'marriage', 'migration_in', 'migration_out']);
    const [selectedCensusEvent, setSelectedCensusEvent] = useState(null);
    
    // Success message
    const [successMessage, setSuccessMessage] = useState('');

    // Fetch census data
    useEffect(() => {
        const fetchCensusData = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                
                if (!token) {
                    navigate('/');
                    return;
                }
                
                const response = await axios.get('http://localhost:3535/employee/census', {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                
                setCensusData(Array.isArray(response.data) ? response.data : []);
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
    
    // Fetch citizens list for dropdown
    useEffect(() => {
        const fetchCitizens = async () => {
            try {
                const token = localStorage.getItem('token');
                
                if (!token) {
                    navigate('/');
                    return;
                }
                
                const response = await axios.get('http://localhost:3535/employee/citizens', {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                
                setCitizens(Array.isArray(response.data) ? response.data : []);
            } catch (error) {
                console.error('Error fetching citizens:', error);
                if (error.response && error.response.status === 401) {
                    navigate('/');
                }
            }
        };

        fetchCitizens();
    }, [navigate]);
    
    // Fetch households list for dropdown
    useEffect(() => {
        const fetchHouseholds = async () => {
            try {
                const token = localStorage.getItem('token');
                
                if (!token) {
                    navigate('/');
                    return;
                }
                
                const response = await axios.get('http://localhost:3535/employee/households', {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                
                setHouseholds(Array.isArray(response.data) ? response.data : []);
            } catch (error) {
                console.error('Error fetching households:', error);
                if (error.response && error.response.status === 401) {
                    navigate('/');
                }
            }
        };

        fetchHouseholds();
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
    
    // Format date for input field (YYYY-MM-DD)
    const formatDateForInput = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };
    
    const getEventTypeClass = (eventType) => {
        switch(eventType?.toLowerCase()) {
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

    // Extract unique event types for filter dropdown from actual data
    const availableEventTypes = [...new Set(censusData.map(item => item.event_type))];

    const openAddModal = () => {
        setModalMode('add');
        setFormData({
            household_id: '',
            citizen_id: '',
            event_type: '',
            event_date: formatDateForInput(new Date())
        });
        setIsModalOpen(true);
    };

    const openEditModal = (event) => {
        setModalMode('edit');
        setSelectedCensusEvent(event);
        setFormData({
            household_id: event.household_id,
            citizen_id: event.citizen_id,
            event_type: event.event_type,
            event_date: formatDateForInput(event.event_date)
        });
        setIsModalOpen(true);
    };

    const openDeleteModal = (event) => {
        setModalMode('delete');
        setSelectedCensusEvent(event);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedCensusEvent(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };
    
    // When citizen is selected, auto-fill household if possible
    const handleCitizenChange = (e) => {
        const citizenId = e.target.value;
        setFormData({
            ...formData,
            citizen_id: citizenId
        });
        
        // Find citizen's household_id
        const citizen = citizens.find(c => c.citizen_id === Number(citizenId));
        if (citizen && citizen.household_id) {
            setFormData(prev => ({
                ...prev,
                citizen_id: citizenId,
                household_id: citizen.household_id
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/');
                return;
            }

            let response;
            
            if (modalMode === 'add') {
                response = await axios.post('http://localhost:3535/employee/census', formData, {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                
                // Fetch updated data
                const updatedResponse = await axios.get('http://localhost:3535/employee/census', {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                
                setCensusData(updatedResponse.data);
                setSuccessMessage('Census event added successfully!');
            } 
            else if (modalMode === 'edit') {
                const eventKey = {
                    household_id: selectedCensusEvent.household_id,
                    citizen_id: selectedCensusEvent.citizen_id,
                    event_type: selectedCensusEvent.event_type,
                    event_date: selectedCensusEvent.event_date
                };
                
                response = await axios.put(`http://localhost:3535/employee/census`, {
                    oldEvent: eventKey,
                    newEvent: formData
                }, {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                
                // Fetch updated data
                const updatedResponse = await axios.get('http://localhost:3535/employee/census', {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                
                setCensusData(updatedResponse.data);
                setSuccessMessage('Census event updated successfully!');
            } 
            else if (modalMode === 'delete') {
                await axios.delete(`http://localhost:3535/employee/census`, {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    data: {
                        household_id: selectedCensusEvent.household_id,
                        citizen_id: selectedCensusEvent.citizen_id,
                        event_type: selectedCensusEvent.event_type,
                        event_date: selectedCensusEvent.event_date
                    }
                });
                
                // Remove event from state
                setCensusData(censusData.filter(event => 
                    !(event.household_id === selectedCensusEvent.household_id && 
                      event.citizen_id === selectedCensusEvent.citizen_id &&
                      event.event_type === selectedCensusEvent.event_type &&
                      new Date(event.event_date).getTime() === new Date(selectedCensusEvent.event_date).getTime())
                ));
                setSuccessMessage('Census event deleted successfully!');
            }
            
            closeModal();
            
            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccessMessage('');
            }, 3000);
        } catch (error) {
            console.error('Error submitting form:', error);
            setError(error.response?.data?.error || 'An error occurred while processing your request');
        }
    };

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

    const filteredAndSortedCensusData = (Array.isArray(censusData) ? censusData : [])
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

    return (
        <div className="census-employee-container">
            <div className="census-employee-header">
                <div className="title-section">
                    <h1>Census Management</h1>
                    <Link to="/employee/dashboard" className="back-link">Back to Dashboard</Link>
                </div>
                
                {successMessage && (
                    <div className="success-message">
                        {successMessage}
                    </div>
                )}
                
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
                            {availableEventTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                </div>
                
                <div className="add-button-section">
                    <button className="add-button" onClick={openAddModal}>
                        Add New Census Event
                    </button>
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
                                            <td className="action-buttons">
                                                <button 
                                                    className="edit-button" 
                                                    onClick={() => openEditModal(record)}
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    className="delete-button" 
                                                    onClick={() => openDeleteModal(record)}
                                                >
                                                    Delete
                                                </button>
                                                {record.citizen_id && (
                                                    <button
                                                        className="view-profile-button"
                                                        onClick={() => navigate(`/employee/citizens/${record.citizen_id}`)}
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
                                            <div className="timeline-actions">
                                                <button
                                                    className="small-edit-button"
                                                    onClick={() => openEditModal(record)}
                                                >
                                                    Edit
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            
            {/* Modal for Add/Edit/Delete */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h2>
                                {modalMode === 'add' ? 'Add New Census Event' : 
                                 modalMode === 'edit' ? 'Edit Census Event' : 
                                 'Delete Census Event'}
                            </h2>
                            <button className="close-button" onClick={closeModal}>×</button>
                        </div>
                        
                        <div className="modal-content">
                            {modalMode === 'delete' ? (
                                <div className="delete-confirmation">
                                    <p>Are you sure you want to delete this census event?</p>
                                    <p><strong>Event Type:</strong> {selectedCensusEvent?.event_type}</p>
                                    <p><strong>Date:</strong> {formatDate(selectedCensusEvent?.event_date)}</p>
                                    <p><strong>Citizen:</strong> {selectedCensusEvent?.citizen_name} (ID: {selectedCensusEvent?.citizen_id})</p>
                                    <p><strong>Household:</strong> {selectedCensusEvent?.household_address} (ID: {selectedCensusEvent?.household_id})</p>
                                    
                                    <div className="modal-actions">
                                        <button className="cancel-button" onClick={closeModal}>Cancel</button>
                                        <button className="confirm-delete-button" onClick={handleSubmit}>Delete</button>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit}>
                                    <div className="form-group">
                                        <label>Event Type:</label>
                                        <select 
                                            name="event_type" 
                                            value={formData.event_type} 
                                            onChange={handleInputChange}
                                            required
                                        >
                                            <option value="">Select Event Type</option>
                                            {eventTypes.map(type => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>Event Date:</label>
                                        <input 
                                            type="date" 
                                            name="event_date" 
                                            value={formData.event_date} 
                                            onChange={handleInputChange}
                                            required
                                            max={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>Citizen:</label>
                                        <select 
                                            name="citizen_id" 
                                            value={formData.citizen_id} 
                                            onChange={handleCitizenChange}
                                            required
                                        >
                                            <option value="">Select Citizen</option>
                                            {citizens.map(citizen => (
                                                <option key={citizen.citizen_id} value={citizen.citizen_id}>
                                                    {citizen.name} (ID: {citizen.citizen_id})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>Household:</label>
                                        <select 
                                            name="household_id" 
                                            value={formData.household_id} 
                                            onChange={handleInputChange}
                                            required
                                        >
                                            <option value="">Select Household</option>
                                            {households.map(household => (
                                                <option key={household.household_id} value={household.household_id}>
                                                    {household.address} (ID: {household.household_id})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div className="modal-actions">
                                        <button className="cancel-button" onClick={closeModal} type="button">Cancel</button>
                                        <button className="submit-button" type="submit">
                                            {modalMode === 'add' ? 'Add' : 'Update'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeCensus;