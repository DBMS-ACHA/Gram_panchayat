import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/employee/EmployeeSchemes.css';

const EmployeeSchemes = () => {
    const [schemes, setSchemes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState('expiry_date');
    const [sortDirection, setSortDirection] = useState('asc');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'expired'
    const navigate = useNavigate();
    
    // State for modal and form
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', or 'delete'
    const [formData, setFormData] = useState({
        scheme_id: '',
        name: '',
        description: '',
        status: true,
        expiry_date: ''
    });
    
    const [selectedScheme, setSelectedScheme] = useState(null);
    
    // Success message
    const [successMessage, setSuccessMessage] = useState('');

    // Fetch schemes data
    useEffect(() => {
        const fetchSchemes = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                
                if (!token) {
                    navigate('/');
                    return;
                }
                
                const response = await axios.get('http://localhost:3535/employee/schemes', {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                
                setSchemes(Array.isArray(response.data) ? response.data : []);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching schemes:', error);
                setError('Failed to load schemes. Please try again later.');
                setLoading(false);
                
                if (error.response && error.response.status === 401) {
                    navigate('/');
                }
            }
        };

        fetchSchemes();
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

        try {
            // Parse the date string
            const date = new Date(dateString);

            // Check if date is valid
            if (isNaN(date.getTime())) return "";

            // Get the local date parts to avoid timezone issues
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0'); 
            const day = String(date.getDate()).padStart(2, '0');

            // Return in YYYY-MM-DD format
            return `${year}-${month}-${day}`;
        } catch (error) {
            console.error('Error formatting date:', error);
            return "";
        }
    };
    
    // Check if a scheme is active based on its status and expiry date
    const isSchemeActive = (scheme) => {
        if (!scheme.status) return false;
        if (!scheme.expiry_date) return true;
        
        const today = new Date();
        const expiryDate = new Date(scheme.expiry_date);
        return expiryDate >= today;
    };

    const openAddModal = () => {
        setModalMode('add');
        
        // Generate a unique scheme_id (simple approach)
        const maxId = schemes.length > 0 
            ? Math.max(...schemes.map(scheme => scheme.scheme_id)) 
            : 0;
            
        setFormData({
            scheme_id: maxId + 1,
            name: '',
            description: '',
            status: true,
            expiry_date: formatDateForInput(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)) // Default: 1 year from now
        });
        setIsModalOpen(true);
    };

    const openEditModal = (scheme) => {
        setModalMode('edit');
        setSelectedScheme(scheme);
        setFormData({
            scheme_id: scheme.scheme_id,
            name: scheme.name,
            description: scheme.description || '',
            status: scheme.status,
            expiry_date: formatDateForInput(scheme.expiry_date)
        });
        setIsModalOpen(true);
    };

    const openDeleteModal = (scheme) => {
        setModalMode('delete');
        setSelectedScheme(scheme);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedScheme(null);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
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

            // Ensure date is properly formatted for all requests
            const formattedFormData = {
                ...formData,
                // Ensure date is in the correct format
                expiry_date: formatDateForInput(formData.expiry_date)
            };

            let response;
            
            if (modalMode === 'add') {
                response = await axios.post('http://localhost:3535/employee/schemes', formattedFormData, {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                
                // Add the new scheme to state
                setSchemes([...schemes, response.data]);
                setSuccessMessage('Scheme added successfully!');
            } 
            else if (modalMode === 'edit') {
                response = await axios.put(`http://localhost:3535/employee/schemes/${selectedScheme.scheme_id}`, formattedFormData, {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                
                // Update the scheme in state
                setSchemes(schemes.map(scheme => 
                    scheme.scheme_id === selectedScheme.scheme_id ? response.data : scheme
                ));
                setSuccessMessage('Scheme updated successfully!');
            } 
            else if (modalMode === 'delete') {
                await axios.delete(`http://localhost:3535/employee/schemes/${selectedScheme.scheme_id}`, {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${token}`,
                    }
                });
                
                // Remove the scheme from state
                setSchemes(schemes.filter(scheme => scheme.scheme_id !== selectedScheme.scheme_id));
                setSuccessMessage('Scheme deleted successfully!');
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
    const getSchemeStats = () => {
        const today = new Date();
        
        const totalSchemes = schemes.length;
        const activeSchemes = schemes.filter(scheme => scheme.status && (!scheme.expiry_date || new Date(scheme.expiry_date) >= today)).length;
        const inactiveSchemes = schemes.filter(scheme => !scheme.status).length;
        const expiredSchemes = schemes.filter(scheme => scheme.status && scheme.expiry_date && new Date(scheme.expiry_date) < today).length;
        
        // Calculate schemes expiring in the next month
        const nextMonth = new Date();
        nextMonth.setDate(nextMonth.getDate() + 30);
        
        const soonExpiringSchemes = schemes.filter(scheme => 
            scheme.status && 
            scheme.expiry_date && 
            new Date(scheme.expiry_date) >= today && 
            new Date(scheme.expiry_date) <= nextMonth
        ).length;
        
        return {
            total: totalSchemes,
            active: activeSchemes,
            inactive: inactiveSchemes,
            expired: expiredSchemes,
            soonExpiring: soonExpiringSchemes
        };
    };
    
    const schemeStats = getSchemeStats();

    // Filter and sort schemes
    const filteredAndSortedSchemes = schemes
        .filter(scheme => {
            // Apply status filter
            if (statusFilter === 'active') {
                if (!scheme.status || (scheme.expiry_date && new Date(scheme.expiry_date) < new Date())) {
                    return false;
                }
            } else if (statusFilter === 'inactive') {
                if (scheme.status) {
                    return false;
                }
            } else if (statusFilter === 'expired') {
                if (!scheme.status || !scheme.expiry_date || new Date(scheme.expiry_date) >= new Date()) {
                    return false;
                }
            }
            
            // Apply search filter
            return (
                scheme.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (scheme.description && scheme.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                String(scheme.scheme_id).includes(searchTerm)
            );
        })
        .sort((a, b) => {
            let valA = a[sortField];
            let valB = b[sortField];
            
            // Handle date fields
            if (sortField === 'expiry_date') {
                valA = valA ? new Date(valA).getTime() : Number.MAX_SAFE_INTEGER;
                valB = valB ? new Date(valB).getTime() : Number.MAX_SAFE_INTEGER;
            }
            
            // Handle boolean fields
            if (sortField === 'status') {
                valA = isSchemeActive(a) ? 1 : 0;
                valB = isSchemeActive(b) ? 1 : 0;
            }
            
            if (valA < valB) {
                return sortDirection === 'asc' ? -1 : 1;
            }
            if (valA > valB) {
                return sortDirection === 'asc' ? 1 : -1;
            }
            return 0;
        });

    const getStatusClass = (scheme) => {
        if (!scheme.status) return 'status-inactive';
        if (scheme.expiry_date && new Date(scheme.expiry_date) < new Date()) return 'status-expired';
        
        // Check if scheme is expiring soon (within 30 days)
        if (scheme.expiry_date) {
            const expiryDate = new Date(scheme.expiry_date);
            const today = new Date();
            const daysUntilExpiry = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));
            
            if (daysUntilExpiry <= 30) return 'status-expiring-soon';
        }
        
        return 'status-active';
    };

    const getStatusLabel = (scheme) => {
        if (!scheme.status) return 'Inactive';
        if (scheme.expiry_date && new Date(scheme.expiry_date) < new Date()) return 'Expired';
        
        // Check if scheme is expiring soon (within 30 days)
        if (scheme.expiry_date) {
            const expiryDate = new Date(scheme.expiry_date);
            const today = new Date();
            const daysUntilExpiry = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));
            
            if (daysUntilExpiry <= 30) return `Expires in ${daysUntilExpiry} days`;
        }
        
        return 'Active';
    };

    return (
        <div className="schemes-employee-container">
            <div className="schemes-employee-header">
                <div className="title-section">
                    <h1>Scheme Management</h1>
                    <Link to="/employee/dashboard" className="back-link">Back to Dashboard</Link>
                </div>
                
                {successMessage && (
                    <div className="success-message">
                        {successMessage}
                    </div>
                )}
                
                {error && (
                    <div className="error-message">
                        {error}
                        <button onClick={() => setError(null)} className="dismiss-error">×</button>
                    </div>
                )}
                
                <div className="filters-section">
                    <div className="search-bar">
                        <input
                            type="text"
                            placeholder="Search schemes by name or description..."
                            className="search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="status-filter">
                        <select 
                            value={statusFilter} 
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="status-select"
                        >
                            <option value="all">All Schemes</option>
                            <option value="active">Active Schemes</option>
                            <option value="inactive">Inactive Schemes</option>
                            <option value="expired">Expired Schemes</option>
                        </select>
                    </div>
                </div>
                
                <div className="add-button-section">
                    <button className="add-button" onClick={openAddModal}>
                        Add New Scheme
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading schemes...</p>
                </div>
            ) : (
                <div className="schemes-content">
                    <div className="schemes-stats">
                        <div className="stat-card">
                            <div className="stat-value">{schemeStats.total}</div>
                            <div className="stat-label">Total Schemes</div>
                        </div>
                        <div className="stat-card status-active">
                            <div className="stat-value">{schemeStats.active}</div>
                            <div className="stat-label">Active Schemes</div>
                        </div>
                        <div className="stat-card status-inactive">
                            <div className="stat-value">{schemeStats.inactive}</div>
                            <div className="stat-label">Inactive Schemes</div>
                        </div>
                        <div className="stat-card status-expired">
                            <div className="stat-value">{schemeStats.expired}</div>
                            <div className="stat-label">Expired Schemes</div>
                        </div>
                        <div className="stat-card status-expiring-soon">
                            <div className="stat-value">{schemeStats.soonExpiring}</div>
                            <div className="stat-label">Expiring Soon (30 days)</div>
                        </div>
                    </div>
                
                    <div className="schemes-table-container">
                        {filteredAndSortedSchemes.length === 0 ? (
                            <div className="no-data">
                                {searchTerm || statusFilter !== 'all' ? 'No matching schemes found' : 'No schemes available'}
                            </div>
                        ) : (
                            <table className="schemes-table">
                                <thead>
                                    <tr>
                                        <th onClick={() => handleSort('scheme_id')}>
                                            ID {getSortIcon('scheme_id')}
                                        </th>
                                        <th onClick={() => handleSort('name')}>
                                            Name {getSortIcon('name')}
                                        </th>
                                        <th onClick={() => handleSort('description')}>
                                            Description {getSortIcon('description')}
                                        </th>
                                        <th onClick={() => handleSort('status')}>
                                            Status {getSortIcon('status')}
                                        </th>
                                        <th onClick={() => handleSort('expiry_date')}>
                                            Expiry Date {getSortIcon('expiry_date')}
                                        </th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAndSortedSchemes.map((scheme) => (
                                        <tr key={scheme.scheme_id} className={getStatusClass(scheme)}>
                                            <td>{scheme.scheme_id}</td>
                                            <td>{scheme.name}</td>
                                            <td className="description-cell">
                                                {scheme.description || "No description available"}
                                            </td>
                                            <td>
                                                <span className={`status-badge ${getStatusClass(scheme)}`}>
                                                    {getStatusLabel(scheme)}
                                                </span>
                                            </td>
                                            <td>{scheme.expiry_date ? formatDate(scheme.expiry_date) : "No expiry date"}</td>
                                            <td className="action-buttons">
                                                <button 
                                                    className="edit-button" 
                                                    onClick={() => openEditModal(scheme)}
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    className="delete-button" 
                                                    onClick={() => openDeleteModal(scheme)}
                                                >
                                                    Delete
                                                </button>
                                                <button
                                                    className="view-button"
                                                    onClick={() => navigate(`/employee/schemes/${scheme.scheme_id}`)}
                                                >
                                                    Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                
                    <div className="schemes-cards">
                        <h2>Scheme Cards</h2>
                        <div className="schemes-card-grid">
                            {filteredAndSortedSchemes.map((scheme) => (
                                <div key={scheme.scheme_id} className={`scheme-card ${getStatusClass(scheme)}`}>
                                    <div className="scheme-card-header">
                                        <h3>{scheme.name}</h3>
                                        <div className={`scheme-status ${getStatusClass(scheme)}`}>
                                            {getStatusLabel(scheme)}
                                        </div>
                                    </div>
                                    <div className="scheme-card-body">
                                        <p className="scheme-description">
                                            {scheme.description?.length > 120 
                                                ? `${scheme.description.substring(0, 120)}...` 
                                                : scheme.description || "No description available"}
                                        </p>
                                        {scheme.expiry_date && (
                                            <p className="scheme-expiry">
                                                <strong>Expires:</strong> {formatDate(scheme.expiry_date)}
                                            </p>
                                        )}
                                    </div>
                                    <div className="scheme-card-footer">
                                        <button 
                                            className="card-edit-button" 
                                            onClick={() => openEditModal(scheme)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="card-view-button"
                                            onClick={() => navigate(`/employee/schemes/${scheme.scheme_id}`)}
                                        >
                                            Details
                                        </button>
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
                                {modalMode === 'add' ? 'Add New Scheme' : 
                                 modalMode === 'edit' ? 'Edit Scheme' : 
                                 'Delete Scheme'}
                            </h2>
                            <button className="close-button" onClick={closeModal}>×</button>
                        </div>
                        
                        <div className="modal-content">
                            {modalMode === 'delete' ? (
                                <div className="delete-confirmation">
                                    <p>Are you sure you want to delete this scheme?</p>
                                    <p><strong>Name:</strong> {selectedScheme?.name}</p>
                                    {selectedScheme?.description && (
                                        <p><strong>Description:</strong> {selectedScheme?.description}</p>
                                    )}
                                    <p><strong>Status:</strong> {selectedScheme?.status ? 'Active' : 'Inactive'}</p>
                                    {selectedScheme?.expiry_date && (
                                        <p><strong>Expiry Date:</strong> {formatDate(selectedScheme?.expiry_date)}</p>
                                    )}
                                    
                                    <div className="warning-message">
                                        <strong>Warning:</strong> This action cannot be undone. Deleting this scheme 
                                        will remove it from the system permanently.
                                    </div>
                                    
                                    <div className="modal-actions">
                                        <button className="cancel-button" onClick={closeModal}>Cancel</button>
                                        <button className="confirm-delete-button" onClick={handleSubmit}>Delete</button>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit}>
                                    <div className="form-group">
                                        <label>Scheme ID:</label>
                                        <input 
                                            type="number" 
                                            name="scheme_id"
                                            value={formData.scheme_id}
                                            onChange={handleInputChange}
                                            required
                                            disabled={modalMode === 'edit'}
                                        />
                                        {modalMode === 'edit' && (
                                            <p className="form-note">Scheme ID cannot be changed after creation.</p>
                                        )}
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>Scheme Name:</label>
                                        <input 
                                            type="text" 
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required
                                            maxLength={100}
                                            placeholder="Enter scheme name"
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>Description:</label>
                                        <textarea 
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            rows={5}
                                            maxLength={2000}
                                            placeholder="Enter scheme description"
                                        ></textarea>
                                    </div>
                                    
                                    <div className="form-group checkbox-group">
                                        <label className="checkbox-label">
                                            <input 
                                                type="checkbox" 
                                                name="status"
                                                checked={formData.status}
                                                onChange={handleInputChange}
                                            />
                                            Active Status
                                        </label>
                                        <p className="form-note">
                                            Inactive schemes will not be visible to citizens
                                        </p>
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>Expiry Date:</label>
                                        <input 
                                            type="date" 
                                            name="expiry_date"
                                            value={formData.expiry_date}
                                            onChange={handleInputChange}
                                            min={formatDateForInput(new Date())}
                                        />
                                        <p className="form-note">
                                            Leave blank for schemes with no expiry date
                                        </p>
                                    </div>
                                    
                                    <div className="modal-actions">
                                        <button className="cancel-button" onClick={closeModal} type="button">Cancel</button>
                                        <button className="submit-button" type="submit">
                                            {modalMode === 'add' ? 'Add Scheme' : 'Update Scheme'}
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

export default EmployeeSchemes;