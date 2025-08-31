import api from '../utils/api';
import toast from 'react-hot-toast';

/**
 * Professional Product Service for frontend
 */
class ProductService {
  /**
   * Create a new product with comprehensive validation
   */
  static async createProduct(productData, onProgress = null) {
    try {
      // Validate required fields
      const validation = this.validateProductData(productData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Create FormData for file upload
      const formData = new FormData();
      
      // Add basic product data
      Object.keys(productData).forEach(key => {
        if (key !== 'images' && key !== 'variants' && key !== 'auction') {
          formData.append(key, productData[key]);
        }
      });

      // Add auction data if mode is auction
      if (productData.mode === 'auction' && productData.auction) {
        formData.append('auction', JSON.stringify(productData.auction));
      }

      // Add images
      if (productData.images && productData.images.length > 0) {
        productData.images.forEach((image, index) => {
          formData.append('images', image);
        });
      }

      // Add variants
      if (productData.variants && productData.variants.length > 0) {
        formData.append('variants', JSON.stringify(productData.variants.map(v => ({
          ...v,
          image: undefined // images handled separately
        }))));
        
        // Add variant images
        productData.variants.forEach((variant, index) => {
          if (variant.image) {
            formData.append('variantImages', variant.image);
          }
        });
      }

      // Make API call with progress tracking
      const response = await api.post('/vendors/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        }
      });

      return {
        success: true,
        product: response.data.product,
        message: response.data.message
      };

    } catch (error) {
      const message = this.handleError(error);
      throw new Error(message);
    }
  }

  /**
   * Update an existing product
   */
  static async updateProduct(productId, productData, onProgress = null) {
    try {
      // Validate required fields
      const validation = this.validateProductData(productData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Create FormData for file upload
      const formData = new FormData();
      
      // Add basic product data
      Object.keys(productData).forEach(key => {
        if (key !== 'images' && key !== 'newImages' && key !== 'variants' && key !== 'auction' && key !== 'existingImages') {
          formData.append(key, productData[key]);
        }
      });

      // Add auction data if mode is auction
      if (productData.mode === 'auction' && productData.auction) {
        formData.append('auction', JSON.stringify(productData.auction));
      }

      // Add existing images
      if (productData.existingImages) {
        formData.append('existingImages', JSON.stringify(productData.existingImages));
      }

      // Add new images
      if (productData.newImages && productData.newImages.length > 0) {
        productData.newImages.forEach((image) => {
          formData.append('images', image);
        });
      }

      // Add variants
      if (productData.variants && productData.variants.length > 0) {
        formData.append('variants', JSON.stringify(productData.variants.map(v => ({
          ...v,
          image: undefined // images handled separately
        }))));
        
        // Add variant images
        productData.variants.forEach((variant, index) => {
          if (variant.image && variant.image instanceof File) {
            formData.append('variantImages', variant.image);
          }
        });
      }

      // Make API call
      const response = await api.put(`/vendors/products/${productId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        }
      });

      return {
        success: true,
        product: response.data.product,
        message: response.data.message
      };

    } catch (error) {
      const message = this.handleError(error);
      throw new Error(message);
    }
  }

  /**
   * Get vendor products with filtering and pagination
   */
  static async getVendorProducts(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });

      const response = await api.get(`/vendors/products?${queryParams}`);
      
      return {
        success: true,
        products: response.data.products,
        total: response.data.total,
        totalPages: response.data.totalPages,
        currentPage: response.data.currentPage
      };

    } catch (error) {
      const message = this.handleError(error);
      throw new Error(message);
    }
  }

  /**
   * Get single product for editing
   */
  static async getProduct(productId) {
    try {
      const response = await api.get(`/vendors/products/${productId}`);
      
      return {
        success: true,
        product: response.data.product
      };

    } catch (error) {
      const message = this.handleError(error);
      throw new Error(message);
    }
  }

  /**
   * Delete a product
   */
  static async deleteProduct(productId) {
    try {
      await api.delete(`/vendors/products/${productId}`);
      
      return {
        success: true,
        message: 'Product deleted successfully'
      };

    } catch (error) {
      const message = this.handleError(error);
      throw new Error(message);
    }
  }

  /**
   * Validate product data
   */
  static validateProductData(data) {
    const errors = [];

    // Required fields
    if (!data.name || data.name.trim().length === 0) {
      errors.push('Product name is required');
    } else if (data.name.trim().length < 3) {
      errors.push('Product name must be at least 3 characters long');
    }

    if (!data.description || data.description.trim().length === 0) {
      errors.push('Product description is required');
    } else if (data.description.trim().length < 10) {
      errors.push('Product description must be at least 10 characters long');
    }

    if (!data.price || isNaN(data.price) || parseFloat(data.price) <= 0) {
      errors.push('Valid price is required');
    }

    if (!data.category) {
      errors.push('Product category is required');
    }

    if (!data.mode || !['buy-now', 'auction'].includes(data.mode)) {
      errors.push('Product mode must be either "buy-now" or "auction"');
    }

    // Images validation
    const totalImages = (data.images?.length || 0) + (data.newImages?.length || 0);
    if (totalImages === 0) {
      errors.push('At least one product image is required');
    }

    // Auction validation
    if (data.mode === 'auction') {
      if (!data.auction?.startTime) {
        errors.push('Auction start time is required');
      }
      if (!data.auction?.endTime) {
        errors.push('Auction end time is required');
      }
      if (!data.auction?.startingBid || parseFloat(data.auction.startingBid) <= 0) {
        errors.push('Valid starting bid is required');
      }
    }

    // Variants validation
    if (data.variants && data.variants.length > 0) {
      data.variants.forEach((variant, index) => {
        if (!variant.price || parseFloat(variant.price) <= 0) {
          errors.push(`Variant ${index + 1}: Valid price is required`);
        }
        if (!variant.stock || parseInt(variant.stock) < 0) {
          errors.push(`Variant ${index + 1}: Valid stock quantity is required`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate image files
   */
  static validateImages(files) {
    const errors = [];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!files || files.length === 0) {
      errors.push('At least one image is required');
      return errors;
    }

    if (files.length > 10) {
      errors.push('Maximum 10 images allowed per product');
    }

    files.forEach((file, index) => {
      if (!allowedTypes.includes(file.type)) {
        errors.push(`Image ${index + 1}: Only JPEG, PNG, and WebP files are allowed`);
      }

      if (file.size > maxSize) {
        errors.push(`Image ${index + 1}: File size must be less than 5MB`);
      }
    });

    return errors;
  }

  /**
   * Handle API errors
   */
  static handleError(error) {
    if (error.response?.data?.error?.message) {
      return error.response.data.error.message;
    }
    
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    
    if (error.message) {
      return error.message;
    }
    
    return 'An unexpected error occurred';
  }

  /**
   * Format price for display
   */
  static formatPrice(price) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }

  /**
   * Get status badge class
   */
  static getStatusBadgeClass(status) {
    const statusClasses = {
      pending: 'badge-warning',
      approved: 'badge-success',
      rejected: 'badge-error'
    };
    return statusClasses[status] || 'badge-neutral';
  }

  /**
   * Get mode badge class
   */
  static getModeBadgeClass(mode) {
    return mode === 'auction' ? 'badge-warning' : 'badge-info';
  }

  /**
   * Show success toast
   */
  static showSuccess(message) {
    toast.success(message, {
      duration: 4000,
      position: 'top-right'
    });
  }

  /**
   * Show error toast
   */
  static showError(message) {
    toast.error(message, {
      duration: 5000,
      position: 'top-right'
    });
  }
}

export default ProductService; 