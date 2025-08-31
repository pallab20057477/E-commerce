import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { FaPlus, FaEdit, FaTrash, FaTruck } from 'react-icons/fa';
import toast from 'react-hot-toast';

const initialForm = {
  name: '',
  regions: '',
  cost: '',
  estimatedDelivery: '',
  isActive: true,
};

const VendorShipping = () => {
  const [shippingMethods, setShippingMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchShippingMethods = async () => {
    setLoading(true);
    try {
      const res = await api.get('/vendors/shipping');
      setShippingMethods(res.data.methods || []);
    } catch (err) {
      toast.error('Failed to load shipping methods');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShippingMethods();
  }, []);

  const openModal = (method = null) => {
    if (method) {
      setForm({
        name: method.name,
        regions: method.regions.join(', '),
        cost: method.cost,
        estimatedDelivery: method.estimatedDelivery,
        isActive: method.isActive,
      });
      setEditId(method._id);
    } else {
      setForm(initialForm);
      setEditId(null);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(initialForm);
    setEditId(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        regions: form.regions.split(',').map((r) => r.trim()).filter(Boolean),
        cost: parseFloat(form.cost),
      };
      if (editId) {
        await api.put(`/vendors/shipping/${editId}`, payload);
        toast.success('Shipping method updated');
      } else {
        await api.post('/vendors/shipping', payload);
        toast.success('Shipping method added');
      }
      fetchShippingMethods();
      closeModal();
    } catch (err) {
      toast.error('Failed to save shipping method');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this shipping method?')) return;
    try {
      await api.delete(`/vendors/shipping/${id}`);
      toast.success('Shipping method deleted');
      fetchShippingMethods();
    } catch (err) {
      toast.error('Failed to delete shipping method');
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FaTruck className="text-primary" /> Shipping Methods
        </h2>
        <button
          className="btn btn-primary flex items-center gap-2"
          onClick={() => openModal()}
        >
          <FaPlus /> Add Method
        </button>
      </div>
      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading...</div>
      ) : shippingMethods.length === 0 ? (
        <div className="text-center py-10 text-gray-400">No shipping methods found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>Regions</th>
                <th>Cost</th>
                <th>Estimated Delivery</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {shippingMethods.map((method) => (
                <tr key={method._id} className="hover:bg-base-100 transition">
                  <td>{method.name}</td>
                  <td>{method.regions.join(', ')}</td>
                  <td>${method.cost.toFixed(2)}</td>
                  <td>{method.estimatedDelivery || '-'}</td>
                  <td>
                    {method.isActive ? (
                      <span className="badge badge-success">Active</span>
                    ) : (
                      <span className="badge badge-ghost">Inactive</span>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn btn-xs btn-outline mr-2"
                      onClick={() => openModal(method)}
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="btn btn-xs btn-error btn-outline"
                      onClick={() => handleDelete(method._id)}
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative animate-fade-in">
            <button
              className="absolute top-2 right-2 btn btn-sm btn-circle btn-ghost"
              onClick={closeModal}
            >✕</button>
            <h3 className="text-lg font-bold mb-4">{editId ? 'Edit' : 'Add'} Shipping Method</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-medium mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  className="input input-bordered w-full"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Regions (comma separated)</label>
                <input
                  type="text"
                  name="regions"
                  className="input input-bordered w-full"
                  value={form.regions}
                  onChange={handleChange}
                  placeholder="e.g. US, Canada, Europe"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Cost (USD)</label>
                <input
                  type="number"
                  name="cost"
                  className="input input-bordered w-full"
                  value={form.cost}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Estimated Delivery</label>
                <input
                  type="text"
                  name="estimatedDelivery"
                  className="input input-bordered w-full"
                  value={form.estimatedDelivery}
                  onChange={handleChange}
                  placeholder="e.g. 3-5 business days"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleChange}
                  className="checkbox"
                  id="isActive"
                />
                <label htmlFor="isActive" className="cursor-pointer">Active</label>
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : (editId ? 'Update' : 'Add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorShipping; 