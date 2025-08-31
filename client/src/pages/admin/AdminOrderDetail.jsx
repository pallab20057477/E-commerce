import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaArrowLeft, FaBox, FaShippingFast, FaMapMarkerAlt, FaHome, FaUser, FaEnvelope, FaPhone, FaMapPin, FaCreditCard, FaTruck, FaEdit } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../../utils/axios';

const AdminOrderDetail = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingStatus, setEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    fetchOrderDetail();
  }, [orderId]);

  const fetchOrderDetail = async () => {
    try {
      console.log('Fetching admin order detail...');
      const response = await api.get(`/admin/orders/${orderId}`);
      console.log('Admin order detail response:', response.data);
      setOrder(response.data);
    } catch (error) {
      console.error('Error fetching order detail:', error);
      toast.error('Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async () => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      toast.success('Order status updated successfully');
      setEditingStatus(false);
      fetchOrderDetail();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
          <Link to="/admin/orders" className="btn btn-primary">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link to="/admin/orders" className="btn btn-outline btn-sm mb-4">
          <FaArrowLeft className="mr-2" />
          Back to Orders
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Order #{order._id.slice(-8)}
        </h1>
        <p className="text-gray-600">
          Placed on {formatDate(order.createdAt)}
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Order Summary</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setEditingStatus(!editingStatus)}
                  className="btn btn-sm btn-outline"
                >
                  <FaEdit className="mr-2" />
                  Edit Status
                </button>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-600">Order Total</p>
                <p className="text-2xl font-bold text-primary">{formatPrice(order.totalAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Items</p>
                <p className="text-2xl font-bold">{order.products.length}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span>Order Status:</span>
                {getStatusBadge(order.status)}
              </div>
              <div className="flex items-center space-x-2">
                <span>Payment Status:</span>
                {getPaymentStatusBadge(order.paymentStatus)}
              </div>
            </div>

            {editingStatus && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Update Order Status</h3>
                <div className="flex items-center space-x-2">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="select select-bordered"
                  >
                    <option value="">Select Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="refunded">Refunded</option>
                  </select>
                  <button
                    onClick={updateOrderStatus}
                    disabled={!newStatus}
                    className="btn btn-primary btn-sm"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => setEditingStatus(false)}
                    className="btn btn-outline btn-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.products.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <img
                        src={item.product?.images?.[0] || '/placeholder-image.jpg'}
                        alt={item.product?.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div>
                        <h3 className="font-semibold text-lg">{item.product?.name}</h3>
                        <p className="text-gray-600">Quantity: {item.quantity}</p>
                        <p className="text-gray-600">Price: {formatPrice(item.price)}</p>
                        {item.vendor && (
                          <p className="text-gray-600">Vendor: {item.vendor.businessName || 'N/A'}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold">
                        {formatPrice(item.price * item.quantity)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <FaUser className="mr-2" />
              Customer Information
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium">{order.user?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 flex items-center">
                  <FaEnvelope className="mr-1" />
                  Email
                </p>
                <p className="font-medium">{order.user?.email || 'N/A'}</p>
              </div>
              {order.user?.phone && (
                <div>
                  <p className="text-sm text-gray-600 flex items-center">
                    <FaPhone className="mr-1" />
                    Phone
                  </p>
                  <p className="font-medium">{order.user.phone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Information */}
          {order.shippingAddress && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <FaTruck className="mr-2" />
                Shipping Information
              </h2>
              <div className="space-y-2">
                <p className="font-medium">{order.shippingAddress.street}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                <p>{order.shippingAddress.country}</p>
                {order.shippingMethod && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm text-gray-600">Shipping Method</p>
                    <p className="font-medium">{order.shippingMethod}</p>
                  </div>
                )}
                {order.trackingNumber && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm text-gray-600">Tracking Number</p>
                    <p className="font-medium">{order.trackingNumber}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment Information */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <FaCreditCard className="mr-2" />
              Payment Information
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatPrice(order.totalAmount - (order.shippingCost || 0) - (order.taxAmount || 0))}</span>
              </div>
              {order.shippingCost && (
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span>{formatPrice(order.shippingCost)}</span>
                </div>
              )}
              {order.taxAmount && (
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>{formatPrice(order.taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>{formatPrice(order.totalAmount)}</span>
              </div>
              <div className="mt-3 pt-3 border-t">
                <p className="text-sm text-gray-600">Payment Method</p>
                <p className="font-medium">{order.paymentMethod || 'Not specified'}</p>
                {order.paymentId && (
                  <p className="text-sm text-gray-600">Payment ID: {order.paymentId}</p>
                )}
              </div>
            </div>
          </div>

          {/* Order Timeline */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Order Timeline</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-success rounded-full mr-3"></div>
                <div>
                  <p className="font-medium">Order Placed</p>
                  <p className="text-sm text-gray-600">
                    {formatDate(order.createdAt)}
                  </p>
                </div>
              </div>
              {order.status !== 'pending' && (
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-primary rounded-full mr-3"></div>
                  <div>
                    <p className="font-medium">Order Confirmed</p>
                    <p className="text-sm text-gray-600">Order has been confirmed</p>
                  </div>
                </div>
              )}
              {['processing', 'shipped', 'delivered'].includes(order.status) && (
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-secondary rounded-full mr-3"></div>
                  <div>
                    <p className="font-medium">Processing</p>
                    <p className="text-sm text-gray-600">Items being prepared</p>
                  </div>
                </div>
              )}
              {['shipped', 'delivered'].includes(order.status) && (
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-secondary rounded-full mr-3"></div>
                  <div>
                    <p className="font-medium">Shipped</p>
                    <p className="text-sm text-gray-600">On the way to customer</p>
                  </div>
                </div>
              )}
              {order.status === 'delivered' && (
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-success rounded-full mr-3"></div>
                  <div>
                    <p className="font-medium">Delivered</p>
                    <p className="text-sm text-gray-600">Order completed</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetail; 