"use client";
import { useState, useEffect } from "react";
import Axios from "axios";
Axios.defaults.withCredentials = true;

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

interface Category {
  id: number;
  name: string;
}

interface ExistingImage {
  id: number;
  imageurl: string;
  is_main: boolean;
}

export interface EditListingData {
  id: number;
  title: string;
  description: string;
  price: number | string;
  currency?: string;
  category_id?: number;
  categoryId?: number | string;
  location?: string;
  country?: string;
  city?: string;
  condition?: string;
  phone?: string;
  seller_email?: string;
  tags?: string[] | string;
  delivery_type?: string;
  delivery_notes?: string;
  images?: ExistingImage[];
}

interface SellModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editListing?: EditListingData | null;
}

export default function SellModal({
  isOpen,
  onClose,
  onSuccess,
  editListing,
}: SellModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    currency: "XAF",
    categoryId: "",
    location: "",
    country: "Cameroon",
    city: "",
    condition: "new",
    phone: "",
    seller_email: "",
    tags: "",
    status: "Available",
    delivery_type: "pickup",
    delivery_notes: "",
  });

  // Pre-fill form when opening in edit mode
  useEffect(() => {
    if (isOpen && editListing) {
      setFormData({
        title: editListing.title || "",
        description: editListing.description || "",
        price: String(editListing.price || ""),
        currency: editListing.currency || "XAF",
        categoryId: String(
          editListing.categoryId ?? editListing.category_id ?? "",
        ),
        location: editListing.location || "",
        country: editListing.country || "Cameroon",
        city: editListing.city || "",
        condition: editListing.condition || "new",
        phone: editListing.phone || "",
        seller_email: editListing.seller_email || "",
        tags: Array.isArray(editListing.tags)
          ? editListing.tags.join(", ")
          : editListing.tags || "",
        status: "Available",
        delivery_type: editListing.delivery_type || "pickup",
        delivery_notes: editListing.delivery_notes || "",
      });
      setExistingImages(editListing.images || []);
      setRemovedImageIds([]);
      setImages([]);
      setImagePreviews([]);
      setDuplicateWarning([]);
      setSubmitError("");
    } else if (isOpen && !editListing) {
      setExistingImages([]);
      setRemovedImageIds([]);
    }
  }, [isOpen, editListing]);

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
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTitleBlur = async () => {
    const title = formData.title.trim();
    if (title.length < 4) {
      setDuplicateWarning([]);
      return;
    }
    try {
      const res = await Axios.get(
        `${API_BASE}/api/listings/check-duplicate?title=${encodeURIComponent(title)}`,
      );
      setDuplicateWarning((res.data.duplicates || []).map((d: any) => d.title));
    } catch {
      setDuplicateWarning([]);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "");
    const local = digits.startsWith("237") ? digits.slice(3) : digits;
    const capped = local.slice(0, 9);
    setFormData((prev) => ({ ...prev, phone: capped ? "237" + capped : "" }));
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

  const handleSubmit = async (e: React.FormEvent, isDraft = false) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError("");
    setSubmitSuccess(false);

    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });
      images.forEach((image) => {
        formDataToSend.append("images", image);
      });

      if (editListing) {
        // ── Edit mode: PUT existing listing ──────────────────────────────────
        removedImageIds.forEach((id) => {
          formDataToSend.append("removed_image_ids", String(id));
        });
        await Axios.put(
          `${API_BASE}/api/listings/${editListing.id}`,
          formDataToSend,
          { headers: { "Content-Type": "multipart/form-data" } },
        );
      } else {
        // ── Create mode: POST new listing ────────────────────────────────────
        if (isDraft) formDataToSend.append("is_draft", "true");
        await Axios.post(`${API_BASE}/api/listings`, formDataToSend, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      setSubmitSuccess(true);

      if (!editListing) {
        // Reset form only on create
        setFormData({
          title: "",
          description: "",
          price: "",
          currency: "XAF",
          categoryId: "",
          location: "",
          country: "Cameroon",
          city: "",
          condition: "new",
          phone: "",
          seller_email: "",
          tags: "",
          status: "Available",
          delivery_type: "pickup",
          delivery_notes: "",
        });
        setImages([]);
        setImagePreviews([]);
        setDuplicateWarning([]);
      }

      if (onSuccess) onSuccess();

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
          editListing
            ? error.response.data?.error || "You cannot edit this listing."
            : "Your account is suspended. You cannot create listings.",
        );
      } else if (error.response?.data?.error) {
        setSubmitError(error.response.data.error);
      } else {
        setSubmitError(
          editListing
            ? "Failed to update listing. Please try again."
            : "Failed to create listing. Please try again.",
        );
      }
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
          <h2 className="text-2xl font-bold">
            {editListing ? "Edit Listing" : "Create New Listing"}
          </h2>
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
                  Click to {editListing ? "add more" : "upload"} images
                </span>
                <span className="text-xs text-gray-400 mt-1">
                  PNG, JPG, GIF up to 5MB each
                </span>
              </label>
            </div>

            {/* Existing images in edit mode */}
            {existingImages.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-2">Current images (click × to remove):</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                  {existingImages.map((img) => (
                    <div key={img.id} className="relative group">
                      <img
                        src={img.imageurl}
                        alt="existing"
                        className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                      />
                      {img.is_main && (
                        <span className="absolute bottom-1 left-1 bg-green-500 text-white text-xs px-1 rounded">
                          Main
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setRemovedImageIds((prev) => [...prev, img.id]);
                          setExistingImages((prev) =>
                            prev.filter((i) => i.id !== img.id),
                          );
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
              onBlur={handleTitleBlur}
              required
              placeholder="e.g., iPhone 13 Pro Max"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition outline-none"
            />
            {duplicateWarning.length > 0 && (
              <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                <p className="font-semibold mb-1">
                  Similar listing already exists:
                </p>
                <ul className="list-disc list-inside">
                  {duplicateWarning.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
                <p className="mt-1 text-amber-600 text-xs">
                  Make sure this is not a duplicate before posting.
                </p>
              </div>
            )}
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
                Currency
              </label>
              <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 font-medium flex items-center gap-2">
                <span>XAF</span>
                <span className="text-xs text-gray-400">
                  (Central African Franc)
                </span>
              </div>
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
                  Country
                </label>
                <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 font-medium flex items-center gap-2">
                  <span>🇨🇲</span>
                  <span>Cameroon</span>
                </div>
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
                Mobile Money Number <span className="text-red-500">*</span>
              </label>
              <div className="flex rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500 overflow-hidden">
                <span className="flex items-center px-3 bg-gray-50 border-r border-gray-300 text-gray-600 text-sm font-medium select-none">
                  +237
                </span>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={
                    formData.phone.startsWith("237")
                      ? formData.phone.slice(3)
                      : formData.phone
                  }
                  onChange={handlePhoneChange}
                  required
                  placeholder="6XX XXX XXX"
                  maxLength={9}
                  className="flex-1 px-4 py-3 outline-none bg-white"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Enter your MTN or Orange Cameroon MoMo number. When a buyer pays
                through escrow, funds are released to this number.
              </p>
            </div>

            <div>
              <label
                htmlFor="seller_email"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Contact Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="seller_email"
                name="seller_email"
                value={formData.seller_email}
                onChange={handleInputChange}
                required
                placeholder="your@email.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Used for payment receipts and escrow notifications.
              </p>
            </div>

            <div>
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

          {/* Delivery / Meetup */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
              Delivery &amp; Meetup
            </h3>
            <div>
              <label
                htmlFor="delivery_type"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Delivery Option
              </label>
              <select
                id="delivery_type"
                name="delivery_type"
                value={formData.delivery_type}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition outline-none"
              >
                <option value="pickup">Pickup only</option>
                <option value="delivery">Delivery available</option>
                <option value="both">Pickup or delivery</option>
                <option value="ships">Ships nationwide</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="delivery_notes"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Delivery Notes{" "}
                <span className="text-gray-400 font-normal text-xs">
                  (optional)
                </span>
              </label>
              <input
                type="text"
                id="delivery_notes"
                name="delivery_notes"
                value={formData.delivery_notes}
                onChange={handleInputChange}
                placeholder="e.g., Can deliver within Douala for 2,000 XAF"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition outline-none"
              />
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
                  {editListing
                    ? "Listing updated!"
                    : "Listing created successfully!"}
                </p>
                <p className="text-green-600 text-sm">
                  {editListing
                    ? "Changes saved. It will be re-reviewed by our team if it was live."
                    : "Your listing is pending admin approval."}
                </p>
              </div>
            </div>
          )}
          <div className="flex flex-col gap-3 pt-4 border-t sm:flex-row sm:gap-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            {!editListing && (
              <button
                type="button"
                onClick={(e) => handleSubmit(e as any, true)}
                disabled={isSubmitting || submitSuccess}
                className="flex-1 px-6 py-3 border-2 border-blue-400 text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Draft
              </button>
            )}
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
                  <span>
                    {editListing ? "Saving Changes..." : "Creating Listing..."}
                  </span>
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
                  <span>{editListing ? "Saved!" : "Created!"}</span>
                </>
              ) : (
                <span>{editListing ? "Save Changes" : "Create Listing"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
