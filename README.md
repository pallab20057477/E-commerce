# 🛒 BidCart - Multi-Vendor E-commerce Platform with Auctions

A full-stack MERN e-commerce platform that combines traditional "Buy Now" shopping with real-time bidding auctions, supporting multi-vendor marketplace functionality similar to Amazon or Etsy.

## ✨ Features

### 🏷️ Discount Coupons & Bidding Tokens System
- **Smart Coupon System**: Percentage, fixed amount, and free shipping discounts
- **Gamified Bidding Tokens**: Each bid costs 1 token, encouraging engagement
- **Daily Rewards**: Login daily to earn 1-3 tokens based on streak (1-7+ days)
- **Purchase Rewards**: Earn 1 token per $10 spent (max 10 per purchase)
- **Admin Controls**: Grant tokens, manage coupons, view analytics
- **Real-time Updates**: Token balance updates immediately after actions

### 📊 Real-Time Admin Dashboard with Charts
- **Comprehensive Analytics**: Sales, user growth, auction performance, token usage
- **Interactive Charts**: Line charts, bar charts, doughnut charts using Chart.js
- **Real-time Updates**: Auto-refresh every 30 seconds
- **Multiple Views**: Day/week/month period filtering
- **Activity Feed**: Live updates on orders, users, products, and auctions

### 📦 Delivery Tracking Integration
- **Complete Tracking System**: Pending → Confirmed → Shipped → In Transit → Out for Delivery → Delivered
- **Multiple Carriers**: FedEx, UPS, USPS, DHL, ShipRocket support
- **Real-time Updates**: Socket.IO integration for live status changes
- **Tracking Numbers**: Auto-generated unique tracking codes
- **Admin Controls**: Create tracking, update status, view analytics
- **Simulation Mode**: Test delivery updates for demo purposes

### 🏪 Multi-Vendor Marketplace
- **Vendor Registration**: Business verification and approval system
- **Vendor Dashboard**: Product management, order tracking, earnings analytics
- **Commission System**: Automatic commission calculation and payout tracking
- **Review System**: Product and vendor reviews with ratings
- **Admin Management**: Vendor application review and approval

### ⏰ Auction Scheduling with Pre-launch Timer
- **Scheduled Auctions**: Set start and end times for auctions
- **Pre-launch Countdown**: Real-time countdown timers for upcoming auctions
- **Automatic Management**: Auto-start and end auctions based on schedule
- **Status Tracking**: Scheduled, active, ended, cancelled states
- **Admin Controls**: Manual start/end auctions, schedule management

### 🔐 Authentication & Authorization
- **JWT Authentication**: Secure login/logout with token-based auth
- **Role-based Access**: User, Vendor, Admin roles with permissions
- **Protected Routes**: Secure access to user-specific features
- **Session Management**: Persistent login state

### 🛍️ Shopping Features
- **Product Browsing**: Search, filter, and category navigation
- **Shopping Cart**: Add/remove items, quantity management
- **Checkout Process**: Address, payment, order confirmation
- **Order History**: Track past orders and delivery status
- **Real-time Bidding**: Live auction participation with Socket.IO

## 🚀 Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Socket.IO** for real-time communication
- **JWT** for authentication
- **Chart.js** for analytics

### Frontend
- **React.js** with hooks and context
- **React Router** for navigation
- **TailwindCSS** with DaisyUI for styling
- **Chart.js** with react-chartjs-2
- **Socket.IO Client** for real-time updates
- **React Hot Toast** for notifications

## 📁 Project Structure

```
E-commerce/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   │   ├── admin/      # Admin-specific components
│   │   │   ├── auth/       # Authentication components
│   │   │   ├── coupons/    # Coupon management
│   │   │   ├── delivery/   # Delivery tracking
│   │   │   ├── layout/     # Layout components
│   │   │   └── tokens/     # Token management
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   └── utils/          # Utility functions
│   └── package.json
├── server/                 # Node.js backend
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   │   └── admin/          # Admin-specific routes
│   ├── middleware/         # Custom middleware
│   ├── utils/              # Utility functions
│   └── package.json
└── README.md
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Backend Setup
```bash
cd server
npm install
cp env.example .env
# Configure your .env file with MongoDB URI and other settings
npm start
```

### Frontend Setup
```bash
cd client
npm install
npm start
```

### Environment Variables
Create a `.env` file in the server directory:

```env
MONGODB_URI=mongodb://localhost:27017/bidcart
JWT_SECRET=your_jwt_secret_here
CLIENT_URL=http://localhost:3000
PORT=5000
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (Admin/Vendor)
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Auctions
- `GET /api/products/auctions` - Get active auctions
- `GET /api/products/scheduled` - Get scheduled auctions
- `POST /api/products/:id/schedule` - Schedule auction

### Bidding
- `POST /api/bids` - Place a bid
- `GET /api/bids/product/:productId` - Get bid history
- `GET /api/bids/user` - Get user's bids

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders
- `PUT /api/orders/:id/status` - Update order status

### Coupons
- `GET /api/coupons/admin` - Get all coupons (Admin)
- `POST /api/coupons/admin` - Create coupon (Admin)
- `POST /api/coupons/validate` - Validate coupon
- `GET /api/coupons/history` - Get coupon usage history

### Tokens
- `GET /api/tokens/balance` - Get user token balance
- `POST /api/tokens/daily-reward` - Claim daily reward
- `POST /api/tokens/spend` - Spend tokens for bidding
- `GET /api/tokens/history` - Get token transaction history
- `POST /api/tokens/admin/grant` - Grant tokens (Admin)

### Delivery Tracking
- `POST /api/delivery/create` - Create tracking (Admin)
- `GET /api/delivery/track/:trackingNumber` - Track delivery
- `PUT /api/delivery/update/:trackingNumber` - Update status (Admin)
- `GET /api/delivery/user/history` - User's delivery history

### Admin Dashboard
- `GET /api/admin/dashboard/overview` - Dashboard overview
- `GET /api/admin/dashboard/sales-chart` - Sales analytics
- `GET /api/admin/dashboard/user-growth` - User growth data
- `GET /api/admin/dashboard/category-distribution` - Category stats
- `GET /api/admin/dashboard/top-products` - Top performing products
- `GET /api/admin/dashboard/auction-performance` - Auction analytics
- `GET /api/admin/dashboard/token-analytics` - Token usage stats
- `GET /api/admin/dashboard/activity-feed` - Recent activity

## 🎨 UI/UX Features

### Professional Design
- **Gradient Backgrounds**: Beautiful gradient backgrounds throughout
- **Hover Animations**: Smooth scale and color transitions
- **Card-based Layout**: Clean, organized card layouts
- **Responsive Design**: Mobile-first responsive design
- **Loading States**: Elegant loading spinners and states
- **Toast Notifications**: User-friendly success/error messages

### Interactive Elements
- **Confetti Animation**: Celebration animations for rewards
- **Real-time Updates**: Live updates without page refresh
- **Smooth Transitions**: CSS transitions for all interactions
- **Icon Integration**: Comprehensive icon usage with react-icons
- **Color-coded Status**: Visual status indicators with badges

## 🔧 Configuration

### DaisyUI Theme
The platform uses DaisyUI with a custom theme configuration. You can customize colors and styling in the TailwindCSS configuration.

### Socket.IO Events
- `join-auction` - Join auction room
- `place-bid` - New bid placed
- `auction-ended` - Auction ended
- `bid-update` - Real-time bid updates

## 🚀 Deployment

### Backend Deployment
1. Set up MongoDB Atlas or local MongoDB
2. Configure environment variables
3. Deploy to Heroku, Vercel, or your preferred platform

### Frontend Deployment
1. Build the React app: `npm run build`
2. Deploy to Netlify, Vercel, or your preferred platform
3. Update API endpoints for production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@bidcart.com or create an issue in the repository.

---

**BidCart** - Where Shopping Meets Bidding! 🛒⚡ 