import { useState } from "react";
import { createPost } from "../services/api";
import { uploadToCloudinary } from "../utils/Cloudinary";

const CreatePost = ({ user, onPostCreated }) => {
  const [postText, setPostText] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hashtags, setHashtags] = useState([]);

  // Extract hashtags from text
  const extractHashtags = (text) => {
    const hashtagRegex = /#\w+/g;
    const matches = text.match(hashtagRegex) || [];
    return [...new Set(matches.map((tag) => tag.toLowerCase()))]; // Remove duplicates and make lowercase
  };

  const handleTextChange = (e) => {
    const text = e.target.value;
    setPostText(text);
    setHashtags(extractHashtags(text));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB");
        return;
      }
      if (!file.type.match("image.*")) {
        setError("Please select an image file");
        return;
      }
      setImage(file);
      setError("");
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!postText.trim() && !image) return;

    setLoading(true);
    setError("");

    try {
      let imageUrl = null;
      if (image) {
        console.log("Uploading post image to Cloudinary...");
        imageUrl = await uploadToCloudinary(image, "post_images");
        console.log("Image uploaded successfully:", imageUrl);
      }

      const newPost = {
        userId: user.user._id,
        desc: postText,
        image: imageUrl,
        tags: hashtags,
      };

      console.log("Creating new post with data:", newPost);
      const createdPost = await createPost(newPost);
      console.log("Post created successfully:", createdPost);

      onPostCreated({
        ...newPost,
        _id: createdPost._id || Date.now().toString(),
        likes: [],
        comments: [],
        createdAt: new Date().toISOString(),
        user: {
          _id: user.user._id,
          firstname: user.user.firstname,
          lastname: user.user.lastname,
          profilePicture: user.user.profilePicture,
        },
      });

      setPostText("");
      setImage(null);
      setImagePreview(null);
      setHashtags([]);
    } catch (err) {
      console.error("Failed to create post:", err);
      setError(err.response?.data?.message || "Failed to create post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    setError("");
  };

  // Highlight hashtags in the text
  const highlightHashtags = (text) => {
    if (!text) return text;
    return text.replace(/#\w+/g, '<span class="text-blue-500">$&</span>');
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-4 mb-4">
      {error && (
        <div className="bg-red-100 text-red-700 p-2 rounded-lg mb-3">{error}</div>
      )}
      <div className="flex space-x-3">
        <img
          src={user.user.profilePicture || "https://via.placeholder.com/40"}
          alt={`${user.user.firstname} ${user.user.lastname}`}
          className="w-10 h-10 rounded-full"
        />
        <form onSubmit={handleSubmit} className="flex-1">
          <div className="mb-3">
            <textarea
              rows={3}
              placeholder={`What's on your mind, ${user.user.firstname}?`}
              value={postText}
              onChange={handleTextChange}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 whitespace-pre-wrap resize-none"
            />
            {postText && (
              <div
                className="mt-2 p-2 bg-gray-100 rounded-lg text-gray-800"
                dangerouslySetInnerHTML={{ __html: highlightHashtags(postText) }}
              />
            )}
            {hashtags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                <span className="text-sm text-gray-500">Tags:</span>
                {hashtags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {imagePreview && (
            <div className="relative mb-3">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full max-h-[300px] object-cover rounded-lg"
              />
              <button
                onClick={removeImage}
                className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-600 transition-colors"
              >
                ×
              </button>
            </div>
          )}

          <div className="flex justify-between items-center">
            <div>
              <label
                htmlFor="image-upload"
                className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <svg
                  className="w-5 h-5 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Photo
              </label>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            <div className="flex items-center space-x-2">
              {image && <span className="text-sm text-gray-500">1 photo selected</span>}
              <button
                type="submit"
                disabled={loading || (!postText.trim() && !image)}
                className={`px-4 py-2 rounded-lg text-white ${
                  loading || (!postText.trim() && !image)
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600"
                } transition-colors flex items-center`}
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin w-5 h-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Posting...
                  </>
                ) : (
                  "Post"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;