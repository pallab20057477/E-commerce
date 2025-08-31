import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaEye, FaSearch, FaDownload, FaTimes, FaCopy, FaBox } from 'react-icons/fa';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const VendorProducts = () => {
  const API_BASE = api?.defaults?.baseURL || '';
  let API_ORIGIN = '';
  try {
    API_ORIGIN = new URL(API_BASE).origin; // e.g., http://localhost:5000
  } catch {
    API_ORIGIN = window.location.origin;
  }

  const resolveImageUrl = (url) => {
    if (!url) return 'https://via.placeholder.com/80';
    // Already absolute or data URI
    if (/^(https?:)?\/\//i.test(url) || url.startsWith('data:')) return url;
    // Ensure leading slash
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${API_ORIGIN}${path}`;
  };

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [performingBulkAction, setPerformingBulkAction] = useState(false);

  // Load products on mount and when page or status filter changes
  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      });

      const response = await api.get(`/vendors/products?${params}`);
      
      if (response.data.success) {
        setProducts(response.data.products);
        setTotalPages(response.data.totalPages);
        setTotalProducts(response.data.total);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts();
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const response = await api.delete(`/vendors/products/${productId}`);
      
      if (response.data.success) {
        toast.success('Product deleted successfully');
        fetchProducts();
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedProducts.length === 0) {
      toast.error('Please select products and an action');
      return;
    }

    try {
      setPerformingBulkAction(true);
      
      if (bulkAction === 'delete') {
        if (!window.confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) {
          return;
        }
        
        await Promise.all(
          selectedProducts.map(productId => 
            api.delete(`/vendors/products/${productId}`)
          )
        );
        
        toast.success(`${selectedProducts.length} products deleted successfully`);
      } else if (bulkAction === 'activate') {
        await Promise.all(
          selectedProducts.map(productId => 
            api.patch(`/vendors/products/${productId}/status`, { isActive: true })
          )
        );
        
        toast.success(`${selectedProducts.length} products activated successfully`);
      } else if (bulkAction === 'deactivate') {
        await Promise.all(
          selectedProducts.map(productId => 
            api.patch(`/vendors/products/${productId}/status`, { isActive: false })
          )
        );
        
        toast.success(`${selectedProducts.length} products deactivated successfully`);
      }
      
      setSelectedProducts([]);
      setBulkAction('');
      fetchProducts();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error('Failed to perform bulk action');
    } finally {
      setPerformingBulkAction(false);
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedProducts(products.map(p => p._id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (productId, checked) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, productId]);
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    }
  };

  const exportProducts = () => {
    const csvData = products.map(product => ({
      Name: product.name,
      Price: product.price,
      Stock: product.stock,
      Status: product.approvalStatus,
      Category: product.category,
      Views: product.views || 0,
      Created: new Date(product.createdAt).toLocaleDateString()
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Products exported successfully');
  };

  const copyProductLink = (productId) => {
    const link = `${window.location.origin}/products/${productId}`;
    navigator.clipboard.writeText(link);
    toast.success('Product link copied to clipboard');
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'approved': 'badge-success',
      'pending': 'badge-warning',
      'rejected': 'badge-error',
      'draft': 'badge-neutral'
    };
    return statusConfig[status] || 'badge-neutral';
  };

  const getStockBadge = (stock) => {
    if (stock === 0) return 'badge-error';
    if (stock <= 5) return 'badge-warning';
    return 'badge-success';
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold">Your Products</h2>
            <p className="text-base-content/70">Manage your product catalog</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={exportProducts}
              className="btn btn-outline md:btn-md btn-sm"
              disabled={products.length === 0}
            >
              <FaDownload className="mr-2" />
              Export
            </button>
            <Link
              to="/vendor/products/add"
              className="btn btn-primary md:btn-md btn-sm"
            >
              <FaPlus className="mr-2" />
              Add New Product
            </Link>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedProducts.length > 0 && (
          <div className="bg-base-200 p-4 rounded-lg mb-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={() => setSelectedProducts([])}
                  className="btn btn-xs btn-ghost"
                >
                  <FaTimes />
                </button>
              </div>
              <div className="flex gap-2">
                <select
                  className="select select-bordered select-sm"
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                >
                  <option value="">Select Action</option>
                  <option value="activate">Activate</option>
                  <option value="deactivate">Deactivate</option>
                  <option value="delete">Delete</option>
                </select>
                <button
                  onClick={handleBulkAction}
                  disabled={!bulkAction || performingBulkAction}
                  className="btn btn-sm btn-primary"
                >
                  {performingBulkAction ? (
                    <>
                      <div className="loading loading-spinner loading-xs"></div>
                      Processing...
                    </>
                  ) : (
                    'Apply'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="join w-full">
              <input
                type="text"
                placeholder="Search products..."
                className="input input-bordered join-item flex-1"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit" className="btn btn-primary join-item">
                <FaSearch />
              </button>
            </div>
          </form>
          <select
            className="select select-bordered"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Products Table */}
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={selectedProducts.length === products.length && products.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
                <th>Product</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Mode</th>
                <th>Created</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length > 0 ? (
                products.map((product) => (
                  <tr key={product._id} className="hover">
                    <td>
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        checked={selectedProducts.includes(product._id)}
                        onChange={(e) => handleSelectProduct(product._id, e.target.checked)}
                      />
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar">
                          <div className="mask mask-squircle w-12 h-12">
                            <img
                              src={resolveImageUrl(product.images?.[0] || product.image || product.thumbnail)}
                              alt={product.name}
                              onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/80'; }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="font-semibold">{product.name}</div>
                          <div className="text-sm opacity-70">{product.category || 'Uncategorized'}</div>
                        </div>
                      </div>
                    </td>
                    <td>${product.price?.toFixed ? product.price.toFixed(2) : product.price}</td>
                    <td>
                      <span className={`badge ${getStockBadge(product.stock)}`}>
                        {product.stock ?? 0}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(product.approvalStatus)} capitalize`}>
                        {product.approvalStatus}
                      </span>
                    </td>
                    <td className="capitalize">{product.mode || 'standard'}</td>
                    <td>{new Date(product.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => copyProductLink(product._id)}
                          className="btn btn-xs btn-ghost"
                          title="Copy Link"
                        >
                          <FaCopy />
                        </button>
                        <Link
                          to={`/products/${product._id}`}
                          className="btn btn-xs btn-ghost"
                          title="View Product"
                        >
                          <FaEye />
                        </Link>
                        <Link
                          to={`/vendor/products/edit/${product._id}`}
                          className="btn btn-xs btn-primary"
                          title="Edit Product"
                        >
                          <FaEdit />
                        </Link>
                        <button
                          onClick={() => {
                            if (product.mode === 'auction' && product.auction && product.auction.status !== 'scheduled') {
                              toast.error('Cannot delete auction product after auction has started');
                              return;
                            }
                            handleDelete(product._id);
                          }}
                          className="btn btn-xs btn-error"
                          title={product.mode === 'auction' && product.auction && product.auction.status !== 'scheduled' ? 'Cannot delete after auction started' : 'Delete Product'}
                          disabled={product.mode === 'auction' && product.auction && product.auction.status !== 'scheduled'}
                        >
                          <FaTrash />
                        </button>
                        {product.mode === 'auction' && product.auction && product.auction.status !== 'scheduled' && (
                          <span className="text-xs text-red-500 ml-2">Cannot delete after auction started</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-8">
                    <div className="flex flex-col items-center space-y-4">
                      <FaBox className="text-4xl text-base-content/30" />
                      <p className="text-base-content/60">No products found</p>
                      <Link to="/vendor/products/add" className="btn btn-primary btn-sm">
                        Add Your First Product
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <div className="join">
              <button
                className="join-item btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                «
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`join-item btn ${currentPage === page ? 'btn-active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                className="join-item btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                »
              </button>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="mt-6 text-center text-sm text-base-content/60">
          Showing {products.length} of {totalProducts} products
        </div>
      </div>
    </div>
  );
};

export default VendorProducts; 