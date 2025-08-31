import React, { useState, useEffect } from 'react';
import { FaCheck, FaTimes, FaEye, FaClock, FaUser, FaStore } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const ProductApproval = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchPendingProducts();
  }, [currentPage, statusFilter]);

  const fetchPendingProducts = async () => {
    try {
      const response = await api.get('/admin/products/pending', {
        params: {
          page: currentPage,
          limit: 10,
          status: statusFilter
        }
      });
      setProducts(response.data.products);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      toast.error('Failed to fetch pending products');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (productId) => {
    try {
      await api.post(`/admin/products/${productId}/approve`);
      toast.success('Product approved successfully');
      fetchPendingProducts();
    } catch (error) {
      toast.error('Failed to approve product');
    }
  };

  const handleReject = async (productId) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      await api.post(`/admin/products/${productId}/reject`, {
        rejectionReason: rejectionReason.trim()
      });
      toast.success('Product rejected successfully');
      setRejectionReason('');
      setSelectedProduct(null);
      fetchPendingProducts();
    } catch (error) {
      toast.error('Failed to reject product');
    }
  };

  const openRejectModal = (product) => {
    setSelectedProduct(product);
    setRejectionReason('');
  };

  const closeRejectModal = () => {
    setSelectedProduct(null);
    setRejectionReason('');
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'badge-warning',
      approved: 'badge-success',
      rejected: 'badge-error'
    };

    return (
      <span className={`badge ${statusClasses[status] || 'badge-neutral'}`}>
        {status}
      </span>
    );
  };

  const getModeBadge = (mode) => {
    return mode === 'auction' ? 'badge-warning' : 'badge-info';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <h2 className="text-2xl font-bold text-gray-600 mt-4">Loading products...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Product Approval
        </h1>
        <p className="text-gray-600">
          Review and approve/reject vendor products
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {products.filter(p => p.approvalStatus === 'pending').length}
          </div>
          <div className="text-sm text-gray-600">Pending Review</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-2xl font-bold text-green-600">
            {products.filter(p => p.approvalStatus === 'approved').length}
          </div>
          <div className="text-sm text-gray-600">Approved Today</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-2xl font-bold text-red-600">
            {products.filter(p => p.approvalStatus === 'rejected').length}
          </div>
          <div className="text-sm text-gray-600">Rejected Today</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {products.length}
          </div>
          <div className="text-sm text-gray-600">Total Products</div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select select-bordered"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Product</th>
                <th>Vendor</th>
                <th>Price</th>
                <th>Mode</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length > 0 ? (
                products.map((product) => (
                  <tr key={product._id}>
                    <td>
                      <div className="flex items-center space-x-3">
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-500">
                            {product.description.substring(0, 50)}...
                          </div>
                          <div className="text-xs text-gray-400">
                            Category: {product.category}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center space-x-2">
                        <FaStore className="text-gray-400" />
                        <span className="text-sm">{product.seller?.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="font-medium">{formatPrice(product.price)}</div>
                      {product.mode === 'auction' && (
                        <div className="text-sm text-gray-500">
                          Starting: {formatPrice(product.auction?.startingBid)}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${getModeBadge(product.mode)}`}>
                        {product.mode === 'auction' ? 'Auction' : 'Buy Now'}
                      </span>
                    </td>
                    <td>
                      {getStatusBadge(product.approvalStatus)}
                    </td>
                    <td>
                      <div className="text-sm text-gray-600">
                        {new Date(product.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(product.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => window.open(`/product/${product._id}`, '_blank')}
                          className="btn btn-ghost btn-sm"
                          title="View Product"
                        >
                          <FaEye />
                        </button>
                        
                        {product.approvalStatus === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(product._id)}
                              className="btn btn-success btn-sm"
                              title="Approve Product"
                            >
                              <FaCheck />
                            </button>
                            <button
                              onClick={() => openRejectModal(product)}
                              className="btn btn-error btn-sm"
                              title="Reject Product"
                            >
                              <FaTimes />
                            </button>
                          </>
                        )}
                        
                        {product.approvalStatus === 'rejected' && product.rejectionReason && (
                          <div className="text-xs text-red-600 max-w-xs">
                            Reason: {product.rejectionReason}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-8">
                    <div className="text-gray-500">
                      <FaClock className="mx-auto text-4xl mb-4" />
                      <p className="text-lg mb-2">No products found</p>
                      <p>All products have been reviewed</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-6 border-t">
            <div className="flex justify-center">
              <div className="join">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="join-item btn"
                >
                  Previous
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
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="join-item btn"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {selectedProduct && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">
              Reject Product: {selectedProduct.name}
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="textarea textarea-bordered w-full"
                rows="4"
                placeholder="Please provide a reason for rejecting this product..."
                required
              />
            </div>
            
            <div className="modal-action">
              <button
                onClick={closeRejectModal}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(selectedProduct._id)}
                className="btn btn-error"
                disabled={!rejectionReason.trim()}
              >
                Reject Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductApproval; 