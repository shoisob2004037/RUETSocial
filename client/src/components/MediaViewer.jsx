"use client"

import { useState, useEffect } from "react"
import { X, ChevronLeft, ChevronRight, Download } from "react-bootstrap-icons"

const MediaViewer = ({ media, mediaType, onClose, allMedia = [], currentIndex = 0 }) => {
  const [currentMedia, setCurrentMedia] = useState(media)
  const [currentMediaType, setCurrentMediaType] = useState(mediaType)
  const [currentIdx, setCurrentIdx] = useState(currentIndex)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft') {
        handlePrevious()
      } else if (e.key === 'ArrowRight') {
        handleNext()
      } else if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentIdx, allMedia])

  useEffect(() => {
    setCurrentMedia(media)
    setCurrentMediaType(mediaType)
    setCurrentIdx(currentIndex)
    setIsLoading(true)
    setError(false)
  }, [media, mediaType, currentIndex])

  const handlePrevious = () => {
    if (allMedia.length > 0 && currentIdx > 0) {
      const prev = allMedia[currentIdx - 1]
      setCurrentMedia(prev.url)
      setCurrentMediaType(prev.type)
      setCurrentIdx(currentIdx - 1)
      setIsLoading(true)
      setError(false)
    }
  }

  const handleNext = () => {
    if (allMedia.length > 0 && currentIdx < allMedia.length - 1) {
      const next = allMedia[currentIdx + 1]
      setCurrentMedia(next.url)
      setCurrentMediaType(next.type)
      setCurrentIdx(currentIdx + 1)
      setIsLoading(true)
      setError(false)
    }
  }

  const handleDownload = () => {
    window.open(currentMedia, '_blank')
  }

  const handleMediaLoad = () => {
    setIsLoading(false)
    setError(false)
  }

  const handleMediaError = () => {
    setIsLoading(false)
    setError(true)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors duration-200 z-10 bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75"
      >
        <X className="w-6 h-6" />
      </button>

      <button
        onClick={handleDownload}
        className="absolute top-4 left-4 text-white hover:text-gray-300 transition-colors duration-200 z-10 bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75"
      >
        <Download className="w-6 h-6" />
      </button>

      {allMedia.length > 1 && currentIdx > 0 && (
        <button
          onClick={handlePrevious}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors duration-200 bg-black bg-opacity-50 rounded-full p-3 hover:bg-opacity-75"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      )}

      {allMedia.length > 1 && currentIdx < allMedia.length - 1 && (
        <button
          onClick={handleNext}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors duration-200 bg-black bg-opacity-50 rounded-full p-3 hover:bg-opacity-75"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      )}

      <div className="max-w-7xl max-h-screen p-4 flex items-center justify-center">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        {error ? (
          <div className="text-center text-white">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p className="text-lg">Failed to load media</p>
            <p className="text-sm text-gray-400 mt-2">The media might have been deleted or moved</p>
          </div>
        ) : currentMediaType === 'image' ? (
          <img 
            src={currentMedia} 
            alt="Media" 
            className="max-w-full max-h-screen object-contain"
            onLoad={handleMediaLoad}
            onError={handleMediaError}
            style={{ display: isLoading ? 'none' : 'block' }}
          />
        ) : (
          <video 
            src={currentMedia}
            controls
            autoPlay
            className="max-w-full max-h-screen"
            onLoadedData={handleMediaLoad}
            onError={handleMediaError}
            style={{ display: isLoading ? 'none' : 'block' }}
          >
            Your browser does not support the video tag.
          </video>
        )}
      </div>

      {allMedia.length > 1 && !error && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 rounded-full px-4 py-2 text-sm">
          {currentIdx + 1} / {allMedia.length}
        </div>
      )}
    </div>
  )
}

export default MediaViewer