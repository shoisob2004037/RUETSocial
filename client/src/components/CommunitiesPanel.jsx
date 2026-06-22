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
  getMutualFollowers,
  leaveCommunity,
} from "../services/api";
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
const MembersModal = ({ community, currentUser, onClose, onChanged }) => {
  const [members, setMembers] = useState([]);
  const [mutuals, setMutuals] = useState([]);
  const [tab, setTab] = useState("members");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(null);

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

  return (
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
        </div>

        <div className="p-3 border-b">
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-200">
            <Search size={14} className="text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={tab === "members" ? "Search members…" : "Search mutual followers…"}
              className="flex-1 bg-transparent outline-none text-sm"
            />
          </div>
        </div>

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
          ) : filteredAddable.length === 0 ? (
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
          )}
        </div>
      </div>
    </div>
  );
};

/* ─────────────────── Community Chat (real-time) ─────────────────── */
const CommunityChat = ({ community, currentUser, onBack, onUpdated }) => {
  const [c, setC] = useState(community);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [typingUsers, setTypingUsers] = useState({}); // id -> name
  const endRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimerRef = useRef(null);

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
        messages: [...(prev.messages || []), message],
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
                <div
                  className={`max-w-[78%] px-3 py-1.5 rounded-2xl shadow-sm text-sm ${
                    mine
                      ? "text-white rounded-br-md"
                      : "bg-white text-gray-800 border border-gray-100 rounded-bl-md"
                  }`}
                  style={
                    mine
                      ? { background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }
                      : {}
                  }
                >
                  {!mine && (
                    <p className="m-0 text-[11px] font-semibold text-purple-600 mb-0.5">
                      {m.senderName}
                    </p>
                  )}
                  <p className="m-0 break-words whitespace-pre-wrap leading-snug">
                    {m.text}
                  </p>
                  <p
                    className={`m-0 text-[10px] mt-0.5 text-right ${
                      mine ? "text-white/70" : "text-gray-400"
                    }`}
                  >
                    {formatTime(m.createdAt)}
                  </p>
                </div>
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
        className="flex-shrink-0 flex items-center gap-2 px-3 py-2.5 border-t border-gray-100 bg-white"
        style={{ paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))" }}
      >
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
    </div>
  );
};

/* ─────────────────── Communities List Panel ─────────────────── */
const CommunitiesPanel = ({ currentUser }) => {
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
                  onClick={() => setActive(c)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-purple-50 text-left"
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
