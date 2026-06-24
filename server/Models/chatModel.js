import mongoose from "mongoose"

const messageSchema = mongoose.Schema(
  {
    sender: {
      type: String,
      required: true,
    },
    recipient: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      default: "",
    },
    mediaUrl: {
      type: String,
      default: null,
    },
    mediaType: {
      type: String,
      enum: ["image", "video", null],
      default: null,
    },
    mediaPublicId: {
      type: String,
      default: null,
    },
    mediaThumbnail: {
      type: String,
      default: null,
    },
    messageType: {
      type: String,
      enum: ["text", "image", "video"],
      default: "text",
    },
    read: {
      type: Boolean,
      default: false,
    },
    edited: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedBy: {
      type: String,
      default: null,
    },
    deletedByName: {
      type: String,
      default: "",
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

const chatSchema = mongoose.Schema(
  {
    participants: [
      {
        type: String,
        required: true,
      },
    ],
    messages: [messageSchema],
  },
  {
    timestamps: true,
  },
)

// Create indexes for faster queries
chatSchema.index({ participants: 1 })

const ChatModel = mongoose.models.Chats || mongoose.model("Chats", chatSchema)
export default ChatModel