import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/admin/AdminUsers.css';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [citizens, setCitizens] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState('user_id');
    const [sortDirection, setSortDirection] = useState('asc');
    const navigate = useNavigate();
    
    // State for modal and form
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', or 'delete'
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: '',
        citizen_id: ''
    });
    const [roles] = useState(['admin', 'employee', 'citizen', 'monitor']);
    const [selectedUser, setSelectedUser] = useState(null);

    // Fetch users data
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                
                if (!token) {
                    navigate('/login');
                    return;
                }
                
                const response = await axios.get('http://localhost:3535/admin/users', {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                
                setUsers(Array.isArray(response.data) ? response.data : []);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching users:', error);
                setError('Failed to load users data. Please try again later.');
                setLoading(false);
                
                if (error.response && error.response.status === 401) {
                    navigate('/login');
                }
            }
        };

        fetchUsers();
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
                
                const response = await axios.get('http://localhost:3535/admin/citizens', {
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
            username: '',
            password: '',
            role: '',
            citizen_id: ''
        });
        setIsModalOpen(true);
    };

    const openEditModal = (user) => {
        setModalMode('edit');
        setSelectedUser(user);
        setFormData({
            username: user.username,
            password: '', // Don't populate password for security reasons
            role: user.role,
            citizen_id: user.citizen_id || ''
        });
        setIsModalOpen(true);
    };

    const openDeleteModal = (user) => {
        setModalMode('delete');
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedUser(null);
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
                    'http://localhost:3535/admin/users',
                    formData,
                    {
                        withCredentials: true,
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                setUsers([...users, response.data]);
            } else if (modalMode === 'edit') {
                response = await axios.put(
                    `http://localhost:3535/admin/users/${selectedUser.user_id}`,
                    formData,
                    {
                        withCredentials: true,
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                setUsers(users.map(user => 
                    user.user_id === selectedUser.user_id ? response.data : user
                ));
            } else if (modalMode === 'delete') {
                await axios.delete(
                    `http://localhost:3535/admin/users/${selectedUser.user_id}`,
                    {
                        withCredentials: true,
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                setUsers(users.filter(user => user.user_id !== selectedUser.user_id));
            }
            
            closeModal();
        } catch (error) {
            console.error('Error submitting form:', error);
            setError(error.response?.data?.error || 'An error occurred while processing your request');
        }
    };

    const filteredAndSortedUsers = (Array.isArray(users) ? users : [])
        .filter(user => 
            (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.role && user.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
            String(user.user_id).includes(searchTerm) ||
            String(user.citizen_id).includes(searchTerm)
        )
        .sort((a, b) => {
            let valA = a[sortField];
            let valB = b[sortField];
            
            // Handle numeric fields
            if (sortField === 'user_id' || sortField === 'citizen_id') {
                valA = Number(valA) || 0;
                valB = Number(valB) || 0;
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
    const roleCounts = filteredAndSortedUsers.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className="users-admin-container">
            <div className="users-admin-header">
                <div className="title-section">
                    <h1>User Management</h1>
                    <Link to="/admin/dashboard" className="back-link">Back to Dashboard</Link>
                </div>
                <div className="actions-section">
                    <div className="search-section">
                        <input
                            type="text"
                            placeholder="Search by username, role, or ID..."
                            className="search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className='add-button-section'>
                    <button className="add-button" onClick={openAddModal}>
                        Add New User
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading users information...</p>
                </div>
            ) : error ? (
                <div className="error-message">{error}</div>
            ) : (
                <div className="users-table-container">
                    {filteredAndSortedUsers.length === 0 ? (
                        <div className="no-users">
                            {searchTerm ? 'No matching users found' : 'No users available'}
                        </div>
                    ) : (
                        <>
                            <div className="user-stats">
                                <div className="stat-card">
                                    <div className="stat-value">{users.length}</div>
                                    <div className="stat-label">Total Users</div>
                                </div>
                                {roles.map(role => (
                                    <div className="stat-card" key={role}>
                                        <div className="stat-value">{roleCounts[role] || 0}</div>
                                        <div className="stat-label">{role.charAt(0).toUpperCase() + role.slice(1)} Users</div>
                                    </div>
                                ))}
                            </div>
                        
                            <table className="users-table">
                                <thead>
                                    <tr>
                                        <th onClick={() => handleSort('user_id')}>
                                            User ID {getSortIcon('user_id')}
                                        </th>
                                        <th onClick={() => handleSort('username')}>
                                            Username {getSortIcon('username')}
                                        </th>
                                        <th onClick={() => handleSort('role')}>
                                            Role {getSortIcon('role')}
                                        </th>
                                        <th onClick={() => handleSort('citizen_id')}>
                                            Citizen ID {getSortIcon('citizen_id')}
                                        </th>
                                        <th onClick={() => handleSort('created_at')}>
                                            Created At {getSortIcon('created_at')}
                                        </th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAndSortedUsers.map((user) => (
                                        <tr key={user.user_id}>
                                            <td>{user.user_id}</td>
                                            <td>{user.username}</td>
                                            <td>{user.role}</td>
                                            <td>{user.citizen_id || "N/A"}</td>
                                            <td>
                                                {new Date(user.created_at).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </td>
                                            <td className="action-buttons">
                                                <button 
                                                    className="edit-button" 
                                                    onClick={() => openEditModal(user)}
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    className="delete-button" 
                                                    onClick={() => openDeleteModal(user)}
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
                                {modalMode === 'add' ? 'Add New User' : 
                                 modalMode === 'edit' ? 'Edit User' : 
                                 'Delete User'}
                            </h2>
                            <button className="close-button" onClick={closeModal}>×</button>
                        </div>
                        
                        <div className="modal-content">
                            {modalMode === 'delete' ? (
                                <div className="delete-confirmation">
                                    <p>Are you sure you want to delete this user?</p>
                                    <p><strong>User ID:</strong> {selectedUser?.user_id}</p>
                                    <p><strong>Username:</strong> {selectedUser?.username}</p>
                                    <p><strong>Role:</strong> {selectedUser?.role}</p>
                                    
                                    <div className="modal-actions">
                                        <button className="cancel-button" onClick={closeModal}>Cancel</button>
                                        <button className="confirm-delete-button" onClick={handleSubmit}>Delete</button>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit}>
                                    {modalMode === 'edit' && (
                                        <div className="form-group">
                                            <label>User ID:</label>
                                            <input 
                                                type="text" 
                                                name="user_id" 
                                                value={selectedUser?.user_id} 
                                                disabled 
                                            />
                                        </div>
                                    )}
                                    
                                    <div className="form-group">
                                        <label>Username:</label>
                                        <input 
                                            type="text" 
                                            name="username" 
                                            value={formData.username} 
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>Password:</label>
                                        <input 
                                            type="password" 
                                            name="password" 
                                            value={formData.password} 
                                            onChange={handleInputChange}
                                            required={modalMode === 'add'}
                                            placeholder={modalMode === 'edit' ? "Leave blank to keep current password" : ""}
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>Role:</label>
                                        <select 
                                            name="role" 
                                            value={formData.role} 
                                            onChange={handleInputChange}
                                            required
                                        >
                                            <option value="">Select Role</option>
                                            {roles.map(role => (
                                                <option key={role} value={role}>{role}</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>Citizen (optional):</label>
                                        <select 
                                            name="citizen_id" 
                                            value={formData.citizen_id} 
                                            onChange={handleInputChange}
                                        >
                                            <option value="">None (System User)</option>
                                            {citizens.map(citizen => (
                                                <option key={citizen.citizen_id} value={citizen.citizen_id}>
                                                    {citizen.name} (ID: {citizen.citizen_id})
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

export default AdminUsers;