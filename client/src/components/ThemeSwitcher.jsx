"use client"

import { useEffect, useState, useRef } from "react"

const THEMES = [
  { id: "indigo",   color: "#7c3aed", label: "Indigo" },
  { id: "sunset",   color: "#f97316", label: "Sunset" },
  { id: "ocean",    color: "#06b6d4", label: "Ocean" },
  { id: "forest",   color: "#10b981", label: "Forest" },
  { id: "rose",     color: "#ec4899", label: "Rose" },
  { id: "midnight", color: "#1e293b", label: "Midnight" },
]

export const applyStoredTheme = () => {
  const theme = localStorage.getItem("ruet_theme") || "indigo"
  const mode  = localStorage.getItem("ruet_mode")  || "light"
  document.documentElement.setAttribute("data-theme", theme)
  document.documentElement.setAttribute("data-mode", mode)
}

const ThemeSwitcher = () => {
  const [open, setOpen] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem("ruet_theme") || "indigo")
  const [mode,  setMode]  = useState(() => localStorage.getItem("ruet_mode")  || "light")
  const ref = useRef(null)

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
    localStorage.setItem("ruet_theme", theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.setAttribute("data-mode", mode)
    localStorage.setItem("ruet_mode", mode)
  }, [mode])

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Change theme"
        title="Theme & appearance"
        className="theme-mode-btn"
      >
        {mode === "dark" ? "🌙" : "🎨"}
      </button>
      {open && (
        <div
          className="absolute right-0 mt-2 p-3 rounded-2xl shadow-xl z-50 animate-fade-in"
          style={{
            background: "var(--bg-soft)",
            border: "1px solid var(--border)",
            minWidth: 240,
            color: "var(--text)",
          }}
        >
          <div className="text-xs uppercase tracking-wide mb-2" style={{ color: "var(--text-mute)" }}>
            Theme color
          </div>
          <div className="theme-switcher" style={{ background: "transparent", border: "none", padding: 0 }}>
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                aria-label={t.label}
                title={t.label}
                className={`theme-dot ${theme === t.id ? "active" : ""}`}
                style={{ background: t.color, borderColor: theme === t.id ? "var(--brand-2)" : "var(--border-strong)" }}
              />
            ))}
          </div>
          <div className="divider" />
          <div className="text-xs uppercase tracking-wide mb-2" style={{ color: "var(--text-mute)" }}>
            Appearance
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setMode("light")}
              className="btn btn-pill"
              style={{
                background: mode === "light" ? "var(--brand-gradient)" : "transparent",
                color: mode === "light" ? "#fff" : "var(--text)",
                border: "1px solid var(--border-strong)",
                flex: 1,
              }}
            >
              ☀️ Light
            </button>
            <button
              onClick={() => setMode("dark")}
              className="btn btn-pill"
              style={{
                background: mode === "dark" ? "var(--brand-gradient)" : "transparent",
                color: mode === "dark" ? "#fff" : "var(--text)",
                border: "1px solid var(--border-strong)",
                flex: 1,
              }}
            >
              🌙 Dark
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ThemeSwitcher
