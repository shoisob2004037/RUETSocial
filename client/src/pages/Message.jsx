"use client";

import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { getAllUsers, getUser } from "../services/api";
import ChatList from "../components/ChatList";
import ChatComponent from "../components/ChatComponent";
import { ChevronLeft, Search, Users, MessageCircle, X } from "lucide-react";

const Message = ({ user }) => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const location = useLocation();
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [followingUsers, setFollowingUsers] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("chat");
  const [isMobile, setIsMobile] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // Check screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setShowChat(true);
      }
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Load user from URL params
  useEffect(() => {
    const loadUserFromParams = async () => {
      if (userId && userId !== user.user._id) {
        try {
          const userData = await getUser(userId);
          setSelectedUser(userData);
          if (isMobile) {
            setShowChat(true);
          }
        } catch (error) {
          console.error("Error loading user from params:", error);
          setSelectedUser(null);
        }
      }
    };
    loadUserFromParams();
  }, [userId, user.user._id, isMobile]);

  // Fetch following users
  useEffect(() => {
    const fetchFollowingUsers = async () => {
      try {
        setLoading(true);
        const currentUserData = await getUser(user.user._id);
        const followingPromises = (currentUserData.following || []).map(async (id) => {
          try {
            const userData = await getUser(id);
            return userData;
          } catch (error) {
            console.warn(`User with ID ${id} not found, skipping...`);
            return null;
          }
        });
        const followingData = (await Promise.all(followingPromises)).filter((u) => u !== null);
        setFollowingUsers(followingData);
      } catch (error) {
        console.error("Error fetching following users:", error);
        setFollowingUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFollowingUsers();
  }, [user.user._id]);

  const handleSearchChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim().length > 0) {
      setShowSearchResults(true);
      try {
        const allUsers = await getAllUsers();
        const filteredUsers = allUsers.filter((u) => {
          if (u._id === user.user._id) return false;
          const fullName = `${u.firstname} ${u.lastname}`.toLowerCase();
          return fullName.includes(query.toLowerCase());
        });
        setSearchResults(filteredUsers);
      } catch (error) {
        console.error("Error searching users:", error);
        setSearchResults([]);
      }
    } else {
      setShowSearchResults(false);
      setSearchResults([]);
    }
  };

  const handleSelectUser = (selectedUser) => {
    if (!selectedUser || !selectedUser._id) return;
    setSelectedUser(selectedUser);
    setSearchQuery("");
    setShowSearchResults(false);
    setActiveTab("chat");
    if (isMobile) {
      setShowChat(true);
    }
    navigate(`/message/${selectedUser._id}`, { replace: true });
  };

  const handleBackToList = () => {
    setShowChat(false);
    navigate("/message", { replace: true });
  };

  const clearSearch = () => {
    setSearchQuery("");
    setShowSearchResults(false);
    setSearchResults([]);
  };

  // Desktop view: show both sidebar and chat
  if (!isMobile) {
    return (
      <div className="h-screen flex bg-gray-50 overflow-hidden">
        {/* Sidebar - Full height with flex column */}
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col shadow-lg h-full overflow-hidden">
          {/* FIXED Header - Never scrolls */}
          <div className="flex-shrink-0 p-5 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-indigo-600">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <MessageCircle className="w-6 h-6" />
              Messages
            </h1>
            <p className="text-purple-100 text-sm mt-1">Connect with your friends</p>
          </div>

          {/* FIXED Tabs - Never scrolls */}
          <div className="flex-shrink-0 flex border-b border-gray-200 bg-white">
            <button
              className={`flex-1 py-3 text-center font-semibold transition-all duration-200 relative ${
                activeTab === "chat"
                  ? "text-purple-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("chat")}
            >
              <div className="flex items-center justify-center gap-2">
                <MessageCircle className="w-4 h-4" />
                <span>Chats</span>
              </div>
              {activeTab === "chat" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600"></div>
              )}
            </button>
            <button
              className={`flex-1 py-3 text-center font-semibold transition-all duration-200 relative ${
                activeTab === "people"
                  ? "text-purple-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("people")}
            >
              <div className="flex items-center justify-center gap-2">
                <Users className="w-4 h-4" />
                <span>People</span>
              </div>
              {activeTab === "people" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600"></div>
              )}
            </button>
          </div>

          {/* SCROLLABLE Content - Only this part scrolls */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {activeTab === "chat" && (
              <ChatList
                currentUser={user.user}
                onSelectChat={handleSelectUser}
                selectedChatId={selectedUser?._id}
              />
            )}
            {activeTab === "people" && (
              <div className="p-4">
                {/* Search Bar */}
                <div className="relative mb-4 sticky top-0 bg-white z-10">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50"
                  />
                  {searchQuery && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>

                {/* Search Results */}
                {showSearchResults && (
                  <div className="mb-4 bg-white rounded-xl shadow-lg border border-gray-100 max-h-80 overflow-y-auto">
                    {searchResults.length === 0 ? (
                      <div className="p-8 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Search className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">No users found</p>
                        <p className="text-sm text-gray-400 mt-1">Try a different name</p>
                      </div>
                    ) : (
                      <div>
                        <div className="p-3 bg-gray-50 border-b border-gray-100">
                          <p className="text-sm text-gray-500 font-medium">
                            Found {searchResults.length} users
                          </p>
                        </div>
                        {searchResults.map((userItem) => (
                          <button
                            key={userItem._id}
                            className="w-full flex items-center gap-3 p-3 hover:bg-purple-50 transition-all duration-200 border-b border-gray-50 last:border-0"
                            onClick={() => handleSelectUser(userItem)}
                          >
                            <img
                              src={userItem.profilePicture || "https://via.placeholder.com/48"}
                              alt={userItem.firstname}
                              className="w-12 h-12 rounded-full object-cover border-2 border-purple-200"
                            />
                            <div className="flex-1 text-left">
                              <p className="font-semibold text-gray-800">
                                {userItem.firstname} {userItem.lastname}
                              </p>
                              {userItem.department && (
                                <p className="text-xs text-gray-500">{userItem.department}</p>
                              )}
                            </div>
                            <button className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-full hover:bg-purple-700 transition-colors">
                              Message
                            </button>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Following Users List */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    People You Follow
                  </h3>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                    {followingUsers.length}
                  </span>
                </div>

                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                  </div>
                ) : followingUsers.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-10 h-10 text-purple-600" />
                    </div>
                    <p className="text-gray-600 font-medium">No follows yet</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Follow people to start conversations
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 pb-4">
                    {followingUsers.map((userItem) => (
                      <button
                        key={userItem._id}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-purple-50 transition-all duration-200 group"
                        onClick={() => handleSelectUser(userItem)}
                      >
                        <img
                          src={userItem.profilePicture || "https://via.placeholder.com/48"}
                          alt={userItem.firstname}
                          className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 group-hover:border-purple-300 transition-colors"
                        />
                        <div className="flex-1 text-left">
                          <p className="font-semibold text-gray-800">
                            {userItem.firstname} {userItem.lastname}
                          </p>
                          {userItem.department && (
                            <p className="text-xs text-gray-500">{userItem.department}</p>
                          )}
                        </div>
                        <button className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-full group-hover:bg-purple-600 group-hover:text-white transition-all">
                          Message
                        </button>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area - Takes remaining space */}
        <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden h-full">
          {selectedUser ? (
            <ChatComponent
              currentUser={user.user}
              recipientUser={selectedUser}
              onClose={() => {
                setSelectedUser(null);
                navigate("/message", { replace: true });
              }}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8">
              <div className="bg-gradient-to-br from-purple-100 to-indigo-100 p-8 rounded-full mb-6">
                <MessageCircle className="w-20 h-20 text-purple-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Your Messages</h2>
              <p className="text-gray-500 text-center max-w-md mb-6">
                Select a conversation from the sidebar or start a new one by finding someone in the People tab
              </p>
              <button
                onClick={() => setActiveTab("people")}
                className="px-6 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Find People
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Mobile view: show either list or chat
  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {!showChat ? (
        // Chat List View - Flex column layout
        <div className="flex flex-col h-full overflow-hidden">
          {/* FIXED Header - Never scrolls */}
          <div className="flex-shrink-0 bg-gradient-to-r from-purple-600 to-indigo-600 p-5">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <MessageCircle className="w-6 h-6" />
              Messages
            </h1>
          </div>

          {/* FIXED Tabs - Never scrolls */}
          <div className="flex-shrink-0 flex border-b border-gray-200 bg-white">
            <button
              className={`flex-1 py-4 text-center font-semibold transition-all duration-200 ${
                activeTab === "chat"
                  ? "text-purple-600 border-b-2 border-purple-600"
                  : "text-gray-500"
              }`}
              onClick={() => setActiveTab("chat")}
            >
              <div className="flex items-center justify-center gap-2">
                <MessageCircle className="w-5 h-5" />
                <span>Chats</span>
              </div>
            </button>
            <button
              className={`flex-1 py-4 text-center font-semibold transition-all duration-200 ${
                activeTab === "people"
                  ? "text-purple-600 border-b-2 border-purple-600"
                  : "text-gray-500"
              }`}
              onClick={() => setActiveTab("people")}
            >
              <div className="flex items-center justify-center gap-2">
                <Users className="w-5 h-5" />
                <span>People</span>
              </div>
            </button>
          </div>

          {/* SCROLLABLE Content - Only this part scrolls */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {activeTab === "chat" && (
              <ChatList
                currentUser={user.user}
                onSelectChat={handleSelectUser}
                selectedChatId={selectedUser?._id}
              />
            )}
            {activeTab === "people" && (
              <div className="p-4">
                {/* Search Bar */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50"
                  />
                  {searchQuery && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </div>

                {/* Search Results */}
                {showSearchResults && (
                  <div className="mb-4 bg-white rounded-xl shadow-lg max-h-96 overflow-y-auto">
                    {searchResults.length === 0 ? (
                      <div className="p-8 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Search className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500">No users found</p>
                      </div>
                    ) : (
                      searchResults.map((userItem) => (
                        <button
                          key={userItem._id}
                          className="w-full flex items-center gap-3 p-4 hover:bg-purple-50 border-b border-gray-100"
                          onClick={() => handleSelectUser(userItem)}
                        >
                          <img
                            src={userItem.profilePicture || "https://via.placeholder.com/50"}
                            alt={userItem.firstname}
                            className="w-14 h-14 rounded-full object-cover"
                          />
                          <div className="flex-1 text-left">
                            <p className="font-semibold text-gray-800">
                              {userItem.firstname} {userItem.lastname}
                            </p>
                            {userItem.department && (
                              <p className="text-xs text-gray-500">{userItem.department}</p>
                            )}
                          </div>
                          <button className="px-4 py-2 bg-purple-600 text-white text-sm rounded-full">
                            Message
                          </button>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {/* Following Users */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    Following
                  </h3>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                    {followingUsers.length}
                  </span>
                </div>

                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                  </div>
                ) : followingUsers.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-10 h-10 text-purple-600" />
                    </div>
                    <p className="text-gray-600">No follows yet</p>
                  </div>
                ) : (
                  <div className="space-y-2 pb-4">
                    {followingUsers.map((userItem) => (
                      <button
                        key={userItem._id}
                        className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-purple-50 transition-all"
                        onClick={() => handleSelectUser(userItem)}
                      >
                        <img
                          src={userItem.profilePicture || "https://via.placeholder.com/50"}
                          alt={userItem.firstname}
                          className="w-14 h-14 rounded-full object-cover"
                        />
                        <div className="flex-1 text-left">
                          <p className="font-semibold text-gray-800">
                            {userItem.firstname} {userItem.lastname}
                          </p>
                          {userItem.department && (
                            <p className="text-xs text-gray-500">{userItem.department}</p>
                          )}
                        </div>
                        <button className="px-4 py-2 bg-purple-600 text-white text-sm rounded-full">
                          Chat
                        </button>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        // Chat View for Mobile - Full height with proper fixed headers
        <div className="h-full flex flex-col overflow-hidden">
          <ChatComponent
            currentUser={user.user}
            recipientUser={selectedUser}
            onClose={handleBackToList}
          />
        </div>
      )}
    </div>
  );
};

export default Message;