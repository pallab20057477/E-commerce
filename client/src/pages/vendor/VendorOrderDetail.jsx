import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import { io } from 'socket.io-client';
import { 
  FaArrowLeft, 
  FaBox, 
  FaShippingFast, 
  FaMapMarkerAlt, 
  FaHome, 
  FaUser, 
  FaMapPin, 
  FaCheckCircle, 
  FaInfoCircle 
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const VendorOrderDetail = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  const fetchOrderDetail = useCallback(async () => {
    if (!orderId) return;
    
    try {
      setLoading(true);
      const response = await api.get(`/vendors/orders/${orderId}`);
      setOrder(response.data);
    } catch (error) {
      console.error('Error fetching order detail:', error);
      toast.error('Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrderDetail();
    
    // Set up socket listener for real-time updates
    const handleStatusUpdate = (data) => {
      if (data.orderId === orderId) {
        // If the main order status was updated
        if (data.status) {
          setOrder(prev => ({
            ...prev,
            status: data.status,
            // Update all products status if order is delivered/cancelled
            products: prev.products.map(item => ({
              ...item,
              status: ['delivered', 'cancelled'].includes(data.status) ? data.status : item.status
            }))
          }));
        }
        // If an item status was updated
        else if (data.itemId) {
          setOrder(prev => ({
            ...prev,
            products: prev.products.map(item => 
              item._id === data.itemId ? { ...item, status: data.status } : item
            )
          }));
        }
      }
    };
    
    const socket = io();
    socket.on('order:status', handleStatusUpdate);
    socket.on('order:item-status', handleStatusUpdate);
    
    return () => {
      socket.off('order:status', handleStatusUpdate);
      socket.off('order:item-status', handleStatusUpdate);
    };
  }, [fetchOrderDetail, orderId]);

  const updateItemStatus = useCallback(async (itemId, newStatus) => {
    try {
      setUpdatingStatus(itemId);
      await api.patch(`/vendors/orders/${orderId}/item/${itemId}/status`, { 
        status: newStatus 
      });
      toast.success('Item status updated successfully');
      await fetchOrderDetail();
    } catch (error) {
      console.error('Error updating item status:', error);
      toast.error(error.response?.data?.message || 'Failed to update item status');
    } finally {
      setUpdatingStatus(null);
    }
  }, [orderId, fetchOrderDetail]);

  const formatPrice = useCallback((price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }, []);

  const getStatusBadge = useCallback((status, isMainOrder = false) => {
    const statusClasses = {
      pending: 'badge-warning',
      processing: 'badge-info',
      shipped: 'badge-primary',
      'out-for-delivery': 'badge-secondary',
      'nearest-area': 'badge-accent',
      delivered: 'badge-success',
      cancelled: 'badge-error'
    };

    // If this is the main order status and it's delivered/cancelled, 
    // ensure all items show the same status
    const displayStatus = isMainOrder && ['delivered', 'cancelled'].includes(status) ? 
      status : status;

    return (
      <span className={`badge ${statusClasses[displayStatus] || 'badge-neutral'}`}>
        {displayStatus}
      </span>
    );
  }, []);

  const getStatusIcon = useCallback((status) => {
    const icons = {
      pending: <FaBox className="text-warning" />,
      processing: <FaBox className="text-info" />,
      shipped: <FaShippingFast className="text-primary" />,
      'out-for-delivery': <FaShippingFast className="text-secondary" />,
      'nearest-area': <FaMapMarkerAlt className="text-accent" />,
      delivered: <FaHome className="text-success" />,
      cancelled: <FaBox className="text-error" />
    };
    return icons[status] || <FaBox />;
  }, []);

  const getNextStatus = useCallback((currentStatus) => {
    const statusFlow = {
      pending: 'processing',
      processing: 'shipped',
      shipped: 'out-for-delivery',
      'out-for-delivery': 'nearest-area',
      'nearest-area': 'delivered'
    };
    return statusFlow[currentStatus];
  }, []);

  const getVendorProducts = useCallback(() => {
    if (!order?.products) return [];
    
    // Ensure product status matches the order status if the order is delivered/cancelled
    return order.products.map(item => {
      // If order is delivered/cancelled, but product status is not updated yet
      if (['delivered', 'cancelled'].includes(order.status) && item.status !== order.status) {
        return { ...item, status: order.status };
      }
      return item;
    });
  }, [order]);

  const getVendorTotal = useCallback(() => {
    const vendorProducts = getVendorProducts();
    return vendorProducts.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [getVendorProducts]);

  const renderLoading = () => (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-center items-center h-64">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    </div>
  );

  const renderNotFound = () => (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
        <Link to="/vendor/orders" className="btn btn-primary">
          Back to Orders
        </Link>
      </div>
    </div>
  );

  if (loading) return renderLoading();
  if (!order) return renderNotFound();

  const vendorProducts = getVendorProducts();
  const vendorTotal = getVendorTotal();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link to="/vendor/orders" className="btn btn-outline btn-sm mb-4">
          <FaArrowLeft className="mr-2" />
          Back to Orders
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Order #{order._id.slice(-8)}
        </h1>
        <p className="text-gray-600">
          Placed on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
        </p>
        
        <div className="alert alert-info mt-4">
          <FaInfoCircle />
          <span>You can only manage products that belong to your store in this order.</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-600">Your Products Total</p>
                <p className="text-2xl font-bold text-primary">{formatPrice(vendorTotal)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Your Items</p>
                <p className="text-2xl font-bold">{vendorProducts.length}</p>
              </div>
            </div>
            {order.totalAmount !== vendorTotal && (
              <div className="alert alert-warning">
                <FaInfoCircle />
                <span>
                  This order contains products from other vendors. You can only manage your own products.
                </span>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <FaBox className="mr-2" />
              Your Products ({vendorProducts.length})
            </h2>
            <div className="space-y-4">
              {vendorProducts.length > 0 ? (
                vendorProducts.map((item) => {
                  const nextStatus = getNextStatus(item.status);
                  return (
                    <div key={item._id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-4">
                          <img
                            src={item.product?.images?.[0] || '/placeholder-image.jpg'}
                            alt={item.product?.name}
                            className="w-20 h-20 object-cover rounded-lg"
                            onError={(e) => {
                              e.target.src = '/placeholder-image.jpg';
                            }}
                          />
                          <div>
                            <h3 className="font-semibold text-lg">{item.product?.name}</h3>
                            <p className="text-gray-600">Quantity: {item.quantity}</p>
                            <p className="text-gray-600">Price: {formatPrice(item.price)}</p>
                            <p className="text-gray-600">SKU: {item.product?.sku || 'N/A'}</p>
                            {item.product?.description && (
                              <p className="text-gray-600 mt-2">{item.product.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="mb-2">
                            {getStatusBadge(item.status)}
                          </div>
                          <div className="text-xl font-bold mb-2">
                            {formatPrice(item.price * item.quantity)}
                          </div>
                          {nextStatus && (
                            <button
                              onClick={() => updateItemStatus(item._id, nextStatus)}
                              disabled={updatingStatus === item._id}
                              className="btn btn-sm btn-primary"
                            >
                              {updatingStatus === item._id ? (
                                <>
                                  <div className="loading loading-spinner loading-xs"></div>
                                  Updating...
                                </>
                              ) : (
                                <>
                                  {getStatusIcon(nextStatus)} Mark as {nextStatus}
                                </>
                              )}
                            </button>
                          )}
                          {item.status === 'delivered' && (
                            <div className="text-success text-sm flex items-center">
                              <FaCheckCircle className="mr-1" />
                              Delivered
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FaBox className="text-4xl mx-auto mb-4" />
                  <p>No products from your store in this order</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <FaUser className="mr-2" />
              Customer Information
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-semibold">{order.user?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-semibold">{order.user?.email}</p>
              </div>
              {order.user?.phone && (
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-semibold">{order.user.phone}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <FaMapPin className="mr-2" />
              Shipping Address
            </h2>
            <div className="space-y-2">
              <p className="font-semibold">{order.shippingAddress?.name}</p>
              <p>{order.shippingAddress?.street}</p>
              <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zipCode}</p>
              <p>{order.shippingAddress?.country}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Order Details</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Order Status:</span>
                {getStatusBadge(order.status)}
              </div>
              <div className="flex justify-between">
                <span>Payment Status:</span>
                <span className={`badge ${order.paymentStatus === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                  {order.paymentStatus}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Shipping Method:</span>
                <span className="capitalize">{order.shippingMethod}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <span className="capitalize">{order.paymentMethod}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorOrderDetail;
