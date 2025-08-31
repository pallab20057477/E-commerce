import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaEye, FaSearch } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../../utils/axios';
import { useSocket } from '../../contexts/SocketContext';

const AdminOrders = () => {
  const { emitPaymentStatus, socket } = useSocket();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');

  const fetchOrders = async () => {
    try {
      console.log('Fetching admin orders...');
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10
      });
      
      if (statusFilter) {
        params.append('status', statusFilter);
      }

      if (paymentFilter) {
        params.append('paymentStatus', paymentFilter);
      }

      const response = await api.get(`/admin/orders?${params}`);
      console.log('Admin orders response:', response.data);
      setOrders(response.data.orders);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentPage, statusFilter, paymentFilter, fetchOrders]);

  useEffect(() => {
    if (!socket) return;
    const handleNewOrder = (order) => {
      toast.success('New order placed!');
      fetchOrders();
    };
    const handleOrderUpdate = (order) => {
      toast.success('Order updated!');
      fetchOrders();
    };
    const handleAdminNotification = (notification) => {
      toast(notification.message);
      // Optionally update admin notification list here
    };
    socket.on('order:new', handleNewOrder);
    socket.on('order:update', handleOrderUpdate);
    socket.on('notification:new', handleAdminNotification);
    return () => {
      socket.off('order:new', handleNewOrder);
      socket.off('order:update', handleOrderUpdate);
      socket.off('notification:new', handleAdminNotification);
    };
  }, [socket, fetchOrders]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      toast.success('Order status updated successfully');
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      
      // Log detailed error information
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error Response Status:', error.response.status);
        console.error('Error Response Data:', error.response.data);
        console.error('Error Response Headers:', error.response.headers);
        
        // Show user-friendly error message
        const errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
        toast.error(errorMessage);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Error Request:', error.request);
        toast.error('No response from server. Please check your connection.');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error Message:', error.message);
        toast.error(`Request setup error: ${error.message}`);
      }
    }
  };

  const updatePaymentStatus = async (orderId, newPaymentStatus) => {
    try {
      console.log('Attempting to update payment status:', {
        orderId,
        newPaymentStatus,
        url: `/orders/${orderId}/payment-status`,
        requestData: { paymentStatus: newPaymentStatus }
      });

      const response = await api.put(`/orders/${orderId}/payment-status`, { paymentStatus: newPaymentStatus });
      
      console.log('Payment status update successful:', response.data);
      toast.success('Payment status updated successfully');
      
      // Emit real-time update
      const order = orders.find(o => o._id === orderId);
      if (order && order.user) {
        emitPaymentStatus(orderId, newPaymentStatus, order.user._id);
      }
      
      fetchOrders();
    } catch (error) {
      console.error('Error updating payment status:', error);
      
      // Log detailed error information
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error Response Status:', error.response.status);
        console.error('Error Response Data:', error.response.data);
        console.error('Error Response Headers:', error.response.headers);
        
        // Show user-friendly error message
        const errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
        toast.error(errorMessage);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Error Request:', error.request);
        toast.error('No response from server. Please check your connection.');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error Message:', error.message);
        toast.error(`Request setup error: ${error.message}`);
      }
    }
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
      confirmed: 'badge-info',
      processing: 'badge-info',
      shipped: 'badge-primary',
      delivered: 'badge-success',
      cancelled: 'badge-error',
      refunded: 'badge-error'
    };

    return (
      <span className={`badge ${statusClasses[status] || 'badge-neutral'}`}>
        {status}
      </span>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const statusClasses = {
      pending: 'badge-warning',
      completed: 'badge-success',
      failed: 'badge-error',
      refunded: 'badge-error'
    };

    return (
      <span className={`badge ${statusClasses[status] || 'badge-neutral'}`}>
        {status}
      </span>
    );
  };

  const getStatusActions = (order) => {
    const actions = [];

    // Order Status Actions
    if (order.status === 'pending') {
      actions.push(
        <button
          key="confirm"
          onClick={() => updateOrderStatus(order._id, 'confirmed')}
          className="btn btn-sm btn-outline btn-info"
        >
          Confirm Order
        </button>
      );
    }

    if (order.status === 'confirmed') {
      actions.push(
        <button
          key="process"
          onClick={() => updateOrderStatus(order._id, 'processing')}
          className="btn btn-sm btn-outline btn-info"
        >
          Start Processing
        </button>
      );
    }

    if (order.status === 'processing') {
      actions.push(
        <button
          key="ship"
          onClick={() => updateOrderStatus(order._id, 'shipped')}
          className="btn btn-sm btn-outline btn-primary"
        >
          Mark Shipped
        </button>
      );
    }

    if (order.status === 'shipped') {
      actions.push(
        <button
          key="deliver"
          onClick={() => updateOrderStatus(order._id, 'delivered')}
          className="btn btn-sm btn-outline btn-success"
        >
          Mark Delivered
        </button>
      );
    }

    // Payment Status Actions
    if (order.paymentStatus === 'pending') {
      actions.push(
        <button
          key="confirm-payment"
          onClick={() => updatePaymentStatus(order._id, 'completed')}
          className="btn btn-sm btn-outline btn-success"
          title="Confirm Payment"
        >
          Confirm Payment
        </button>
      );
    }

    if (order.paymentStatus === 'completed') {
      actions.push(
        <button
          key="refund-payment"
          onClick={() => updatePaymentStatus(order._id, 'refunded')}
          className="btn btn-sm btn-outline btn-error"
          title="Refund Payment"
        >
          Refund
        </button>
      );
    }

    return actions;
  };

  const filteredOrders = orders.filter(order =>
    order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order._id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Admin Orders Management
        </h1>
        <p className="text-gray-600">
          Manage and track all orders across the platform
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Orders
            </label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by customer name or order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-bordered w-full pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select select-bordered w-full"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Status
            </label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="select select-bordered w-full"
            >
              <option value="">All Payment Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setPaymentFilter('');
              }}
              className="btn btn-outline w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Products</th>
                <th>Total</th>
                <th>Order Status</th>
                <th>Payment Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <div className="font-mono text-sm">
                        #{order._id.slice(-8)}
                      </div>
                    </td>
                    <td>
                      <div>
                        <div className="font-medium">{order.user?.name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{order.user?.email || 'N/A'}</div>
                      </div>
                    </td>
                    <td>
                      <div className="max-w-xs">
                        {order.products.slice(0, 2).map((item, index) => (
                          <div key={index} className="flex items-center space-x-2 mb-1">
                            <img
                              src={item.product?.images?.[0] || '/placeholder-image.jpg'}
                              alt={item.product?.name || 'Product'}
                              className="w-8 h-8 object-cover rounded"
                            />
                            <span className="text-sm truncate">
                              {item.product?.name || 'Product'} (x{item.quantity})
                            </span>
                          </div>
                        ))}
                        {order.products.length > 2 && (
                          <div className="text-sm text-gray-500">
                            +{order.products.length - 2} more items
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="font-medium">{formatPrice(order.totalAmount)}</div>
                    </td>
                    <td>
                      {getStatusBadge(order.status)}
                    </td>
                    <td>
                      {getPaymentStatusBadge(order.paymentStatus)}
                    </td>
                    <td>
                      <div className="text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <div className="flex space-x-2">
                        <Link
                          to={`/admin/orders/${order._id}`}
                          className="btn btn-ghost btn-sm"
                          title="View Order Details"
                        >
                          <FaEye />
                        </Link>
                        {getStatusActions(order)}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-8">
                    <div className="text-gray-500">
                      <p className="text-lg mb-2">No orders found</p>
                      <p>Orders will appear here once customers place orders</p>
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

      {/* Stats Summary */}
      <div className="grid md:grid-cols-6 gap-6 mt-8">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-2xl font-bold text-warning">
            {orders.filter(o => o.status === 'pending').length}
          </div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-2xl font-bold text-info">
            {orders.filter(o => o.status === 'processing').length}
          </div>
          <div className="text-sm text-gray-600">Processing</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-2xl font-bold text-primary">
            {orders.filter(o => o.status === 'shipped').length}
          </div>
          <div className="text-sm text-gray-600">Shipped</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-2xl font-bold text-success">
            {orders.filter(o => o.status === 'delivered').length}
          </div>
          <div className="text-sm text-gray-600">Delivered</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-2xl font-bold text-error">
            {orders.filter(o => o.status === 'cancelled').length}
          </div>
          <div className="text-sm text-gray-600">Cancelled</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-2xl font-bold text-secondary">
            {orders.length}
          </div>
          <div className="text-sm text-gray-600">Total Orders</div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrders; 