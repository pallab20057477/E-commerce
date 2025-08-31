const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');

const submitReview = async (req, res) => {
  try {
    const { product: productId, rating, title, comment, images, order: orderId } = req.body;
    const userId = req.user._id;
    if (!productId || !rating || !title || !comment) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const existingReview = await Review.findOne({ user: userId, product: productId });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }
    let order = null;
    if (orderId) {
      order = await Order.findOne({
        _id: orderId,
        user: userId,
        'products.product': productId,
        status: 'delivered'
      });
    } else {
      order = await Order.findOne({
        user: userId,
        'products.product': productId,
        status: 'delivered'
      });
    }
    if (!order) {
      return res.status(400).json({ message: 'You can only review products from delivered orders' });
    }
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    const review = new Review({
      user: userId,
      product: productId,
      vendor: product.vendor,
      order: order._id,
      rating,
      title,
      comment,
      images: images || [],
      status: 'approved'
    });
    await review.save();
    const ratingResult = await Review.getProductAverageRating(productId);
    if (ratingResult.length > 0) {
      const { average, count } = ratingResult[0];
      await Product.findByIdAndUpdate(productId, { rating: { average, count } });
    }
    if (req.app.get('io')) {
      req.app.get('io').emit('new_review', {
        productId,
        review: {
          _id: review._id,
          rating,
          title,
          comment,
          user: {
            _id: req.user._id,
            name: req.user.name,
            avatar: req.user.avatar
          }
        }
      });
    }
    await review.populate('user', 'name avatar');
    res.status(201).json({
      message: 'Review submitted successfully',
      review
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Fetch reviews with virtuals included
    const reviews = await Review.find({ product: productId, status: 'approved' })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Ensure virtual properties are included in the response
    const reviewsWithCounts = reviews.map(review => ({
      ...review.toObject({ virtuals: true }),
      helpfulCount: review.helpfulCount || 0,
      notHelpfulCount: review.notHelpfulCount || 0,
    }));

    const avg = await Review.getProductAverageRating(productId);

    res.json({
      reviews: reviewsWithCounts,
      averageRating: avg[0]?.average || 0,
      reviewCount: avg[0]?.count || 0,
      currentPage: page,
      totalPages: Math.ceil((avg[0]?.count || 0) / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const checkReviewEligibility = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;
    const existingReview = await Review.findOne({ user: userId, product: productId });
    if (existingReview) {
      return res.json({
        canReview: false,
        message: 'You have already reviewed this product'
      });
    }
    const deliveredOrder = await Order.findOne({
      user: userId,
      'products.product': productId,
      status: 'delivered'
    }).populate('products.product');
    if (!deliveredOrder) {
      return res.json({
        canReview: false,
        message: 'You can only review products that have been delivered to you'
      });
    }
    const orderProduct = deliveredOrder.products.find(
      item => item.product._id.toString() === productId
    );
    if (!orderProduct) {
      return res.json({
        canReview: false,
        message: 'Product not found in your delivered orders'
      });
    }
    res.json({
      canReview: true,
      orderInfo: {
        _id: deliveredOrder._id,
        deliveredAt: deliveredOrder.updatedAt,
        product: orderProduct
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getUserReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user._id })
      .populate('product', 'name images')
      .sort({ createdAt: -1 });
    res.json({
      reviews,
      count: reviews.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const markReviewHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { helpful } = req.body;
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    await review.markHelpful(req.user._id, helpful);
    res.json({
      message: 'Review marked as helpful',
      helpfulCount: review.helpfulCount,
      notHelpfulCount: review.notHelpfulCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  submitReview,
  getProductReviews,
  checkReviewEligibility,
  getUserReviews,
  markReviewHelpful,
}; 