import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { toast } from 'react-hot-toast';
import { FaTicketAlt, FaPlus, FaTrash, FaEdit, FaEye, FaCalendarAlt, FaUsers, FaPercentage } from 'react-icons/fa';

const CouponManager = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    type: 'percentage',
    value: '',
    minOrderAmount: '',
    maxDiscount: '',
    usageLimit: '',
    userUsageLimit: '1',
    validFrom: '',
    validUntil: '',
    applicableCategories: [],
    applicableProducts: [],
    excludedProducts: []
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await api.get('/coupons/admin');
      setCoupons(response.data.coupons);
    } catch (error) {
      toast.error('Failed to fetch coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/coupons/admin', formData);
      toast.success('Coupon created successfully');
      setShowForm(false);
      setFormData({
        code: '',
        name: '',
        description: '',
        type: 'percentage',
        value: '',
        minOrderAmount: '',
        maxDiscount: '',
        usageLimit: '',
        userUsageLimit: '1',
        validFrom: '',
        validUntil: '',
        applicableCategories: [],
        applicableProducts: [],
        excludedProducts: []
      });
      fetchCoupons();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create coupon');
    }
  };

  const handleDelete = async (couponId) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      try {
        await api.delete(`/coupons/admin/${couponId}`);
        toast.success('Coupon deleted successfully');
        fetchCoupons();
      } catch (error) {
        toast.error('Failed to delete coupon');
      }
    }
  };

  const getStatusBadge = (coupon) => {
    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validUntil = new Date(coupon.validUntil);

    if (!coupon.isActive) return <span className="badge badge-error badge-lg">Inactive</span>;
    if (now < validFrom) return <span className="badge badge-warning badge-lg">Upcoming</span>;
    if (now > validUntil) return <span className="badge badge-error badge-lg">Expired</span>;
    return <span className="badge badge-success badge-lg">Active</span>;
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'percentage':
        return <FaPercentage className="text-blue-500" />;
      case 'fixed':
        return <span className="text-green-500">$</span>;
      case 'free_shipping':
        return <span className="text-purple-500">🚚</span>;
      default:
        return <FaTicketAlt />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-base-100 to-base-200 flex items-center justify-center">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
          <p className="text-lg">Loading coupons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 to-base-200">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
            Coupon Management
          </h1>
          <p className="text-lg text-base-content/70">
            Create and manage discount coupons for your customers
          </p>
        </div>

        {/* Action Button */}
        <div className="flex justify-between items-center mb-6">
          <div className="stats shadow">
            <div className="stat">
              <div className="stat-figure text-primary">
                <FaTicketAlt className="text-2xl" />
              </div>
              <div className="stat-title">Total Coupons</div>
              <div className="stat-value text-primary">{coupons.length}</div>
            </div>
          </div>
          
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary btn-lg shadow-lg hover:scale-105 transform transition-transform"
          >
            <FaPlus className="mr-2" />
            {showForm ? 'Cancel' : 'Create Coupon'}
          </button>
        </div>

        {/* Create Form */}
        {showForm && (
          <div className="card bg-base-100 shadow-2xl mb-8 transform hover:scale-105 transition-transform duration-300">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-6">
                <FaTicketAlt className="text-2xl mr-2" />
                Create New Coupon
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Coupon Code</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered input-lg"
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value})}
                      required
                      placeholder="SAVE20"
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Name</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered input-lg"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                      placeholder="Summer Sale Discount"
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Type</span>
                    </label>
                    <select
                      className="select select-bordered select-lg"
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                    >
                      <option value="percentage">Percentage Discount</option>
                      <option value="fixed">Fixed Amount</option>
                      <option value="free_shipping">Free Shipping</option>
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Value</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered input-lg"
                      value={formData.value}
                      onChange={(e) => setFormData({...formData, value: e.target.value})}
                      required
                      placeholder={formData.type === 'percentage' ? '20' : '10'}
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Minimum Order Amount</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered input-lg"
                      value={formData.minOrderAmount}
                      onChange={(e) => setFormData({...formData, minOrderAmount: e.target.value})}
                      placeholder="50"
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Max Discount</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered input-lg"
                      value={formData.maxDiscount}
                      onChange={(e) => setFormData({...formData, maxDiscount: e.target.value})}
                      placeholder="100"
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Usage Limit</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered input-lg"
                      value={formData.usageLimit}
                      onChange={(e) => setFormData({...formData, usageLimit: e.target.value})}
                      placeholder="-1 for unlimited"
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">User Usage Limit</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered input-lg"
                      value={formData.userUsageLimit}
                      onChange={(e) => setFormData({...formData, userUsageLimit: e.target.value})}
                      placeholder="1"
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Valid From</span>
                    </label>
                    <input
                      type="datetime-local"
                      className="input input-bordered input-lg"
                      value={formData.validFrom}
                      onChange={(e) => setFormData({...formData, validFrom: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Valid Until</span>
                    </label>
                    <input
                      type="datetime-local"
                      className="input input-bordered input-lg"
                      value={formData.validUntil}
                      onChange={(e) => setFormData({...formData, validUntil: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Description</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered textarea-lg"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows="3"
                    placeholder="Describe the coupon and its benefits..."
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="btn btn-ghost btn-lg"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-lg shadow-lg">
                    <FaPlus className="mr-2" />
                    Create Coupon
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Coupons Table */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-6">
              <FaTicketAlt className="text-2xl mr-2" />
              All Coupons
            </h2>
            
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Value</th>
                    <th>Usage</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon) => (
                    <tr key={coupon._id} className="hover:bg-base-200 transition-colors">
                      <td>
                        <div className="font-mono font-bold text-lg bg-base-300 px-3 py-1 rounded-lg">
                          {coupon.code}
                        </div>
                      </td>
                      <td>
                        <div>
                          <div className="font-semibold">{coupon.name}</div>
                          {coupon.description && (
                            <div className="text-sm text-base-content/70">{coupon.description}</div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(coupon.type)}
                          <span className="font-medium">
                            {coupon.type === 'percentage' ? 'Percentage' : 
                             coupon.type === 'fixed' ? 'Fixed' : 'Free Shipping'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="font-bold text-lg">
                          {coupon.type === 'percentage' ? `${coupon.value}%` : 
                           coupon.type === 'fixed' ? `$${coupon.value}` : 'Free Shipping'}
                        </div>
                        {coupon.minOrderAmount > 0 && (
                          <div className="text-sm text-base-content/70">
                            Min: ${coupon.minOrderAmount}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="text-center">
                          <div className="font-bold">{coupon.usedCount}</div>
                          <div className="text-sm text-base-content/70">
                            / {coupon.usageLimit === -1 ? '∞' : coupon.usageLimit}
                          </div>
                        </div>
                      </td>
                      <td>{getStatusBadge(coupon)}</td>
                      <td>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleDelete(coupon._id)}
                            className="btn btn-sm btn-error"
                            title="Delete Coupon"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {coupons.length === 0 && (
              <div className="text-center py-12">
                <FaTicketAlt className="text-6xl text-base-content/30 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-base-content/50 mb-2">No coupons yet</h3>
                <p className="text-base-content/50">
                  Create your first coupon to start offering discounts to customers!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CouponManager; 