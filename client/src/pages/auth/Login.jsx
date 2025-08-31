import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FaEye, FaEyeSlash, FaSpinner, FaShoppingCart, FaUserShield, FaStore } from 'react-icons/fa';
import toast from 'react-hot-toast';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.role) {
      toast.error('Please select a role.');
      return;
    }
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password, formData.role);
      
      if (result.success) {
        toast.success(`Welcome! You're now logged in as ${formData.role}`);
        if (formData.role === 'vendor') {
          navigate('/vendor/dashboard');
        } else if (formData.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
        toast.error(result.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-4">
            <FaShoppingCart className="text-3xl text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">BidCart</h1>
          <p className="text-slate-300 text-lg">Welcome back to your marketplace</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg shadow-2xl rounded-3xl p-8 border border-white/20">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Sign In</h2>
            <p className="text-slate-300">Choose your role and enter your credentials</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-200 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-200 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash className="text-lg" /> : <FaEye className="text-lg" />}
                </button>
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-slate-200 mb-2">
                Select Your Role
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, role: 'user'})}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.role === 'user' 
                      ? 'border-purple-500 bg-purple-500/20 text-white' 
                      : 'border-white/20 bg-white/5 text-slate-300 hover:border-white/40'
                  }`}
                >
                  <FaShoppingCart className="mx-auto mb-2 text-2xl" />
                  <span className="text-sm font-medium">User</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setFormData({...formData, role: 'vendor'})}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.role === 'vendor' 
                      ? 'border-purple-500 bg-purple-500/20 text-white' 
                      : 'border-white/20 bg-white/5 text-slate-300 hover:border-white/40'
                  }`}
                >
                  <FaStore className="mx-auto mb-2 text-2xl" />
                  <span className="text-sm font-medium">Vendor</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setFormData({...formData, role: 'admin'})}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.role === 'admin' 
                      ? 'border-purple-500 bg-purple-500/20 text-white' 
                      : 'border-white/20 bg-white/5 text-slate-300 hover:border-white/40'
                  }`}
                >
                  <FaUserShield className="mx-auto mb-2 text-2xl" />
                  <span className="text-sm font-medium">Admin</span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !formData.role}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin mr-2 inline" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Additional Links */}
          <div className="mt-6 space-y-4 text-center">
            <p className="text-sm text-slate-300">
              Don't have an account?{' '}
              <Link to="/register" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                Create one now
              </Link>
            </p>
            <Link to="/forgot-password" className="text-sm text-slate-400 hover:text-slate-300 transition-colors">
              Forgot your password?
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-slate-400">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
