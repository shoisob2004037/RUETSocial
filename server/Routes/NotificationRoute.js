import express from "express"
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
} from "../Controllers/NotificationController.js"

const router = express.Router()

router.get("/:userId", getUserNotifications)
router.put("/:id/read", markAsRead)
router.put("/:userId/read-all", markAllAsRead)
router.delete("/:id", deleteNotification)

// Test route to manually create a notification
router.post("/test", async (req, res) => {
  const { recipientId, senderId, type, postId } = req.body

  try {
    const notification = await createNotification(recipientId, senderId, type, postId)
    if (notification) {
      res.status(200).json({ message: "Test notification created", notification })
    } else {
      res.status(500).json({ message: "Failed to create test notification" })
    }
  } catch (error) {
    res.status(500).json({ message: "Error creating test notification", error: error.message })
  }
})

export default router

