const express = require('express');
const { auth } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

const router = express.Router();

// Get notifications for the logged-in user
router.get('/', auth, notificationController.getAllNotifications);

// Mark notification as read
router.put('/:id/read', auth, notificationController.markNotificationAsRead);

// Mark all notifications as read
router.put('/read-all', auth, notificationController.markAllNotificationsAsRead);

// Delete a single notification
router.delete('/:id', auth, notificationController.deleteNotification);

// Delete all notifications for the user
router.delete('/', auth, notificationController.deleteAllNotifications);

// Delete read notifications only
router.delete('/read', auth, notificationController.deleteReadNotifications);

module.exports = router; 