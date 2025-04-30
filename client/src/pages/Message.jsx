"use client";

import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { getAllUsers, getUser } from "../services/api";
import ChatList from "../components/ChatList";
import ChatComponent from "../components/ChatComponent";

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
  const [mobileView, setMobileView] = useState("list"); // "list" or "chat"

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileView("both");
      } else {
        setMobileView(selectedUser ? "chat" : "list");
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [selectedUser]);

  useEffect(() => {
    const fetchFollowingUsers = async () => {
      try {
        setLoading(true);
        const currentUserData = await getUser(user.user._id);
        const followingPromises = currentUserData.following.map(async (id) => {
          try {
            const userData = await getUser(id);
            return userData;
          } catch (error) {
            console.warn(`User with ID ${id} not found, skipping...`);
            return null;
          }
        });
        const followingData = (await Promise.all(followingPromises)).filter((user) => user !== null);
        setFollowingUsers(followingData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching following users:", error);
        setFollowingUsers([]);
        setLoading(false);
      }
    };
    fetchFollowingUsers();
  }, [user.user._id]);

  useEffect(() => {
    const loadUserFromParams = async () => {
      if (userId && userId !== user.user._id) {
        try {
          const userData = await getUser(userId);
          setSelectedUser(userData);
          setMobileView("chat");
        } catch (error) {
          console.error("Error loading user from params:", error);
          setSelectedUser(null);
        }
      }
    };
    loadUserFromParams();
  }, [userId, user.user._id]);

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
    setMobileView("chat");
    navigate(`/message/${selectedUser._id}`, { replace: true });
  };

  const handleBackToList = () => {
    setMobileView("list");
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="flex-grow flex overflow-hidden">
        {/* Sidebar - Chat List & People */}
        <div 
          className={`${
            mobileView === "chat" ? "hidden md:flex" : "flex"
          } w-full md:w-1/3 lg:w-1/4 bg-white shadow-lg flex-col border-r border-gray-200`}
        >
          <div className="flex border-b border-gray-200">
            <button
              className={`flex-1 py-4 text-center font-medium transition-colors duration-200 ${
                activeTab === "chat" 
                  ? "text-purple-600 border-b-2 border-purple-600" 
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("chat")}
            >
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                </svg>
                Chats
              </div>
            </button>
            <button
              className={`flex-1 py-4 text-center font-medium transition-colors duration-200 ${
                activeTab === "people" 
                  ? "text-purple-600 border-b-2 border-purple-600" 
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("people")}
            >
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                </svg>
                People
              </div>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {activeTab === "chat" && (
              <ChatList
                currentUser={user.user}
                onSelectChat={handleSelectUser}
                selectedChatId={selectedUser?._id}
              />
            )}
            {activeTab === "people" && (
              <div className="p-4 h-full flex flex-col">
                <div className="relative mb-4">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50"
                  />
                </div>
                
                {showSearchResults && (
                  <div className="bg-white rounded-lg shadow-md max-h-60 overflow-y-auto mb-4 border border-gray-100">
                    {searchResults.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        No users found
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-100">
                        {searchResults.map((user) => (
                          <li
                            key={user._id}
                            className="flex items-center p-3 hover:bg-purple-50 cursor-pointer transition-colors duration-200"
                            onClick={() => handleSelectUser(user)}
                          >
                            <img
                              src={user.profilePicture || "https://via.placeholder.com/40"}
                              alt={`${user.firstname} ${user.lastname}`}
                              className="w-10 h-10 rounded-full object-cover border border-gray-200"
                            />
                            <div className="ml-3">
                              <span className="font-medium text-gray-800">{`${user.firstname} ${user.lastname}`}</span>
                              {user.worksAt && (
                                <p className="text-xs text-gray-500">Works at {user.worksAt}</p>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                  </svg>
                  People You Follow
                </h3>
                
                {loading ? (
                  <div className="flex justify-center py-6">
                    <div className="w-8 h-8 border-4 border-t-purple-600 border-purple-200 rounded-full animate-spin"></div>
                  </div>
                ) : followingUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center flex-grow py-8">
                    <div className="bg-purple-100 p-3 rounded-full mb-3">
                      <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
                      </svg>
                    </div>
                    <p className="text-center text-gray-500 font-medium">You're not following anyone yet</p>
                    <p className="text-center text-gray-400 text-sm mt-1">Follow people to start conversations</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100 overflow-y-auto flex-grow">
                    {followingUsers.map((user) => (
                      <li
                        key={user._id}
                        className="flex items-center p-3 hover:bg-purple-50 cursor-pointer transition-colors duration-200"
                        onClick={() => handleSelectUser(user)}
                      >
                        <img
                          src={user.profilePicture || "https://via.placeholder.com/40"}
                          alt={`${user.firstname} ${user.lastname}`}
                          className="w-10 h-10 rounded-full object-cover border border-gray-200"
                        />
                        <div className="ml-3">
                          <span className="font-medium text-gray-800">{`${user.firstname} ${user.lastname}`}</span>
                          {user.worksAt && (
                            <p className="text-xs text-gray-500">Works at {user.worksAt}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div 
          className={`${
            mobileView === "list" ? "hidden md:flex" : "flex"
          } w-full md:w-2/3 lg:w-3/4 flex-col bg-gray-50`}
        >
          {selectedUser ? (
            <>
              {/* Mobile back button */}
              <div className="md:hidden bg-white border-b border-gray-200 p-2">
                <button 
                  onClick={handleBackToList}
                  className="flex items-center text-purple-600 font-medium"
                >
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                  </svg>
                  Back to messages
                </button>
              </div>
              <ChatComponent 
                currentUser={user.user} 
                recipientUser={selectedUser} 
                onClose={() => {
                  setSelectedUser(null);
                  setMobileView("list");
                  navigate("/message", { replace: true });
                }}
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white bg-opacity-70">
              <div className="bg-purple-100 p-6 rounded-full mb-4">
                <svg className="w-16 h-16 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Your Messages</h3>
              <p className="text-gray-500 text-center max-w-md">
                Select a conversation from the list or start a new one by finding someone in the People tab
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;
