import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { FaArrowLeft, FaBox, FaShippingFast, FaMapMarkerAlt, FaHome, FaCreditCard, FaTruck } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../utils/axios';

const OrderDetail = () => {
  const { orderId } = useParams();
  const { subscribeOrderStatus, subscribeDeliveryUpdate } = useSocket();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrderDetailMemoized = React.useCallback(async () => {
    if (!orderId || orderId === 'undefined') {
      const errorMsg = 'No order ID found in URL';
      console.error(errorMsg);
      toast.error('Invalid order ID');
      setOrder({
        error: true,
        message: errorMsg,
        status: 'error',
        code: 'MISSING_ORDER_ID'
      });
      setLoading(false);
      return;
    }
    
    console.log('Fetching order with ID:', orderId);
    
    console.log('Order ID from URL:', orderId);
    setLoading(true);
    
    // Retry mechanism with exponential backoff
    const retryFetch = async (attempt = 1) => {
      try {
        console.log(`Fetching order detail... Attempt ${attempt}`);
        console.log('Making API call to:', `/orders/${orderId}`);
        const response = await api.get(`/orders/${orderId}`);
        console.log('Order detail response status:', response.status);
        console.log('Order detail response data:', response.data);
        
        if (!response) {
          throw new Error('No response received from server');
        }
        
        if (!response.data) {
          throw new Error('No data in response from server');
        }
        
        // Check for error response from server
        if (response.data.error) {
          throw new Error(response.data.message || 'Server returned an error');
        }
        
        // Handle case where order is not found (404)
        if (response.status === 404) {
          throw new Error('Order not found');
        }
        
        // The actual order data might be nested in a data property or at the root
        const orderData = response.data.order || response.data;
        
        if (!orderData) {
          throw new Error('No order data in response');
        }
        
        // Validate required fields in the response
        if (!orderData._id) {
          console.error('Invalid order data structure - missing _id:', orderData);
          throw new Error('Invalid order data: missing order ID');
        }
        
        if (!orderData.products || !Array.isArray(orderData.products)) {
          console.error('Invalid order data structure - missing products array:', orderData);
          throw new Error('Invalid order data: missing products');
        }
        
        setOrder(orderData);
        return orderData;
      } catch (error) {
        console.error(`Error fetching order detail (attempt ${attempt}):`, error);
        
        let errorMessage = 'Failed to fetch order details';
        let statusCode = error.response?.status;
        
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error('Error response data:', error.response.data);
          console.error('Error status:', error.response.status);
          console.error('Error headers:', error.response.headers);
          
          errorMessage = error.response.data?.message || 
                        error.response.data?.error || 
                        error.message || 
                        `Server responded with status ${statusCode}`;
        } else if (error.request) {
          // The request was made but no response was received
          console.error('No response received:', error.request);
          errorMessage = 'No response from server. Please check your connection.';
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error('Error setting up request:', error.message);
          errorMessage = `Request setup error: ${error.message}`;
        }
        
        // Only show error after 3 attempts or if it's a 404
        if (attempt >= 3 || statusCode === 404) {
          toast.error(errorMessage);
          // Set a minimal order object to prevent infinite loading
          setOrder({
            _id: orderId,
            error: true,
            message: errorMessage,
            status: 'error',
            statusCode: statusCode || 'unknown'
          });
          return null;
        }
        
        // Wait before retry (exponential backoff with jitter)
        const delay = Math.min(Math.pow(2, attempt) * 1000, 10000); // Max 10s delay
        const jitter = Math.random() * 1000; // Add some jitter
        await new Promise(resolve => setTimeout(resolve, delay + jitter));
        return retryFetch(attempt + 1);
      } finally {
        setLoading(false);
      }
    };
    
    await retryFetch();
  }, [orderId]);

  useEffect(() => {
    fetchOrderDetailMemoized();
  }, [fetchOrderDetailMemoized]);

  useEffect(() => {
    if (!orderId) return;
    
    // Subscribe to real-time order status and delivery updates for this order
    const unsubOrder = subscribeOrderStatus((data) => {
      if (data.orderId === orderId) {
        fetchOrderDetailMemoized(); // Refetch full order details
      }
    });
    
    const unsubDelivery = subscribeDeliveryUpdate((data) => {
      if (data.orderId === orderId) {
        fetchOrderDetailMemoized(); // Refetch full order details
      }
    });
    
    return () => {
      unsubOrder();
      unsubDelivery();
    };
  }, [orderId, subscribeOrderStatus, subscribeDeliveryUpdate, fetchOrderDetailMemoized]);

  // Format date to a readable string
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      processing: 'badge-info',
      shipped: 'badge-primary',
      'out for delivery': 'badge-secondary',
      'nearest area': 'badge-accent',
      delivered: 'badge-success',
      cancelled: 'badge-error'
    };

    return (
      <span className={`badge ${statusClasses[status] || 'badge-neutral'}`}>
        {status}
      </span>
    );
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <FaBox className="text-warning" />,
      processing: <FaBox className="text-info" />,
      shipped: <FaShippingFast className="text-primary" />,
      'out for delivery': <FaTruck className="text-secondary" />,
      'nearest area': <FaMapMarkerAlt className="text-accent" />,
      delivered: <FaHome className="text-success" />,
      cancelled: <FaBox className="text-error" />
    };
    return icons[status] || <FaBox />;
  };

  // formatDate function is already defined above

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <div className="loading loading-spinner loading-lg text-primary"></div>
        <p className="text-lg text-gray-600">Loading order details...</p>
      </div>
    );
  }

  if (!order || order.error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {order?.error ? 'Error Loading Order' : 'Order Not Found'}
          </h1>
          <p className="text-gray-600 mb-6">
            {order?.message || 'We couldn\'t find the order you\'re looking for.'}
          </p>
          <div className="flex justify-center space-x-4">
            <Link to="/orders" className="btn btn-primary">
              View My Orders
            </Link>
            <Link to="/" className="btn btn-outline">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link to="/orders" className="btn btn-outline btn-sm mb-4">
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
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
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
                {getStatusIcon(order.status)}
                <span className={`badge ${getStatusBadge(order.status)}`}>
                  {order.status}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Payment Status</p>
                <p className={`badge ${order.paymentStatus === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                  {order.paymentStatus}
                </p>
              </div>
            </div>
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
                        {item.status && (
                          <div className="mt-2">
                            <span className={`badge ${getStatusBadge(item.status)}`}>
                              {item.status}
                            </span>
                          </div>
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
                    <p className="font-medium">Processing Started</p>
                    <p className="text-sm text-gray-600">Items being prepared</p>
                  </div>
                </div>
              )}
              {['shipped', 'out for delivery', 'nearest area', 'delivered'].includes(order.status) && (
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-secondary rounded-full mr-3"></div>
                  <div>
                    <p className="font-medium">Shipped</p>
                    <p className="text-sm text-gray-600">On the way to you</p>
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail; 