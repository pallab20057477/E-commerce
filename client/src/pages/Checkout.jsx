import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { FaLock, FaCreditCard, FaMapMarkerAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../utils/api';

const Checkout = () => {
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod'); // Use a valid backend value
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (cart.length === 0) {
      navigate('/cart');
      return;
    }

    // Pre-fill shipping address if user has one
    if (user.address) {
      setShippingAddress(user.address);
    }
  }, [user, cart, navigate]);

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateShipping = () => {
    return 10.00; // Fixed shipping cost
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateShipping();
  };

  const handleInputChange = (setter) => (e) => {
    setter(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const validateForm = () => {
    if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zipCode) {
      toast.error('Please fill in all shipping address fields');
      return false;
    }

    if (paymentMethod === 'card') {
      if (!paymentDetails.cardNumber || !paymentDetails.expiryDate || !paymentDetails.cvv || !paymentDetails.cardholderName) {
        toast.error('Please fill in all payment details');
        return false;
      }
    }

    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const orderData = {
        products: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          mode: item.mode
        })),
        shippingAddress,
        paymentMethod,
        totalAmount: calculateTotal(),
        subtotal: calculateSubtotal(),
        shippingCost: calculateShipping()
      };

      const response = await api.post('/orders', orderData);
      console.log('Order creation response:', response);

      if (!response.data?.order?._id) {
        throw new Error('Invalid order ID received from server');
      }
      
      const orderId = response.data.order._id;
      toast.success('Order placed successfully!');
      clearCart();
      
      // Give some time for the order to be fully processed
      setTimeout(() => {
        console.log('Navigating to order:', orderId);
        navigate(`/orders/${orderId}`);
      }, 1000);
    } catch (error) {
      console.error('Error placing order:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to place order';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!user || cart.length === 0) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Checkout</h1>
        <p className="text-gray-600">Complete your purchase</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Checkout Form */}
        <div className="space-y-6">
          {/* Shipping Address */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <FaMapMarkerAlt className="text-primary mr-2" />
              <h2 className="text-xl font-semibold">Shipping Address</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="label">
                  <span className="label-text">Street Address</span>
                </label>
                <input
                  type="text"
                  name="street"
                  value={shippingAddress.street}
                  onChange={handleInputChange(setShippingAddress)}
                  className="input input-bordered w-full"
                  placeholder="123 Main St"
                />
              </div>
              
              <div>
                <label className="label">
                  <span className="label-text">City</span>
                </label>
                <input
                  type="text"
                  name="city"
                  value={shippingAddress.city}
                  onChange={handleInputChange(setShippingAddress)}
                  className="input input-bordered w-full"
                  placeholder="New York"
                />
              </div>
              
              <div>
                <label className="label">
                  <span className="label-text">State</span>
                </label>
                <input
                  type="text"
                  name="state"
                  value={shippingAddress.state}
                  onChange={handleInputChange(setShippingAddress)}
                  className="input input-bordered w-full"
                  placeholder="NY"
                />
              </div>
              
              <div>
                <label className="label">
                  <span className="label-text">ZIP Code</span>
                </label>
                <input
                  type="text"
                  name="zipCode"
                  value={shippingAddress.zipCode}
                  onChange={handleInputChange(setShippingAddress)}
                  className="input input-bordered w-full"
                  placeholder="10001"
                />
              </div>
              
              <div>
                <label className="label">
                  <span className="label-text">Country</span>
                </label>
                <input
                  type="text"
                  name="country"
                  value={shippingAddress.country}
                  onChange={handleInputChange(setShippingAddress)}
                  className="input input-bordered w-full"
                  placeholder="United States"
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <FaCreditCard className="text-primary mr-2" />
              <h2 className="text-xl font-semibold">Payment Method</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="radio radio-primary"
                />
                <label className="label cursor-pointer">
                  <span className="label-text">Credit/Debit Card</span>
                </label>
              </div>
              
              <div className="flex items-center space-x-4">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="radio radio-primary"
                />
                <label className="label cursor-pointer">
                  <span className="label-text">Cash on Delivery</span>
                </label>
              </div>
            </div>

            {paymentMethod === 'card' && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="label">
                    <span className="label-text">Card Number</span>
                  </label>
                  <input
                    type="text"
                    name="cardNumber"
                    value={paymentDetails.cardNumber}
                    onChange={handleInputChange(setPaymentDetails)}
                    className="input input-bordered w-full"
                    placeholder="1234 5678 9012 3456"
                    maxLength="19"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">
                      <span className="label-text">Expiry Date</span>
                    </label>
                    <input
                      type="text"
                      name="expiryDate"
                      value={paymentDetails.expiryDate}
                      onChange={handleInputChange(setPaymentDetails)}
                      className="input input-bordered w-full"
                      placeholder="MM/YY"
                      maxLength="5"
                    />
                  </div>
                  
                  <div>
                    <label className="label">
                      <span className="label-text">CVV</span>
                    </label>
                    <input
                      type="text"
                      name="cvv"
                      value={paymentDetails.cvv}
                      onChange={handleInputChange(setPaymentDetails)}
                      className="input input-bordered w-full"
                      placeholder="123"
                      maxLength="4"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="label">
                    <span className="label-text">Cardholder Name</span>
                  </label>
                  <input
                    type="text"
                    name="cardholderName"
                    value={paymentDetails.cardholderName}
                    onChange={handleInputChange(setPaymentDetails)}
                    className="input input-bordered w-full"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            
            {/* Cart Items */}
            <div className="space-y-3 mb-4">
              {cart.map((item) => (
                <div key={item._id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded mr-3"
                    />
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>

            {/* Price Breakdown */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span>${calculateShipping().toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                <span>Total:</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="btn btn-primary w-full mt-6"
            >
              <FaLock className="mr-2" />
              {loading ? 'Processing...' : 'Place Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout; 