import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaGavel, FaClock, FaTrophy, FaUsers, FaDollarSign, FaEye, FaHistory, FaFire, FaPlus } from 'react-icons/fa';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { useSocket } from '../../contexts/SocketContext';

const ActiveAuctions = () => {
  const [auctions, setAuctions] = useState([]);
  const [auctionHistory, setAuctionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const { socket } = useSocket();

  useEffect(() => {
    console.log('ActiveAuctions component mounted');
    fetchAuctions();
    
    // Subscribe to real-time auction updates
    if (socket) {
      socket.on('bid-update', handleBidUpdate);
      socket.on('auction-ended', handleAuctionEnded);
      
      return () => {
        socket.off('bid-update', handleBidUpdate);
        socket.off('auction-ended', handleAuctionEnded);
      };
    }
  }, [socket]);

  const fetchAuctions = async () => {
    console.log('Fetching auctions...');
    try {
      const [activeRes, historyRes] = await Promise.all([
        api.get('/admin/auctions/active'),
        api.get('/admin/auctions/history')
      ]);
      
      console.log('Active auctions response:', activeRes.data);
      console.log('Auction history response:', historyRes.data);
      
      setAuctions(activeRes.data);
      setAuctionHistory(historyRes.data);
    } catch (error) {
      console.error('Error fetching auctions:', error);
      console.error('Error response:', error.response);
      toast.error('Failed to fetch auction data');
    } finally {
      setLoading(false);
    }
  };

  const handleBidUpdate = (data) => {
    setAuctions(prevAuctions => 
      prevAuctions.map(auction => 
        auction._id === data.productId 
          ? { ...auction, auction: { ...auction.auction, currentBid: data.currentBid } }
          : auction
      )
    );
  };

  const handleAuctionEnded = (data) => {
    setAuctions(prevAuctions => 
      prevAuctions.filter(auction => auction._id !== data.productId)
    );
    fetchAuctions(); // Refresh to get updated history
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatTimeRemaining = (auction) => {
    const now = new Date();
    const startTime = new Date(auction.auction?.startTime);
    const endTime = new Date(auction.auction?.endTime);
    const status = auction.computedStatus || auction.auction?.status;
    
    // If auction hasn't started yet (upcoming)
    if (status === 'scheduled' && startTime > now) {
      const diff = startTime - now;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) return `Starts in ${days}d ${hours}h ${minutes}m`;
      if (hours > 0) return `Starts in ${hours}h ${minutes}m`;
      return `Starts in ${minutes}m`;
    }
    
    // If auction is active or ended
    const diff = endTime - now;
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusBadge = (auction) => {
    const status = auction.computedStatus || auction.auction?.status;
    const now = new Date();
    const startTime = new Date(auction.auction?.startTime);
    const endTime = new Date(auction.auction?.endTime);
    
    // Check if it's upcoming (scheduled but not started yet)
    if (status === 'scheduled' && startTime > now) {
      return <span className="badge badge-info">Upcoming</span>;
    }
    // Check if it's active
    else if (status === 'active' || (startTime <= now && endTime > now)) {
      return <span className="badge badge-success">Active</span>;
    }
    // Check if it's ended
    else if (status === 'ended' || endTime <= now) {
      return <span className="badge badge-error">Ended</span>;
    }
    // Check if it's cancelled
    else if (status === 'cancelled') {
      return <span className="badge badge-warning">Cancelled</span>;
    }
    // Default case
    else {
      return <span className="badge badge-neutral">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading loading-spinner loading-lg text-primary"></div>
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
            {/* Navigation Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <Link to="/admin" className="btn btn-ghost btn-sm">
                    ← Back to Dashboard
                  </Link>
                  <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                    <FaGavel className="mr-3 text-primary" />
                    Auction Management
                  </h1>
        </div>
                <div className="flex space-x-2">
                  <Link to="/admin/products/auction/add" className="btn btn-primary btn-sm">
                    <FaPlus className="mr-2" />
                    Add Auction
                  </Link>
                  <Link to="/admin/auctions" className="btn btn-outline btn-sm">
                    Auction Scheduler
                  </Link>
                    </div>
        </div>
              <p className="text-gray-600">
                Monitor active auctions and view auction history
              </p>
        </div>

            {/* Tab Navigation */}
            <div className="mb-6">
              <div className="tabs tabs-boxed">
          <button
                  className={`tab ${activeTab === 'active' ? 'tab-active' : ''}`}
                  onClick={() => setActiveTab('active')}
          >
                  <FaFire className="mr-2" />
                  Active & Upcoming ({auctions.length})
          </button>
          <button
                  className={`tab ${activeTab === 'history' ? 'tab-active' : ''}`}
                  onClick={() => setActiveTab('history')}
          >
                  <FaHistory className="mr-2" />
                  Auction History ({auctionHistory.length})
          </button>
        </div>
      </div>

            {/* Active Auctions Tab */}
            {activeTab === 'active' && (
              <div>
                {auctions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl text-gray-300 mb-4">🏆</div>
                    <h2 className="text-2xl font-bold text-gray-600 mb-2">No Active or Upcoming Auctions</h2>
                    <p className="text-gray-500 mb-6">
                      There are currently no active or upcoming auctions.
                    </p>
                    <Link to="/admin/products/auction/add" className="btn btn-primary">
                      Create New Auction
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {auctions.map((auction) => (
                      <div key={auction._id} className="card bg-white shadow-xl hover:shadow-2xl transition-shadow">
                        <figure className="px-6 pt-6">
                          <img
                            src={auction.images[0]}
                            alt={auction.name}
                            className="w-full h-48 object-cover rounded-lg"
                          />
                        </figure>
                        
                        <div className="card-body">
                          <h2 className="card-title text-lg mb-2">{auction.name}</h2>
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                            {auction.description}
                          </p>
                          
                          {/* Current Bid Info */}
                          <div className="bg-gradient-to-r from-primary to-primary-focus text-primary-content p-4 rounded-lg mb-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm opacity-80">Current Highest Bid</p>
                                <p className="text-2xl font-bold">${auction.auction.currentBid}</p>
                              </div>
                              <FaTrophy className="text-3xl" />
                            </div>
                          </div>
                          
                          {/* Auction Details */}
                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Starting Bid:</span>
                              <span className="font-semibold">${auction.auction.startingBid}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Total Bids:</span>
                              <span className="font-semibold">{auction.auction.totalBids}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Time Remaining:</span>
                              <span className={`font-semibold ${
                                formatTimeRemaining(auction).includes('Ended') 
                                  ? 'text-error' 
                                  : formatTimeRemaining(auction).includes('Starts in')
                                  ? 'text-info'
                                  : 'text-success'
                              }`}>
                                {formatTimeRemaining(auction)}
                              </span>
                            </div>
                          </div>
                          
                                                    {/* Status and Actions */}
                          <div className="flex items-center justify-between">
                            {getStatusBadge(auction)}
                            <Link
                              to={`/admin/auctions/${auction._id}`}
                              className="btn btn-primary btn-sm"
                            >
                              <FaEye className="mr-2" />
                              View Details
                            </Link>
                          </div>
          </div>
                      </div>
                    ))}
        </div>
      )}
              </div>
            )}

            {/* Auction History Tab */}
            {activeTab === 'history' && (
              <div>
                {auctionHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl text-gray-300 mb-4">📜</div>
                    <h2 className="text-2xl font-bold text-gray-600 mb-2">No Auction History</h2>
                    <p className="text-gray-500">
                      No auctions have been completed yet.
                    </p>
                  </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                          <th>Product</th>
                          <th>Starting Bid</th>
                          <th>Final Bid</th>
                          <th>Total Bids</th>
                          <th>Winner</th>
                          <th>End Date</th>
                      <th>Status</th>
                          <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                        {auctionHistory.map((auction) => (
                          <tr key={auction._id}>
                            <td>
                              <div className="flex items-center space-x-3">
                                <img
                                  src={auction.images[0]}
                                  alt={auction.name}
                                  className="w-12 h-12 object-cover rounded"
                                />
                                <div>
                                  <div className="font-bold">{auction.name}</div>
                                  <div className="text-sm opacity-50">{auction.category}</div>
                                </div>
                              </div>
                            </td>
                            <td>${auction.auction.startingBid}</td>
                            <td className="font-bold text-success">${auction.auction.currentBid}</td>
                            <td>{auction.auction.totalBids}</td>
                            <td>
                              {auction.auction.winner ? (
                                <div className="flex items-center space-x-2">
                                  <FaTrophy className="text-warning" />
                                  <span>{auction.auction.winner.name}</span>
                                </div>
                              ) : (
                                <span className="text-gray-500">No winner</span>
                              )}
                            </td>
                            <td>{formatTime(auction.auction.endTime)}</td>
                            <td>{getStatusBadge(auction)}</td>
                            <td>
                              <Link
                                to={`/admin/auctions/${auction._id}`}
                                className="btn btn-ghost btn-sm"
                              >
                                <FaEye />
                              </Link>
                            </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
            )}
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
            <li><Link to="/admin/auctions/active" className="active">Active Auctions</Link></li>
            <li><Link to="/admin/auctions">Auction Scheduler</Link></li>
            <li><Link to="/admin/coupons">Coupons</Link></li>
            <li><Link to="/admin/accounts">Accounts</Link></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ActiveAuctions; 