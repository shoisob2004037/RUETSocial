"use client"

import { useState, useRef } from "react"
import { uploadChatMedia } from "../services/api"
import { X, Image, Video, Upload, Trash2 } from "lucide-react"

const MediaUpload = ({ currentUser, recipientUser, onMediaUpload, onClose }) => {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [mediaType, setMediaType] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    const isValidImage = file.type.startsWith('image/')
    const isValidVideo = file.type.startsWith('video/')
    
    if (!isValidImage && !isValidVideo) {
      alert("Please select an image or video file")
      return
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      alert("File size must be less than 50MB")
      return
    }

    setSelectedFile(file)
    setMediaType(isValidVideo ? 'video' : 'image')
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    setUploadProgress(0)

    try {
      // Simulate progress
      const interval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const result = await uploadChatMedia(selectedFile, currentUser._id, recipientUser._id)
      
      clearInterval(interval)
      setUploadProgress(100)
      
      setTimeout(() => {
        onMediaUpload(result.media)
        onClose()
      }, 500)
    } catch (error) {
      console.error("Upload error:", error)
      alert(error.message || "Failed to upload media")
      setUploading(false)
    }
  }

  const removeSelectedFile = () => {
    setSelectedFile(null)
    setPreview(null)
    setMediaType(null)
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-fade-in-up">
        <div className="p-5 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            {mediaType === 'image' ? (
              <Image className="w-5 h-5 text-purple-600" />
            ) : mediaType === 'video' ? (
              <Video className="w-5 h-5 text-purple-600" />
            ) : (
              <Upload className="w-5 h-5 text-purple-600" />
            )}
            <h3 className="text-xl font-semibold text-gray-900">
              {uploading ? "Uploading..." : "Share Media"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200 rounded-full p-1 hover:bg-gray-100"
            disabled={uploading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {!uploading && !preview && (
            <div
              onClick={() => fileInputRef.current.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all duration-200"
            >
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-gray-700 font-medium mb-2">Click to select an image or video</p>
              <p className="text-sm text-gray-500">Supports JPG, PNG, GIF, MP4 (Max 50MB)</p>
            </div>
          )}

          {preview && (
            <div className="relative">
              <div className="relative rounded-xl overflow-hidden bg-gray-100">
                {mediaType === 'image' ? (
                  <img 
                    src={preview} 
                    alt="Preview" 
                    className="w-full max-h-96 object-contain"
                  />
                ) : (
                  <video 
                    src={preview} 
                    className="w-full max-h-96 object-contain"
                    controls
                  />
                )}
                
                {!uploading && (
                  <button
                    onClick={removeSelectedFile}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors duration-200 shadow-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {uploading && (
                <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center rounded-xl">
                  <div className="text-center text-white">
                    <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="font-semibold text-lg">Uploading {uploadProgress}%</p>
                    <p className="text-sm text-gray-300 mt-1">Please wait...</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        <div className="p-5 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-5 py-2.5 text-gray-700 hover:text-gray-900 transition-colors duration-200 font-medium rounded-lg hover:bg-gray-100"
          >
            Cancel
          </button>
          {preview && !uploading && (
            <button
              onClick={handleUpload}
              className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 font-medium flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Send</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default MediaUpload