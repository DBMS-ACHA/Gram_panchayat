import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/employee/EmployeeVaccinations.css';

const EmployeeVaccinations = () => {
    const [vaccinations, setVaccinations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState('vaccination_id');
    const [sortDirection, setSortDirection] = useState('asc');
    const navigate = useNavigate();
    
    // State for modal and form
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', or 'delete'
    const [formData, setFormData] = useState({
        vaccination_id: '',
        citizen_id: '',
        vaccine_type: '',
        date_administered: ''
    });
    const [citizens, setCitizens] = useState([]);
    const [vaccineTypes] = useState(['COVID-19', 'Polio', 'Measles', 'Hepatitis B', 'Tetanus', 'Influenza']);
    const [selectedVaccination, setSelectedVaccination] = useState(null);

    // Fetch vaccinations data
    useEffect(() => {
        const fetchVaccinations = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                
                if (!token) {
                    navigate('/');
                    return;
                }
                
                const response = await axios.get('http://localhost:3535/employee/vaccinations', {
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

    const openAddModal = () => {
        setModalMode('add');
        setFormData({
            vaccination_id: '',
            citizen_id: '',
            vaccine_type: '',
            date_administered: formatDateForInput(new Date())
        });
        setIsModalOpen(true);
    };

    const openEditModal = (vaccination) => {
        setModalMode('edit');
        setSelectedVaccination(vaccination);
        setFormData({
            vaccination_id: vaccination.vaccination_id,
            citizen_id: vaccination.citizen_id,
            vaccine_type: vaccination.vaccine_type,
            date_administered: formatDateForInput(vaccination.date_administered)
        });
        setIsModalOpen(true);
    };

    const openDeleteModal = (vaccination) => {
        setModalMode('delete');
        setSelectedVaccination(vaccination);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedVaccination(null);
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
                navigate('/');
                return;
            }

            let response;
            
            if (modalMode === 'add') {
                response = await axios.post('http://localhost:3535/employee/vaccinations', formData, {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                
                // Add new vaccination to state
                setVaccinations([...vaccinations, response.data]);
            } 
            else if (modalMode === 'edit') {
                response = await axios.put(`http://localhost:3535/employee/vaccinations/${formData.vaccination_id}`, formData, {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                
                // Update vaccination in state
                setVaccinations(vaccinations.map(v => 
                    v.vaccination_id === formData.vaccination_id ? response.data : v
                ));
            } 
            else if (modalMode === 'delete') {
                await axios.delete(`http://localhost:3535/employee/vaccinations/${selectedVaccination.vaccination_id}`, {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                
                // Remove vaccination from state
                setVaccinations(vaccinations.filter(v => 
                    v.vaccination_id !== selectedVaccination.vaccination_id
                ));
            }
            
            closeModal();
        } catch (error) {
            console.error('Error submitting form:', error);
            setError(error.response?.data?.error || 'An error occurred while processing your request');
        }
    };

    const filteredAndSortedVaccinations = (Array.isArray(vaccinations) ? vaccinations : [])
        .filter(vaccination => 
            (vaccination.name && vaccination.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (vaccination.vaccine_type && vaccination.vaccine_type.toLowerCase().includes(searchTerm.toLowerCase())) ||
            String(vaccination.vaccination_id).includes(searchTerm) ||
            String(vaccination.citizen_id).includes(searchTerm)
        )
        .sort((a, b) => {
            let valA = a[sortField];
            let valB = b[sortField];
            
            // Handle numeric fields
            if (sortField === 'vaccination_id' || sortField === 'citizen_id') {
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
        <div className="vaccinations-employee-container">
            <div className="vaccinations-employee-header">
                <div className="title-section">
                    <h1>Panchayat Vaccination Management</h1>
                    <Link to="/employee/dashboard" className="back-link">Back to Dashboard</Link>
                </div>
                <div className="actions-section">
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
                <div className='add-button-section'>
                    <button className="add-button" onClick={openAddModal}>
                        Add New Vaccination Record
                    </button>
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
                                        <th onClick={() => handleSort('citizen_id')}>
                                            Citizen ID {getSortIcon('citizen_id')}
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
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAndSortedVaccinations.map((vaccination) => (
                                        <tr key={vaccination.vaccination_id}>
                                            <td>{vaccination.vaccination_id}</td>
                                            <td>{vaccination.citizen_id}</td>
                                            <td>{vaccination.name || "Not specified"}</td>
                                            <td>{vaccination.vaccine_type || "Not specified"}</td>
                                            <td>{formatDate(vaccination.date_administered)}</td>
                                            <td className="action-buttons">
                                                <button 
                                                    className="edit-button" 
                                                    onClick={() => openEditModal(vaccination)}
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    className="delete-button" 
                                                    onClick={() => openDeleteModal(vaccination)}
                                                >
                                                    Delete
                                                </button>
                                            </td>
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
            
            {/* Modal for Add/Edit/Delete */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h2>
                                {modalMode === 'add' ? 'Add New Vaccination Record' : 
                                 modalMode === 'edit' ? 'Edit Vaccination Record' : 
                                 'Delete Vaccination Record'}
                            </h2>
                            <button className="close-button" onClick={closeModal}>×</button>
                        </div>
                        
                        <div className="modal-content">
                            {modalMode === 'delete' ? (
                                <div className="delete-confirmation">
                                    <p>Are you sure you want to delete this vaccination record?</p>
                                    <p><strong>ID:</strong> {selectedVaccination?.vaccination_id}</p>
                                    <p><strong>Name:</strong> {selectedVaccination?.name}</p>
                                    <p><strong>Vaccine Type:</strong> {selectedVaccination?.vaccine_type}</p>
                                    <p><strong>Date:</strong> {formatDate(selectedVaccination?.date_administered)}</p>
                                    
                                    <div className="modal-actions">
                                        <button className="cancel-button" onClick={closeModal}>Cancel</button>
                                        <button className="confirm-delete-button" onClick={handleSubmit}>Delete</button>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit}>
                                    {modalMode === 'edit' && (
                                        <div className="form-group">
                                            <label>Vaccination ID:</label>
                                            <input 
                                                type="text" 
                                                name="vaccination_id" 
                                                value={formData.vaccination_id} 
                                                disabled 
                                            />
                                        </div>
                                    )}
                                    
                                    <div className="form-group">
                                        <label>Citizen:</label>
                                        <select 
                                            name="citizen_id" 
                                            value={formData.citizen_id} 
                                            onChange={handleInputChange}
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
                                        <label>Vaccine Type:</label>
                                        <select 
                                            name="vaccine_type" 
                                            value={formData.vaccine_type} 
                                            onChange={handleInputChange}
                                            required
                                        >
                                            <option value="">Select Vaccine Type</option>
                                            {vaccineTypes.map(type => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>Date Administered:</label>
                                        <input 
                                            type="date" 
                                            name="date_administered" 
                                            value={formData.date_administered} 
                                            onChange={handleInputChange}
                                            required
                                            max={new Date().toISOString().split('T')[0]}
                                        />
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

export default EmployeeVaccinations;