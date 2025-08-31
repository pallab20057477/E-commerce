import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { FaBox, FaUpload, FaSave, FaTimes, FaTag, FaDollarSign, FaInfoCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { Tooltip } from 'react-tooltip';

const AddProduct = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    subcategory: '',
    brand: '',
    stock: '',
    sku: '',
    weight: '',
    dimensions: {
      length: '',
      width: '',
      height: ''
    },
    features: [],
    specifications: {},
    tags: [],
    isActive: true,
    mode: 'buy-now'
  });

  const categories = [
    'Electronics', 'Fashion', 'Home & Garden', 'Sports & Outdoors', 
    'Books & Media', 'Toys & Games', 'Health & Beauty', 'Automotive',
    'Tools & Hardware', 'Food & Beverages', 'Other'
  ];

  const subcategories = {
    'Electronics': ['Smartphones', 'Laptops', 'Tablets', 'Accessories', 'Audio', 'Cameras'],
    'Fashion': ['Clothing', 'Shoes', 'Bags', 'Jewelry', 'Watches', 'Accessories'],
    'Home & Garden': ['Furniture', 'Decor', 'Kitchen', 'Garden', 'Lighting', 'Storage'],
    'Sports & Outdoors': ['Fitness', 'Outdoor', 'Team Sports', 'Water Sports', 'Camping'],
    'Books & Media': ['Books', 'Movies', 'Music', 'Games', 'Magazines'],
    'Toys & Games': ['Board Games', 'Video Games', 'Educational', 'Action Figures'],
    'Health & Beauty': ['Skincare', 'Makeup', 'Hair Care', 'Fragrances', 'Supplements'],
    'Automotive': ['Car Parts', 'Accessories', 'Tools', 'Maintenance'],
    'Tools & Hardware': ['Power Tools', 'Hand Tools', 'Fasteners', 'Plumbing'],
    'Food & Beverages': ['Snacks', 'Beverages', 'Organic', 'Gourmet'],
    'Other': ['Miscellaneous']
  };

  useEffect(() => {
    console.log('Vendor AddProduct initialized');
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
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
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    setImages(imageFiles);
  };

  const handleFeatureAdd = () => {
    const feature = prompt('Enter feature:');
    if (feature && feature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, feature.trim()]
      }));
    }
  };

  const handleFeatureRemove = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleTagAdd = () => {
    const tag = prompt('Enter tag:');
    if (tag && tag.trim()) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()]
      }));
    }
  };

  const handleTagRemove = (index) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const imageUrls = [];
      if (images.length > 0) {
        for (const image of images) {
          const formDataImage = new FormData();
          formDataImage.append('image', image);
          
          const uploadResponse = await api.post('/upload/image', formDataImage, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          
          imageUrls.push(uploadResponse.data.url);
        }
      }

      const productData = {
        ...formData,
        images: imageUrls,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        weight: parseFloat(formData.weight),
        dimensions: {
          length: parseFloat(formData.dimensions.length),
          width: parseFloat(formData.dimensions.width),
          height: parseFloat(formData.dimensions.height)
        }
      };

              const response = await api.post('/vendors/products', productData);
      
      toast.success('Product created successfully!');
      navigate('/vendor/products');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create product';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 font-sans">
      {loading && (
        <div className="fixed top-0 left-0 w-full z-50">
          <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-pulse w-full" />
        </div>
      )}
      
      <div className="mb-8">
        <div className="flex justify-between items-center border-b-4 border-blue-500 pb-4 bg-white bg-opacity-80 rounded-b-xl shadow-md px-6 pt-6">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-1 tracking-tight">Add New Product</h1>
            <p className="text-gray-500 text-lg">Create a new product for your vendor store</p>
          </div>
          <button
            onClick={() => navigate('/vendor/products')}
            className="btn btn-outline border-blue-500 text-blue-600 hover:bg-blue-50 transition-colors duration-200"
          >
            Back to Products
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-blue-100">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-blue-700">
              <FaInfoCircle className="mr-2" />
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input input-bordered w-full bg-gray-50 border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SKU
                </label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  className="input input-bordered w-full bg-gray-50 border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter SKU"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand
                </label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  className="input input-bordered w-full bg-gray-50 border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter brand name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="input input-bordered w-full bg-gray-50 border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="select select-bordered w-full bg-gray-50 border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subcategory
                </label>
                <select
                  name="subcategory"
                  value={formData.subcategory}
                  onChange={handleChange}
                  className="select select-bordered w-full bg-gray-50 border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Subcategory</option>
                  {formData.category && subcategories[formData.category]?.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  className="input input-bordered w-full bg-gray-50 border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mode *
                </label>
                <select
                  name="mode"
                  value={formData.mode}
                  onChange={handleChange}
                  className="select select-bordered w-full bg-gray-50 border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="buy-now">Buy Now</option>
                  <option value="auction">Auction</option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="textarea textarea-bordered w-full h-32 bg-gray-50 border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter product description"
                required
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-purple-100">
            <h2 className="text-2xl font-bold mb-6 text-purple-700">Product Images</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Images (Max 5)
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="file-input file-input-bordered w-full bg-gray-50 border-gray-200 focus:ring-purple-500 focus:border-purple-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                Supported formats: JPG, PNG, GIF. Maximum 5 images.
              </p>
            </div>

            {images.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Selected Images:</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                  {images.map((image, index) => (
                    <div key={index} className="relative group shadow-lg rounded-xl overflow-hidden border border-gray-200">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-28 object-cover rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => setImages(images.filter((_, i) => i !== index))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm shadow-lg hover:bg-red-600"
                        title="Remove image"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-pink-100">
            <h2 className="text-2xl font-bold mb-6 text-pink-700">Features & Tags</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Features
                </label>
                <div className="space-y-2">
                  {formData.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2 bg-gray-50 border border-gray-200 rounded-lg p-2">
                      <span className="flex-1 bg-gray-100 px-3 py-2 rounded">{feature}</span>
                      <button
                        type="button"
                        onClick={() => handleFeatureRemove(index)}
                        className="btn btn-sm btn-error text-white hover:bg-red-600"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleFeatureAdd}
                    className="btn btn-outline btn-sm border-pink-500 text-pink-600 hover:bg-pink-50"
                  >
                    Add Feature
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="space-y-2">
                  {formData.tags.map((tag, index) => (
                    <div key={index} className="flex items-center space-x-2 bg-gray-50 border border-gray-200 rounded-lg p-2">
                      <span className="badge badge-primary">{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleTagRemove(index)}
                        className="btn btn-sm btn-error text-white hover:bg-red-600"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleTagAdd}
                    className="btn btn-outline btn-sm border-pink-500 text-pink-600 hover:bg-pink-50"
                  >
                    Add Tag
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-green-100">
            <h2 className="text-2xl font-bold mb-6 text-green-700">Physical Properties</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  className="input input-bordered w-full bg-gray-50 border-gray-200 focus:ring-green-500 focus:border-green-500"
                  placeholder="0.0"
                  step="0.1"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Length (cm)
                </label>
                <input
                  type="number"
                  name="dimensions.length"
                  value={formData.dimensions.length}
                  onChange={handleChange}
                  className="input input-bordered w-full bg-gray-50 border-gray-200 focus:ring-green-500 focus:border-green-500"
                  placeholder="0"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Width (cm)
                </label>
                <input
                  type="number"
                  name="dimensions.width"
                  value={formData.dimensions.width}
                  onChange={handleChange}
                  className="input input-bordered w-full bg-gray-50 border-gray-200 focus:ring-green-500 focus:border-green-500"
                  placeholder="0"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height (cm)
                </label>
                <input
                  type="number"
                  name="dimensions.height"
                  value={formData.dimensions.height}
                  onChange={handleChange}
                  className="input input-bordered w-full bg-gray-50 border-gray-200 focus:ring-green-500 focus:border-green-500"
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-yellow-100">
            <h2 className="text-2xl font-bold mb-6 text-yellow-700">Product Status</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">Active Product</span>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="checkbox checkbox-primary bg-gray-50 border-gray-200 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-8">
            <button
              type="button"
              onClick={() => navigate('/vendor/products')}
              className="btn btn-outline border-gray-400 text-gray-600 hover:bg-gray-100"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold px-8 py-3 rounded-xl shadow-lg hover:from-blue-600 hover:to-purple-600"
              disabled={loading}
            >
              {loading ? 'Creating Product...' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;
