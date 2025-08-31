import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaClock, FaGavel, FaEye } from 'react-icons/fa';
import api from '../../utils/api';
import Countdown from 'react-countdown';
import { useSocket } from '../../contexts/SocketContext';

const UpcomingAuctions = () => {
  const [upcomingAuctions, setUpcomingAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  useEffect(() => {
    fetchUpcomingAuctions();
  }, []);

  // Listen for real-time auction scheduling/starting
  useEffect(() => {
    if (!socket) return;
    const handleAuctionScheduled = () => fetchUpcomingAuctions();
    const handleAuctionStarted = () => fetchUpcomingAuctions();
    socket.on('auction:scheduled', handleAuctionScheduled);
    socket.on('auction:started', handleAuctionStarted);
    return () => {
      socket.off('auction:scheduled', handleAuctionScheduled);
      socket.off('auction:started', handleAuctionStarted);
    };
  }, [socket]);

  const fetchUpcomingAuctions = async () => {
    try {
      const response = await api.get('/products/auctions/upcoming');
      setUpcomingAuctions(response.data);
    } catch (error) {
      console.error('Error fetching upcoming auctions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const CountdownRenderer = ({ hours, minutes, seconds, completed }) => {
    if (completed) {
      return <span className="text-green-600 font-bold">Starting Now!</span>;
    }

    return (
      <div className="flex space-x-2">
        <div className="text-center">
          <div className="bg-red-500 text-white rounded-lg px-2 py-1 text-sm font-bold">
            {hours.toString().padStart(2, '0')}
          </div>
          <div className="text-xs text-gray-500">Hours</div>
        </div>
        <div className="text-center">
          <div className="bg-red-500 text-white rounded-lg px-2 py-1 text-sm font-bold">
            {minutes.toString().padStart(2, '0')}
          </div>
          <div className="text-xs text-gray-500">Minutes</div>
        </div>
        <div className="text-center">
          <div className="bg-red-500 text-white rounded-lg px-2 py-1 text-sm font-bold">
            {seconds.toString().padStart(2, '0')}
          </div>
          <div className="text-xs text-gray-500">Seconds</div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (upcomingAuctions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
          <FaClock className="mr-2 text-red-500" />
          Upcoming Auctions
        </h2>
        <p className="text-gray-600 text-center py-8">
          No upcoming auctions at the moment. Check back soon!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <FaClock className="mr-2 text-red-500" />
          Upcoming Auctions
        </h2>
        <p className="text-gray-600 mt-2">
          Don't miss these exciting auctions starting soon!
        </p>
      </div>
      
      <div className="p-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingAuctions.map((auction) => (
            <div key={auction._id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                <img
                  src={auction.images[0]}
                  alt={auction.name}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-2 left-2">
                  <span className="badge badge-warning">
                    <FaClock className="mr-1" />
                    Starting Soon
                  </span>
                </div>
                <div className="absolute top-2 right-2">
                  <span className="badge badge-info">
                    {formatPrice(auction.auction.startingBid)}
                  </span>
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                  {auction.name}
                </h3>
                
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {auction.description}
                </p>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Starting Bid</p>
                    <p className="font-bold text-lg text-green-600">
                      {formatPrice(auction.auction.startingBid)}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Starts In</p>
                    <Countdown
                      date={new Date(auction.auction.startTime)}
                      renderer={CountdownRenderer}
                    />
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    <p>Start: {formatDate(auction.auction.startTime)}</p>
                    <p>End: {formatDate(auction.auction.endTime)}</p>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm text-gray-500">
                      by {auction.seller.name}
                    </span>
                    <Link
                      to={`/product/${auction._id}`}
                      className="btn btn-primary btn-sm"
                    >
                      <FaEye className="mr-1" />
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-6">
          <Link to="/products?mode=auction&auctionStatus=scheduled" className="btn btn-outline">
            View All Scheduled Auctions
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UpcomingAuctions; 