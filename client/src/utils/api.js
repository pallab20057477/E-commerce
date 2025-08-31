import React from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// Create axios instance with default config
const api = axios.create({
  baseURL: 'https://e-commerce-2-8abd.onrender.com/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track active requests
const activeRequests = new Set();

// Request interceptor to add auth token and track loading
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request to active requests
    const requestId = `${config.method?.toUpperCase()} ${config.url}`;
    activeRequests.add(requestId);
    
    // Dispatch loading start event
    window.dispatchEvent(new CustomEvent('api:loading', { 
      detail: { loading: true, requestId }
    }));
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and loading states
api.interceptors.response.use(
  (response) => {
    // Remove request from active requests
    const requestId = `${response.config.method?.toUpperCase()} ${response.config.url}`;
    activeRequests.delete(requestId);
    
    // Dispatch loading end event
    window.dispatchEvent(new CustomEvent('api:loading', { 
      detail: { loading: activeRequests.size > 0, requestId }
    }));
    
    return response;
  },
  (error) => {
    // Remove request from active requests
    const requestId = error.config ? 
      `${error.config.method?.toUpperCase()} ${error.config.url}` : 'unknown';
    activeRequests.delete(requestId);
    
    // Dispatch loading end event
    window.dispatchEvent(new CustomEvent('api:loading', { 
      detail: { loading: activeRequests.size > 0, requestId }
    }));
    
    // Handle errors
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      toast.error('Session expired. Please log in again.');
    } else if (error.response?.status === 403) {
      toast.error('You do not have permission to perform this action.');
    } else if (error.response?.data?.message) {
      toast.error(error.response.data.message);
    } else {
      toast.error('An error occurred. Please try again later.');
    }
    
    return Promise.reject(error);
  }
);

// Custom hook for loading state
export const useApiLoading = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  
  React.useEffect(() => {
    const handleLoading = (e) => {
      setIsLoading(e.detail.loading);
    };
    
    window.addEventListener('api:loading', handleLoading);
    return () => window.removeEventListener('api:loading', handleLoading);
  }, []);
  
  return isLoading;
};

export default api; 