"use client";

import { useState, useEffect } from "react";
import { updateUser } from "../services/api";
import { uploadToCloudinary } from "../utils/Cloudinary.js";
import LocationAutocomplete from "./LocationAutoComplete.jsx";

const EditProfile = ({ show, onHide, user, onProfileUpdate }) => {
  const [formData, setFormData] = useState({
    firstname: user.firstname || "",
    lastname: user.lastname || "",
    about: user.about || "",
    livesin: user.livesin || "",
    worksAt: user.worksAt || "",
    relationship: user.relationship || "",
    university: user.university || "",
    department: user.department || "",
    profilePicture: user.profilePicture || "",
    coverPicture: user.coverPicture || "",
  });

  const [profileImageFile, setProfileImageFile] = useState(null);
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(user.profilePicture || "");
  const [coverImagePreview, setCoverImagePreview] = useState(user.coverPicture || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setFormData({
      firstname: user.firstname || "",
      lastname: user.lastname || "",
      about: user.about || "",
      livesin: user.livesin || "",
      worksAt: user.worksAt || "",
      relationship: user.relationship || "",
      university: user.university || "",
      department: user.department || "",
      profilePicture: user.profilePicture || "",
      coverPicture: user.coverPicture || "",
    });
    setProfileImagePreview(user.profilePicture || "");
    setCoverImagePreview(user.coverPicture || "");
  }, [user, show]);

  const inputClass =
    "w-full rounded-xl border border-emerald-200 bg-white text-gray-900 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200";

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileImageFile(file);
    setProfileImagePreview(URL.createObjectURL(file));
  };

  const handleCoverPictureChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverImageFile(file);
    setCoverImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const updatedData = { ...formData };

      if (profileImageFile) {
        const profileImageUrl = await uploadToCloudinary(profileImageFile, "profile_pictures");
        updatedData.profilePicture = profileImageUrl;
      }

      if (coverImageFile) {
        const coverImageUrl = await uploadToCloudinary(coverImageFile, "cover_pictures");
        updatedData.coverPicture = coverImageUrl;
      }

      const updatedUser = await updateUser(user._id, {
        ...updatedData,
        currentUserId: user._id,
        currentUserAdminStatus: user.isAdmin || false,
      });

      onProfileUpdate(updatedUser);
      onHide();
    } catch (err) {
      setError(`Failed to update profile: ${err.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (profileImagePreview?.startsWith("blob:")) URL.revokeObjectURL(profileImagePreview);
      if (coverImagePreview?.startsWith("blob:")) URL.revokeObjectURL(coverImagePreview);
    };
  }, [profileImagePreview, coverImagePreview]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm p-3 sm:p-4 flex items-center justify-center">
      <div className="w-full max-w-3xl max-h-[92dvh] overflow-y-auto rounded-2xl border border-emerald-200 bg-[#ecfdf3] shadow-2xl">
        <div className="sticky top-0 z-10 bg-emerald-900 text-white px-4 sm:px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl sm:text-2xl font-bold">Edit Profile</h3>
          <button onClick={onHide} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-4 sm:px-6 py-5 sm:py-6 space-y-7">
          <section className="space-y-5">
            <h5 className="text-lg font-semibold text-gray-900">Profile Picture</h5>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <div className="relative w-fit mx-auto sm:mx-0">
                <img
                  src={profileImagePreview || "https://via.placeholder.com/100"}
                  alt="Profile preview"
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                />
                <label className="absolute -bottom-2 -right-2 cursor-pointer bg-emerald-600 hover:bg-emerald-700 rounded-full p-2 shadow-lg transition-colors">
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <input type="file" accept="image/*" onChange={handleProfilePictureChange} className="hidden" />
                </label>
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Update profile photo</label>
                <p className="text-xs text-gray-500 mb-2">Recommended size: 300x300px</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-100 file:text-emerald-800 file:px-4 file:py-2 file:font-medium hover:file:bg-emerald-200"
                />
              </div>
            </div>

            <h5 className="text-lg font-semibold text-gray-900">Cover Photo</h5>
            <div className="space-y-3">
              <div
                className="h-36 sm:h-40 w-full rounded-xl overflow-hidden border border-emerald-200 bg-emerald-50 relative group"
                style={{
                  backgroundImage: coverImagePreview ? `url(${coverImagePreview})` : "none",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <label className="cursor-pointer bg-white/20 backdrop-blur rounded-full p-3 hover:bg-white/30 transition-colors">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <input type="file" accept="image/*" onChange={handleCoverPictureChange} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-xs text-gray-500">Recommended size: 1200x300px</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverPictureChange}
                  className="block w-full sm:w-auto text-sm text-gray-700 file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-100 file:text-emerald-800 file:px-4 file:py-2 file:font-medium hover:file:bg-emerald-200"
                />
              </div>
            </div>
          </section>

          <section className="space-y-5">
            <h5 className="text-lg font-semibold text-gray-900">Personal Information</h5>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input type="text" name="firstname" value={formData.firstname} onChange={handleChange} required className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input type="text" name="lastname" value={formData.lastname} onChange={handleChange} required className={inputClass} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">About</label>
              <textarea
                rows={3}
                name="about"
                value={formData.about}
                onChange={handleChange}
                placeholder="Tell us about yourself"
                className={`${inputClass} resize-none`}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <LocationAutocomplete
                name="livesin"
                value={formData.livesin}
                onChange={handleChange}
                placeholder="City, Country"
                label="Lives In"
                className={inputClass}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Relationship Status</label>
                <div className="relative">
                  <select
                    name="relationship"
                    value={formData.relationship}
                    onChange={handleChange}
                    size={1}
                    className={`edit-profile-select ${inputClass} appearance-none pr-10`}
                  >
                    <option value="">Select status</option>
                    <option value="Single">Single</option>
                    <option value="In a relationship">In a relationship</option>
                    <option value="Engaged">Engaged</option>
                    <option value="Married">Married</option>
                    <option value="It's complicated">It's complicated</option>
                  </select>
                  <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-5">
            <h5 className="text-lg font-semibold text-gray-900">Work and Education</h5>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Works At</label>
              <input
                type="text"
                name="worksAt"
                value={formData.worksAt}
                onChange={handleChange}
                placeholder="Company or organization"
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <LocationAutocomplete
                name="university"
                value={formData.university}
                onChange={handleChange}
                placeholder="University name"
                label="University"
                className={inputClass}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <div className="relative">
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    required
                    size={1}
                    className={`edit-profile-select ${inputClass} appearance-none pr-10`}
                  >
                    <option value="">Select department</option>
                    <option value="CSE">CSE</option>
                    <option value="EEE">EEE</option>
                    <option value="ETE">ETE</option>
                    <option value="ECE">ECE</option>
                    <option value="ME">ME</option>
                    <option value="CE">CE</option>
                    <option value="IPE">IPE</option>
                    <option value="GCE">GCE</option>
                    <option value="MSE">MSE</option>
                    <option value="CFPE">CFPE</option>
                    <option value="BECM">BECM</option>
                    <option value="URP">URP</option>
                    <option value="ARCH">ARCH</option>
                  </select>
                  <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </section>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-3 py-2.5 text-sm">
              {error}
            </div>
          )}

          <div className="pt-2 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <button
              type="button"
              onClick={onHide}
              className="px-5 py-2.5 rounded-xl bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className={`px-5 py-2.5 rounded-xl text-white font-medium transition-colors inline-flex items-center justify-center ${
                loading ? "bg-emerald-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
