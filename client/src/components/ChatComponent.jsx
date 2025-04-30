"use client"

import { useState, useEffect, useRef } from "react"
import { getChatHistory, markMessagesAsRead, editMessage, deleteMessage, deleteChat } from "../services/api"
import { io } from "socket.io-client"
import { ThreeDotsVertical } from "react-bootstrap-icons"

const ChatComponent = ({ currentUser, recipientUser, onClose }) => {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [socket, setSocket] = useState(null)
  const [isTyping, setIsTyping] = useState(false)
  const [chatId, setChatId] = useState(null)
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const [editingMessageId, setEditingMessageId] = useState(null)
  const [editedMessageText, setEditedMessageText] = useState("")
  const editInputRef = useRef(null)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [showOptions, setShowOptions] = useState(false)

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_API_URL, {
      transports: ["polling", "websocket"], // Allow polling as fallback
      upgrade: true, // Allow transport upgrade
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000, // Increase timeout
    })
    setSocket(newSocket)
    newSocket.emit("user_connected", currentUser._id)
    return () => newSocket.disconnect()
  }, [currentUser._id])

  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const response = await getChatHistory(currentUser._id, recipientUser._id)
        setMessages(response.messages || [])
        setChatId(response.chatId)
        if (response.chatId) {
          await markMessagesAsRead(response.chatId, currentUser._id)
          socket?.emit("mark_read", { chatId: response.chatId, userId: currentUser._id })
        }
      } catch (error) {
        console.error("Error fetching chat history:", error)
      }
    }
    if (currentUser._id && recipientUser._id) fetchChatHistory()
  }, [currentUser._id, recipientUser._id, socket])

  useEffect(() => {
    if (editingMessageId && editInputRef.current) editInputRef.current.focus()
  }, [editingMessageId])

  useEffect(() => {
    if (!socket) return

    socket.on("receive_message", (data) => {
      if (data.message.sender === recipientUser._id) {
        setMessages((prev) => [...prev, data.message])
        setChatId(data.chatId)
        socket.emit("mark_read", { chatId: data.chatId, userId: currentUser._id })
      }
    })

    socket.on("message_sent", (data) => {
      setMessages((prev) => [...prev, data.message])
      setChatId(data.chatId)
    })

    socket.on("typing", (data) => {
      if (data.senderId === recipientUser._id) setIsTyping(true)
    })

    socket.on("stop_typing", (data) => {
      if (data.senderId === recipientUser._id) setIsTyping(false)
    })

    socket.on("messages_read", (data) => {
      if (data.readBy === recipientUser._id) {
        setMessages((prev) => prev.map((msg) => (msg.sender === currentUser._id ? { ...msg, read: true } : msg)))
      }
    })

    socket.on("message_edited", (data) => {
      if (data.chatId === chatId) {
        setMessages((prev) => prev.map((msg) => (msg._id === data.messageId ? { ...msg, text: data.text } : msg)))
      }
    })

    socket.on("message_deleted", (data) => {
      if (data.chatId === chatId) {
        setMessages((prev) => prev.filter((msg) => msg._id !== data.messageId))
      }
    })

    return () => {
      socket.off("receive_message")
      socket.off("message_sent")
      socket.off("typing")
      socket.off("stop_typing")
      socket.off("messages_read")
      socket.off("message_edited")
      socket.off("message_deleted")
    }
  }, [socket, currentUser._id, recipientUser._id, chatId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleTyping = () => {
    if (!socket) return
    socket.emit("typing", { senderId: currentUser._id, recipientId: recipientUser._id })
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", { senderId: currentUser._id, recipientId: recipientUser._id })
    }, 2000)
  }

  const handleSendMessage = () => {
    if (!newMessage.trim() || !socket) return
    socket.emit("send_message", { senderId: currentUser._id, recipientId: recipientUser._id, text: newMessage })
    setNewMessage("")
    socket.emit("stop_typing", { senderId: currentUser._id, recipientId: recipientUser._id })
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
  }

  const handleEditMessage = (message) => {
    setEditingMessageId(message._id)
    setEditedMessageText(message.text)
    setActiveDropdown(null)
  }

  const handleSaveEditedMessage = async () => {
    if (!editedMessageText.trim() || !chatId || !editingMessageId) return
    await editMessage(chatId, editingMessageId, currentUser._id, editedMessageText)
    socket?.emit("edit_message", { chatId, messageId: editingMessageId, text: editedMessageText })
    setEditingMessageId(null)
    setEditedMessageText("")
  }

  const handleCancelEdit = () => {
    setEditingMessageId(null)
    setEditedMessageText("")
  }

  const handleDeleteMessage = async (messageId) => {
    if (!chatId) return
    await deleteMessage(chatId, messageId, currentUser._id)
    socket?.emit("delete_message", { chatId, messageId })
    setActiveDropdown(null)
  }

  const handleDeleteChat = async () => {
    if (!chatId || !window.confirm("Are you sure you want to delete this entire conversation?")) return
    await deleteChat(chatId, currentUser._id)
    onClose && onClose()
  }

  const toggleDropdown = (messageId) => {
    setActiveDropdown(activeDropdown === messageId ? null : messageId)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center">
          <div className="relative">
            <img
              src={recipientUser.profilePicture || "https://via.placeholder.com/40"}
              alt={`${recipientUser.firstname} ${recipientUser.lastname}`}
              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
          </div>
          <div className="ml-3">
            <h3 className="font-semibold text-gray-800">{`${recipientUser.firstname} ${recipientUser.lastname}`}</h3>
            {isTyping && (
              <div className="flex items-center text-xs text-purple-600">
                <span className="mr-1">typing</span>
                <span className="flex space-x-1">
                  <span
                    className="w-1 h-1 bg-purple-600 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></span>
                  <span
                    className="w-1 h-1 bg-purple-600 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></span>
                  <span
                    className="w-1 h-1 bg-purple-600 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></span>
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
          >
            <ThreeDotsVertical className="w-5 h-5 text-gray-600" />
          </button>
          {showOptions && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10 border border-gray-100">
              <button
                onClick={handleDeleteChat}
                className="w-full text-left px-4 py-3 text-red-600 hover:bg-gray-50 transition-colors duration-200 flex items-center"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  ></path>
                </svg>
                Delete Conversation
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="bg-purple-100 p-5 rounded-full mb-4">
              <svg
                className="w-12 h-12 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                ></path>
              </svg>
            </div>
            <p className="text-center text-gray-600 font-medium mb-1">No messages yet</p>
            <p className="text-center text-gray-500">Start the conversation by sending a message below!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message._id}
                className={`flex ${message.sender === currentUser._id ? "justify-end" : "justify-start"}`}
              >
                {editingMessageId === message._id ? (
                  <div className="bg-white p-4 rounded-lg shadow-md max-w-xs sm:max-w-md">
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editedMessageText}
                      onChange={(e) => setEditedMessageText(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSaveEditedMessage()}
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <div className="flex justify-end mt-2 space-x-2">
                      <button
                        onClick={handleCancelEdit}
                        className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEditedMessage}
                        className="px-3 py-1 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-200"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="group relative max-w-xs sm:max-w-md">
                    <div
                      className={`p-3 rounded-2xl shadow-sm ${
                        message.sender === currentUser._id
                          ? "bg-purple-600 text-white rounded-br-none"
                          : "bg-white text-gray-800 rounded-bl-none"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{message.text}</p>
                      <div
                        className={`flex justify-between items-center mt-1 text-xs ${
                          message.sender === currentUser._id ? "text-purple-200" : "text-gray-500"
                        }`}
                      >
                        <span>
                          {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {message.sender === currentUser._id && (
                          <div className="flex items-center space-x-1">
                            <span className="text-xs">{message.read ? "✓✓" : "✓"}</span>
                            <div className="relative">
                              <button
                                className="p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                onClick={() => toggleDropdown(message._id)}
                              >
                                <ThreeDotsVertical
                                  className={`w-3 h-3 ${
                                    message.sender === currentUser._id ? "text-purple-200" : "text-gray-500"
                                  }`}
                                />
                              </button>
                              {activeDropdown === message._id && (
                                <div className="absolute right-0 bottom-full mb-2 w-24 bg-white rounded-lg shadow-lg z-10 border border-gray-100">
                                  <button
                                    onClick={() => handleEditMessage(message)}
                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMessage(message._id)}
                                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-50 transition-colors duration-200"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center">
          <div className="relative flex-grow">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyUp={handleTyping}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Type a message..."
              className="w-full pl-4 pr-10 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button
              onClick={() => setNewMessage("")}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 ${
                !newMessage ? "hidden" : ""
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="ml-2 p-3 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              ></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatComponent
