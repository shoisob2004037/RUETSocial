import axios from "axios";

// Function to upload image to Cloudinary using an unsigned upload preset
export const uploadToCloudinary = async (file, folder = "social_media") => {
  try {
    // Validate input
    if (!file) {
      throw new Error("No file provided for upload");
    }

    // Create a FormData object to send the file
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "social_media_unsigned"); // Replace with your unsigned upload preset
    formData.append("folder", folder);

    // Log upload details for debugging
    console.log("Uploading to Cloudinary:", {
      cloudName: "dz65i4xib", // Replace with your Cloudinary cloud name
      folder,
      fileName: file.name,
      fileSize: file.size,
    });

    // Make a POST request to Cloudinary's upload API
    const response = await axios.post(
      "https://api.cloudinary.com/v1_1/dz65i4xib/image/upload", // Replace 'dz65i4xib' with your cloud name
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    // Log response for debugging
    console.log("Cloudinary response:", response.data);

    // Return the secure URL of the uploaded image
    return response.data.secure_url;
  } catch (error) {
    // Enhanced error handling
    console.error(
      "Error uploading image to Cloudinary:",
      error.response?.data || error.message
    );
    throw new Error(
      `Failed to upload image: ${error.response?.data?.error?.message || error.message}`
    );
  }
};