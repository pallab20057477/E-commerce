import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/axios';
import { toast } from 'react-hot-toast';
import { 
  FaExclamationTriangle, 
  FaPlus, 
  FaSearch, 
  FaFilter, 
  FaEye, 
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaFlag,
  FaComments
} from 'react-icons/fa';

const Disputes = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    category: ''
  });

  useEffect(() => {
    fetchDisputes();
  }, [currentPage, filters]);

  const fetchDisputes = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...filters
      });

      const response = await api.get(`/disputes?${params}`);
      setDisputes(response.data.disputes);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      toast.error('Failed to fetch disputes');
    } finally {
      setLoading(false);
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

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Disputes</h1>
          <p className="text-gray-600">Manage your dispute cases and track their progress</p>
        </div>
        <Link to="/disputes/new" className="btn btn-primary">
          <FaPlus className="mr-2" />
          New Dispute
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-base-200 p-6 rounded-lg mb-8">
        <div className="grid md:grid-cols-3 gap-4">
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
              onClick={() => setFilters({ status: '', category: '' })}
              className="btn btn-outline w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Disputes List */}
      {disputes.length > 0 ? (
        <div className="space-y-6">
          {disputes.map((dispute) => (
            <div key={dispute._id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
              <div className="card-body">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(dispute.status)}
                      <h3 className="card-title text-lg">{dispute.title}</h3>
                      <span className={`badge ${getStatusColor(dispute.status)}`}>
                        {dispute.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-3">
                      <p><strong>Dispute ID:</strong> {dispute.disputeId}</p>
                      <p><strong>Category:</strong> {getCategoryLabel(dispute.category)}</p>
                      <p><strong>Created:</strong> {formatDate(dispute.createdAt)}</p>
                    </div>

                    <p className="text-gray-700 mb-4 line-clamp-2">
                      {dispute.description}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <FaComments />
                        <span>{dispute.messages?.length || 0} messages</span>
                      </div>
                      {dispute.evidence?.length > 0 && (
                        <div className="flex items-center gap-1">
                          <FaFlag />
                          <span>{dispute.evidence.length} evidence files</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Link
                      to={`/disputes/${dispute._id}`}
                      className="btn btn-primary btn-sm"
                    >
                      <FaEye className="mr-1" />
                      View Details
                    </Link>
                  </div>
                </div>

                {/* Related Information */}
                {(dispute.order || dispute.product) && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">Related Information:</h4>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      {dispute.order && (
                        <div>
                          <strong>Order:</strong> {dispute.order.orderNumber}
                          <br />
                          <span className="text-gray-600">
                            Amount: ${dispute.order.totalAmount}
                          </span>
                        </div>
                      )}
                      {dispute.product && (
                        <div>
                          <strong>Product:</strong> {dispute.product.name}
                          <br />
                          <span className="text-gray-600">
                            Price: ${dispute.product.price}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FaExclamationTriangle className="text-6xl text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No disputes found</h3>
          <p className="text-gray-500 mb-6">
            {filters.status || filters.category 
              ? 'Try adjusting your filters or create a new dispute.'
              : 'You haven\'t created any disputes yet.'
            }
          </p>
          <Link to="/disputes/new" className="btn btn-primary">
            <FaPlus className="mr-2" />
            Create New Dispute
          </Link>
        </div>
      )}

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
    </div>
  );
};

export default Disputes; 