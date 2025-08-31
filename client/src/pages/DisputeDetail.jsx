import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/axios';
import { toast } from 'react-hot-toast';
import { 
  FaExclamationTriangle, 
  FaUpload, 
  FaPaperPlane, 
  FaEye, 
  FaDownload,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaFlag,
  FaComments,
  FaUser,
  FaShoppingCart,
  FaBox,
  FaArrowLeft
} from 'react-icons/fa';

const DisputeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dispute, setDispute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [newAttachments, setNewAttachments] = useState([]);
  const [previewFiles, setPreviewFiles] = useState([]);

  useEffect(() => {
    fetchDispute();
  }, [id]);

  const fetchDispute = async () => {
    try {
      const response = await api.get(`/disputes/${id}`);
      setDispute(response.data);
    } catch (error) {
      toast.error('Failed to fetch dispute details');
      navigate('/disputes');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() && newAttachments.length === 0) {
      toast.error('Please enter a message or attach files');
      return;
    }

    setSending(true);
    
    try {
      const formData = new FormData();
      formData.append('message', newMessage);
      
      newAttachments.forEach(file => {
        formData.append('attachments', file);
      });

      await api.post(`/disputes/${id}/messages`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setNewMessage('');
      setNewAttachments([]);
      setPreviewFiles([]);
      fetchDispute(); // Refresh dispute data
      toast.success('Message sent successfully');
      
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send message';
      toast.error(message);
    } finally {
      setSending(false);
    }
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
    setNewAttachments(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setNewAttachments(prev => prev.filter((_, i) => i !== index));
    setPreviewFiles(prev => {
      const newPreviews = prev.filter((_, i) => i !== index);
      if (prev[index]?.preview) {
        URL.revokeObjectURL(prev[index].preview);
      }
      return newPreviews;
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return <FaExclamationTriangle className="text-warning" />;
      case 'under_review':
        return <FaHourglassHalf className="text-info" />;
      case 'resolved':
        return <FaCheckCircle className="text-success" />;
      case 'closed':
        return <FaTimesCircle className="text-error" />;
      case 'escalated':
        return <FaFlag className="text-error" />;
      default:
        return <FaClock className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'badge-warning';
      case 'under_review':
        return 'badge-info';
      case 'resolved':
        return 'badge-success';
      case 'closed':
        return 'badge-error';
      case 'escalated':
        return 'badge-error';
      default:
        return 'badge-ghost';
    }
  };

  const getCategoryLabel = (category) => {
    const labels = {
      delivery_issue: 'Delivery Issue',
      fake_bidding: 'Fake Bidding',
      item_not_as_described: 'Item Not As Described',
      payment_issue: 'Payment Issue',
      refund_request: 'Refund Request',
      seller_misconduct: 'Seller Misconduct',
      buyer_misconduct: 'Buyer Misconduct',
      technical_issue: 'Technical Issue',
      other: 'Other'
    };
    return labels[category] || category;
  };

  const getResolutionLabel = (resolution) => {
    const labels = {
      refund_full: 'Full Refund',
      refund_partial: 'Partial Refund',
      replacement: 'Replacement',
      compensation: 'Compensation',
      warning_issued: 'Warning Issued',
      account_suspended: 'Account Suspended',
      dispute_dismissed: 'Dispute Dismissed',
      mediation_required: 'Mediation Required'
    };
    return labels[resolution] || resolution;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Dispute not found</h2>
        <button onClick={() => navigate('/disputes')} className="btn btn-primary mt-4">
          Back to Disputes
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <button 
          onClick={() => navigate('/disputes')}
          className="btn btn-ghost mb-4"
        >
          <FaArrowLeft className="mr-2" />
          Back to Disputes
        </button>
        
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {getStatusIcon(dispute.status)}
              <h1 className="text-3xl font-bold text-gray-900">{dispute.title}</h1>
              <span className={`badge ${getStatusColor(dispute.status)}`}>
                {dispute.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <p className="text-gray-600">Dispute ID: {dispute.disputeId}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dispute Information */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-xl mb-4">Dispute Details</h2>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold mb-2">Category</h3>
                  <p className="text-gray-600">{getCategoryLabel(dispute.category)}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Priority</h3>
                  <span className={`badge badge-${dispute.priority === 'urgent' ? 'error' : dispute.priority === 'high' ? 'warning' : 'info'}`}>
                    {dispute.priority.toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Created</h3>
                  <p className="text-gray-600">{formatDate(dispute.createdAt)}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Last Updated</h3>
                  <p className="text-gray-600">{formatDate(dispute.updatedAt)}</p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{dispute.description}</p>
              </div>

              {/* Resolution Details */}
              {dispute.resolution && (
                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-2">Resolution</h3>
                  <div className="bg-base-200 p-4 rounded-lg">
                    <div className="grid md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <strong>Resolution:</strong> {getResolutionLabel(dispute.resolution)}
                      </div>
                      {dispute.resolutionAmount && (
                        <div>
                          <strong>Amount:</strong> ${dispute.resolutionAmount}
                        </div>
                      )}
                    </div>
                    {dispute.resolutionNotes && (
                      <div>
                        <strong>Notes:</strong>
                        <p className="mt-1 text-gray-700">{dispute.resolutionNotes}</p>
                      </div>
                    )}
                    {dispute.resolvedBy && (
                      <div className="mt-3 text-sm text-gray-600">
                        Resolved by {dispute.resolvedBy.name} on {formatDate(dispute.resolvedAt)}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-xl mb-4">
                <FaComments className="mr-2" />
                Messages ({dispute.messages?.length || 0})
              </h2>
              
              <div className="space-y-4 mb-6">
                {dispute.messages?.map((message, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <FaUser className="text-gray-500" />
                        <span className="font-semibold">{message.sender.name}</span>
                        <span className="text-sm text-gray-500">({message.sender.email})</span>
                      </div>
                      <span className="text-sm text-gray-500">{formatDate(message.createdAt)}</span>
                    </div>
                    
                    <p className="text-gray-700 mb-3">{message.message}</p>
                    
                    {message.attachments?.length > 0 && (
                      <div className="grid md:grid-cols-2 gap-2">
                        {message.attachments.map((attachment, attIndex) => (
                          <div key={attIndex} className="border rounded p-2">
                            <div className="flex items-center gap-2">
                              {attachment.type === 'image' ? (
                                <img
                                  src={attachment.url}
                                  alt={attachment.originalName}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              ) : (
                                <FaBox className="w-12 h-12 text-gray-400" />
                              )}
                              <div className="flex-1">
                                <p className="text-sm font-medium">{attachment.originalName}</p>
                                <p className="text-xs text-gray-500">{attachment.type}</p>
                              </div>
                              <a
                                href={attachment.url}
                                download
                                className="btn btn-ghost btn-sm"
                              >
                                <FaDownload />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* New Message Form */}
              {dispute.status !== 'resolved' && dispute.status !== 'closed' && (
                <form onSubmit={handleSendMessage} className="border-t pt-6">
                  <h3 className="font-semibold mb-4">Add Message</h3>
                  
                  <div className="mb-4">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message here..."
                      className="textarea textarea-bordered w-full h-24"
                    />
                  </div>

                  {/* File Upload */}
                  <div className="mb-4">
                    <label className="label">
                      <span className="label-text">Attachments (optional)</span>
                    </label>
                    <input
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="file-input file-input-bordered w-full"
                    />
                  </div>

                  {/* File Previews */}
                  {previewFiles.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold mb-2">Attachments:</h4>
                      <div className="grid md:grid-cols-2 gap-2">
                        {previewFiles.map((file, index) => (
                          <div key={index} className="border rounded p-2">
                            <div className="flex items-center gap-2">
                              {file.preview ? (
                                <img
                                  src={file.preview}
                                  alt={file.name}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              ) : (
                                <FaBox className="w-12 h-12 text-gray-400" />
                              )}
                              <div className="flex-1">
                                <p className="text-sm font-medium">{file.name}</p>
                                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="btn btn-ghost btn-sm text-error"
                              >
                                <FaTimes />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={sending || (!newMessage.trim() && newAttachments.length === 0)}
                  >
                    {sending ? (
                      <>
                        <div className="loading loading-spinner loading-sm"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <FaPaperPlane className="mr-2" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Parties Involved */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-xl mb-4">Parties Involved</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-success mb-2">Complainant</h3>
                  <div className="bg-base-200 p-3 rounded">
                    <p className="font-medium">{dispute.complainant.name}</p>
                    <p className="text-sm text-gray-600">{dispute.complainant.email}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-error mb-2">Respondent</h3>
                  <div className="bg-base-200 p-3 rounded">
                    <p className="font-medium">{dispute.respondent.name}</p>
                    <p className="text-sm text-gray-600">{dispute.respondent.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Related Information */}
          {(dispute.order || dispute.product) && (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title text-xl mb-4">Related Information</h2>
                
                {dispute.order && (
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2 flex items-center">
                      <FaShoppingCart className="mr-2" />
                      Order
                    </h3>
                    <div className="bg-base-200 p-3 rounded">
                      <p className="font-medium">{dispute.order.orderNumber}</p>
                      <p className="text-sm text-gray-600">${dispute.order.totalAmount}</p>
                      <p className="text-sm text-gray-600">Status: {dispute.order.status}</p>
                    </div>
                  </div>
                )}
                
                {dispute.product && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center">
                      <FaBox className="mr-2" />
                      Product
                    </h3>
                    <div className="bg-base-200 p-3 rounded">
                      <p className="font-medium">{dispute.product.name}</p>
                      <p className="text-sm text-gray-600">${dispute.product.price}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Evidence */}
          {dispute.evidence?.length > 0 && (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title text-xl mb-4">Evidence Files</h2>
                
                <div className="space-y-3">
                  {dispute.evidence.map((evidence, index) => (
                    <div key={index} className="border rounded p-3">
                      <div className="flex items-center gap-3">
                        {evidence.type === 'image' ? (
                          <img
                            src={evidence.url}
                            alt={evidence.originalName}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <FaBox className="w-12 h-12 text-gray-400" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-sm">{evidence.originalName}</p>
                          <p className="text-xs text-gray-500">
                            Uploaded by {evidence.uploadedBy.name} on {formatDate(evidence.uploadedAt)}
                          </p>
                        </div>
                        <a
                          href={evidence.url}
                          download
                          className="btn btn-ghost btn-sm"
                        >
                          <FaDownload />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DisputeDetail; 