import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaGavel, FaTrophy, FaUsers, FaDollarSign, FaClock, FaEye, FaHistory, FaUser, FaCalendar, FaTag, FaArrowLeft, FaCrown, FaBolt } from 'react-icons/fa';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { useSocket } from '../../contexts/SocketContext';

const AuctionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { socket } = useSocket();

  useEffect(() => {
    fetchAuctionDetails();
    
    // Subscribe to real-time updates
    if (socket) {
      socket.on('bid-update', handleBidUpdate);
      socket.on('auction-ended', handleAuctionEnded);
      
      return () => {
        socket.off('bid-update', handleBidUpdate);
        socket.off('auction-ended', handleAuctionEnded);
      };
    }
  }, [id, socket]);

  const fetchAuctionDetails = async () => {
    try {
      const [auctionRes, bidsRes] = await Promise.all([
        api.get(`/admin/auctions/${id}`),
        api.get(`/admin/auctions/${id}/bids`)
      ]);
      
      setAuction(auctionRes.data);
      setBids(bidsRes.data);
    } catch (error) {
      console.error('Error fetching auction details:', error);
      toast.error('Failed to fetch auction details');
    } finally {
      setLoading(false);
    }
  };

  const handleBidUpdate = (data) => {
    if (data.productId === id) {
      setAuction(prev => ({
        ...prev,
        auction: { ...prev.auction, currentBid: data.currentBid }
      }));
      fetchAuctionDetails(); // Refresh bids
    }
  };

  const handleAuctionEnded = (data) => {
    if (data.productId === id) {
      toast.success('Auction has ended!');
      fetchAuctionDetails();
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatTimeRemaining = (endTime) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="badge badge-success">Active</span>;
      case 'ended':
        return <span className="badge badge-error">Ended</span>;
      case 'pending':
        return <span className="badge badge-warning">Pending</span>;
      default:
        return <span className="badge badge-neutral">{status}</span>;
    }
  };

  const handleEndAuction = async () => {
    if (!window.confirm('Are you sure you want to end this auction? This action cannot be undone.')) {
      return;
    }

    try {
      await api.post(`/admin/auctions/${id}/end`);
      toast.success('Auction ended successfully');
      fetchAuctionDetails();
    } catch (error) {
      console.error('Error ending auction:', error);
      toast.error('Failed to end auction');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-600 mb-2">Auction Not Found</h2>
          <button onClick={() => navigate('/admin/auctions/active')} className="btn btn-primary">
            Back to Auctions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100">
      {/* Admin Navigation Sidebar */}
      <div className="drawer lg:drawer-open">
        <input id="admin-drawer" type="checkbox" className="drawer-toggle" />
        <div className="drawer-content flex flex-col">
          {/* Top Navigation Bar */}
          <div className="w-full navbar bg-base-300 lg:hidden">
            <div className="flex-none lg:hidden">
              <label htmlFor="admin-drawer" className="btn btn-square btn-ghost">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-6 h-6 stroke-current">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
              </label>
            </div>
            <div className="flex-1 px-2 mx-2">Admin Panel</div>
          </div>

          {/* Main Content */}
          <div className="container mx-auto p-6">
            {/* Header */}
            <div className="mb-8">
              <button 
                onClick={() => navigate('/admin/auctions/active')}
                className="btn btn-ghost mb-4"
              >
                <FaArrowLeft className="mr-2" />
                Back to Auctions
              </button>
              
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                    <FaGavel className="mr-3 text-primary" />
                    {auction.name}
                  </h1>
                  <p className="text-gray-600">{auction.description}</p>
                </div>
                <div className="text-right">
                  {getStatusBadge(auction.auction.status)}
                  {auction.auction.status === 'active' && (
                    <button 
                      onClick={handleEndAuction}
                      className="btn btn-error btn-sm ml-2"
                    >
                      End Auction
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Product Info */}
              <div className="lg:col-span-2">
                <div className="card bg-white shadow-xl">
                  <figure className="px-6 pt-6">
                    <img
                      src={auction.images[0]}
                      alt={auction.name}
                      className="w-full h-96 object-cover rounded-lg"
                    />
                  </figure>
                  
                  <div className="card-body">
                    <h2 className="card-title text-2xl mb-4">{auction.name}</h2>
                    <p className="text-gray-600 mb-6">{auction.description}</p>
                    
                    {/* Product Details */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="flex items-center">
                        <FaTag className="mr-2 text-primary" />
                        <span className="font-semibold">Category:</span>
                        <span className="ml-2">{auction.category}</span>
                      </div>
                      <div className="flex items-center">
                        <FaUser className="mr-2 text-primary" />
                        <span className="font-semibold">Vendor:</span>
                        <span className="ml-2">{auction.seller?.name || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center">
                        <FaCalendar className="mr-2 text-primary" />
                        <span className="font-semibold">Start Date:</span>
                        <span className="ml-2">{formatTime(auction.auction.startTime)}</span>
                      </div>
                      <div className="flex items-center">
                        <FaCalendar className="mr-2 text-primary" />
                        <span className="font-semibold">End Date:</span>
                        <span className="ml-2">{formatTime(auction.auction.endTime)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Auction Stats */}
              <div className="space-y-6">
                {/* Current Bid Card */}
                <div className="card bg-gradient-to-r from-primary to-primary-focus text-primary-content">
                  <div className="card-body text-center">
                    <FaTrophy className="text-4xl mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">Current Highest Bid</h3>
                    <p className="text-3xl font-bold">${auction.auction.currentBid}</p>
                    {auction.auction.winner && (
                      <p className="text-sm opacity-80 mt-2">
                        Winner: {auction.auction.winner.name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Auction Stats */}
                <div className="card bg-white shadow-lg">
                  <div className="card-body">
                    <h3 className="card-title text-lg mb-4">Auction Statistics</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Starting Bid:</span>
                        <span className="font-semibold">${auction.auction.startingBid}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Bids:</span>
                        <span className="font-semibold">{auction.auction.totalBids}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Unique Bidders:</span>
                        <span className="font-semibold">{new Set(bids.map(bid => bid.bidder._id)).size}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Time Remaining:</span>
                        <span className={`font-semibold ${
                          formatTimeRemaining(auction.auction.endTime) === 'Ended' 
                            ? 'text-error' 
                            : 'text-success'
                        }`}>
                          {formatTimeRemaining(auction.auction.endTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="card bg-white shadow-lg">
                  <div className="card-body">
                    <h3 className="card-title text-lg mb-4">Quick Actions</h3>
                    <div className="space-y-2">
                      <button 
                        onClick={() => setActiveTab('bids')}
                        className="btn btn-outline btn-sm w-full"
                      >
                        <FaHistory className="mr-2" />
                        View All Bids
                      </button>
                      <button 
                        onClick={() => setActiveTab('participants')}
                        className="btn btn-outline btn-sm w-full"
                      >
                        <FaUsers className="mr-2" />
                        View Participants
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="mt-8">
              <div className="tabs tabs-boxed">
                <button
                  className={`tab ${activeTab === 'overview' ? 'tab-active' : ''}`}
                  onClick={() => setActiveTab('overview')}
                >
                  <FaEye className="mr-2" />
                  Overview
                </button>
                <button
                  className={`tab ${activeTab === 'bids' ? 'tab-active' : ''}`}
                  onClick={() => setActiveTab('bids')}
                >
                  <FaHistory className="mr-2" />
                  Bid History ({bids.length})
                </button>
                <button
                  className={`tab ${activeTab === 'participants' ? 'tab-active' : ''}`}
                  onClick={() => setActiveTab('participants')}
                >
                  <FaUsers className="mr-2" />
                  Participants
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
              {/* Bid History Tab */}
              {activeTab === 'bids' && (
                <div className="card bg-white shadow-lg">
                  <div className="card-body">
                    <h3 className="card-title text-lg mb-4">Bid History</h3>
                    {bids.length === 0 ? (
                      <div className="text-center py-8">
                        <FaBolt className="text-4xl text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No bids placed yet</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="table w-full">
                          <thead>
                            <tr>
                              <th>Bidder</th>
                              <th>Amount</th>
                              <th>Time</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bids.map((bid, index) => (
                              <tr key={bid._id} className={index === 0 ? 'bg-success bg-opacity-10' : ''}>
                                <td>
                                  <div className="flex items-center">
                                    {index === 0 && <FaCrown className="text-warning mr-2" />}
                                    {bid.bidder.name}
                                  </div>
                                </td>
                                <td className="font-bold">${bid.amount}</td>
                                <td>{formatTime(bid.placedAt)}</td>
                                <td>
                                  {index === 0 ? (
                                    <span className="badge badge-success">Winning</span>
                                  ) : (
                                    <span className="badge badge-neutral">Outbid</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Participants Tab */}
              {activeTab === 'participants' && (
                <div className="card bg-white shadow-lg">
                  <div className="card-body">
                    <h3 className="card-title text-lg mb-4">Auction Participants</h3>
                    {bids.length === 0 ? (
                      <div className="text-center py-8">
                        <FaUsers className="text-4xl text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No participants yet</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from(new Set(bids.map(bid => bid.bidder._id))).map(bidderId => {
                          const bidder = bids.find(bid => bid.bidder._id === bidderId).bidder;
                          const bidderBids = bids.filter(bid => bid.bidder._id === bidderId);
                          const highestBid = Math.max(...bidderBids.map(bid => bid.amount));
                          const isWinning = bidderBids.some(bid => bid.amount === auction.auction.currentBid);
                          
                          return (
                            <div key={bidderId} className="card bg-base-100 shadow">
                              <div className="card-body">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-semibold">{bidder.name}</h4>
                                  {isWinning && <FaCrown className="text-warning" />}
                                </div>
                                <p className="text-sm text-gray-600">{bidder.email}</p>
                                <div className="mt-2 space-y-1">
                                  <p className="text-sm">
                                    <span className="text-gray-600">Bids:</span> {bidderBids.length}
                                  </p>
                                  <p className="text-sm">
                                    <span className="text-gray-600">Highest:</span> ${highestBid}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="drawer-side">
          <label htmlFor="admin-drawer" className="drawer-overlay"></label>
          <ul className="menu p-4 w-80 min-h-full bg-base-200 text-base-content">
            <li className="menu-title">
              <span>Admin Panel</span>
            </li>
            <li><Link to="/admin">Dashboard</Link></li>
            <li><Link to="/admin/orders">Orders</Link></li>
            <li><Link to="/admin/products">Products</Link></li>
            <li><Link to="/admin/users">Users</Link></li>
            <li><Link to="/admin/vendors">Vendors</Link></li>
            <li><Link to="/admin/auctions/active">Active Auctions</Link></li>
            <li><Link to="/admin/auctions">Auction Scheduler</Link></li>
            <li><Link to="/admin/coupons">Coupons</Link></li>
            <li><Link to="/admin/accounts">Accounts</Link></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AuctionDetail; 