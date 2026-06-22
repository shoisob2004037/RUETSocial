"use client"

import { useEffect, useState } from "react"

/**
 * Lightweight client-side like button for profile & cover photos.
 * Persists per-photo likes in localStorage so it works without backend changes.
 *
 * Props:
 *   photoId  – string (unique key, e.g. `${userId}-cover` or `${userId}-avatar`)
 *   label    – optional text label (default "Like")
 */
const PhotoLikeButton = ({ photoId, label = "Like" }) => {
  const storageKey = `photo_like_${photoId}`
  const countKey   = `photo_like_count_${photoId}`

  const [liked, setLiked] = useState(false)
  const [count, setCount] = useState(0)

  useEffect(() => {
    setLiked(localStorage.getItem(storageKey) === "1")
    setCount(parseInt(localStorage.getItem(countKey) || "0", 10))
  }, [storageKey, countKey])

  const toggle = (e) => {
    e.stopPropagation()
    e.preventDefault()
    const next = !liked
    const nextCount = Math.max(0, count + (next ? 1 : -1))
    setLiked(next)
    setCount(nextCount)
    if (next) localStorage.setItem(storageKey, "1")
    else localStorage.removeItem(storageKey)
    localStorage.setItem(countKey, String(nextCount))
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`photo-like-btn ${liked ? "liked" : ""}`}
      aria-pressed={liked}
      title={liked ? "Unlike" : label}
    >
      <span className="heart">{liked ? "❤️" : "🤍"}</span>
      <span>{count}</span>
    </button>
  )
}

export default PhotoLikeButton
