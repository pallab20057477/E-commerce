import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchProducts();
  }, [currentPage, filter]);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/admin/products', {
        params: {
          page: currentPage,
          limit: 10,
          search: searchTerm,
          filter
        }
      });
      setProducts(response.data.products);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts();
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await api.delete(`/admin/products/${productId}`);
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const handleToggleStatus = async (productId, currentStatus) => {
    try {
      await api.put(`/admin/products/${productId}`, {
        isActive: !currentStatus
      });
      toast.success(`Product ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      fetchProducts();
    } catch (error) {
      toast.error('Failed to update product status');
    }
  };

  const getStatusBadge = (status) => {
    return status ? 'badge-success' : 'badge-error';
  };

  const getModeBadge = (mode) => {
    switch (mode) {
      case 'auction':
        return 'badge-warning';
      case 'fixed':
        return 'badge-info';
      default:
        return 'badge-ghost';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <h2 className="text-2xl font-bold text-gray-600 mt-4">Loading products...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Product Management</h1>
          <p className="text-gray-600">Manage all products in the marketplace</p>
        </div>
        <button className="btn btn-primary">
          <FaPlus className="mr-2" />
          Add Product
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="join w-full">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-bordered join-item flex-1"
              />
              <button type="submit" className="btn btn-primary join-item">
                Search
              </button>
            </div>
          </form>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="select select-bordered"
          >
            <option value="all">All Products</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="auction">Auctions</option>
            <option value="fixed">Fixed Price</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Mode</th>
                <th>Status</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product._id}>
                  <td>
                    <div className="flex items-center space-x-3">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div>
                        <div className="font-bold">{product.name}</div>
                        <div className="text-sm opacity-50">ID: {product._id.slice(-8)}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-outline">{product.category}</span>
                  </td>
                  <td>
                    <div className="font-semibold">${product.price}</div>
                    {product.mode === 'auction' && (
                      <div className="text-sm text-gray-500">
                        Min: ${product.auction?.minimumBid}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${getModeBadge(product.mode)}`}>
                      {product.mode}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadge(product.isActive)}`}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="font-semibold">{product.stock}</div>
                    {product.stock < 10 && (
                      <div className="text-sm text-red-500">Low stock</div>
                    )}
                  </td>
                  <td>
                    <div className="flex space-x-2">
                      <button className="btn btn-sm btn-outline" title="Edit">
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(product._id, product.isActive)}
                        className={`btn btn-sm ${product.isActive ? 'btn-warning' : 'btn-success'}`}
                        title={product.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {product.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product._id)}
                        className="btn btn-sm btn-error"
                        title="Delete"
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center p-4">
            <div className="join">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="join-item btn"
              >
                «
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`join-item btn ${currentPage === page ? 'btn-active' : ''}`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="join-item btn"
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProducts; 