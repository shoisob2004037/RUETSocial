"use client"

import { Link, useNavigate } from "react-router-dom"
import { useState, useEffect, useRef } from "react"
import {
  logoutUser,
  getAllUsers,
  getUserNotifications,
  searchPosts,
  getUserChats,
  getSavedPosts,
} from "../services/api"
import { io } from "socket.io-client"
import ThemeSwitcher from "./ThemeSwitcher"
import {
  Search,
  Bell,
  MessageCircle,
  Menu,
  X,
  Home,
  Calendar,
  Users as UsersIcon,
  Briefcase,
  BarChart3,
  Bookmark,
  LogOut,
  User as UserIcon,
  FileText,
  ChevronDown,
} from "lucide-react"

const DEPARTMENTS = [
  "CSE", "EEE", "ETE", "ECE", "ME", "CE", "IPE",
  "GCE", "MSE", "CFPE", "BECM", "URP", "ARCH",
]

const Navbar = ({ user, setUser }) => {
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)
  const [mode, setMode] = useState("users") // 'users' | 'posts'
  const [query, setQuery] = useState("")
  const [department, setDepartment] = useState("")
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const [unreadNotif, setUnreadNotif] = useState(0)
  const [unreadMsgs, setUnreadMsgs] = useState(0)
  const [savedCount, setSavedCount] = useState(0)

  const searchRef = useRef(null)
  const userMenuRef = useRef(null)
  const inputRef = useRef(null)
  const socketRef = useRef(null)
  const debounceRef = useRef(null)

  /* ---------- click outside ---------- */
  useEffect(() => {
    const onClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target))
        setSearchOpen(false)
      if (userMenuRef.current && !userMenuRef.current.contains(e.target))
        setUserMenuOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  /* ---------- socket for live counters ---------- */
  useEffect(() => {
    if (!user?.user?._id) return
    const socket = io(import.meta.env.VITE_API_URL, {
      transports: ["websocket"],
      reconnection: true,
    })
    socketRef.current = socket
    socket.emit("user_connected", user.user._id)
    const onMsg = () => setUnreadMsgs((c) => c + 1)
    socket.on("receive_message", onMsg)
    return () => {
      socket.off("receive_message", onMsg)
      socket.disconnect()
    }
  }, [user])

  /* ---------- polling counters ---------- */
  useEffect(() => {
    if (!user?.user?._id) return
    const fetchAll = async () => {
      try {
        const [notifs, chats, saved] = await Promise.all([
          getUserNotifications(user.user._id).catch(() => []),
          getUserChats(user.user._id).catch(() => []),
          getSavedPosts(user.user._id).catch(() => []),
        ])
        setUnreadNotif(notifs.filter((n) => !n.read).length)
        setUnreadMsgs(chats.reduce((s, c) => s + (c.unreadCount || 0), 0))
        setSavedCount(saved.length || 0)
      } catch (e) {
        // silent
      }
    }
    fetchAll()
    const id = setInterval(fetchAll, 30000)
    return () => clearInterval(id)
  }, [user])

  /* ---------- search ---------- */
  useEffect(() => {
    if (!searchOpen) return
    if (!query.trim()) {
      setResults([])
      return
    }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        if (mode === "users") {
          const all = await getAllUsers()
          const filtered = all.filter((u) => {
            if (u._id === user?.user?._id) return false
            if (department && u.department !== department) return false
            const full = `${u.firstname} ${u.lastname}`.toLowerCase()
            return full.includes(query.toLowerCase())
          })
          setResults(filtered.slice(0, 8))
        } else {
          const posts = await searchPosts(query)
          setResults((posts || []).slice(0, 8))
        }
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)
  }, [query, mode, department, searchOpen, user])

  /* ---------- handlers ---------- */
  const openSearch = () => {
    setSearchOpen(true)
    setMobileOpen(false)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const handleLogout = () => {
    logoutUser()
    setUser(null)
    navigate("/login")
  }

  const goProfile = (id) => {
    setSearchOpen(false)
    setQuery("")
    navigate(`/profile/${id}`)
  }

  const goPost = (id) => {
    setSearchOpen(false)
    setQuery("")
    navigate(`/post/${id}`)
  }

  if (!user || !user.user) return null

  const navLinks = [
    { to: "/", label: "Home", Icon: Home },
    { to: "/events", label: "Events", Icon: Calendar },
    { to: "/directory", label: "Directory", Icon: UsersIcon },
    { to: "/jobs", label: "Jobs", Icon: Briefcase },
    { to: "/polls", label: "Polls", Icon: BarChart3 },
  ]

  return (
    <>
      <nav className="nav-modern sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo + Mobile menu */}
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => setMobileOpen((v) => !v)}
                className="lg:hidden text-white p-2 rounded-full hover:bg-white/10"
                aria-label="Menu"
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
              <Link to="/" className="flex items-center gap-2 no-underline">
                <img
                  src="/logo.png"
                  alt="RUET Social"
                  className="h-10 w-auto drop-shadow"
                />
                <span className="hidden sm:block text-white font-extrabold tracking-tight text-lg">
                  RUET Social
                </span>
              </Link>
            </div>

            {/* Center: Desktop nav pills */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map(({ to, label, Icon }) => (
                <Link key={to} to={to} className="nav-pill no-underline text-sm">
                  <Icon size={16} />
                  <span>{label}</span>
                </Link>
              ))}
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Unified search */}
              <button
                onClick={openSearch}
                className="text-white p-2 rounded-full hover:bg-white/15 transition"
                aria-label="Search"
              >
                <Search size={20} />
              </button>

              {/* Notifications */}
              <button
                onClick={() => navigate("/notifications")}
                className="relative text-white p-2 rounded-full hover:bg-white/15 transition"
                aria-label="Notifications"
              >
                <Bell size={20} />
                {unreadNotif > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-pink-500 text-white text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 font-bold shadow">
                    {unreadNotif > 9 ? "9+" : unreadNotif}
                  </span>
                )}
              </button>

              {/* Messages */}
              <button
                onClick={() => {
                  setUnreadMsgs(0)
                  navigate("/message")
                }}
                className="relative text-white p-2 rounded-full hover:bg-white/15 transition"
                aria-label="Messages"
              >
                <MessageCircle size={20} />
                {unreadMsgs > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-pink-500 text-white text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 font-bold shadow">
                    {unreadMsgs > 9 ? "9+" : unreadMsgs}
                  </span>
                )}
              </button>

              <div className="hidden sm:block">
                <ThemeSwitcher />
              </div>

              {/* Profile dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-1 p-1 rounded-full hover:bg-white/10"
                >
                  <img
                    src={
                      user.user.profilePicture ||
                      "https://via.placeholder.com/40"
                    }
                    alt=""
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-white/70"
                  />
                  <ChevronDown
                    size={14}
                    className={`text-white hidden sm:block transition-transform ${
                      userMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-fade-in">
                    <div className="p-4 bg-gradient-to-br from-purple-600 to-indigo-700 text-white">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            user.user.profilePicture ||
                            "https://via.placeholder.com/48"
                          }
                          alt=""
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-white"
                        />
                        <div className="min-w-0">
                          <p className="m-0 font-semibold truncate">
                            {user.user.firstname} {user.user.lastname}
                          </p>
                          <p className="m-0 text-xs text-white/80 truncate">
                            {user.user.email}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="py-1">
                      <Link
                        to={`/profile/${user.user._id}`}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 no-underline"
                      >
                        <UserIcon size={16} className="text-purple-600" /> My
                        Profile
                      </Link>
                      <button
                        onClick={() => {
                          navigate("/saved")
                          setUserMenuOpen(false)
                        }}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 w-full text-left"
                      >
                        <Bookmark size={16} className="text-blue-600" /> Saved
                        Posts
                        {savedCount > 0 && (
                          <span className="ml-auto bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full">
                            {savedCount}
                          </span>
                        )}
                      </button>
                      <div className="sm:hidden border-t border-gray-100 mt-1 pt-1 px-3 pb-2">
                        <ThemeSwitcher />
                      </div>
                    </div>
                    <div className="border-t border-gray-100">
                      <button
                        onClick={() => {
                          handleLogout()
                          setUserMenuOpen(false)
                        }}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                      >
                        <LogOut size={16} /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile drawer */}
          {mobileOpen && (
            <div className="lg:hidden pb-3 animate-fade-in">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {navLinks.map(({ to, label, Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 bg-white/15 hover:bg-white/25 rounded-xl text-white no-underline text-sm font-medium"
                  >
                    <Icon size={16} />
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ----------- Search overlay ----------- */}
      {searchOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-20 px-3 sm:px-6 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            ref={searchRef}
            className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Mode tabs */}
            <div className="flex border-b border-gray-100">
              {[
                { id: "users", label: "Users", Icon: UsersIcon },
                { id: "posts", label: "Posts", Icon: FileText },
              ].map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => {
                    setMode(id)
                    setResults([])
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition ${
                    mode === id
                      ? "text-purple-600 border-b-2 border-purple-600 bg-purple-50/60"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>

            {/* Input row */}
            <div className="p-3 sm:p-4 flex flex-col sm:flex-row gap-2">
              <div className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-100">
                <Search size={18} className="text-gray-400" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    mode === "users" ? "Search alumni…" : "Search posts…"
                  }
                  className="flex-1 bg-transparent outline-none text-sm"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="text-gray-400 hover:text-gray-700"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              {mode === "users" && (
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white"
                >
                  <option value="">All Departments</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Results */}
            <div className="max-h-[55vh] overflow-y-auto border-t border-gray-100">
              {loading ? (
                <div className="p-6 text-center text-gray-500 text-sm">
                  Searching…
                </div>
              ) : !query.trim() ? (
                <div className="p-8 text-center text-gray-400 text-sm">
                  Start typing to find{" "}
                  {mode === "users" ? "people" : "posts"}.
                </div>
              ) : results.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">
                  No {mode} found.
                </div>
              ) : mode === "users" ? (
                <ul className="list-none p-0 m-0 divide-y divide-gray-100">
                  {results.map((u) => (
                    <li key={u._id}>
                      <button
                        onClick={() => goProfile(u._id)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-purple-50 text-left"
                      >
                        <img
                          src={
                            u.profilePicture ||
                            "https://via.placeholder.com/40"
                          }
                          alt=""
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="min-w-0">
                          <p className="m-0 font-medium text-gray-900 truncate">
                            {u.firstname} {u.lastname}
                          </p>
                          <p className="m-0 text-xs text-gray-500 truncate">
                            {u.department && `Dept: ${u.department}`}
                            {u.worksAt && ` · ${u.worksAt}`}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className="list-none p-0 m-0 divide-y divide-gray-100">
                  {results.map((p) => {
                    const pu = p.userId || {}
                    return (
                      <li key={p._id}>
                        <button
                          onClick={() => goPost(p._id)}
                          className="w-full p-3 hover:bg-purple-50 text-left"
                        >
                          <p className="m-0 font-medium text-gray-900 text-sm line-clamp-2">
                            {p.desc || "No description"}
                          </p>
                          <p className="m-0 text-xs text-gray-500 mt-1">
                            By {pu.firstname || "Unknown"}{" "}
                            {pu.lastname || ""}
                            {pu.department && ` · ${pu.department}`}
                          </p>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Navbar
