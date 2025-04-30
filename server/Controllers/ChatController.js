import ChatModel from "../Models/chatModel.js"
import UserModel from "../Models/userModel.js"

export const getUserChats = async (req, res) => {
  const userId = req.params.userId
  try {
    const chats = await ChatModel.find({ participants: userId }).sort({ updatedAt: -1 });
    const otherParticipantIds = chats.map(chat => chat.participants.find(p => p !== userId)).filter(Boolean);
    const users = await UserModel.find({ _id: { $in: otherParticipantIds } }, "firstname lastname profilePicture");
    const userMap = Object.fromEntries(users.map(user => [user._id, user]));
    const formattedChats = chats.map(chat => ({
      chatId: chat._id,
      participant: userMap[chat.participants.find(p => p !== userId)],
      lastMessage: chat.messages[chat.messages.length - 1] || null,
      unreadCount: chat.messages.filter(m => m.recipient === userId && !m.read).length,
      updatedAt: chat.updatedAt,
    }));
    res.status(200).json(formattedChats);
  } catch (error) {
    console.error("Error fetching user chats:", error);
    res.status(500).json({ message: "Server error while fetching chats" });
  }
}

export const getChatHistory = async (req, res) => {
  const { userId, recipientId } = req.params
  try {
    const chat = await ChatModel.findOne({ participants: { $all: [userId, recipientId] } });
    if (!chat) return res.status(200).json({ chatId: null, messages: [] });
    await ChatModel.updateMany(
      { _id: chat._id, "messages.sender": recipientId, "messages.read": false },
      { $set: { "messages.$[elem].read": true } },
      { arrayFilters: [{ "elem.sender": recipientId, "elem.read": false }] }
    );
    const updatedChat = await ChatModel.findById(chat._id);
    res.status(200).json({ chatId: chat._id, messages: updatedChat.messages });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ message: "Server error while fetching chat history" });
  }
}

export const sendMessage = async (req, res) => {
  const { senderId, recipientId, text } = req.body
  try {
    if (!text?.trim()) return res.status(400).json({ message: "Message text is required" });
    let chat = await ChatModel.findOne({ participants: { $all: [senderId, recipientId] } });
    if (!chat) chat = new ChatModel({ participants: [senderId, recipientId], messages: [] });
    const newMessage = { sender: senderId, recipient: recipientId, text, read: false };
    chat.messages.push(newMessage);
    await chat.save();
    const savedMessage = chat.messages[chat.messages.length - 1];
    res.status(200).json({ message: "Message sent successfully", messageData: savedMessage });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Server error while sending message" });
  }
}

export const markMessagesAsRead = async (req, res) => {
  const { chatId, userId } = req.params
  try {
    const result = await ChatModel.updateMany(
      { _id: chatId, "messages.recipient": userId, "messages.read": false },
      { $set: { "messages.$[elem].read": true } },
      { arrayFilters: [{ "elem.recipient": userId, "elem.read": false }] }
    );
    res.status(200).json({ message: "Messages marked as read", modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ message: "Server error while marking messages as read" });
  }
}

export const deleteChat = async (req, res) => {
  const { chatId, userId } = req.params
  try {
    const chat = await ChatModel.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });
    if (!chat.participants.includes(userId)) return res.status(403).json({ message: "Unauthorized to delete this chat" });
    await chat.deleteOne();
    res.status(200).json({ message: "Chat deleted successfully" });
  } catch (error) {
    console.error("Error deleting chat:", error);
    res.status(500).json({ message: "Server error while deleting chat" });
  }
}

export const editMessage = async (req, res) => {
  const { chatId, messageId } = req.params;
  const { userId, text } = req.body;
  try {
    const chat = await ChatModel.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });
    const message = chat.messages.id(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });
    if (message.sender !== userId) return res.status(403).json({ message: "Unauthorized to edit this message" });
    if (!text?.trim()) return res.status(400).json({ message: "Message text is required" });
    message.text = text;
    await chat.save();
    res.status(200).json({ message: "Message edited successfully", messageData: message });
  } catch (error) {
    console.error("Error editing message:", error);
    res.status(500).json({ message: "Server error while editing message" });
  }
}

export const deleteMessage = async (req, res) => {
  const { chatId, messageId } = req.params;
  const { userId } = req.body;
  try {
    const chat = await ChatModel.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });
    const message = chat.messages.id(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });
    if (message.sender !== userId) return res.status(403).json({ message: "Unauthorized to delete this message" });
    chat.messages.pull(messageId);
    await chat.save();
    res.status(200).json({ message: "Message deleted successfully", messageId });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ message: "Server error while deleting message" });
  }
}