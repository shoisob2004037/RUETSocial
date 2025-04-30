import NotificationModel from "../Models/notificationModel.js"
import mongoose from "mongoose"

// Create a new notification - this is exported for direct use in other controllers
export const createNotification = async (recipientId, senderId, type, postId = null) => {
  try {
    console.log(`Creating notification: recipient=${recipientId}, sender=${senderId}, type=${type}, postId=${postId}`)

    const notificationData = {
      recipient: recipientId,
      sender: senderId,
      type,
    }

    // Only add post field if it's provided and not null
    if (postId) {
      notificationData.post = postId
    }

    const notification = new NotificationModel(notificationData)

    const savedNotification = await notification.save()
    console.log("Notification created successfully:", savedNotification)
    return savedNotification
  } catch (error) {
    console.error("Error creating notification:", error)
    return null
  }
}

// Get all notifications for a user
export const getUserNotifications = async (req, res) => {
  const userId = req.params.userId

  try {
    console.log(`Fetching notifications for user: ${userId}`)
    const notifications = await NotificationModel.find({ recipient: userId }).sort({ createdAt: -1 })

    res.status(200).json(notifications)
  } catch (error) {
    console.error("Error fetching notifications:", error)
    res.status(500).json({ message: "Server error while fetching notifications" })
  }
}

// Mark notification as read
export const markAsRead = async (req, res) => {
  const notificationId = req.params.id

  try {
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({ message: "Invalid notification ID" })
    }

    const notification = await NotificationModel.findByIdAndUpdate(notificationId, { read: true }, { new: true })

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" })
    }

    res.status(200).json(notification)
  } catch (error) {
    console.error("Error marking notification as read:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  const userId = req.params.userId

  try {
    await NotificationModel.updateMany({ recipient: userId, read: false }, { read: true })

    res.status(200).json({ message: "All notifications marked as read" })
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Delete a notification
export const deleteNotification = async (req, res) => {
  const notificationId = req.params.id

  try {
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({ message: "Invalid notification ID" })
    }

    const notification = await NotificationModel.findByIdAndDelete(notificationId)

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" })
    }

    res.status(200).json({ message: "Notification deleted successfully" })
  } catch (error) {
    console.error("Error deleting notification:", error)
    res.status(500).json({ message: "Server error" })
  }
}

