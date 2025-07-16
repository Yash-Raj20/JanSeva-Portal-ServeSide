import Notification from '../../models/Notification.js';
import mongoose from 'mongoose';

// Get all notifications for a user
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(notifications); // Even if empty, return 200 with []
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get only unread notifications
export const unreadNotification = async (req, res) => {
  try {
    const notifications = await Notification.find({
      user: req.user._id,
      isRead: false,
    }).sort({ createdAt: -1 });

    res.status(200).json(notifications);
  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Mark a notification as read
export const readNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({ message: 'Invalid notification ID' });
    }

    const notification = await Notification.findById(notificationId);

    if (!notification || notification.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({ message: 'Marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Create a new notification (used internally, not as an endpoint)
export const createNotification = async (userId, message, type = "pending") => {
  try {
    const newNotification = new Notification({
      user: userId,        
      message,
      type,                 
    });

    await newNotification.save();
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};