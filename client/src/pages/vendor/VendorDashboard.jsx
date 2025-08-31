import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useSocketEvents } from '../../hooks/useSocketEvents';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { 
  FaChartLine, 
  FaGavel, 
  FaTrophy,
  FaBell,
  FaShoppingCart,
  FaBox,
  FaPlus,
  FaEye,
  FaDollarSign
} from 'react-icons/fa';
import api from '../../utils/api';
import toast from 'react-hot-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const VendorDashboard = () => {
  const { user } = useAuth();
  const { joinVendorAnalytics } = useSocket();
  const { isConnected } = useSocketEvents();
  const [overview, setOverview] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [productStats, setProductStats] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  const fetchDashboardData = useCallback(async () => {
    try {
      console.log('Fetching vendor dashboard data...');
      const [
        overviewRes,
        salesRes,
        productStatsRes,
        categoryRes,
        topProductsRes,
        ordersRes,
        productsRes
      ] = await Promise.all([
        api.get(`/vendors/dashboard?period=${period}`),
        api.get(`/vendors/analytics/sales?period=${period}`),
        api.get(`/vendors/analytics/products?period=${period}`),
        api.get('/vendors/analytics/categories'),
        api.get(`/vendors/analytics/top-products?period=${period}`),
        api.get('/vendors/orders?limit=5'),
        api.get('/vendors/products?limit=5')
      ]);

      // Ensure productStats is always an array
      const productStatsData = productStatsRes.data?.data || productStatsRes.data || [];
      const normalizedProductStats = Array.isArray(productStatsData) 
        ? productStatsData 
        : Object.entries(productStatsData).map(([status, count]) => ({ status, count }));

      setOverview(overviewRes.data);
      // Backend returns { success, salesAnalytics } for /vendors/analytics/sales
      setSalesData(salesRes.data?.salesAnalytics || salesRes.data?.dailyEarnings || []);
      setProductStats(normalizedProductStats);
      setCategoryData(categoryRes.data?.data || categoryRes.data || []);
      // Backend returns { success, topProducts }
      setTopProducts(topProductsRes.data?.topProducts || topProductsRes.data || []);
      setRecentOrders(ordersRes.data?.orders || []);
      setRecentProducts(productsRes.data?.products || []);
    } catch (error) {
      console.error('Failed to fetch vendor dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 300000); // Refresh every 5 minutes

    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Socket.IO integration for real-time updates
  useEffect(() => {
    if (isConnected) {
      joinVendorAnalytics();
      console.log('Vendor dashboard connected to real-time updates');
    }
  }, [isConnected, joinVendorAnalytics]);

  const salesChartData = {
    // salesAnalytics items have _id as date string
    labels: salesData.map(item => item._id || item.date || 'Unknown'),
    datasets: [
      {
        label: 'Daily Revenue',
        data: salesData.map(item => item.revenue || 0),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const productChartData = {
    labels: productStats.map(item => item.status || 'Unknown'),
    datasets: [
      {
        data: productStats.map(item => item.count || 0),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF'
        ]
      }
    ]
  };

  const categoryChartData = {
    labels: categoryData.map(item => item._id || 'Unknown'),
    datasets: [
      {
        label: 'Products by Category',
        data: categoryData.map(item => item.count || 0),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40'
        ]
      }
    ]
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-base-100 to-base-200 flex items-center justify-center">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
          <p className="text-lg">Loading vendor dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 to-base-200">
      <div className="container mx-auto p-6">
        

        {/* Hero / Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary via-indigo-500 to-purple-600 text-primary-content shadow-xl mb-8">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_20%_20%,white,transparent_25%),radial-gradient(circle_at_80%_0%,white,transparent_25%)]" />
          <div className="p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold">
                {user?.name?.[0]?.toUpperCase() || 'V'}
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold leading-tight">Welcome back{user?.name ? `, ${user.name}` : ''}!</h1>
                <p className="opacity-80">Manage your store, track sales, and grow your business.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/vendor/products/add" className="btn btn-lg">Add Product</Link>
              <Link to="/vendor/orders" className="btn btn-outline btn-lg text-primary-content border-primary-content">View Orders</Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-base-100 shadow-xl rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <FaBell className="mr-3" />
            Quick Actions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/vendor/products/add"
              className="card bg-gradient-to-br from-primary to-primary-focus text-primary-content hover:from-primary-focus hover:to-primary transition-all duration-300 transform hover:scale-105"
            >
              <div className="card-body p-6 text-center">
                <FaPlus className="text-3xl mb-3" />
                <h3 className="font-semibold text-lg">Add New Product</h3>
                <p className="text-sm opacity-80">Add a new product to your catalog</p>
              </div>
            </Link>

            <Link
              to="/vendor/products"
              className="card bg-gradient-to-br from-success to-success-focus text-success-content hover:from-success-focus hover:to-success transition-all duration-300 transform hover:scale-105"
            >
              <div className="card-body p-6 text-center">
                <FaBox className="text-3xl mb-3" />
                <h3 className="font-semibold text-lg">Manage Products</h3>
                <p className="text-sm opacity-80">View and edit your products</p>
              </div>
            </Link>

            <Link
              to="/vendor/orders"
              className="card bg-gradient-to-br from-warning to-warning-focus text-warning-content hover:from-warning-focus hover:to-warning transition-all duration-300 transform hover:scale-105"
            >
              <div className="card-body p-6 text-center">
                <FaShoppingCart className="text-3xl mb-3" />
                <h3 className="font-semibold text-lg">View Orders</h3>
                <p className="text-sm opacity-80">Manage customer orders</p>
              </div>
            </Link>

            <Link
              to="/vendor/products/add-auction"
              className="card bg-gradient-to-br from-indigo-500 to-indigo-700 text-indigo-50 hover:from-indigo-700 hover:to-indigo-900 transition-all duration-300 transform hover:scale-105"
            >
              <div className="card-body p-6 text-center">
                <FaGavel className="text-3xl mb-3" />
                <h3 className="font-semibold text-lg">Add Auction</h3>
                <p className="text-sm opacity-80">Create a new auction product</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex justify-end mb-6">
          <select
            className="select select-bordered select-lg"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>

        {/* Overview Cards */}
        {overview && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Revenue */}
            <div className="stat bg-gradient-to-br from-primary to-primary-focus text-primary-content shadow-xl rounded-2xl transform hover:scale-105 transition-transform duration-300">
              <div className="stat-figure text-primary-content">
                <FaDollarSign className="text-3xl" />
              </div>
              <div className="stat-title text-primary-content/80">Total Revenue</div>
              <div className="stat-value text-primary-content">${overview.stats?.totalEarnings?.toFixed(2) ?? '0'}</div>
              <div className="stat-desc text-primary-content/70">{overview.stats?.totalSales ?? 0} sales</div>
            </div>

            {/* Total Products */}
            <div className="stat bg-gradient-to-br from-success to-success-focus text-success-content shadow-xl rounded-2xl transform hover:scale-105 transition-transform duration-300">
              <div className="stat-figure text-success-content">
                <FaBox className="text-3xl" />
              </div>
              <div className="stat-title text-success-content/80">Total Products</div>
              <div className="stat-value text-success-content">{overview.stats?.totalProducts ?? 0}</div>
              <div className="stat-desc text-success-content/70">
                {overview.stats?.pendingProducts ?? 0} pending approval
              </div>
            </div>

            {/* Active Products */}
            <div className="stat bg-gradient-to-br from-blue-500 to-blue-700 text-blue-50 shadow-xl rounded-2xl transform hover:scale-105 transition-transform duration-300">
              <div className="stat-figure text-blue-50">
                <FaEye className="text-3xl" />
              </div>
              <div className="stat-title text-blue-100/80">Active Products</div>
              <div className="stat-value text-blue-50">{Math.max(0, (overview.stats?.totalProducts ?? 0) - (overview.stats?.pendingProducts ?? 0))}</div>
              <div className="stat-desc text-blue-100/70">Currently selling</div>
            </div>

            {/* Recent Orders */}
            <div className="stat bg-gradient-to-br from-warning to-warning-focus text-warning-content shadow-xl rounded-2xl transform hover:scale-105 transition-transform duration-300">
              <div className="stat-figure text-warning-content">
                <FaShoppingCart className="text-3xl" />
              </div>
              <div className="stat-title text-warning-content/80">Recent Orders</div>
              <div className="stat-value text-warning-content">{recentOrders.length}</div>
              <div className="stat-desc text-warning-content/70">Last 5 orders</div>
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="card bg-base-100 shadow-xl transform hover:scale-105 transition-transform duration-300">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-6">
                <FaChartLine className="text-2xl mr-2" />
                Sales Performance
              </h2>
              <Line data={salesChartData} options={{
                responsive: true,
                plugins: {
                  legend: { position: 'top' },
                  title: { display: false }
                },
                scales: {
                  y: { beginAtZero: true }
                }
              }} />
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl transform hover:scale-105 transition-transform duration-300">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-6">
                <FaBox className="text-2xl mr-2" />
                Product Status Distribution
              </h2>
              <Doughnut data={productChartData} options={{
                responsive: true,
                plugins: {
                  legend: { position: 'bottom' }
                }
              }} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="card bg-base-100 shadow-xl transform hover:scale-105 transition-transform duration-300">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-6">
                <FaBox className="text-2xl mr-2" />
                Product Categories
              </h2>
              <Doughnut data={categoryChartData} options={{
                responsive: true,
                plugins: {
                  legend: { position: 'bottom' }
                }
              }} />
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl transform hover:scale-105 transition-transform duration-300">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-6">
                <FaTrophy className="text-2xl mr-2" />
                Top Performing Products
              </h2>
              <div className="space-y-4">
                {topProducts && topProducts.length > 0 ? (
                  topProducts.slice(0, 5).map((product, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-base-200 rounded-lg hover:bg-base-300 transition-colors">
                      <div>
                        <div className="font-medium">{product.name || 'Unknown Product'}</div>
                        <div className="text-sm text-base-content/70">{product.category || 'No Category'}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-success">${(((product.price || 0) * (product.sales || 0)) || 0).toFixed(2)}</div>
                        <div className="text-sm text-base-content/70">{product.sales || 0} sold</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-base-content/70">
                    <p>No product data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="card bg-base-100 shadow-xl transform hover:scale-105 transition-transform duration-300">
            <div className="card-body">
              <div className="flex justify-between items-center mb-6">
                <h2 className="card-title text-2xl">
                  <FaShoppingCart className="text-2xl mr-2" />
                  Recent Orders
                </h2>
                <Link to="/vendor/orders" className="btn btn-primary btn-sm">
                  View All
                </Link>
              </div>
              <div className="space-y-4">
                {recentOrders && recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <div key={order._id} className="flex justify-between items-center p-3 bg-base-200 rounded-lg">
                      <div>
                        <div className="font-medium">Order #{order._id?.slice(-8)}</div>
                        <div className="text-sm text-base-content/70">${order.totalAmount}</div>
                      </div>
                      <div className="text-right">
                        <div className={`badge ${order.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                          {order.status}
                        </div>
                        <div className="text-sm text-base-content/70">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-base-content/70">
                    <p>No recent orders</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Products */}
          <div className="card bg-base-100 shadow-xl transform hover:scale-105 transition-transform duration-300">
            <div className="card-body">
              <div className="flex justify-between items-center mb-6">
                <h2 className="card-title text-2xl">
                  <FaBox className="text-2xl mr-2" />
                  Recent Products
                </h2>
                <Link to="/vendor/products" className="btn btn-primary btn-sm">
                  View All
                </Link>
              </div>
              <div className="space-y-4">
                {recentProducts && recentProducts.length > 0 ? (
                  recentProducts.map((product) => (
                    <div key={product._id} className="flex justify-between items-center p-3 bg-base-200 rounded-lg">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-base-content/70">${product.price}</div>
                      </div>
                      <div className="text-right">
                        <div className={`badge ${product.approvalStatus === 'approved' ? 'badge-success' : 'badge-warning'}`}>
                          {product.approvalStatus}
                        </div>
                        <div className="text-sm text-base-content/70">
                          {new Date(product.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-base-content/70">
                    <p>No recent products</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;
