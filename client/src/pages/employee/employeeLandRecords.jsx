import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/employee/EmployeeLandRecords.css';

const EmployeeLandRecords = () => {
    const [landRecords, setLandRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState('land_id');
    const [sortDirection, setSortDirection] = useState('asc');
    const navigate = useNavigate();
    
    // State for modal and form
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', or 'delete'
    const [formData, setFormData] = useState({
        land_id: '',
        citizen_id: '',
        area_acres: '',
        crop_type: ''
    });
    const [citizens, setCitizens] = useState([]);
    const [cropTypes] = useState(['Rice', 'Wheat', 'Vegetables', 'Cotton', 'Sugarcane', 'Pulses', 'Fruits', 'Other']);
    const [selectedLandRecord, setSelectedLandRecord] = useState(null);

    // Fetch land records data
    useEffect(() => {
        const fetchLandRecords = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                
                if (!token) {
                    navigate('/login');
                    return;
                }
                
                const response = await axios.get('http://localhost:3535/employee/land-records', {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                
                setLandRecords(Array.isArray(response.data) ? response.data : []);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching land records:', error);
                setError('Failed to load land records data. Please try again later.');
                setLoading(false);
                
                if (error.response && error.response.status === 401) {
                    navigate('/login');
                }
            }
        };

        fetchLandRecords();
    }, [navigate]);
    
    // Fetch citizens list for dropdown
    useEffect(() => {
        const fetchCitizens = async () => {
            try {
                const token = localStorage.getItem('token');
                
                if (!token) {
                    navigate('/login');
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
                    navigate('/login');
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

    const openAddModal = () => {
        setModalMode('add');
        setFormData({
            land_id: '',
            citizen_id: '',
            area_acres: '',
            crop_type: ''
        });
        setIsModalOpen(true);
    };

    const openEditModal = (landRecord) => {
        setModalMode('edit');
        setSelectedLandRecord(landRecord);
        setFormData({
            land_id: landRecord.land_id,
            citizen_id: landRecord.citizen_id,
            area_acres: landRecord.area_acres,
            crop_type: landRecord.crop_type
        });
        setIsModalOpen(true);
    };

    const openDeleteModal = (landRecord) => {
        setModalMode('delete');
        setSelectedLandRecord(landRecord);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedLandRecord(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            let response;
            
            if (modalMode === 'add') {
                response = await axios.post(
                    'http://localhost:3535/employee/land-records',
                    formData,
                    {
                        withCredentials: true,
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                setLandRecords([...landRecords, response.data]);
            } else if (modalMode === 'edit') {
                response = await axios.put(
                    `http://localhost:3535/employee/land-records/${formData.land_id}`,
                    formData,
                    {
                        withCredentials: true,
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                setLandRecords(
                    landRecords.map(record => 
                        record.land_id === formData.land_id ? response.data : record
                    )
                );
            } else if (modalMode === 'delete') {
                await axios.delete(
                    `http://localhost:3535/employee/land-records/${selectedLandRecord.land_id}`,
                    {
                        withCredentials: true,
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                setLandRecords(
                    landRecords.filter(record => record.land_id !== selectedLandRecord.land_id)
                );
            }
            
            closeModal();
        } catch (error) {
            console.error('Error submitting form:', error);
            setError(error.response?.data?.error || 'An error occurred while processing your request');
        }
    };

    const filteredAndSortedLandRecords = (Array.isArray(landRecords) ? landRecords : [])
        .filter(record => 
            (record.name && record.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (record.crop_type && record.crop_type.toLowerCase().includes(searchTerm.toLowerCase())) ||
            String(record.land_id).includes(searchTerm) ||
            String(record.citizen_id).includes(searchTerm) ||
            String(record.area_acres).includes(searchTerm)
        )
        .sort((a, b) => {
            let valA = a[sortField];
            let valB = b[sortField];
            
            // Handle numeric fields
            if (sortField === 'land_id' || sortField === 'citizen_id') {
                valA = Number(valA) || 0;
                valB = Number(valB) || 0;
            }
            
            // Handle floating point fields
            if (sortField === 'area_acres') {
                valA = parseFloat(valA) || 0;
                valB = parseFloat(valB) || 0;
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
    const totalLandArea = filteredAndSortedLandRecords.reduce(
        (total, record) => total + parseFloat(record.area_acres || 0), 0
    ).toFixed(2);

    const cropDistribution = filteredAndSortedLandRecords.reduce((acc, record) => {
        const cropType = record.crop_type || "Unknown";
        acc[cropType] = (acc[cropType] || 0) + parseFloat(record.area_acres || 0);
        return acc;
    }, {});

    return (
        <div className="land-records-employee-container">
            <div className="land-records-employee-header">
                <div className="title-section">
                    <h1>Panchayat Land Records Management</h1>
                    <Link to="/employee/dashboard" className="back-link">Back to Dashboard</Link>
                </div>
                <div className="actions-section">
                    <div className="search-section">
                        <input
                            type="text"
                            placeholder="Search by owner name, crop type, or ID..."
                            className="search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className='add-button-section'>
                    <button className="add-button" onClick={openAddModal}>
                        Add New Land Record
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading land records information...</p>
                </div>
            ) : error ? (
                <div className="error-message">{error}</div>
            ) : (
                <div className="land-records-table-container">
                    {filteredAndSortedLandRecords.length === 0 ? (
                        <div className="no-land-records">
                            {searchTerm ? 'No matching land records found' : 'No land records available'}
                        </div>
                    ) : (
                        <>
                            <div className="land-record-stats">
                                <div className="stat-card">
                                    <div className="stat-value">{landRecords.length}</div>
                                    <div className="stat-label">Total Land Records</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-value">{totalLandArea}</div>
                                    <div className="stat-label">Total Area (acres)</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-value">
                                        {Object.keys(cropDistribution).length}
                                    </div>
                                    <div className="stat-label">Different Crop Types</div>
                                </div>
                            </div>
                        
                            <table className="land-records-table">
                                <thead>
                                    <tr>
                                        <th onClick={() => handleSort('land_id')}>
                                            Record ID {getSortIcon('land_id')}
                                        </th>
                                        <th onClick={() => handleSort('citizen_id')}>
                                            Owner ID {getSortIcon('citizen_id')}
                                        </th>
                                        <th onClick={() => handleSort('name')}>
                                            Owner Name {getSortIcon('name')}
                                        </th>
                                        <th onClick={() => handleSort('area_acres')}>
                                            Area (acres) {getSortIcon('area_acres')}
                                        </th>
                                        <th onClick={() => handleSort('crop_type')}>
                                            Crop Type {getSortIcon('crop_type')}
                                        </th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAndSortedLandRecords.map((record) => (
                                        <tr key={record.land_id}>
                                            <td>{record.land_id}</td>
                                            <td>{record.citizen_id}</td>
                                            <td>{record.name || "Not specified"}</td>
                                            <td>{record.area_acres} acres</td>
                                            <td>{record.crop_type || "Not specified"}</td>
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
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            
                            <div className="crop-type-distribution">
                                <h2>Land Distribution by Crop Type</h2>
                                <div className="crop-type-cards">
                                    {Object.entries(cropDistribution).map(([type, area]) => (
                                        <div className="crop-type-card" key={type}>
                                            <div className="crop-type-name">{type}</div>
                                            <div className="crop-type-area">{area.toFixed(2)} acres</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
            
            {/* Modal for Add/Edit/Delete */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h2>
                                {modalMode === 'add' ? 'Add New Land Record' : 
                                 modalMode === 'edit' ? 'Edit Land Record' : 
                                 'Delete Land Record'}
                            </h2>
                            <button className="close-button" onClick={closeModal}>×</button>
                        </div>
                        
                        <div className="modal-content">
                            {modalMode === 'delete' ? (
                                <div className="delete-confirmation">
                                    <p>Are you sure you want to delete this land record?</p>
                                    <p><strong>Record ID:</strong> {selectedLandRecord?.land_id}</p>
                                    <p><strong>Owner:</strong> {selectedLandRecord?.name}</p>
                                    <p><strong>Area:</strong> {selectedLandRecord?.area_acres} acres</p>
                                    <p><strong>Crop Type:</strong> {selectedLandRecord?.crop_type}</p>
                                    
                                    <div className="modal-actions">
                                        <button className="cancel-button" onClick={closeModal}>Cancel</button>
                                        <button className="confirm-delete-button" onClick={handleSubmit}>Delete</button>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit}>
                                    {modalMode === 'edit' && (
                                        <div className="form-group">
                                            <label>Land Record ID:</label>
                                            <input 
                                                type="text" 
                                                name="land_id" 
                                                value={formData.land_id} 
                                                disabled 
                                            />
                                        </div>
                                    )}
                                    
                                    <div className="form-group">
                                        <label>Owner:</label>
                                        <select 
                                            name="citizen_id" 
                                            value={formData.citizen_id} 
                                            onChange={handleInputChange}
                                            required
                                        >
                                            <option value="">Select Owner</option>
                                            {citizens.map(citizen => (
                                                <option key={citizen.citizen_id} value={citizen.citizen_id}>
                                                    {citizen.name} (ID: {citizen.citizen_id})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>Area (acres):</label>
                                        <input 
                                            type="number" 
                                            step="0.01" 
                                            min="0.01" 
                                            name="area_acres" 
                                            value={formData.area_acres} 
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>Crop Type:</label>
                                        <select 
                                            name="crop_type" 
                                            value={formData.crop_type} 
                                            onChange={handleInputChange}
                                            required
                                        >
                                            <option value="">Select Crop Type</option>
                                            {cropTypes.map(type => (
                                                <option key={type} value={type}>{type}</option>
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

export default EmployeeLandRecords;