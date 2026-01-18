"use client";
import { useState, useEffect } from "react";
import Axios from "axios";
import { currencies } from "../constants/currencies";
import { countries } from "../constants/countries";
Axios.defaults.withCredentials = true;

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

interface Category {
  id: number;
  name: string;
}

interface SellModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function SellModal({
  isOpen,
  onClose,
  onSuccess,
}: SellModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [currencySearch, setCurrencySearch] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    currency: "USD",
    categoryId: "",
    location: "",
    country: "",
    city: "",
    condition: "new",
    phone: "",
    tags: "",
    status: "Available",
  });

  // Fetch categories when modal opens
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await Axios.get(`${API_BASE}/api/categories`);
        console.log("Fetched categories:", response.data);
        setCategories(response.data);
      } catch (error: any) {
        if (error.response?.status === 401) {
          window.location.href =
            process.env.NEXT_PUBLIC_LOGIN_ENDPOINT || "/login";
        }
        console.error("Error fetching categories:", error);
      }
    };

    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files).slice(0, 10); // Limit to 10 images
      setImages(fileArray);

      // Create preview URLs
      const previewUrls = fileArray.map((file) => URL.createObjectURL(file));
      setImagePreviews(previewUrls);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);

    // Revoke the URL to free memory
    URL.revokeObjectURL(imagePreviews[index]);

    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submission
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError("");
    setSubmitSuccess(false);

    try {
      const formDataToSend = new FormData();

      // Append all form fields
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });

      // Append all images
      images.forEach((image) => {
        formDataToSend.append("images", image);
      });

      const response = await Axios.post(
        `${API_BASE}/api/listings`,
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Listing created successfully");
      setSubmitSuccess(true);

      // Reset form and images
      setFormData({
        title: "",
        description: "",
        price: "",
        currency: "USD",
        categoryId: "",
        location: "",
        country: "",
        city: "",
        condition: "new",
        phone: "",
        tags: "",
        status: "Available",
      });
      setImages([]);
      setImagePreviews([]);

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Close modal after short delay to show success message
      setTimeout(() => {
        setSubmitSuccess(false);
        onClose();
      }, 2000);
    } catch (error: any) {
      if (error.response?.status === 401) {
        window.location.href =
          process.env.NEXT_PUBLIC_LOGIN_ENDPOINT || "/login";
      } else if (error.response?.status === 403) {
        setSubmitError(
          "Your account is suspended. You cannot create listings."
        );
      } else if (error.response?.data?.error) {
        setSubmitError(error.response.data.error);
      } else {
        setSubmitError("Failed to create listing. Please try again.");
      }
      console.error("Error creating listing:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-600 via-yellow-500 to-green-600 text-white p-4 sm:p-6 rounded-t-2xl flex justify-between items-center">
          <h2 className="text-2xl font-bold">Create New Listing</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Product Images{" "}
              <span className="text-gray-500 text-xs">(Up to 10 images)</span>
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-green-500 transition">
              <input
                type="file"
                id="images"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <label
                htmlFor="images"
                className="flex flex-col items-center justify-center cursor-pointer"
              >
                <svg
                  className="w-12 h-12 text-gray-400 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                <span className="text-sm text-gray-600">
                  Click to upload images
                </span>
                <span className="text-xs text-gray-400 mt-1">
                  PNG, JPG, GIF up to 5MB each
                </span>
              </label>
            </div>

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mt-4 sm:grid-cols-3 md:grid-cols-5">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                    <span className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                      {index + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              placeholder="e.g., iPhone 13 Pro Max"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={4}
              placeholder="Describe your item in detail..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition outline-none resize-none"
            ></textarea>
          </div>

          {/* Price and Currency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="price"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Price <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="currency"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Currency <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={(e) => {
                  handleInputChange(e);
                  setCurrencySearch(e.target.value);
                }}
                list="currency-list"
                required
                placeholder="Search currency..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition outline-none"
              />
              <datalist id="currency-list">
                {currencies
                  .filter(
                    (c) =>
                      c.code
                        .toLowerCase()
                        .includes(currencySearch.toLowerCase()) ||
                      c.name
                        .toLowerCase()
                        .includes(currencySearch.toLowerCase())
                  )
                  .map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.name} ({currency.symbol})
                    </option>
                  ))}
              </datalist>
            </div>
          </div>

          {/* Category and Condition */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="categoryId"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="categoryId"
                name="categoryId"
                value={formData.categoryId}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition outline-none"
              >
                <option value="">-- Select Category --</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="condition"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Condition <span className="text-red-500">*</span>
              </label>
              <select
                id="condition"
                name="condition"
                value={formData.condition}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition outline-none"
              >
                <option value="new">New</option>
                <option value="used">Used</option>
              </select>
            </div>
          </div>

          {/* Location Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
              Location Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="country"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Country <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={(e) => {
                    handleInputChange(e);
                    setCountrySearch(e.target.value);
                  }}
                  list="country-list"
                  required
                  placeholder="Search country..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition outline-none"
                />
                <datalist id="country-list">
                  {countries
                    .filter((c) =>
                      c.toLowerCase().includes(countrySearch.toLowerCase())
                    )
                    .map((country) => (
                      <option key={country} value={country} />
                    ))}
                </datalist>
              </div>

              <div>
                <label
                  htmlFor="city"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Douala"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="location"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Specific Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g., Akwa, near main market"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition outline-none"
              />
            </div>
          </div>

          {/* Contact and Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                placeholder="+237 6XX XXX XXX"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="status"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Status <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="status"
                name="status"
                value="Available"
                readOnly
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                Status is automatically set to Available
              </p>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label
              htmlFor="tags"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Tags{" "}
              <span className="text-gray-500 text-xs">(comma-separated)</span>
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              placeholder="e.g., smartphone, electronics, apple"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition outline-none"
            />
          </div>

          {/* Error Message */}
          {submitError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <svg
                className="w-5 h-5 text-red-500 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-red-700 text-sm">{submitError}</p>
            </div>
          )}

          {/* Success Message */}
          {submitSuccess && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <svg
                className="w-5 h-5 text-green-500 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="text-green-700 font-medium">
                  Listing created successfully!
                </p>
                <p className="text-green-600 text-sm">
                  Your listing is pending admin approval.
                </p>
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex flex-col gap-3 pt-4 border-t sm:flex-row sm:gap-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || submitSuccess}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 via-yellow-500 to-green-600 text-white font-semibold rounded-lg hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-none flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
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
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Creating Listing...</span>
                </>
              ) : submitSuccess ? (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Created!</span>
                </>
              ) : (
                <span>Create Listing</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
