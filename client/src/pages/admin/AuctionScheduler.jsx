import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FaClock, FaPlay, FaStop, FaCalendar, FaGavel, FaDollarSign } from 'react-icons/fa';
import toast from 'react-hot-toast';

const AuctionScheduler = () => {
  const [products, setProducts] = useState([]);
  const [scheduledAuctions, setScheduledAuctions] = useState([]);
  const [activeAuctions, setActiveAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    startTime: '',
    endTime: '',
    startingBid: '',
    minBidIncrement: 1
  });
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, scheduledRes, activeRes, revenueRes] = await Promise.all([
        api.get('/products?mode=auction&limit=50'),
        api.get('/products/auctions/scheduled'),
        api.get('/products/auctions/active'),
        api.get('/admin/dashboard/overview'),
      ]);

      setProducts(productsRes.data.products);
      setScheduledAuctions(scheduledRes.data);
      setActiveAuctions(Array.isArray(activeRes.data) ? activeRes.data : []);
      // Use revenue from overview if available
      setTotalRevenue(revenueRes.data?.revenue?.totalRevenue ?? 0);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch auction data');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleAuction = async (e) => {
    e.preventDefault();
    
    if (!selectedProduct) return;

    try {
      await api.post('/products/auctions/schedule', {
        productId: selectedProduct._id,
        ...scheduleData
      });

      toast.success('Auction scheduled successfully!');
      setShowScheduleModal(false);
      setSelectedProduct(null);
      setScheduleData({
        startTime: '',
        endTime: '',
        startingBid: '',
        minBidIncrement: 1
      });
      fetchData();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to schedule auction';
      toast.error(message);
    }
  };

  const handleStartAuction = async (productId) => {
    try {
      await api.post(`/products/auctions/${productId}/start`);
      toast.success('Auction started successfully!');
      fetchData();
    } catch (error) {
      toast.error('Failed to start auction');
    }
  };

  const handleEndAuction = async (productId) => {
    try {
      await api.post(`/products/auctions/${productId}/end`);
      toast.success('Auction ended successfully!');
      fetchData();
    } catch (error) {
      toast.error('Failed to end auction');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAuctionStatus = (auction) => {
    const now = new Date();
    const startTime = new Date(auction.auction.startTime);
    const endTime = new Date(auction.auction.endTime);

    if (auction.auction.status === 'cancelled') return 'cancelled';
    if (auction.auction.status === 'ended') return 'ended';
    if (startTime > now) return 'scheduled';
    if (endTime > now) return 'active';
    return 'ended';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Auction Scheduler
        </h1>
        <p className="text-gray-600">
          Schedule and manage auctions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <FaDollarSign className="text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${totalRevenue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <FaGavel className="text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Auctions</p>
              <p className="text-2xl font-bold text-gray-900">
                {products.filter(p => p.mode === 'auction').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <FaClock className="text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Scheduled</p>
              <p className="text-2xl font-bold text-gray-900">
                {scheduledAuctions.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <FaPlay className="text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {activeAuctions.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <FaStop className="text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ended</p>
              <p className="text-2xl font-bold text-gray-900">
                {products.filter(p => p.mode === 'auction' && getAuctionStatus(p) === 'ended').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule New Auction */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Schedule New Auction</h2>
        
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Product</th>
                <th>Current Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.filter(p => p.mode === 'auction').map((product) => (
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
                          {formatPrice(product.price)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${
                      getAuctionStatus(product) === 'active' ? 'badge-success' :
                      getAuctionStatus(product) === 'scheduled' ? 'badge-warning' :
                      getAuctionStatus(product) === 'ended' ? 'badge-error' :
                      'badge-neutral'
                    }`}>
                      {getAuctionStatus(product)}
                    </span>
                  </td>
                  <td>
                    <div className="flex space-x-2">
                      {getAuctionStatus(product) === 'scheduled' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowScheduleModal(true);
                            }}
                            className="btn btn-outline btn-sm"
                          >
                            Reschedule
                          </button>
                          <button
                            onClick={() => handleStartAuction(product._id)}
                            className="btn btn-success btn-sm"
                          >
                            Start Now
                          </button>
                        </>
                      )}
                      
                      {getAuctionStatus(product) === 'active' && (
                        <button
                          onClick={() => handleEndAuction(product._id)}
                          className="btn btn-error btn-sm"
                        >
                          End Now
                        </button>
                      )}
                      
                      {getAuctionStatus(product) === 'not-auction' && (
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowScheduleModal(true);
                          }}
                          className="btn btn-primary btn-sm"
                        >
                          Schedule
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scheduled Auctions */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Scheduled Auctions</h2>
        
        {scheduledAuctions.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No scheduled auctions</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scheduledAuctions.map((auction) => (
              <div key={auction._id} className="border rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <img
                    src={auction.images[0]}
                    alt={auction.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div>
                    <h3 className="font-medium">{auction.name}</h3>
                    <p className="text-sm text-gray-500">
                      Starting: {formatPrice(auction.auction.startingBid)}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <p><strong>Start:</strong> {formatDate(auction.auction.startTime)}</p>
                  <p><strong>End:</strong> {formatDate(auction.auction.endTime)}</p>
                </div>
                
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => handleStartAuction(auction._id)}
                    className="btn btn-success btn-sm"
                  >
                    Start Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Auctions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Active Auctions</h2>
        
        {activeAuctions.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No active auctions</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeAuctions.map((auction) => (
              <div key={auction._id} className="border rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <img
                    src={auction.images[0]}
                    alt={auction.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div>
                    <h3 className="font-medium">{auction.name}</h3>
                    <p className="text-sm text-gray-500">
                      Current: {formatPrice(auction.auction.currentBid)}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <p><strong>Ends:</strong> {formatDate(auction.auction.endTime)}</p>
                  <p><strong>Bids:</strong> {auction.auction.totalBids}</p>
                </div>
                
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => handleEndAuction(auction._id)}
                    className="btn btn-error btn-sm"
                  >
                    End Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && selectedProduct && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">
              Schedule Auction - {selectedProduct.name}
            </h3>
            
            <form onSubmit={handleScheduleAuction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time *
                </label>
                <input
                  type="datetime-local"
                  value={scheduleData.startTime}
                  onChange={(e) => setScheduleData(prev => ({ ...prev, startTime: e.target.value }))}
                  required
                  className="input input-bordered w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time *
                </label>
                <input
                  type="datetime-local"
                  value={scheduleData.endTime}
                  onChange={(e) => setScheduleData(prev => ({ ...prev, endTime: e.target.value }))}
                  required
                  className="input input-bordered w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Starting Bid *
                </label>
                <input
                  type="number"
                  value={scheduleData.startingBid}
                  onChange={(e) => setScheduleData(prev => ({ ...prev, startingBid: e.target.value }))}
                  required
                  min="0"
                  step="0.01"
                  className="input input-bordered w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Bid Increment
                </label>
                <input
                  type="number"
                  value={scheduleData.minBidIncrement}
                  onChange={(e) => setScheduleData(prev => ({ ...prev, minBidIncrement: e.target.value }))}
                  min="1"
                  className="input input-bordered w-full"
                />
              </div>
              
              <div className="modal-action">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="btn"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Schedule Auction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuctionScheduler; 