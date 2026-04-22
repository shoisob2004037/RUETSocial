import { Server } from "socket.io";
import ChatModel from "./Models/chatModel.js";

const onlineUsers = new Map();

export const setupSocketServer = (server) => {
  const allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    process.env.FRONTEND_URL,
    "https://ruet-social.vercel.app",
  ].filter(Boolean);

  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
      credentials: true,
    },
    transports: ["polling", "websocket"],
    allowUpgrades: false,
    pingTimeout: 30000,
    pingInterval: 25000,
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("user_connected", (userId) => {
      console.log(`User ${userId} is online, socket: ${socket.id}`);
      onlineUsers.set(userId, socket.id);
      io.emit("user_status", { userId, status: "online" });
    });

    // FIXED: send_message handler
    socket.on("send_message", async (data) => {
      try {
        console.log("Send message received:", data);

        const {
          senderId,
          recipientId,
          text,
          mediaUrl,
          mediaType,
          messageType,
        } = data;

        // Get recipient's socket ID
        const recipientSocketId = onlineUsers.get(recipientId);

        // Create a temporary message object for real-time delivery
        const tempMessage = {
          _id: Date.now().toString(), // Temporary ID for real-time
          sender: senderId,
          recipient: recipientId,
          text: text || "",
          mediaUrl: mediaUrl || null,
          mediaType: mediaType || null,
          messageType: messageType || "text",
          read: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Send to recipient if online
        if (recipientSocketId) {
          console.log(
            `Sending message to recipient ${recipientId}, socket: ${recipientSocketId}`,
          );
          io.to(recipientSocketId).emit("receive_message", {
            message: tempMessage,
            senderId: senderId,
            recipientId: recipientId,
          });
        } else {
          console.log(`Recipient ${recipientId} is offline`);
        }

        // Also emit back to sender for confirmation
        socket.emit("message_sent", {
          message: tempMessage,
          recipientId: recipientId,
        });
      } catch (error) {
        console.error("Socket send_message error:", error);
      }
    });
    socket.on("typing", ({ senderId, recipientId }) => {
      console.log(`Typing event: ${senderId} is typing to ${recipientId}`);
      const recipientSocketId = onlineUsers.get(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("typing", { senderId });
      }
    });

    socket.on("stop_typing", ({ senderId, recipientId }) => {
      console.log(
        `Stop typing event: ${senderId} stopped typing to ${recipientId}`,
      );
      const recipientSocketId = onlineUsers.get(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("stop_typing", { senderId });
      }
    });

    socket.on("mark_read", async ({ chatId, userId }) => {
      try {
        await ChatModel.updateMany(
          { _id: chatId, "messages.recipient": userId, "messages.read": false },
          { $set: { "messages.$[elem].read": true } },
          { arrayFilters: [{ "elem.recipient": userId, "elem.read": false }] },
        );

        const chat = await ChatModel.findById(chatId);
        if (chat) {
          const otherParticipant = chat.participants.find(
            (p) => p.toString() !== userId.toString(),
          );
          const otherParticipantSocketId = onlineUsers.get(
            otherParticipant?.toString(),
          );
          if (otherParticipantSocketId) {
            io.to(otherParticipantSocketId).emit("messages_read", {
              chatId,
              readBy: userId,
            });
          }
        }
      } catch (error) {
        console.error("Error marking messages as read in socket:", error);
      }
    });

    socket.on("edit_message", async ({ chatId, messageId, text, senderId }) => {
      try {
        const chat = await ChatModel.findById(chatId);
        const message = chat.messages.id(messageId);
        if (message && message.sender === senderId) {
          message.text = text;
          await chat.save();

          const recipientId = chat.participants.find(
            (p) => p.toString() !== senderId.toString(),
          );
          const recipientSocketId = onlineUsers.get(recipientId?.toString());

          if (recipientSocketId) {
            io.to(recipientSocketId).emit("message_edited", {
              chatId,
              messageId,
              text,
            });
          }
          socket.emit("message_edited", { chatId, messageId, text });
        }
      } catch (error) {
        console.error("Error editing message in socket:", error);
      }
    });

    socket.on("delete_message", async ({ chatId, messageId, senderId }) => {
      try {
        const chat = await ChatModel.findById(chatId);
        const message = chat.messages.id(messageId);
        if (message && message.sender === senderId) {
          chat.messages.pull(messageId);
          await chat.save();

          const recipientId = chat.participants.find(
            (p) => p.toString() !== senderId.toString(),
          );
          const recipientSocketId = onlineUsers.get(recipientId?.toString());

          if (recipientSocketId) {
            io.to(recipientSocketId).emit("message_deleted", {
              chatId,
              messageId,
            });
          }
          socket.emit("message_deleted", { chatId, messageId });
        }
      } catch (error) {
        console.error("Error deleting message in socket:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
      let disconnectedUserId = null;
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          disconnectedUserId = userId;
          onlineUsers.delete(userId);
          break;
        }
      }
      if (disconnectedUserId) {
        io.emit("user_status", {
          userId: disconnectedUserId,
          status: "offline",
        });
      }
    });
  });

  return io;
};
