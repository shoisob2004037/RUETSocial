"use client";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Heart, MessageCircle, Trash2, UserPlus, X } from "lucide-react";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUser,
} from "../services/api";

const NotificationsPage = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState({});
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await getUserNotifications(user.user._id);
      setNotifications(data || []);

      const userIds = [...new Set((data || []).map((notification) => notification.sender))];
      const userDetails = {};
      await Promise.all(
        userIds.map(async (userId) => {
          try {
            userDetails[userId] = await getUser(userId);
          } catch (error) {
            console.error(`Error fetching user ${userId}:`, error);
          }
        })
      );

      setUsers(userDetails);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const filteredNotifications = useMemo(() => {
    if (filter === "unread") return notifications.filter((notification) => !notification.read);
    if (filter === "posts") return notifications.filter((notification) => ["like", "comment"].includes(notification.type));
    return notifications;
  }, [filter, notifications]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification._id === notificationId ? { ...notification, read: true } : notification
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead(user.user._id);
      setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((notification) => notification._id !== notificationId));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const formatNotificationTime = (timestamp) =>
    new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(timestamp));

  const getNotificationMeta = (notification) => {
    switch (notification.type) {
      case "like":
        return { text: "liked your post", icon: Heart, tone: "text-rose-600 bg-rose-50" };
      case "comment":
        return { text: "commented on your post", icon: MessageCircle, tone: "text-blue-600 bg-blue-50" };
      case "follow":
        return { text: "started following you", icon: UserPlus, tone: "text-emerald-600 bg-emerald-50" };
      default:
        return { text: "interacted with you", icon: Bell, tone: "text-purple-600 bg-purple-50" };
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) handleMarkAsRead(notification._id);

    if (["like", "comment"].includes(notification.type) && notification.post) {
      navigate(`/post/${notification.post}`);
      return;
    }
    if (notification.type === "follow") navigate(`/profile/${notification.sender}`);
  };

  const getUserName = (userId) => {
    const userInfo = users[userId];
    return userInfo ? `${userInfo.firstname} ${userInfo.lastname}` : "User";
  };

  const getUserProfilePic = (userId) =>
    users[userId]?.profilePicture || "https://via.placeholder.com/48";

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-purple-50/40 px-3 py-4 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-3xl">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-700 via-indigo-700 to-sky-600 p-5 sm:p-7 text-white shadow-xl mb-5 sm:mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold mb-3">
                <Bell className="w-4 h-4" /> Activity center
              </div>
              <h1 className="m-0 text-2xl sm:text-3xl font-black tracking-tight">Notifications</h1>
              <p className="m-0 mt-1 text-sm text-white/80">
                {unreadCount ? `${unreadCount} new update${unreadCount === 1 ? "" : "s"}` : "Everything is caught up"}
              </p>
            </div>
            {notifications.length > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={!unreadCount}
                className="shrink-0 inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-bold text-indigo-700 shadow-lg disabled:opacity-50"
              >
                <CheckCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Mark all read</span>
              </button>
            )}
          </div>
        </section>

        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {[
            ["all", "All", notifications.length],
            ["unread", "Unread", unreadCount],
            ["posts", "Posts", notifications.filter((n) => ["like", "comment"].includes(n.type)).length],
          ].map(([key, label, count]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-all ${
                filter === key
                  ? "bg-gray-900 text-white shadow-lg"
                  : "bg-white text-gray-600 border border-gray-100 hover:bg-gray-50"
              }`}
            >
              {label} <span className="opacity-70">{count}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid gap-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-20 rounded-2xl bg-white border border-gray-100 shadow-sm animate-pulse" />
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="rounded-3xl bg-white border border-gray-100 p-8 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-purple-50 text-purple-600">
              <Bell className="h-8 w-8" />
            </div>
            <p className="m-0 font-bold text-gray-800">No notifications here</p>
            <p className="m-0 mt-1 text-sm text-gray-500">New likes, comments and follows will show up here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => {
              const meta = getNotificationMeta(notification);
              const Icon = meta.icon;
              return (
                <article
                  key={notification._id}
                  className={`group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border p-3 sm:p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
                    notification.read
                      ? "bg-white border-gray-100"
                      : "bg-white border-purple-200 ring-1 ring-purple-100"
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={getUserProfilePic(notification.sender)}
                      alt={getUserName(notification.sender)}
                      className="h-11 w-11 sm:h-12 sm:w-12 rounded-full object-cover ring-2 ring-white shadow"
                      onError={(e) => (e.target.src = "https://via.placeholder.com/48")}
                    />
                    <span className={`absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full ${meta.tone} ring-2 ring-white`}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                  </div>

                  <button
                    onClick={() => handleNotificationClick(notification)}
                    className="min-w-0 text-left"
                  >
                    <p className="m-0 text-sm sm:text-[15px] text-gray-700">
                      <span className="font-black text-gray-950">{getUserName(notification.sender)}</span>{" "}
                      {meta.text}
                    </p>
                    <p className="m-0 mt-1 text-xs text-gray-400">{formatNotificationTime(notification.createdAt)}</p>
                  </button>

                  <div className="flex shrink-0 items-center gap-1">
                    {!notification.read && (
                      <button
                        onClick={() => handleMarkAsRead(notification._id)}
                        className="grid h-9 w-9 place-items-center rounded-full text-blue-600 hover:bg-blue-50"
                        title="Mark as read"
                      >
                        <CheckCheck className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteNotification(notification._id)}
                      className="grid h-9 w-9 place-items-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-600"
                      title="Delete notification"
                    >
                      {notification.read ? <Trash2 className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
};

export default NotificationsPage;