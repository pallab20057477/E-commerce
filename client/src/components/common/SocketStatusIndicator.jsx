import React, { useState, useEffect } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useSocketEvents } from '../../hooks/useSocketEvents';
import { FaWifi, FaWifiSlash, FaCircle } from 'react-icons/fa';

const SocketStatusIndicator = () => {
  const { connected, socket } = useSocket();
  const { isConnected, userRole } = useSocketEvents();
  const [lastActivity, setLastActivity] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (isConnected) {
      setLastActivity(new Date());
    }
  }, [isConnected]);

  const getStatusColor = () => {
    if (!connected || !isConnected) return 'text-red-500';
    return 'text-green-500';
  };

  const getStatusText = () => {
    if (!connected || !isConnected) return 'Disconnected';
    return 'Connected';
  };

  const getRoleBadge = () => {
    if (!userRole) return null;
    
    const roleColors = {
      admin: 'bg-red-500',
      vendor: 'bg-blue-500',
      user: 'bg-green-500'
    };

    return (
      <span className={`${roleColors[userRole]} text-white text-xs px-2 py-1 rounded-full ml-2`}>
        {userRole}
      </span>
    );
  };

  const formatLastActivity = () => {
    if (!lastActivity) return 'Never';
    
    const now = new Date();
    const diff = now - lastActivity;
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <div className="relative">
      {/* Status Indicator */}
      <div 
        className="flex items-center cursor-pointer p-2 rounded-lg hover:bg-base-200 transition-colors"
        onClick={() => setShowDetails(!showDetails)}
        title="Socket.IO Status"
      >
        <FaCircle className={`text-xs ${getStatusColor()} mr-2`} />
        <span className="text-sm font-medium">{getStatusText()}</span>
        {getRoleBadge()}
      </div>

      {/* Details Panel */}
      {showDetails && (
        <div className="absolute bottom-full right-0 mb-2 bg-base-100 border border-base-300 rounded-lg shadow-lg p-4 min-w-64 z-50">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-base-300 pb-2">
              <h3 className="font-semibold text-base-content">Real-Time Status</h3>
              <button 
                onClick={() => setShowDetails(false)}
                className="text-base-content/60 hover:text-base-content"
              >
                ×
              </button>
            </div>

            {/* Connection Status */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-base-content/70">Connection:</span>
                <div className="flex items-center">
                  <FaCircle className={`text-xs ${getStatusColor()} mr-1`} />
                  <span className="text-sm font-medium">{getStatusText()}</span>
                </div>
              </div>

              {/* User Role */}
              {userRole && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-base-content/70">Role:</span>
                  <span className="text-sm font-medium capitalize">{userRole}</span>
                </div>
              )}

              {/* Last Activity */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-base-content/70">Last Activity:</span>
                <span className="text-sm">{formatLastActivity()}</span>
              </div>

              {/* Connection Type */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-base-content/70">Transport:</span>
                <span className="text-sm">WebSocket</span>
              </div>
            </div>

            {/* Real-Time Features */}
            <div className="border-t border-base-300 pt-2">
              <h4 className="text-sm font-medium text-base-content mb-2">Active Features:</h4>
              <div className="space-y-1">
                {userRole === 'admin' && (
                  <>
                    <div className="flex items-center text-xs text-green-600">
                      <FaCircle className="text-xs mr-1" />
                      System Monitoring
                    </div>
                    <div className="flex items-center text-xs text-green-600">
                      <FaCircle className="text-xs mr-1" />
                      Analytics Dashboard
                    </div>
                    <div className="flex items-center text-xs text-green-600">
                      <FaCircle className="text-xs mr-1" />
                      Vendor Management
                    </div>
                  </>
                )}
                
                {userRole === 'vendor' && (
                  <>
                    <div className="flex items-center text-xs text-green-600">
                      <FaCircle className="text-xs mr-1" />
                      Order Notifications
                    </div>
                    <div className="flex items-center text-xs text-green-600">
                      <FaCircle className="text-xs mr-1" />
                      Product Updates
                    </div>
                    <div className="flex items-center text-xs text-green-600">
                      <FaCircle className="text-xs mr-1" />
                      Earnings Tracking
                    </div>
                  </>
                )}
                
                {userRole === 'user' && (
                  <>
                    <div className="flex items-center text-xs text-green-600">
                      <FaCircle className="text-xs mr-1" />
                      Order Tracking
                    </div>
                    <div className="flex items-center text-xs text-green-600">
                      <FaCircle className="text-xs mr-1" />
                      Product Alerts
                    </div>
                    <div className="flex items-center text-xs text-green-600">
                      <FaCircle className="text-xs mr-1" />
                      Payment Updates
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Connection Info */}
            <div className="border-t border-base-300 pt-2">
              <div className="text-xs text-base-content/60">
                <div>Server: e-commerce-2-8abd.onrender.com</div>
                <div>Protocol: Socket.IO v4</div>
                <div>Socket ID: {socket?.id || 'Not connected'}</div>
              </div>
            </div>
            
            {/* Test Connection Button */}
            <div className="border-t border-base-300 pt-2">
              <button 
                onClick={() => {
                  if (socket) {
                    socket.emit('test-connection', { message: 'Test from client' });
                    console.log('Test connection event sent');
                  }
                }}
                className="btn btn-xs btn-outline w-full"
                disabled={!isConnected}
              >
                Test Connection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocketStatusIndicator; 