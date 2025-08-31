const mongoose = require('mongoose');
const User = require('./models/User');
const Vendor = require('./models/Vendor');
const Product = require('./models/Product');
const Order = require('./models/Order');
const BiddingToken = require('./models/BiddingToken');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bidcart')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Check if data already exists
    const userCount = await User.countDocuments();
    const vendorCount = await Vendor.countDocuments();
    const productCount = await Product.countDocuments();
    const orderCount = await Order.countDocuments();

    if (userCount > 0 || vendorCount > 0 || productCount > 0 || orderCount > 0) {
      console.log('⚠️  Database already contains data. Skipping seeding.');
      console.log(`Users: ${userCount}, Vendors: ${vendorCount}, Products: ${productCount}, Orders: ${orderCount}`);
      process.exit(0);
    }

    // Create test users
    console.log('👥 Creating test users...');
    const users = [];
    const userData = [
      { name: 'John Doe', email: 'john@example.com', password: 'password123', phone: '+1234567890' },
      { name: 'Jane Smith', email: 'jane@example.com', password: 'password123', phone: '+1234567891' },
      { name: 'Mike Johnson', email: 'mike@example.com', password: 'password123', phone: '+1234567892' },
      { name: 'Sarah Wilson', email: 'sarah@example.com', password: 'password123', phone: '+1234567893' },
      { name: 'David Brown', email: 'david@example.com', password: 'password123', phone: '+1234567894' },
      { name: 'Lisa Davis', email: 'lisa@example.com', password: 'password123', phone: '+1234567895' },
      { name: 'Tom Miller', email: 'tom@example.com', password: 'password123', phone: '+1234567896' },
      { name: 'Emma Garcia', email: 'emma@example.com', password: 'password123', phone: '+1234567897' },
      { name: 'Alex Rodriguez', email: 'alex@example.com', password: 'password123', phone: '+1234567898' },
      { name: 'Maria Martinez', email: 'maria@example.com', password: 'password123', phone: '+1234567899' }
    ];

    for (const userInfo of userData) {
      const user = new User(userInfo);
      await user.save();
      users.push(user);
      console.log(`✅ Created user: ${user.name} (${user.email})`);
    }

    // Create test vendors
    console.log('\n🏪 Creating test vendors...');
    const vendors = [];
    const vendorData = [
      {
        businessName: 'Tech Gadgets Pro',
        businessDescription: 'Premium electronics and gadgets for tech enthusiasts',
        businessType: 'business',
        contactInfo: { phone: '+1987654321', email: 'tech@example.com', website: 'https://techgadgetspro.com' },
        businessAddress: { street: '123 Tech Street', city: 'Silicon Valley', state: 'CA', zipCode: '94025', country: 'USA' },
        status: 'approved',
        commissionRate: 12,
        categories: ['Electronics', 'Gadgets', 'Computers']
      },
      {
        businessName: 'Fashion Forward',
        businessDescription: 'Trendy fashion items for the modern lifestyle',
        businessType: 'business',
        contactInfo: { phone: '+1987654322', email: 'fashion@example.com', website: 'https://fashionforward.com' },
        businessAddress: { street: '456 Fashion Ave', city: 'New York', state: 'NY', zipCode: '10001', country: 'USA' },
        status: 'approved',
        commissionRate: 10,
        categories: ['Fashion', 'Clothing', 'Accessories']
      },
      {
        businessName: 'Home & Garden Plus',
        businessDescription: 'Everything you need for your home and garden',
        businessType: 'business',
        contactInfo: { phone: '+1987654323', email: 'home@example.com', website: 'https://homegardenplus.com' },
        businessAddress: { street: '789 Garden Lane', city: 'Austin', state: 'TX', zipCode: '73301', country: 'USA' },
        status: 'approved',
        commissionRate: 8,
        categories: ['Home', 'Garden', 'Furniture']
      }
    ];

    for (let i = 0; i < vendorData.length; i++) {
      const vendorInfo = vendorData[i];
      const vendor = new Vendor({
        ...vendorInfo,
        user: users[i]._id,
        approvalDate: new Date(),
        approvedBy: users[0]._id // Using first user as approver
      });
      await vendor.save();
      vendors.push(vendor);
      
      // Update user role to vendor
      await User.findByIdAndUpdate(users[i]._id, { role: 'vendor' });
      console.log(`✅ Created vendor: ${vendor.businessName}`);
    }

    // Create test products
    console.log('\n📦 Creating test products...');
    const products = [];
    const productData = [
      // Tech Gadgets Pro products
      {
        name: 'Wireless Bluetooth Headphones',
        description: 'High-quality wireless headphones with noise cancellation',
        price: 89.99,
        category: 'Electronics',
        brand: 'TechPro',
        stock: 50,
        mode: 'buy-now',
        vendor: vendors[0]._id,
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'],
        approvalStatus: 'approved'
      },
      {
        name: 'Smartphone Case Premium',
        description: 'Durable smartphone case with wireless charging support',
        price: 24.99,
        category: 'Electronics',
        brand: 'TechPro',
        stock: 100,
        mode: 'buy-now',
        vendor: vendors[0]._id,
        images: ['https://images.unsplash.com/photo-1603313011108-4f2d0c0c8c8c?w=400'],
        approvalStatus: 'approved'
      },
      {
        name: 'Gaming Laptop',
        description: 'High-performance gaming laptop with RTX graphics',
        price: 1299.99,
        category: 'Electronics',
        brand: 'GameTech',
        stock: 10,
        mode: 'auction',
        vendor: vendors[0]._id,
        images: ['https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400'],
        approvalStatus: 'approved',
        auction: {
          isAuction: true,
          startingPrice: 1000,
          currentBid: 1100,
          minBidIncrement: 50,
          startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
          status: 'active',
          bidCount: 5
        }
      },
      // Fashion Forward products
      {
        name: 'Designer T-Shirt',
        description: 'Comfortable cotton t-shirt with trendy design',
        price: 29.99,
        category: 'Fashion',
        brand: 'FashionForward',
        stock: 75,
        mode: 'buy-now',
        vendor: vendors[1]._id,
        images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'],
        approvalStatus: 'approved'
      },
      {
        name: 'Leather Handbag',
        description: 'Elegant leather handbag with multiple compartments',
        price: 149.99,
        category: 'Fashion',
        brand: 'FashionForward',
        stock: 25,
        mode: 'buy-now',
        vendor: vendors[1]._id,
        images: ['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400'],
        approvalStatus: 'approved'
      },
      {
        name: 'Vintage Watch',
        description: 'Classic vintage watch with leather strap',
        price: 299.99,
        category: 'Fashion',
        brand: 'VintageTime',
        stock: 5,
        mode: 'auction',
        vendor: vendors[1]._id,
        images: ['https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400'],
        approvalStatus: 'approved',
        auction: {
          isAuction: true,
          startingPrice: 200,
          currentBid: 250,
          minBidIncrement: 25,
          startTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
          status: 'active',
          bidCount: 8
        }
      },
      // Home & Garden Plus products
      {
        name: 'Garden Tool Set',
        description: 'Complete set of essential garden tools',
        price: 79.99,
        category: 'Garden',
        brand: 'GardenPlus',
        stock: 30,
        mode: 'buy-now',
        vendor: vendors[2]._id,
        images: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400'],
        approvalStatus: 'approved'
      },
      {
        name: 'Indoor Plant Pot',
        description: 'Beautiful ceramic pot for indoor plants',
        price: 19.99,
        category: 'Home',
        brand: 'GardenPlus',
        stock: 60,
        mode: 'buy-now',
        vendor: vendors[2]._id,
        images: ['https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400'],
        approvalStatus: 'approved'
      }
    ];

    for (const productInfo of productData) {
      const product = new Product(productInfo);
      await product.save();
      products.push(product);
      console.log(`✅ Created product: ${product.name}`);
    }

    // Create test orders
    console.log('\n🛒 Creating test orders...');
    const orders = [];
    const orderData = [
      {
        user: users[3]._id,
        products: [
          { product: products[0]._id, vendor: vendors[0]._id, quantity: 1, price: 89.99, mode: 'buy-now' },
          { product: products[3]._id, vendor: vendors[1]._id, quantity: 2, price: 29.99, mode: 'buy-now' }
        ],
        totalAmount: 149.97,
        status: 'delivered',
        paymentStatus: 'completed',
        paymentMethod: 'razorpay',
        shippingAddress: { street: '123 Main St', city: 'New York', state: 'NY', zipCode: '10001', country: 'USA', phone: '+1234567890' }
      },
      {
        user: users[4]._id,
        products: [
          { product: products[1]._id, vendor: vendors[0]._id, quantity: 1, price: 24.99, mode: 'buy-now' }
        ],
        totalAmount: 24.99,
        status: 'shipped',
        paymentStatus: 'completed',
        paymentMethod: 'stripe',
        shippingAddress: { street: '456 Oak Ave', city: 'Los Angeles', state: 'CA', zipCode: '90210', country: 'USA', phone: '+1234567891' }
      },
      {
        user: users[5]._id,
        products: [
          { product: products[4]._id, vendor: vendors[1]._id, quantity: 1, price: 149.99, mode: 'buy-now' },
          { product: products[6]._id, vendor: vendors[2]._id, quantity: 1, price: 79.99, mode: 'buy-now' }
        ],
        totalAmount: 229.98,
        status: 'processing',
        paymentStatus: 'completed',
        paymentMethod: 'cod',
        shippingAddress: { street: '789 Pine St', city: 'Chicago', state: 'IL', zipCode: '60601', country: 'USA', phone: '+1234567892' }
      },
      {
        user: users[6]._id,
        products: [
          { product: products[7]._id, vendor: vendors[2]._id, quantity: 3, price: 19.99, mode: 'buy-now' }
        ],
        totalAmount: 59.97,
        status: 'pending',
        paymentStatus: 'pending',
        paymentMethod: 'razorpay',
        shippingAddress: { street: '321 Elm St', city: 'Houston', state: 'TX', zipCode: '77001', country: 'USA', phone: '+1234567893' }
      }
    ];

    for (const orderInfo of orderData) {
      const order = new Order(orderInfo);
      await order.save();
      orders.push(order);
      console.log(`✅ Created order: $${order.totalAmount} for user ${order.user}`);
    }

    // Update vendor statistics
    console.log('\n📊 Updating vendor statistics...');
    for (const vendor of vendors) {
      const vendorProducts = products.filter(p => p.vendor.toString() === vendor._id.toString());
      const vendorOrders = orders.filter(o => 
        o.products.some(p => vendorProducts.some(vp => vp._id.toString() === p.product.toString()))
      );
      
      const totalSales = vendorOrders.length;
      const totalEarnings = vendorOrders.reduce((sum, order) => {
        const orderProducts = order.products.filter(p => 
          vendorProducts.some(vp => vp._id.toString() === p.product.toString())
        );
        return sum + orderProducts.reduce((productSum, p) => productSum + (p.price * p.quantity), 0);
      }, 0);

      await Vendor.findByIdAndUpdate(vendor._id, {
        totalProducts: vendorProducts.length,
        totalSales,
        totalEarnings: totalEarnings * (1 - vendor.commissionRate / 100)
      });
    }

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`👥 Users: ${users.length}`);
    console.log(`🏪 Vendors: ${vendors.length}`);
    console.log(`📦 Products: ${products.length}`);
    console.log(`🛒 Orders: ${orders.length}`);
    console.log('\n🔗 You can now login to the admin dashboard and see real data!');
    console.log('📧 Admin Email: pallabdasdas2005@gmail.com');
    console.log('🔑 Admin Password: Pallab@2005');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};

seedData(); 