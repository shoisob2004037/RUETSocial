import axios from "axios"

const API_URL = import.meta.env.VITE_API_URL;

const createAxiosInstance = () => {
  const user = JSON.parse(localStorage.getItem("user"))

  return axios.create({
    baseURL: API_URL,
    headers: {
      "Content-Type": "application/json",
      Authorization: user ? `Bearer ${user.token}` : "",
    },
  })
}

export const loginUser = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, { email, password })

    // If user is verified, store in localStorage
    if (response.data && !response.data.requiresVerification) {
      localStorage.setItem("user", JSON.stringify(response.data))
    }

    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}



export const preRegisterUser = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/auth/pre-register`, userData)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const verifyEmail = async (userId, verificationCode) => {
  try {
    const response = await axios.post(`${API_URL}/auth/verify-email`, { userId, verificationCode })

    // Store user data in localStorage after successful verification
    if (response.data && response.data.user && response.data.token) {
      localStorage.setItem(
        "user",
        JSON.stringify({
          user: response.data.user,
          token: response.data.token,
        }),
      )
    }

    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const resendVerificationCode = async (userId) => {
  try {
    const response = await axios.post(`${API_URL}/auth/resend-verification`, { userId })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const registerUser = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, userData)
    if (response.data) {
      localStorage.setItem("user", JSON.stringify(response.data))
    }
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const logoutUser = () => {
  localStorage.removeItem("user")
}

export const getUser = async (userId) => {
  try {
    const api = createAxiosInstance()
    const response = await api.get(`/user/${userId}`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const updateUser = async (userId, userData) => {
  try {
    console.log("Making API request to update user:", userId)
    console.log("Update data:", userData)

    const api = createAxiosInstance()
    const response = await api.put(`/user/${userId}`, userData)

    console.log("API response:", response.data)
    return response.data
  } catch (error) {
    console.error("API error:", error.response?.data || error.message)
    throw error.response?.data || { message: error.message }
  }
}

export const followUser = async (userId, currentUserId) => {
  try {
    const api = createAxiosInstance()
    const response = await api.put(`/user/${userId}/follow`, { currentUserId })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const unfollowUser = async (userId, currentUserId) => {
  try {
    const api = createAxiosInstance()
    const response = await api.put(`/user/${userId}/unfollow`, { currentUserId })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const getAllUsers = async () => {
  try {
    const api = createAxiosInstance()
    const response = await api.get("/user")
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const createPost = async (postData) => {
  try {
    console.log("Making API request to create post:", postData)

    const api = createAxiosInstance()
    const response = await api.post("/post", postData)

    console.log("API response for post creation:", response.data)
    return response.data
  } catch (error) {
    console.error("API error creating post:", error.response?.data || error.message)
    throw error.response?.data || { message: error.message }
  }
}

export const getTimelinePosts = async (userId) => {
  try {
    const api = createAxiosInstance()
    const response = await api.get(`/post/${userId}/timeline`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const likePost = async (postId, userId) => {
  try {
    const api = createAxiosInstance()
    const response = await api.put(`/post/${postId}/like`, { userId })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const addComment = async (postId, userId, content) => {
  try {
    const api = createAxiosInstance()
    const response = await api.post(`/post/${postId}/comment`, { userId, content })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const editComment = async (commentId, userId, content) => {
  try {
    const api = createAxiosInstance()
    const response = await api.put(`/post/comment/${commentId}`, { userId, content })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const deleteComment = async (commentId, userId) => {
  try {
    const api = createAxiosInstance()
    const response = await api.delete(`/post/comment/${commentId}`, { data: { userId } })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const deleteUser = async (userId, currentUserId) => {
  try {
    const api = createAxiosInstance()
    const response = await api.delete(`/user/${userId}`, { data: { currentUserId } })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const getComments = async (postId) => {
  try {
    const api = createAxiosInstance()
    const response = await api.get(`/post/${postId}/comments`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const getUserPosts = async (userId) => {
  try {
    const api = createAxiosInstance()
    const response = await api.get(`/post/user/${userId}`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const updatePost = async (postId, postData) => {
  try {
    console.log("Making API request to update post:", postId)
    console.log("Update data:", postData)

    const api = createAxiosInstance()
    const response = await api.put(`/post/${postId}`, postData)

    console.log("API response for post update:", response.data)
    return response.data
  } catch (error) {
    console.error("API error updating post:", error.response?.data || error.message)
    throw error.response?.data || { message: error.message }
  }
}

export const deletePost = async (postId, userId) => {
  try {
    console.log("Making API request to delete post:", postId)

    const api = createAxiosInstance()
    const response = await api.delete(`/post/${postId}`, { data: { userId } })

    console.log("API response for post deletion:", response.data)
    return response.data
  } catch (error) {
    console.error("API error deleting post:", error.response?.data || error.message)
    throw error.response?.data || { message: error.message }
  }
}

export const getPostLikes = async (postId) => {
  try {
    const api = createAxiosInstance()
    const response = await api.get(`/post/${postId}/likes`)
    console.log("API response for post likes:", response.data)
    return response.data
  } catch (error) {
    console.error("API error fetching post likes:", error.response?.data || error.message)
    throw error.response?.data || { message: error.message }
  }
}

export const savePost = async (postId, userId) => {
  try {
    console.log("Making API request to save post:", postId, "for user:", userId)
    const api = createAxiosInstance()
    const response = await api.post(`/post/${postId}/save`, { userId })
    console.log("API response for saving post:", response.data)
    return response.data
  } catch (error) {
    console.error("API error saving post:", error.response?.data || error.message)
    throw error.response?.data || error.message
  }
}

export const getSavedPosts = async (userId) => {
  try {
    console.log("Fetching saved posts for user:", userId)
    const api = createAxiosInstance()
    const response = await api.get(`/post/saved/${userId}`)
    console.log("Saved posts response:", response.data)
    return response.data
  } catch (error) {
    console.error("API error fetching saved posts:", error.response?.data || error.message)
    return []
  }
}

export const isPostSaved = async (postId, userId) => {
  try {
    const api = createAxiosInstance()
    const response = await api.get(`/post/saved/${postId}/${userId}`)
    return response.data.isSaved
  } catch (error) {
    console.error("API error checking if post is saved:", error.response?.data || error.message)
    return false
  }
}

export const getSavedPostsCount = async (userId) => {
  try {
    console.log("Fetching saved posts count for user:", userId)
    const savedPosts = await getSavedPosts(userId)
    console.log("Saved posts count:", savedPosts.length)
    return savedPosts.length
  } catch (error) {
    console.error("Error fetching saved posts count:", error)
    return 0
  }
}

export const getPostsByHashtag = async (tag) => {
  try {
    const api = createAxiosInstance()
    const cleanTag = encodeURIComponent(tag.trim())
    const response = await api.get(`/post/hashtag/${cleanTag}`)

    console.log("Hashtag search results:", {
      tag,
      results: response.data.length,
    })
    return response.data
  } catch (error) {
    console.error("Hashtag search API error:", {
      tag,
      status: error.response?.status,
      data: error.response?.data,
    })
    throw error.response?.data || error.message
  }
}

export const getTrendingHashtags = async () => {
  try {
    const api = createAxiosInstance()
    const response = await api.get("/post/hashtags/trending")
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const getUserNotifications = async (userId) => {
  try {
    const api = createAxiosInstance()
    const response = await api.get(`/notifications/${userId}`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const markNotificationAsRead = async (notificationId) => {
  try {
    const api = createAxiosInstance()
    const response = await api.put(`/notifications/${notificationId}/read`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const markAllNotificationsAsRead = async (userId) => {
  try {
    const api = createAxiosInstance()
    const response = await api.put(`/notifications/${userId}/read-all`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const deleteNotification = async (notificationId) => {
  try {
    const api = createAxiosInstance()
    const response = await api.delete(`/notifications/${notificationId}`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const getPost = async (postId) => {
  try {
    const api = createAxiosInstance()
    const response = await api.get(`/post/${postId}`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const searchPosts = async (query) => {
  try {
    const api = createAxiosInstance()
    // Changed to send the query in the request body instead of as a URL parameter
    const response = await api.post(`/post/search`, { query })
    return response.data
  } catch (error) {
    console.error("Error in searchPosts API:", error.response?.data || error.message)
    throw error.response?.data || error.message
  }
}

// Add this to your existing api.js file if you need to fetch location data directly
// This is an alternative approach if you don't want to use the LocationAutocomplete component

export const searchLocations = async (query) => {
  try {
    const response = await fetch(
      `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
        query,
      )}&format=json&apiKey=YOUR_GEOAPIFY_API_KEY`,
    )
    const data = await response.json()
    return data.results || []
  } catch (error) {
    console.error("Error searching locations:", error)
    throw error
  }
}

// Chat-related API functions
export const getUserChats = async (userId) => {
  try {
    const api = createAxiosInstance()
    const response = await api.get(`/chat/${userId}`)
    return response.data
  } catch (error) {
    console.error("Error fetching user chats:", error.response?.data || error.message)
    throw error.response?.data || error.message
  }
}

export const getChatHistory = async (userId, recipientId) => {
  try {
    const api = createAxiosInstance()
    const response = await api.get(`/chat/${userId}/${recipientId}`)
    return response.data
  } catch (error) {
    console.error("Error fetching chat history:", error.response?.data || error.message)
    throw error.response?.data || error.message
  }
}

export const sendMessage = async (senderId, recipientId, text) => {
  try {
    const api = createAxiosInstance()
    const response = await api.post("/chat", { senderId, recipientId, text })
    return response.data
  } catch (error) {
    console.error("Error sending message:", error.response?.data || error.message)
    throw error.response?.data || error.message
  }
}

export const markMessagesAsRead = async (chatId, userId) => {
  try {
    const api = createAxiosInstance()
    const response = await api.put(`/chat/${chatId}/${userId}/read`)
    return response.data
  } catch (error) {
    console.error("Error marking messages as read:", error.response?.data || error.message)
    throw error.response?.data || error.message
  }
}

export const deleteChat = async (chatId, userId) => {
  try {
    const api = createAxiosInstance()
    const response = await api.delete(`/chat/${chatId}/${userId}`)
    return response.data
  } catch (error) {
    console.error("Error deleting chat:", error.response?.data || error.message)
    throw error.response?.data || error.message
  }
}

export const editMessage = async (chatId, messageId, userId, text) => {
  try {
    const api = createAxiosInstance()
    const response = await api.put(`/chat/${chatId}/${messageId}/edit`, { userId, text })
    return response.data
  } catch (error) {
    console.error("Error editing message:", error.response?.data || error.message)
    throw error.response?.data || error.message
  }
}

export const deleteMessage = async (chatId, messageId, userId) => {
  try {
    const api = createAxiosInstance()
    const response = await api.delete(`/chat/${chatId}/${messageId}`, { data: { userId } })
    return response.data
  } catch (error) {
    console.error("Error deleting message:", error.response?.data || error.message)
    throw error.response?.data || error.message
  }
}

export default createAxiosInstance