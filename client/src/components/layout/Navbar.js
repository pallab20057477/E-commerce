import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useNotification } from '../../contexts/NotificationContext';
import SocketStatusIndicator from '../common/SocketStatusIndicator';
import { FaShoppingCart, FaBell, FaBars, FaTimes, FaUserShield, FaUser, FaStore, FaSignOutAlt } from 'react-icons/fa';
import { useState } from 'react';

const navLinks = [
  { to: '/products', label: 'Products' },
  { to: '/auction', label: 'Auctions' },
  { to: '/orders', label: 'Orders' },
];

// UserDropdown component
function UserDropdown() {
  const {
    user,
    vendor,
    currentRole,
    isVendorApproved,
    switchRole,
    logout
  } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleRoleSwitch = (role) => {
    try {
      switchRole(role);
      setOpen(false);
      if (role === 'vendor') {
        navigate('/vendor/dashboard');
      } else {
        navigate('/');
      }
    } catch (error) {
      // Optionally show error
    }
  };

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate('/login');
  };
   
  // if (!user) return null;

  return (
    <div className="relative">
      <button
        className="avatar placeholder focus:outline-none focus:ring-2 focus:ring-primary"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="User menu"
      >
        <div className="bg-primary text-primary-content rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg shadow">
          {user.name?.charAt(0).toUpperCase()}
        </div>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-base-100 shadow-2xl rounded-xl border z-50 animate-fade-in">
          {/* User Info */}
          <div className="p-4 border-b flex items-center gap-3">
            <div className="avatar placeholder">
              <div className="bg-primary text-primary-content rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl">
                {user.name?.charAt(0).toUpperCase()}
              </div>
            </div>
            <div>
              <p className="font-semibold text-lg">{user.name}</p>
              <p className="text-sm text-base-content/60">{user.email}</p>
              <span className="badge badge-outline mt-1">{user.role === 'admin' ? 'Admin' : (currentRole === 'vendor' ? 'Vendor' : 'User')}</span>
            </div>
          </div>
          {/* Quick Links */}
          <div className="p-2 flex flex-col gap-1">
            {/* Admin Panel link for admins */}
            {user.role === 'admin' && (
              <>
                <Link to="/admin/dashboard" className="w-full text-left p-3 hover:bg-base-200 rounded-lg flex items-center gap-3 transition-colors font-semibold" onClick={() => setOpen(false)}>
                  <FaUserShield className="text-primary" />
                  <span>Admin Panel</span>
                </Link>
                <Link to="/admin/orders" className="w-full text-left p-3 hover:bg-base-200 rounded-lg flex items-center gap-3 transition-colors font-semibold" onClick={() => setOpen(false)}>
                  <FaShoppingCart className="text-primary" />
                  <span>Process Orders</span>
                </Link>
              </>
            )}
            <Link to="/profile" className="w-full text-left p-3 hover:bg-base-200 rounded-lg flex items-center gap-3 transition-colors" onClick={() => setOpen(false)}>
              <FaUser className="text-primary" />
              <span>Profile</span>
            </Link>
            <Link to="/orders" className="w-full text-left p-3 hover:bg-base-200 rounded-lg flex items-center gap-3 transition-colors" onClick={() => setOpen(false)}>
              <FaShoppingCart className="text-primary" />
              <span>Orders</span>
            </Link>
            {/* Only show vendor links for non-admins */}
            {user.role !== 'admin' && !isVendorApproved && !vendor && (
              <Link to="/vendor/apply" className="w-full text-left p-3 hover:bg-base-200 rounded-lg flex items-center gap-3 transition-colors" onClick={() => setOpen(false)}>
                <FaStore className="text-warning" />
                <span>Become a Vendor</span>
              </Link>
            )}
            {user.role !== 'admin' && isVendorApproved && (
              <Link to="/vendor/dashboard" className="w-full text-left p-3 hover:bg-base-200 rounded-lg flex items-center gap-3 transition-colors" onClick={() => setOpen(false)}>
                <FaStore className="text-success" />
                <span>Vendor Dashboard</span>
              </Link>
            )}
            {/* <Link to="/profile/setting" className="w-full text-left p-3 hover:bg-base-200 rounded-lg flex items-center gap-3 transition-colors" onClick={() => setOpen(false)}>
              <FaUser className="text-primary" />
              <span>Settings</span>
            </Link> */}
          </div>
          {/* Role Switcher - only for non-admins */}
          {user.role !== 'admin' && isVendorApproved && (
            <div className="p-2 border-t flex flex-col gap-1">
              {currentRole === 'user' && (
                <button
                  onClick={() => handleRoleSwitch('vendor')}
                  className="w-full text-left p-3 hover:bg-base-200 rounded-lg flex items-center gap-3 transition-colors"
                >
                  <FaStore className="text-success" />
                  <span>Switch to Vendor</span>
                </button>
              )}
              {/* {currentRole === 'vendor' && (
                <button
                  onClick={() => handleRoleSwitch('user')}
                  className="w-full text-left p-3 hover:bg-base-200 rounded-lg flex items-center gap-3 transition-colors"
                >
                  <FaUser />
                  <span>Switch to User</span>
                </button>
              )} */}
            </div>
          )}
          {/* Logout */}
          <div className="p-2 border-t">
            <button
              onClick={handleLogout}
              className="w-full text-left p-3 hover:bg-base-200 rounded-lg flex items-center gap-3 transition-colors text-error"
            >
              <FaSignOutAlt />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} tabIndex={-1} aria-hidden="true" />
      )}
    </div>
  );
}

const Navbar = () => {
  const { user, currentRole, logout, isVendorApproved } = useAuth();
  const { getCartCount } = useCart();
  const { getUnreadCount } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // const [searchTerm, setSearchTerm] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // const handleSearch = (e) => {
  //   e.preventDefault();
  //   if (searchTerm.trim()) {
  //     navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
  //     setIsMenuOpen(false);
  //   }
  // };

  const isAdmin = user && user.role === 'admin';

  // Pulse animation for notification badge
  const bellPulse = getUnreadCount() > 0 ? 'animate-pulse' : '';

  return (
    <nav className="bg-base-100 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-primary-content font-extrabold text-2xl tracking-tight drop-shadow">B</span>
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-primary group-hover:text-secondary transition-colors drop-shadow">BidCart</span>
          </Link>

          {/* Search Bar - Desktop */}
          {/* <form onSubmit={handleSearch} className="hidden md:flex items-center ml-8 flex-1 max-w-lg relative">
            <FaSearch className="absolute left-4 text-gray-400 text-lg" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input input-bordered pl-12 pr-4 py-2 rounded-full shadow focus:outline-none focus:ring-2 focus:ring-primary w-full"
              aria-label="Search products"
            />
          </form> */}

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center gap-2 ml-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-full font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50
                  ${location.pathname.startsWith(link.to) ? 'bg-primary text-primary-content shadow' : 'hover:bg-primary/10 text-base-content/80'}`}
                aria-current={location.pathname.startsWith(link.to) ? 'page' : undefined}
              >
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link to="/admin/dashboard" className="flex items-center gap-1 px-4 py-2 rounded-full hover:bg-primary/10 transition-all">
                <FaUserShield className="text-lg" />
                <span>Admin</span>
              </Link>
            )}
            {user && isVendorApproved && (
              <Link to="/vendor/dashboard" className="flex items-center gap-1 px-4 py-2 rounded-full hover:bg-primary/10 transition-all">
                <FaStore className="text-lg" />
                <span>Vendor</span>
              </Link>
            )}
          </div>

          {/* User Menu - Desktop */}
          <div className="hidden md:flex items-center gap-4 ml-4">
            {user ? (
              <>
                <Link to="/notifications" className="relative group" aria-label="Notifications">
                  <FaBell className={`text-2xl cursor-pointer hover:text-primary transition-colors ${bellPulse}`} />
                  {getUnreadCount() > 0 && (
                    <span className="badge badge-error badge-sm absolute -top-2 -right-2 shadow animate-bounce">{getUnreadCount()}</span>
                  )}
                </Link>
                <Link to="/cart" className="relative group ml-4" aria-label="Cart">
                  <FaShoppingCart className="text-2xl cursor-pointer hover:text-primary transition-colors" />
                  {getCartCount() > 0 && (
                    <span className="badge badge-primary badge-sm absolute -top-2 -right-2 shadow">{getCartCount()}</span>
                  )}
                </Link>
                <SocketStatusIndicator />
                <UserDropdown />
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn btn-ghost btn-sm rounded-full px-4">Login</Link>
                <Link to="/register" className="btn btn-primary btn-sm rounded-full px-4">Sign Up</Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden btn btn-ghost btn-circle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMenuOpen ? <FaTimes className="text-2xl" /> : <FaBars className="text-2xl" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden fixed left-0 top-0 w-full h-full bg-black/40 z-40 transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setIsMenuOpen(false)}
        />
        <div
          className={`md:hidden fixed right-0 top-0 w-80 max-w-full h-full bg-base-100 shadow-2xl z-50 transform transition-transform duration-300 ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b">
              <Link to="/" className="flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow">
                  <span className="text-primary-content font-extrabold text-lg">B</span>
                </div>
                <span className="text-xl font-extrabold text-primary">BidCart</span>
              </Link>
              <button className="btn btn-ghost btn-circle" onClick={() => setIsMenuOpen(false)} aria-label="Close menu">
                <FaTimes className="text-2xl" />
              </button>
            </div>
            {/* <form onSubmit={handleSearch} className="flex items-center gap-2 p-4">
              <FaSearch className="text-gray-400 text-lg" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-bordered rounded-full flex-1"
                aria-label="Search products"
              />
            </form> */}
            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-col gap-2 p-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`px-4 py-3 rounded-full font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50
                      ${location.pathname.startsWith(link.to) ? 'bg-primary text-primary-content shadow' : 'hover:bg-primary/10 text-base-content/80'}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                <Link to="/cart" className="relative px-4 py-3 rounded-full hover:bg-primary/10 transition-all" onClick={() => setIsMenuOpen(false)}>
                  <span className="flex items-center gap-2">
                    <FaShoppingCart className="text-lg" />
                    Cart
                    {getCartCount() > 0 && (
                      <span className="badge badge-primary badge-sm ml-2">{getCartCount()}</span>
                    )}
                  </span>
                </Link>
                {isAdmin && (
                  <Link to="/admin/dashboard" className="flex items-center gap-2 px-4 py-3 rounded-full hover:bg-primary/10 transition-all" onClick={() => setIsMenuOpen(false)}>
                    <FaUserShield className="text-lg" />
                    Admin
                  </Link>
                )}
                {user && isVendorApproved && (
                  <Link to="/vendor/dashboard" className="flex items-center gap-2 px-4 py-3 rounded-full hover:bg-primary/10 transition-all" onClick={() => setIsMenuOpen(false)}>
                    <FaStore className="text-lg" />
                    Vendor
                  </Link>
                )}
              </div>
              {user && (
                <div className="border-t pt-4 mt-4 px-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="avatar placeholder">
                      <div className="bg-primary text-primary-content rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg shadow">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-sm text-base-content/60">
                        {currentRole === 'vendor' ? 'Vendor' : user.role === 'admin' ? 'Admin' : 'User'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <Link to="/notifications" className="relative group" aria-label="Notifications" onClick={() => setIsMenuOpen(false)}>
                      <FaBell className={`text-2xl cursor-pointer hover:text-primary transition-colors ${bellPulse}`} />
                      {getUnreadCount() > 0 && (
                        <span className="badge badge-error badge-sm absolute -top-2 -right-2 shadow animate-bounce">{getUnreadCount()}</span>
                      )}
                    </Link>
                    <UserDropdown />
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left p-3 hover:bg-base-200 rounded-lg flex items-center gap-3 transition-colors text-error mt-2"
                  >
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
              {!user && (
                <div className="border-t pt-4 mt-4 space-y-2 px-4">
                  <Link
                    to="/login"
                    className="block p-3 hover:bg-base-200 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block p-3 hover:bg-base-200 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
