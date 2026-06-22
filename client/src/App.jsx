"use client"

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { useState, useEffect } from "react"
import "bootstrap/dist/css/bootstrap.min.css"
import "./App.css"
import Home from "./pages/Home"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Profile from "./pages/Profile"
import NotFound from "./pages/NotFound"
import MessagesPage from "./pages/Message"
import HashtagPage from "./pages/HashtagPage"
import NotificationsPage from "./pages/NotificationsPage"
import PostPage from "./pages/PostPage"
import SavedPosts from "./pages/SavedPosts"
import Events from "./pages/Events"
import Directory from "./pages/Directory"
import Jobs from "./pages/Jobs"
import Polls from "./pages/Polls"

// Components
import Navbar from "./components/Navbar"
import ProtectedRoute from "./components/ProtectedRoute"
import ScrollToTop from "./components/ScrollToTop"
import { applyStoredTheme } from "./components/ThemeSwitcher"

function App() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    applyStoredTheme()
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  return (
    <BrowserRouter>
      {user && <Navbar user={user} setUser={setUser} />}
      <div className="container mt-4">
        <Routes>
          <Route path="/login" element={!user ? <Login setUser={setUser} /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Register setUser={setUser} /> : <Navigate to="/" />} />
          <Route path="/" element={<ProtectedRoute user={user}><Home user={user} /></ProtectedRoute>} />
          <Route path="/profile/:id" element={<ProtectedRoute user={user}><Profile user={user} /></ProtectedRoute>} />
          <Route path="/hashtag/:tag" element={<ProtectedRoute user={user}><HashtagPage user={user} /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute user={user}><NotificationsPage user={user} /></ProtectedRoute>} />
          <Route path="/post/:id" element={<ProtectedRoute user={user}><PostPage user={user} /></ProtectedRoute>} />
          <Route path="/message" element={<ProtectedRoute user={user}><MessagesPage user={user} /></ProtectedRoute>} />
          <Route path="/message/:userId" element={<ProtectedRoute user={user}><MessagesPage user={user} /></ProtectedRoute>} />
          <Route path="/saved" element={<ProtectedRoute user={user}><SavedPosts user={user} /></ProtectedRoute>} />
          <Route path="/events" element={<ProtectedRoute user={user}><Events user={user} /></ProtectedRoute>} />
          <Route path="/directory" element={<ProtectedRoute user={user}><Directory user={user} /></ProtectedRoute>} />
          <Route path="/jobs" element={<ProtectedRoute user={user}><Jobs user={user} /></ProtectedRoute>} />
          <Route path="/polls" element={<ProtectedRoute user={user}><Polls user={user} /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      {user && <ScrollToTop />}
    </BrowserRouter>
  )
}

export default App
