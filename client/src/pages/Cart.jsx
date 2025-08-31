import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { FaTrash, FaShoppingCart, FaArrowLeft, FaTag, FaShoppingBag, FaCreditCard } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../utils/api';

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, productId: null });

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal();
  };

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    setActionLoading(true);
    updateQuantity(productId, newQuantity);
    setTimeout(() => setActionLoading(false), 500); // Simulate async
  };

  const handleRemoveItem = (productId) => {
    setActionLoading(true);
    removeFromCart(productId);
    setTimeout(() => setActionLoading(false), 500); // Simulate async
    toast.success('Item removed from cart');
  };

  const handleDeleteClick = (productId) => {
    setConfirmDelete({ open: true, productId });
  };

  const handleConfirmDelete = () => {
    if (confirmDelete.productId) {
      handleRemoveItem(confirmDelete.productId);
    }
    setConfirmDelete({ open: false, productId: null });
  };

  const handleCancelDelete = () => {
    setConfirmDelete({ open: false, productId: null });
  };

  const handleCheckout = () => {
    if (!user) {
      toast.error('Please login to checkout');
      navigate('/login');
      return;
    }
    
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    navigate('/checkout');
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-base-100 to-base-200 py-16">
        <div className="text-center bg-white rounded-2xl shadow-xl p-10 max-w-md mx-auto transform transition-all duration-300 hover:scale-105">
          <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaShoppingCart className="text-5xl text-primary opacity-70" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Your cart is empty</h2>
          <p className="text-gray-500 mb-8 text-lg">Looks like you haven't added anything to your cart yet.</p>
          <button
            onClick={() => navigate('/products')}
            className="btn btn-primary btn-lg gap-2 shadow-md hover:shadow-lg transition-all duration-300"
          >
            <FaShoppingBag />
            Discover Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center mb-8">
        <button
          onClick={() => navigate(-1)}
          className="btn btn-ghost btn-sm mr-4 hover:bg-base-200 transition-colors duration-300"
        >
          <FaArrowLeft className="mr-2" />
          Back
        </button>
        <div className="flex items-center">
          <FaShoppingCart className="text-3xl text-primary mr-3" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Your Shopping Cart
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-base-200">
            <h2 className="text-xl font-semibold mb-6 flex items-center">
              <span className="bg-primary text-white rounded-full w-7 h-7 inline-flex items-center justify-center mr-2 text-sm">
                {cart.length}
              </span>
              Items in Your Cart
            </h2>
            
            <div className="space-y-6">
              {cart.map((item) => (
                <div
                  key={item.productId}
                  className="flex flex-col sm:flex-row items-start sm:items-center border border-base-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-300"
                >
                  <div className="relative group">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-24 h-24 object-cover rounded-lg mr-4 transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 rounded-lg"></div>
                  </div>
                  
                  <div className="flex-1 mt-3 sm:mt-0">
                    <h3 className="font-semibold text-lg text-gray-800">{item.name}</h3>
                    <div className="flex items-center mt-1">
                      <span className="bg-base-200 text-xs px-2 py-1 rounded-full text-gray-600">{item.category}</span>
                    </div>
                    <p className="text-primary font-bold mt-1">${item.price}</p>
                  </div>

                  <div className="flex items-center space-x-1 mt-3 sm:mt-0 mr-4 bg-base-100 rounded-lg p-1">
                    <button
                      onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                      className="btn btn-sm btn-circle btn-ghost hover:bg-base-200"
                      disabled={item.quantity <= 1 || actionLoading}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={e => {
                        const val = Math.max(1, parseInt(e.target.value) || 1);
                        handleQuantityChange(item.productId, val);
                      }}
                      className="input input-sm w-12 text-center font-semibold bg-transparent border-none"
                      disabled={actionLoading}
                    />
                    <button
                      onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                      className="btn btn-sm btn-circle btn-ghost hover:bg-base-200"
                      disabled={actionLoading}
                    >
                      +
                    </button>
                  </div>

                  <div className="text-right mt-3 sm:mt-0 w-full sm:w-auto flex flex-col items-end">
                    <p className="font-bold text-lg">${(item.price * item.quantity).toFixed(2)}</p>
                    <button
                      onClick={() => handleDeleteClick(item.productId)}
                      className="btn btn-sm btn-ghost text-red-500 hover:bg-red-50 mt-1 transition-colors duration-300"
                      disabled={actionLoading}
                    >
                      <FaTrash className="mr-1" /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Confirmation Modal */}
            {confirmDelete.open && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                <div className="bg-white rounded-xl shadow-xl p-8 max-w-sm w-full transform transition-all duration-300 scale-100">
                  <h3 className="text-xl font-semibold mb-4 text-gray-800">Remove Item</h3>
                  <p className="mb-6 text-gray-600">Are you sure you want to remove this item from your cart?</p>
                  <div className="flex justify-end gap-3">
                    <button
                      className="btn btn-outline"
                      onClick={handleCancelDelete}
                      disabled={actionLoading}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-error text-white"
                      onClick={handleConfirmDelete}
                      disabled={actionLoading}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Loading Spinner Overlay */}
            {actionLoading && (
              <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-10 backdrop-blur-sm">
                <div className="bg-white p-5 rounded-xl shadow-lg">
                  <span className="loading loading-spinner loading-lg text-primary"></span>
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={clearCart}
                className="btn btn-outline btn-error gap-2 hover:bg-red-50"
              >
                <FaTrash /> Clear Cart
              </button>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4 border border-base-200">
            <h2 className="text-xl font-semibold mb-6 flex items-center">
              <FaTag className="mr-2 text-primary" />
              Order Summary
            </h2>
            
            {/* Price Breakdown */}
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center bg-base-100 p-3 rounded-lg">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">${calculateSubtotal().toFixed(2)}</span>
              </div>
              
              <div className="bg-primary/5 p-4 rounded-lg">
                <div className="flex justify-between items-center text-lg">
                  <span className="font-bold text-gray-800">Total:</span>
                  <span className="font-bold text-primary text-xl">${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="bg-base-100 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-600 flex items-start">
                <span className="text-green-500 mr-2 mt-1">✓</span>
                Free shipping on orders over $50
              </p>
              <p className="text-sm text-gray-600 flex items-start mt-2">
                <span className="text-green-500 mr-2 mt-1">✓</span>
                Secure checkout with encryption
              </p>
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="btn btn-primary w-full btn-lg gap-2 shadow-md hover:shadow-lg transition-all duration-300"
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Processing...
                </>
              ) : (
                <>
                  <FaCreditCard />
                  Proceed to Checkout
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart; 