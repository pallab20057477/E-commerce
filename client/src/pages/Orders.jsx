import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaEye, FaTruck, FaCheck, FaTimes, FaClock, FaBox, FaShippingFast, FaMapMarkerAlt, FaHome, FaStar, FaShoppingBag, FaReceipt, FaFilter, FaSearch, FaChevronRight } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../utils/axios';
import { useSocket } from '../contexts/SocketContext';
import ReviewForm from '../components/ReviewForm';

const Orders = () => {
  const { user } = useAuth();
  const { subscribeOrderStatus, subscribePaymentStatus } = useSocket();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [reviewedProducts, setReviewedProducts] = useState(new Set());

  useEffect(() => {
    fetchOrders();
    fetchReviewedProducts();
  }, []);

  // Subscribe to real-time order status updates
  useEffect(() => {
    const unsubOrder = subscribeOrderStatus((data) => {
      toast(`Order status updated to ${data.status}`);
      
      // Directly update the order in state for instant UI update
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order._id === data.orderId
            ? { ...order, status: data.status }
            : order
        )
      );
    });

    const unsubPayment = subscribePaymentStatus((data) => {
      toast(`Payment status updated to ${data.paymentStatus}`);
      
      // Directly update the payment status in state for instant UI update
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order._id === data.orderId
            ? { ...order, paymentStatus: data.paymentStatus }
            : order
        )
      );
    });

    return () => {
      unsubOrder();
      unsubPayment();
    };
  }, [subscribeOrderStatus, subscribePaymentStatus]);

  const fetchOrders = async () => {
    try {
      console.log('Fetching user orders...');
      const response = await api.get('/orders/user');
      console.log('Orders response:', response.data);
      setOrders(response.data.orders || response.data || []); // support both array and {orders: array}
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to update order status (can be called from socket events or directly)
  const updateOrderStatus = (orderId, status) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order._id === orderId
          ? { ...order, status: status }
          : order
      )
    );
  };

  // Helper function to update payment status
  const updatePaymentStatus = (orderId, paymentStatus) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order._id === orderId
          ? { ...order, paymentStatus: paymentStatus }
          : order
      )
    );
  };

  const fetchReviewedProducts = async () => {
    try {
      const response = await api.get('/reviews/user/my-reviews');
      const reviewedIds = new Set(response.data.reviews.map(review => review.product));
      setReviewedProducts(reviewedIds);
    } catch (error) {
      console.error('Error fetching reviewed products:', error);
    }
  };

  const handleLeaveReview = (product) => {
    setSelectedProduct(product);
    setShowReviewModal(true);
  };

  const handleReviewSubmitted = (review) => {
    setShowReviewModal(false);
    setSelectedProduct(null);
    // Add the product to reviewed set
    setReviewedProducts(prev => new Set([...prev, review.product]));
    toast.success('Review submitted successfully!');
  };

  const canReviewProduct = (productId) => {
    return !reviewedProducts.has(productId);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'badge-warning';
      case 'processing':
        return 'badge-info';
      case 'shipped':
        return 'badge-primary';
      case 'out for delivery':
        return 'badge-secondary';
      case 'nearest area':
        return 'badge-accent';
      case 'delivered':
        return 'badge-success';
      case 'cancelled':
        return 'badge-error';
      default:
        return 'badge-ghost';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FaClock className="text-yellow-500" />;
      case 'processing':
        return <FaBox className="text-blue-500" />;
      case 'shipped':
        return <FaShippingFast className="text-blue-600" />;
      case 'out for delivery':
        return <FaTruck className="text-secondary" />;
      case 'nearest area':
        return <FaMapMarkerAlt className="text-accent" />;
      case 'delivered':
        return <FaHome className="text-green-500" />;
      case 'cancelled':
        return <FaTimes className="text-red-500" />;
      default:
        return <FaClock className="text-gray-500" />;
    }
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

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-base-100 to-base-200">
        <div className="text-center bg-white rounded-2xl shadow-xl p-10 max-w-md mx-auto transform transition-all duration-300">
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <div className="loading loading-spinner loading-lg text-primary absolute inset-0"></div>
            <div className="w-12 h-12 bg-primary/10 rounded-full absolute inset-0 m-auto"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Loading Orders</h2>
          <p className="text-gray-500">Please wait while we fetch your order history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center mb-2">
            <FaReceipt className="text-3xl text-primary mr-3" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              My Orders
            </h1>
          </div>
          <p className="text-gray-600 text-lg">Track your purchases and delivery status</p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <div className="stats bg-base-100 shadow">
            <div className="stat place-items-center">
              <div className="stat-title">Total Orders</div>
              <div className="stat-value text-primary">{orders.length}</div>
            </div>
            <div className="stat place-items-center">
              <div className="stat-title">Delivered</div>
              <div className="stat-value text-success">{orders.filter(o => o.status === 'delivered').length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-8">
        <div className="bg-base-100 rounded-xl shadow-md p-4 overflow-x-auto">
          <div className="flex items-center mb-4">
            <FaFilter className="text-primary mr-2" />
            <h3 className="font-semibold">Filter Orders</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline'} btn-sm transition-all duration-300`}
              onClick={() => setFilter('all')}
            >
              All Orders ({orders.length})
            </button>
            <button
              className={`btn ${filter === 'pending' ? 'btn-primary' : 'btn-outline'} btn-sm transition-all duration-300`}
              onClick={() => setFilter('pending')}
            >
              <FaClock className="mr-1" />
              Pending ({orders.filter(o => o.status === 'pending').length})
            </button>
            <button
              className={`btn ${filter === 'processing' ? 'btn-primary' : 'btn-outline'} btn-sm transition-all duration-300`}
              onClick={() => setFilter('processing')}
            >
              <FaBox className="mr-1" />
              Processing ({orders.filter(o => o.status === 'processing').length})
            </button>
            <button
              className={`btn ${filter === 'shipped' ? 'btn-primary' : 'btn-outline'} btn-sm transition-all duration-300`}
              onClick={() => setFilter('shipped')}
            >
              <FaShippingFast className="mr-1" />
              Shipped ({orders.filter(o => o.status === 'shipped').length})
            </button>
            <button
              className={`btn ${filter === 'out for delivery' ? 'btn-primary' : 'btn-outline'} btn-sm transition-all duration-300`}
              onClick={() => setFilter('out for delivery')}
            >
              <FaTruck className="mr-1" />
              Out for Delivery ({orders.filter(o => o.status === 'out for delivery').length})
            </button>
            <button
              className={`btn ${filter === 'nearest area' ? 'btn-primary' : 'btn-outline'} btn-sm transition-all duration-300`}
              onClick={() => setFilter('nearest area')}
            >
              <FaMapMarkerAlt className="mr-1" />
              Nearest Area ({orders.filter(o => o.status === 'nearest area').length})
            </button>
            <button
              className={`btn ${filter === 'delivered' ? 'btn-primary' : 'btn-outline'} btn-sm transition-all duration-300`}
              onClick={() => setFilter('delivered')}
            >
              <FaHome className="mr-1" />
              Delivered ({orders.filter(o => o.status === 'delivered').length})
            </button>
          </div>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="w-24 h-24 bg-base-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaShoppingBag className="text-4xl text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">No orders found</h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            {filter === 'all'
              ? "You haven't placed any orders yet. Start shopping to see your orders here."
              : `We couldn't find any ${filter} orders in your history.`
            }
          </p>
          {filter === 'all' ? (
            <Link
              to="/products"
              className="btn btn-primary btn-lg gap-2 shadow-md hover:shadow-lg transition-all duration-300"
            >
              <FaShoppingBag />
              Discover Products
            </Link>
          ) : (
            <button
              onClick={() => setFilter('all')}
              className="btn btn-outline btn-lg gap-2"
            >
              View All Orders
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {filteredOrders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-xl shadow-lg overflow-hidden border border-base-200 hover:shadow-xl transition-shadow duration-300"
            >
              {/* Order Header */}
              <div className="bg-gradient-to-r from-base-200 to-base-100 p-4 flex flex-col sm:flex-row sm:items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-white p-2 rounded-lg shadow-sm mr-4">
                    <FaReceipt className="text-primary text-xl" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold flex items-center">
                      Order #{order._id.slice(-8)}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Placed on {formatDate(order.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 sm:mt-0 flex items-center">
                  <div className={`px-4 py-2 rounded-full flex items-center ${
                    order.status === 'delivered' ? 'bg-green-100' :
                    order.status === 'shipped' || order.status === 'out for delivery' ? 'bg-blue-100' :
                    order.status === 'processing' ? 'bg-indigo-100' :
                    order.status === 'pending' ? 'bg-yellow-100' :
                    order.status === 'cancelled' ? 'bg-red-100' : 'bg-gray-100'
                  }`}>
                    <span className="mr-2">{getStatusIcon(order.status)}</span>
                    <span className={`font-medium ${
                      order.status === 'delivered' ? 'text-green-700' :
                      order.status === 'shipped' || order.status === 'out for delivery' ? 'text-blue-700' :
                      order.status === 'processing' ? 'text-indigo-700' :
                      order.status === 'pending' ? 'text-yellow-700' :
                      order.status === 'cancelled' ? 'text-red-700' : 'text-gray-700'
                    }`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="p-6">
                <h4 className="font-semibold mb-4 flex items-center text-gray-700">
                  <FaBox className="mr-2 text-primary" />
                  Order Items ({order.products.length})
                </h4>
                <div className="space-y-4">
                  {order.products.map((item, index) => (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row items-start sm:items-center border border-base-200 rounded-lg p-4 hover:bg-base-100 transition-colors duration-200"
                    >
                      <div className="relative group">
                        <img
                          src={item.product?.images?.[0] || '/placeholder-image.jpg'}
                          alt={item.product?.name || 'Product'}
                          className="w-20 h-20 object-cover rounded-lg mr-4 transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 rounded-lg"></div>
                      </div>
                      <div className="flex-1 mt-3 sm:mt-0">
                        <h5 className="font-semibold text-gray-800">{item.product?.name || 'Product'}</h5>
                        <div className="flex items-center mt-1">
                          <span className="bg-base-200 text-xs px-2 py-1 rounded-full text-gray-600">
                            Qty: {item.quantity}
                          </span>
                          <span className="mx-2 text-gray-400">•</span>
                          <span className="text-primary font-medium">{formatPrice(item.price)}</span>
                        </div>
                      </div>
                      <div className="text-right mt-3 sm:mt-0 bg-base-100 px-4 py-2 rounded-lg">
                        <p className="font-bold text-lg">{formatPrice(item.quantity * item.price)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t border-base-200 bg-base-100 p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <div>
                    <div className="flex items-center">
                      <span className="text-gray-600 mr-2">Total:</span>
                      <span className="font-bold text-xl text-primary">{formatPrice(order.totalAmount)}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600 mr-1">Payment:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                          order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          order.paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                        </span>
                      </div>
                      {order.shippingAddress && (
                        <div className="flex items-center">
                          <FaMapMarkerAlt className="text-gray-500 mr-1 text-sm" />
                          <span className="text-sm text-gray-600">
                            {order.shippingAddress.city}, {order.shippingAddress.state}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-4 sm:mt-0">
                    <Link
                      to={`/orders/${order._id}`}
                      className="btn btn-outline btn-sm gap-2 hover:bg-base-200 transition-colors duration-300"
                    >
                      <FaEye />
                      View Details
                      <FaChevronRight className="text-xs" />
                    </Link>
                    {order.status === 'delivered' && order.products.map((item, index) => (
                      <div key={index}>
                        {canReviewProduct(item.product?._id) ? (
                          <button
                            onClick={() => handleLeaveReview(item.product)}
                            className="btn btn-primary btn-sm gap-2 shadow-sm hover:shadow-md transition-all duration-300"
                          >
                            <FaStar />
                            Leave Review
                          </button>
                        ) : (
                          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full flex items-center">
                            <FaCheck className="mr-1 text-xs" />
                            <span className="text-sm font-medium">Reviewed</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl transform transition-all duration-300 scale-100">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6 border-b border-base-200 pb-4">
                <div className="flex items-center">
                  <div className="bg-primary/10 p-2 rounded-full mr-3">
                    <FaStar className="text-primary text-xl" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Review Product</h3>
                </div>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="btn btn-sm btn-circle btn-ghost hover:bg-base-200 transition-colors duration-300"
                >
                  <FaTimes />
                </button>
              </div>
              <div className="mb-6 bg-base-100 p-4 rounded-lg">
                <div className="flex items-center">
                  <img
                    src={selectedProduct.images?.[0] || '/placeholder-image.jpg'}
                    alt={selectedProduct.name}
                    className="w-16 h-16 object-cover rounded-lg mr-4"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-800">{selectedProduct.name}</h4>
                    <p className="text-sm text-gray-600">{selectedProduct.category}</p>
                  </div>
                </div>
              </div>
              <ReviewForm
                productId={selectedProduct._id}
                onReviewSubmitted={handleReviewSubmitted}
                onCancel={() => setShowReviewModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders; 