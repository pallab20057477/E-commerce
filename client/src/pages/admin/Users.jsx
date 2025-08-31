import React, { useState, useEffect } from 'react';
import { FaUser, FaEnvelope, FaPhone, FaCalendar, FaEdit, FaTrash, FaShieldAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import { useAdminData } from '../../contexts/AdminDataContext';

const AdminUsers = () => {
  const { setTotalUsers } = useAdminData();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchName, setSearchName] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all', 'admin', 'user', 'vendor'
  const navigate = useNavigate(); // <-- Add this line inside your component

  useEffect(() => {
    fetchUsers();
  }, [currentPage, filter]);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users', {
        params: {
          page: currentPage,
          limit: 10,
          search: searchTerm,
          filter
        }
      });
      setUsers(response.data.users);
      setTotalPages(response.data.totalPages);
      setTotalUsers(response.data.totalUsers || 0);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('User deleted successfully');
      fetchUsers();
      // Notify dashboard to refresh overview data
      const event = new CustomEvent('userDeleted');
      window.dispatchEvent(event);
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await api.put(`/admin/users/${userId}/status`, {
        isActive: !currentStatus
      });
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    toast.error('Role changes are not allowed. Admin users are predefined only.');
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return 'badge-error';
      case 'vendor':
        return 'badge-warning';
      case 'user':
        return 'badge-info';
      default:
        return 'badge-ghost';
    }
  };

  const getStatusBadge = (status) => {
    return status ? 'badge-success' : 'badge-error';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Filter users by searchName and role
  const filteredUsers = users.filter(user => {
    const name = user.name?.toLowerCase() || '';
    const matchesName = name.includes(searchName.toLowerCase());
    const matchesRole = roleFilter === 'all' ? true : user.role === roleFilter;
    return matchesName && matchesRole;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <h2 className="text-2xl font-bold text-gray-600 mt-4">Loading users...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-primary tracking-tight">
            User Management
          </h1>
          <p className="mt-2 text-lg text-gray-700">
            Manage all users in the system
          </p>
        </div>
        {/* <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
            className="input input-bordered w-64"
          /> */}
          {/* <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="select select-bordered"
          >
            <option value="all">All</option>
            <option value="admin">Admins</option>
            <option value="user">Users</option>
            <option value="vendor">Vendors</option>
          </select> */}
        {/* </div> */}
      </header>

      {/* Admin Notice */}
      <div className="alert alert-info mb-6">
        <FaShieldAlt className="text-xl" />
        <div>
          <h3 className="font-bold">Predefined Admin System</h3>
          <div className="text-sm">
            Admin users are predefined and cannot be created or modified through this interface. 
            Only system administrators can manage admin accounts.
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="join w-full">
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-bordered join-item flex-1"
              />
              <button type="submit" className="btn btn-primary join-item">
                Search
              </button>
            </div>
          </form>

          {/* <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="select select-bordered"
          >
            <option value="all">All Users</option>
            <option value="admin">Admins</option>
            <option value="vendor">Vendors</option>
            <option value="user">Regular Users</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select> */}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>User</th>
                <th>Contact</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td>
                    <div className="flex items-center space-x-3">
                      <div className="avatar placeholder">
                        <div className="bg-neutral text-neutral-content rounded-full w-12">
                          <span className="text-lg">{user.name.charAt(0).toUpperCase()}</span>
                        </div>
                      </div>
                      <div>
                        <div className="font-bold">{user.name}</div>
                        <div className="text-sm opacity-50">ID: {user._id.slice(-8)}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <FaEnvelope className="mr-2 text-gray-400" />
                        {user.email}
                      </div>
                      {user.phone && (
                        <div className="flex items-center text-sm">
                          <FaPhone className="mr-2 text-gray-400" />
                          {user.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${getRoleBadge(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadge(user.isActive)}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center text-sm">
                      <FaCalendar className="mr-2 text-gray-400" />
                      {formatDate(user.createdAt)}
                    </div>
                  </td>
                  <td>
                    <div className="flex space-x-2">
                      {/* <button
                        className="btn btn-sm btn-outline"
                        title="Edit User"
                        onClick={() => navigate(`/admin/users/${user._id}/edit`)}
                      >
                        <FaEdit />
                      </button> */}
                      <button
                        onClick={() => handleToggleStatus(user._id, user.isActive)}
                        className={`btn btn-sm ${user.isActive ? 'btn-warning' : 'btn-success'}`}
                        title={user.isActive ? 'Deactivate' : 'Activate'}
                        disabled={user.role === 'admin'}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user._id)}
                        className="btn btn-sm btn-error"
                        title="Delete User"
                        disabled={user.role === 'admin'}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center p-4">
            <div className="join">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="join-item btn"
              >
                «
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`join-item btn ${currentPage === page ? 'btn-active' : ''}`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="join-item btn"
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;