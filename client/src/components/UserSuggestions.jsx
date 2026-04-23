import { Link } from "react-router-dom";
import { followUser, unfollowUser, getUser } from "../services/api";
import { useState, useEffect } from "react";

const UserSuggestions = ({ users = [], currentUser }) => {
  const [followingStatus, setFollowingStatus] = useState({});
  const [initialLoading, setInitialLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchCurrentUserData = async () => {
      if (!currentUser?._id) return;

      try {
        setInitialLoading(true);
        setError("");

        const userData = await getUser(currentUser._id);
        if (cancelled) return;

        const followMap = {};
        if (Array.isArray(userData?.following)) {
          userData.following.forEach((followId) => {
            followMap[followId] = true;
          });
        }

        setFollowingStatus(followMap);
      } catch (err) {
        if (!cancelled) {
          const msg =
            err?.response?.data?.message ||
            err?.message ||
            "Failed to load follow status.";
          setError(msg);
        }
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    };

    fetchCurrentUserData();

    return () => {
      cancelled = true;
    };
  }, [currentUser?._id]);

  const setUserActionLoading = (userId, value) => {
    setActionLoading((prev) => ({ ...prev, [userId]: value }));
  };

  const handleFollow = async (userId) => {
    if (!currentUser?._id || !userId || actionLoading[userId]) return;

    try {
      setUserActionLoading(userId, true);
      setError("");
      await followUser(userId, currentUser._id);

      setFollowingStatus((prev) => ({
        ...prev,
        [userId]: true,
      }));
    } catch (err) {
      const serverMessage = err?.response?.data?.message || "";

      // Keep UI consistent if backend says already following
      if (serverMessage.toLowerCase().includes("already following")) {
        setFollowingStatus((prev) => ({
          ...prev,
          [userId]: true,
        }));
      } else {
        setError(serverMessage || err?.message || "Failed to follow user.");
      }
    } finally {
      setUserActionLoading(userId, false);
    }
  };

  const handleUnfollow = async (userId) => {
    if (!currentUser?._id || !userId || actionLoading[userId]) return;

    try {
      setUserActionLoading(userId, true);
      setError("");
      await unfollowUser(userId, currentUser._id);

      setFollowingStatus((prev) => ({
        ...prev,
        [userId]: false,
      }));
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to unfollow user.";
      setError(msg);
    } finally {
      setUserActionLoading(userId, false);
    }
  };

  if (initialLoading) {
    return (
      <div className="text-center py-6">
        <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="text-gray-500 text-sm mt-2">Loading suggestions...</p>
      </div>
    );
  }

  if (!users.length) {
    return (
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
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
        <p className="text-gray-500 text-sm">No suggestions available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {users.map((user) => {
        const isFollowing = !!followingStatus[user._id];
        const isBusy = !!actionLoading[user._id];

        return (
          <div key={user._id} className="flex items-center gap-3">
            <img
              src={user.profilePicture || "https://via.placeholder.com/40"}
              alt={`${user.firstname} ${user.lastname}`}
              className="w-10 h-10 rounded-full object-cover"
            />

            <div className="flex-1 min-w-0">
              <Link
                to={`/profile/${user._id}`}
                className="font-semibold text-gray-900 no-underline hover:text-green-600 text-sm block truncate"
              >
                {user.firstname} {user.lastname}
              </Link>
              {user.livesin ? (
                <p className="text-gray-500 text-xs truncate">{user.livesin}</p>
              ) : user.university ? (
                <p className="text-gray-500 text-xs truncate">{user.university}</p>
              ) : null}
            </div>

            <button
              onClick={() =>
                isFollowing ? handleUnfollow(user._id) : handleFollow(user._id)
              }
              disabled={isBusy}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                isFollowing
                  ? "border border-gray-300 text-gray-700 hover:bg-gray-50"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              } ${isBusy ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {isBusy ? "Please wait..." : isFollowing ? "Unfollow" : "Follow"}
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default UserSuggestions;
