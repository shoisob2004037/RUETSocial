"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import {
  getUserCommunities,
  createCommunity,
  getCommunity,
  getCommunityMembers,
  addCommunityMember,
  removeCommunityMember,
  sendCommunityMessage,
  editCommunityMessage,
  deleteCommunityMessage,
  getMutualFollowers,
  leaveCommunity,
} from "../services/api";
import MediaUpload from "./MediaUpload";
import MediaViewer from "./MediaViewer";
import {
  Users,
  Plus,
  X,
  Send,
  ArrowLeft,
  UserPlus,
  LogOut,
  Search,
  Crown,
  Shield,
  Trash2,
  Info,
  Paperclip,
  MoreVertical,
  Edit2,
  Image as ImageIcon,
  PlayCircle,
} from "lucide-react";

const formatTime = (d) => {
  try {
    return new Date(d).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

/* ─────────────────── Create Community Modal ─────────────────── */
const CreateCommunityModal = ({ currentUser, onClose, onCreated }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [mutuals, setMutuals] = useState([]);
  const [picked, setPicked] = useState(new Set());
  const [q, setQ] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setMutuals((await getMutualFollowers(currentUser._id)) || []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [currentUser._id]);

  const toggle = (id) => {
    const next = new Set(picked);
    next.has(id) ? next.delete(id) : next.add(id);
    setPicked(next);
  };

  const filtered = mutuals.filter((u) =>
    `${u.firstname} ${u.lastname}`.toLowerCase().includes(q.toLowerCase())
  );

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const c = await createCommunity({
        name,
        description,
        createdBy: currentUser._id,
        members: Array.from(picked),
      });
      onCreated(c);
      onClose();
    } catch {
      alert("Failed to create community");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-3">
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold m-0 text-gray-800">New Community</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={submit} className="p-4 space-y-3 overflow-y-auto">
          <input
            required
            placeholder="Community name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-purple-500 text-sm"
          />
          <textarea
            rows={2}
            placeholder="Short description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-purple-500 text-sm"
          />
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1.5 m-0">
              Add mutual followers ({picked.size} selected)
            </p>
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 mb-2">
              <Search size={14} className="text-gray-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search mutual followers…"
                className="flex-1 bg-transparent outline-none text-sm"
              />
            </div>
            <div className="max-h-56 overflow-y-auto border border-gray-100 rounded-xl">
              {filtered.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-6 m-0">
                  No mutual followers yet.
                </p>
              ) : (
                filtered.map((u) => (
                  <label
                    key={u._id}
                    className="flex items-center gap-3 p-2.5 hover:bg-purple-50 cursor-pointer border-b border-gray-50 last:border-0"
                  >
                    <input
                      type="checkbox"
                      checked={picked.has(u._id)}
                      onChange={() => toggle(u._id)}
                      className="w-4 h-4 accent-purple-600"
                    />
                    <img
                      src={u.profilePicture || "https://via.placeholder.com/40"}
                      alt=""
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="m-0 text-sm font-medium text-gray-800 truncate">
                        {u.firstname} {u.lastname}
                      </p>
                      {u.department && (
                        <p className="m-0 text-xs text-gray-500 truncate">
                          {u.department}
                        </p>
                      )}
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>
          <button
            disabled={saving}
            type="submit"
            className="w-full py-2.5 rounded-xl text-white font-semibold disabled:opacity-60"
            style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
          >
            {saving ? "Creating…" : "Create Community"}
          </button>
        </form>
      </div>
    </div>
  );
};

/* ─────────────────── Members Modal (with admin controls) ─────────────────── */
const MembersModal = ({ community, currentUser, allMedia = [], onClose, onChanged }) => {
  const [members, setMembers] = useState([]);
  const [mutuals, setMutuals] = useState([]);
  const [tab, setTab] = useState("members");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(null);
  const [viewerMedia, setViewerMedia] = useState(null);
  const [viewerMediaType, setViewerMediaType] = useState(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  const amAdmin = useMemo(
    () =>
      (community.admins || []).map(String).includes(String(currentUser._id)) ||
      String(community.createdBy) === String(currentUser._id),
    [community, currentUser._id]
  );

  const load = async () => {
    try {
      const data = await getCommunityMembers(community._id);
      setMembers(data.members || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    load();
    (async () => {
      try {
        const ms = await getMutualFollowers(currentUser._id);
        setMutuals(ms || []);
      } catch {}
    })();
  }, [community._id, currentUser._id]);

  const memberIds = new Set(members.map((m) => String(m._id)));
  const addable = mutuals.filter((u) => !memberIds.has(String(u._id)));

  const add = async (uid) => {
    setBusy(uid);
    try {
      await addCommunityMember(community._id, currentUser._id, uid);
      await load();
      onChanged?.();
    } catch (e) {
      alert(e?.response?.data?.message || "Could not add member");
    } finally {
      setBusy(null);
    }
  };

  const remove = async (uid) => {
    if (!window.confirm("Remove this member from the group?")) return;
    setBusy(uid);
    try {
      await removeCommunityMember(community._id, currentUser._id, uid);
      await load();
      onChanged?.();
    } catch (e) {
      alert(e?.response?.data?.message || "Could not remove member");
    } finally {
      setBusy(null);
    }
  };

  const filteredMembers = members.filter((u) =>
    `${u.firstname} ${u.lastname}`.toLowerCase().includes(q.toLowerCase())
  );
  const filteredAddable = addable.filter((u) =>
    `${u.firstname} ${u.lastname}`.toLowerCase().includes(q.toLowerCase())
  );

  const openMediaViewer = (media, index) => {
    setViewerMedia(media.url);
    setViewerMediaType(media.type);
    setCurrentMediaIndex(index);
  };

  const isVideo = (type) => type?.includes("video");

  return (
    <>
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-3">
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-semibold m-0 text-gray-800">{community.name}</h3>
            <p className="text-xs text-gray-500 m-0">{members.length} members</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="flex border-b text-sm font-medium">
          <button
            onClick={() => setTab("members")}
            className={`flex-1 py-2.5 ${tab === "members" ? "text-purple-600 border-b-2 border-purple-600" : "text-gray-500"}`}
          >
            Members
          </button>
          {amAdmin && (
            <button
              onClick={() => setTab("add")}
              className={`flex-1 py-2.5 ${tab === "add" ? "text-purple-600 border-b-2 border-purple-600" : "text-gray-500"}`}
            >
              Add People
            </button>
          )}
          <button
            onClick={() => setTab("media")}
            className={`flex-1 py-2.5 ${tab === "media" ? "text-purple-600 border-b-2 border-purple-600" : "text-gray-500"}`}
          >
            Media
          </button>
        </div>

        {tab !== "media" && <div className="p-3 border-b">
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-200">
            <Search size={14} className="text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={tab === "members" ? "Search members…" : "Search mutual followers…"}
              className="flex-1 bg-transparent outline-none text-sm"
            />
          </div>
        </div>}

        <div className="flex-1 overflow-y-auto">
          {tab === "members" ? (
            filteredMembers.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8 m-0">No members.</p>
            ) : (
              filteredMembers.map((u) => (
                <div
                  key={u._id}
                  className="flex items-center gap-3 p-3 border-b border-gray-50 last:border-0"
                >
                  <img
                    src={u.profilePicture || "https://via.placeholder.com/40"}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="m-0 text-sm font-medium text-gray-800 truncate flex items-center gap-1.5">
                      {u.firstname} {u.lastname}
                      {u.isCreator && (
                        <span title="Creator" className="text-amber-500"><Crown size={14} /></span>
                      )}
                      {u.isAdmin && !u.isCreator && (
                        <span title="Admin" className="text-purple-500"><Shield size={13} /></span>
                      )}
                      {String(u._id) === String(currentUser._id) && (
                        <span className="text-[10px] text-gray-400 ml-1">(you)</span>
                      )}
                    </p>
                    {u.department && (
                      <p className="m-0 text-xs text-gray-500 truncate">{u.department}</p>
                    )}
                  </div>
                  {amAdmin && !u.isCreator && String(u._id) !== String(currentUser._id) && (
                    <button
                      onClick={() => remove(u._id)}
                      disabled={busy === u._id}
                      className="p-2 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-50"
                      title="Remove member"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))
            )
          ) : tab === "add" ? (filteredAddable.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8 m-0">
              No mutual followers available to add.
            </p>
          ) : (
            filteredAddable.map((u) => (
              <div
                key={u._id}
                className="flex items-center gap-3 p-3 border-b border-gray-50 last:border-0"
              >
                <img
                  src={u.profilePicture || "https://via.placeholder.com/40"}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="m-0 text-sm font-medium text-gray-800 truncate">
                    {u.firstname} {u.lastname}
                  </p>
                  {u.department && (
                    <p className="m-0 text-xs text-gray-500 truncate">{u.department}</p>
                  )}
                </div>
                <button
                  onClick={() => add(u._id)}
                  disabled={busy === u._id}
                  className="px-3 py-1.5 text-xs font-semibold rounded-full text-white disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
                >
                  {busy === u._id ? "Adding…" : "Add"}
                </button>
              </div>
            ))
          )) : allMedia.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center mb-3">
                <ImageIcon className="w-7 h-7 text-purple-500" />
              </div>
              <p className="text-gray-600 text-sm font-medium m-0">No media shared yet</p>
              <p className="text-gray-400 text-xs mt-1 m-0">Photos and videos sent in this group will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 p-3">
              {allMedia.map((media, index) => (
                <button
                  key={media._id || media.url || index}
                  onClick={() => openMediaViewer(media, index)}
                  className="relative aspect-square overflow-hidden rounded-xl bg-gray-100"
                >
                  {isVideo(media.type) ? (
                    <>
                      <video src={media.url} className="w-full h-full object-cover" muted />
                      <span className="absolute inset-0 grid place-items-center bg-black/25 text-white">
                        <PlayCircle size={26} />
                      </span>
                    </>
                  ) : (
                    <img src={media.url} alt="Group media" className="w-full h-full object-cover" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    {viewerMedia && (
      <MediaViewer
        media={viewerMedia}
        mediaType={viewerMediaType}
        allMedia={allMedia}
        currentIndex={currentMediaIndex}
        onClose={() => setViewerMedia(null)}
      />
    )}
    </>
  );
};

/* ─────────────────── Community Chat (real-time) ─────────────────── */
export const CommunityChat = ({ community, currentUser, onBack, onUpdated }) => {
  const [c, setC] = useState(community);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [viewerMedia, setViewerMedia] = useState(null);
  const [viewerMediaType, setViewerMediaType] = useState(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editedMessageText, setEditedMessageText] = useState("");
  const [activeMessageMenu, setActiveMessageMenu] = useState(null);
  const [typingUsers, setTypingUsers] = useState({}); // id -> name
  const endRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimerRef = useRef(null);

  const allMedia = useMemo(
    () =>
      (c.messages || [])
        .filter((m) => m.mediaUrl && !m.isDeleted)
        .map((m) => ({ url: m.mediaUrl, type: m.mediaType, _id: m._id })),
    [c.messages]
  );

  // Fetch fresh
  useEffect(() => {
    (async () => {
      try {
        const fresh = await getCommunity(community._id);
        setC(fresh);
      } catch {}
    })();
  }, [community._id]);

  // Socket
  useEffect(() => {
    const s = io(import.meta.env.VITE_API_URL, {
      transports: ["polling", "websocket"],
      reconnection: true,
    });
    socketRef.current = s;
    s.on("connect", () => {
      s.emit("user_connected", currentUser._id);
      s.emit("join_community", community._id);
    });
    s.on("community_message", ({ communityId, message }) => {
      if (communityId !== community._id) return;
      setC((prev) => ({
        ...prev,
        messages: (prev.messages || []).some((m) => String(m._id) === String(message._id))
          ? prev.messages
          : [...(prev.messages || []), message],
      }));
    });
    s.on("community_message_edited", ({ communityId, messageId, text, message }) => {
      if (communityId !== community._id) return;
      setC((prev) => ({
        ...prev,
        messages: (prev.messages || []).map((m) =>
          String(m._id) === String(messageId) ? { ...m, ...(message || {}), text, edited: true } : m
        ),
      }));
    });
    s.on("community_message_deleted", ({ communityId, messageId, message }) => {
      if (communityId !== community._id) return;
      setC((prev) => ({
        ...prev,
        messages: (prev.messages || []).map((m) =>
          String(m._id) === String(messageId)
            ? { ...m, ...(message || {}), text: "", mediaUrl: null, mediaType: null, isDeleted: true }
            : m
        ),
      }));
    });
    s.on("community_typing", ({ communityId, userId, userName }) => {
      if (communityId !== community._id || userId === currentUser._id) return;
      setTypingUsers((prev) => ({ ...prev, [userId]: userName || "Someone" }));
    });
    s.on("community_stop_typing", ({ communityId, userId }) => {
      if (communityId !== community._id) return;
      setTypingUsers((prev) => {
        const n = { ...prev };
        delete n[userId];
        return n;
      });
    });
    s.on("community_members_changed", async ({ communityId }) => {
      if (communityId !== community._id) return;
      try {
        const fresh = await getCommunity(community._id);
        setC(fresh);
      } catch {}
    });
    return () => {
      s.emit("leave_community", community._id);
      s.off("community_message");
      s.off("community_message_edited");
      s.off("community_message_deleted");
      s.off("community_typing");
      s.off("community_stop_typing");
      s.off("community_members_changed");
      s.disconnect();
    };
  }, [community._id, currentUser._id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [c?.messages?.length, Object.keys(typingUsers).length]);

  const emitTyping = () => {
    const s = socketRef.current;
    if (!s) return;
    s.emit("community_typing", {
      communityId: community._id,
      userId: currentUser._id,
      userName: `${currentUser.firstname} ${currentUser.lastname || ""}`.trim(),
    });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      s.emit("community_stop_typing", {
        communityId: community._id,
        userId: currentUser._id,
      });
    }, 1500);
  };

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const body = text;
    setText("");
    setSending(true);
    try {
      const res = await sendCommunityMessage(community._id, {
        senderId: currentUser._id,
        senderName: `${currentUser.firstname} ${currentUser.lastname || ""}`.trim(),
        senderAvatar: currentUser.profilePicture || "",
        text: body,
      });
      const msg = res?.message;
      if (msg) {
        setC((prev) => ({ ...prev, messages: [...(prev.messages || []), msg] }));
        socketRef.current?.emit("community_message", {
          communityId: community._id,
          message: msg,
        });
        socketRef.current?.emit("community_stop_typing", {
          communityId: community._id,
          userId: currentUser._id,
        });
      }
    } catch {
      setText(body);
      alert("Failed to send.");
    } finally {
      setSending(false);
    }
  };

  const sendMedia = async (media) => {
    setSending(true);
    try {
      const res = await sendCommunityMessage(community._id, {
        senderId: currentUser._id,
        senderName: `${currentUser.firstname} ${currentUser.lastname || ""}`.trim(),
        senderAvatar: currentUser.profilePicture || "",
        text: "",
        mediaUrl: media.url,
        mediaType: media.type,
      });
      const msg = res?.message;
      if (msg) {
        setC((prev) => ({ ...prev, messages: [...(prev.messages || []), msg] }));
        socketRef.current?.emit("community_message", { communityId: community._id, message: msg });
      }
    } catch {
      alert("Failed to send media.");
    } finally {
      setSending(false);
    }
  };

  const saveEditedMessage = async () => {
    if (!editingMessageId || !editedMessageText.trim()) return;
    try {
      const res = await editCommunityMessage(community._id, editingMessageId, {
        senderId: currentUser._id,
        text: editedMessageText,
      });
      const msg = res?.message;
      setC((prev) => ({
        ...prev,
        messages: (prev.messages || []).map((m) =>
          String(m._id) === String(editingMessageId)
            ? { ...m, ...(msg || {}), text: editedMessageText, edited: true }
            : m
        ),
      }));
      socketRef.current?.emit("community_message_edited", {
        communityId: community._id,
        messageId: editingMessageId,
        text: editedMessageText,
        message: msg,
      });
      setEditingMessageId(null);
      setEditedMessageText("");
    } catch (e) {
      alert(e?.response?.data?.message || "Could not edit message");
    }
  };

  const deleteGroupMessage = async (messageId) => {
    try {
      const deletedByName = `${currentUser.firstname} ${currentUser.lastname || ""}`.trim();
      const res = await deleteCommunityMessage(community._id, messageId, {
        senderId: currentUser._id,
        deletedByName,
      });
      const msg = res?.message;
      setC((prev) => ({
        ...prev,
        messages: (prev.messages || []).map((m) =>
          String(m._id) === String(messageId)
            ? { ...m, ...(msg || {}), text: "", mediaUrl: null, mediaType: null, isDeleted: true, deletedByName }
            : m
        ),
      }));
      socketRef.current?.emit("community_message_deleted", {
        communityId: community._id,
        messageId,
        message: msg,
      });
      setActiveMessageMenu(null);
    } catch (e) {
      alert(e?.response?.data?.message || "Could not delete message");
    }
  };

  const startEditMessage = (message) => {
    setEditingMessageId(message._id);
    setEditedMessageText(message.text || "");
    setActiveMessageMenu(null);
  };

  const openMediaViewer = (mediaUrl, mediaType) => {
    const index = allMedia.findIndex((m) => m.url === mediaUrl);
    setViewerMedia(mediaUrl);
    setViewerMediaType(mediaType);
    setCurrentMediaIndex(Math.max(index, 0));
  };

  const renderCommunityMessage = (m) => {
    if (m.isDeleted) {
      return <p className="m-0 text-xs italic opacity-80">{m.deletedByName || "Someone"} deleted a message</p>;
    }
    if (m.mediaUrl) {
      if (m.mediaType === "video") {
        return <video src={m.mediaUrl} controls className="max-w-[210px] sm:max-w-[300px] max-h-52 rounded-xl" />;
      }
      return (
        <img
          src={m.mediaUrl}
          alt="Shared media"
          onClick={() => openMediaViewer(m.mediaUrl, m.mediaType)}
          className="max-w-[210px] sm:max-w-[300px] max-h-56 rounded-xl object-cover cursor-pointer"
        />
      );
    }
    return <p className="m-0 break-words whitespace-pre-wrap leading-snug">{m.text}</p>;
  };

  const leave = async () => {
    if (!window.confirm("Leave this community?")) return;
    try {
      await leaveCommunity(community._id, currentUser._id);
      onUpdated?.();
      onBack();
    } catch {
      alert("Could not leave.");
    }
  };

  const typingLabel = Object.values(typingUsers).slice(0, 2).join(", ");

  return (
    <div className="flex flex-col h-full min-h-0 bg-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2.5 bg-white border-b border-gray-100 shadow-sm">
        <button onClick={onBack} className="p-2 -ml-1 rounded-lg hover:bg-gray-100 lg:hidden">
          <ArrowLeft size={18} />
        </button>
        <button
          onClick={() => setShowMembers(true)}
          className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold shrink-0 text-sm"
            style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
          >
            {c.name?.[0]?.toUpperCase() || "C"}
          </div>
          <div className="min-w-0">
            <p className="m-0 text-sm font-semibold text-gray-900 truncate">{c.name}</p>
            <p className="m-0 text-[11px] text-gray-500">
              {(c.members || []).length} members · tap for info
            </p>
          </div>
        </button>
        <button
          onClick={() => setShowMembers(true)}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          title="Group info"
        >
          <Info size={18} />
        </button>
        <button
          onClick={leave}
          className="p-2 rounded-lg hover:bg-red-50 text-red-500"
          title="Leave"
        >
          <LogOut size={17} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3">
        {(c.messages || []).length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8 m-0">
            No messages yet. Say hi 👋
          </p>
        ) : (
          (c.messages || []).map((m, i) => {
            const mine = String(m.sender) === String(currentUser._id);
            return (
              <div
                key={m._id || i}
                className={`flex gap-2 mb-2 ${mine ? "justify-end" : "justify-start"}`}
              >
                {!mine && (
                  <img
                    src={m.senderAvatar || "https://via.placeholder.com/32"}
                    alt=""
                    className="w-7 h-7 rounded-full object-cover shrink-0 mt-1"
                  />
                )}
                {editingMessageId === m._id ? (
                  <div className="w-[min(92vw,28rem)] bg-white rounded-2xl border border-gray-100 shadow-sm p-2.5">
                    <input
                      value={editedMessageText}
                      onChange={(e) => setEditedMessageText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveEditedMessage()}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-purple-200 text-sm"
                      autoFocus
                    />
                    <div className="flex justify-end gap-2 mt-2 flex-wrap">
                      <button onClick={() => setEditingMessageId(null)} className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold">
                        Cancel
                      </button>
                      <button onClick={saveEditedMessage} className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-semibold">
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative group max-w-[82vw] sm:max-w-md">
                    <div
                      className={`px-3 py-1.5 rounded-2xl shadow-sm text-sm ${
                        m.isDeleted
                          ? "bg-gray-200 text-gray-600"
                          : mine
                            ? "text-white rounded-br-md"
                            : "bg-white text-gray-800 border border-gray-100 rounded-bl-md"
                      }`}
                      style={
                        mine && !m.isDeleted
                          ? { background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }
                          : {}
                      }
                    >
                      {!mine && !m.isDeleted && (
                        <p className="m-0 text-[11px] font-semibold text-purple-600 mb-0.5">
                          {m.senderName}
                        </p>
                      )}
                      {renderCommunityMessage(m)}
                      <div
                        className={`m-0 text-[10px] mt-0.5 flex justify-end items-center gap-1 ${
                          mine && !m.isDeleted ? "text-white/70" : "text-gray-400"
                        }`}
                      >
                        {m.edited && !m.isDeleted && <span>edited</span>}
                        <span>{formatTime(m.createdAt)}</span>
                        {mine && !m.isDeleted && (
                          <span className="relative">
                            <button
                              onClick={() => setActiveMessageMenu(activeMessageMenu === m._id ? null : m._id)}
                              className="p-0.5 rounded-full hover:bg-white/15"
                              aria-label="Message options"
                            >
                              <MoreVertical size={13} />
                            </button>
                            {activeMessageMenu === m._id && (
                              <span className="absolute right-0 bottom-full mb-1 w-24 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-20 text-left">
                                {m.text && (
                                  <button onClick={() => startEditMessage(m)} className="flex items-center gap-1.5 w-full px-3 py-1.5 text-xs text-blue-600 hover:bg-gray-50">
                                    <Edit2 size={12} /> Edit
                                  </button>
                                )}
                                <button onClick={() => deleteGroupMessage(m._id)} className="flex items-center gap-1.5 w-full px-3 py-1.5 text-xs text-red-600 hover:bg-red-50">
                                  <Trash2 size={12} /> Delete
                                </button>
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
        {typingLabel && (
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md px-3 py-2 shadow-sm">
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-gray-500 mr-1">{typingLabel} typing</span>
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <form
        onSubmit={send}
        className="flex-shrink-0 flex items-center gap-2 px-2 sm:px-3 py-2.5 border-t border-gray-100 bg-white"
        style={{ paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))" }}
      >
        <button
          type="button"
          onClick={() => setShowMediaUpload(true)}
          className="w-10 h-10 rounded-full inline-flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-purple-600 shrink-0"
          title="Attach image or video"
        >
          <Paperclip size={18} />
        </button>
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            emitTyping();
          }}
          placeholder="Message"
          className="flex-1 px-4 py-2.5 bg-gray-100 border border-transparent rounded-full outline-none focus:bg-white focus:border-purple-300 focus:ring-2 focus:ring-purple-100 text-sm"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="w-10 h-10 rounded-full inline-flex items-center justify-center text-white disabled:opacity-50 shrink-0"
          style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
        >
          <Send size={17} />
        </button>
      </form>

      {showMembers && (
        <MembersModal
          community={c}
          currentUser={currentUser}
          allMedia={allMedia}
          onClose={() => setShowMembers(false)}
          onChanged={async () => {
            try {
              const fresh = await getCommunity(community._id);
              setC(fresh);
              socketRef.current?.emit("community_members_changed", {
                communityId: community._id,
              });
            } catch {}
          }}
        />
      )}
      {showMediaUpload && (
        <MediaUpload
          currentUser={currentUser}
          recipientUser={{ _id: community._id }}
          onMediaUpload={sendMedia}
          onClose={() => setShowMediaUpload(false)}
        />
      )}
      {viewerMedia && (
        <MediaViewer
          media={viewerMedia}
          mediaType={viewerMediaType}
          allMedia={allMedia}
          currentIndex={currentMediaIndex}
          onClose={() => setViewerMedia(null)}
        />
      )}
    </div>
  );
};

/* ─────────────────── Communities List Panel ─────────────────── */
const CommunitiesPanel = ({ currentUser, onSelectCommunity, selectedCommunityId }) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [active, setActive] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getUserCommunities(currentUser._id);
      setList(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [currentUser._id]);

  if (active) {
    return (
      <CommunityChat
        community={active}
        currentUser={currentUser}
        onBack={() => {
          setActive(null);
          load();
        }}
        onUpdated={load}
      />
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-4 py-2.5 flex items-center justify-between border-b border-gray-100 bg-white">
        <h3 className="m-0 text-sm font-bold text-gray-800 flex items-center gap-2">
          <Users size={16} className="text-purple-600" /> Communities
        </h3>
        <button
          onClick={() => setShowCreate(true)}
          className="px-3 py-1.5 text-xs font-semibold rounded-full text-white inline-flex items-center gap-1"
          style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
        >
          <Plus size={13} /> New
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <p className="text-center text-gray-400 text-xs py-8 m-0">Loading…</p>
        ) : list.length === 0 ? (
          <div className="text-center py-10 px-4">
            <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Users className="w-7 h-7 text-purple-600" />
            </div>
            <p className="text-gray-700 font-medium text-sm m-0">No communities yet</p>
            <p className="text-xs text-gray-500 mt-1 m-0">
              Create one and add your mutual followers.
            </p>
          </div>
        ) : (
          <ul className="list-none p-0 m-0 divide-y divide-gray-100">
            {list.map((c) => (
              <li key={c._id}>
                <button
                  onClick={() => (onSelectCommunity ? onSelectCommunity(c) : setActive(c))}
                  className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${
                    selectedCommunityId === c._id ? "bg-purple-50" : "hover:bg-purple-50"
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
                  >
                    {c.name?.[0]?.toUpperCase() || "C"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="m-0 text-sm font-semibold text-gray-800 truncate">
                      {c.name}
                    </p>
                    <p className="m-0 text-xs text-gray-500 truncate">
                      {(c.members || []).length} members
                      {c.description ? ` · ${c.description}` : ""}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showCreate && (
        <CreateCommunityModal
          currentUser={currentUser}
          onClose={() => setShowCreate(false)}
          onCreated={(c) => setList((p) => [c, ...p])}
        />
      )}
    </div>
  );
};

export default CommunitiesPanel;
