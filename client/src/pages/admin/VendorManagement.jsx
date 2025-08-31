import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { FaCheck, FaTimes, FaEye, FaPlus, FaChartBar, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';
import CustomModal from '../../components/CustomModal';

const VendorManagement = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  // eslint-disable-next-line no-unused-vars
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [vendorActivity, setVendorActivity] = useState(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivatingVendor, setDeactivatingVendor] = useState(null);
  // Add state for storing vendor activities
  const [vendorActivities, setVendorActivities] = useState({});
  const [activitiesLoading, setActivitiesLoading] = useState({});
  const [showAllDetailsModal, setShowAllDetailsModal] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [searchName, setSearchName] = useState('');

  // Add function to fetch activity for a specific vendor
  const fetchVendorActivity = useCallback(async (vendorId) => {
    if (vendorActivities[vendorId]) return; // Already loaded
    
    setActivitiesLoading(prev => ({ ...prev, [vendorId]: true }));
    try {
      const res = await api.get(`/vendors/admin/${vendorId}/activity`);
      setVendorActivities(prev => ({ ...prev, [vendorId]: res.data }));
    } catch (error) {
      console.error('Failed to fetch vendor activity:', error);
    } finally {
      setActivitiesLoading(prev => ({ ...prev, [vendorId]: false }));
    }
  }, [vendorActivities]);

  const fetchVendors = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10
      });
      
      if (statusFilter) {
        params.append('status', statusFilter);
      }

      const response = await api.get(`/vendors/admin/applications?${params}`);
      // Server returns { success, applications, total, totalPages, currentPage }
      const list = Array.isArray(response.data?.applications)
        ? response.data.applications
        : [];
      setVendors(list);
      setTotalPages(response.data?.totalPages || 1);
      
      // Fetch activity for each vendor
      list.forEach(vendor => {
        if (vendor?._id) {
          fetchVendorActivity(vendor._id);
        }
      });
    } catch (error) {
      console.error('Error fetching vendors:', error);
      toast.error('Failed to fetch vendors');
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, fetchVendorActivity]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const handleStatusUpdate = async (vendorId, status, rejectionReason = '') => {
    try {
      await api.put(`/vendors/admin/${vendorId}/status`, {
        status,
        rejectionReason
      });
      
      toast.success(`Vendor application ${status}`);
      fetchVendors();
    } catch (error) {
      toast.error('Failed to update vendor status');
    }
  };

  const handleViewActivity = async (vendorId, vendorData) => {
    setSelectedVendor(vendorData);
    setShowModal(true);
    setActivityLoading(true);
    try {
      const res = await api.get(`/vendors/admin/${vendorId}/activity`);
      setVendorActivity(res.data);
    } catch (error) {
      toast.error('Failed to fetch vendor activity');
      setVendorActivity(null);
    } finally {
      setActivityLoading(false);
    }
  };

  const handleDeactivateVendor = async (vendorId) => {
    if (!window.confirm('Are you sure you want to deactivate this vendor?')) return;
    try {
      await api.put(`/vendors/admin/${vendorId}/deactivate`);
      toast.success('Vendor deactivated successfully');
      setShowModal(false);
      fetchVendors();
    } catch (error) {
      toast.error('Failed to deactivate vendor');
    }
  };

  // eslint-disable-next-line no-unused-vars
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'badge-warning',
      approved: 'badge-success',
      rejected: 'badge-error',
      suspended: 'badge-neutral'
    };

    return (
      <span className={`badge ${statusClasses[status] || 'badge-neutral'}`}>
        {status}
      </span>
    );
  };

  // Filter vendors by search term safely
  const filteredVendors = (vendors || []).filter(vendor => {
    const businessName = vendor.businessName?.toLowerCase() || '';
    const ownerName = vendor.user?.name?.toLowerCase() || '';
    const email = vendor.contactInfo?.email?.toLowerCase() || '';
    const phone = vendor.contactInfo?.phone?.toLowerCase() || '';
    const term = (searchTerm || '').toLowerCase();
    
    return (
      businessName.includes(term) || 
      ownerName.includes(term) ||
      email.includes(term) ||
      phone.includes(term)
    );
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-base-100 to-base-200">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 to-base-200">
      <div className="container mx-auto px-4 py-8">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur shadow-md rounded-2xl mb-8 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-base-200">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">Vendor Management</h1>
          <div className="flex gap-4">
            <button onClick={() => setShowAllDetailsModal(true)} className="btn btn-outline btn-primary">All Vendor Details</button>
            <button onClick={() => navigate('/admin/vendors/add')} className="btn btn-primary"><FaPlus className="mr-2" />Add New Vendor</button>
          </div>
        </div>
        {/* Search & Filters */}
        <div className="bg-white rounded-2xl shadow p-6 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <form
            onSubmit={e => { e.preventDefault(); fetchVendors(); }}
            className="flex gap-2 w-full md:w-auto"
          >
            <input
              type="text"
              placeholder="Search by business, owner, or email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="input input-bordered w-full md:w-64"
            />
            <button type="submit" className="btn btn-primary" disabled={loading}>Search</button>
          </form>
          <select
            className="select select-bordered w-full md:w-48"
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
        {/* Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-x-auto mb-8">
          <table className="table w-full text-sm">
            <thead className="bg-gradient-to-r from-primary to-secondary text-white">
              <tr>
                <th>Business Name</th>
                <th>Owner</th>
                <th>Email</th>
                <th>Status</th>
                <th>Categories</th>
                <th>Activity</th>
                <th>Performance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-400">
                    No results found.
                  </td>
                </tr>
              ) : (
                filteredVendors.map(vendor => {
                  const activity = vendorActivities[vendor._id];
                  // eslint-disable-next-line no-unused-vars
                  const isLoading = activitiesLoading[vendor._id];
                  return (
                    <tr key={vendor._id} className="hover:bg-base-100 transition-colors">
                      <td>
                        <div className="font-bold text-base-content">{vendor.businessName}</div>
                        <div className="text-xs text-base-content/60">{vendor.businessType}</div>
                      </td>
                      <td>
                        <div className="font-medium">{vendor.user?.name}</div>
                        <div className="text-xs text-base-content/60">ID: {vendor.user?._id?.slice(-6)}</div>
                      </td>
                      <td>{vendor.user?.email}</td>
                      <td>
                        <span className={`badge px-3 py-1 rounded-full text-xs font-bold shadow-sm
                          ${vendor.status === 'approved' ? 'bg-gradient-to-r from-green-400 to-green-600 text-white' :
                            vendor.status === 'pending' ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white' :
                            vendor.status === 'rejected' ? 'bg-gradient-to-r from-red-400 to-red-600 text-white' :
                            'bg-gradient-to-r from-gray-400 to-gray-600 text-white'}`}>{vendor.status}</span>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {(vendor.categories || []).slice(0, 2).map((cat, idx) => (
                            <span key={idx} className="badge badge-xs badge-outline">{cat}</span>
                          ))}
                          {(vendor.categories || []).length > 2 && (
                            <span className="badge badge-xs badge-neutral">+{(vendor.categories || []).length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <button className="btn btn-xs btn-info" onClick={() => handleViewActivity(vendor._id, vendor)} title="View Activity"><FaEye /></button>
                      </td>
                      <td>
                        {activity ? (
                          <div className="flex flex-col gap-1 text-xs">
                            <span>Products: {activity.stats.totalProducts}</span>
                            <span>Orders: {activity.stats.totalOrders}</span>
                            <span>
                              Earnings: ₹{Number(activity?.stats?.totalEarnings ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="flex gap-1 flex-wrap">
                        {vendor.status !== 'approved' && (
                          <button className="btn btn-xs btn-success" onClick={() => handleStatusUpdate(vendor._id, 'approved')} title="Approve"><FaCheck /></button>
                        )}
                        {vendor.status !== 'rejected' && (
                          <button onClick={() => { const reason = prompt('Enter rejection reason:'); if (reason) { handleStatusUpdate(vendor._id, 'rejected', reason); } }} className="btn btn-xs btn-error" title="Reject"><FaTimes /></button>
                        )}
                        {vendor.status !== 'suspended' && (
                          <button className="btn btn-xs btn-warning" onClick={() => handleStatusUpdate(vendor._id, 'suspended')} title="Suspend">Suspend</button>
                        )}
                        {vendor.status === 'suspended' && (
                          <button className="btn btn-xs btn-success" onClick={() => handleStatusUpdate(vendor._id, 'approved')} title="Re-activate">Activate</button>
                        )}
                        <button className="btn btn-xs btn-info" onClick={() => handleViewActivity(vendor._id, vendor)} title="View Activity"><FaEye /></button>
                        {vendor.status !== 'suspended' && (
                          <button className="btn btn-xs btn-error" onClick={() => handleDeactivateVendor(vendor._id)} title="Deactivate"><FaTrash /></button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex justify-between items-center mt-4">
          <div>
            Showing {filteredVendors.length} of {vendors.length} vendors
          </div>
          <div className="join">
            <button
              className="join-item btn btn-sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <span className="join-item btn btn-sm btn-disabled">Page {currentPage}</span>
            <button
              className="join-item btn btn-sm"
              disabled={filteredVendors.length < 10}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
        {/* Remove summary cards here */}
      </div>

      {/* Vendor Details Modal */}
      {showModal && selectedVendor && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4">
              Vendor Details - {selectedVendor.businessName}
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-lg mb-2">Business Information</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p><strong>Name:</strong> {selectedVendor.businessName}</p>
                    <p><strong>Type:</strong> {selectedVendor.businessType}</p>
                    <p><strong>Description:</strong> {selectedVendor.businessDescription}</p>
                    <p><strong>Status:</strong> {getStatusBadge(selectedVendor.status)}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-lg mb-2">Owner Information</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p><strong>Name:</strong> {selectedVendor.user.name}</p>
                    <p><strong>Email:</strong> {selectedVendor.user.email}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-lg mb-2">Contact Information</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p><strong>Phone:</strong> {selectedVendor?.contactInfo?.phone || 'N/A'}</p>
                    <p><strong>Email:</strong> {selectedVendor?.contactInfo?.email || selectedVendor?.user?.email || 'N/A'}</p>
                    <p><strong>Website:</strong> {selectedVendor?.contactInfo?.website ? (
                      <a href={selectedVendor.contactInfo.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {selectedVendor.contactInfo.website}
                      </a>
                    ) : 'N/A'}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-lg mb-2">Business Address</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-1">
                    <p>{selectedVendor?.businessAddress?.street || 'N/A'}</p>
                    <p>
                      {[selectedVendor?.businessAddress?.city, selectedVendor?.businessAddress?.state]
                        .filter(Boolean)
                        .join(', ')}
                      {selectedVendor?.businessAddress?.zipCode ? ` ${selectedVendor.businessAddress.zipCode}` : ''}
                    </p>
                    <p>{selectedVendor?.businessAddress?.country || 'N/A'}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-lg mb-2">Categories</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedVendor?.categories?.length > 0 ? (
                      selectedVendor.categories.map((category, index) => (
                        <span key={index} className="badge badge-outline">{category}</span>
                      ))
                    ) : (
                      <p className="text-gray-500">No categories specified</p>
                    )}
                  </div>
                </div>
                
                {selectedVendor.rejectionReason && (
                  <div>
                    <h4 className="font-semibold text-red-600 text-lg mb-2">Rejection Reason</h4>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <p>{selectedVendor.rejectionReason}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Activity Information */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-lg mb-2 flex items-center">
                    <FaChartBar className="mr-2" />
                    Vendor Activity
                  </h4>
                  
                  {activityLoading ? (
                    <div className="flex justify-center items-center h-32">
                      <div className="loading-spinner"></div>
                    </div>
                  ) : vendorActivity ? (
                    <div className="space-y-4">
                      {/* Activity Stats */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {vendorActivity.stats.totalProducts}
                          </div>
                          <div className="text-sm text-gray-600">Products</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {vendorActivity.stats.totalOrders}
                          </div>
                          <div className="text-sm text-gray-600">Orders</div>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            ₹{Number(vendorActivity?.stats?.totalEarnings ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div className="text-sm text-gray-600">Earnings</div>
                        </div>
                      </div>

                      {/* Recent Products */}
                      {vendorActivity?.products?.length > 0 && (
                        <div>
                          <h5 className="font-semibold mb-2">Recent Products</h5>
                          <div className="bg-gray-50 p-4 rounded-lg max-h-32 overflow-y-auto">
                            {vendorActivity.products.slice(0, 5).map((product) => (
                              <div key={product._id} className="flex justify-between items-center py-1">
                                <span className="text-sm">{product.name}</span>
                                <span className="badge badge-sm">{product.approvalStatus}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recent Orders */}
                      {vendorActivity?.orders?.length > 0 && (
                        <div>
                          <h5 className="font-semibold mb-2">Recent Orders</h5>
                          <div className="bg-gray-50 p-4 rounded-lg max-h-32 overflow-y-auto">
                            {vendorActivity.orders.slice(0, 5).map((order) => (
                              <div key={order._id} className="flex justify-between items-center py-1">
                                <span className="text-sm">Order #{order._id.slice(-6)}</span>
                                <span className="text-sm font-medium">${order.totalAmount}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
                      No activity data available
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="modal-action flex justify-between items-center mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="btn"
              >
                Close
              </button>
              <div className="flex space-x-2">
                {selectedVendor.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        handleStatusUpdate(selectedVendor._id, 'approved');
                        setShowModal(false);
                      }}
                      className="btn btn-success"
                    >
                      <FaCheck className="mr-2" />
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Enter rejection reason:');
                        if (reason) {
                          handleStatusUpdate(selectedVendor._id, 'rejected', reason);
                          setShowModal(false);
                        }
                      }}
                      className="btn btn-error"
                    >
                      <FaTimes className="mr-2" />
                      Reject
                    </button>
                  </>
                )}
                
                {selectedVendor.status === 'approved' && (
                  <button
                    onClick={() => {
                      handleStatusUpdate(selectedVendor._id, 'suspended');
                      setShowModal(false);
                    }}
                    className="btn btn-warning"
                  >
                    Suspend
                  </button>
                )}
                
                {selectedVendor.status === 'suspended' && (
                  <button
                    onClick={() => {
                      handleStatusUpdate(selectedVendor._id, 'approved');
                      setShowModal(false);
                    }}
                    className="btn btn-success"
                  >
                    Activate
                  </button>
                )}
                
                {selectedVendor.status !== 'suspended' && (
                  <button
                    onClick={() => {
                      setDeactivatingVendor(selectedVendor);
                      setShowDeactivateModal(true);
                      setShowModal(false);
                    }}
                    className="btn btn-error"
                  >
                    <FaTrash className="mr-2" />
                    Deactivate Vendor
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation Modal */}
      <CustomModal
        open={showDeactivateModal}
        onClose={() => {
          setShowDeactivateModal(false);
          setDeactivatingVendor(null);
        }}
        title="Confirm Vendor Deactivation"
      >
        {deactivatingVendor && (
          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="font-semibold text-red-800 mb-2">Warning</h4>
              <p className="text-red-700">
                You are about to deactivate the vendor account for <strong>{deactivatingVendor.businessName}</strong>.
              </p>
              <p className="text-red-700 mt-2">
                This action will:
              </p>
              <ul className="list-disc list-inside text-red-700 mt-1 ml-4">
                <li>Suspend the vendor's account</li>
                <li>Hide their products from the marketplace</li>
                <li>Prevent them from processing new orders</li>
                <li>Send a notification to the vendor</li>
              </ul>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h5 className="font-semibold mb-2">Vendor Activity Summary</h5>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Products:</span> {vendorActivity?.stats.totalProducts || 0}
                </div>
                <div>
                  <span className="font-medium">Orders:</span> {vendorActivity?.stats.totalOrders || 0}
                </div>
                <div>
                  <span className="font-medium">Earnings:</span> ${vendorActivity?.stats.totalEarnings?.toFixed(2) || '0.00'}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowDeactivateModal(false);
                  setDeactivatingVendor(null);
                }}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDeactivateVendor(deactivatingVendor._id);
                  setShowDeactivateModal(false);
                  setDeactivatingVendor(null);
                }}
                className="btn btn-error"
              >
                <FaTrash className="mr-2" />
                Confirm Deactivation
              </button>
            </div>
          </div>
        )}
      </CustomModal>

      {/* All Vendor Details Modal */}
      <CustomModal open={showAllDetailsModal} onClose={() => setShowAllDetailsModal(false)} center>
        <div className="max-h-[80vh] overflow-y-auto p-4">
          <h2 className="text-2xl font-bold mb-4">All Vendor Details</h2>
          <table className="table w-full text-xs">
            <thead>
              <tr>
                <th>Business Name</th>
                <th>Owner</th>
                <th>Email</th>
                <th>Status</th>
                <th>Categories</th>
                <th>Products</th>
                <th>Orders</th>
                <th>Earnings</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map(vendor => {
                const activity = vendorActivities[vendor._id];
                return (
                  <tr key={vendor._id}>
                    <td>{vendor.businessName}</td>
                    <td>{vendor.user?.name}</td>
                    <td>{vendor.user?.email}</td>
                    <td>
                      <span className={`badge ${vendor.status === 'approved' ? 'badge-success' : vendor.status === 'pending' ? 'badge-warning' : 'badge-error'}`}>{vendor.status}</span>
                    </td>
                    <td>{(vendor.categories || []).join(', ')}</td>
                    <td>{activity ? activity.stats.totalProducts : '-'}</td>
                    <td>{activity ? activity.stats.totalOrders : '-'}</td>
                    <td>
                      {activity 
                        ? `₹${Number(activity?.stats?.totalEarnings ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
                        : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="flex justify-end mt-4">
            <button className="btn" onClick={() => setShowAllDetailsModal(false)}>Close</button>
          </div>
        </div>
      </CustomModal>
    </div>
  );
};

export default VendorManagement; 