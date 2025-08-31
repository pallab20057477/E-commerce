import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FaShoppingCart, FaTag, FaBox, FaEye, FaUser, FaStore, FaStar } from 'react-icons/fa';
import BiddingInterface from '../components/auctions/BiddingInterface';
import ReviewList from '../components/ReviewList';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!hasFetched.current) {
      fetchProduct();
      hasFetched.current = true;
    }
    // eslint-disable-next-line
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await api.get(`/products/${id}`);
      setProduct(response.data);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Product not found');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }
    
    if (product.stock < quantity) {
      toast.error('Not enough stock available');
      return;
    }
    
    addToCart({ ...product, quantity });
  };

  const handleBidPlaced = (newBidAmount) => {
    // Update the product's current bid
    setProduct(prev => ({
      ...prev,
      auction: {
        ...prev.auction,
        currentBid: newBidAmount
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-700">Product not found</h2>
        <button
          onClick={() => navigate('/products')}
          className="mt-4 btn btn-primary"
        >
          Back to Products
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Images */} 
        <div className="space-y-6">
          <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-xl shadow-lg transition-shadow duration-300 hover:shadow-2xl">
            <img
              src={product.images[activeImage]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImage(index)}
                  className={`aspect-w-1 aspect-h-1 overflow-hidden rounded-lg transition-transform duration-300 ${
                    activeImage === index ? 'ring-4 ring-primary scale-105' : 'hover:scale-105'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">{product.name}</h1>
            <div className="flex items-center space-x-6 mb-6">
              <div className="flex items-center space-x-2">
                <FaStar className="text-yellow-400" />
                <span className="font-semibold text-lg">{product.rating?.average || 0}</span>
                <span className="text-gray-600 ml-1">
                  ({product.rating?.count || 0} reviews)
                </span>
              </div>
              <div className="flex items-center text-gray-600 space-x-1">
                <FaEye />
                <span>{product.views} views</span>
              </div>
            </div>
            <p className="text-gray-700 leading-relaxed text-lg">{product.description}</p>
          </div>

          {/* Price and Stock */}
          <div className="bg-gray-50 rounded-xl p-8 shadow-md">
            <div className="flex items-center justify-between mb-6">
              <div className="text-4xl font-extrabold text-primary">
                ${product.price}
              </div>
              <div className="text-sm text-gray-600 font-medium">
                Stock: {product.stock} available
              </div>
            </div>

            {/* Add to Cart Section */}
            {product.mode === 'buy-now' && (
              <div className="space-y-6">
                <div className="flex items-center space-x-6">
                  <label className="text-base font-semibold text-gray-700">Quantity:</label>
                  <select
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                    className="select select-bordered"
                  >
                    {Array.from({ length: Math.min(10, product.stock) }, (_, i) => i + 1).map((num) => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="w-full btn btn-primary btn-lg transition-transform duration-300 hover:scale-105"
                >
                  <FaShoppingCart className="mr-2" />
                  {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div className="flex items-center space-x-6">
              <span className="text-base font-semibold text-gray-700">Category:</span>
              <span className="badge badge-outline">{product.category}</span>
            </div>
            {product.brand && (
              <div className="flex items-center space-x-6">
                <span className="text-base font-semibold text-gray-700">Brand:</span>
                <span>{product.brand}</span>
              </div>
            )}
            <div className="flex items-center space-x-6">
              <span className="text-base font-semibold text-gray-700">Condition:</span>
              <span className="capitalize">{product.condition}</span>
            </div>
            <div className="flex items-center space-x-6">
              <span className="text-base font-semibold text-gray-700">Mode:</span>
              <span className="badge badge-primary">{product.mode}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Auction Interface */}
      {product.mode === 'auction' && (
        <div className="mt-12">
          <BiddingInterface 
            product={product} 
            onBidPlaced={handleBidPlaced}
          />
        </div>
      )}

      {/* Reviews Section - Read Only */}
      <div className="mt-12">
        <div className="mb-8">
          <h3 className="text-3xl font-extrabold text-gray-900 flex items-center">
            <FaStar className="mr-3 text-warning" />
            Customer Reviews
          </h3>
          <p className="text-gray-700 mt-3 text-lg">
            Reviews from verified customers who have received this product
          </p>
        </div>

        {/* Reviews List */}
        <ReviewList productId={product._id} />
      </div>
    </div>
  );
};

export default ProductDetail; 