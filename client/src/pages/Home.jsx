"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { getTimelinePosts, getAllUsers, getTrendingHashtags, getUser } from "../services/api"
import CreatePost from "../components/CreatePost"
import Post from "../components/Post"
import UserSuggestions from "../components/UserSuggestions"
import LoadingSpinner from "../components/LoadingSpinner"
import Footer from "../components/Footer"

const Home = ({ user }) => {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [suggestedUsers, setSuggestedUsers] = useState([])
  const [trendingHashtags, setTrendingHashtags] = useState([])
  const [sharedByUsers, setSharedByUsers] = useState({})
  const navigate = useNavigate()

  useEffect(() => {
    const fetchTrendingHashtags = async () => {
      try {
        const hashtags = await getTrendingHashtags()
        setTrendingHashtags(hashtags)
      } catch (err) {
        console.error("Error fetching hashtags:", err)
      }
    }

    fetchTrendingHashtags()
  }, [])

  useEffect(() => {
    const fetchTimelinePosts = async () => {
      try {
        setLoading(true)
        const timelinePosts = await getTimelinePosts(user.user._id)
        console.log("Timeline Posts:", timelinePosts)

        // Process shared posts to get user info
        const sharedUsers = {}
        for (const post of timelinePosts) {
          if (post.sharedBy || (post.shares && post.shares.length > 0)) {
            if (post.sharedBy && !sharedUsers[post.sharedBy]) {
              try {
                const userData = await getUser(post.sharedBy)
                sharedUsers[post.sharedBy] = userData
              } catch (error) {
                console.error(`Failed to fetch user ${post.sharedBy}:`, error)
              }
            }
            if (post.shares && post.shares.length > 0) {
              for (const userId of post.shares) {
                if (!sharedUsers[userId]) {
                  try {
                    const userData = await getUser(userId)
                    sharedUsers[userId] = userData
                  } catch (error) {
                    console.error(`Failed to fetch user ${userId}:`, error)
                  }
                }
              }
            }
          }
        }

        setSharedByUsers(sharedUsers)
        setPosts(timelinePosts)
        setLoading(false)
      } catch (err) {
        setError("Failed to load posts. Please try again later.")
        console.error("Error fetching posts:", err)
      } finally {
        setLoading(false)
      }
    }

    const fetchSuggestedUsers = async () => {
      try {
        const users = await getAllUsers()
        console.log("Raw Users from API:", users)

        if (!users || !Array.isArray(users) || users.length === 0) {
          console.log("No users returned or invalid response")
          setSuggestedUsers([])
          return
        }

        const filteredUsers = users.filter((u) => {
          const isNotCurrentUser = u._id !== user.user._id
          const hasSameDepartment = u.department === user.user.department
          console.log(`User ${u._id}: isNotCurrentUser=${isNotCurrentUser}, hasSameDepartment=${hasSameDepartment}`)
          return isNotCurrentUser && hasSameDepartment
        })

        console.log("Filtered Suggested Users:", filteredUsers)
        setSuggestedUsers(filteredUsers)
      } catch (err) {
        console.error("Error fetching suggested users:", err)
        setSuggestedUsers([])
      }
    }

    fetchTimelinePosts()
    fetchSuggestedUsers()
  }, [user])

  const handleNewPost = (newPost) => {
    setPosts([newPost, ...posts])
  }

  const handlePostUpdate = (updatedPost) => {
    setPosts(posts.map((post) => (post._id === updatedPost._id ? updatedPost : post)))
  }

  const handlePostDeleted = (postId) => {
    setPosts(posts.filter((post) => post._id !== postId))
  }

  const getSharedByUser = (post) => {
    if (post.sharedBy && sharedByUsers[post.sharedBy]) {
      return sharedByUsers[post.sharedBy]
    }
    if (post.shares && post.shares.length > 0) {
      for (const userId of post.shares) {
        if (userId !== user.user._id && sharedByUsers[userId]) {
          return sharedByUsers[userId]
        }
      }
      if (post.shares.includes(user.user._id)) {
        return user.user
      }
    }
    return null
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8 flex-grow">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content (Posts) */}
          <div className="lg:w-2/3">
            {/* Create Post Card */}
            <div className="mb-6">
              <CreatePost user={user} onPostCreated={handleNewPost} />
            </div>

            {/* Posts Section */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <LoadingSpinner />
              </div>
            ) : error ? (
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <p className="text-red-500 text-lg font-semibold">{error}</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <p className="text-gray-600 text-lg">
                  No posts to show. Follow some users or create your first post!
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {posts.map((post) => {
                  const sharedBy = getSharedByUser(post)
                  const isShared = !!sharedBy

                  return (
                    <div
                      key={post._id}
                      className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
                    >
                      <Post
                        post={post}
                        currentUser={user.user}
                        onPostUpdate={handlePostUpdate}
                        onPostDelete={handlePostDeleted}
                        isShared={isShared}
                        sharedBy={sharedBy}
                      />
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Sidebar (User Suggestions & Trending Hashtags) */}
          <div className="lg:w-1/3">
            <div className="sticky top-4 space-y-6">
              {/* User Suggestions Card */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <svg
                    className="w-6 h-6 text-teal-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <h3 className="text-xl font-bold text-gray-900">People You May Know</h3>
                </div>
                <UserSuggestions users={suggestedUsers} currentUser={user.user} />
              </div>

              {/* Trending Hashtags Card */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <svg
                    className="w-6 h-6 text-teal-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                    />
                  </svg>
                  <h3 className="text-xl font-bold text-gray-900">Trending Hashtags</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {trendingHashtags.length > 0 ? (
                    trendingHashtags.map((hashtag) => (
                      <button
                        key={hashtag._id}
                        onClick={() => navigate(`/hashtag/${hashtag._id.substring(1)}`)}
                        className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-medium hover:bg-teal-200 transition-colors duration-200 flex items-center gap-1"
                      >
                        <span>#</span>
                        {hashtag._id.substring(1)}
                      </button>
                    ))
                  ) : (
                    <p className="text-gray-600">No trending hashtags yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default Home