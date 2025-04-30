import express from "express"
import {
  getUserChats,
  getChatHistory,
  sendMessage,
  markMessagesAsRead,
  deleteChat,
  editMessage,
  deleteMessage,
} from "../Controllers/ChatController.js"

const router = express.Router()

router.get("/:userId", getUserChats)
router.get("/:userId/:recipientId", getChatHistory)
router.post("/", sendMessage)
router.put("/:chatId/:userId/read", markMessagesAsRead)
router.delete("/:chatId/:userId", deleteChat)
router.put("/:chatId/:messageId/edit", editMessage)
router.delete("/:chatId/:messageId", deleteMessage)

export default router