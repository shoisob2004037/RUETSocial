"use client";

import { useEffect, useRef, useState } from "react";
import {
  getUserCommunities,
  createCommunity,
  getCommunity,
  addCommunityMember,
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
        const data = await getMutualFollowers(currentUser._id);
        setMutuals(data || []);
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
    } catch (err) {
      alert("Failed to create community");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold m-0">New Community</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={submit} className="p-4 space-y-3">
          <input
            required
            placeholder="Community name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-purple-500"
          />
          <textarea
            rows={2}
            placeholder="Short description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-purple-500"
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
                      src={
                        u.profilePicture ||
                        "https://via.placeholder.com/40"
                      }
                      alt=""
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="m-0 text-sm font-medium text-gray-800 truncate">
                        {u.firstname} {u.lastname}
                      </p>
                      {u.department && (
                        <p className="m-0 text-xs text-gray-500">
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

const AddMemberModal = ({ community, currentUser, onClose, onUpdated }) => {
  const [mutuals, setMutuals] = useState([]);
  const [adding, setAdding] = useState(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await getMutualFollowers(currentUser._id);
        const memberSet = new Set((community.members || []).map(String));
        setMutuals((data || []).filter((u) => !memberSet.has(String(u._id))));
      } catch (e) {
        console.error(e);
      }
    })();
  }, [currentUser._id, community.members]);

  const add = async (uid) => {
    setAdding(uid);
    try {
      const updated = await addCommunityMember(community._id, currentUser._id, uid);
      onUpdated(updated);
      setMutuals((prev) => prev.filter((u) => u._id !== uid));
    } catch (e) {
      alert(e?.response?.data?.message || "Could not add member");
    } finally {
      setAdding(null);
    }
  };

  const filtered = mutuals.filter((u) =>
    `${u.firstname} ${u.lastname}`.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold m-0">Add Members</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>
        <div className="p-3 border-b">
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-200">
            <Search size={14} className="text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search mutual followers…"
              className="flex-1 bg-transparent outline-none text-sm"
            />
          </div>
          <p className="text-[11px] text-gray-500 mt-2 m-0">
            Only people who follow you back appear here.
          </p>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8 m-0">
              No one available to add.
            </p>
          ) : (
            filtered.map((u) => (
              <div
                key={u._id}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 border-b border-gray-50 last:border-0"
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
                    <p className="m-0 text-xs text-gray-500">{u.department}</p>
                  )}
                </div>
                <button
                  disabled={adding === u._id}
                  onClick={() => add(u._id)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-full text-white disabled:opacity-60"
                  style={{
                    background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
                  }}
                >
                  {adding === u._id ? "Adding…" : "Add"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const CommunityChat = ({ community, currentUser, onBack, onUpdated }) => {
  const [c, setC] = useState(community);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const fresh = await getCommunity(community._id);
        setC(fresh);
      } catch {}
    })();
  }, [community._id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [c?.messages?.length]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      const res = await sendCommunityMessage(c._id, {
        senderId: currentUser._id,
        senderName: `${currentUser.firstname} ${currentUser.lastname}`,
        senderAvatar: currentUser.profilePicture || "",
        text,
      });
      setC((prev) => ({ ...prev, messages: [...(prev.messages || []), res.message] }));
      setText("");
    } finally {
      setSending(false);
    }
  };

  const leave = async () => {
    if (!confirm("Leave this community?")) return;
    try {
      await leaveCommunity(c._id, currentUser._id);
      onUpdated();
      onBack();
    } catch (e) {
      alert("Failed to leave");
    }
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 sm:px-4 py-3 text-white"
        style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
        <button
          onClick={onBack}
          className="p-1.5 rounded-full hover:bg-white/20"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">
          {c.name?.[0]?.toUpperCase() || "C"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="m-0 font-semibold truncate">{c.name}</p>
          <p className="m-0 text-xs text-white/80">
            {(c.members || []).length} members
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="p-2 rounded-full hover:bg-white/20"
          title="Add member"
        >
          <UserPlus size={18} />
        </button>
        <button
          onClick={leave}
          className="p-2 rounded-full hover:bg-white/20"
          title="Leave community"
        >
          <LogOut size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-gray-50">
        {(c.messages || []).length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-10 m-0">
            No messages yet. Say hi 👋
          </p>
        ) : (
          (c.messages || []).map((m, i) => {
            const mine = m.sender === currentUser._id;
            return (
              <div
                key={m._id || i}
                className={`flex gap-2 mb-3 ${mine ? "justify-end" : "justify-start"}`}
              >
                {!mine && (
                  <img
                    src={
                      m.senderAvatar ||
                      "https://via.placeholder.com/32"
                    }
                    alt=""
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                  />
                )}
                <div
                  className={`max-w-[75%] px-3 py-2 rounded-2xl shadow-sm text-sm ${
                    mine
                      ? "text-white rounded-br-md"
                      : "bg-white text-gray-800 border border-gray-100 rounded-bl-md"
                  }`}
                  style={
                    mine
                      ? {
                          background:
                            "linear-gradient(135deg,#7c3aed,#4f46e5)",
                        }
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
                    className={`m-0 text-[10px] mt-1 ${
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
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <form
        onSubmit={send}
        className="flex items-center gap-2 p-3 border-t border-gray-100 bg-white"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 text-sm"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="w-10 h-10 rounded-full inline-flex items-center justify-center text-white disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
        >
          <Send size={18} />
        </button>
      </form>

      {showAdd && (
        <AddMemberModal
          community={c}
          currentUser={currentUser}
          onClose={() => setShowAdd(false)}
          onUpdated={(updated) => setC(updated)}
        />
      )}
    </div>
  );
};

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
        onBack={() => setActive(null)}
        onUpdated={load}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100 bg-white">
        <h3 className="m-0 font-bold text-gray-800 flex items-center gap-2">
          <Users size={18} className="text-purple-600" /> Communities
        </h3>
        <button
          onClick={() => setShowCreate(true)}
          className="px-3 py-1.5 text-xs font-semibold rounded-full text-white inline-flex items-center gap-1"
          style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
        >
          <Plus size={14} /> New
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <p className="text-center text-gray-400 text-sm py-10 m-0">Loading…</p>
        ) : list.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-gray-700 font-medium m-0">No communities yet</p>
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
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shrink-0"
                    style={{
                      background:
                        "linear-gradient(135deg,#7c3aed,#4f46e5)",
                    }}
                  >
                    {c.name?.[0]?.toUpperCase() || "C"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="m-0 font-semibold text-gray-800 truncate">
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
