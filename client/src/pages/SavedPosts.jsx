"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-5 bg-gradient-to-r from-teal-700 to-green-900 text-white rounded-t-lg">
            <h1 className="text-2xl font-bold tracking-tight">Saved Posts</h1>
            <p className="text-gray-200 text-sm mt-1">Posts you've saved for later.</p>
          </div>
        </div>
      </div>

      {/* Content Section */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <p className="text-red-500 text-base font-medium">{error}</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <p className="text-gray-600 text-base">You haven't saved any posts yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {posts.map((post, index) => (
            <div
              key={post._id}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer overflow-hidden"
              onClick={() => navigateToPost(post._id)}
              aria-label={`View post by ${getUsernameById(post.userId)}`}
            >
              {/* Image Section */}
              <div className="relative h-48 w-full overflow-hidden">
                {post.image ? (
                  <img
                    src={post.image}
                    alt={post.desc || "Post"}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    onError={(e) => (e.target.src = "https://via.placeholder.com/800x200?text=No+Image")}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">No Image</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              </div>

              {/* Content Section */}
              <div className="p-5 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">{truncateText(post.desc || "Untitled Post")}</h2>
              </div>

              {/* Footer Section */}
              <div className="px-5 py-3 bg-white border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {usersMap[post.userId]?.profilePicture ? (
                    <img
                      src={usersMap[post.userId].profilePicture}
                      alt={getUsernameById(post.userId)}
                      className="w-8 h-8 rounded-full object-cover"
                      onError={(e) => (e.target.src = "https://via.placeholder.com/40")}
                    />
                  ) : (
                    <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  )}
                  <p className="text-sm font-medium text-teal-700 hover:underline">{getUsernameById(post.userId)}</p>
                </div>
                <p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SavedPosts