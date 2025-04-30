"use client"

import { useState, useEffect } from "react"
import { Link, useParams, useNavigate } from "react-router-dom"
import { getUser, getUserPosts, followUser, unfollowUser, getSavedPosts, deleteUser } from "../services/api"
import Post from "../components/Post"
import LoadingSpinner from "../components/LoadingSpinner"
import EditProfile from "../components/EditProfile"
import CreatePost from "../components/CreatePost"

const Profile = ({ user }) => {
  const { id } = useParams()
  const [profileUser, setProfileUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [savedPosts, setSavedPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [savedPostsLoading, setSavedPostsLoading] = useState(false)
  const [savedPostsError, setSavedPostsError] = useState(null)
  const [followLoading, setFollowLoading] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [activeTab, setActiveTab] = useState("posts")
  const [showEditModal, setShowEditModal] = useState(false)
  const [followersData, setFollowersData] = useState([])
  const [followingData, setFollowingData] = useState([])
  const [profilePictures, setProfilePictures] = useState([])
  const [coverPictures, setCoverPictures] = useState([])
  const [sharedByUsers, setSharedByUsers] = useState({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const navigate = useNavigate()

  // Check if this is the user's own profile
  const isOwnProfile = profileUser && profileUser._id === user.user._id

  // Check if users follow each other (for post visibility)
  const mutualFollow =
    profileUser && profileUser.followers.includes(user.user._id) && profileUser.following.includes(user.user._id)

  // Determine if posts should be visible
  const canViewPosts = isOwnProfile || mutualFollow

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true)
        const userData = await getUser(id)
        setProfileUser(userData)

        setIsFollowing(userData.followers.includes(user.user._id))

        // Only fetch posts if it's the user's own profile or there's mutual following
        if (
          userData._id === user.user._id ||
          (userData.followers.includes(user.user._id) && userData.following.includes(user.user._id))
        ) {
          const userPosts = await getUserPosts(id)

          const sharedUsers = {}
          for (const post of userPosts) {
            if (post.sharedBy || (post.shares && post.shares.length > 0)) {
              if (post.sharedBy && !sharedUsers[post.sharedBy]) {
                try {
                  const userData = await getUser(post.sharedBy)
                  sharedUsers[post.sharedBy] = userData
                } catch (error) {
                  console.warn(`Failed to fetch sharedBy user ${post.sharedBy}, skipping...`)
                }
              }
              if (post.shares && post.shares.length > 0) {
                for (const userId of post.shares) {
                  if (!sharedUsers[userId]) {
                    try {
                      const userData = await getUser(userId)
                      sharedUsers[userId] = userData
                    } catch (error) {
                      console.warn(`Failed to fetch shares user ${userId}, skipping...`)
                    }
                  }
                }
              }
            }
          }
          setSharedByUsers(sharedUsers)

          const virtualPosts = []
          if (userData.profilePicture) {
            virtualPosts.push({
              _id: `virtual-profile-${userData._id}`,
              user: {
                _id: userData._id,
                firstname: userData.firstname,
                lastname: userData.lastname,
                profilePicture: userData.profilePicture,
              },
              image: userData.profilePicture,
              isProfilePicture: true,
              createdAt: userData.createdAt,
              virtual: true,
              likes: [],
              comments: [],
            })
          }
          if (userData.coverPicture) {
            virtualPosts.push({
              _id: `virtual-cover-${userData._id}`,
              user: {
                _id: userData._id,
                firstname: userData.firstname,
                lastname: userData.lastname,
                profilePicture: userData.profilePicture,
              },
              image: userData.coverPicture,
              isCoverPicture: true,
              createdAt: userData.createdAt,
              virtual: true,
              likes: [],
              comments: [],
            })
          }
          setPosts([...virtualPosts, ...userPosts])
          setProfilePictures(userPosts.filter((post) => post.isProfilePicture))
          setCoverPictures(userPosts.filter((post) => post.isCoverPicture))
        } else {
          // If users don't follow each other, set empty posts
          setPosts([])
          setProfilePictures([])
          setCoverPictures([])
        }

        const followersPromises = userData.followers.map(async (followerId) => {
          try {
            return await getUser(followerId)
          } catch (error) {
            console.warn(`Follower with ID ${followerId} not found, skipping...`)
            return null
          }
        })
        const followingPromises = userData.following.map(async (followingId) => {
          try {
            return await getUser(followingId)
          } catch (error) {
            console.warn(`Following with ID ${followingId} not found, skipping...`)
            return null
          }
        })

        const followers = (await Promise.all(followersPromises)).filter((f) => f !== null)
        const following = (await Promise.all(followingPromises)).filter((f) => f !== null)
        setFollowersData(followers)
        setFollowingData(following)
      } catch (err) {
        console.error("Failed to load profile data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchProfileData()
  }, [id, user.user._id])

  // Add this debugging useEffect
  useEffect(() => {
    // Debug log to check posts structure
    if (posts.length > 0) {
      console.log("Posts data structure:", posts[0])
      console.log("Total posts:", posts.length)
      console.log("Posts with images:", posts.filter((post) => post.image).length)
      console.log(
        "Posts by this user:",
        posts.filter((post) => post.userId === profileUser?._id || post.user?._id === profileUser?._id).length,
      )
    }
  }, [posts, profileUser])

  // Fetch saved posts when the "saved" tab is active and it's the user's own profile
  useEffect(() => {
    if (activeTab === "saved" && isOwnProfile) {
      const fetchSavedPosts = async () => {
        try {
          setSavedPostsLoading(true)
          setSavedPostsError(null)
          const savedPostsData = await getSavedPosts(user.user._id)
          setSavedPosts(savedPostsData)
        } catch (err) {
          console.error("Error fetching saved posts:", err)
          setSavedPostsError("Failed to load saved posts. Please try again later.")
        } finally {
          setSavedPostsLoading(false)
        }
      }

      fetchSavedPosts()
    }
  }, [activeTab, user.user._id, isOwnProfile])

  const handleFollow = async () => {
    try {
      setFollowLoading(true)
      if (isFollowing) {
        await unfollowUser(profileUser._id, user.user._id)
        setProfileUser((prev) => ({
          ...prev,
          followers: prev.followers.filter((f) => f !== user.user._id),
        }))
        setFollowersData(followersData.filter((f) => f._id !== user.user._id))
        setIsFollowing(false)
      } else {
        await followUser(profileUser._id, user.user._id)
        const currentUserData = await getUser(user.user._id)
        setProfileUser((prev) => ({
          ...prev,
          followers: [...prev.followers, user.user._id],
        }))
        setFollowersData([...followersData, currentUserData])
        setIsFollowing(true)

        // If both users now follow each other, fetch posts
        if (profileUser.following.includes(user.user._id)) {
          const userPosts = await getUserPosts(id)
          const virtualPosts = []
          if (profileUser.profilePicture) {
            virtualPosts.push({
              _id: `virtual-profile-${profileUser._id}`,
              user: {
                _id: profileUser._id,
                firstname: profileUser.firstname,
                lastname: profileUser.lastname,
                profilePicture: profileUser.profilePicture,
              },
              image: profileUser.profilePicture,
              isProfilePicture: true,
              createdAt: profileUser.createdAt,
              virtual: true,
              likes: [],
              comments: [],
            })
          }
          if (profileUser.coverPicture) {
            virtualPosts.push({
              _id: `virtual-cover-${profileUser._id}`,
              user: {
                _id: profileUser._id,
                firstname: profileUser.firstname,
                lastname: profileUser.lastname,
                profilePicture: profileUser.profilePicture,
              },
              image: profileUser.coverPicture,
              isCoverPicture: true,
              createdAt: profileUser.createdAt,
              virtual: true,
              likes: [],
              comments: [],
            })
          }
          setPosts([...virtualPosts, ...userPosts])
          setProfilePictures(userPosts.filter((post) => post.isProfilePicture))
          setCoverPictures(userPosts.filter((post) => post.isCoverPicture))
        }
      }
    } catch (err) {
      console.error("Failed to follow/unfollow user:", err)
    } finally {
      setFollowLoading(false)
    }
  }

  const handleUnfollow = async (followingId) => {
    try {
      await unfollowUser(followingId, user.user._id)
      setFollowingData(followingData.filter((f) => f._id !== followingId))
      if (followingId === profileUser._id) {
        setIsFollowing(false)
        setFollowersData(followersData.filter((f) => f._id !== user.user._id))
        setProfileUser((prev) => ({
          ...prev,
          followers: prev.followers.filter((f) => f !== user.user._id),
        }))
      }
    } catch (err) {
      console.error("Failed to unfollow user:", err)
    }
  }

  const canMessage = () => {
    const userFollowsProfile = profileUser.followers.includes(user.user._id)
    const profileFollowsUser = profileUser.following.includes(user.user._id)
    return userFollowsProfile && profileFollowsUser
  }

  const handleMessage = () => {
    if (canMessage()) {
      navigate(`/message/${profileUser._id}`)
    } else {
      alert("You can only message users when you follow each other.")
    }
  }

  const handleProfileUpdate = (updatedUser) => {
    setProfileUser(updatedUser)
    if (updatedUser._id === user.user._id) {
      const currentUserData = JSON.parse(localStorage.getItem("user"))
      if (currentUserData) {
        currentUserData.user = updatedUser
        localStorage.setItem("user", JSON.stringify(currentUserData))
      }
    }
    setPosts((prevPosts) => {
      const realPosts = prevPosts.filter((post) => !post.virtual)
      const newVirtualPosts = []
      if (updatedUser.profilePicture) {
        newVirtualPosts.push({
          _id: `virtual-profile-${updatedUser._id}`,
          user: {
            _id: updatedUser._id,
            firstname: updatedUser.firstname,
            lastname: updatedUser.lastname,
            profilePicture: updatedUser.profilePicture,
          },
          image: updatedUser.profilePicture,
          isProfilePicture: true,
          createdAt: updatedUser.createdAt,
          virtual: true,
        })
      }
      if (updatedUser.coverPicture) {
        newVirtualPosts.push({
          _id: `virtual-cover-${updatedUser._id}`,
          user: {
            _id: updatedUser._id,
            firstname: updatedUser.firstname,
            lastname: updatedUser.lastname,
            profilePicture: updatedUser.profilePicture,
          },
          image: updatedUser.coverPicture,
          isCoverPicture: true,
          createdAt: updatedUser.createdAt,
          virtual: true,
        })
      }
      return [...newVirtualPosts, ...realPosts]
    })
  }

  const handleNewPost = (newPost) => {
    setPosts((prev) => [newPost, ...prev])
    if (newPost.isProfilePicture) setProfilePictures((prev) => [newPost, ...prev])
    if (newPost.isCoverPicture) setCoverPictures((prev) => [newPost, ...prev])
  }

  const handleDeleteAccount = async () => {
    try {
      await deleteUser(profileUser._id, user.user._id)
      localStorage.removeItem("user")
      alert("Your account has been deleted successfully.")
      setTimeout(() => navigate("/login"), 100) // Slight delay to ensure alert is visible
    } catch (err) {
      console.error("Failed to delete account:", err)
      alert("Failed to delete account. Please try again.")
    }
  }
  const handlePostUpdate = (updatedPost) => {
    // Update regular posts
    setPosts(posts.map((post) => (post._id === updatedPost._id ? updatedPost : post)))
    if (updatedPost.isProfilePicture)
      setProfilePictures(profilePictures.map((post) => (post._id === updatedPost._id ? updatedPost : post)))
    if (updatedPost.isCoverPicture)
      setCoverPictures(coverPictures.map((post) => (post._id === updatedPost._id ? updatedPost : post)))
    // Update saved posts
    setSavedPosts(savedPosts.map((post) => (post._id === updatedPost._id ? updatedPost : post)))
  }

  const handlePostDelete = (postId) => {
    // Update regular posts
    setPosts(posts.filter((post) => post._id !== postId))
    setProfilePictures(profilePictures.filter((post) => post._id !== postId))
    setCoverPictures(coverPictures.filter((post) => post._id !== postId))
    // Update saved posts
    setSavedPosts(savedPosts.filter((post) => post._id !== postId))
  }

  const getPostDescription = (post) => {
    const username = `${profileUser.firstname} ${profileUser.lastname}`
    if (post.isProfilePicture) return `${username}'s current profile picture`
    if (post.isCoverPicture) return `${username}'s current cover photo`
    return post.description || ""
  }

  const getSharedByUser = (post) => {
    if (post.sharedBy && sharedByUsers[post.sharedBy]) return sharedByUsers[post.sharedBy]
    if (post.shares && post.shares.includes(id) && post.userId !== id) return profileUser
    return null
  }

  // Get department badge color based on department name
  const getDepartmentColor = (department) => {
    const colors = {
      CSE: "bg-blue-100 text-blue-800",
      EEE: "bg-yellow-100 text-yellow-800",
      ETE: "bg-green-100 text-green-800",
      ECE: "bg-purple-100 text-purple-800",
      ME: "bg-red-100 text-red-800",
      CE: "bg-indigo-100 text-indigo-800",
      IPE: "bg-pink-100 text-pink-800",
      GCE: "bg-teal-100 text-teal-800",
      MSE: "bg-orange-100 text-orange-800",
      CFPE: "bg-cyan-100 text-cyan-800",
      BECM: "bg-lime-100 text-lime-800",
      URP: "bg-amber-100 text-amber-800",
      ARCH: "bg-violet-100 text-violet-800",
    }
    return colors[department] || "bg-gray-100 text-gray-800"
  }

  if (loading) return <LoadingSpinner />

  if (!profileUser) {
    return (
      <div className="bg-white shadow-md rounded-lg p-5 text-center">
        <h3 className="text-xl font-semibold text-gray-800">User not found</h3>
        <p className="text-gray-600">The user you're looking for doesn't exist or has been removed.</p>
      </div>
    )
  }

  // Define tabs based on whether it's the user's own profile
  const profileTabs = isOwnProfile ? ["posts", "about", "saved", "photos"] : ["posts", "about", "photos"]

  return (
    <>
      {/* Hero Section with Cover Photo and Profile Info */}
      <div className="mb-6 overflow-hidden">
        <div className="relative">
          {/* Cover Photo */}
          <div
            className="h-64 sm:h-80 w-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-xl overflow-hidden"
            style={{
              backgroundImage: profileUser.coverPicture ? `url(${profileUser.coverPicture})` : "none",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
          </div>

          {/* Profile Info Card */}
          <div className="relative mx-4 -mt-24 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-10">
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                {/* Profile Picture */}
                <div className="relative">
                  <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white">
                    <img
                      src={profileUser.profilePicture || "https://via.placeholder.com/150" || "/placeholder.svg"}
                      alt={`${profileUser.firstname} ${profileUser.lastname}`}
                      className="w-full h-full object-cover"
                      onError={(e) => (e.target.src = "https://via.placeholder.com/150")}
                    />
                  </div>
                  {/* Online Status Indicator */}
                  <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
                </div>

                {/* User Info */}
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                        {profileUser.firstname} {profileUser.lastname}
                      </h1>
                      <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
                        {/* Department Badge */}
                        {profileUser.department && (
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${getDepartmentColor(
                              profileUser.department,
                            )}`}
                          >
                            {profileUser.department}
                          </span>
                        )}
                        {/* Roll Number Badge */}
                        {profileUser.roll && (
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                            Roll: {profileUser.roll}
                          </span>
                        )}
                        {/* University Badge */}
                        {profileUser.university && (
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
                            {profileUser.university}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mt-2">{profileUser.about || "No bio provided"}</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 sm:mt-0 flex flex-wrap justify-center sm:justify-end gap-2">
                      {!isOwnProfile && (
                        <>
                          <button
                            onClick={handleFollow}
                            disabled={followLoading}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                              isFollowing
                                ? "bg-white text-blue-600 border border-blue-600 hover:bg-blue-50"
                                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg"
                            } ${followLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            {followLoading ? (
                              <span className="flex items-center">
                                <svg
                                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                                Processing...
                              </span>
                            ) : isFollowing ? (
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  ></path>
                                </svg>
                                Following
                              </span>
                            ) : (
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 4v16m8-8H4"
                                  ></path>
                                </svg>
                                Follow
                              </span>
                            )}
                          </button>
                          <button
                            onClick={handleMessage}
                            disabled={!canMessage()}
                            title={!canMessage() ? "You can only message users when you follow each other" : ""}
                            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-300 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                              />
                            </svg>
                            Message
                          </button>
                        </>
                      )}
                      {isOwnProfile && (
                        <button
                          onClick={() => setShowEditModal(true)}
                          className="px-4 py-2 bg-white border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-all duration-300 flex items-center"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          Edit Profile
                        </button>
                      )}
                      {isOwnProfile && (
  <>
    <button
      onClick={() => setShowDeleteConfirm(true)}
      className="px-4 py-2 bg-white border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-all duration-300 flex items-center"
    >
      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4M9 7v12m6-12v12"
        />
      </svg>
      Delete Account
    </button>
  </>
)}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex justify-center sm:justify-start gap-6 mt-4">
                    <div className="text-center">
                      <span className="block text-2xl font-bold text-gray-900">{followersData.length}</span>
                      <span className="text-sm text-gray-600">Followers</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-2xl font-bold text-gray-900">{followingData.length}</span>
                      <span className="text-sm text-gray-600">Following</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-2xl font-bold text-gray-900">
                        {posts.filter((p) => !p.virtual).length}
                      </span>
                      <span className="text-sm text-gray-600">Posts</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Tabs */}
            <div className="border-t border-gray-100">
              <div className="flex overflow-x-auto scrollbar-hide">
                {profileTabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 min-w-[100px] py-4 px-4 text-center font-medium transition-all duration-300 ${
                      activeTab === tab
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          {/* About Card */}
          <div className="bg-white shadow-md rounded-xl p-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              About
            </h3>
            <ul className="space-y-4">
              {/* Department */}
              {profileUser.department && (
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Department</p>
                    <p className="font-medium text-gray-900">{profileUser.department}</p>
                  </div>
                </li>
              )}

              {/* Roll Number */}
              {profileUser.roll && (
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Roll Number</p>
                    <p className="font-medium text-gray-900">{profileUser.roll}</p>
                  </div>
                </li>
              )}

              {/* Bio */}
              <li className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bio</p>
                  <p className="font-medium text-gray-900">{profileUser.about || "No bio provided"}</p>
                </div>
              </li>

              {/* Location */}
              {profileUser.livesin && (
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium text-gray-900">{profileUser.livesin}</p>
                  </div>
                </li>
              )}

              {/* Work */}
              {profileUser.worksAt && (
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Work</p>
                    <p className="font-medium text-gray-900">{profileUser.worksAt}</p>
                  </div>
                </li>
              )}

              {/* Education */}
              {profileUser.university && (
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Education</p>
                    <p className="font-medium text-gray-900">
                      {profileUser.university} {profileUser.degree && `(${profileUser.degree})`}
                    </p>
                  </div>
                </li>
              )}

              {/* Relationship */}
              {profileUser.relationship && (
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Relationship</p>
                    <p className="font-medium text-gray-900">{profileUser.relationship}</p>
                  </div>
                </li>
              )}

              {/* Joined Date */}
              <li className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Joined</p>
                  <p className="font-medium text-gray-900">
                    {new Date(profileUser.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </li>
            </ul>
          </div>

{/* Photos Card */}
<div className="bg-white shadow-md rounded-xl p-6 border border-gray-100">
  <div className="flex justify-between items-center mb-4">
    <h3 className="text-xl font-bold text-gray-900 flex items-center">
      <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      Photos
    </h3>
    <button
      onClick={() => setActiveTab("photos")}
      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
    >
      View All
    </button>
  </div>

  {/* Display profile picture, cover photo, and latest regular post */}
  {(!profileUser.profilePicture && !profileUser.coverPicture && 
    posts.filter(
      (post) =>
        post.image &&
        !post.virtual &&
        !post.isProfilePicture &&
        !post.isCoverPicture &&
        (post.userId === profileUser._id || post.user?._id === profileUser._id)
    ).length === 0) ? (
    <div className="text-center py-8 bg-gray-50 rounded-lg">
      <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      <p className="mt-2 text-gray-600">No photos available</p>
    </div>
  ) : (
    <div className="grid grid-cols-3 gap-2">
      {/* Profile Picture */}
      {profileUser.profilePicture && (
        <div className="relative overflow-hidden rounded-lg">
          <div style={{ width: '100%', paddingTop: '100%', position: 'relative', background: '#f0f0f0' }}>
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f0f0f0',
                zIndex: 10,
              }}
            >
              <svg className="w-8 h-8 text-gray-500 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <img
              src={profileUser.profilePicture}
              alt="Current profile picture"
              data-src={profileUser.profilePicture}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                zIndex: 5,
              }}
              loading="eager"
              onError={(e) => {
                console.warn(`Profile picture failed to load: ${profileUser.profilePicture}`);
                e.target.src = "https://via.placeholder.com/100?text=Profile";
                e.target.previousSibling.style.display = 'none';
              }}
              onLoad={(e) => {
                console.log(`Profile picture loaded: ${profileUser.profilePicture}`);
                setTimeout(() => {
                  e.target.previousSibling.style.display = 'none';
                }, 100); // Brief delay to prevent flash
              }}
            />
          </div>
        </div>
      )}

      {/* Cover Photo */}
      {profileUser.coverPicture && (
        <div className="relative overflow-hidden rounded-lg">
          <div style={{ width: '100%', paddingTop: '100%', position: 'relative', background: '#f0f0f0' }}>
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f0f0f0',
                zIndex: 10,
              }}
            >
              <svg className="w-8 h-8 text-gray-500 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <img
              src={profileUser.coverPicture}
              alt="Current cover photo"
              data-src={profileUser.coverPicture}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                zIndex: 5,
              }}
              loading="eager"
              onError={(e) => {
                console.warn(`Cover photo failed to load: ${profileUser.coverPicture}`);
                e.target.src = "https://via.placeholder.com/100?text=Cover";
                e.target.previousSibling.style.display = 'none';
              }}
              onLoad={(e) => {
                console.log(`Cover photo loaded: ${profileUser.coverPicture}`);
                setTimeout(() => {
                  e.target.previousSibling.style.display = 'none';
                }, 100);
              }}
            />
          </div>
        </div>
      )}

      {/* Latest Regular Post Photo */}
      {posts
        .filter(
          (post) =>
            post.image &&
            !post.virtual &&
            !post.isProfilePicture &&
            !post.isCoverPicture &&
            (post.userId === profileUser._id || post.user?._id === profileUser._id)
        )
        .slice(0, 1)
        .map((post) => (
          <Link
            key={post._id}
            to={`/post/${post._id}`}
            className="relative overflow-hidden rounded-lg block"
          >
            <div style={{ width: '100%', paddingTop: '100%', position: 'relative', background: '#f0f0f0' }}>
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#f0f0f0',
                  zIndex: 10,
                }}
              >
                <svg className="w-8 h-8 text-gray-500 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
              <img
                src={post.image}
                alt={`${profileUser.firstname}'s photo`}
                data-src={post.image}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  zIndex: 5,
                }}
                loading="eager"
                onError={(e) => {
                  console.warn(`Post photo failed to load: ${post.image}, post ID: ${post._id}`);
                  e.target.src = "https://via.placeholder.com/100?text=Photo";
                  e.target.previousSibling.style.display = 'none';
                }}
                onLoad={(e) => {
                  console.log(`Post photo loaded: ${post.image}, post ID: ${post._id}`);
                  setTimeout(() => {
                    e.target.previousSibling.style.display = 'none';
                  }, 100);
                }}
              />
            </div>
          </Link>
        ))}
    </div>
  )}
  </div>
          {/* Friends Card */}
          <div className="bg-white shadow-md rounded-xl p-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              Friends
            </h3>

            {/* Followers Section */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold text-gray-800">Followers ({followersData.length})</h4>
                {followersData.length > 5 && (
                  <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">See All</button>
                )}
              </div>

              {followersData.length === 0 ? (
                <p className="text-gray-600 text-center py-4 bg-gray-50 rounded-lg">No followers yet</p>
              ) : (
                <div className="space-y-3">
                  {followersData.slice(0, 5).map((follower) => (
                    <div
                      key={follower._id}
                      className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                    >
                      <img
                        src={follower.profilePicture || "https://via.placeholder.com/40"}
                        alt={`${follower.firstname} ${follower.lastname}`}
                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                      />
                      <div className="ml-3 flex-1">
                        <p className="font-medium text-gray-900">
                          {follower.firstname} {follower.lastname}
                        </p>
                        {follower.department && <p className="text-xs text-gray-500">{follower.department}</p>}
                      </div>
                      <Link
                        to={`/profile/${follower._id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Following Section */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold text-gray-800">Following ({followingData.length})</h4>
                {followingData.length > 5 && (
                  <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">See All</button>
                )}
              </div>

              {followingData.length === 0 ? (
                <p className="text-gray-600 text-center py-4 bg-gray-50 rounded-lg">Not following anyone yet</p>
              ) : (
                <div className="space-y-3">
                  {followingData.slice(0, 5).map((following) => (
                    <div
                      key={following._id}
                      className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                    >
                      <img
                        src={following.profilePicture || "https://via.placeholder.com/40"}
                        alt={`${following.firstname} ${following.lastname}`}
                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                      />
                      <div className="ml-3 flex-1">
                        <p className="font-medium text-gray-900">
                          {following.firstname} {following.lastname}
                        </p>
                        {following.department && <p className="text-xs text-gray-500">{following.department}</p>}
                      </div>
                      <button
                        onClick={() => handleUnfollow(following._id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Unfollow
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-8">
          {activeTab === "posts" && (
            <div className="space-y-6">
              {isOwnProfile && (
                <div className="bg-white shadow-md rounded-xl p-6 border border-gray-100">
                  <CreatePost user={user} onPostCreated={handleNewPost} />
                </div>
              )}

              {!canViewPosts ? (
                <div className="bg-white shadow-md rounded-xl p-8 border border-gray-100 text-center">
                  <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Posts are private</h3>
                  <p className="text-gray-600 mb-6">
                    You can only see {profileUser.firstname}'s posts when you follow each other.
                  </p>
                  {!isFollowing && (
                    <button
                      onClick={handleFollow}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      Follow {profileUser.firstname}
                    </button>
                  )}
                </div>
              ) : posts.length === 0 ? (
                <div className="bg-white shadow-md rounded-xl p-8 border border-gray-100 text-center">
                  <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No posts yet</h3>
                  <p className="text-gray-600">
                    {isOwnProfile
                      ? "Share your first post with your friends!"
                      : `${profileUser.firstname} hasn't posted anything yet.`}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Profile Picture Updates */}
                  {posts.filter((post) => post.isProfilePicture).length > 0 && (
                    <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-100">
                      <div className="px-6 py-4 border-b border-gray-100">
                        <h5 className="text-lg font-bold text-gray-900">Profile Picture Updates</h5>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {posts
                          .filter((post) => post.isProfilePicture)
                          .map((post) => (
                            <Post
                              key={post._id}
                              post={post}
                              currentUser={user.user}
                              customDescription={getPostDescription(post)}
                              onPostUpdate={handlePostUpdate}
                              onPostDelete={post.virtual ? null : handlePostDelete}
                              isShared={!!getSharedByUser(post)}
                              sharedBy={getSharedByUser(post)}
                            />
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Cover Photo Updates */}
                  {posts.filter((post) => post.isCoverPicture).length > 0 && (
                    <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-100">
                      <div className="px-6 py-4 border-b border-gray-100">
                        <h5 className="text-lg font-bold text-gray-900">Cover Photo Updates</h5>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {posts
                          .filter((post) => post.isCoverPicture)
                          .map((post) => (
                            <Post
                              key={post._id}
                              post={post}
                              currentUser={user.user}
                              customDescription={getPostDescription(post)}
                              onPostUpdate={handlePostUpdate}
                              onPostDelete={post.virtual ? null : handlePostDelete}
                              isShared={!!getSharedByUser(post)}
                              sharedBy={getSharedByUser(post)}
                            />
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Shared Posts */}
                  {posts.filter(
                    (post) =>
                      !post.isProfilePicture &&
                      !post.isCoverPicture &&
                      (post.shares?.includes(id) || post.sharedBy === id),
                  ).length > 0 && (
                    <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-100">
                      <div className="px-6 py-4 border-b border-gray-100">
                        <h5 className="text-lg font-bold text-gray-900">Shared Posts</h5>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {posts
                          .filter(
                            (post) =>
                              !post.isProfilePicture &&
                              !post.isCoverPicture &&
                              (post.shares?.includes(id) || post.sharedBy === id),
                          )
                          .map((post) => (
                            <Post
                              key={post._id}
                              post={post}
                              currentUser={user.user}
                              onPostUpdate={handlePostUpdate}
                              onPostDelete={handlePostDelete}
                              isShared={!!getSharedByUser(post)}
                              sharedBy={getSharedByUser(post)}
                            />
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Other Posts */}
                  <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-100">
                    <div className="px-6 py-4 border-b border-gray-100">
                      <h5 className="text-lg font-bold text-gray-900">Other Posts</h5>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {posts
                        .filter(
                          (post) =>
                            !post.isProfilePicture &&
                            !post.isCoverPicture &&
                            !(post.shares?.includes(id) || post.sharedBy === id),
                        )
                        .map((post) => (
                          <Post
                            key={post._id}
                            post={post}
                            currentUser={user.user}
                            customDescription={getPostDescription(post)}
                            onPostUpdate={handlePostUpdate}
                            onPostDelete={handlePostDelete}
                            isShared={!!getSharedByUser(post)}
                            sharedBy={getSharedByUser(post)}
                          />
                        ))}
                      {posts.filter(
                        (post) =>
                          !post.isProfilePicture &&
                          !post.isCoverPicture &&
                          !(post.shares?.includes(id) || post.sharedBy === id),
                      ).length === 0 && (
                        <div className="p-6 text-center">
                          <p className="text-gray-600">No regular posts yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "about" && (
            <div className="bg-white shadow-md rounded-xl p-6 border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">About {profileUser.firstname}</h3>

              <div className="space-y-8">
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    Overview
                  </h4>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                    {profileUser.about || "No information provided"}
                  </p>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253"
                      />
                    </svg>
                    Education
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {profileUser.university ? (
                      <div className="flex items-start">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4 flex-shrink-0">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 14l9-5-9-5-9 5 9 5z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900">{profileUser.university}</h5>
                          <p className="text-gray-700">
                            {profileUser.department && (
                              <span className="inline-block mr-2">Department of {profileUser.department}</span>
                            )}
                            {profileUser.roll && <span className="inline-block">Roll: {profileUser.roll}</span>}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-600">No education information provided</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    Work
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {profileUser.worksAt ? (
                      <div className="flex items-start">
                        <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mr-4 flex-shrink-0">
                          <svg
                            className="w-6 h-6 text-yellow-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900">Works at {profileUser.worksAt}</h5>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-600">No work information provided</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Places Lived
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {profileUser.livesin ? (
                      <div className="flex items-start">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4 flex-shrink-0">
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900">Lives in {profileUser.livesin}</h5>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-600">No location information provided</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

{activeTab === "saved" && isOwnProfile && (
  <div className="space-y-6">
    {/* Header Card */}
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-2">Saved Posts</h3>
      <p className="text-gray-600 text-sm">Posts you've saved for later.</p>
    </div>

    {/* Content Section */}
    {savedPostsLoading ? (
      <div className="bg-white rounded-lg shadow-sm p-12 flex justify-center">
        <LoadingSpinner />
      </div>
    ) : savedPostsError ? (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center">
        <p className="text-red-500 text-base font-medium">{savedPostsError}</p>
      </div>
    ) : savedPosts.length === 0 ? (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">No saved posts yet</h3>
        <p className="text-gray-600 text-sm">When you save posts, they'll appear here for easy access.</p>
      </div>
    ) : (
      <div className="space-y-6">
        {savedPosts.map((post, index) => {
          // Get author information
          const author = post.sharedBy
            ? sharedByUsers[post.sharedBy] || {
                firstname: "Unknown",
                lastname: "User",
                profilePicture: "https://via.placeholder.com/40",
              }
            : profileUser

          const authorName = `${author.firstname} ${author.lastname}`.trim()

          return (
            <div
              key={post._id}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden cursor-pointer"
              onClick={() => navigate(`/post/${post._id}`)}
            >
              {/* Post Header with Gradient */}
              <div className="p-4 bg-gradient-to-r from-teal-600 to-green-800 text-white flex items-center justify-between rounded-t-lg">
                <div className="flex items-center">
                  <img
                    src={author.profilePicture || "https://via.placeholder.com/40"}
                    alt={authorName}
                    className="w-8 h-8 rounded-full mr-2 object-cover"
                    onError={(e) => (e.target.src = "https://via.placeholder.com/40")}
                  />
                  <div>
                    <p className="text-sm font-medium">{authorName}</p>
                    <p className="text-xs text-gray-200">{new Date(post.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    // Add unsave functionality here
                  }}
                  className="text-white hover:text-red-300 p-1 rounded-full hover:bg-green-800 transition-colors duration-200"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>

              {/* Post Image */}
              {post.image && (
                <div className="relative h-48 w-full overflow-hidden">
                  <img
                    src={post.image || "/placeholder.svg"}
                    alt={post.desc || "Post"}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    onError={(e) =>
                      (e.target.src = "https://via.placeholder.com/800x200?text=Image+Not+Available")
                    }
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              )}

              {/* Post Content */}
              <div className="p-4 bg-gray-50">
                <p className="text-gray-800 text-sm">{post.desc || "No description"}</p>
              </div>
            </div>
          )
        })}
      </div>
    )}
  </div>
)}

          {activeTab === "photos" && (
            <div className="bg-white shadow-md rounded-xl p-6 border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Photos</h3>
              <div className="space-y-8">
                {/* Current Profile Picture */}
                {profileUser.profilePicture && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Current Profile Picture
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      <div className="relative group overflow-hidden rounded-lg shadow-md">
                        <img
                          src={profileUser.profilePicture || "https://via.placeholder.com/200?text=Error"}
                          alt="Current profile picture"
                          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                          onError={(e) => (e.target.src = "https://via.placeholder.com/200?text=Error")}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Previous Profile Pictures */}
                {profilePictures.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Previous Profile Pictures
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {profilePictures.map((post) => (
                        <div key={post._id} className="relative group overflow-hidden rounded-lg shadow-md">
                          <img
                            src={post.image || "https://via.placeholder.com/200?text=Error"}
                            alt="Previous profile picture"
                            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                            onError={(e) => (e.target.src = "https://via.placeholder.com/200?text=Error")}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="absolute bottom-0 left-0 right-0 p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <p className="text-sm">{new Date(post.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Current Cover Photo */}
                {profileUser.coverPicture && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      Current Cover Photo
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="relative group overflow-hidden rounded-lg shadow-md">
                        <img
                          src={profileUser.coverPicture || "https://via.placeholder.com/400x200?text=Error"}
                          alt="Current cover photo"
                          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                          onError={(e) => (e.target.src = "https://via.placeholder.com/400x200?text=Error")}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Previous Cover Photos */}
                {coverPictures.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      Previous Cover Photos
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {coverPictures.map((post) => (
                        <div key={post._id} className="relative group overflow-hidden rounded-lg shadow-md">
                          <img
                            src={post.image || "https://via.placeholder.com/400x200?text=Error"}
                            alt="Previous cover photo"
                            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                            onError={(e) => (e.target.src = "https://via.placeholder.com/400x200?text=Error")}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="absolute bottom-0 left-0 right-0 p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <p className="text-sm">{new Date(post.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Other Photos */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Other Photos
                  </h4>
                  {posts.filter((post) => post.image && !post.isProfilePicture && !post.isCoverPicture && !post.virtual)
                    .length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <svg
                        className="w-12 h-12 mx-auto text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <p className="mt-2 text-gray-600">No additional photos uploaded yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {posts
                        .filter(
                          (post) =>
                            post.image &&
                            !post.isProfilePicture &&
                            !post.isCoverPicture &&
                            !post.virtual &&
                            (post.userId === profileUser._id || post.user?._id === profileUser._id),
                        )
                        .map((post) => (
                          <Link
                            key={post._id}
                            to={`/post/${post._id}`}
                            className="relative group overflow-hidden rounded-lg shadow-md block"
                          >
                            <div className="aspect-square bg-gray-100">
                              <img
                                src={post.image || "/placeholder.svg"}
                                alt={post.desc || `${profileUser.firstname}'s photo`}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                loading="lazy"
                                onError={(e) => {
                                  console.log("Image failed to load:", post.image)
                                  e.target.onerror = null // Prevent infinite loop
                                  e.target.src = "https://via.placeholder.com/200?text=Photo"
                                }}
                              />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="absolute bottom-0 left-0 right-0 p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <p className="text-sm truncate">{post.desc || "No description"}</p>
                            </div>
                          </Link>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showEditModal && (
        <EditProfile
          show={showEditModal}
          onHide={() => setShowEditModal(false)}
          user={profileUser}
          onProfileUpdate={handleProfileUpdate}
        />
      )}
      {showDeleteConfirm && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Are you sure?</h3>
      <p className="text-gray-600 mb-6">
        Deleting your account is irreversible. You will lose all your data and won’t be able to log in again.
      </p>
      <div className="flex justify-end gap-3">
        <button
          onClick={() => setShowDeleteConfirm(false)}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all duration-300"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            handleDeleteAccount()
            setShowDeleteConfirm(false)
            navigate("/login")
          }}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300"
        >
          Delete Account
        </button>
      </div>
    </div>
  </div>
)}
    </>
  )
}

export default Profile
