import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
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
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { 
  FaChartLine, 
  FaUsers, 
  FaGavel, 
  FaStore,
  FaTrophy,
  FaFire,
  FaBell,
  FaCalendarAlt,
  FaClipboardList,
  FaClock,
  FaCheck,
  FaTimes,
  FaShoppingCart,
  FaBox,
  FaShieldAlt,
  FaPlus,
  FaEye,
  FaDollarSign
} from 'react-icons/fa';
import AdminNavigation from '../../components/admin/AdminNavigation';
import { useAdminData } from '../../contexts/AdminDataContext';

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

const Dashboard = () => {
  const navigate = useNavigate();
  const { totalUsers } = useAdminData();
  const { joinAnalytics, joinSystemMonitoring } = useSocket();
  const { isConnected, userRole } = useSocketEvents();
  const [overview, setOverview] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [userGrowth, setUserGrowth] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [auctionData, setAuctionData] = useState(null);
  const [activityFeed, setActivityFeed] = useState(null);
  const [vendorRequests, setVendorRequests] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [dailyStats, setDailyStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  const fetchDashboardData = useCallback(async () => {
    try {
      console.log('Fetching dashboard data...');
      const [
        overviewRes,
        salesRes,
        userGrowthRes,
        categoryRes,
        topProductsRes,
        auctionRes,
        activityRes,
        vendorRequestsRes,
        dailyStatsRes
      ] = await Promise.all([
        api.get(`/admin/dashboard/overview?period=${period}`),
        api.get(`/admin/dashboard/sales-chart?period=${period}`),
        api.get(`/admin/dashboard/user-growth?period=${period}`),
        api.get('/admin/dashboard/category-distribution'),
        api.get(`/admin/dashboard/top-products?period=${period}`),
        api.get(`/admin/dashboard/auction-performance?period=${period}`),
        api.get('/admin/dashboard/activity-feed'),
        api.get('/vendor-requests/stats/overview'),
        api.get('/admin/orders/daily-stats')
      ]);

      console.log('Daily stats response:', dailyStatsRes.data);
      setOverview(overviewRes.data);
      setSalesData(salesRes.data);
      setUserGrowth(userGrowthRes.data);
      setCategoryData(categoryRes.data);
      setTopProducts(topProductsRes.data);
      setAuctionData(auctionRes.data);
      setActivityFeed(activityRes.data);
      setVendorRequests(vendorRequestsRes.data);
      setDailyStats(dailyStatsRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds

    // Listen for userDeleted event to refresh dashboard data immediately
    const handleUserDeleted = () => {
      fetchDashboardData();
    };
    window.addEventListener('userDeleted', handleUserDeleted);

    return () => {
      clearInterval(interval);
      window.removeEventListener('userDeleted', handleUserDeleted);
    };
  }, [fetchDashboardData]);

  // Socket.IO integration for real-time updates
  useEffect(() => {
    if (isConnected && userRole === 'admin') {
      // Join analytics and system monitoring rooms
      joinAnalytics();
      joinSystemMonitoring();
      
      console.log('Admin dashboard connected to real-time updates');
    }
  }, [isConnected, userRole, joinAnalytics, joinSystemMonitoring]);

  useEffect(() => {
    if (overview) {
      console.log('Admin Dashboard Overview:', overview);
    }
  }, [overview]);

  const salesChartData = {
    labels: salesData.map(item => item._id || 'Unknown'),
    datasets: [
      {
        label: 'Revenue',
        data: salesData.map(item => item.revenue || 0),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Orders',
        data: salesData.map(item => item.orders || 0),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const userGrowthData = {
    labels: userGrowth.map(item => item._id || 'Unknown'),
    datasets: [
      {
        label: 'New Users',
        data: userGrowth.map(item => item.newUsers || 0),
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const categoryChartData = {
    labels: categoryData.map(item => item._id || 'Unknown'),
    datasets: [
      {
        data: categoryData.map(item => item.count || 0),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
          '#FF6384',
          '#36A2EB'
        ]
      }
    ]
  };

  const dailyStatsChartData = {
    labels: dailyStats.map(item => new Date(item._id).toLocaleDateString()),
    datasets: [
      {
        label: 'Orders',
        data: dailyStats.map(item => item.orderCount || 0),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y'
      },
      {
        label: 'Revenue ($)',
        data: dailyStats.map(item => item.revenue || 0),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y1'
      }
    ]
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-base-100 to-base-200 flex items-center justify-center">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
          <p className="text-lg">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 to-base-200">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <AdminNavigation />
        </div>
        {/* Quick Actions */}
        <div className="bg-base-100 shadow-xl rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <FaBell className="mr-3" />
            Quick Actions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/admin/vendors/add"
              className="card bg-gradient-to-br from-primary to-primary-focus text-primary-content hover:from-primary-focus hover:to-primary transition-all duration-300 transform hover:scale-105"
            >
              <div className="card-body p-6 text-center">
                <FaStore className="text-3xl mb-3" />
                <h3 className="font-semibold text-lg">Add New Vendor</h3>
                <p className="text-sm opacity-80">Create a new vendor account</p>
              </div>
            </Link>

            <Link
              to="/admin/users/add"
              className="card bg-gradient-to-br from-success to-success-focus text-success-content hover:from-success-focus hover:to-success transition-all duration-300 transform hover:scale-105"
            >
              <div className="card-body p-6 text-center">
                <FaUsers className="text-3xl mb-3" />
                <h3 className="font-semibold text-lg">Add New User</h3>
                <p className="text-sm opacity-80">Create a new user account</p>
              </div>
            </Link>

            <Link
              to="/admin/products/add"
              className="card bg-gradient-to-br from-warning to-warning-focus text-warning-content hover:from-warning-focus hover:to-warning transition-all duration-300 transform hover:scale-105"
            >
              <div className="card-body p-6 text-center">
                <FaBox className="text-3xl mb-3" />
                <h3 className="font-semibold text-lg">Add New Product</h3>
                <p className="text-sm opacity-80">Add a new product to catalog</p>
              </div>
            </Link>

            {/* New Quick Action: View Active Auctions */}
            <Link
              to="/admin/auctions/active"
              className="card bg-gradient-to-br from-indigo-500 to-indigo-700 text-indigo-50 hover:from-indigo-700 hover:to-indigo-900 transition-all duration-300 transform hover:scale-105"
            >
              <div className="card-body p-6 text-center">
                <FaGavel className="text-3xl mb-3" />
                <h3 className="font-semibold text-lg">View Active Auctions</h3>
                <p className="text-sm opacity-80">Manage all live auctions</p>
              </div>
            </Link>

            <button
              className="card bg-gradient-to-br from-info to-info-focus text-info-content hover:from-info-focus hover:to-info transition-all duration-300 transform hover:scale-105"
              onClick={() => navigate('/admin/products/auction/add')}
            >
              <div className="card-body p-6 text-center">
                <FaPlus className="text-3xl mb-3" />
                <h3 className="font-semibold text-lg">Add Auction Product</h3>
                <p className="text-sm opacity-80">Add a new auction product</p>
              </div>
            </button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            {/* Total Revenue */}
            <div className="stat bg-gradient-to-br from-primary to-primary-focus text-primary-content shadow-xl rounded-2xl transform hover:scale-105 transition-transform duration-300">
              {/* <div className="stat-figure text-primary-content"> */}
                {/* <FaShoppingCart className="text-3xl" /> */}
              {/* </div> */}
              <div className="stat-title text-primary-content/80">Total Revenue</div>
              <div className="stat-value text-primary-content">${overview.revenue?.totalRevenue?.toFixed(2) ?? '0'}</div>
              <div className="stat-desc text-primary-content/70">{overview.revenue?.orderCount ?? 0} orders</div>
            </div>

            {/* Total Users */}
            <div
              className="stat bg-gradient-to-br from-success to-success-focus text-success-content shadow-xl rounded-2xl transform hover:scale-105 transition-transform duration-300 cursor-pointer"
              onClick={() => navigate('/admin/users')}
              title="View all users"
            >
              <div className="stat-figure text-success-content">
                <FaUsers className="text-3xl" />
              </div>
              <div className="stat-title text-success-content/80">Total Users</div>
              <div className="stat-value text-success-content">{overview?.overview?.totalUsers ?? 0}</div>
              <div className="stat-desc text-success-content/70">Total registered users</div>
            </div>

            {/* Total Vendors */}
            <div
              className="stat bg-gradient-to-br from-blue-500 to-blue-700 text-blue-50 shadow-xl rounded-2xl transform hover:scale-105 transition-transform duration-300 cursor-pointer"
              onClick={() => navigate('/admin/accounts?tab=vendors')}
              title="View all vendors"
            >
              <div className="stat-figure text-blue-50">
                <FaStore className="text-3xl" />
              </div>
              <div className="stat-title text-blue-100/80">Total Vendors</div>
              <div className="stat-value text-blue-50">{overview?.overview?.totalVendors ?? 0}</div>
              <div className="stat-desc text-blue-100/70">Vendors in system</div>
            </div>

            {/* Active Auctions */}
            <div
              className="stat bg-gradient-to-br from-warning to-warning-focus text-warning-content shadow-xl rounded-2xl transform hover:scale-105 transition-transform duration-300 cursor-pointer"
              onClick={() => navigate('/admin/auctions/active')}
              title="View active auctions"
            >
              <div className="stat-figure text-warning-content">
                <FaGavel className="text-3xl" />
              </div>
              <div className="stat-title text-warning-content/80">Active Auctions</div>
              <div className="stat-value text-warning-content">{overview.auctions?.activeAuctions ?? 0}</div>
              <div className="stat-desc text-warning-content/70">{overview.auctions?.totalAuctions ?? 0} total</div>
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="card bg-base-100 shadow-xl transform hover:scale-105 transition-transform duration-300">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-6">
                <FaChartLine className="text-2xl mr-2" />
                Sales & Revenue
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
                <FaUsers className="text-2xl mr-2" />
                User Growth
              </h2>
              <Line data={userGrowthData} options={{
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="card bg-base-100 shadow-xl transform hover:scale-105 transition-transform duration-300">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-6">
                <FaStore className="text-2xl mr-2" />
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
                Top Products
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
                        <div className="font-bold text-success">${(product.totalRevenue || 0).toFixed(2)}</div>
                        <div className="text-sm text-base-content/70">{product.totalSold || 0} sold</div>
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

        {/* Daily Orders & Revenue Chart */}
        {dailyStats.length > 0 && (
          <div className="card bg-base-100 shadow-xl transform hover:scale-105 transition-transform duration-300 mb-8">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-6">
                <FaCalendarAlt className="text-2xl mr-2" />
                Daily Orders & Revenue
              </h2>
              <Line data={dailyStatsChartData} options={{
                responsive: true,
                plugins: {
                  legend: { position: 'top' },
                  title: { display: false }
                },
                scales: {
                  y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Orders'
                    }
                  },
                  y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Revenue ($)'
                    },
                    grid: {
                      drawOnChartArea: false,
                    },
                  }
                }
              }} />
            </div>
          </div>
        )}

        {/* Auction Stats */}
        {auctionData && (
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-8">
            <div className="card bg-base-100 shadow-xl transform hover:scale-105 transition-transform duration-300">
              <div className="card-body">
                <h2 className="card-title text-2xl mb-6">
                  <FaGavel className="text-2xl mr-2" />
                  Auction Performance
                </h2>
                <div className="stats stats-vertical">
                  {auctionData.performance && auctionData.performance.length > 0 ? (
                    auctionData.performance.map((stat, index) => (
                      <div key={index} className="stat">
                        <div className="stat-title">{stat._id || 'Unknown'}</div>
                        <div className="stat-value">{stat.count || 0}</div>
                        <div className="stat-desc">Avg: ${(stat.avgFinalPrice || 0).toFixed(2)}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-base-content/70">
                      <p>No auction data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Vendor Requests Overview */}
        <div className="card bg-base-100 shadow-xl transform hover:scale-105 transition-transform duration-300 mb-8">
          <div className="card-body">
            <div className="flex justify-between items-center mb-6">
              <h2 className="card-title text-2xl">
                <FaClipboardList className="text-2xl mr-2" />
                Vendor Requests
              </h2>
              <Link to="/admin/vendor-requests" className="btn btn-primary btn-sm">
                View All Requests
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="stat bg-warning/10 rounded-lg p-4">
                <div className="stat-figure text-warning">
                  <FaClock className="text-2xl" />
                </div>
                <div className="stat-title text-warning">Pending Requests</div>
                <div className="stat-value text-warning">{vendorRequests.pending}</div>
                <div className="stat-desc">Awaiting review</div>
              </div>
              
              <div className="stat bg-success/10 rounded-lg p-4">
                <div className="stat-figure text-success">
                  <FaCheck className="text-2xl" />
                </div>
                <div className="stat-title text-success">Approved</div>
                <div className="stat-value text-success">{vendorRequests.approved}</div>
                <div className="stat-desc">This month</div>
              </div>
              
              <div className="stat bg-error/10 rounded-lg p-4">
                <div className="stat-figure text-error">
                  <FaTimes className="text-2xl" />
                </div>
                <div className="stat-title text-error">Rejected</div>
                <div className="stat-value text-error">{vendorRequests.rejected}</div>
                <div className="stat-desc">This month</div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        {/* Removed Recent Activity section as per request */}
      </div>
    </div>
  );
};

export default Dashboard; 