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

  return (
    <div className="bg-white shadow-md rounded-lg mb-3">
      <div className="p-3 border-b text-gray-800 font-semibold">
        People From Your Department
      </div>
      <div className="p-0">
        {loading ? (
          <div className="p-3 text-center text-gray-600">Loading suggestions...</div>
        ) : (!users || users.length === 0) ? (
          <div className="p-3 text-center text-gray-600">
            No suggestions available right now.
          </div>
        ) : (
          users.map((user) => (
            <div
              key={user._id}
              className="flex items-center p-3 border-b last:border-b-0"
            >
              <img
                src={user.profilePicture || "https://via.placeholder.com/40"}
                alt={`${user.firstname} ${user.lastname}`}
                className="w-10 h-10 rounded-full mr-2 text-none"
              />
              <div className="flex-1">
                <Link
                  to={`/profile/${user._id}`}
                  className="text-gray-800 font-semibold"
                >
                  {user.firstname} {user.lastname}
                </Link>
                {user.livesin && (
                  <div className="text-gray-600 text-sm">
                    Lives in {user.livesin}
                  </div>
                )}
                {user.university && (
                  <div className="text-gray-600 text-sm">
                    Studies in {user.university}
                  </div>
                )}
              </div>
              <button
                onClick={() =>
                  followingStatus[user._id]
                    ? handleUnfollow(user._id)
                    : handleFollow(user._id)
                }
                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  followingStatus[user._id]
                    ? "border border-gray-400 text-gray-700 hover:bg-gray-100"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                {followingStatus[user._id] ? "Unfollow" : "Follow"}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserSuggestions;
