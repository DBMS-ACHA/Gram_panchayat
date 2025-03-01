import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/employee/EmployeeAssets.css';

const EmployeeAssets = () => {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', or 'delete'
    const [selectedAsset, setSelectedAsset] = useState(null);

    // Form data
    const [formData, setFormData] = useState({
        asset_id: '',
        type: '',
        location: '',
        installation_date: ''
    });

    // Search and Filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');

    // Sort state
    const [sortField, setSortField] = useState('installation_date');
    const [sortDirection, setSortDirection] = useState('desc');

    const navigate = useNavigate();

    // Fetch assets on component mount
    useEffect(() => {
        fetchAssets();
    }, []);

    // Fetch assets from the API
    const fetchAssets = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            if (!token) {
                navigate('/');
                return;
            }

            const response = await axios.get('http://localhost:3535/employee/assets', {
                withCredentials: true,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setAssets(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching assets:', err);
            setError(err.response?.data?.error || 'Failed to fetch assets');
        } finally {
            setLoading(false);
        }
    };

    // Open modal for add, edit, or delete
    const openAddModal = () => {
        setModalMode('add');
        setFormData({
            asset_id: '',
            type: '',
            location: '',
            installation_date: formatDateForInput(new Date())
        });
        setIsModalOpen(true);
    };

    const openEditModal = (asset) => {
        setModalMode('edit');
        setSelectedAsset(asset);
        setFormData({
            asset_id: asset.asset_id,
            type: asset.type,
            location: asset.location,
            installation_date: formatDateForInput(asset.installation_date)
        });
        setIsModalOpen(true);
    };

    const openDeleteModal = (asset) => {
        setModalMode('delete');
        setSelectedAsset(asset);
        setIsModalOpen(true);
    };

    // Close modal
    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedAsset(null);
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return "Not specified";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Format date for input fields
    const formatDateForInput = (dateString) => {
        if (!dateString) return "";

        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "";

            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');

            return `${year}-${month}-${day}`;
        } catch (error) {
            console.error('Error formatting date:', error);
            return "";
        }
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle form submission
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
                response = await axios.post('http://localhost:3535/employee/assets', formData, {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                setAssets(prev => [...prev, response.data]);
                setSuccessMessage('Asset added successfully!');
            }
            else if (modalMode === 'edit') {
                response = await axios.put(`http://localhost:3535/employee/assets/${formData.asset_id}`, formData, {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                setAssets(prev =>
                    prev.map(asset =>
                        asset.asset_id === formData.asset_id ? response.data : asset
                    )
                );
                setSuccessMessage('Asset updated successfully!');
            }
            else if (modalMode === 'delete') {
                await axios.delete(`http://localhost:3535/employee/assets/${selectedAsset.asset_id}`, {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                setAssets(prev =>
                    prev.filter(asset => asset.asset_id !== selectedAsset.asset_id)
                );
                setSuccessMessage('Asset deleted successfully!');
            }

            closeModal();

            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccessMessage('');
            }, 3000);
        } catch (err) {
            console.error('Error submitting form:', err);
            setError(err.response?.data?.error || 'An error occurred while processing your request');
        }
    };

    // Handle sort
    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Get sort icon
    const getSortIcon = (field) => {
        if (sortField !== field) return '↕';
        return sortDirection === 'asc' ? '↑' : '↓';
    };

    // Calculate asset statistics
    const getAssetStats = () => {
        if (!assets.length) return {
            total: 0,
            types: 0,
            newest: null,
            oldest: null
        };

        const types = new Set(assets.map(asset => asset.type)).size;

        // Find newest and oldest installation dates
        let newest = null;
        let oldest = null;

        assets.forEach(asset => {
            const date = new Date(asset.installation_date);
            if (!newest || date > newest) newest = date;
            if (!oldest || date < oldest) oldest = date;
        });

        return {
            total: assets.length,
            types,
            newest,
            oldest
        };
    };

    const assetStats = getAssetStats();

    // Filter and sort assets
    const filteredAndSortedAssets = assets
        .filter(asset =>
            (filterType === 'all' || asset.type === filterType) &&
            (
                asset.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                asset.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                asset.asset_id.toString().includes(searchTerm)
            )
        )
        .sort((a, b) => {
            // Handle date fields
            if (sortField === 'installation_date') {
                const aDate = a[sortField] ? new Date(a[sortField]).getTime() : 0;
                const bDate = b[sortField] ? new Date(b[sortField]).getTime() : 0;
                return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
            }

            // Handle string fields
            const aValue = a[sortField] || '';
            const bValue = b[sortField] || '';
            return sortDirection === 'asc'
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
        });

    // Get unique asset types for filter
    const assetTypes = ['all', ...new Set(assets.map(asset => asset.type))];

    return (
        <div className="assets-employee-container">
            <div className="assets-employee-header">
                <div className="title-section">
                    <h1>Asset Management</h1>
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
                            placeholder="Search assets..."
                            className="search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="filter-dropdown">
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">All Types</option>
                            {assetTypes.filter(type => type !== 'all').map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="add-button-section">
                    <button className="add-button" onClick={openAddModal}>
                        Add New Asset
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading assets...</p>
                </div>
            ) : (
                <div className="assets-content">
                    <div className="assets-stats">
                        <div className="stat-card">
                            <div className="stat-value">{assetStats.total}</div>
                            <div className="stat-label">Total Assets</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">{assetStats.types}</div>
                            <div className="stat-label">Asset Types</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">
                                {assetStats.newest ? formatDate(assetStats.newest) : 'None'}
                            </div>
                            <div className="stat-label">Newest Asset</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">
                                {assetStats.oldest ? formatDate(assetStats.oldest) : 'None'}
                            </div>
                            <div className="stat-label">Oldest Asset</div>
                        </div>
                    </div>

                    <div className="assets-table-container">
                        {filteredAndSortedAssets.length === 0 ? (
                            <div className="no-data">
                                {searchTerm || filterType !== 'all' ? 'No matching assets found' : 'No assets available'}
                            </div>
                        ) : (
                            <table className="assets-table">
                                <thead>
                                    <tr>
                                        <th onClick={() => handleSort('asset_id')}>
                                            ID {getSortIcon('asset_id')}
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
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAndSortedAssets.map((asset) => (
                                        <tr key={asset.asset_id}>
                                            <td>{asset.asset_id}</td>
                                            <td>{asset.type}</td>
                                            <td>{asset.location}</td>
                                            <td>{formatDate(asset.installation_date)}</td>
                                            <td className="action-buttons">
                                                <button
                                                    className="edit-button"
                                                    onClick={() => openEditModal(asset)}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className="delete-button"
                                                    onClick={() => openDeleteModal(asset)}
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h2>
                                {modalMode === 'add' ? 'Add New Asset' :
                                    modalMode === 'edit' ? 'Edit Asset' :
                                        'Delete Asset'}
                            </h2>
                            <button className="close-button" onClick={closeModal}>×</button>
                        </div>

                        <div className="modal-content">
                            {modalMode === 'delete' ? (
                                <div className="delete-confirmation">
                                    <p>Are you sure you want to delete this asset?</p>
                                    <p><strong>Asset ID:</strong> {selectedAsset?.asset_id}</p>
                                    <p><strong>Type:</strong> {selectedAsset?.type}</p>
                                    <p><strong>Location:</strong> {selectedAsset?.location}</p>

                                    <div className="warning-message">
                                        <strong>Warning:</strong> This action cannot be undone. Deleting this asset
                                        will remove it from the system permanently.
                                    </div>

                                    <div className="modal-actions">
                                        <button className="cancel-button" onClick={closeModal}>Cancel</button>
                                        <button className="confirm-delete-button" onClick={handleSubmit}>Delete</button>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit}>
                                    {modalMode === 'add' && (
                                        <div className="form-group">
                                            <label>Asset ID:</label>
                                            <input
                                                type="number"
                                                name="asset_id"
                                                value={formData.asset_id}
                                                onChange={handleInputChange}
                                                required
                                            />
                                            <p className="form-note">Enter a unique identifier for this asset</p>
                                        </div>
                                    )}
                                    <div className="form-group">
                                        <label>Asset Type:</label>
                                        <input
                                            type="text"
                                            name="type"
                                            value={formData.type}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="Enter asset type (e.g., building, equipment, furniture)"
                                        />
                                        <p className="form-note">Common types: building, equipment, furniture, electronics, water system, road, vehicle</p>
                                    </div>

                                    <div className="form-group">
                                        <label>Location:</label>
                                        <input
                                            type="text"
                                            name="location"
                                            value={formData.location}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="Where is this asset located?"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Installation Date:</label>
                                        <input
                                            type="date"
                                            name="installation_date"
                                            value={formData.installation_date}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>

                                    <div className="modal-actions">
                                        <button className="cancel-button" onClick={closeModal} type="button">Cancel</button>
                                        <button className="submit-button" type="submit">
                                            {modalMode === 'add' ? 'Add Asset' : 'Update Asset'}
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

export default EmployeeAssets;