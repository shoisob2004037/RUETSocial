"use client";

import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  getTimelinePosts,
  getAllUsers,
  getTrendingHashtags,
  getUser,
} from "../services/api";
import CreatePost from "../components/CreatePost";
import Post from "../components/Post";
import UserSuggestions from "../components/UserSuggestions";
import LoadingSpinner from "../components/LoadingSpinner";
import Footer from "../components/Footer";

const Home = ({ user }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [trendingHashtags, setTrendingHashtags] = useState([]);
  const [sharedByUsers, setSharedByUsers] = useState({});
  const [showMobileSuggestions, setShowMobileSuggestions] = useState(true);

  const navigate = useNavigate();

  // Refs for scrollable sections
  const leftSectionRef = useRef(null);
  const centerSectionRef = useRef(null);
  const rightSectionRef = useRef(null);

  useEffect(() => {
    const fetchTrendingHashtags = async () => {
      try {
        const hashtags = await getTrendingHashtags();
        setTrendingHashtags(hashtags);
      } catch (err) {
        console.error("Error fetching hashtags:", err);
      }
    };

    fetchTrendingHashtags();
  }, []);

  useEffect(() => {
    const fetchTimelinePosts = async () => {
      try {
        setLoading(true);
        const timelinePosts = await getTimelinePosts(user.user._id);
        console.log("Timeline Posts:", timelinePosts);

        const sharedUsers = {};
        for (const post of timelinePosts) {
          if (post.sharedBy || (post.shares && post.shares.length > 0)) {
            if (post.sharedBy && !sharedUsers[post.sharedBy]) {
              try {
                const userData = await getUser(post.sharedBy);
                sharedUsers[post.sharedBy] = userData;
              } catch (error) {
                console.error(`Failed to fetch user ${post.sharedBy}:`, error);
              }
            }
            if (post.shares && post.shares.length > 0) {
              for (const userId of post.shares) {
                if (!sharedUsers[userId]) {
                  try {
                    const userData = await getUser(userId);
                    sharedUsers[userId] = userData;
                  } catch (error) {
                    console.error(`Failed to fetch user ${userId}:`, error);
                  }
                }
              }
            }
          }
        }

        setSharedByUsers(sharedUsers);
        setPosts(timelinePosts);
      } catch (err) {
        setError("Failed to load posts. Please try again later.");
        console.error("Error fetching posts:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchSuggestedUsers = async () => {
      try {
        const users = await getAllUsers();
        console.log("Raw Users from API:", users);

        if (!users || !Array.isArray(users) || users.length === 0) {
          console.log("No users returned or invalid response");
          setSuggestedUsers([]);
          return;
        }

        const filteredUsers = users.filter((u) => {
          const isNotCurrentUser = u._id !== user.user._id;
          const hasSameDepartment = u.department === user.user.department;
          return isNotCurrentUser && hasSameDepartment;
        });

        console.log("Filtered Suggested Users:", filteredUsers);
        setSuggestedUsers(filteredUsers);
      } catch (err) {
        console.error("Error fetching suggested users:", err);
        setSuggestedUsers([]);
      }
    };

    fetchTimelinePosts();
    fetchSuggestedUsers();
  }, [user]);

  const handleNewPost = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  const handlePostUpdate = (updatedPost) => {
    setPosts(
      posts.map((post) => (post._id === updatedPost._id ? updatedPost : post)),
    );
  };

  const handlePostDeleted = (postId) => {
    setPosts(posts.filter((post) => post._id !== postId));
  };

  const getSharedByUser = (post) => {
    if (post.sharedBy && sharedByUsers[post.sharedBy]) {
      return sharedByUsers[post.sharedBy];
    }
    if (post.shares && post.shares.length > 0) {
      for (const userId of post.shares) {
        if (userId !== user.user._id && sharedByUsers[userId]) {
          return sharedByUsers[userId];
        }
      }
      if (post.shares.includes(user.user._id)) {
        return user.user;
      }
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* LEFT SECTION - User Profile Card (Desktop only) */}
          <div className="hidden lg:block lg:w-1/4 xl:w-1/5">
            <div
              ref={leftSectionRef}
              className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400"
              style={{ scrollbarWidth: "thin" }}
            >
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Profile Header */}
                <div className="relative">
                  <div className="h-24 bg-gradient-to-r from-green-400 to-blue-300"></div>
                  <div className="px-4 pb-4">
                    <div className="flex justify-center -mt-12 mb-3">
                      <img
                        src={
                          user.user.profilePicture ||
                          "https://via.placeholder.com/80"
                        }
                        alt={`${user.user.firstname} ${user.user.lastname}`}
                        className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-sm"
                      />
                    </div>
                    <div className="text-center">
                      <Link to={`/profile/${user.user._id}`} className="no-underline">
                        <h3 className="font-semibold text-gray-900 hover:text-green-600 no-underline">
                          {user.user.firstname} {user.user.lastname}
                        </h3>
                      </Link>
                      <p className="text-xs text-gray-500 mt-1">
                        {user.user.department || "Student"}
                      </p>
                      {user.user.livesin && (
                        <p className="text-xs text-gray-400 mt-1">
                          {user.user.livesin}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

              
                {/* Quick Links */}
                <div className="border-t border-gray-200">
                  <Link
                    to={`/profile/${user.user._id}`}
                    className="flex items-center gap-3 px-4 py-3 no-underline hover:bg-green-100 transition-colors border-b border-gray-100"
                  >
                    <svg
                      className="w-5 h-5 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span className="text-sm text-gray-700">My Profile</span>
                  </Link>
                  <Link
                    to="/saved"
                    className="flex items-center gap-3 px-4 py-3 no-underline hover:bg-green-100 transition-colors"
                  >
                    <svg
                      className="w-5 h-5 text-gray-500"
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
                    <span className="text-sm text-gray-700">Saved Posts</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* CENTER SECTION - Posts Feed */}
          <div className="lg:flex-1 xl:flex-1">
            <div
              ref={centerSectionRef}
              className="max-h-[calc(100vh-3rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400"
              style={{ scrollbarWidth: "thin" }}
            >
              {/* Create Post */}
              <div className="mb-5">
                <CreatePost user={user} onPostCreated={handleNewPost} />
              </div>

              {/* Posts Feed */}
              {loading ? (
                <div className="flex justify-center items-center py-20">
                  <LoadingSpinner />
                </div>
              ) : error ? (
                <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                  <svg
                    className="w-12 h-12 text-red-500 mx-auto mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-red-600 font-medium">{error}</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                  <svg
                    className="w-16 h-16 text-gray-400 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                  <p className="text-gray-600 font-medium">No posts to show</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Follow some users or create your first post!
                  </p>
                </div>
              ) : (
                <div className="space-y-4 pb-6">
                  {posts.map((post) => {
                    const sharedBy = getSharedByUser(post);
                    const isShared = !!sharedBy;

                    return (
                      <Post
                        key={post._id}
                        post={post}
                        currentUser={user.user}
                        onPostUpdate={handlePostUpdate}
                        onPostDelete={handlePostDeleted}
                        isShared={isShared}
                        sharedBy={sharedBy}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SECTION - Suggestions & Hashtags (Desktop) */}
          <div className="hidden lg:block lg:w-1/3 xl:w-1/4">
            <div
              ref={rightSectionRef}
              className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400"
              style={{ scrollbarWidth: "thin" }}
            >
              <div className="space-y-5">
                {/* User Suggestions Card */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-blue-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                      <h3 className="font-semibold text-gray-900">
                        People You May Know
                      </h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <UserSuggestions
                      users={suggestedUsers}
                      currentUser={user.user}
                    />
                  </div>
                </div>

                {/* Trending Hashtags Card */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-blue-500"
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
                      <h3 className="font-semibold text-gray-900">
                        Trending Hashtags
                      </h3>
                    </div>
                  </div>
                  <div className="p-4">
                    {trendingHashtags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {trendingHashtags.map((hashtag) => (
                          <button
                            key={hashtag._id}
                            onClick={() =>
                              navigate(`/hashtag/${hashtag._id.substring(1)}`)
                            }
                            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-blue-100 hover:text-blue-600 transition-colors duration-200"
                          >
                            <span className="text-blue-500">#</span>
                            {hashtag._id.substring(1)}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <svg
                          className="w-10 h-10 text-gray-400 mx-auto mb-2"
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
                        <p className="text-gray-500 text-sm">
                          No trending hashtags yet
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <Footer />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE BOTTOM SHEET - User Suggestions (Horizontal Scroll) */}
      {suggestedUsers.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
          <div className="px-4 py-3">
            <div
              className={`flex items-center justify-between ${showMobileSuggestions ? "mb-3" : ""}`}
            >
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                <h3 className="font-semibold text-gray-900 text-sm">
                  People You May Know
                </h3>
              </div>

              <button
                onClick={() => setShowMobileSuggestions((prev) => !prev)}
                className="p-2 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors"
                aria-label={
                  showMobileSuggestions
                    ? "Collapse suggestions"
                    : "Expand suggestions"
                }
                title={showMobileSuggestions ? "Collapse" : "Expand"}
              >
                {showMobileSuggestions ? (
                  // Chevron down (collapse)
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                ) : (
                  // Chevron up (expand)
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                )}
              </button>
            </div>

            {showMobileSuggestions && (
              <div
                className="overflow-x-auto overflow-y-hidden pb-2 -mx-1 px-1 scrollbar-thin scrollbar-thumb-gray-300"
                style={{ scrollbarWidth: "thin" }}
              >
                <div className="flex gap-3">
                  {suggestedUsers.slice(0, 10).map((suggestedUser) => (
                    <div
                      key={suggestedUser._id}
                      className="flex-shrink-0 w-28 text-center"
                    >
                      <Link
                        to={`/profile/${suggestedUser._id}`}
                        className="block"
                      >
                        <img
                          src={
                            suggestedUser.profilePicture ||
                            "https://via.placeholder.com/60"
                          }
                          alt={`${suggestedUser.firstname} ${suggestedUser.lastname}`}
                          className="w-16 h-16 rounded-full object-cover mx-auto mb-2 border-2 border-gray-200"
                        />
                        <p className="font-medium text-gray-900 text-xs truncate">
                          {suggestedUser.firstname} {suggestedUser.lastname}
                        </p>
                        {suggestedUser.department && (
                          <p className="text-gray-500 text-xs truncate">
                            {suggestedUser.department}
                          </p>
                        )}
                      </Link>
                      <button
                        onClick={async () => {}}
                        className="mt-2 px-3 py-1 bg-blue-500 text-white rounded-md text-xs font-medium w-full hover:bg-blue-600 transition-colors"
                      >
                        Follow
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add padding bottom on mobile to account for bottom sheet */}
      <div className={`lg:hidden ${showMobileSuggestions ? "pb-32" : "pb-16"}`}>
        <Footer />
      </div>
    </div>
  );
};

export default Home;
