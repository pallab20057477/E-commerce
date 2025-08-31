import React, { useState, useEffect, lazy } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/axios';
import { FaGavel, FaShoppingCart, FaClock, FaStar, FaBullhorn } from 'react-icons/fa';

// Lazy load components that are not immediately visible
const ProductCard = lazy(() => import('../components/products/ProductCard'));
const UpcomingAuctions = lazy(() => import('../components/auctions/UpcomingAuctions'));

const Home = () => {
  const [, setFeaturedProducts] = useState([]);
  const [activeAuctions, setActiveAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [features, setFeatures] = useState([]);
  const [featuresLoading, setFeaturesLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featuredRes, auctionsRes] = await Promise.all([
          api.get('/products/featured/featured'),
          api.get('/products/auctions/active')
        ]);

        setFeaturedProducts(featuredRes.data);
        setActiveAuctions(auctionsRes.data);
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        const res = await api.get('/features');
        setFeatures(res.data);
      } catch (error) {
        setFeatures([]);
      } finally {
        setFeaturesLoading(false);
      }
    };
    fetchFeatures();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50" role="alert" aria-busy="true" aria-live="polite">
        <div className="loading-spinner animate-spin border-4 border-blue-500 border-t-transparent rounded-full w-12 h-12" aria-label="Loading"></div>
      </div>
    );
  }

  return (
    <main className="space-y-16 bg-gray-50" role="main">
      {/* Features Announcements Section */}
      <section className="py-8" aria-labelledby="announcements-title">
        <div className="container mx-auto px-6">
          {featuresLoading ? (
            <div className="flex justify-center items-center py-12" role="alert" aria-busy="true" aria-live="polite">
              <div className="loading-spinner animate-spin border-4 border-blue-500 border-t-transparent rounded-full w-12 h-12" aria-label="Loading"></div>
            </div>
          ) : features.length > 0 ? (
            <article className="mb-10">
              <header>
                <h2 id="announcements-title" className="text-3xl font-extrabold flex items-center gap-3 mb-6 text-blue-700">
                  <FaBullhorn className="text-blue-600" aria-hidden="true" /> Announcements
                </h2>
              </header>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {features.map(feature => (
                  <section
                    key={feature._id}
                    className="card bg-white shadow-lg rounded-lg border-l-8 border-blue-500 hover:shadow-2xl transition-shadow duration-300"
                    aria-labelledby={`feature-title-${feature._id}`}
                  >
                    <div className="card-body p-6">
                      <h3 id={`feature-title-${feature._id}`} className="card-title text-xl font-semibold mb-3 text-gray-800">{feature.title}</h3>
                      <p className="mb-3 text-gray-600">{feature.description}</p>
                      <time className="text-sm text-gray-400 italic mt-4" dateTime={new Date(feature.date).toISOString()}>
                        {new Date(feature.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </time>
                    </div>
                  </section>
                ))}
              </div>
            </article>
          ) : null}
        </div>
      </section>

      {/* Hero Section */}
      <section
        className="relative min-h-[calc(100dvh-4rem)] bg-gradient-to-r from-blue-600 to-indigo-700 flex items-center justify-center text-center text-white overflow-hidden rounded-lg shadow-xl mx-3 sm:mx-6 md:mx-12"
        aria-label="Hero section"
        style={{
          '--tw-gradient-from': '#2563eb',
          '--tw-gradient-to': '#4f46e5',
          '--tw-gradient-stops': 'var(--tw-gradient-from), var(--tw-gradient-to)',
          '@media (prefers-reduced-motion: no-preference)': {
            '--tw-scale-x': '1',
            '--tw-scale-y': '1',
            '--tw-rotate': '0',
            '--tw-skew-x': '0',
            '--tw-skew-y': '0',
            '--tw-translate-x': '0',
            '--tw-translate-y': '0',
          }
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-800 via-indigo-900 to-blue-800 opacity-80"></div>
        <div className="relative max-w-lg px-6 py-16">
          <FaGavel className="text-7xl mx-auto mb-8 drop-shadow-lg" aria-hidden="true" />
          <h1 className="mb-6 text-5xl font-extrabold tracking-tight drop-shadow-md">Welcome to BidCart</h1>
          <p className="mb-8 text-lg font-medium drop-shadow-sm">
            Discover amazing products through auctions and direct purchases. 
            Bid on unique items or buy instantly - the choice is yours!
          </p>
          <div className="flex gap-6 justify-center">
            <Link
              to="/products"
              className="btn btn-primary px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-shadow duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300"
            >
              <FaShoppingCart className="mr-3" aria-hidden="true" />
              Shop Now
            </Link>
            <Link
              to="/products?mode=auction"
              className="btn btn-outline btn-accent px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-shadow duration-300 focus:outline-none focus:ring-4 focus:ring-indigo-300"
            >
              <FaGavel className="mr-3" aria-hidden="true" />
              View Auctions
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16" aria-labelledby="why-choose-title">
        <div className="container mx-auto px-6">
          <header>
            <h2 id="why-choose-title" className="text-4xl font-extrabold text-center mb-14 text-gray-900">Why Choose BidCart?</h2>
          </header>
          <div className="grid md:grid-cols-3 gap-12">
            <article 
              className="card bg-white shadow-2xl rounded-xl hover:scale-105 transform transition-transform duration-300 will-change-transform" 
              tabIndex={0} 
              aria-label="Live Auctions feature"
              style={{
                '@media (prefers-reduced-motion: reduce)': {
                  transform: 'none !important',
                }
              }}
            >
              <div className="card-body text-center p-8">
                <FaGavel className="text-5xl text-blue-600 mx-auto mb-6" aria-hidden="true" />
                <h3 className="card-title justify-center text-2xl font-bold mb-3">Live Auctions</h3>
                <p className="text-gray-700 text-lg">
                  Participate in real-time auctions with live bidding and instant updates.
                </p>
              </div>
            </article>
            <article 
              className="card bg-white shadow-2xl rounded-xl hover:scale-105 transform transition-transform duration-300 will-change-transform" 
              tabIndex={0} 
              aria-label="Buy Now feature"
              style={{
                '@media (prefers-reduced-motion: reduce)': {
                  transform: 'none !important',
                }
              }}
            >
              <div className="card-body text-center p-8">
                <FaShoppingCart className="text-5xl text-indigo-600 mx-auto mb-6" aria-hidden="true" />
                <h3 className="card-title justify-center text-2xl font-bold mb-3">Buy Now</h3>
                <p className="text-gray-700 text-lg">
                  Purchase products instantly with our secure checkout system.
                </p>
              </div>
            </article>
            <article 
              className="card bg-white shadow-2xl rounded-xl hover:scale-105 transform transition-transform duration-300 will-change-transform" 
              tabIndex={0} 
              aria-label="Quality Products feature"
              style={{
                '@media (prefers-reduced-motion: reduce)': {
                  transform: 'none !important',
                }
              }}
            >
              <div className="card-body text-center p-8">
                <FaStar className="text-5xl text-purple-600 mx-auto mb-6" aria-hidden="true" />
                <h3 className="card-title justify-center text-2xl font-bold mb-3">Quality Products</h3>
                <p className="text-gray-700 text-lg">
                  Browse through carefully curated products from trusted sellers.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Upcoming Auctions Section */}
      <section className="py-16 bg-gray-100" aria-label="Upcoming Auctions">
        <div className="container mx-auto px-6">
          <UpcomingAuctions />
        </div>
      </section>

      {/* Active Auctions Section */}
      <section className="py-16 bg-gradient-to-br from-yellow-50 to-yellow-100 border-t-4 border-yellow-300" aria-labelledby="active-auctions-title">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center mb-10">
            <h2 id="active-auctions-title" className="text-3xl font-extrabold flex items-center gap-3 text-yellow-700">
              <FaGavel className="text-yellow-600" aria-hidden="true" /> Live & Upcoming Auction Products
            </h2>
            <Link to="/products?mode=auction" className="btn btn-accent px-6 py-2 font-semibold shadow-md hover:shadow-lg transition-shadow duration-300 focus:outline-none focus:ring-4 focus:ring-yellow-300">
              View All Auctions
            </Link>
          </div>
          {activeAuctions.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8 md:gap-10">
              {activeAuctions.slice(0, 8).map((product) => (
                <React.Suspense 
                  key={product._id} 
                  fallback={
                    <div className="card bg-white shadow-md rounded-lg overflow-hidden h-full animate-pulse">
                      <div className="bg-gray-200 h-48 w-full"></div>
                      <div className="p-4">
                        <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  }
                >
                  <ProductCard product={product} />
                </React.Suspense>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <FaClock className="text-7xl text-yellow-300 mx-auto mb-6" aria-hidden="true" />
              <p className="text-yellow-700 text-xl font-semibold">No active auctions at the moment. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-700 text-white rounded-lg mx-6 md:mx-12 shadow-lg" aria-label="Call to action">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-extrabold mb-6">Ready to Start Bidding?</h2>
          <p className="mb-10 text-lg max-w-xl mx-auto">
            Join thousands of users who are already enjoying the BidCart experience.
          </p>
          <div className="flex gap-8 justify-center">
            {/* <Link to="/register" className="btn btn-secondary btn-lg px-8 py-3 font-semibold shadow-lg hover:shadow-xl transition-shadow duration-300">
              Get Started
            </Link> */}
            <Link to="/products" className="btn btn-outline btn-lg px-8 py-3 font-semibold shadow-lg hover:shadow-xl transition-shadow duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300">
              Browse Products
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
