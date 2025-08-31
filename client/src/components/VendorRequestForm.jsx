import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FaUpload, FaBuilding, FaMapMarkerAlt, FaPhone, FaGlobe } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../api';

const VendorRequestForm = ({ onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    message: '',
    businessDetails: {
      businessName: '',
      businessType: 'individual',
      businessAddress: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      },
      phone: '',
      website: ''
    }
  });
  const [uploadingDoc, setUploadingDoc] = useState({});
  const [cloudDocs, setCloudDocs] = useState({});
  const [documentErrors, setDocumentErrors] = useState({});

  const requiredDocuments = {
    idProof: {
      label: 'ID Proof (Aadhar Card/PAN Card/Passport)',
      description: 'Government issued ID proof for identity verification',
      required: true
    },
    businessLicense: {
      label: 'Business License/Registration',
      description: 'Official business registration or license document',
      required: true
    },
    taxCertificate: {
      label: 'Tax Registration Certificate',
      description: 'GST registration or tax certificate',
      required: true
    },
    bankStatement: {
      label: 'Bank Statement (Last 3 months)',
      description: 'Recent bank statements showing business transactions',
      required: true
    },
    addressProof: {
      label: 'Address Proof',
      description: 'Utility bill, rental agreement, or property documents',
      required: true
    }
  };

  const handleChange = (e) => {
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
    } else if (name.includes('address.')) {
      const field = name.split('address.')[1];
      setFormData(prev => ({
        ...prev,
        businessDetails: {
          ...prev.businessDetails,
          businessAddress: {
            ...prev.businessDetails.businessAddress,
            [field]: value
          }
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileChange = async (docType, file) => {
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setDocumentErrors(prev => ({
          ...prev,
          [docType]: 'Please upload a valid file (JPG, PNG, or PDF)'
        }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setDocumentErrors(prev => ({
          ...prev,
          [docType]: 'File size must be less than 5MB'
        }));
        return;
      }
      setUploadingDoc(prev => ({ ...prev, [docType]: true }));
      
      try {
        const formData = new FormData();
        formData.append('image', file);
        const res = await api.post('/upload/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        setCloudDocs(prev => ({
          ...prev,
          [docType]: {
            url: res.data.url,
            originalName: file.name,
            type: docType
          }
        }));
        setDocumentErrors(prev => ({ ...prev, [docType]: null }));
      } catch (err) {
        setDocumentErrors(prev => ({ ...prev, [docType]: 'Upload failed. Try again.' }));
      } finally {
        setUploadingDoc(prev => ({ ...prev, [docType]: false }));
      }
    }
  };

  const removeDocument = (docType) => {
    setCloudDocs(prev => {
      const newDocs = { ...prev };
      delete newDocs[docType];
      return newDocs;
    });
    setDocumentErrors(prev => ({ ...prev, [docType]: null }));
  };

  const validateDocuments = () => {
    const errors = {};
    Object.keys(requiredDocuments).forEach(docType => {
      if (requiredDocuments[docType].required && !cloudDocs[docType]) {
        errors[docType] = 'This document is required';
      }
    });
    setDocumentErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const token = localStorage.getItem('token');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error('You must be logged in to become a vendor.');
      return;
    }

    if (!validateDocuments()) {
      toast.error('Please upload all required documents');
      return;
    }

    setLoading(true);

    try {
      const mapDocType = {
        idProof: 'id_proof',
        businessLicense: 'business_license',
        taxCertificate: 'tax_certificate',
        bankStatement: 'bank_statement',
        addressProof: 'address_proof'
      };
      const payload = {
        message: formData.message,
        businessDetails: formData.businessDetails,
        documents: Object.keys(cloudDocs).map(docType => ({
          type: mapDocType[docType] || docType,
          url: cloudDocs[docType].url,
          originalName: cloudDocs[docType].originalName
        }))
      };
      
      const response = await api.post('/vendor-requests', payload, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      toast.success('Vendor request submitted successfully! Our team will review your documents and get back to you within 2-3 business days.');
      setFormData({
        message: '',
        businessDetails: {
          businessName: '',
          businessType: 'individual',
          businessAddress: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: ''
          },
          phone: '',
          website: ''
        }
      });
      setCloudDocs({});
      setDocumentErrors({});
      if (onSuccess) onSuccess();
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Upload failed';
      toast.error(msg.includes('Network') ? 'Network error, please try again.' : msg);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role === 'vendor') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center text-green-700">
          <FaBuilding className="mr-2" />
          <h3 className="text-lg font-semibold">You are already a vendor!</h3>
        </div>
        <p className="text-green-600 mt-2">
          You can access your vendor dashboard to manage your products and sales.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Become a Vendor</h2>
        <p className="text-gray-600">
          Submit your application to become a vendor on BidCart. Our team will review your request and get back to you within 2-3 business days.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Message Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Why do you want to become a vendor? *
          </label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="Tell us about your business, products, and why you want to join BidCart as a vendor..."
          />
        </div>

        {/* Business Details Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FaBuilding className="mr-2" />
            Business Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Name *
              </label>
              <input
                type="text"
                name="businessDetails.businessName"
                value={formData.businessDetails.businessName}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Your business name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Type *
              </label>
              <select
                name="businessDetails.businessType"
                value={formData.businessDetails.businessType}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="individual">Individual</option>
                <option value="company">Company</option>
                <option value="partnership">Partnership</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <FaPhone className="mr-1" />
                Business Phone
              </label>
              <input
                type="tel"
                name="businessDetails.phone"
                value={formData.businessDetails.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Business phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <FaGlobe className="mr-1" />
                Website
              </label>
              <input
                type="url"
                name="businessDetails.website"
                value={formData.businessDetails.website}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="https://yourwebsite.com"
              />
            </div>
          </div>

          {/* Business Address */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <FaMapMarkerAlt className="mr-1" />
              Business Address
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="address.street"
                value={formData.businessDetails.businessAddress.street}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Street address"
              />
              <input
                type="text"
                name="address.city"
                value={formData.businessDetails.businessAddress.city}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="City"
              />
              <input
                type="text"
                name="address.state"
                value={formData.businessDetails.businessAddress.state}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="State/Province"
              />
              <input
                type="text"
                name="address.zipCode"
                value={formData.businessDetails.businessAddress.zipCode}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="ZIP/Postal code"
              />
              <input
                type="text"
                name="address.country"
                value={formData.businessDetails.businessAddress.country}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Country"
              />
            </div>
          </div>
        </div>

        {/* Documents Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FaUpload className="mr-2" />
            Required Documents
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Please upload the following documents for verification. All documents are required and will be reviewed by our team.
          </p>
          
          <div className="space-y-4">
            {Object.keys(requiredDocuments).map((docType) => (
              <div key={docType} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {requiredDocuments[docType].label} *
                    </label>
                    <p className="text-sm text-gray-500 mb-2">
                      {requiredDocuments[docType].description}
                    </p>
                    
                    {cloudDocs[docType] ? (
                      <div className="flex items-center space-x-2">
                        <FaUpload className="text-green-500" />
                        <span className="text-sm text-green-600">
                          {cloudDocs[docType].originalName}
                        </span>
                        {cloudDocs[docType].type?.startsWith('image/') && (
                          <img src={cloudDocs[docType].url} alt="preview" className="w-8 h-8 rounded" />
                        )}
                        {cloudDocs[docType].type === 'application/pdf' && (
                          <a href={cloudDocs[docType].url} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline ml-2">View PDF</a>
                        )}
                        <button
                          type="button"
                          aria-label={`Remove ${requiredDocuments[docType].label}`}
                          onClick={() => removeDocument(docType)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileChange(docType, e.target.files[0])}
                          className="hidden"
                          id={`document-${docType}`}
                        />
                        <label htmlFor={`document-${docType}`} className="cursor-pointer">
                          <div className="text-center">
                            <FaUpload className="mx-auto h-8 w-8 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-600">
                              Click to upload or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">
                              PDF, DOC, DOCX, JPG, PNG up to 5MB
                            </p>
                          </div>
                        </label>
                      </div>
                    )}
                    
                    {documentErrors[docType] && (
                      <p className="text-sm text-red-600 mt-1">
                        {documentErrors[docType]}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="border-t pt-6">
          <button
            type="submit"
            disabled={loading || !token}
            className="w-full bg-primary text-white py-3 px-4 rounded-md hover:bg-primary-focus focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            aria-label="Submit Vendor Request"
          >
            {loading ? <span className="loading loading-spinner loading-sm mr-2"></span> : null}
            {loading ? 'Submitting...' : 'Submit Vendor Request'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VendorRequestForm;
