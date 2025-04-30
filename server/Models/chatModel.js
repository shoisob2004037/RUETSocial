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
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
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

