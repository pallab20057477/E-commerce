import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FaCoins, FaCalendarAlt, FaWallet, FaChartLine, FaDownload, FaFilter, FaDollarSign, FaShoppingCart } from 'react-icons/fa';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const VendorEarnings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const [earnings, setEarnings] = useState({
    totalEarnings: 0,
    netEarnings: 0,
    commissionRate: 0,
    dailyEarnings: [],
    monthlyEarnings: [],
    recentTransactions: []
  });
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    fetchEarnings();
  }, [period]);

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/vendors/earnings?period=${period}`);
      
      if (response.data.success) {
        setEarnings(response.data);
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
      toast.error('Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || withdrawAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (parseFloat(withdrawAmount) > earnings.netEarnings) {
      toast.error('Withdrawal amount cannot exceed available balance');
      return;
    }

    try {
      setWithdrawing(true);
      const response = await api.post('/vendors/withdraw', {
        amount: parseFloat(withdrawAmount)
      });

      if (response.data.success) {
        toast.success('Withdrawal request submitted successfully');
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        fetchEarnings(); // Refresh data
      }
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      toast.error(error.response?.data?.message || 'Failed to process withdrawal');
    } finally {
      setWithdrawing(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getPeriodLabel = (period) => {
    const labels = {
      '7': 'Last 7 Days',
      '30': 'Last 30 Days',
      '90': 'Last 90 Days',
      '365': 'Last Year'
    };
    return labels[period] || 'Last 30 Days';
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 lg:px-12">
        <div className="flex justify-center items-center h-64">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 lg:px-12 flex flex-col gap-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Earnings & Analytics</h2>
          <p className="text-base-content/70">Track your sales performance and earnings</p>
        </div>
        <div className="flex gap-4 mt-4 md:mt-0">
          <select
            className="select select-bordered"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">Last Year</option>
          </select>
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="btn btn-primary"
            disabled={earnings.netEarnings <= 0}
          >
            <FaWallet className="mr-2" />
            Withdraw
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="stat bg-gradient-to-br from-primary to-primary-focus text-primary-content shadow-xl rounded-2xl">
          <div className="stat-figure text-primary-content">
            <FaCoins className="text-3xl" />
          </div>
          <div className="stat-title text-primary-content/80">Total Earnings</div>
          <div className="stat-value text-2xl">{formatCurrency(earnings.totalEarnings)}</div>
          <div className="stat-desc text-primary-content/70">{getPeriodLabel(period)}</div>
        </div>
        
        <div className="stat bg-gradient-to-br from-success to-success-focus text-success-content shadow-xl rounded-2xl">
          <div className="stat-figure text-success-content">
            <FaWallet className="text-3xl" />
          </div>
          <div className="stat-title text-success-content/80">Net Earnings</div>
          <div className="stat-value text-2xl">{formatCurrency(earnings.netEarnings)}</div>
          <div className="stat-desc text-success-content/70">After {earnings.commissionRate}% commission</div>
        </div>
        
        <div className="stat bg-gradient-to-br from-info to-info-focus text-info-content shadow-xl rounded-2xl">
          <div className="stat-figure text-info-content">
            <FaChartLine className="text-3xl" />
          </div>
          <div className="stat-title text-info-content/80">Average Daily</div>
          <div className="stat-value text-2xl">
            {formatCurrency(earnings.dailyEarnings.length > 0 
              ? earnings.dailyEarnings.reduce((sum, day) => sum + day.total, 0) / earnings.dailyEarnings.length 
              : 0)}
          </div>
          <div className="stat-desc text-info-content/70">Per day average</div>
        </div>
        
        <div className="stat bg-gradient-to-br from-warning to-warning-focus text-warning-content shadow-xl rounded-2xl">
          <div className="stat-figure text-warning-content">
            <FaShoppingCart className="text-3xl" />
          </div>
          <div className="stat-title text-warning-content/80">Total Orders</div>
          <div className="stat-value text-2xl">
            {earnings.dailyEarnings.reduce((sum, day) => sum + day.count, 0)}
          </div>
          <div className="stat-desc text-warning-content/70">Orders processed</div>
        </div>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Daily Earnings Chart */}
        <div className="bg-base-100 shadow-xl rounded-2xl p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <FaChartLine className="mr-2" />
            Daily Earnings
          </h3>
          {earnings.dailyEarnings.length > 0 ? (
            <div className="space-y-4">
              {earnings.dailyEarnings.map((day, index) => (
                <div key={day._id} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                  <div>
                    <p className="font-semibold">{new Date(day._id).toLocaleDateString()}</p>
                    <p className="text-sm text-base-content/60">{day.count} orders</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{formatCurrency(day.total)}</p>
                    <p className="text-xs text-base-content/60">Net: {formatCurrency(day.total * (1 - earnings.commissionRate / 100))}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-base-content/60">
              <FaChartLine className="text-4xl mx-auto mb-4" />
              <p>No earnings data for this period</p>
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="bg-base-100 shadow-xl rounded-2xl p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <FaDollarSign className="mr-2" />
            Recent Transactions
          </h3>
          {earnings.recentTransactions && earnings.recentTransactions.length > 0 ? (
            <div className="space-y-4">
              {earnings.recentTransactions.slice(0, 10).map((transaction) => (
                <div key={transaction._id} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                  <div>
                    <p className="font-semibold">Order #{transaction.orderId?.slice(-6)}</p>
                    <p className="text-sm text-base-content/60">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${transaction.type === 'sale' ? 'text-success' : 'text-error'}`}>
                      {transaction.type === 'sale' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-xs text-base-content/60 capitalize">{transaction.type}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-base-content/60">
              <FaDollarSign className="text-4xl mx-auto mb-4" />
              <p>No recent transactions</p>
            </div>
          )}
        </div>
      </div>

      {/* Commission Information */}
      <div className="bg-base-100 shadow-xl rounded-2xl p-6">
        <h3 className="text-xl font-bold mb-4">Commission & Payout Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-base-200 rounded-lg">
            <p className="text-sm text-base-content/60">Commission Rate</p>
            <p className="text-2xl font-bold text-primary">{earnings.commissionRate}%</p>
          </div>
          <div className="text-center p-4 bg-base-200 rounded-lg">
            <p className="text-sm text-base-content/60">Available for Withdrawal</p>
            <p className="text-2xl font-bold text-success">{formatCurrency(earnings.netEarnings)}</p>
          </div>
          <div className="text-center p-4 bg-base-200 rounded-lg">
            <p className="text-sm text-base-content/60">Total Commission Paid</p>
            <p className="text-2xl font-bold text-warning">
              {formatCurrency(earnings.totalEarnings - earnings.netEarnings)}
            </p>
          </div>
        </div>
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Request Withdrawal</h3>
            <div className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text">Available Balance</span>
                </label>
                <p className="text-2xl font-bold text-success">{formatCurrency(earnings.netEarnings)}</p>
              </div>
              <div>
                <label className="label">
                  <span className="label-text">Withdrawal Amount</span>
                </label>
                <input
                  type="number"
                  placeholder="Enter amount"
                  className="input input-bordered w-full"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  max={earnings.netEarnings}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            <div className="modal-action">
              <button
                className="btn"
                onClick={() => setShowWithdrawModal(false)}
                disabled={withdrawing}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleWithdraw}
                disabled={withdrawing || !withdrawAmount || withdrawAmount <= 0}
              >
                {withdrawing ? (
                  <>
                    <div className="loading loading-spinner loading-sm"></div>
                    Processing...
                  </>
                ) : (
                  'Request Withdrawal'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorEarnings; 