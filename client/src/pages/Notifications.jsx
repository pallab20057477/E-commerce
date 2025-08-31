import React, { useState, useEffect } from 'react';
import { FaBell, FaTrash, FaCheck, FaEye, FaEyeSlash, FaFilter, FaSearch } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useSocket } from '../contexts/SocketContext';
import { useNotification } from '../contexts/NotificationContext';
import api from '../utils/api';

const Notifications = () => {
  const {
    notifications,
    loading,
    markAllAsRead,
    markAsRead,
    fetchNotifications
  } = useNotification();
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const { socket } = useSocket();

  // Listen for notification:update events and refetch notifications
  useEffect(() => {
    if (!socket) return;
    const handler = () => {
      fetchNotifications();
    };
    socket.on('notification:update', handler);
    return () => {
      socket.off('notification:update', handler);
    };
  }, [socket, fetchNotifications]);

  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      fetchNotifications();
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const deleteSelectedNotifications = async () => {
    if (selectedNotifications.length === 0) {
      toast.error('Please select notifications to delete');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete ${selectedNotifications.length} notification(s)?`)) {
      return;
    }
    try {
      for (const id of selectedNotifications) {
        await api.delete(`/notifications/${id}`);
      }
      fetchNotifications();
      setSelectedNotifications([]);
      setSelectAll(false);
      toast.success(`${selectedNotifications.length} notification(s) deleted`);
    } catch (error) {
      toast.error('Failed to delete notifications');
    }
  };

  const deleteAllNotifications = async () => {
    if (!window.confirm('Are you sure you want to delete all notifications?')) {
      return;
    }
    try {
      await api.delete('/notifications');
      fetchNotifications();
      setSelectedNotifications([]);
      setSelectAll(false);
      toast.success('All notifications deleted');
    } catch (error) {
      toast.error('Failed to delete all notifications');
    }
  };

  const handleSelectNotification = (notificationId) => {
    setSelectedNotifications(prev =>
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedNotifications([]);
      setSelectAll(false);
    } else {
      const filteredNotifications = getFilteredNotifications();
      setSelectedNotifications(filteredNotifications.map(n => n._id));
      setSelectAll(true);
    }
  };

  const getFilteredNotifications = () => {
    let filtered = notifications;
    if (filter === 'unread') {
      filtered = filtered.filter(n => !n.read);
    } else if (filter === 'read') {
      filtered = filtered.filter(n => n.read);
    }
    if (searchTerm) {
      filtered = filtered.filter(n =>
        n.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return filtered;
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'win': return '🎉';
      case 'order': return '📦';
      case 'product': return '🛍️';
      case 'vendor': return '🏪';
      case 'auction': return '🔨';
      default: return '📢';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'win': return 'badge-success';
      case 'order': return 'badge-info';
      case 'product': return 'badge-primary';
      case 'vendor': return 'badge-warning';
      case 'auction': return 'badge-secondary';
      default: return 'badge-ghost';
    }
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

  const filteredNotifications = getFilteredNotifications();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Notifications</h1>
        <p className="text-gray-600">Manage your notifications and stay updated</p>
      </div>
      {/* Header Actions */}
      <div className="bg-base-100 shadow-xl rounded-2xl p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            {/* Search */}
            <div className="form-control">
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Search notifications..."
                  className="input input-bordered"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="btn btn-square">
                  <FaSearch />
                </button>
              </div>
            </div>
            {/* Filter */}
            <select
              className="select select-bordered"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Notifications</option>
              <option value="unread">Unread Only</option>
              <option value="read">Read Only</option>
            </select>
          </div>
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={markAllAsRead}
              className="btn btn-sm btn-outline"
              disabled={notifications.filter(n => !n.read).length === 0}
            >
              <FaCheck className="mr-1" />
              Mark All Read
            </button>
            <button
              onClick={deleteAllNotifications}
              className="btn btn-sm btn-error"
              disabled={notifications.length === 0}
            >
              <FaTrash className="mr-1" />
              Delete All
            </button>
          </div>
        </div>
      </div>
      {/* Notifications List */}
      <div className="bg-base-100 shadow-xl rounded-2xl overflow-hidden">
        {filteredNotifications.length > 0 ? (
          <>
            {/* Table Header */}
            <div className="p-4 border-b border-base-300">
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                />
                <span className="font-semibold">
                  {selectedNotifications.length > 0 
                    ? `${selectedNotifications.length} selected`
                    : `${filteredNotifications.length} notification(s)`
                  }
                </span>
                {selectedNotifications.length > 0 && (
                  <button
                    onClick={deleteSelectedNotifications}
                    className="btn btn-sm btn-error ml-auto"
                  >
                    <FaTrash className="mr-1" />
                    Delete Selected
                  </button>
                )}
              </div>
            </div>
            {/* Notifications */}
            <div className="divide-y divide-base-300">
              {filteredNotifications.map(notification => (
                <div
                  key={notification._id}
                  className={`p-4 hover:bg-base-200 transition-colors ${
                    !notification.read ? 'bg-base-200' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      className="checkbox mt-1"
                      checked={selectedNotifications.includes(notification._id)}
                      onChange={() => handleSelectNotification(notification._id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">
                          {getTypeIcon(notification.type)}
                        </span>
                        <span className={`badge ${getTypeColor(notification.type)}`}>
                          {notification.type}
                        </span>
                        {!notification.read && (
                          <span className="badge badge-accent badge-sm">New</span>
                        )}
                        <span className="text-sm text-gray-500 ml-auto">
                          {formatDate(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-base-content">
                        {notification.message}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification._id)}
                          className="btn btn-sm btn-ghost"
                          title="Mark as read"
                        >
                          <FaEye />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification._id)}
                        className="btn btn-sm btn-ghost text-error"
                        title="Delete notification"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="p-8 text-center">
            <FaBell className="text-6xl text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {searchTerm || filter !== 'all' ? 'No notifications found' : 'No notifications yet'}
            </h3>
            <p className="text-gray-500">
              {searchTerm || filter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'You\'ll see notifications here when you receive them'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications; 