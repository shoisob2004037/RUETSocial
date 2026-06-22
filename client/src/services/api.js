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


export const getFullMediaUrl = (url) => {
  if (!url) return ""
  if (url.startsWith("http")) return url
  return `${import.meta.env.VITE_API_URL}${url}`
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
    const response = await api.post(`/post/search`, { query })
    return response.data
  } catch (error) {
    console.error("Error in searchPosts API:", error.response?.data || error.message)
    throw error.response?.data || error.message
  }
}

// Location search (if needed)
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

// ==================== CHAT API FUNCTIONS ====================

// Get all chats for a user
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

// Get chat history between two users
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

// Send a message (text or media)
export const sendMessage = async (senderId, recipientId, text, mediaData = null, messageType = "text") => {
  try {
    const api = createAxiosInstance()

    const body = { 
      senderId, 
      recipientId, 
      text: text || "",
      messageType
    }

    if (mediaData) {
      body.mediaUrl = mediaData.url
      body.mediaType = mediaData.type
      body.mediaPublicId = mediaData.publicId
      body.mediaThumbnail = mediaData.thumbnail || null
    }

    const response = await api.post("/chat", body)

    // 🔥 normalize message (IMPORTANT)
    const msg = response.data.message || response.data

    return {
      ...response.data,
      message: {
        ...msg,
        mediaUrl: getFullMediaUrl(msg.mediaUrl)
      }
    }

  } catch (error) {
    console.error("Error sending message:", error)
    throw error.response?.data || error.message
  }
}

// Mark messages as read in a chat
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

// Delete an entire chat
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

// Edit a message
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

// Delete a single message
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

// ==================== MEDIA UPLOAD FUNCTIONS ====================

// Upload image for posts or profile
export const uploadImage = async (file, folder = "social_media") => {
  try {
    const formData = new FormData()
    formData.append("image", file)
    formData.append("folder", folder)
    
    const api = createAxiosInstance()
    const response = await api.post("/upload/upload-image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    
    return response.data
  } catch (error) {
    console.error("Error uploading image:", error)
    throw error.response?.data || error.message
  }
}

// Upload chat media (images and videos)
export const uploadChatMedia = async (file, senderId, recipientId) => {
  try {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("senderId", senderId)
    formData.append("recipientId", recipientId)
    formData.append("folder", "chat_media")
    
    const api = createAxiosInstance()
    const response = await api.post("/upload/chat-media", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          console.log(`Upload progress: ${percentCompleted}%`)
        }
      }
    })
    
    return response.data
  } catch (error) {
    console.error("Error uploading chat media:", error)
    throw error.response?.data || error.message
  }
}

// Delete media from Cloudinary
export const deleteMedia = async (publicId, resourceType = "image") => {
  try {
    const api = createAxiosInstance()
    const response = await api.delete(`/upload/delete-media/${publicId}?resourceType=${resourceType}`)
    return response.data
  } catch (error) {
    console.error("Error deleting media:", error)
    throw error.response?.data || error.message
  }
}

// Check upload service health
export const checkUploadHealth = async () => {
  try {
    const api = createAxiosInstance()
    const response = await api.get("/upload/health")
    return response.data
  } catch (error) {
    console.error("Error checking upload health:", error)
    throw error.response?.data || error.message
  }
}

export default createAxiosInstance
// ---------------- Events ----------------
export const getEvents = async (params = {}) => {
  try {
    const api = createAxiosInstance();
    const qs = new URLSearchParams(params).toString();
    const res = await api.get(`/events${qs ? `?${qs}` : ""}`);
    return res.data;
  } catch (e) { console.error("getEvents:", e); throw e; }
};

export const createEvent = async (eventData) => {
  try {
    const api = createAxiosInstance();
    const res = await api.post("/events", eventData);
    return res.data;
  } catch (e) { console.error("createEvent:", e); throw e; }
};

export const toggleAttendEvent = async (eventId, userId) => {
  try {
    const api = createAxiosInstance();
    const res = await api.put(`/events/${eventId}/attend`, { userId });
    return res.data;
  } catch (e) { console.error("toggleAttendEvent:", e); throw e; }
};

export const deleteEvent = async (eventId, currentUserId, currentUserAdminStatus = false) => {
  try {
    const api = createAxiosInstance();
    const res = await api.delete(`/events/${eventId}`, {
      data: { currentUserId, currentUserAdminStatus },
    });
    return res.data;
  } catch (e) { console.error("deleteEvent:", e); throw e; }
};

// ---------------- Jobs ----------------
export const getJobs = async (params = {}) => {
  const api = createAxiosInstance();
  const qs = new URLSearchParams(params).toString();
  const res = await api.get(`/jobs${qs ? `?${qs}` : ""}`);
  return res.data;
};
export const createJob = async (data) => {
  const api = createAxiosInstance();
  const res = await api.post("/jobs", data);
  return res.data;
};
export const applyJob = async (id, userId, name) => {
  const api = createAxiosInstance();
  const res = await api.put(`/jobs/${id}/apply`, { userId, name });
  return res.data;
};
export const toggleSaveJob = async (id, userId) => {
  const api = createAxiosInstance();
  const res = await api.put(`/jobs/${id}/save`, { userId });
  return res.data;
};
export const deleteJob = async (id, currentUserId, currentUserAdminStatus = false) => {
  const api = createAxiosInstance();
  const res = await api.delete(`/jobs/${id}`, { data: { currentUserId, currentUserAdminStatus } });
  return res.data;
};

// ---------------- Polls ----------------
export const getPolls = async (params = {}) => {
  const api = createAxiosInstance();
  const qs = new URLSearchParams(params).toString();
  const res = await api.get(`/polls${qs ? `?${qs}` : ""}`);
  return res.data;
};
export const createPoll = async (data) => {
  const api = createAxiosInstance();
  const res = await api.post("/polls", data);
  return res.data;
};
export const votePoll = async (id, userId, optionIndex) => {
  const api = createAxiosInstance();
  const res = await api.put(`/polls/${id}/vote`, { userId, optionIndex });
  return res.data;
};
export const deletePoll = async (id, currentUserId, currentUserAdminStatus = false) => {
  const api = createAxiosInstance();
  const res = await api.delete(`/polls/${id}`, { data: { currentUserId, currentUserAdminStatus } });
  return res.data;
};

// ---------------- Communities ----------------
export const getUserCommunities = async (userId) => {
  const api = createAxiosInstance();
  const res = await api.get(`/communities/user/${userId}`);
  return res.data;
};
export const getCommunity = async (id) => {
  const api = createAxiosInstance();
  const res = await api.get(`/communities/${id}`);
  return res.data;
};
export const createCommunity = async (payload) => {
  const api = createAxiosInstance();
  const res = await api.post("/communities", payload);
  return res.data;
};
export const addCommunityMember = async (id, currentUserId, targetUserId) => {
  const api = createAxiosInstance();
  const res = await api.post(`/communities/${id}/members`, {
    currentUserId,
    targetUserId,
  });
  return res.data;
};
export const leaveCommunity = async (id, userId) => {
  const api = createAxiosInstance();
  const res = await api.post(`/communities/${id}/leave`, { userId });
  return res.data;
};
export const sendCommunityMessage = async (id, payload) => {
  const api = createAxiosInstance();
  const res = await api.post(`/communities/${id}/messages`, payload);
  return res.data;
};
export const getMutualFollowers = async (userId) => {
  const api = createAxiosInstance();
  const res = await api.get(`/communities/mutual/${userId}`);
  return res.data;
};
export const getCommunityMembers = async (id) => {
  const api = createAxiosInstance();
  const res = await api.get(`/communities/${id}/members`);
  return res.data;
};
export const removeCommunityMember = async (id, currentUserId, targetUserId) => {
  const api = createAxiosInstance();
  const res = await api.delete(`/communities/${id}/members`, {
    data: { currentUserId, targetUserId },
  });
  return res.data;
};
