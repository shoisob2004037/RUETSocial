"use client"

import { useState, useEffect } from "react"
import MediaViewer from "./MediaViewer"
import { getFullMediaUrl } from "../services/api"

const ChatDetails = ({ currentUser, recipientUser, allMedia, onClose }) => {
  const [activeTab, setActiveTab] = useState("media")
  const [viewerMedia, setViewerMedia] = useState(null)
  const [viewerMediaType, setViewerMediaType] = useState(null)
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0)
  const [imageErrors, setImageErrors] = useState({})
  const [validMedia, setValidMedia] = useState([])

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

  const isVideo = (type) => {
    if (!type) return false
    return type.includes("video")
  }

  const images = validMedia.filter(m => !isVideo(m.type))
  const videos = validMedia.filter(m => isVideo(m.type))

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <img
                src={recipientUser.profilePicture || "https://via.placeholder.com/40"}
                className="w-10 h-10 rounded-full object-cover"
                onError={(e) => (e.target.src = "https://via.placeholder.com/40")}
              />
              <div>
                <h3 className="font-semibold text-gray-900">
                  {recipientUser.firstname} {recipientUser.lastname}
                </h3>
                <p className="text-xs text-gray-500">
                  @{recipientUser.username || recipientUser.email?.split("@")[0]}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            <button
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === "media" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("media")}
            >
              Media ({validMedia.length})
            </button>
            <button
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === "info" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("info")}
            >
              Info
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === "media" && (
              <>
                {validMedia.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm">No media shared yet</p>
                  </div>
                ) : (
                  <>
                    {images.length > 0 && (
                      <>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Images ({images.length})</h4>
                        <div className="grid grid-cols-3 gap-2 mb-6">
                          {images.map((media, idx) => {
                            const originalIndex = validMedia.findIndex(m => m.url === media.url)
                            return (
                              <div
                                key={media._id || idx}
                                className="aspect-square cursor-pointer overflow-hidden bg-gray-100 rounded-lg"
                                onClick={() => openMediaViewer(media.url, media.type, originalIndex)}
                              >
                                <img
                                  src={!imageErrors[media.url] ? (media.thumbnail || media.url) : media.url}
                                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                                  onError={(e) => {
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

                    {videos.length > 0 && (
                      <>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Videos ({videos.length})</h4>
                        <div className="grid grid-cols-2 gap-3">
                          {videos.map((media, idx) => {
                            const originalIndex = validMedia.findIndex(m => m.url === media.url)
                            return (
                              <div
                                key={media._id || idx}
                                className="cursor-pointer bg-black rounded-lg overflow-hidden"
                                onClick={() => openMediaViewer(media.url, media.type, originalIndex)}
                              >
                                <video src={media.url} className="w-full h-32 object-cover" muted />
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

            {activeTab === "info" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Name</p>
                    <p className="text-sm font-medium text-gray-900">{recipientUser.firstname} {recipientUser.lastname}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900">{recipientUser.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Joined</p>
                    <p className="text-sm font-medium text-gray-900">{new Date(recipientUser.createdAt).toDateString()}</p>
                  </div>
                </div>

                {recipientUser.department && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Department</p>
                      <p className="text-sm font-medium text-gray-900">{recipientUser.department}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

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