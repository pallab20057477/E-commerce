import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Products from './Products';
import { FaGavel } from 'react-icons/fa';

const Auction = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Set default sort for auction listing (ending soon)
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    let changed = false;
    
    if (!params.get('sortBy')) {
      params.set('sortBy', 'auction.endTime');
      changed = true;
    }
    if (!params.get('sortOrder')) {
      params.set('sortOrder', 'asc');
      changed = true;
    }
    
    if (changed) setSearchParams(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="flex items-center gap-3 mb-3">
        <FaGavel className="text-3xl text-primary" />
        <h1 className="text-3xl font-bold">Live & Upcoming Auctions</h1>
      </div>
      <p className="text-gray-600 mb-6">
        Bid on unique products or browse upcoming auctions. Place your bids and win exclusive items!
      </p>

      {/* Product grid (uses existing Products page with auction mode) */}
      <Products modeOverride="auction" />
    </div>
  );
};

export default Auction;
