import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { toast } from 'react-hot-toast';

const DeliveryTracking = ({ orderId }) => {
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchTracking();
    }
  }, [orderId]);

  const fetchTracking = async () => {
    try {
      const response = await api.get(`/delivery/order/${orderId}`);
      setTracking(response.data);
    } catch (error) {
      if (error.response?.status === 404) {
        setTracking(null);
      } else {
        toast.error('Failed to fetch tracking information');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'confirmed':
        return '✅';
      case 'shipped':
        return '📦';
      case 'in_transit':
        return '🚚';
      case 'out_for_delivery':
        return '🚛';
      case 'delivered':
        return '🎉';
      case 'failed':
        return '❌';
      case 'returned':
        return '↩️';
      default:
        return '📋';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'badge-warning';
      case 'confirmed':
        return 'badge-info';
      case 'shipped':
        return 'badge-primary';
      case 'in_transit':
        return 'badge-secondary';
      case 'out_for_delivery':
        return 'badge-accent';
      case 'delivered':
        return 'badge-success';
      case 'failed':
        return 'badge-error';
      case 'returned':
        return 'badge-neutral';
      default:
        return 'badge-ghost';
    }
  };

  if (loading) {
    return <div className="flex justify-center p-4"><span className="loading loading-spinner loading-md"></span></div>;
  }

  if (!tracking) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Delivery Tracking</h2>
          <p className="text-gray-500">No tracking information available for this order yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Delivery Tracking</h2>
        
        {/* Tracking Header */}
        <div className="bg-base-200 p-4 rounded-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-500">Tracking Number</div>
              <div className="font-mono font-bold text-lg">{tracking.trackingNumber}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Carrier</div>
              <div className="font-semibold">{tracking.carrier.toUpperCase()}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Status</div>
              <span className={`badge ${getStatusColor(tracking.status)} badge-lg`}>
                {getStatusIcon(tracking.status)} {tracking.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Current Location */}
        {tracking.currentLocation && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Current Location</h3>
            <div className="bg-base-200 p-3 rounded-lg">
              <div className="flex items-center">
                <span className="text-2xl mr-2">📍</span>
                <div>
                  {tracking.currentLocation.facility && (
                    <div className="font-medium">{tracking.currentLocation.facility}</div>
                  )}
                  <div className="text-sm text-gray-600">
                    {tracking.currentLocation.city}, {tracking.currentLocation.state}, {tracking.currentLocation.country}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delivery Estimates */}
        {(tracking.estimatedDelivery || tracking.actualDelivery) && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Delivery Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tracking.estimatedDelivery && (
                <div className="bg-base-200 p-3 rounded-lg">
                  <div className="text-sm text-gray-500">Estimated Delivery</div>
                  <div className="font-semibold">
                    {new Date(tracking.estimatedDelivery).toLocaleDateString()}
                  </div>
                </div>
              )}
              {tracking.actualDelivery && (
                <div className="bg-base-200 p-3 rounded-lg">
                  <div className="text-sm text-gray-500">Actual Delivery</div>
                  <div className="font-semibold text-success">
                    {new Date(tracking.actualDelivery).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tracking Timeline */}
        <div>
          <h3 className="font-semibold mb-4">Tracking History</h3>
          <div className="space-y-4">
            {tracking.trackingHistory.map((event, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm">
                    {getStatusIcon(event.status)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{event.status.replace('_', ' ').toUpperCase()}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(event.timestamp).toLocaleString()}
                    </div>
                  </div>
                  {event.description && (
                    <div className="text-sm text-gray-600 mt-1">{event.description}</div>
                  )}
                  {event.location && (
                    <div className="text-sm text-gray-500 mt-1">
                      📍 {event.location.city}, {event.location.state}, {event.location.country}
                      {event.location.facility && ` - ${event.location.facility}`}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping Details */}
        {tracking.shippingDetails && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold mb-2">Shipping Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {tracking.shippingDetails.weight && (
                <div>
                  <div className="text-sm text-gray-500">Weight</div>
                  <div className="font-semibold">{tracking.shippingDetails.weight} kg</div>
                </div>
              )}
              {tracking.shippingDetails.service && (
                <div>
                  <div className="text-sm text-gray-500">Service</div>
                  <div className="font-semibold">{tracking.shippingDetails.service}</div>
                </div>
              )}
              {tracking.shippingDetails.cost && (
                <div>
                  <div className="text-sm text-gray-500">Shipping Cost</div>
                  <div className="font-semibold">${tracking.shippingDetails.cost}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Last Updated */}
        <div className="mt-4 text-sm text-gray-500 text-center">
          Last updated: {new Date(tracking.lastUpdated).toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default DeliveryTracking; 