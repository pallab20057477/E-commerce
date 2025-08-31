import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FaSave, FaEdit, FaUser, FaBuilding, FaMapMarkerAlt, FaPhone, FaEnvelope } from 'react-icons/fa';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const VendorSettings = () => {
  const { user } = useAuth();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    businessDescription: '',
    businessAddress: '',
    contactInfo: {
      phone: '',
      email: '',
      website: ''
    },
    businessType: '',
    taxId: '',
    bankInfo: {
      accountNumber: '',
      bankName: '',
      routingNumber: ''
    },
    categories: []
  });

  useEffect(() => {
    fetchVendorProfile();
  }, []);

  const fetchVendorProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/vendors/profile');
      
      if (response.data.success) {
        setVendor(response.data.vendor);
        setFormData({
          businessName: response.data.vendor.businessName || '',
          businessDescription: response.data.vendor.businessDescription || '',
          businessAddress: response.data.vendor.businessAddress || '',
          contactInfo: {
            phone: response.data.vendor.contactInfo?.phone || '',
            email: response.data.vendor.contactInfo?.email || '',
            website: response.data.vendor.contactInfo?.website || ''
          },
          businessType: response.data.vendor.businessType || '',
          taxId: response.data.vendor.taxId || '',
          bankInfo: {
            accountNumber: response.data.vendor.bankInfo?.accountNumber || '',
            bankName: response.data.vendor.bankInfo?.bankName || '',
            routingNumber: response.data.vendor.bankInfo?.routingNumber || ''
          },
          categories: response.data.vendor.categories || []
        });
      }
    } catch (error) {
      console.error('Error fetching vendor profile:', error);
      toast.error('Failed to load vendor profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await api.put('/vendors/profile', formData);
      
      if (response.data.success) {
        toast.success('Profile updated successfully');
        setIsEditing(false);
        fetchVendorProfile(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
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
      
      <div className="bg-base-100 shadow-xl rounded-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center">
            <FaUser className="mr-3" />
            Vendor Settings
          </h2>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="btn btn-primary"
          >
            <FaEdit className="mr-2" />
            {isEditing ? 'Cancel Edit' : 'Edit Profile'}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Business Information */}
          <div className="card bg-base-200">
            <div className="card-body">
              <h3 className="card-title flex items-center">
                <FaBuilding className="mr-2" />
                Business Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Business Name</span>
                  </label>
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    className="input input-bordered"
                    disabled={!isEditing}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Business Type</span>
                  </label>
                  <select
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleInputChange}
                    className="select select-bordered"
                    disabled={!isEditing}
                    required
                  >
                    <option value="">Select Business Type</option>
                    <option value="retail">Retail</option>
                    <option value="wholesale">Wholesale</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="service">Service</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-control md:col-span-2">
                  <label className="label">
                    <span className="label-text">Business Description</span>
                  </label>
                  <textarea
                    name="businessDescription"
                    value={formData.businessDescription}
                    onChange={handleInputChange}
                    className="textarea textarea-bordered h-24"
                    disabled={!isEditing}
                    placeholder="Describe your business..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="card bg-base-200">
            <div className="card-body">
              <h3 className="card-title flex items-center">
                <FaPhone className="mr-2" />
                Contact Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Phone Number</span>
                  </label>
                  <input
                    type="tel"
                    name="contactInfo.phone"
                    value={formData.contactInfo.phone}
                    onChange={handleInputChange}
                    className="input input-bordered"
                    disabled={!isEditing}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Email</span>
                  </label>
                  <input
                    type="email"
                    name="contactInfo.email"
                    value={formData.contactInfo.email}
                    onChange={handleInputChange}
                    className="input input-bordered"
                    disabled={!isEditing}
                  />
                </div>

                <div className="form-control md:col-span-2">
                  <label className="label">
                    <span className="label-text">Website</span>
                  </label>
                  <input
                    type="url"
                    name="contactInfo.website"
                    value={formData.contactInfo.website}
                    onChange={handleInputChange}
                    className="input input-bordered"
                    disabled={!isEditing}
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="card bg-base-200">
            <div className="card-body">
              <h3 className="card-title flex items-center">
                <FaMapMarkerAlt className="mr-2" />
                Business Address
              </h3>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Address</span>
                </label>
                <textarea
                  name="businessAddress"
                  value={formData.businessAddress}
                  onChange={handleInputChange}
                  className="textarea textarea-bordered h-20"
                  disabled={!isEditing}
                  placeholder="Enter your business address..."
                />
              </div>
            </div>
          </div>

          {/* Tax Information */}
          <div className="card bg-base-200">
            <div className="card-body">
              <h3 className="card-title">Tax Information</h3>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Tax ID</span>
                </label>
                <input
                  type="text"
                  name="taxId"
                  value={formData.taxId}
                  onChange={handleInputChange}
                  className="input input-bordered"
                  disabled={!isEditing}
                  placeholder="Enter your tax identification number"
                />
              </div>
            </div>
          </div>

          {/* Bank Information */}
          <div className="card bg-base-200">
            <div className="card-body">
              <h3 className="card-title">Bank Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Bank Name</span>
                  </label>
                  <input
                    type="text"
                    name="bankInfo.bankName"
                    value={formData.bankInfo.bankName}
                    onChange={handleInputChange}
                    className="input input-bordered"
                    disabled={!isEditing}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Account Number</span>
                  </label>
                  <input
                    type="text"
                    name="bankInfo.accountNumber"
                    value={formData.bankInfo.accountNumber}
                    onChange={handleInputChange}
                    className="input input-bordered"
                    disabled={!isEditing}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Routing Number</span>
                  </label>
                  <input
                    type="text"
                    name="bankInfo.routingNumber"
                    value={formData.bankInfo.routingNumber}
                    onChange={handleInputChange}
                    className="input input-bordered"
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Account Status */}
          <div className="card bg-base-200">
            <div className="card-body">
              <h3 className="card-title">Account Status</h3>
              
              <div className="stats stats-vertical lg:stats-horizontal shadow">
                <div className="stat">
                  <div className="stat-title">Status</div>
                  <div className="stat-value text-lg">
                    <span className={`badge ${vendor.status === 'approved' ? 'badge-success' : 'badge-warning'}`}>
                      {vendor.status}
                    </span>
                  </div>
                </div>
                
                <div className="stat">
                  <div className="stat-title">Total Products</div>
                  <div className="stat-value text-lg">{vendor.totalProducts || 0}</div>
                </div>
                
                <div className="stat">
                  <div className="stat-title">Total Sales</div>
                  <div className="stat-value text-lg">${vendor.totalSales || 0}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          {isEditing && (
            <div className="flex justify-end">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="loading loading-spinner loading-sm"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave className="mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default VendorSettings; 