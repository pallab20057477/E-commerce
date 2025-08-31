const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

async function testProductDisplay() {
  try {
    console.log('🔍 Testing Product Display Functionality...');
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bidcart', {
      serverSelectionTimeoutMS: 5000
    });
    
    console.log('✅ Connected to MongoDB');

    // Check if products exist
    const productCount = await Product.countDocuments();
    console.log(`\n📊 Total products in database: ${productCount}`);

    if (productCount === 0) {
      console.log('❌ No products found in database!');
      console.log('💡 Run the seed data script to populate the database:');
      console.log('   node seedData.js');
      return;
    }

    // Check active products
    const activeProducts = await Product.countDocuments({ isActive: true });
    console.log(`✅ Active products: ${activeProducts}`);

    // Check approved products
    const approvedProducts = await Product.countDocuments({ approvalStatus: 'approved' });
    console.log(`✅ Approved products: ${approvedProducts}`);

    // Check buy-now products
    const buyNowProducts = await Product.countDocuments({ mode: 'buy-now', isActive: true });
    console.log(`🛒 Buy-now products: ${buyNowProducts}`);

    // Check auction products
    const auctionProducts = await Product.countDocuments({ mode: 'auction', isActive: true });
    console.log(`🏷️  Auction products: ${auctionProducts}`);

    // Get sample products
    console.log('\n📋 Sample Products:');
    const sampleProducts = await Product.find({ isActive: true, approvalStatus: 'approved' })
      .limit(5)
      .populate('vendor', 'businessName')
      .populate('seller', 'name');

    sampleProducts.forEach((product, index) => {
      console.log(`\n${index + 1}. ${product.name}`);
      console.log(`   💰 Price: $${product.price}`);
      console.log(`   🏷️  Category: ${product.category}`);
      console.log(`   🏪 Vendor: ${product.vendor?.businessName || 'Unknown'}`);
      console.log(`   👤 Seller: ${product.seller?.name || 'Unknown'}`);
      console.log(`   📦 Mode: ${product.mode}`);
      console.log(`   ✅ Status: ${product.approvalStatus}`);
      console.log(`   🔍 Active: ${product.isActive ? 'Yes' : 'No'}`);
      
      if (product.mode === 'auction') {
        console.log(`   ⏰ Auction Status: ${product.auction?.status}`);
        console.log(`   🎯 Current Bid: $${product.auction?.currentBid || 'N/A'}`);
      }
    });

    // Test product filtering
    console.log('\n🔍 Testing Product Filters:');
    
    // Test category filter
    const electronicsCount = await Product.countDocuments({ 
      category: 'Electronics', 
      isActive: true, 
      approvalStatus: 'approved' 
    });
    console.log(`📱 Electronics products: ${electronicsCount}`);

    // Test price range filter
    const affordableProducts = await Product.countDocuments({
      price: { $gte: 10, $lte: 50 },
      isActive: true,
      approvalStatus: 'approved'
    });
    console.log(`💰 Products $10-$50: ${affordableProducts}`);

    // Test search functionality
    const searchResults = await Product.countDocuments({
      $text: { $search: 'wireless' },
      isActive: true,
      approvalStatus: 'approved'
    });
    console.log(`🔎 Products matching "wireless": ${searchResults}`);

    console.log('\n🎉 Product display test completed!');
    console.log('\n📋 Next Steps:');
    
    if (productCount === 0) {
      console.log('1. ❌ Run seed data: node seedData.js');
    } else if (activeProducts === 0) {
      console.log('1. ❌ Check product activation status');
    } else if (approvedProducts === 0) {
      console.log('1. ❌ Products need admin approval');
    } else {
      console.log('1. ✅ Products are available for display');
    }
    
    console.log('2. ✅ Check API endpoints for product listing');
    console.log('3. ✅ Verify frontend product display components');
    console.log('4. ✅ Test search and filter functionality');

  } catch (error) {
    console.error('\n❌ Error during product display test:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure MongoDB is running on localhost:27017');
    } else if (error.code === 'ENOTFOUND') {
      console.log('💡 Check your MongoDB connection string in .env file');
    }
    
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n🔌 MongoDB connection closed');
    }
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testProductDisplay();
}

module.exports = { testProductDisplay };
