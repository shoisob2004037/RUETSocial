"use client"

import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { getSavedPosts, getUser } from "../services/api"
import LoadingSpinner from "../components/LoadingSpinner"

const SavedPosts = ({ user }) => {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [usersMap, setUsersMap] = useState({})
  const navigate = useNavigate()

  useEffect(() => {
    const fetchSavedPosts = async () => {
      try {
        setLoading(true)
        const savedPosts = await getSavedPosts(user.user._id)
        setPosts(savedPosts)

        // Get unique userIds from posts
        const userIds = [...new Set(savedPosts.map((post) => post.userId))]

        // Fetch user data for each unique userId
        const usersData = {}
        for (const userId of userIds) {
          try {
            const userData = await getUser(userId)
            usersData[userId] = userData
          } catch (err) {
            console.error(`Error fetching user data for ID ${userId}:`, err)
          }
        }

        setUsersMap(usersData)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching saved posts:", err)
        setError("Failed to load saved posts. Please try again later.")
        setLoading(false)
      }
    }

    fetchSavedPosts()
  }, [user.user._id])

  const navigateToPost = (postId) => {
    navigate(`/post/${postId}`)
  }

  // Function to get username from userId
  const getUsernameById = (userId) => {
    if (usersMap[userId]) {
      return (
        usersMap[userId].username ||
        `${usersMap[userId].firstname || "User"} ${usersMap[userId].lastname || ""}`.trim()
      )
    }
    return "Unknown User"
  }

  // Function to truncate text to a certain length
  const truncateText = (text, maxLength = 120) => {
    if (!text) return ""
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      {/* Header Section */}
      <div className="mb-6">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-4 border-b border-gray-200 bg-gray-50">
            <h1 className="text-xl font-bold text-gray-900">Saved Posts</h1>
            <p className="text-gray-500 text-sm mt-0.5">Posts you've saved for later.</p>
          </div>
        </div>
      </div>

      {/* Content Section */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <svg className="w-12 h-12 text-red-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No saved posts yet</h3>
          <p className="text-gray-500 text-sm">When you save posts, they'll appear here for easy access.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm font-medium"
          >
            Browse Feed
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post._id}
              className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200 cursor-pointer overflow-hidden"
              onClick={() => navigateToPost(post._id)}
            >
              {/* Image Section - Full width, no padding */}
              {post.image && (
                <div className="w-full bg-gray-100">
                  <img
                    src={post.image}
                    alt={post.desc || "Post"}
                    className="w-full h-auto max-h-[500px] object-contain"
                    onError={(e) => (e.target.src = "https://via.placeholder.com/800x400?text=Image+Not+Available")}
                  />
                </div>
              )}

              {/* Content Section */}
              <div className="p-4">
                {post.desc && (
                  <p className="text-gray-800 text-base leading-relaxed mb-3">
                    {truncateText(post.desc)}
                  </p>
                )}
              </div>

              {/* Footer Section - Author Info */}
              <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {usersMap[post.userId]?.profilePicture ? (
                    <img
                      src={usersMap[post.userId].profilePicture}
                      alt={getUsernameById(post.userId)}
                      className="w-8 h-8 rounded-full object-cover"
                      onError={(e) => (e.target.src = "https://via.placeholder.com/32")}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                  )}
                  <div>
                    <Link
                      to={`/profile/${post.userId}`}
                      className="text-sm font-medium text-gray-900 hover:text-blue-600"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {getUsernameById(post.userId)}
                    </Link>
                    <p className="text-xs text-gray-400">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    // Add unsave functionality here if needed
                  }}
                  className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                >
                  Saved ✓
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SavedPosts