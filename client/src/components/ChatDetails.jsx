"use client"

import { useState, useEffect } from "react"
import { X, Image, CameraVideo, Person, Calendar, Envelope } from "react-bootstrap-icons"
import MediaViewer from "./MediaViewer"
import { getFullMediaUrl } from "../services/api"

const ChatDetails = ({ currentUser, recipientUser, allMedia, onClose }) => {
  const [activeTab, setActiveTab] = useState("media")
  const [viewerMedia, setViewerMedia] = useState(null)
  const [viewerMediaType, setViewerMediaType] = useState(null)
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0)
  const [imageErrors, setImageErrors] = useState({})
  const [validMedia, setValidMedia] = useState([])

  // ✅ Normalize + validate media
  useEffect(() => {
    const valid = allMedia
      .filter(media => media && media.url)
      .map(media => ({
        ...media,
        url: getFullMediaUrl(media.url),
        thumbnail: media.thumbnail ? getFullMediaUrl(media.thumbnail) : null
      }))

    setValidMedia(valid)
  }, [allMedia])

  const openMediaViewer = (mediaUrl, mediaType, index) => {
    setViewerMedia(mediaUrl)
    setViewerMediaType(mediaType)
    setCurrentMediaIndex(index)
  }

  const handleImageError = (url) => {
    setImageErrors(prev => ({ ...prev, [url]: true }))
  }

  // ✅ FIX: correct type detection
  const isVideo = (type) => {
    if (!type) return false
    return type.includes("video")
  }

  const images = validMedia.filter(m => !isVideo(m.type))
  const videos = validMedia.filter(m => isVideo(m.type))

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">

          {/* Header */}
          <div className="p-5 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <img
                src={recipientUser.profilePicture || "https://via.placeholder.com/40"}
                className="w-8 h-8 rounded-full object-cover"
                onError={(e) => (e.target.src = "https://via.placeholder.com/40")}
              />
              <div>
                <h3 className="text-lg font-semibold">
                  {recipientUser.firstname} {recipientUser.lastname}
                </h3>
                <p className="text-xs text-gray-500">
                  @{recipientUser.username || recipientUser.email?.split("@")[0]}
                </p>
              </div>
            </div>

            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b">
            <button
              className={`flex-1 py-3 ${activeTab === "media" ? "text-purple-600 border-b-2 border-purple-600" : ""}`}
              onClick={() => setActiveTab("media")}
            >
              Media ({validMedia.length})
            </button>

            <button
              className={`flex-1 py-3 ${activeTab === "info" ? "text-purple-600 border-b-2 border-purple-600" : ""}`}
              onClick={() => setActiveTab("info")}
            >
              Info
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5">

            {activeTab === "media" && (
              <>
                {validMedia.length === 0 ? (
                  <p className="text-center text-gray-500">No media</p>
                ) : (
                  <>
                    {/* IMAGES */}
                    {images.length > 0 && (
                      <>
                        <h4 className="mb-2 font-semibold">Images ({images.length})</h4>

                        <div className="grid grid-cols-3 gap-2">
                          {images.map((media, idx) => {
                            const originalIndex = validMedia.findIndex(m => m.url === media.url)

                            return (
                              <div
                                key={media._id || idx}
                                className="aspect-square cursor-pointer overflow-hidden bg-gray-100"
                                onClick={() => openMediaViewer(media.url, media.type, originalIndex)}
                              >
                                <img
                                  src={
                                    !imageErrors[media.url]
                                      ? (media.thumbnail || media.url)
                                      : media.url
                                  }
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    // 🔥 fallback to original if thumbnail fails
                                    if (e.target.src !== media.url) {
                                      e.target.src = media.url
                                    } else {
                                      handleImageError(media.url)
                                    }
                                  }}
                                />
                              </div>
                            )
                          })}
                        </div>
                      </>
                    )}

                    {/* VIDEOS */}
                    {videos.length > 0 && (
                      <>
                        <h4 className="mt-5 mb-2 font-semibold">Videos ({videos.length})</h4>

                        <div className="grid grid-cols-2 gap-3">
                          {videos.map((media, idx) => {
                            const originalIndex = validMedia.findIndex(m => m.url === media.url)

                            return (
                              <div
                                key={media._id || idx}
                                className="cursor-pointer bg-black"
                                onClick={() => openMediaViewer(media.url, media.type, originalIndex)}
                              >
                                <video
                                  src={media.url}
                                  className="w-full h-32 object-cover"
                                  muted
                                />
                              </div>
                            )
                          })}
                        </div>
                      </>
                    )}
                  </>
                )}
              </>
            )}

            {/* INFO TAB */}
            {activeTab === "info" && (
              <div className="space-y-3">
                <p><b>Name:</b> {recipientUser.firstname} {recipientUser.lastname}</p>
                <p><b>Email:</b> {recipientUser.email}</p>
                <p><b>Joined:</b> {new Date(recipientUser.createdAt).toDateString()}</p>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Viewer */}
      {viewerMedia && (
        <MediaViewer
          media={viewerMedia}
          mediaType={viewerMediaType}
          allMedia={validMedia}
          currentIndex={currentMediaIndex}
          onClose={() => setViewerMedia(null)}
        />
      )}
    </>
  )
}

export default ChatDetails