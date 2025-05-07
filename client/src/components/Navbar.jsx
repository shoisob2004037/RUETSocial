"use client"

import { Link, useNavigate } from "react-router-dom"
import { useState, useEffect, useRef } from "react"
import {
  logoutUser,
  getAllUsers,
  getUserNotifications,
  searchPosts,
  getUserChats,
  getSavedPosts,
  getUser,
} from "../services/api"
import { io } from "socket.io-client"

const Navbar = ({ user, setUser }) => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")
  const [postSearchQuery, setPostSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [postSearchResults, setPostSearchResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [showPostResults, setShowPostResults] = useState(false)
  const [departmentFilter, setDepartmentFilter] = useState("")
  const searchRef = useRef(null)
  const postSearchRef = useRef(null)
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const [savedPostsCount, setSavedPostsCount] = useState(0)
  const [socket, setSocket] = useState(null)
  const [currentChatId, setCurrentChatId] = useState(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) setShowResults(false)
      if (postSearchRef.current && !postSearchRef.current.contains(event.target)) setShowPostResults(false)
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) setShowUserMenu(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (!user || !user.user) return

    const newSocket = io(import.meta.env.VITE_API_URL, {
      transports: ["websocket"],
      upgrade: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    setSocket(newSocket)
    newSocket.emit("user_connected", user.user._id)

    return () => newSocket.disconnect()
  }, [user])

  useEffect(() => {
    if (!socket || !user?.user) return

    const handleReceiveMessage = (data) => {
      if (data.chatId !== currentChatId) {
        setUnreadMessageCount((prev) => prev + 1)
      }
    }

    const handleMessagesRead = () => {
      fetchUnreadMessages()
    }

    socket.on("receive_message", handleReceiveMessage)
    socket.on("messages_read", handleMessagesRead)

    return () => {
      socket.off("receive_message", handleReceiveMessage)
      socket.off("messages_read", handleMessagesRead)
    }
  }, [socket, user, currentChatId])

  useEffect(() => {
    if (!user || !user.user) return

    fetchNotifications()
    fetchUnreadMessages()
    fetchSavedPostsCount()

    const interval = setInterval(() => {
      fetchNotifications()
      fetchUnreadMessages()
      fetchSavedPostsCount()
    }, 30000)

    return () => clearInterval(interval)
  }, [user])

  const fetchNotifications = async () => {
    try {
      const data = await getUserNotifications(user.user._id)
      const unread = data.filter((notification) => !notification.read).length
      setUnreadNotificationCount(unread)
    } catch (error) {
      console.error("Error fetching notifications:", error)
    }
  }

  const fetchUnreadMessages = async () => {
    try {
      const chats = await getUserChats(user.user._id)
      const totalUnread = chats.reduce((sum, chat) => sum + chat.unreadCount, 0)
      setUnreadMessageCount(totalUnread)
    } catch (error) {
      console.error("Error fetching unread messages:", error)
    }
  }

  const fetchSavedPostsCount = async () => {
    try {
      const savedPosts = await getSavedPosts(user.user._id)
      setSavedPostsCount(savedPosts.length)
    } catch (error) {
      console.error("Error fetching saved posts count:", error)
      setSavedPostsCount(0)
    }
  }

  const handleSearchChange = async (e) => {
    const query = e.target.value
    setSearchQuery(query)
    if (query.trim().length > 0) {
      setIsLoading(true)
      setShowResults(true)
      try {
        const allUsers = await getAllUsers()
        const filteredUsers = allUsers.filter((u) => {
          if (u._id === user.user._id) return false

          // Filter by department if departmentFilter is set
          if (departmentFilter && u.department !== departmentFilter) return false

          const fullName = `${u.firstname} ${u.lastname}`.toLowerCase()
          return fullName.includes(query.toLowerCase())
        })
        setSearchResults(filteredUsers)
      } catch (error) {
        console.error("Error searching users:", error)
        setSearchResults([])
      } finally {
        setIsLoading(false)
      }
    } else {
      setShowResults(false)
      setSearchResults([])
    }
  }

  const handleDepartmentFilterChange = (e) => {
    setDepartmentFilter(e.target.value)
    // Re-run search with new department filter if there's a query
    if (searchQuery.trim().length > 0) {
      handleSearchChange({ target: { value: searchQuery } })
    }
  }

  const getUserById = async (userId) => {
    try {
      // First check if we already have this user in search results
      const foundUser = searchResults.find((user) => user._id === userId)
      if (foundUser) return foundUser

      // If not found in search results, fetch from API
      const userData = await getUser(userId)
      return userData
    } catch (error) {
      console.error("Error fetching user:", error)
      return null
    }
  }

  const handlePostSearchChange = async (e) => {
    const query = e.target.value
    setPostSearchQuery(query)
    if (query.trim().length > 1) {
      setIsLoading(true)
      setShowPostResults(true)
      try {
        const posts = await searchPosts(query)

        // Enhance posts with complete user data
        const enhancedPosts = await Promise.all(
          posts.slice(0, 5).map(async (post) => {
            if (!post.userId || typeof post.userId === "string") {
              // If userId is just an ID string, fetch full user data
              const userData = await getUserById(post.userId || post.user?._id)
              return { ...post, userId: userData || post.userId }
            }
            return post
          }),
        )

        setPostSearchResults(enhancedPosts)
      } catch (error) {
        console.error("Error searching posts:", error)
        setPostSearchResults([])
      } finally {
        setIsLoading(false)
      }
    } else {
      setShowPostResults(false)
      setPostSearchResults([])
    }
  }

  const handleLogout = () => {
    logoutUser()
    setUser(null)
    navigate("/login")
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim().length > 0) {
      navigate(
        `/search?q=${encodeURIComponent(searchQuery)}${departmentFilter ? `&department=${encodeURIComponent(departmentFilter)}` : ""}`,
      )
      setShowResults(false)
    }
  }

  const handlePostSearch = (e) => {
    e.preventDefault()
    if (postSearchQuery.trim().length > 0) {
      navigate(`/search/posts?q=${encodeURIComponent(postSearchQuery)}`)
      setShowPostResults(false)
    }
  }

  const goToProfile = (userId) => {
    navigate(`/profile/${userId}`)
    setSearchQuery("")
    setShowResults(false)
  }

  const goToPost = (postId) => {
    navigate(`/post/${postId}`)
    setPostSearchQuery("")
    setShowPostResults(false)
  }

  const goToMessenger = () => {
    navigate("/message")
    setUnreadMessageCount(0)
    setCurrentChatId(null)
  }

  const goToNotifications = () => {
    navigate("/notifications")
  }

  const goToSavedPosts = () => {
    navigate("/saved")
    setSavedPostsCount(0)
  }

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu)
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  if (!user) return null

  return (
    <nav className="bg-gradient-to-r from-teal-700 to-green-900 shadow-xl p-3 sm:p-4 sticky top-0 z-50 backdrop-blur-sm border-b border-white/10">
    <div className="max-w-7xl mx-auto">
      {/* Mobile Layout */}
      <div className="flex items-center justify-between md:hidden">
        {/* Logo */}
        <Link to="/" className="flex items-center group">
          <div className="relative overflow-hidden rounded-lg p-1">
            <div className="absolute inset-0 transition-all duration-300 rounded-lg"></div>
            <img
              src="/logo.png"
              alt="RUETSocialLogo"
              className="h-10 w-auto drop-shadow-md relative z-10 transition-transform group-hover:scale-105 duration-300"
            />
          </div>
        </Link>

        {/* Mobile Actions */}
        <div className="flex items-center space-x-3">
          {/* User Profile */}
          <div className="relative" ref={userMenuRef}>
            <button 
              onClick={toggleUserMenu}
              className="flex items-center p-1 focus:outline-none" 
              aria-label="User menu" 
              aria-haspopup="true"
              aria-expanded={showUserMenu}
            >
              <div className="relative">
                <img
                  src={user.user.profilePicture || "https://via.placeholder.com/40"}
                  alt={`${user.user.firstname} ${user.user.lastname}`}
                  className="w-8 h-8 rounded-full border-2 border-white hover:border-purple-200 transition-all duration-200 object-cover shadow-md"
                />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
            </button>

            {/* Dropdown Menu - Same as before */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl z-50 animate-fadeIn">
                <div className="py-3 rounded-t-lg bg-gradient-to-r from-purple-600 to-indigo-700 text-white">
                  <div className="px-4 py-2">
                    <div className="flex items-center">
                      <img
                        src={user.user.profilePicture || "https://via.placeholder.com/40"}
                        alt={`${user.user.firstname} ${user.user.lastname}`}
                        className="w-12 h-12 rounded-full border-2 border-white mr-3 object-cover"
                      />
                      <div>
                        <p className="font-semibold truncate">
                          {user.user.firstname} {user.user.lastname}
                        </p>
                        <p className="text-xs text-purple-200 truncate">{user.user.email}</p>
                        {user.user.department && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                            {user.user.department}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="py-1 border-b border-gray-100">
                  <Link
                    to={`/profile/${user.user._id}`}
                    className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <div className="bg-purple-100 p-2 rounded-full mr-3">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <span className="no-underline">My Profile</span>
                  </Link>

                  <button
                    onClick={() => {
                      goToSavedPosts();
                      setShowUserMenu(false);
                    }}
                    className="flex items-center w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                  >
                    <div className="bg-blue-100 p-2 rounded-full mr-3">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                        />
                      </svg>
                    </div>
                    <span>Saved Posts</span>
                    {savedPostsCount > 0 && (
                      <span className="ml-auto bg-purple-100 text-purple-800 text-xs font-medium px-2 py-0.5 rounded-full">
                        {savedPostsCount}
                      </span>
                    )}
                  </button>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      handleLogout();
                      setShowUserMenu(false);
                    }}
                    className="flex items-center w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                  >
                    <div className="bg-red-100 p-2 rounded-full mr-3">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                    </div>
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button 
            onClick={toggleMobileMenu}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors duration-200"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu - Collapsible */}
      <div 
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? 'max-h-[500px] opacity-100 mt-3' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="space-y-3 py-2">
          {/* Search Bars */}
          <div className="flex flex-col space-y-3">
            {/* User Search */}
            <div ref={searchRef} className="relative w-full">
              <form onSubmit={handleSearch} className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <div className="flex">
                  <input
                    type="search"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-full pl-10 p-2.5 text-sm border-0 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-700 shadow-inner bg-white/90 backdrop-blur-sm"
                  />
                  <select
                    value={departmentFilter}
                    onChange={handleDepartmentFilterChange}
                    className="p-2.5 text-sm border-0 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-700 shadow-inner bg-white/90 backdrop-blur-sm"
                  >
                    <option value="">All Departments</option>
                    <option value="CSE">CSE</option>
                    <option value="EEE">EEE</option>
                    <option value="ETE">ETE</option>
                    <option value="ECE">ECE</option>
                    <option value="ME">ME</option>
                    <option value="CE">CE</option>
                    <option value="IPE">IPE</option>
                    <option value="GCE">GCE</option>
                    <option value="MSE">MSE</option>
                    <option value="CFPE">CFPE</option>
                    <option value="BECM">BECM</option>
                    <option value="URP">URP</option>
                    <option value="ARCH">ARCH</option>
                  </select>
                </div>
              </form>
              {showResults && (
                <ul className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-xl max-h-60 overflow-y-auto border border-gray-100 animate-fadeIn">
                  {isLoading ? (
                    <li className="p-3 text-center text-gray-500">
                      <div className="flex justify-center items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                        <span>Searching...</span>
                      </div>
                    </li>
                  ) : searchResults.length === 0 ? (
                    <li className="p-3 text-center text-gray-500">No users found</li>
                  ) : (
                    searchResults.map((result) => (
                      <li
                        key={result._id}
                        onClick={() => goToProfile(result._id)}
                        className="flex items-center p-3 hover:bg-purple-50 cursor-pointer transition-colors duration-150 border-b border-gray-100 last:border-b-0"
                      >
                        <img
                          src={result.profilePicture || "https://via.placeholder.com/40"}
                          alt={`${result.firstname} ${result.lastname}`}
                          className="w-10 h-10 rounded-full mr-3 object-cover border border-purple-200"
                        />
                        <div>
                          <p className="font-medium text-gray-800">{`${result.firstname} ${result.lastname}`}</p>
                          <p className="text-sm text-gray-500">
                            {result.department && `Department: ${result.department}`}
                            {result.worksAt && ` • Works at ${result.worksAt}`}
                          </p>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>

            {/* Post Search */}
            <div ref={postSearchRef} className="relative w-full">
              <form onSubmit={handlePostSearch} className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v10m2 2v-6m2 6h-6"
                    />
                  </svg>
                </div>
                <input
                  type="search"
                  placeholder="Search posts..."
                  value={postSearchQuery}
                  onChange={handlePostSearchChange}
                  className="w-full pl-10 p-2.5 text-sm border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-700 shadow-inner bg-white/90 backdrop-blur-sm"
                />
              </form>
              {showPostResults && (
                <ul className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-xl max-h-60 overflow-y-auto border border-gray-100 animate-fadeIn">
                  {isLoading ? (
                    <li className="p-3 text-center text-gray-500">
                      <div className="flex justify-center items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                        <span>Searching...</span>
                      </div>
                    </li>
                  ) : postSearchResults.length === 0 ? (
                    <li className="p-3 text-center text-gray-500">No posts found</li>
                  ) : (
                    postSearchResults.map((post) => {
                      // Get user info - this assumes your post objects include user info
                      const postUser = post.userId || {}
                      return (
                        <li
                          key={post._id}
                          onClick={() => goToPost(post._id)}
                          className="p-3 hover:bg-purple-50 cursor-pointer transition-colors duration-150 border-b border-gray-100 last:border-b-0"
                        >
                          <p className="font-medium text-gray-800">
                            {post.desc && post.desc.length > 50 ? `${post.desc.substring(0, 50)}...` : post.desc || "No description"}
                          </p>
                          <div className="flex items-center mt-1">
                            {postUser.profilePicture && (
                              <img
                                src={postUser.profilePicture || "/placeholder.svg"}
                                alt={`${postUser.firstname} ${postUser.lastname}`}
                                className="w-6 h-6 rounded-full mr-2 object-cover"
                                onError={(e) => (e.target.src = "https://via.placeholder.com/24")}
                              />
                            )}
                            <p className="text-sm text-gray-500">
                              By {postUser.firstname || "Unknown"} {postUser.lastname || "User"}
                              {postUser.department && (
                                <span className="text-xs text-gray-400 ml-1">({postUser.department})</span>
                              )}
                            </p>
                          </div>
                          {post.tags && post.tags.length > 0 && (
                            <p className="text-xs text-purple-600 mt-1 flex flex-wrap gap-1">
                              {post.tags.slice(0, 3).map((tag, index) => (
                                <span key={index} className="bg-purple-100 px-2 py-0.5 rounded-full">
                                  {tag}
                                </span>
                              ))}
                              {post.tags.length > 3 && (
                                <span className="bg-purple-100 px-2 py-0.5 rounded-full">+{post.tags.length - 3} more</span>
                              )}
                            </p>
                          )}
                        </li>
                      )
                    })
                  )}
                </ul>
              )}
            </div>
          </div>

          {/* Mobile Action Buttons */}
          <div className="flex items-center justify-center space-x-4 py-2">
            {/* Notification Button */}
            <button
              onClick={goToNotifications}
              className="relative text-white hover:text-purple-200 p-1.5 transition-colors duration-200 group"
              aria-label="Notifications"
            >
              <div className="bg-white/10 hover:bg-white/20 rounded-full p-2 backdrop-blur-sm transition-all duration-300">
                <svg
                  className="w-5 h-5 group-hover:scale-110 transition-transform duration-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-5-5.917V5a2 2 0 10-4 0v.083A6 6 0 004 11v3.159c0 .538-.214 1.055-.595 1.436L2 17h5m5 0v1a3 3 0 11-6 0v-1m6 0H6"
                  />
                </svg>
              </div>
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg animate-pulse">
                  {unreadNotificationCount}
                </span>
              )}
            </button>

            {/* Messages Button */}
            <button
              onClick={goToMessenger}
              className="relative text-white hover:text-purple-200 p-1.5 transition-colors duration-200 group"
              aria-label="Messages"
            >
              <div className="bg-white/10 hover:bg-white/20 rounded-full p-2 backdrop-blur-sm transition-all duration-300">
                <svg
                  className="w-5 h-5 group-hover:scale-110 transition-transform duration-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
                </svg>
              </div>
              {unreadMessageCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg animate-pulse">
                  {unreadMessageCount}
                </span>
              )}
            </button>

            {/* Saved Posts Button */}
            <button
              onClick={goToSavedPosts}
              className="relative text-white hover:text-purple-200 p-1.5 transition-colors duration-200 group"
              aria-label="Saved Posts"
            >
              <div className="bg-white/10 hover:bg-white/20 rounded-full p-2 backdrop-blur-sm transition-all duration-300">
                <svg
                  className="w-5 h-5 group-hover:scale-110 transition-transform duration-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                  />
                </svg>
              </div>
              {savedPostsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg animate-pulse">
                  {savedPostsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex md:flex-row md:items-center md:justify-between">
        {/* Logo */}
        <div className="flex justify-center md:justify-start">
          <Link to="/" className="flex items-center group">
            <div className="relative overflow-hidden rounded-lg p-1">
              <div className="absolute inset-0 transition-all duration-300 rounded-lg"></div>
              <img
                src="/logo.png"
                alt="RUETSocialLogo"
                className="h-14 sm:h-16 xs:h-20 w-22 xs:w-30 drop-shadow-md relative z-10 transition-transform group-hover:scale-105 duration-300"
              />
            </div>
          </Link>
        </div>

        {/* Search Bars */}
        <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:space-x-3 md:space-x-4 flex-1 md:mx-4">
          {/* User Search */}
          <div ref={searchRef} className="relative w-full">
            <form onSubmit={handleSearch} className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <div className="flex">
                <input
                  type="search"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full pl-10 p-2.5 text-sm sm:text-base border-0 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-700 shadow-inner bg-white/90 backdrop-blur-sm"
                />
                <select
                  value={departmentFilter}
                  onChange={handleDepartmentFilterChange}
                  className="p-2.5 text-sm sm:text-base border-0 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-700 shadow-inner bg-white/90 backdrop-blur-sm"
                >
                  <option value="">All Departments</option>
                  <option value="CSE">CSE</option>
                  <option value="EEE">EEE</option>
                  <option value="ETE">ETE</option>
                  <option value="ECE">ECE</option>
                  <option value="ME">ME</option>
                  <option value="CE">CE</option>
                  <option value="IPE">IPE</option>
                  <option value="GCE">GCE</option>
                  <option value="MSE">MSE</option>
                  <option value="CFPE">CFPE</option>
                  <option value="BECM">BECM</option>
                  <option value="URP">URP</option>
                  <option value="ARCH">ARCH</option>
                </select>
              </div>
            </form>
            {showResults && (
              <ul className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-xl max-h-60 overflow-y-auto border border-gray-100 animate-fadeIn">
                {isLoading ? (
                  <li className="p-3 text-center text-gray-500">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Searching...</span>
                    </div>
                  </li>
                ) : searchResults.length === 0 ? (
                  <li className="p-3 text-center text-gray-500">No users found</li>
                ) : (
                  searchResults.map((result) => (
                    <li
                      key={result._id}
                      onClick={() => goToProfile(result._id)}
                      className="flex items-center p-3 hover:bg-purple-50 cursor-pointer transition-colors duration-150 border-b border-gray-100 last:border-b-0"
                    >
                      <img
                        src={result.profilePicture || "https://via.placeholder.com/40"}
                        alt={`${result.firstname} ${result.lastname}`}
                        className="w-10 h-10 rounded-full mr-3 object-cover border border-purple-200"
                      />
                      <div>
                        <p className="font-medium text-gray-800">{`${result.firstname} ${result.lastname}`}</p>
                        <p className="text-sm text-gray-500">
                          {result.department && `Department: ${result.department}`}
                          {result.worksAt && ` • Works at ${result.worksAt}`}
                        </p>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>

          {/* Post Search */}
          <div ref={postSearchRef} className="relative w-full">
            <form onSubmit={handlePostSearch} className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v10m2 2v-6m2 6h-6"
                  />
                </svg>
              </div>
              <input
                type="search"
                placeholder="Search posts..."
                value={postSearchQuery}
                onChange={handlePostSearchChange}
                className="w-full pl-10 p-2.5 text-sm sm:text-base border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-700 shadow-inner bg-white/90 backdrop-blur-sm"
              />
            </form>
            {showPostResults && (
              <ul className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-xl max-h-60 overflow-y-auto border border-gray-100 animate-fadeIn">
                {isLoading ? (
                  <li className="p-3 text-center text-gray-500">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Searching...</span>
                    </div>
                  </li>
                ) : postSearchResults.length === 0 ? (
                  <li className="p-3 text-center text-gray-500">No posts found</li>
                ) : (
                  postSearchResults.map((post) => {
                    // Get user info - this assumes your post objects include user info
                    const postUser = post.userId || {}
                    return (
                      <li
                        key={post._id}
                        onClick={() => goToPost(post._id)}
                        className="p-3 hover:bg-purple-50 cursor-pointer transition-colors duration-150 border-b border-gray-100 last:border-b-0"
                      >
                        <p className="font-medium text-gray-800">
                          {post.desc && post.desc.length > 50 ? `${post.desc.substring(0, 50)}...` : post.desc || "No description"}
                        </p>
                        <div className="flex items-center mt-1">
                          {postUser.profilePicture && (
                            <img
                              src={postUser.profilePicture || "/placeholder.svg"}
                              alt={`${postUser.firstname} ${postUser.lastname}`}
                              className="w-6 h-6 rounded-full mr-2 object-cover"
                              onError={(e) => (e.target.src = "https://via.placeholder.com/24")}
                            />
                          )}
                          <p className="text-sm text-gray-500">
                            By {postUser.firstname || "Unknown"} {postUser.lastname || "User"}
                            {postUser.department && (
                              <span className="text-xs text-gray-400 ml-1">({postUser.department})</span>
                            )}
                          </p>
                        </div>
                        {post.tags && post.tags.length > 0 && (
                          <p className="text-xs text-purple-600 mt-1 flex flex-wrap gap-1">
                            {post.tags.slice(0, 3).map((tag, index) => (
                              <span key={index} className="bg-purple-100 px-2 py-0.5 rounded-full">
                                {tag}
                              </span>
                            ))}
                            {post.tags.length > 3 && (
                              <span className="bg-purple-100 px-2 py-0.5 rounded-full">+{post.tags.length - 3} more</span>
                            )}
                          </p>
                        )}
                      </li>
                    )
                  })
                )}
              </ul>
            )}
          </div>
        </div>

        {/* User Actions */}
        <div className="flex items-center justify-center space-x-3 sm:space-x-4">
          {/* Notification Button */}
          <button
            onClick={goToNotifications}
            className="relative text-white hover:text-purple-200 p-1.5 transition-colors duration-200 group"
            aria-label="Notifications"
          >
            <div className="bg-white/10 hover:bg-white/20 rounded-full p-2 backdrop-blur-sm transition-all duration-300">
              <svg
                className="w-5 h-5 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-5-5.917V5a2 2 0 10-4 0v.083A6 6 0 004 11v3.159c0 .538-.214 1.055-.595 1.436L2 17h5m5 0v1a3 3 0 11-6 0v-1m6 0H6"
                />
              </svg>
            </div>
            {unreadNotificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg animate-pulse">
                {unreadNotificationCount}
              </span>
            )}
          </button>

          {/* Messages Button */}
          <button
            onClick={goToMessenger}
            className="relative text-white hover:text-purple-200 p-1.5 transition-colors duration-200 group"
            aria-label="Messages"
          >
            <div className="bg-white/10 hover:bg-white/20 rounded-full p-2 backdrop-blur-sm transition-all duration-300">
              <svg
                className="w-5 h-5 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            {unreadMessageCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg animate-pulse">
                {unreadMessageCount}
              </span>
            )}
          </button>

          {/* User Profile Dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button 
              onClick={toggleUserMenu}
              className="flex items-center p-1 focus:outline-none" 
              aria-label="User menu" 
              aria-haspopup="true"
              aria-expanded={showUserMenu}
            >
              <div className="relative">
                <img
                  src={user.user.profilePicture || "https://via.placeholder.com/40"}
                  alt={`${user.user.firstname} ${user.user.lastname}`}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-white hover:border-purple-200 transition-all duration-200 object-cover shadow-md"
                />
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <svg
                className={`w-4 h-4 ml-1 text-white transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl z-50 animate-fadeIn">
                <div className="py-3 rounded-t-lg bg-gradient-to-r from-purple-600 to-indigo-700 text-white">
                  <div className="px-4 py-2">
                    <div className="flex items-center">
                      <img
                        src={user.user.profilePicture || "https://via.placeholder.com/40"}
                        alt={`${user.user.firstname} ${user.user.lastname}`}
                        className="w-12 h-12 rounded-full border-2 border-white mr-3 object-cover"
                      />
                      <div>
                        <p className="font-semibold truncate">
                          {user.user.firstname} {user.user.lastname}
                        </p>
                        <p className="text-xs text-purple-200 truncate">{user.user.email}</p>
                        {user.user.department && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                            {user.user.department}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="py-1 border-b border-gray-100">
                  <Link
                    to={`/profile/${user.user._id}`}
                    className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <div className="bg-purple-100 p-2 rounded-full mr-3">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <span className="no-underline">My Profile</span>
                  </Link>

                  <button
                    onClick={() => {
                      goToSavedPosts();
                      setShowUserMenu(false);
                    }}
                    className="flex items-center w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                  >
                    <div className="bg-blue-100 p-2 rounded-full mr-3">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                        />
                      </svg>
                    </div>
                    <span>Saved Posts</span>
                    {savedPostsCount > 0 && (
                      <span className="ml-auto bg-purple-100 text-purple-800 text-xs font-medium px-2 py-0.5 rounded-full">
                        {savedPostsCount}
                      </span>
                    )}
                  </button>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      handleLogout();
                      setShowUserMenu(false);
                    }}
                    className="flex items-center w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                  >
                    <div className="bg-red-100 p-2 rounded-full mr-3">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                    </div>
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </nav>
)
}
export default Navbar;
