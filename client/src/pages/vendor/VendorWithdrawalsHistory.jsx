import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { FaHistory, FaDollarSign } from 'react-icons/fa';

const VendorWithdrawalsHistory = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const response = await api.get('/vendors/withdrawals');
      if (response.data.success) {
        setWithdrawals(response.data.withdrawals);
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      toast.error('Failed to load withdrawal history');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 lg:px-12">
      <div className="bg-base-100 shadow-xl rounded-2xl p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <FaHistory className="mr-2" />
          Withdrawal History
        </h2>
        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading...</div>
        ) : withdrawals.length === 0 ? (
          <div className="text-center py-10 text-gray-400">No withdrawal history found.</div>
        ) : (
          <table className="table w-full">
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Transaction ID</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((withdrawal) => (
                <tr key={withdrawal._id}>
                  <td>{new Date(withdrawal.createdAt).toLocaleDateString()}</td>
                  <td>${withdrawal.amount.toFixed(2)}</td>
                  <td>
                    <span className={`badge ${
                      withdrawal.status === 'completed' ? 'badge-success' :
                      withdrawal.status === 'pending' ? 'badge-warning' :
                      'badge-error'
                    }`}>
                      {withdrawal.status}
                    </span>
                  </td>
                  <td>{withdrawal.transactionId || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default VendorWithdrawalsHistory;
