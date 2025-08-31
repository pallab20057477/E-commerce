import React from 'react';
import { Link } from 'react-router-dom';
import { FaGavel, FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 text-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8 border-b border-gray-700">
        <div className="flex flex-col space-y-3">
          <div className="flex items-center space-x-3">
            <FaGavel className="text-4xl text-indigo-400" />
            <span className="text-2xl font-extrabold tracking-wide">BidCart</span>
          </div>
          <p className="text-gray-300 max-w-xs">
            Your trusted marketplace for auctions and shopping
          </p>
        </div>
        <div>
          <h3 className="footer-title text-lg font-semibold mb-4 border-b border-indigo-400 pb-2 uppercase tracking-wide">Services</h3>
          <ul className="space-y-2">
            <li>
              <Link to="/products" className="link link-hover hover:text-indigo-400 transition-colors duration-300">Products</Link>
            </li>
            <li>
              <Link to="/products?mode=auction" className="link link-hover hover:text-indigo-400 transition-colors duration-300">Auctions</Link>
            </li>
            <li>
              <Link to="/products?mode=buy-now" className="link link-hover hover:text-indigo-400 transition-colors duration-300">Buy Now</Link>
            </li>
            <li>
              <Link to="/cart" className="link link-hover hover:text-indigo-400 transition-colors duration-300">Cart</Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="footer-title text-lg font-semibold mb-4 border-b border-indigo-400 pb-2 uppercase tracking-wide">Company</h3>
          <ul className="space-y-2">
            <li>
              <Link to="/about" className="link link-hover hover:text-indigo-400 transition-colors duration-300">About us</Link>
            </li>
            <li>
              <Link to="/contact" className="link link-hover hover:text-indigo-400 transition-colors duration-300">Contact</Link>
            </li>
            <li>
              <Link to="/privacy" className="link link-hover hover:text-indigo-400 transition-colors duration-300">Privacy Policy</Link>
            </li>
            <li>
              <Link to="/terms" className="link link-hover hover:text-indigo-400 transition-colors duration-300">Terms of Service</Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="footer-title text-lg font-semibold mb-4 border-b border-indigo-400 pb-2 uppercase tracking-wide">Social</h3>
          <div className="flex space-x-6">
            <a href="#" className="text-3xl hover:text-indigo-400 transition-colors duration-300" aria-label="Facebook"><FaFacebook /></a>
            <a href="#" className="text-3xl hover:text-indigo-400 transition-colors duration-300" aria-label="Twitter"><FaTwitter /></a>
            <a href="#" className="text-3xl hover:text-indigo-400 transition-colors duration-300" aria-label="Instagram"><FaInstagram /></a>
            <a href="#" className="text-3xl hover:text-indigo-400 transition-colors duration-300" aria-label="LinkedIn"><FaLinkedin /></a>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-4 text-center text-sm text-gray-400">
        &copy; {new Date().getFullYear()} BidCart. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
