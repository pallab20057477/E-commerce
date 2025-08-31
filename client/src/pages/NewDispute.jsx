import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axios';
import { toast } from 'react-hot-toast';
import { 
  FaExclamationTriangle, 
  FaUpload, 
  FaTimes, 
  FaEye, 
  FaTrash,
  FaUser,
  FaShoppingCart,
  FaBox,
  FaGavel
} from 'react-icons/fa';

const NewDispute = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    respondentId: '',
    orderId: '',
    productId: '',
    category: '',
    priority: 'medium'
  });

  const [evidence, setEvidence] = useState([]);
  const [previewFiles, setPreviewFiles] = useState([]);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const [ordersRes, productsRes] = await Promise.all([
        api.get('/orders'),
        api.get('/products?limit=50')
      ]);
      
      setOrders(ordersRes.data.orders || []);
      setProducts(productsRes.data.products || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name} is not a supported file type`);
        return false;
      }
      
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return false;
      }
      
      return true;
    });

    // Create preview URLs for images
    const newPreviews = validFiles.map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      name: file.name,
      size: file.size
    }));

    setPreviewFiles(prev => [...prev, ...newPreviews]);
    setEvidence(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setEvidence(prev => prev.filter((_, i) => i !== index));
    setPreviewFiles(prev => {
      const newPreviews = prev.filter((_, i) => i !== index);
      // Revoke object URL to prevent memory leaks
      if (prev[index]?.preview) {
        URL.revokeObjectURL(prev[index].preview);
      }
      return newPreviews;
    });
  };

  const getCategoryDescription = (category) => {
    const descriptions = {
      delivery_issue: 'Problems with shipping, delivery delays, or damaged items during transit',
      fake_bidding: 'Suspicious bidding activity, shill bidding, or artificial price inflation',
      item_not_as_described: 'Product received differs significantly from the listing description',
      payment_issue: 'Problems with payment processing, unauthorized charges, or refund issues',
      refund_request: 'Request for refund due to dissatisfaction or product issues',
      seller_misconduct: 'Unprofessional behavior, harassment, or policy violations by seller',
      buyer_misconduct: 'Unprofessional behavior, harassment, or policy violations by buyer',
      technical_issue: 'Website problems, system errors, or technical difficulties',
      other: 'Any other issue not covered by the above categories'
    };
    return descriptions[category] || '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.respondentId || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    
    try {
      const formDataToSend = new FormData();
      
      // Add form fields
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      // Add evidence files
      evidence.forEach(file => {
        formDataToSend.append('evidence', file);
      });

      const response = await api.post('/disputes', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Dispute created successfully');
      navigate(`/disputes/${response.data.dispute._id}`);
      
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create dispute';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Dispute</h1>
        <p className="text-gray-600">
          Submit a dispute to resolve conflicts with other users, orders, or products
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-xl mb-4">
              <FaExclamationTriangle className="text-warning" />
              Dispute Information
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="label">
                  <span className="label-text font-semibold">Title *</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Brief description of the issue"
                  className="input input-bordered w-full"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="label">
                  <span className="label-text font-semibold">Description *</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Provide detailed information about the dispute..."
                  className="textarea textarea-bordered w-full h-32"
                  required
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-semibold">Category *</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="select select-bordered w-full"
                  required
                >
                  <option value="">Select a category</option>
                  <option value="delivery_issue">Delivery Issue</option>
                  <option value="fake_bidding">Fake Bidding</option>
                  <option value="item_not_as_described">Item Not As Described</option>
                  <option value="payment_issue">Payment Issue</option>
                  <option value="refund_request">Refund Request</option>
                  <option value="seller_misconduct">Seller Misconduct</option>
                  <option value="buyer_misconduct">Buyer Misconduct</option>
                  <option value="technical_issue">Technical Issue</option>
                  <option value="other">Other</option>
                </select>
                {formData.category && (
                  <p className="text-sm text-gray-600 mt-2">
                    {getCategoryDescription(formData.category)}
                  </p>
                )}
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-semibold">Priority</span>
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="select select-bordered w-full"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Related Information */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-xl mb-4">
              <FaUser className="text-primary" />
              Related Information
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="label">
                  <span className="label-text font-semibold">Respondent *</span>
                </label>
                <select
                  name="respondentId"
                  value={formData.respondentId}
                  onChange={handleInputChange}
                  className="select select-bordered w-full"
                  required
                >
                  <option value="">Select the person you're disputing with</option>
                  {/* This would be populated with users from orders/products */}
                  <option value="user1">John Doe (john@example.com)</option>
                  <option value="user2">Jane Smith (jane@example.com)</option>
                </select>
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-semibold">Related Order</span>
                </label>
                <select
                  name="orderId"
                  value={formData.orderId}
                  onChange={handleInputChange}
                  className="select select-bordered w-full"
                >
                  <option value="">Select an order (optional)</option>
                  {orders.map(order => (
                    <option key={order._id} value={order._id}>
                      {order.orderNumber} - ${order.totalAmount}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-semibold">Related Product</span>
                </label>
                <select
                  name="productId"
                  value={formData.productId}
                  onChange={handleInputChange}
                  className="select select-bordered w-full"
                >
                  <option value="">Select a product (optional)</option>
                  {products.map(product => (
                    <option key={product._id} value={product._id}>
                      {product.name} - ${product.price}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Evidence Upload */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-xl mb-4">
              <FaUpload className="text-secondary" />
              Evidence & Attachments
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text font-semibold">Upload Evidence</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                    id="evidence-upload"
                  />
                  <label htmlFor="evidence-upload" className="cursor-pointer">
                    <FaUpload className="text-4xl text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">
                      Click to upload evidence files
                    </p>
                    <p className="text-sm text-gray-500">
                      Supported: Images (JPG, PNG, GIF), PDF, Documents (DOC, DOCX)
                      <br />
                      Max file size: 10MB per file
                    </p>
                  </label>
                </div>
              </div>

              {/* File Previews */}
              {previewFiles.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Uploaded Files:</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {previewFiles.map((file, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {file.preview ? (
                              <img
                                src={file.preview}
                                alt={file.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                                <FaBox className="text-gray-500" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-sm">{file.name}</p>
                              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="btn btn-ghost btn-sm text-error"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/disputes')}
            className="btn btn-outline"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <div className="loading loading-spinner loading-sm"></div>
                Creating Dispute...
              </>
            ) : (
              <>
                <FaExclamationTriangle className="mr-2" />
                Create Dispute
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewDispute; 