import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FaUser, FaStore, FaArrowRight, FaCheck } from 'react-icons/fa';

const RoleSelectionModal = ({ isOpen, onClose, onRoleSelect }) => {
  const { user, vendor, isVendorApproved, switchRole } = useAuth();
  const [selectedRole, setSelectedRole] = useState('user');

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
  };

  const handleConfirm = () => {
    try {
      switchRole(selectedRole);
      onRoleSelect(selectedRole);
      onClose();
    } catch (error) {
      console.error('Error switching role:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-md">
        <h3 className="font-bold text-lg mb-4 text-center">
          Choose Your Account Type
        </h3>
        
        <p className="text-base-content/70 text-center mb-6">
          Welcome back, {user?.name}! You can access both your regular account and vendor account.
        </p>

        <div className="space-y-4 mb-6">
          {/* User Account Option */}
          <div
            className={`card cursor-pointer transition-all duration-200 ${
              selectedRole === 'user' 
                ? 'bg-primary text-primary-content shadow-lg scale-105' 
                : 'bg-base-200 hover:bg-base-300'
            }`}
            onClick={() => handleRoleSelect('user')}
          >
            <div className="card-body p-4">
              <div className="flex items-center space-x-3">
                <div className={`avatar ${selectedRole === 'user' ? 'ring-2 ring-primary-content' : ''}`}>
                  <div className="w-12 h-12 rounded-full bg-base-300 flex items-center justify-center">
                    <FaUser className="text-xl" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold">Regular User Account</h4>
                  <p className="text-sm opacity-80">Shop, browse, and place orders</p>
                </div>
                {selectedRole === 'user' && (
                  <FaCheck className="text-xl" />
                )}
              </div>
            </div>
          </div>

          {/* Vendor Account Option */}
          <div
            className={`card cursor-pointer transition-all duration-200 ${
              selectedRole === 'vendor' 
                ? 'bg-success text-success-content shadow-lg scale-105' 
                : 'bg-base-200 hover:bg-base-300'
            } ${!isVendorApproved ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => isVendorApproved && handleRoleSelect('vendor')}
          >
            <div className="card-body p-4">
              <div className="flex items-center space-x-3">
                <div className={`avatar ${selectedRole === 'vendor' ? 'ring-2 ring-success-content' : ''}`}>
                  <div className="w-12 h-12 rounded-full bg-base-300 flex items-center justify-center">
                    <FaStore className="text-xl" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold">Vendor Account</h4>
                  <p className="text-sm opacity-80">
                    {isVendorApproved 
                      ? `Manage ${vendor?.businessName || 'your business'}`
                      : 'Vendor account pending approval'
                    }
                  </p>
                </div>
                {selectedRole === 'vendor' && isVendorApproved && (
                  <FaCheck className="text-xl" />
                )}
                {!isVendorApproved && (
                  <div className="badge badge-warning">Pending</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="modal-action">
          <button
            className="btn btn-ghost"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={!isVendorApproved && selectedRole === 'vendor'}
          >
            <FaArrowRight className="mr-2" />
            Continue as {selectedRole === 'user' ? 'User' : 'Vendor'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionModal; 