"use client"

import { useState, useEffect } from "react";
import { getUserChats, markMessagesAsRead } from "../services/api";

const ChatList = ({ currentUser, onSelectChat, selectedChatId }) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch chats initially and set up polling
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

    if (currentUser._id) {
      fetchChats(); // Initial fetch
      // Poll every 10 seconds to check for new messages
      const interval = setInterval(fetchChats, 10000);
      return () => clearInterval(interval);
    }
  }, [currentUser._id]);

  const handleSelectChat = async (chat) => {
    if (!chat?.participant || !chat.participant._id) return;
    if (chat.unreadCount > 0) {
      try {
        await markMessagesAsRead(chat.chatId, currentUser._id);
        setChats((prev) => prev.map((c) => (c.chatId === chat.chatId ? { ...c, unreadCount: 0 } : c)));
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    }
    onSelectChat(chat.participant);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-t-purple-600 border-purple-200 rounded-full animate-spin mb-3"></div>
          <p className="text-purple-600 font-medium">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 h-full flex flex-col">
      <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
        <svg
          className="w-6 h-6 mr-2 text-purple-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          ></path>
        </svg>
        Messages
      </h2>

      {chats.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-grow py-10">
          <div className="bg-purple-100 p-4 rounded-full mb-4">
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
          <p className="text-center text-gray-500 font-medium">No conversations yet</p>
          <p className="text-center text-gray-400 text-sm mt-1">Start a new conversation from the People tab</p>
        </div>
      ) : (
        <ul className="space-y-2 overflow-y-auto flex-grow">
          {chats.map((chat) => (
            <li
              key={chat.chatId}
              className={`flex items-center p-3 rounded-xl cursor-pointer transition-all duration-200 hover:bg-purple-50 ${
                selectedChatId === chat.participant._id
                  ? "bg-purple-100 border-l-4 border-purple-600"
                  : "border-l-4 border-transparent"
              } ${chat.unreadCount > 0 ? "bg-opacity-70 bg-purple-50" : ""}`}
              onClick={() => handleSelectChat(chat)}
            >
              <div className="relative">
                <img
                  src={chat.participant.profilePicture || "https://placehold.co/40x40?text=User"}
                  alt={`${chat.participant.firstname} ${chat.participant.lastname}`}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                />
              </div>
              <div className="ml-3 flex-1 overflow-hidden">
                <div className="flex justify-between items-center">
                  <h4 className={`font-medium text-gray-800 truncate ${chat.unreadCount > 0 ? "font-semibold" : ""}`}>
                    {`${chat.participant.firstname} ${chat.participant.lastname}`}
                  </h4>
                  <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                    {new Date(chat.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p
                    className={`text-sm truncate ${
                      chat.unreadCount > 0 ? "text-gray-800 font-medium" : "text-gray-500"
                    }`}
                  >
                    {chat.lastMessage ? (
                      <>
                        {chat.lastMessage.sender === currentUser._id ? "You: " : ""}
                        {chat.lastMessage.text.length > 30
                          ? `${chat.lastMessage.text.substring(0, 30)}...`
                          : chat.lastMessage.text}
                      </>
                    ) : (
                      <span className="italic text-gray-400">Start a conversation</span>
                    )}
                  </p>
                  {chat.unreadCount > 0 && (
                    <span className="bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold ml-2">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ChatList;
