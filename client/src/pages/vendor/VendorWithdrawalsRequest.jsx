import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FaMoneyCheckAlt, FaCreditCard, FaInfoCircle, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const VendorWithdrawalsRequest = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [vendorData, setVendorData] = useState(null);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [formData, setFormData] = useState({
    amount: '',
    bankAccount: '',
    bankName: '',
    accountHolder: '',
    routingNumber: '',
    reason: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchVendorData();
  }, []);

  const fetchVendorData = async () => {
    try {
      const [vendorRes, earningsRes] = await Promise.all([
        api.get('/vendors/profile'),
        api.get('/vendors/earnings')
      ]);

      if (vendorRes.data.success) {
        setVendorData(vendorRes.data.vendor);
      }

      if (earningsRes.data.success) {
        setAvailableBalance(earningsRes.data.availableBalance || 0);
      }
    } catch (error) {
      console.error('Error fetching vendor data:', error);
      toast.error('Failed to load vendor data');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Amount validation
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    } else if (parseFloat(formData.amount) > availableBalance) {
      newErrors.amount = `Amount cannot exceed available balance ($${availableBalance.toFixed(2)})`;
    } else if (parseFloat(formData.amount) < (vendorData?.minimumPayout || 50)) {
      newErrors.amount = `Minimum withdrawal amount is $${(vendorData?.minimumPayout || 50).toFixed(2)}`;
    }

    // Bank details validation
    if (!formData.bankAccount) {
      newErrors.bankAccount = 'Bank account number is required';
    } else if (!/^\d{8,17}$/.test(formData.bankAccount.replace(/\s/g, ''))) {
      newErrors.bankAccount = 'Please enter a valid bank account number';
    }

    if (!formData.bankName) {
      newErrors.bankName = 'Bank name is required';
    }

    if (!formData.accountHolder) {
      newErrors.accountHolder = 'Account holder name is required';
    }

    if (!formData.routingNumber) {
      newErrors.routingNumber = 'Routing number is required';
    } else if (!/^\d{9}$/.test(formData.routingNumber.replace(/\s/g, ''))) {
      newErrors.routingNumber = 'Please enter a valid 9-digit routing number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      setLoading(true);
      
      const withdrawalData = {
        amount: parseFloat(formData.amount),
        bankDetails: {
          accountNumber: formData.bankAccount.replace(/\s/g, ''),
          bankName: formData.bankName,
          accountHolder: formData.accountHolder,
          routingNumber: formData.routingNumber.replace(/\s/g, '')
        },
        reason: formData.reason || 'Vendor withdrawal request'
      };

      const response = await api.post('/vendors/withdrawals/request', withdrawalData);
      
      if (response.data.success) {
        toast.success('Withdrawal request submitted successfully!');
        navigate('/vendor/withdrawals/history');
      }
    } catch (error) {
      console.error('Error submitting withdrawal request:', error);
      const errorMessage = error.response?.data?.message || 'Failed to submit withdrawal request';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatAccountNumber = (value) => {
    // Format account number with spaces for readability
    return value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
  };

  const formatRoutingNumber = (value) => {
    // Format routing number with spaces
    return value.replace(/\s/g, '').replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
  };

  return (
    <div className="container mx-auto py-8 px-4 lg:px-12 flex flex-col gap-8">
      <div className="bg-base-100 rounded-lg shadow-lg p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center">
              <FaMoneyCheckAlt className="mr-3 text-primary" />
              Request Withdrawal
            </h1>
            <p className="text-gray-600 mt-2">
              Submit a withdrawal request for your earnings
            </p>
          </div>
        </div>

        {/* Available Balance Card */}
        <div className="bg-gradient-to-r from-primary to-primary-focus text-primary-content rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Available Balance</h3>
              <p className="text-2xl font-bold">{formatCurrency(availableBalance)}</p>
            </div>
            <FaCheckCircle className="text-3xl" />
          </div>
          {vendorData && (
            <div className="mt-3 text-sm opacity-90">
              <p>Minimum withdrawal: {formatCurrency(vendorData.minimumPayout || 50)}</p>
              <p>Payout schedule: {vendorData.payoutSchedule || 'bi-weekly'}</p>
            </div>
          )}
        </div>

        {/* Withdrawal Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount Section */}
          <div className="card bg-base-200 p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <FaCreditCard className="mr-2" />
              Withdrawal Amount
            </h3>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Amount (USD)</span>
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="Enter withdrawal amount"
                className={`input input-bordered w-full ${errors.amount ? 'input-error' : ''}`}
                step="0.01"
                min="0"
                max={availableBalance}
              />
              {errors.amount && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.amount}</span>
                </label>
              )}
              <label className="label">
                <span className="label-text-alt text-gray-600">
                  Available: {formatCurrency(availableBalance)}
                </span>
              </label>
            </div>
          </div>

          {/* Bank Details Section */}
          <div className="card bg-base-200 p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <FaCreditCard className="mr-2" />
              Bank Account Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Account Holder Name</span>
                </label>
                <input
                  type="text"
                  name="accountHolder"
                  value={formData.accountHolder}
                  onChange={handleChange}
                  placeholder="Enter account holder name"
                  className={`input input-bordered w-full ${errors.accountHolder ? 'input-error' : ''}`}
                />
                {errors.accountHolder && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.accountHolder}</span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Bank Name</span>
                </label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  placeholder="Enter bank name"
                  className={`input input-bordered w-full ${errors.bankName ? 'input-error' : ''}`}
                />
                {errors.bankName && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.bankName}</span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Account Number</span>
                </label>
                <input
                  type="text"
                  name="bankAccount"
                  value={formData.bankAccount}
                  onChange={(e) => {
                    const formatted = formatAccountNumber(e.target.value);
                    setFormData(prev => ({ ...prev, bankAccount: formatted }));
                  }}
                  placeholder="Enter account number"
                  className={`input input-bordered w-full ${errors.bankAccount ? 'input-error' : ''}`}
                  maxLength="23"
                />
                {errors.bankAccount && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.bankAccount}</span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Routing Number</span>
                </label>
                <input
                  type="text"
                  name="routingNumber"
                  value={formData.routingNumber}
                  onChange={(e) => {
                    const formatted = formatRoutingNumber(e.target.value);
                    setFormData(prev => ({ ...prev, routingNumber: formatted }));
                  }}
                  placeholder="Enter 9-digit routing number"
                  className={`input input-bordered w-full ${errors.routingNumber ? 'input-error' : ''}`}
                  maxLength="11"
                />
                {errors.routingNumber && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.routingNumber}</span>
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Reason Section */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Reason (Optional)</span>
            </label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              placeholder="Enter reason for withdrawal (optional)"
              className="textarea textarea-bordered w-full"
              rows="3"
            />
          </div>

          {/* Information Alert */}
          <div className="alert alert-info">
            <FaInfoCircle />
            <div>
              <h3 className="font-bold">Important Information</h3>
              <div className="text-sm">
                <p>• Withdrawal requests are processed within 3-5 business days</p>
                <p>• A processing fee of 2.5% may apply</p>
                <p>• You will receive an email confirmation once processed</p>
                <p>• Minimum withdrawal amount: {formatCurrency(vendorData?.minimumPayout || 50)}</p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/vendor/withdrawals/history')}
              className="btn btn-outline"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !formData.amount || parseFloat(formData.amount) <= 0}
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Processing...
                </>
              ) : (
                <>
                  <FaMoneyCheckAlt className="mr-2" />
                  Submit Withdrawal Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VendorWithdrawalsRequest; 