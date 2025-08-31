const Product = require('../models/Product');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

class AuctionScheduler {
  constructor() {
    this.checkInterval = 30000; // Check every 30 seconds
    this.isRunning = false;
    this.io = null;
  }

  setIo(io) {
    this.io = io;
  }

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('Auction scheduler started');
    
    this.checkAuctions();
    this.interval = setInterval(() => {
      this.checkAuctions();
    }, this.checkInterval);
  }

  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.interval) {
      clearInterval(this.interval);
    }
    console.log('Auction scheduler stopped');
  }

  async checkAuctions() {
    try {
      // Check MongoDB connection
      const db = mongoose.connection;
      if (db.readyState !== 1) { // 1 = connected
        console.log('MongoDB not connected, skipping auction check...');
        return;
      }

      const now = new Date();
      
      // Check for auctions that need to start
      const auctionsToStart = await Product.find({
        mode: 'auction',
        'auction.status': 'scheduled',
        'auction.startTime': { $lte: now },
        isActive: true
      });

      for (const auction of auctionsToStart) {
        await this.startAuction(auction);
      }

      // Check for auctions that need to end
      const auctionsToEnd = await Product.find({
        mode: 'auction',
        'auction.status': 'active',
        'auction.endTime': { $lte: now },
        isActive: true
      });

      for (const auction of auctionsToEnd) {
        await this.endAuction(auction);
      }

    } catch (error) {
      console.error('Error in auction scheduler:', error);
      // If it's a connection error, try to reconnect
      if (error.name === 'MongoNotConnectedError' || error.name === 'MongoNetworkError') {
        console.log('Attempting to reconnect to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, {
          serverSelectionTimeoutMS: 5000
        });
      }
    }
  }

  async startAuction(product) {
    try {
      product.auction.status = 'active';
      await product.save();

      // Emit socket event to notify clients
      if (this.io) {
        this.io.emit('auctionStarted', {
          productId: product._id,
          message: `Auction for ${product.name} has started!`
        });
      }

      console.log(`Auction started for product: ${product.name}`);
    } catch (error) {
      console.error(`Error starting auction for product ${product._id}:`, error);
    }
  }

  async endAuction(product) {
    try {
      product.auction.status = 'ended';
      
      // Set winner if there are bids
      if (product.auction.totalBids > 0) {
        // Find the highest bid
        const Bid = require('../models/Bid');
        const highestBid = await Bid.findOne({ product: product._id })
          .sort({ amount: -1 })
          .populate('bidder', 'name email');
        
        if (highestBid) {
          product.auction.winner = highestBid.bidder._id;
        }
      }
      
      await product.save();

      // Emit socket event to notify clients
      if (this.io) {
        this.io.emit('auctionEnded', {
          productId: product._id,
          message: `Auction for ${product.name} has ended!`,
          winner: product.auction.winner
        });
      }

      // When auction ends and winner is set:
      if (product.auction.winner) {
        const auctionWinner = await Product.findById(product.auction.winner);
        if (auctionWinner) {
          await Notification.create({
            user: auctionWinner._id,
            message: `Congratulations! You won the auction for ${product.name}.`,
            type: 'auction',
          });
        }
      }

      console.log(`Auction ended for product: ${product.name}`);
    } catch (error) {
      console.error(`Error ending auction for product ${product._id}:`, error);
    }
  }

  // Get upcoming auctions (starting within specified time)
  async getUpcomingAuctions(hours = 1) {
    try {
      const now = new Date();
      const futureTime = new Date(now.getTime() + hours * 60 * 60 * 1000);
      
      return await Product.find({
        mode: 'auction',
        'auction.status': 'scheduled',
        'auction.startTime': { $gt: now, $lte: futureTime },
        isActive: true
      })
      .populate('seller', 'name')
      .sort({ 'auction.startTime': 1 });
    } catch (error) {
      console.error('Error getting upcoming auctions:', error);
      return [];
    }
  }

  // Get active auctions
  async getActiveAuctions() {
    try {
      const now = new Date();
      
      return await Product.find({
        mode: 'auction',
        'auction.status': 'active',
        'auction.endTime': { $gt: now },
        isActive: true
      })
      .populate('seller', 'name')
      .sort({ 'auction.endTime': 1 });
    } catch (error) {
      console.error('Error getting active auctions:', error);
      return [];
    }
  }

  // Get scheduled auctions
  async getScheduledAuctions() {
    try {
      const now = new Date();
      
      return await Product.find({
        mode: 'auction',
        'auction.status': 'scheduled',
        'auction.startTime': { $gt: now },
        isActive: true
      })
      .populate('seller', 'name')
      .sort({ 'auction.startTime': 1 });
    } catch (error) {
      console.error('Error getting scheduled auctions:', error);
      return [];
    }
  }
}

module.exports = new AuctionScheduler(); 