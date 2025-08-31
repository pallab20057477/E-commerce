import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/axios';
import { toast } from 'react-hot-toast';
import { 
  FaExclamationTriangle, 
  FaSearch, 
  FaFilter, 
  FaEye, 
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaFlag,
  FaClock,
  FaChartBar,
  FaDownload,
  FaUser,
  FaShoppingCart,
  FaBox,
  FaGavel,
  FaBan,
  FaMoneyBillWave,
  FaExchangeAlt
} from 'react-icons/fa';

const DisputeManagement = () => {
  const [disputes, setDisputes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: ''
  });
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [resolutionData, setResolutionData] = useState({
    resolution: '',
    resolutionAmount: '',
    resolutionNotes: ''
  });

  useEffect(() => {
    fetchDisputes();
    fetchStats();
  }, [currentPage, filters]);

  const fetchDisputes = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...filters
      });

      const response = await api.get(`/disputes/admin/all?${params}`);
      setDisputes(response.data.disputes);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      toast.error('Failed to fetch disputes');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/disputes/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dispute stats:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleStatusUpdate = async (disputeId, status) => {
    try {
      await api.put(`/disputes/${disputeId}/status`, { status });
      toast.success('Dispute status updated successfully');
      fetchDisputes();
    } catch (error) {
      toast.error('Failed to update dispute status');
    }
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    
    if (!resolutionData.resolution) {
      toast.error('Please select a resolution');
      return;
    }

    try {
      await api.put(`/disputes/${selectedDispute._id}/resolve`, resolutionData);
      toast.success('Dispute resolved successfully');
      setShowResolutionModal(false);
      setSelectedDispute(null);
      setResolutionData({ resolution: '', resolutionAmount: '', resolutionNotes: '' });
      fetchDisputes();
      fetchStats();
    } catch (error) {
      toast.error('Failed to resolve dispute');
    }
  };

  const handleEscalate = async (disputeId, reason) => {
    try {
      await api.put(`/disputes/${disputeId}/escalate`, { escalationReason: reason });
      toast.success('Dispute escalated successfully');
      fetchDisputes();
    } catch (error) {
      toast.error('Failed to escalate dispute');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return <FaExclamationTriangle className="text-warning" />;
      case 'under_review':
        return <FaHourglassHalf className="text-info" />;
      case 'resolved':
        return <FaCheckCircle className="text-success" />;
      case 'closed':
        return <FaTimesCircle className="text-error" />;
      case 'escalated':
        return <FaFlag className="text-error" />;
      default:
        return <FaClock className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'badge-warning';
      case 'under_review':
        return 'badge-info';
      case 'resolved':
        return 'badge-success';
      case 'closed':
        return 'badge-error';
      case 'escalated':
        return 'badge-error';
      default:
        return 'badge-ghost';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'badge-error';
      case 'high':
        return 'badge-warning';
      case 'medium':
        return 'badge-info';
      case 'low':
        return 'badge-success';
      default:
        return 'badge-ghost';
    }
  };

  const getCategoryLabel = (category) => {
    const labels = {
      delivery_issue: 'Delivery Issue',
      fake_bidding: 'Fake Bidding',
      item_not_as_described: 'Item Not As Described',
      payment_issue: 'Payment Issue',
      refund_request: 'Refund Request',
      seller_misconduct: 'Seller Misconduct',
      buyer_misconduct: 'Buyer Misconduct',
      technical_issue: 'Technical Issue',
      other: 'Other'
    };
    return labels[category] || category;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dispute Management</h1>
          <p className="text-gray-600">Manage and resolve user disputes</p>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="stat bg-base-100 shadow rounded-lg">
            <div className="stat-figure text-primary">
              <FaExclamationTriangle className="text-3xl" />
            </div>
            <div className="stat-title">Total Disputes</div>
            <div className="stat-value text-primary">{stats.totalDisputes}</div>
          </div>
          
          <div className="stat bg-base-100 shadow rounded-lg">
            <div className="stat-figure text-warning">
              <FaClock className="text-3xl" />
            </div>
            <div className="stat-title">Open Disputes</div>
            <div className="stat-value text-warning">{stats.openDisputes}</div>
          </div>
          
          <div className="stat bg-base-100 shadow rounded-lg">
            <div className="stat-figure text-success">
              <FaCheckCircle className="text-3xl" />
            </div>
            <div className="stat-title">Resolved</div>
            <div className="stat-value text-success">{stats.resolvedDisputes}</div>
          </div>
          
          <div className="stat bg-base-100 shadow rounded-lg">
            <div className="stat-figure text-error">
              <FaFlag className="text-3xl" />
            </div>
            <div className="stat-title">Overdue</div>
            <div className="stat-value text-error">{stats.overdueDisputes}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-base-200 p-6 rounded-lg mb-8">
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="select select-bordered w-full"
            >
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="under_review">Under Review</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
              <option value="escalated">Escalated</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="select select-bordered w-full"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="select select-bordered w-full"
            >
              <option value="">All Categories</option>
              <option value="delivery_issue">Delivery Issue</option>
              <option value="fake_bidding">Fake Bidding</option>
              <option value="item_not_as_described">Item Not As Described</option>
              <option value="payment_issue">Payment Issue</option>
              <option value="refund_request">Refund Request</option>
              <option value="seller_misconduct">Seller Misconduct</option>
              <option value="buyer_misconduct">Buyer Misconduct</option>
              <option value="technical_issue">Technical Issue</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: '', priority: '', category: '' })}
              className="btn btn-outline w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Disputes Table */}
      <div className="bg-base-100 shadow-xl rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Parties</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {disputes.map((dispute) => (
                <tr key={dispute._id}>
                  <td>
                    <div className="font-mono text-sm">{dispute.disputeId}</div>
                  </td>
                  <td>
                    <div className="max-w-xs">
                      <div className="font-medium">{dispute.title}</div>
                      <div className="text-sm text-gray-500 truncate">
                        {dispute.description}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="text-sm">
                      <div className="flex items-center gap-1 mb-1">
                        <FaUser className="text-success" />
                        <span className="font-medium">{dispute.complainant.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FaUser className="text-error" />
                        <span className="font-medium">{dispute.respondent.name}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-outline">
                      {getCategoryLabel(dispute.category)}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${getPriorityColor(dispute.priority)}`}>
                      {dispute.priority.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(dispute.status)}
                      <span className={`badge ${getStatusColor(dispute.status)}`}>
                        {dispute.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="text-sm">
                      {formatDate(dispute.createdAt)}
                    </div>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <Link
                        to={`/disputes/${dispute._id}`}
                        className="btn btn-ghost btn-sm"
                        title="View Details"
                      >
                        <FaEye />
                      </Link>
                      
                      {dispute.status !== 'resolved' && dispute.status !== 'closed' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedDispute(dispute);
                              setShowResolutionModal(true);
                            }}
                            className="btn btn-success btn-sm"
                            title="Resolve"
                          >
                            <FaGavel />
                          </button>
                          
                          <button
                            onClick={() => handleEscalate(dispute._id, 'Manual escalation')}
                            className="btn btn-warning btn-sm"
                            title="Escalate"
                          >
                            <FaFlag />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <div className="join">
            <button
              className="join-item btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              «
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`join-item btn ${currentPage === page ? 'btn-active' : ''}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
            <button
              className="join-item btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              »
            </button>
          </div>
        </div>
      )}

      {/* Resolution Modal */}
      {showResolutionModal && selectedDispute && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">Resolve Dispute</h3>
            
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Dispute: {selectedDispute.title}</h4>
              <p className="text-sm text-gray-600">ID: {selectedDispute.disputeId}</p>
            </div>

            <form onSubmit={handleResolve} className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text font-semibold">Resolution Type *</span>
                </label>
                <select
                  value={resolutionData.resolution}
                  onChange={(e) => setResolutionData(prev => ({ ...prev, resolution: e.target.value }))}
                  className="select select-bordered w-full"
                  required
                >
                  <option value="">Select resolution</option>
                  <option value="refund_full">Full Refund</option>
                  <option value="refund_partial">Partial Refund</option>
                  <option value="replacement">Replacement</option>
                  <option value="compensation">Compensation</option>
                  <option value="warning_issued">Warning Issued</option>
                  <option value="account_suspended">Account Suspended</option>
                  <option value="dispute_dismissed">Dispute Dismissed</option>
                  <option value="mediation_required">Mediation Required</option>
                </select>
              </div>

              {(resolutionData.resolution === 'refund_partial' || resolutionData.resolution === 'compensation') && (
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">Amount ($)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={resolutionData.resolutionAmount}
                    onChange={(e) => setResolutionData(prev => ({ ...prev, resolutionAmount: e.target.value }))}
                    className="input input-bordered w-full"
                    placeholder="Enter amount"
                  />
                </div>
              )}

              <div>
                <label className="label">
                  <span className="label-text font-semibold">Resolution Notes</span>
                </label>
                <textarea
                  value={resolutionData.resolutionNotes}
                  onChange={(e) => setResolutionData(prev => ({ ...prev, resolutionNotes: e.target.value }))}
                  className="textarea textarea-bordered w-full h-24"
                  placeholder="Provide detailed explanation of the resolution..."
                />
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  onClick={() => {
                    setShowResolutionModal(false);
                    setSelectedDispute(null);
                    setResolutionData({ resolution: '', resolutionAmount: '', resolutionNotes: '' });
                  }}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <FaGavel className="mr-2" />
                  Resolve Dispute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisputeManagement; 