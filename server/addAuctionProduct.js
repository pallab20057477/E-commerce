const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');
const User = require('./models/User');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bidcart';

async function addAuctionProduct() {
  await mongoose.connect(MONGODB_URI);
  const user = await User.findOne();
  if (!user) {
    console.error('No user found. Please seed users first.');
    process.exit(1);
  }

  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

  const auctionProduct = new Product({
    name: 'Temporary Auction Test Product',
    description: 'This is a temporary auction product for live Socket.IO auction testing.',
    price: 100,
    category: 'Electronics',
    images: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80'],
    mode: 'auction',
    auction: {
      startTime: now,
      endTime: oneHourLater,
      startingBid: 100,
      currentBid: 100,
      minBidIncrement: 10,
      status: 'active',
      totalBids: 0
    },
    brand: 'TestBrand',
    condition: 'new',
    stock: 1,
    tags: ['test', 'auction'],
    seller: user._id,
    isActive: true,
    isFeatured: true,
    approvalStatus: 'approved',
    views: 0
  });

  await auctionProduct.save();
  console.log('✅ Temporary auction product created:', auctionProduct);
  await mongoose.disconnect();
}

addAuctionProduct().catch(err => {
  console.error('❌ Error adding auction product:', err);
  process.exit(1);
}); 