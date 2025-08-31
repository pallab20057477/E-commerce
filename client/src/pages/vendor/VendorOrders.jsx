import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FaEye, FaSearch, FaFilter, FaTruck, FaCheckCircle, FaEdit } from 'react-icons/fa';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const VendorOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [currentPage, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      });

      const response = await api.get(`/vendors/orders?${params}`);
      
      if (response.data.success) {
        setOrders(response.data.orders);
        setTotalPages(response.data.totalPages);
        setTotalOrders(response.data.total);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchOrders();
  };

  const updateOrderItemStatus = async (orderId, itemId, newStatus) => {
    try {
      setUpdatingStatus(`${orderId}-${itemId}`);
      const response = await api.patch(`/vendors/orders/${orderId}/item/${itemId}/status`, {
        status: newStatus
      });
      
      if (response.data.success) {
        toast.success('Order status updated successfully');
        fetchOrders(); // Refresh orders
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error(error.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': 'badge-warning',
      'processing': 'badge-info',
      'shipped': 'badge-primary',
      'out-for-delivery': 'badge-secondary',
      'nearest-area': 'badge-accent',
      'delivered': 'badge-success',
      'cancelled': 'badge-error'
    };
    return `badge ${statusConfig[status] || 'badge-neutral'}`;
  };

  const getStatusOptions = (currentStatus) => {
    const statusFlow = {
      'pending': ['processing'],
      'processing': ['shipped'],
      'shipped': ['out-for-delivery'],
      'out-for-delivery': ['nearest-area'],
      'nearest-area': ['delivered']
    };
    return statusFlow[currentStatus] || [];
  };

  const getVendorProductsInOrder = (order) => {
    // Filter products that belong to this vendor
    return order.products.filter(item => 
      item.product && 
      (item.product.vendor === user.vendorId || 
       (item.product.vendor && item.product.vendor._id === user.vendorId))
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 lg:px-12">
        <div className="flex justify-center items-center h-64">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 lg:px-12 flex flex-col gap-8">
      
      <div className="bg-base-100 shadow-xl rounded-2xl p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold">Your Orders</h2>
            <p className="text-base-content/70">
              Manage orders containing your products only
            </p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="join w-full">
              <input
                type="text"
                placeholder="Search orders by ID or customer name..."
                className="input input-bordered join-item flex-1"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit" className="btn btn-primary join-item">
                <FaSearch />
              </button>
            </div>
          </form>
          
          <select
            className="select select-bordered"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="out-for-delivery">Out for Delivery</option>
            <option value="nearest-area">Nearest Area</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Your Products</th>
                <th>Total (Your Items)</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length > 0 ? (
                orders.map((order) => {
                  const vendorProducts = getVendorProductsInOrder(order);
                  const vendorTotal = vendorProducts.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                  
                  return (
                    <tr key={order._id} className="hover:bg-base-200">
                      <td>
                        <Link to={`/vendor/orders/${order._id}`} className="font-mono text-sm hover:underline">
                          #{order._id.slice(-6)}
                        </Link>
                      </td>
                      <td>
                        <div>
                          <div className="font-semibold">{order.user?.name}</div>
                          <div className="text-sm text-base-content/60">{order.user?.email}</div>
                        </div>
                      </td>
                      <td>
                        <Link to={`/vendor/orders/${order._id}`} className="text-sm hover:underline">
                          {vendorProducts.length} item{vendorProducts.length !== 1 ? 's' : ''}
                          <div className="text-xs text-base-content/50 mt-1">
                            {vendorProducts.map(item => item.product?.name).join(', ')}
                          </div>
                        </Link>
                      </td>
                      <td>${vendorTotal.toFixed(2)}</td>
                      <td>
                        <span className={getStatusBadge(order.status)}>
                          {order.status}
                        </span>
                      </td>
                      <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="flex space-x-2">
                          <Link
                            to={`/vendor/orders/${order._id}`}
                            className="btn btn-xs btn-primary"
                            title="View Details"
                          >
                            <FaEye />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-8">
                    <div className="flex flex-col items-center space-y-4">
                      <FaTruck className="text-4xl text-base-content/30" />
                      <p className="text-base-content/60">No orders found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
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

        {/* Summary */}
        <div className="mt-6 text-center text-sm text-base-content/60">
          Showing {orders.length} of {totalOrders} orders containing your products
        </div>
      </div>
    </div>
  );
};

export default VendorOrders; 