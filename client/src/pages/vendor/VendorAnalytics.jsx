import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FaChartLine, FaChartBar, FaChartPie, FaCalendarAlt, FaFilter, FaDownload, FaEye, FaShoppingCart, FaStar, FaUsers } from 'react-icons/fa';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const VendorAnalytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const [analytics, setAnalytics] = useState({
    salesData: [],
    productPerformance: [],
    customerMetrics: {},
    revenueTrends: [],
    topProducts: [],
    customerSegments: []
  });
  const [selectedMetric, setSelectedMetric] = useState('sales');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/vendors/analytics?period=${period}`);
      
      if (response.data.success) {
        setAnalytics({
          salesData: response.data.salesData || [],
          productPerformance: response.data.productPerformance || [],
          customerMetrics: response.data.customerMetrics || {},
          revenueTrends: response.data.revenueTrends || [],
          topProducts: response.data.topProducts || [],
          customerSegments: response.data.customerSegments || []
        });
      } else {
        setAnalytics({
          salesData: [],
          productPerformance: [],
          customerMetrics: {},
          revenueTrends: [],
          topProducts: [],
          customerSegments: []
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
      setAnalytics({
        salesData: [],
        productPerformance: [],
        customerMetrics: {},
        revenueTrends: [],
        topProducts: [],
        customerSegments: []
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  const getPeriodLabel = (period) => {
    const labels = {
      '7': 'Last 7 Days',
      '30': 'Last 30 Days',
      '90': 'Last 90 Days',
      '365': 'Last Year'
    };
    return labels[period] || 'Last 30 Days';
  };

  const renderSalesChart = () => (
    <div className="bg-base-100 shadow-xl rounded-2xl p-6">
      <h3 className="text-xl font-bold mb-4 flex items-center">
        <FaChartLine className="mr-2" />
        Sales Trend
      </h3>
      {analytics.salesData && analytics.salesData.length > 0 ? (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Orders</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {analytics.salesData.map((day, index) => (
                  <tr key={index}>
                    <td>{new Date(day._id || day.date).toLocaleDateString()}</td>
                    <td>{day.orders || 0}</td>
                    <td>{formatCurrency(day.revenue || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-base-content/60">
          <FaChartLine className="text-4xl mx-auto mb-4" />
          <p>No sales data available</p>
        </div>
      )}
    </div>
  );

  const renderProductPerformance = () => (
    <div className="bg-base-100 shadow-xl rounded-2xl p-6">
      <h3 className="text-xl font-bold mb-4 flex items-center">
        <FaChartBar className="mr-2" />
        Product Performance
      </h3>
      {analytics.topProducts && analytics.topProducts.length > 0 ? (
        <div className="space-y-4">
          {analytics.topProducts.map((product, index) => (
            <div key={product._id} className="flex items-center space-x-4 p-3 bg-base-200 rounded-lg">
              <div className="text-2xl font-bold text-primary">#{index + 1}</div>
              <div className="avatar">
                <div className="w-12 h-12 rounded">
                  <img src={product.image || '/placeholder.jpg'} alt={product.name} />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">{product.name}</h4>
                <p className="text-sm text-base-content/60">{product.category}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-success">{formatCurrency(product.revenue || 0)}</p>
                <p className="text-xs text-base-content/60">{product.sales || 0} sales</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-base-content/60">
          <FaChartBar className="text-4xl mx-auto mb-4" />
          <p>No products with sales data yet</p>
          <p className="text-sm mt-2">Products will appear here once they start selling</p>
        </div>
      )}
    </div>
  );

  const renderCustomerMetrics = () => (
    <div className="bg-base-100 shadow-xl rounded-2xl p-6">
      <h3 className="text-xl font-bold mb-4 flex items-center">
        <FaUsers className="mr-2" />
        Customer Insights
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="stat bg-base-200 rounded-lg">
          <div className="stat-figure text-primary">
            <FaUsers className="text-2xl" />
          </div>
          <div className="stat-title">Total Customers</div>
          <div className="stat-value text-primary">{formatNumber(analytics.customerMetrics.totalCustomers || 0)}</div>
          <div className="stat-desc">Unique customers</div>
        </div>
        
        <div className="stat bg-base-200 rounded-lg">
          <div className="stat-figure text-success">
            <FaStar className="text-2xl" />
          </div>
          <div className="stat-title">Average Rating</div>
          <div className="stat-value text-success">{(analytics.customerMetrics.averageRating || 0).toFixed(1)}</div>
          <div className="stat-desc">Customer satisfaction</div>
        </div>
        
        <div className="stat bg-base-200 rounded-lg">
          <div className="stat-figure text-info">
            <FaShoppingCart className="text-2xl" />
          </div>
          <div className="stat-title">Repeat Customers</div>
          <div className="stat-value text-info">{formatNumber(analytics.customerMetrics.repeatCustomers || 0)}</div>
          <div className="stat-desc">Loyal customers</div>
        </div>
        
        <div className="stat bg-base-200 rounded-lg">
          <div className="stat-figure text-warning">
            <FaChartLine className="text-2xl" />
          </div>
          <div className="stat-title">Customer Growth</div>
          <div className="stat-value text-warning">{(analytics.customerMetrics.growthRate || 0).toFixed(1)}%</div>
          <div className="stat-desc">Monthly growth</div>
        </div>
      </div>
    </div>
  );

  const renderRevenueTrends = () => (
    <div className="bg-base-100 shadow-xl rounded-2xl p-6">
      <h3 className="text-xl font-bold mb-4 flex items-center">
        <FaChartPie className="mr-2" />
        Revenue Analysis
      </h3>
      {analytics.revenueTrends && analytics.revenueTrends.length > 0 ? (
        <div className="space-y-4">
          {analytics.revenueTrends.map((trend, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
              <div>
                <p className="font-semibold">{trend.period}</p>
                <p className="text-sm text-base-content/60">{trend.description}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary">{formatCurrency(trend.revenue || 0)}</p>
                <p className={`text-xs ${trend.change >= 0 ? 'text-success' : 'text-error'}`}>
                  {trend.change >= 0 ? '+' : ''}{trend.change}% change
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-base-content/60">
          <FaChartPie className="text-4xl mx-auto mb-4" />
          <p>No revenue trend data</p>
        </div>
      )}
    </div>
  );

  const exportAnalytics = () => {
    const data = {
      period: getPeriodLabel(period),
      salesData: analytics.salesData,
      topProducts: analytics.topProducts,
      customerMetrics: analytics.customerMetrics,
      revenueTrends: analytics.revenueTrends
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Analytics data exported successfully');
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
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Analytics & Insights</h2>
          <p className="text-base-content/70">Deep dive into your business performance</p>
        </div>
        <div className="flex gap-4 mt-4 md:mt-0">
          <select
            className="select select-bordered"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">Last Year</option>
          </select>
          <button
            onClick={exportAnalytics}
            className="btn btn-outline"
          >
            <FaDownload className="mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Metric Selector */}
      <div className="bg-base-100 shadow-xl rounded-2xl p-6">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'sales', label: 'Sales', icon: FaChartLine },
            { key: 'products', label: 'Products', icon: FaChartBar },
            { key: 'customers', label: 'Customers', icon: FaUsers },
            { key: 'revenue', label: 'Revenue', icon: FaChartPie }
          ].map((metric) => (
            <button
              key={metric.key}
              onClick={() => setSelectedMetric(metric.key)}
              className={`btn btn-sm ${
                selectedMetric === metric.key ? 'btn-primary' : 'btn-outline'
              }`}
            >
              <metric.icon className="mr-2" />
              {metric.label}
            </button>
          ))}
        </div>
      </div>

      {/* Analytics Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {selectedMetric === 'sales' && renderSalesChart()}
        {selectedMetric === 'products' && renderProductPerformance()}
        {selectedMetric === 'customers' && renderCustomerMetrics()}
        {selectedMetric === 'revenue' && renderRevenueTrends()}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="stat bg-base-100 shadow-xl rounded-2xl">
          <div className="stat-figure text-primary">
            <FaChartLine className="text-2xl" />
          </div>
          <div className="stat-title">Total Revenue</div>
          <div className="stat-value text-primary">
            {formatCurrency(analytics.salesData.reduce((sum, day) => sum + (day.revenue || 0), 0))}
          </div>
          <div className="stat-desc">{getPeriodLabel(period)}</div>
        </div>
        
        <div className="stat bg-base-100 shadow-xl rounded-2xl">
          <div className="stat-figure text-success">
            <FaShoppingCart className="text-2xl" />
          </div>
          <div className="stat-title">Total Orders</div>
          <div className="stat-value text-success">
            {formatNumber(analytics.salesData.reduce((sum, day) => sum + (day.orders || 0), 0))}
          </div>
          <div className="stat-desc">{getPeriodLabel(period)}</div>
        </div>
        
        <div className="stat bg-base-100 shadow-xl rounded-2xl">
          <div className="stat-figure text-info">
            <FaUsers className="text-2xl" />
          </div>
          <div className="stat-title">Active Customers</div>
          <div className="stat-value text-info">
            {formatNumber(analytics.customerMetrics.totalCustomers || 0)}
          </div>
          <div className="stat-desc">Unique customers</div>
        </div>
        
        <div className="stat bg-base-100 shadow-xl rounded-2xl">
          <div className="stat-figure text-warning">
            <FaStar className="text-2xl" />
          </div>
          <div className="stat-title">Avg Rating</div>
          <div className="stat-value text-warning">
            {(analytics.customerMetrics.averageRating || 0).toFixed(1)}
          </div>
          <div className="stat-desc">Customer satisfaction</div>
        </div>
      </div>
    </div>
  );
};

export default VendorAnalytics;
