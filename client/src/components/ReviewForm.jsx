import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FaStar, FaUpload, FaTimes, FaCheck } from 'react-icons/fa';
import api from '../utils/api';
import toast from 'react-hot-toast';

const ReviewForm = ({ productId, onReviewSubmitted, onCancel }) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [images, setImages] = useState([]  );
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [orderInfo, setOrderInfo] = useState(null);

  useEffect(() => {
    checkReviewEligibility();
  }, [productId]);

  const checkReviewEligibility = async () => {
    try {
      const response = await api.get(`/reviews/check-eligibility/${productId}`);
      setCanReview(response.data.canReview);
      if (response.data.orderInfo) {
        setOrderInfo(response.data.orderInfo);
      }
    } catch (error) {
      console.error('Error checking review eligibility:', error);
      setCanReview(false);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length + images.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    setUploading(true);
    const uploadedImages = [];

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum 5MB per image.`);
        continue;
      }

      const formData = new FormData();
      formData.append('image', file);

      try {
        const response = await api.post('/upload/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedImages.push({
          url: response.data.url,
          caption: ''
        });
      } catch (error) {
        console.error('Error uploading image:', error);
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    setImages(prev => [...prev, ...uploadedImages]);
    setUploading(false);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (!title.trim()) {
      toast.error('Please enter a review title');
      return;
    }

    if (!comment.trim()) {
      toast.error('Please enter a review comment');
      return;
    }

    setSubmitting(true);

    try {
      const reviewData = {
        product: productId,
        rating,
        title: title.trim(),
        comment: comment.trim(),
        images,
        order: orderInfo?._id // Include order ID if available
      };

      const response = await api.post('/reviews', reviewData);
      
      toast.success('Review submitted successfully!');
      onReviewSubmitted(response.data);
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (!canReview) {
    return (
      <div className="text-center py-8">
        <div className="text-6xl text-gray-300 mb-4">📦</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          Cannot Review This Product
        </h3>
        <p className="text-gray-600 mb-4">
          You can only review products that have been delivered to you.
        </p>
        <button
          onClick={onCancel}
          className="btn btn-outline"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Order Information */}
      {orderInfo && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">Order Information</h4>
          <p className="text-sm text-blue-700">
            Order #{orderInfo._id.slice(-8)} • Delivered on{' '}
            {new Date(orderInfo.deliveredAt || orderInfo.updatedAt).toLocaleDateString()}
          </p>
        </div>
      )}

      {/* Rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rating *
        </label>
        <div className="flex items-center space-x-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`text-2xl transition-colors ${
                star <= rating ? 'text-yellow-400' : 'text-gray-300'
              } hover:text-yellow-400`}
            >
              <FaStar />
            </button>
          ))}
          <span className="ml-2 text-sm text-gray-600">
            {rating > 0 && `${rating} star${rating > 1 ? 's' : ''}`}
          </span>
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Review Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          className="input input-bordered w-full"
          placeholder="Summarize your experience"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          {title.length}/100 characters
        </p>
      </div>

      {/* Comment */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Review Comment *
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={1000}
          rows={4}
          className="textarea textarea-bordered w-full"
          placeholder="Share your detailed experience with this product..."
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          {comment.length}/1000 characters
        </p>
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Add Photos (Optional)
        </label>
        <div className="space-y-4">
          {/* Upload Button */}
          {images.length < 5 && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
                disabled={uploading}
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <FaUpload className="text-2xl text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  {uploading ? 'Uploading...' : 'Click to upload images'}
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  PNG, JPG up to 5MB each (max 5 images)
                </span>
              </label>
            </div>
          )}

          {/* Image Preview */}
          {images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image.url}
                    alt={`Review ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <FaTimes size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-outline"
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting || rating === 0}
        >
          {submitting ? (
            <>
              <div className="loading loading-spinner loading-sm"></div>
              Submitting...
            </>
          ) : (
            <>
              <FaCheck className="mr-2" />
              Submit Review
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default ReviewForm; 