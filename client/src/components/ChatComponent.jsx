"use client";

import { useState, useEffect, useRef } from "react";
import {
  getChatHistory,
  markMessagesAsRead,
  editMessage,
  deleteMessage,
  deleteChat,
  sendMessage,
} from "../services/api";
import { io } from "socket.io-client";
import MediaUpload from "./MediaUpload";
import MediaViewer from "./MediaViewer";
import ChatDetails from "./ChatDetails";

const ChatComponent = ({ currentUser, recipientUser, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [socket, setSocket] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [chatId, setChatId] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editedMessageText, setEditedMessageText] = useState("");
  const editInputRef = useRef(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [viewerMedia, setViewerMedia] = useState(null);
  const [viewerMediaType, setViewerMediaType] = useState(null);
  const [allMedia, setAllMedia] = useState([]);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showChatDetails, setShowChatDetails] = useState(false);

  // Socket connection
  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_API_URL, {
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
    });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
      newSocket.emit("user_connected", currentUser._id);
    });

    return () => newSocket.disconnect();
  }, [currentUser._id]);

  // Fetch chat history
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const response = await getChatHistory(
          currentUser._id,
          recipientUser._id,
        );
        const fetchedMessages = response.messages || [];
        setMessages(fetchedMessages);
        setChatId(response.chatId);

        const mediaMessages = fetchedMessages.filter((msg) => msg.mediaUrl);
        const uniqueMedia = [];
        const seenUrls = new Set();
        for (const msg of mediaMessages) {
          if (!seenUrls.has(msg.mediaUrl)) {
            seenUrls.add(msg.mediaUrl);
            uniqueMedia.push({
              url: msg.mediaUrl,
              type: msg.mediaType,
              _id: msg._id,
            });
          }
        }
        setAllMedia(uniqueMedia);

        if (response.chatId) {
          await markMessagesAsRead(response.chatId, currentUser._id);
          socket?.emit("mark_read", {
            chatId: response.chatId,
            userId: currentUser._id,
          });
        }
      } catch (error) {
        console.error("Error fetching chat history:", error);
      }
    };
    if (currentUser._id && recipientUser._id) fetchChatHistory();
  }, [currentUser._id, recipientUser._id]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Listen for incoming messages
    socket.on("receive_message", (data) => {
      console.log("Received message:", data);
      const newMessage = data.message;

      setMessages((prev) => {
        const exists = prev.some((msg) => msg._id === newMessage._id);
        if (exists) return prev;
        return [...prev, newMessage];
      });

      if (chatId) {
        socket.emit("mark_read", { chatId, userId: currentUser._id });
      }
    });

    // FIXED: Typing indicator listeners
    socket.on("typing", (data) => {
      console.log("Typing event received:", data);
      if (data.senderId === recipientUser._id) {
        setIsTyping(true);
      }
    });

    socket.on("stop_typing", (data) => {
      console.log("Stop typing event received:", data);
      if (data.senderId === recipientUser._id) {
        setIsTyping(false);
      }
    });

    socket.on("message_sent", (data) => {
      console.log("Message sent confirmation:", data);
    });

    socket.on("message_edited", (data) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === data.messageId ? { ...msg, text: data.text } : msg,
        ),
      );
    });

    socket.on("message_deleted", (data) => {
      setMessages((prev) => prev.filter((msg) => msg._id !== data.messageId));
      setAllMedia((prev) =>
        prev.filter((media) => media._id !== data.messageId),
      );
    });

    socket.on("messages_read", (data) => {
      if (data.readBy === recipientUser._id) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.sender === currentUser._id ? { ...msg, read: true } : msg,
          ),
        );
      }
    });

    return () => {
      socket.off("receive_message");
      socket.off("typing");
      socket.off("stop_typing");
      socket.off("message_sent");
      socket.off("message_edited");
      socket.off("message_deleted");
      socket.off("messages_read");
    };
  }, [socket, recipientUser._id, currentUser._id, chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // FIXED: Typing handler with proper debounce
  const handleTyping = () => {
    if (!socket) return;

    // Emit typing event
    socket.emit("typing", {
      senderId: currentUser._id,
      recipientId: recipientUser._id,
    });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to emit stop_typing after 2 seconds of no typing
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", {
        senderId: currentUser._id,
        recipientId: recipientUser._id,
      });
    }, 2000);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !socket) return;

    const messageText = newMessage;
    setNewMessage("");

    // Stop typing indicator when sending
    socket.emit("stop_typing", {
      senderId: currentUser._id,
      recipientId: recipientUser._id,
    });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    try {
      const response = await sendMessage(
        currentUser._id,
        recipientUser._id,
        messageText,
        null,
        "text",
      );

      if (response && response.messageData) {
        setMessages((prev) => [...prev, response.messageData]);

        socket.emit("send_message", {
          senderId: currentUser._id,
          recipientId: recipientUser._id,
          text: messageText,
          messageType: "text",
          message: response.messageData,
        });
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setNewMessage(messageText);
      alert("Failed to send message. Please try again.");
    }
  };

  const handleSendMedia = async (media) => {
    if (!socket) return;

    try {
      const response = await sendMessage(
        currentUser._id,
        recipientUser._id,
        "",
        media,
        media.type,
      );

      if (response && response.messageData) {
        setMessages((prev) => [...prev, response.messageData]);
        setAllMedia((prev) => [
          ...prev,
          {
            url: response.messageData.mediaUrl,
            type: response.messageData.mediaType,
            _id: response.messageData._id,
          },
        ]);

        socket.emit("send_message", {
          senderId: currentUser._id,
          recipientId: recipientUser._id,
          text: "",
          mediaUrl: media.url,
          mediaType: media.type,
          messageType: media.type,
          message: response.messageData,
        });
      }
    } catch (error) {
      console.error("Failed to send media:", error);
      alert("Failed to send media. Please try again.");
    }
  };

  const handleEditMessage = (message) => {
    setEditingMessageId(message._id);
    setEditedMessageText(message.text);
    setActiveDropdown(null);
  };

  const handleSaveEditedMessage = async () => {
    if (!editedMessageText.trim() || !chatId || !editingMessageId) return;
    await editMessage(
      chatId,
      editingMessageId,
      currentUser._id,
      editedMessageText,
    );
    socket?.emit("edit_message", {
      chatId,
      messageId: editingMessageId,
      text: editedMessageText,
      senderId: currentUser._id,
    });
    setEditingMessageId(null);
    setEditedMessageText("");
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditedMessageText("");
  };

  const handleDeleteMessage = async (messageId) => {
    if (!chatId) return;
    try {
      await deleteMessage(chatId, messageId, currentUser._id);
      socket?.emit("delete_message", {
        chatId,
        messageId,
        senderId: currentUser._id,
      });
      setActiveDropdown(null);
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  const handleDeleteChat = async () => {
    if (
      !chatId ||
      !window.confirm(
        "Are you sure you want to delete this entire conversation?",
      )
    )
      return;
    await deleteChat(chatId, currentUser._id);
    onClose && onClose();
  };

  const toggleDropdown = (messageId) => {
    setActiveDropdown(activeDropdown === messageId ? null : messageId);
  };

  const openMediaViewer = (mediaUrl, mediaType, index) => {
    setViewerMedia(mediaUrl);
    setViewerMediaType(mediaType);
    setCurrentMediaIndex(index);
  };

  const renderMessageContent = (message) => {
    if (message.mediaUrl) {
      const mediaIndex = allMedia.findIndex((m) => m.url === message.mediaUrl);

      if (message.mediaType === "image") {
        return (
          <div className="cursor-pointer">
            <img
              src={message.mediaUrl}
              alt="Shared"
              className="max-w-[200px] sm:max-w-[280px] max-h-48 rounded-lg object-cover hover:opacity-90 transition-opacity"
              onClick={() =>
                openMediaViewer(message.mediaUrl, message.mediaType, mediaIndex)
              }
              onError={(e) => {
                e.target.src =
                  "https://via.placeholder.com/300x200?text=Failed+to+load";
              }}
            />
          </div>
        );
      }

      if (message.mediaType === "video") {
        return (
          <div className="mt-1 cursor-pointer">
            <video
              src={message.mediaUrl}
              controls
              className="max-w-[200px] sm:max-w-[280px] max-h-48 rounded-lg"
              poster={message.mediaThumbnail || null}
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        );
      }
    }
    return (
      <p className="whitespace-pre-wrap break-words text-sm">{message.text}</p>
    );
  };

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden bg-white">
      {/* FIXED: Header - Fixed height to prevent layout shift */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={onClose}
              className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div className="relative flex-shrink-0">
              <img
                src={
                  recipientUser.profilePicture ||
                  "https://via.placeholder.com/40"
                }
                alt={`${recipientUser.firstname} ${recipientUser.lastname}`}
                className="w-10 h-10 rounded-full object-cover"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 text-sm truncate">
                {`${recipientUser.firstname} ${recipientUser.lastname}`}
              </h3>
              {/* FIXED: Typing indicator with fixed height to prevent layout shift */}
              <div className="h-4 flex items-center">
                <span className="text-xs text-gray-500">Online</span>
              </div>
            </div>
          </div>

          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg
                className="w-5 h-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>
            {showOptions && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-20">
                <button
                  onClick={() => {
                    setShowChatDetails(true);
                    setShowOptions(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors rounded-t-lg"
                >
                  Chat Details
                </button>
                <button
                  onClick={handleDeleteChat}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-gray-50 transition-colors rounded-b-lg"
                >
                  Delete Conversation
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FIXED: Scrollable Messages Area - Only this scrolls */}
      <div
        ref={messagesContainerRef}
        className="flex-1 min-h-0 overflow-y-auto bg-gray-50 px-4 py-4"
        style={{ scrollBehavior: "smooth" }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <p className="text-gray-500 text-sm font-medium">No messages yet</p>
            <p className="text-gray-400 text-xs mt-1">
              Start the conversation!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message._id}
                className={`flex ${message.sender === currentUser._id ? "justify-end" : "justify-start"}`}
              >
                {editingMessageId === message._id ? (
                  <div className="bg-white rounded-lg shadow-sm p-3 max-w-[280px] sm:max-w-md">
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editedMessageText}
                      onChange={(e) => setEditedMessageText(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleSaveEditedMessage()
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={handleCancelEdit}
                        className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEditedMessage}
                        className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="group relative max-w-[280px] sm:max-w-md">
                    <div
                      className={`px-3 py-2 rounded-3xl ${
                        message.sender === currentUser._id
                          ? "bg-blue-500 text-white rounded-br-none"
                          : "bg-white text-gray-800 rounded-bl-none border border-gray-100"
                      }`}
                    >
                      {renderMessageContent(message)}
                      <div
                        className={`flex items-center justify-end gap-1 mt-1 text-xs ${
                          message.sender === currentUser._id
                            ? "text-blue-100"
                            : "text-gray-400"
                        }`}
                      >
                        <span>
                          {new Date(message.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {message.sender === currentUser._id && (
                          <>
                            <span>{message.read ? "✓✓" : "✓"}</span>
                            <div className="relative">
                              <button
                                className="p-0.5 rounded hover:bg-white/10 transition-colors"
                                onClick={() => toggleDropdown(message._id)}
                              >
                                <svg
                                  className="w-3 h-3"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <circle cx="12" cy="12" r="2" />
                                  <circle cx="12" cy="5" r="2" />
                                  <circle cx="12" cy="19" r="2" />
                                </svg>
                              </button>
                              {activeDropdown === message._id && (
                                <div className="absolute right-0 bottom-full mb-1 w-20 bg-white rounded-md shadow-lg border border-gray-100 z-10">
                                  <button
                                    onClick={() => handleEditMessage(message)}
                                    className="w-full text-left px-3 py-1.5 text-xs text-blue-600 hover:bg-gray-50 rounded-t-md"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteMessage(message._id)
                                    }
                                    className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-gray-50 rounded-b-md"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 rounded-2xl rounded-bl-none border border-gray-100 px-3 py-2">
                  <div className="flex items-center gap-1">
                    <div
                      className="w-1.5 h-1.5 bg-blue-800 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms", animationDuration: "1s" }}
                    ></div>
                    <div
                      className="w-1.5 h-1.5 bg-green-800 rounded-full animate-bounce"
                      style={{
                        animationDelay: "150ms",
                        animationDuration: "1s",
                      }}
                    ></div>
                    <div
                      className="w-1.5 h-1.5 bg-purple-800 rounded-full animate-bounce"
                      style={{
                        animationDelay: "300ms",
                        animationDuration: "1s",
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />{" "}
          </div>
        )}
      </div>

      {/* FIXED: Input Area - Always at bottom */}
      <div className="flex-shrink-0 px-4 py-3 bg-white border-t border-gray-100">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMediaUpload(true)}
            className="p-2 rounded-full text-gray-500 hover:text-blue-500 hover:bg-gray-100 transition-colors"
            title="Attach image or video"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </button>

          <div className="relative flex-1">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyUp={handleTyping}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Type a message..."
              className="w-full px-4 py-2.5 text-sm rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
            />
            {newMessage && (
              <button
                onClick={() => setNewMessage("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="p-2.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Modals */}
      {showMediaUpload && (
        <MediaUpload
          currentUser={currentUser}
          recipientUser={recipientUser}
          onMediaUpload={handleSendMedia}
          onClose={() => setShowMediaUpload(false)}
        />
      )}

      {viewerMedia && (
        <MediaViewer
          media={viewerMedia}
          mediaType={viewerMediaType}
          allMedia={allMedia}
          currentIndex={currentMediaIndex}
          onClose={() => {
            setViewerMedia(null);
            setViewerMediaType(null);
          }}
        />
      )}

      {showChatDetails && (
        <ChatDetails
          currentUser={currentUser}
          recipientUser={recipientUser}
          allMedia={allMedia}
          onClose={() => setShowChatDetails(false)}
        />
      )}
    </div>
  );
};

export default ChatComponent;
