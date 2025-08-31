// AccountsManagement.jsx
// Add a link to this page in your admin sidebar/menu for easy access.
import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../utils/api';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaEye, FaTrash, FaUserCheck, FaUserTimes, FaBoxOpen } from 'react-icons/fa';
import toast from 'react-hot-toast';

const TABS = [
  { key: 'users', label: 'All Users' },
  { key: 'vendors', label: 'All Vendors' },
];

const PAGE_SIZE = 10;

const AccountsManagement = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('all');
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [adminActivity, setAdminActivity] = useState([]);
  const [adminActionLoading, setAdminActionLoading] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userActionLoading, setUserActionLoading] = useState(false);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [vendorActionLoading, setVendorActionLoading] = useState(false);
  const skipUrlSync = useRef(false);

  // Fetch data function
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    let url = '';
    let params = { page, limit: PAGE_SIZE };
    if (debouncedSearch) params.search = debouncedSearch;
    if (activeTab === 'users') {
      url = '/admin/users';
      if (roleFilter !== 'all') params.role = roleFilter;
    } else if (activeTab === 'vendors') {
      url = '/vendors/admin/applications';
    }
    try {
      const response = await api.get(url, { params });
      if (activeTab === 'vendors') {
        // Backend returns { applications, total }
        setData(response.data.applications || response.data.vendors || []);
        setTotal(response.data.total || response.data.totalVendors || 0);
      } else {
        setData(response.data.users || []);
        setTotal(response.data.total || response.data.totalUsers || 0);
      }
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [activeTab, debouncedSearch, page, roleFilter]);

  // Set active tab and search from URL query param on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    const searchParam = params.get('search') || '';

    let changed = false;
    if (tab && ['users', 'vendors'].includes(tab) && tab !== activeTab) {
      setActiveTab(tab);
      setPage(1);
      changed = true;
    }
    if (searchParam !== search) {
      setSearch(searchParam);
      changed = true;
    }
    // Only update if something actually changed
    // eslint-disable-next-line
  }, [location.search]);

  // When search or activeTab changes, update the URL only if needed, with ref guard
  useEffect(() => {
    if (skipUrlSync.current) {
      skipUrlSync.current = false;
      return;
    }
    const params = new URLSearchParams(location.search);
    const urlTab = params.get('tab') || 'users';
    const urlSearch = params.get('search') || '';

    if (urlTab === activeTab && urlSearch === search) return; // No update needed

    skipUrlSync.current = true;
    params.set('tab', activeTab);
    if (search) {
      params.set('search', search);
    } else {
      params.delete('search');
    }
    navigate({ search: params.toString() }, { replace: true });
    // eslint-disable-next-line
  }, [search, activeTab]);

  // Fetch data whenever activeTab, debouncedSearch, page, or roleFilter changes
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [activeTab, debouncedSearch, page, roleFilter]);

  // Fetch admin activity (real backend)
  const fetchAdminActivity = async (adminId) => {
    try {
      const res = await api.get(`/admin/users/${adminId}/activity`);
      setAdminActivity(res.data.activities || []);
    } catch (err) {
      setAdminActivity([]);
    }
  };

  // Admin actions
  const handleViewAdmin = async (admin) => {
    setSelectedAdmin(admin);
    setShowAdminModal(true);
    await fetchAdminActivity(admin._id);
  };

  const handleToggleActive = async (admin) => {
    setAdminActionLoading(true);
    try {
      await api.put(`/admin/users/${admin._id}/status`, { isActive: !admin.isActive });
      toast.success(`Admin ${admin.isActive ? 'deactivated' : 'activated'} successfully`);
      fetchData();
    } catch (err) {
      toast.error('Failed to update admin status');
    } finally {
      setAdminActionLoading(false);
    }
  };

  const handleDeleteAdmin = async (admin) => {
    if (!window.confirm('Are you sure you want to delete this admin? This action cannot be undone.')) return;
    setAdminActionLoading(true);
    try {
      await api.delete(`/admin/users/${admin._id}`);
      toast.success('Admin deleted successfully');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete admin');
    } finally {
      setAdminActionLoading(false);
    }
  };

  // User actions
  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };
  const handleToggleUserActive = async (user) => {
    setUserActionLoading(true);
    try {
      await api.put(`/admin/users/${user._id}/status`, { isActive: !user.isActive });
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'} successfully`);
      fetchData();
    } catch (err) {
      toast.error('Failed to update user status');
    } finally {
      setUserActionLoading(false);
    }
  };
  const handleDeleteUser = async (user) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    setUserActionLoading(true);
    try {
      await api.delete(`/admin/users/${user._id}`);
      toast.success('User deleted successfully');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete user');
    } finally {
      setUserActionLoading(false);
    }
  };

  // Vendor actions
  const handleViewVendor = (vendor) => {
    setSelectedVendor(vendor);
    setShowVendorModal(true);
  };
  const handleToggleVendorActive = async (vendor) => {
    setVendorActionLoading(true);
    try {
      await api.put(`/vendors/admin/${vendor._id}/status`, { status: vendor.status === 'approved' ? 'suspended' : 'approved' });
      toast.success(`Vendor ${vendor.status === 'approved' ? 'suspended' : 'activated'} successfully`);
      fetchData();
    } catch (err) {
      toast.error('Failed to update vendor status');
    } finally {
      setVendorActionLoading(false);
    }
  };
  const handleDeleteVendor = async (vendor) => {
    if (!window.confirm('Are you sure you want to delete this vendor? This action cannot be undone.')) return;
    setVendorActionLoading(true);
    try {
      await api.delete(`/vendors/admin/${vendor._id}`);
      toast.success('Vendor deleted successfully');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete vendor');
    } finally {
      setVendorActionLoading(false);
    }
  };

  // Table columns per tab
  const columns = {
    users: [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'role', label: 'Role' },
      { key: 'isActive', label: 'Status', render: v => v ? 'Active' : 'Inactive' },
      { key: 'actions', label: 'Actions', render: (v, row) => (
        <div className="flex gap-2">
          <button className="btn btn-xs btn-info" title="View Details" onClick={() => handleViewUser(row)}><FaEye /></button>
          <button
            className={`btn btn-xs ${row.isActive ? 'btn-warning' : 'btn-success'}`}
            title={row.isActive ? 'Deactivate' : 'Activate'}
            onClick={() => handleToggleUserActive(row)}
            disabled={userActionLoading}
          >
            {row.isActive ? <FaUserTimes /> : <FaUserCheck />}
          </button>
          <button className="btn btn-xs btn-error" title="Delete" onClick={() => handleDeleteUser(row)} disabled={userActionLoading}><FaTrash /></button>
        </div>
      ) },
    ],
    vendors: [
      { key: 'businessName', label: 'Business Name' },
      { key: 'user.name', label: 'Owner' },
      { key: 'user.email', label: 'Email' },
      { key: 'status', label: 'Status' },
      { key: 'categories', label: 'Categories', render: v => (v || []).join(', ') },
      { key: 'actions', label: 'Actions', render: (v, row) => (
        <div className="flex gap-2">
          <button className="btn btn-xs btn-info" title="View Details" onClick={() => handleViewVendor(row)}><FaEye /></button>
          <button
            className={`btn btn-xs ${row.status === 'approved' ? 'btn-warning' : 'btn-success'}`}
            title={row.status === 'approved' ? 'Suspend' : 'Activate'}
            onClick={() => handleToggleVendorActive(row)}
            disabled={vendorActionLoading}
          >
            {row.status === 'approved' ? <FaUserTimes /> : <FaUserCheck />}
          </button>
          <button className="btn btn-xs btn-error" title="Delete" onClick={() => handleDeleteVendor(row)} disabled={vendorActionLoading}><FaTrash /></button>
        </div>
      ) },
    ],
  };

  // Helper to get nested value
  const getValue = (obj, path) => path.split('.').reduce((o, k) => (o ? o[k] : ''), obj);

  // Defensive: ensure columns and data are always defined
  const safeColumns = columns[activeTab] || [];
  const safeData = Array.isArray(data) ? data : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 to-base-200">
      <div className="container mx-auto px-4 py-8">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur shadow-md rounded-2xl mb-8 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-base-200">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">Accounts Management</h1>
          <div className="flex gap-2">
            {TABS.map(tab => (
              <button
                key={tab.key}
                className={`btn btn-sm ${activeTab === tab.key ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        {/* Search & Filters */}
        <div className="bg-white rounded-2xl shadow p-6 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <form
            onSubmit={e => { e.preventDefault(); setDebouncedSearch(search); }}
            className="flex gap-2 w-full md:w-auto"
          >
            <input
              type="text"
              placeholder={`Search by ${activeTab === 'users' ? 'name' : 'business, owner, or email'}...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input input-bordered w-full md:w-64"
            />
            <button type="submit" className="btn btn-primary">Search</button>
          </form>
          {activeTab === 'users' && (
            <select
              className="select select-bordered w-full md:w-48"
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="user">User</option>
              <option value="vendor">Vendor</option>
              <option value="admin">Admin</option>
            </select>
          )}
        </div>
        {/* Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-x-auto mb-8">
          <table className="table w-full text-sm">
            <thead className="bg-gradient-to-r from-primary to-secondary text-white">
              <tr>
                {safeColumns.map(col => (
                  <th key={col.key}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {safeData.length === 0 ? (
                <tr>
                  <td colSpan={safeColumns.length} className="text-center py-8 text-gray-400">
                    No results found.
                  </td>
                </tr>
              ) : (
                safeData.map(item => (
                  <tr key={item._id} className="hover:bg-base-100 transition-colors">
                    {safeColumns.map(col => (
                      <td key={col.key}>
                        {col.render
                          ? col.render(getValue(item, col.key), item)
                          : getValue(item, col.key)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex justify-between items-center mt-4">
          <div>
            Showing {data.length} of {total} {activeTab}
          </div>
          <div className="join">
            <button
              className="join-item btn btn-sm"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <span className="join-item btn btn-sm btn-disabled">Page {page}</span>
            <button
              className="join-item btn btn-sm"
              disabled={data.length < PAGE_SIZE}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
      {/* Modals remain unchanged */}
      {/* Admin Details Modal */}
      {showAdminModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button className="absolute top-2 right-2 btn btn-xs" onClick={() => setShowAdminModal(false)}>✕</button>
            <h2 className="text-xl font-bold mb-2">Admin Details</h2>
            <div className="mb-2"><b>Name:</b> {selectedAdmin.name}</div>
            <div className="mb-2"><b>Email:</b> {selectedAdmin.email}</div>
            <div className="mb-2"><b>Status:</b> {selectedAdmin.isActive ? 'Active' : 'Inactive'}</div>
            <div className="mb-2"><b>Role:</b> {selectedAdmin.role}</div>
            <div className="mb-4"><b>ID:</b> {selectedAdmin._id}</div>
            <h3 className="font-semibold mb-1">Recent Activity</h3>
            <ul className="mb-4 list-disc list-inside text-sm">
              {adminActivity.length === 0 ? <li>No activity found.</li> : adminActivity.map((a, i) => <li key={i}>{new Date(a.createdAt).toLocaleString()}: {a.action}</li>)}
            </ul>
            <div className="flex gap-2">
              <button
                className={`btn btn-sm ${selectedAdmin.isActive ? 'btn-warning' : 'btn-success'}`}
                onClick={() => handleToggleActive(selectedAdmin)}
                disabled={adminActionLoading}
              >
                {selectedAdmin.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button
                className="btn btn-sm btn-error"
                onClick={() => handleDeleteAdmin(selectedAdmin)}
                disabled={adminActionLoading}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button className="absolute top-2 right-2 btn btn-xs" onClick={() => setShowUserModal(false)}>✕</button>
            <h2 className="text-xl font-bold mb-2">User Details</h2>
            <div className="mb-2"><b>Name:</b> {selectedUser.name}</div>
            <div className="mb-2"><b>Email:</b> {selectedUser.email}</div>
            <div className="mb-2"><b>Status:</b> {selectedUser.isActive ? 'Active' : 'Inactive'}</div>
            <div className="mb-2"><b>Role:</b> {selectedUser.role}</div>
            <div className="mb-4"><b>ID:</b> {selectedUser._id}</div>
            <div className="flex gap-2">
              <button
                className={`btn btn-sm ${selectedUser.isActive ? 'btn-warning' : 'btn-success'}`}
                onClick={() => handleToggleUserActive(selectedUser)}
                disabled={userActionLoading}
              >
                {selectedUser.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button
                className="btn btn-sm btn-error"
                onClick={() => handleDeleteUser(selectedUser)}
                disabled={userActionLoading}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Vendor Details Modal */}
      {showVendorModal && selectedVendor && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button className="absolute top-2 right-2 btn btn-xs" onClick={() => setShowVendorModal(false)}>✕</button>
            <h2 className="text-xl font-bold mb-2">Vendor Details</h2>
            <div className="mb-2"><b>Business Name:</b> {selectedVendor.businessName}</div>
            <div className="mb-2"><b>Owner:</b> {selectedVendor.user?.name}</div>
            <div className="mb-2"><b>Email:</b> {selectedVendor.user?.email}</div>
            <div className="mb-2"><b>Status:</b> {selectedVendor.status}</div>
            <div className="mb-2"><b>Categories:</b> {(selectedVendor.categories || []).join(', ')}</div>
            <div className="mb-4"><b>ID:</b> {selectedVendor._id}</div>
            <div className="flex gap-2">
              <button
                className={`btn btn-sm ${selectedVendor.status === 'approved' ? 'btn-warning' : 'btn-success'}`}
                onClick={() => handleToggleVendorActive(selectedVendor)}
                disabled={vendorActionLoading}
              >
                {selectedVendor.status === 'approved' ? 'Suspend' : 'Activate'}
              </button>
              <button
                className="btn btn-sm btn-error"
                onClick={() => handleDeleteVendor(selectedVendor)}
                disabled={vendorActionLoading}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsManagement; 