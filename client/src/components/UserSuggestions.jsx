import { Link } from "react-router-dom";
import { followUser, unfollowUser, getUser } from "../services/api";
import { useState, useEffect } from "react";

const UserSuggestions = ({ users, currentUser }) => {
  const [followingStatus, setFollowingStatus] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCurrentUserData = async () => {
      if (!currentUser || !currentUser._id) return;

      try {
        setLoading(true);
        const userData = await getUser(currentUser._id);

        const followMap = {};
        if (userData.following && Array.isArray(userData.following)) {
          userData.following.forEach((followId) => {
            followMap[followId] = true;
          });
        }

        setFollowingStatus(followMap);
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUserData();
  }, [currentUser]);

  const handleFollow = async (userId) => {
    try {
      await followUser(userId, currentUser._id);

      setFollowingStatus((prev) => ({
        ...prev,
        [userId]: true,
      }));
    } catch (err) {
      if (
        err.response &&
        err.response.data &&
        err.response.data.message === "You are already following this user"
      ) {
        setFollowingStatus((prev) => ({
          ...prev,
          [userId]: true,
        }));
      }
    }
  };

  const handleUnfollow = async (userId) => {
    try {
      await unfollowUser(userId, currentUser._id);

      setFollowingStatus((prev) => ({
        ...prev,
        [userId]: false,
      }));
    } catch (err) {
      
    }
  };

  if (loading) {
    return (
      <div className="text-center py-6">
        <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="text-gray-500 text-sm mt-2">Loading suggestions...</p>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="text-center py-6">
        <svg className="w-10 h-10 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <p className="text-gray-500 text-sm">No suggestions available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {users.map((user) => (
        <div key={user._id} className="flex items-center gap-3">
          <img
            src={user.profilePicture || "https://via.placeholder.com/40"}
            alt={`${user.firstname} ${user.lastname}`}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="flex-1 min-w-0">
            <Link
              to={`/profile/${user._id}`}
              className="font-semibold text-gray-900 hover:text-blue-600 text-sm block truncate"
            >
              {user.firstname} {user.lastname}
            </Link>
            {user.livesin && (
              <p className="text-gray-500 text-xs truncate">{user.livesin}</p>
            )}
            {user.university && !user.livesin && (
              <p className="text-gray-500 text-xs truncate">{user.university}</p>
            )}
          </div>
          <button
            onClick={() =>
              followingStatus[user._id]
                ? handleUnfollow(user._id)
                : handleFollow(user._id)
            }
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              followingStatus[user._id]
                ? "border border-gray-300 text-gray-700 hover:bg-gray-50"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            {followingStatus[user._id] ? "Unfollow" : "Follow"}
          </button>
        </div>
      ))}
    </div>
  );
};

export default UserSuggestions;