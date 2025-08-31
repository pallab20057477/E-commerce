import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { FaGavel, FaClock, FaUser, FaTrophy, FaHistory } from 'react-icons/fa';
import Countdown from 'react-countdown';

const BiddingInterface = ({ product, onBidPlaced }) => {
  const { user, isAuthenticated } = useAuth();
  // Professional: Destructure socket from useSocket
  const { joinAuction, leaveAuction, placeBid, socket } = useSocket();
  
  const [bids, setBids] = useState([]);
  const [currentBid, setCurrentBid] = useState(0);
  const [bidAmount, setBidAmount] = useState('');
  const [bidding, setBidding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (product?.mode === 'auction') {
      fetchBids();
      joinAuction(product._id);
      // Professional: Only add listeners if socket is available
      if (!socket) return;
      // Listen for real-time bid updates
      const handleBidUpdate = (data) => {
        if (data.productId === product._id) {
          setCurrentBid(data.currentBid);
          setBidAmount(data.currentBid + product.auction.minBidIncrement);
          fetchBids();
        }
      };
      const handleAuctionEnded = (data) => {
        if (data.productId === product._id) {
          toast.success(`Auction ended! Winner: ${data.winner}`);
          fetchBids();
        }
      };
      socket.on('bid-update', handleBidUpdate);
      socket.on('auction-ended', handleAuctionEnded);
      return () => {
        leaveAuction(product._id);
        socket.off('bid-update', handleBidUpdate);
        socket.off('auction-ended', handleAuctionEnded);
      };
    }
    // If socket is undefined, remind to restart dev server
    // (This can happen if the context or build is stale)
  }, [product, socket]);

  useEffect(() => {
    if (product?.auction) {
      setCurrentBid(product.auction.currentBid || product.auction.startingBid);
      setBidAmount((product.auction.currentBid || product.auction.startingBid) + product.auction.minBidIncrement);
    }
  }, [product]);

  const fetchBids = async () => {
    try {
      const response = await api.get(`/bids/product/${product._id}`);
      setBids(response.data);
    } catch (error) {
      console.error('Error fetching bids:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBid = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('Please login to place a bid');
      return;
    }

    const amount = parseFloat(bidAmount);
    if (amount <= currentBid) {
      toast.error('Bid must be higher than current bid');
      return;
    }

    setBidding(true);
    try {
      const response = await api.post('/bids', {
        productId: product._id,
        amount: amount
      });

      if (response.data.message) {
        toast.success('Bid placed successfully!');
        setCurrentBid(amount);
        setBidAmount(amount + product.auction.minBidIncrement);
        fetchBids();
        placeBid(product._id, amount);
        if (onBidPlaced) onBidPlaced(amount);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to place bid';
      toast.error(message);
    } finally {
      setBidding(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const isAuctionActive = () => {
    if (product?.mode !== 'auction') return false;
    const now = new Date();
    const startTime = new Date(product.auction.startTime);
    const endTime = new Date(product.auction.endTime);
    return startTime <= now && endTime > now && product.auction.status === 'active';
  };

  const isAuctionScheduled = () => {
    if (product?.mode !== 'auction') return false;
    const now = new Date();
    const startTime = new Date(product.auction.startTime);
    return startTime > now && product.auction.status === 'scheduled';
  };

  const isAuctionEnded = () => {
    if (product?.mode !== 'auction') return false;
    const now = new Date();
    const endTime = new Date(product.auction.endTime);
    return endTime <= now || product.auction.status === 'ended';
  };

  const isWinner = () => {
    return product?.auction?.winner === user?.id;
  };

  const getHighestBidder = () => {
    if (bids.length === 0) return null;
    return bids.reduce((highest, bid) => 
      bid.amount > highest.amount ? bid : highest
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Auction Status */}
      <div className="bg-base-100 rounded-lg p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center">
            <FaGavel className="mr-2 text-primary" />
            Auction Status
          </h3>
          <div className="badge badge-primary">
            {isAuctionActive() ? 'Active' : 
             isAuctionScheduled() ? 'Scheduled' : 
             isAuctionEnded() ? 'Ended' : 'Unknown'}
          </div>
        </div>

        {/* Current Bid Info */}
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="text-center p-4 bg-primary/10 rounded-lg">
            <div className="text-2xl font-bold text-primary">
              {formatPrice(currentBid)}
            </div>
            <div className="text-sm text-gray-600">Current Bid</div>
          </div>
          
          <div className="text-center p-4 bg-secondary/10 rounded-lg">
            <div className="text-2xl font-bold text-secondary">
              {formatPrice(product.auction.startingBid)}
            </div>
            <div className="text-sm text-gray-600">Starting Bid</div>
          </div>
        </div>

        {/* Countdown Timer */}
        {isAuctionActive() && (
          <div className="bg-warning/10 p-4 rounded-lg mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FaClock className="mr-2 text-warning" />
                <span className="font-medium">Auction ends in:</span>
              </div>
              <Countdown
                date={new Date(product.auction.endTime)}
                renderer={({ days, hours, minutes, seconds, completed }) => {
                  if (completed) {
                    return <span className="text-error font-bold">Auction Ended</span>;
                  }
                  return (
                    <div className="flex gap-2">
                      <div className="countdown-item">
                        <div className="countdown-value">{days}</div>
                        <div className="countdown-label">Days</div>
                      </div>
                      <div className="countdown-item">
                        <div className="countdown-value">{hours}</div>
                        <div className="countdown-label">Hours</div>
                      </div>
                      <div className="countdown-item">
                        <div className="countdown-value">{minutes}</div>
                        <div className="countdown-label">Minutes</div>
                      </div>
                      <div className="countdown-item">
                        <div className="countdown-value">{seconds}</div>
                        <div className="countdown-label">Seconds</div>
                      </div>
                    </div>
                  );
                }}
              />
            </div>
          </div>
        )}

        {/* Scheduled Auction Countdown */}
        {isAuctionScheduled() && (
          <div className="bg-info/10 p-4 rounded-lg mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FaClock className="mr-2 text-info" />
                <span className="font-medium">Auction starts in:</span>
              </div>
              <Countdown
                date={new Date(product.auction.startTime)}
                renderer={({ days, hours, minutes, seconds, completed }) => {
                  if (completed) {
                    return <span className="text-success font-bold">Starting now!</span>;
                  }
                  return (
                    <div className="flex gap-2">
                      <div className="countdown-item">
                        <div className="countdown-value">{days}</div>
                        <div className="countdown-label">Days</div>
                      </div>
                      <div className="countdown-item">
                        <div className="countdown-value">{hours}</div>
                        <div className="countdown-label">Hours</div>
                      </div>
                      <div className="countdown-item">
                        <div className="countdown-value">{minutes}</div>
                        <div className="countdown-label">Minutes</div>
                      </div>
                      <div className="countdown-item">
                        <div className="countdown-value">{seconds}</div>
                        <div className="countdown-label">Seconds</div>
                      </div>
                    </div>
                  );
                }}
              />
            </div>
          </div>
        )}

        {/* Auction Ended */}
        {isAuctionEnded() && (
          <div className="bg-base-200 p-4 rounded-lg mb-4">
            <h4 className="font-bold text-lg mb-2 flex items-center">
              <FaTrophy className="mr-2 text-warning" />
              Auction Ended
            </h4>
            {product.auction.winner ? (
              <div>
                <p className="mb-2">
                  <strong>Winner:</strong> {product.auction.winner.name}
                </p>
                <p className="mb-2">
                  <strong>Final Bid:</strong> {formatPrice(product.auction.currentBid)}
                </p>
                {isWinner() && (
                  <button className="btn btn-primary btn-sm">
                    Complete Purchase
                  </button>
                )}
              </div>
            ) : (
              <p>No bids were placed</p>
            )}
          </div>
        )}
      </div>

      {/* Bidding Form */}
      {isAuctionActive() && (
        <div className="bg-base-100 rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-bold mb-4">Place Your Bid</h3>
          
          <form onSubmit={handleBid} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bid Amount
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  min={currentBid + product.auction.minBidIncrement}
                  step="0.01"
                  className="input input-bordered flex-1"
                  placeholder="Enter bid amount"
                  required
                />
                <button
                  type="submit"
                  disabled={bidding}
                  className="btn btn-primary"
                >
                  {bidding ? (
                    <div className="loading loading-spinner loading-sm"></div>
                  ) : (
                    <>
                      <FaGavel className="mr-2" />
                      Place Bid
                    </>
                  )}
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Minimum bid: {formatPrice(currentBid + product.auction.minBidIncrement)}
              </p>
            </div>
          </form>

          {/* Highest Bidder */}
          {getHighestBidder() && (
            <div className="mt-4 p-3 bg-success/10 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm">Current Highest Bidder:</span>
                <span className="font-medium text-success">
                  {getHighestBidder().bidder.name}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bid History */}
      <div className="bg-base-100 rounded-lg p-6 shadow-lg">
        <h3 className="text-lg font-bold mb-4 flex items-center">
          <FaHistory className="mr-2" />
          Bid History ({bids.length} bids)
        </h3>
        
        {bids.length > 0 ? (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {bids.map((bid, index) => (
              <div 
                key={bid._id} 
                className={`flex items-center justify-between p-3 rounded-lg ${
                  index === 0 ? 'bg-success/10 border border-success/20' : 'bg-base-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center">
                    <FaUser className="text-gray-400 mr-2" />
                    <span className="font-medium">{bid.bidder.name}</span>
                  </div>
                  {index === 0 && (
                    <div className="badge badge-success badge-sm">Highest</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-bold">{formatPrice(bid.amount)}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(bid.placedAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FaHistory className="mx-auto text-4xl mb-4 opacity-50" />
            <p>No bids yet</p>
            <p className="text-sm">Be the first to place a bid!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BiddingInterface; 