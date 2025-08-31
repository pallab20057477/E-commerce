import React from 'react';
import { Link } from 'react-router-dom';
import { FaGavel, FaShoppingCart, FaClock, FaEye } from 'react-icons/fa';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { isAuthenticated, isAdmin } = useAuth();

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      // Redirect to login or show login modal
      return;
    }
    addToCart(product);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getCurrentPrice = () => {
    if (product.mode === 'auction') {
      return product.auction.currentBid || product.auction.startingBid;
    }
    return product.price;
  };

  const isAuctionActive = () => {
    if (product.mode !== 'auction') return false;
    const now = new Date();
    const endTime = new Date(product.auction.endTime);
    return endTime > now && product.auction.status === 'active';
  };

  const isAuctionUpcoming = () => {
    if (product.mode !== 'auction') return false;
    const now = new Date();
    const startTime = new Date(product.auction.startTime);
    return startTime > now && product.auction.status === 'scheduled';
  };

  const isAuctionEnded = () => {
    if (product.mode !== 'auction') return false;
    const now = new Date();
    const endTime = new Date(product.auction.endTime);
    return endTime <= now || product.auction.status === 'ended';
  };

  const getTimeRemaining = () => {
    if (product.mode !== 'auction') return null;
    
    const now = new Date();
    
    // For upcoming auctions, show time until start
    if (isAuctionUpcoming()) {
      const startTime = new Date(product.auction.startTime);
      const diff = startTime - now;
      if (diff <= 0) return 'Starting Now';
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      if (days > 0) return `Starts in ${days}d ${hours}h`;
      if (hours > 0) return `Starts in ${hours}h ${minutes}m`;
      return `Starts in ${minutes}m`;
    }
    
    // For active auctions, show time until end
    if (isAuctionActive()) {
      const endTime = new Date(product.auction.endTime);
      const diff = endTime - now;
      if (diff <= 0) return 'Ended';
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      if (days > 0) return `${days}d ${hours}h`;
      if (hours > 0) return `${hours}h ${minutes}m`;
      return `${minutes}m`;
    }
    
    return null;
  };

  // Fallback image
  const imageUrl = product.images && product.images[0] ? product.images[0] : '/placeholder-image.jpg';
  const outOfStock = product.mode === 'buy-now' && product.stock <= 0;
  const auctionEnded = product.mode === 'auction' && isAuctionEnded();

  return (
    <div className="card bg-base-100 shadow-xl rounded-2xl border border-base-200 hover:shadow-2xl transition-shadow duration-300 group relative overflow-hidden h-full flex flex-col">
      {/* Image Section */}
      <figure className="relative aspect-[4/3] w-full overflow-hidden">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-48 object-cover object-center transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-2 z-10">
          {product.mode === 'auction' && isAuctionActive() && (
            <span className="badge badge-primary flex items-center gap-1 text-xs px-2 py-1 shadow-md">
              <FaGavel className="mr-1" /> Live Auction
            </span>
          )}
          {product.mode === 'auction' && isAuctionUpcoming() && (
            <span className="badge badge-info flex items-center gap-1 text-xs px-2 py-1 shadow-md">
              <FaClock className="mr-1" /> Upcoming
            </span>
          )}
          {product.mode === 'buy-now' && (
            <span className="badge badge-secondary flex items-center gap-1 text-xs px-2 py-1 shadow-md">
              <FaShoppingCart className="mr-1" /> Buy Now
            </span>
          )}
          {product.isFeatured && (
            <span className="badge badge-accent flex items-center gap-1 text-xs px-2 py-1 shadow-md">
              Featured
            </span>
          )}
        </div>
        {/* Overlay for Out of Stock or Auction Ended */}
        {(outOfStock || auctionEnded) && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
            <span className="text-white text-lg font-bold">
              {outOfStock ? 'Out of Stock' : 'Auction Ended'}
            </span>
          </div>
        )}
      </figure>

      {/* Card Body */}
      <div className="card-body p-4 flex flex-col gap-2 flex-1">
        <h2 className="card-title text-lg font-semibold text-base-content line-clamp-1" title={product.name}>{product.name}</h2>
        <p className="text-sm text-gray-500 line-clamp-2 mb-1" title={product.description}>{product.description}</p>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xl font-bold text-primary">{formatPrice(getCurrentPrice())}</span>
          {product.mode === 'auction' && (isAuctionActive() || isAuctionUpcoming()) && (
            <span className={`flex items-center text-sm ${isAuctionUpcoming() ? 'text-info' : 'text-warning'}`} title="Time remaining">
              <FaClock className="mr-1" />
              {getTimeRemaining()}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
          <span className="truncate" title={product.category}>Category: {product.category}</span>
          <span className="flex items-center" title="Views">
            <FaEye className="mr-1" />
            {product.views}
          </span>
        </div>
        <div className="mt-auto">
        <div className="card-actions flex gap-2">
          <Link
            to={`/products/${product._id}`}
            className="btn btn-primary btn-sm flex-1 transition-transform duration-200 hover:scale-105"
            aria-label="View Details"
          >
            View Details
          </Link>
          {product.mode === 'buy-now' && product.stock > 0 && (
            <button
              onClick={handleAddToCart}
              className="btn btn-secondary btn-sm flex-1 transition-transform duration-200 hover:scale-105"
              aria-label="Add to Cart"
            >
              Add to Cart
            </button>
          )}
          {product.mode === 'auction' && isAuctionActive() && !isAdmin && (
            <Link
              to={`/products/${product._id}`}
              className="btn btn-accent btn-sm flex-1 transition-transform duration-200 hover:scale-105"
              aria-label="Bid Now"
            >
              <FaGavel className="mr-1" />
              Bid Now
            </Link>
          )}
          {product.mode === 'auction' && isAuctionUpcoming() && !isAdmin && (
            <Link
              to={`/products/${product._id}`}
              className="btn btn-info btn-sm flex-1 transition-transform duration-200 hover:scale-105"
              aria-label="View Details"
            >
              <FaClock className="mr-1" />
              Coming Soon
            </Link>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard; 