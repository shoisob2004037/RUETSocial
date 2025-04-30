"use client";

import { useState, useEffect } from "react";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUser,
} from "../services/api";
import { useNavigate } from "react-router-dom";

const NotificationsPage = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await getUserNotifications(user.user._id);
      setNotifications(data);

      const userIds = [
        ...new Set(data.map((notification) => notification.sender)),
      ];
      const userDetails = {};

      for (const userId of userIds) {
        try {
          const userData = await getUser(userId);
          userDetails[userId] = userData;
        } catch (error) {
          console.error(`Error fetching user ${userId}:`, error);
        }
      }

      setUsers(userDetails);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(
        notifications.map((notification) =>
          notification._id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead(user.user._id);
      setNotifications(
        notifications.map((notification) => ({ ...notification, read: true }))
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      setNotifications(
        notifications.filter(
          (notification) => notification._id !== notificationId
        )
      );
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const formatNotificationTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getNotificationText = (notification) => {
    switch (notification.type) {
      case "like":
        return "liked your post";
      case "comment":
        return "commented on your post";
      case "follow":
        return "started following you";
      default:
        return "interacted with you";
    }
  };

  const handleNotificationClick = (notification, e) => {
    e.preventDefault();

    if (!notification.read) {
      handleMarkAsRead(notification._id);
    }

    switch (notification.type) {
      case "like":
      case "comment":
        if (notification.post) {
          navigate(`/post/${notification.post}`);
        }
        break;
      case "follow":
        navigate(`/profile/${notification.sender}`);
        break;
      default:
        break;
    }
  };

  const getUserName = (userId) => {
    const userInfo = users[userId];
    return userInfo ? `${userInfo.firstname} ${userInfo.lastname}` : "User";
  };

  const getUserProfilePic = (userId) => {
    const userInfo = users[userId];
    return userInfo && userInfo.profilePicture
      ? userInfo.profilePicture
      : "https://via.placeholder.com/40";
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
          {notifications.length > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className={`px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed`}
              disabled={
                !notifications.some((notification) => !notification.read)
              }
            >
              Mark all as read
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center text-gray-600">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-600">
              You don't have any notifications yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`
                    flex items-center p-4 rounded-lg mb-2 transition-all duration-200
                    ${
                      !notification.read
                        ? "bg-blue-200 border-3 border-blue-500 shadow-sm"
                        : "bg-gray-200 border-3 border-gray-200"
                    }
                    hover:bg-blue-100 hover:shadow-md
                  `}
              >
                <div className="flex-shrink-0">
                  <img
                    src={getUserProfilePic(notification.sender)}
                    alt={getUserName(notification.sender)}
                    className="w-10 h-10 rounded-full"
                    onError={(e) => (e.target.src = "/placeholder.svg")}
                  />
                </div>
                <div
                  className="flex-1 ml-4 cursor-pointer"
                  onClick={(e) => handleNotificationClick(notification, e)}
                >
                  <div className="text-gray-800">
                    <strong className="font-semibold">
                      {getUserName(notification.sender)}
                    </strong>{" "}
                    {getNotificationText(notification)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatNotificationTime(notification.createdAt)}
                  </div>
                </div>
                <div className="flex space-x-2">
                  {!notification.read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notification._id);
                      }}
                      className="text-blue-500 hover:text-blue-700"
                      title="Mark as read"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNotification(notification._id);
                    }}
                    className="text-red-500 hover:text-red-700"
                    title="Delete notification"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4M3 7h18"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
