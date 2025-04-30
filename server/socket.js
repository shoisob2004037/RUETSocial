import { Server } from "socket.io"
import ChatModel from "./Models/chatModel.js"

const onlineUsers = new Map()

export const setupSocketServer = (server) => {
  // Define allowed origins for CORS
  const allowedOrigins = [
    "http://localhost:5173", // Local development
    "http://127.0.0.1:5173", // Local development (optional)
    process.env.FRONTEND_URL, // Deployed frontend URL from .env
    "https://ruet-social.vercel.app", // Add your frontend Vercel URL
  ].filter(Boolean)

  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g., mobile apps, Postman)
        if (!origin) return callback(null, true)
        // Check if the origin is in the allowed list
        if (allowedOrigins.includes(origin)) {
          callback(null, true)
        } else {
          callback(new Error("Not allowed by CORS"))
        }
      },
      methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
      credentials: true,
    },
    // Enable all transports, not just WebSockets
     transports: ['polling', 'websocket'],
  allowUpgrades: false,
  pingTimeout: 30000,
  pingInterval: 25000
})

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`)

    socket.on("user_connected", (userId) => {
      console.log(`User ${userId} is online`)
      onlineUsers.set(userId, socket.id)
      io.emit("user_status", { userId, status: "online" })
    })

    socket.on("send_message", async (messageData) => {
      const { senderId, recipientId, text } = messageData
      try {
        let chat = await ChatModel.findOne({ participants: { $all: [senderId, recipientId] } })
        if (!chat) chat = new ChatModel({ participants: [senderId, recipientId], messages: [] })
        const newMessage = { sender: senderId, recipient: recipientId, text, read: false }
        chat.messages.push(newMessage)
        await chat.save()
        const savedMessage = chat.messages[chat.messages.length - 1]
        const recipientSocketId = onlineUsers.get(recipientId)
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("receive_message", { chatId: chat._id, message: savedMessage })
        }
        socket.emit("message_sent", { chatId: chat._id, message: savedMessage })
      } catch (error) {
        console.error("Error handling message in socket:", error)
        socket.emit("error", { message: "Failed to send message" })
      }
    })

    socket.on("typing", ({ senderId, recipientId }) => {
      const recipientSocketId = onlineUsers.get(recipientId)
      if (recipientSocketId) io.to(recipientSocketId).emit("typing", { senderId })
    })

    socket.on("stop_typing", ({ senderId, recipientId }) => {
      const recipientSocketId = onlineUsers.get(recipientId)
      if (recipientSocketId) io.to(recipientSocketId).emit("stop_typing", { senderId })
    })

    socket.on("mark_read", async ({ chatId, userId }) => {
      try {
        await ChatModel.updateMany(
          { _id: chatId, "messages.recipient": userId, "messages.read": false },
          { $set: { "messages.$[elem].read": true } },
          { arrayFilters: [{ "elem.recipient": userId, "elem.read": false }] },
        )
        const chat = await ChatModel.findById(chatId)
        if (chat) {
          const otherParticipant = chat.participants.find((p) => p !== userId)
          const otherParticipantSocketId = onlineUsers.get(otherParticipant)
          if (otherParticipantSocketId) {
            io.to(otherParticipantSocketId).emit("messages_read", { chatId, readBy: userId })
          }
        }
      } catch (error) {
        console.error("Error marking messages as read in socket:", error)
      }
    })

    socket.on("edit_message", async ({ chatId, messageId, text, senderId }) => {
      try {
        const chat = await ChatModel.findById(chatId)
        const message = chat.messages.id(messageId)
        if (message && message.sender === senderId) {
          message.text = text
          await chat.save()
          const recipientId = chat.participants.find((p) => p !== senderId)
          const recipientSocketId = onlineUsers.get(recipientId)
          if (recipientSocketId) {
            io.to(recipientSocketId).emit("message_edited", { chatId, messageId, text })
          }
          socket.emit("message_edited", { chatId, messageId, text })
        }
      } catch (error) {
        console.error("Error editing message in socket:", error)
      }
    })

    socket.on("delete_message", async ({ chatId, messageId, senderId }) => {
      try {
        const chat = await ChatModel.findById(chatId)
        const message = chat.messages.id(messageId)
        if (message && message.sender === senderId) {
          chat.messages.pull(messageId)
          await chat.save()
          const recipientId = chat.participants.find((p) => p !== senderId)
          const recipientSocketId = onlineUsers.get(recipientId)
          if (recipientSocketId) {
            io.to(recipientSocketId).emit("message_deleted", { chatId, messageId })
          }
          socket.emit("message_deleted", { chatId, messageId })
        }
      } catch (error) {
        console.error("Error deleting message in socket:", error)
      }
    })

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`)
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId)
          io.emit("user_status", { userId, status: "offline" })
          break
        }
      }
    })
  })

  return io
}
