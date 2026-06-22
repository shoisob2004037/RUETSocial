"use client";

import { useState, useEffect } from "react";
import { getUserChats, markMessagesAsRead } from "../services/api";
import { io } from "socket.io-client";

const ChatList = ({ currentUser, onSelectChat, selectedChatId }) => {
  const [chats, setChats] = useState([]);
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_API_URL, {
      transports: ['polling', 'websocket'],
      upgrade: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000
    });
    setSocket(newSocket);
    newSocket.emit("user_connected", currentUser._id);
    return () => newSocket.disconnect();
  }, [currentUser._id]);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        setLoading(true);
        const response = await getUserChats(currentUser._id);
        const validChats = (response || []).filter((chat) => chat.participant && chat.participant._id);
        setChats(validChats);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching chats:", error);
        setChats([]);
        setLoading(false);
      }
    };
    if (currentUser._id) fetchChats();
  }, [currentUser._id]);

  useEffect(() => {
    if (!socket) return;

    socket.on("user_status", ({ userId, status }) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        status === "online" ? newSet.add(userId) : newSet.delete(userId);
        return newSet;
      });
    });

    socket.on("receive_message", (data) => {
      setChats((prev) => {
        const chatIndex = prev.findIndex((chat) => chat.chatId === data.chatId);
        if (chatIndex !== -1) {
          const updatedChats = [...prev];
          updatedChats[chatIndex] = {
            ...updatedChats[chatIndex],
            lastMessage: data.message,
            unreadCount: data.message.sender !== currentUser._id ? updatedChats[chatIndex].unreadCount + 1 : updatedChats[chatIndex].unreadCount,
            updatedAt: new Date().toISOString(),
          };
          return updatedChats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        }
        return prev;
      });
    });

    socket.on("messages_read", ({ chatId, readBy }) => {
      if (readBy !== currentUser._id) {
        setChats((prev) =>
          prev.map((chat) =>
            chat.chatId === chatId ? { ...chat, lastMessage: chat.lastMessage ? { ...chat.lastMessage, read: true } : null } : chat
          )
        );
      }
    });

    return () => {
      socket.off("user_status");
      socket.off("receive_message");
      socket.off("messages_read");
    };
  }, [socket, currentUser._id]);

  const handleSelectChat = (chat) => {
    if (!chat?.participant || !chat.participant._id) return;
    if (chat.unreadCount > 0) {
      markMessagesAsRead(chat.chatId, currentUser._id).then(() => {
        setChats((prev) => prev.map((c) => (c.chatId === chat.chatId ? { ...c, unreadCount: 0 } : c)));
        socket?.emit("mark_read", { chatId: chat.chatId, userId: currentUser._id });
      });
    }
    onSelectChat(chat.participant);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-12">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-gray-400 text-xs mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 px-4">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p className="text-gray-500 text-sm font-medium">No conversations</p>
        <p className="text-gray-400 text-xs mt-1 text-center">Start messaging someone!</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {chats.map((chat) => (
        <button
          key={chat.chatId}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 transition-colors ${
            selectedChatId === chat.participant._id ? "bg-blue-50" : ""
          }`}
          onClick={() => handleSelectChat(chat)}
        >
          <div className="relative flex-shrink-0">
            <img
              src={chat.participant.profilePicture || "https://via.placeholder.com/40"}
              alt={`${chat.participant.firstname} ${chat.participant.lastname}`}
              className="w-10 h-10 rounded-full object-cover"
            />
            {onlineUsers.has(chat.participant._id) && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></span>
            )}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="flex justify-between items-baseline gap-2">
              <h4 className={`text-[13px] leading-tight ${chat.unreadCount > 0 ? "font-semibold text-gray-900" : "font-medium text-gray-700"} truncate`}>
                {`${chat.participant.firstname} ${chat.participant.lastname}`}
              </h4>
              <span className="text-[10px] text-gray-400 flex-shrink-0">
                {new Date(chat.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            </div>
            <div className="flex justify-between items-center mt-0.5 gap-2">
              <p className={`text-[11.5px] truncate ${
                chat.unreadCount > 0 ? "text-gray-800 font-medium" : "text-gray-500"
              }`}>
                {chat.lastMessage ? (
                  <>
                    {chat.lastMessage.sender === currentUser._id && "You: "}
                    {chat.lastMessage.text?.length > 32 ? `${chat.lastMessage.text.substring(0, 32)}…` : chat.lastMessage.text}
                  </>
                ) : (
                  <span className="italic">No messages</span>
                )}
              </p>
              {chat.unreadCount > 0 && (
                <span className="bg-blue-500 text-white text-[10px] rounded-full min-w-[18px] h-[18px] px-1.5 flex items-center justify-center font-semibold">
                  {chat.unreadCount}
                </span>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default ChatList;
