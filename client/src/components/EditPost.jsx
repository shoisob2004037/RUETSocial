import { useState } from "react";
import { updatePost } from "../services/api";
import { uploadToCloudinary } from "../utils/Cloudinary";

const EditPost = ({ show, onHide, post, currentUser, onPostUpdate }) => {
  const [postText, setPostText] = useState(post.desc || "");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(post.image || null);
  const [keepExistingImage, setKeepExistingImage] = useState(!!post.image);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB");
        return;
      }
      setImage(file);
      setKeepExistingImage(false);
      setError("");
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!postText.trim() && !imagePreview) {
      setError("Post cannot be empty");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let imageUrl = keepExistingImage ? post.image : null;
      if (image) {
        console.log("Uploading new post image to Cloudinary...");
        imageUrl = await uploadToCloudinary(image, "post_images");
        console.log("Image uploaded successfully:", imageUrl);
      }

      const updatedPostData = {
        userId: currentUser._id,
        desc: postText,
        image: imageUrl,
      };

      console.log("Updating post with data:", updatedPostData);
      await updatePost(post._id, updatedPostData);

      onPostUpdate({ ...post, ...updatedPostData });
      onHide();
    } catch (err) {
      console.error("Failed to update post:", err);
      setError("Failed to update post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    setKeepExistingImage(false);
    setError("");
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Edit Post</h3>
          <button onClick={onHide} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {error && <div className="bg-red-100 text-red-700 p-2 rounded-lg mb-3">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <textarea
              rows={3}
              placeholder="What's on your mind?"
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 resize-none"
            />
          </div>

          {imagePreview && (
            <div className="relative mb-4">
              <img
                src={imagePreview || "https://via.placeholder.com/200?text=Preview"}
                alt="Preview"
                className="w-full rounded-lg max-h-48 object-cover"
              />
              <button
                onClick={removeImage}
                className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-600"
              >
                ×
              </button>
            </div>
          )}

          <div className="mb-4">
            <label
              htmlFor="edit-image-upload"
              className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 cursor-pointer"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Change Photo
            </label>
            <input
              id="edit-image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onHide}
              disabled={loading}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 rounded-lg text-white ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"}`}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPost;