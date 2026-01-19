"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Axios from "axios";
import PageHeader from "../components/PageHeader";
Axios.defaults.withCredentials = true;
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  imageurl: string;
  sortorder: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [adminChecked, setAdminChecked] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    icon: "",
    imageurl: "",
    sortorder: 0,
  });

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await Axios.get(`${API_BASE}/api/admin/reports/stats`);
        if (response.status === 200) {
          setAdminChecked(true);
          return;
        }
        router.push(
          process.env.NEXT_PUBLIC_ADMIN_LOGIN_ENDPOINT || "/auth/admin"
        );
      } catch (error: any) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          router.push(
            process.env.NEXT_PUBLIC_ADMIN_LOGIN_ENDPOINT || "/auth/admin"
          );
          return;
        }
        console.error("Error checking admin auth:", error);
      }
    };

    checkAdmin();
  }, [router]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await Axios.get(`${API_BASE}/api/categories`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      setCategories(response.data);
    } catch (error: any) {
      if (error.response?.status === 401) {
        router.push(
          process.env.NEXT_PUBLIC_ADMIN_LOGIN_ENDPOINT || "/auth/admin"
        );
      }
      console.error("Error fetching categories:", error);
    }
  }, [router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCategories();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchCategories]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "sortorder" ? parseInt(value) || 0 : value,
    }));

    // Auto-generate slug from name
    if (name === "name" && !editingCategory) {
      const slug = value
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]/g, "");
      setFormData((prev) => ({ ...prev, slug }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append("name", formData.name);
      submitData.append("slug", formData.slug);
      submitData.append("description", formData.description);
      submitData.append("icon", formData.icon);
      submitData.append("sortorder", formData.sortorder.toString());

      // If a new image is selected, upload it; otherwise use existing URL
      if (selectedImage) {
        submitData.append("image", selectedImage);
      } else if (formData.imageurl) {
        submitData.append("imageurl", formData.imageurl);
      }

      if (editingCategory) {
        // Update existing category
        await Axios.put(
          `${API_BASE}/api/categories/${editingCategory.id}`,
          submitData
        );

        alert("Category updated successfully!");
      } else {
        // Create new category
        await Axios.post(`${API_BASE}/api/categories`, submitData);
        alert("Category created successfully!");
      }

      resetForm();
      fetchCategories();
    } catch (error: any) {
      if (error.response?.status === 401) {
        router.push(
          process.env.NEXT_PUBLIC_ADMIN_LOGIN_ENDPOINT || "/auth/admin"
        );
      }
      console.error("Error saving category:", error);
      alert(error.response?.data?.error || "Failed to save category");
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug || "",
      description: category.description || "",
      icon: category.icon || "",
      imageurl: category.imageurl || "",
      sortorder: category.sortorder || 0,
    });
    setSelectedImage(null);
    setImagePreview(category.imageurl || null);
    setShowAddModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      await Axios.delete(`${API_BASE}/api/categories/${id}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      alert("Category deleted successfully!");
      fetchCategories();
    } catch (error: any) {
      if (error.response?.status === 401) {
        router.push(
          process.env.NEXT_PUBLIC_ADMIN_LOGIN_ENDPOINT || "/auth/admin"
        );
      }
      // console.error("Error deleting category:", error);
      alert("Failed to delete category");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      icon: "",
      imageurl: "",
      sortorder: 0,
    });
    setEditingCategory(null);
    setSelectedImage(null);
    setImagePreview(null);
    setShowAddModal(false);
  };

  if (!adminChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-semibold text-gray-700">Loading...</div>
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
      <PageHeader
        title="Admin Dashboard"
        description="Manage categories, verifications, listings, and moderation workflows."
      />

      {/* Quick Actions / Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-green-100 rounded-full p-3">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg">Categories</h3>
              <p className="text-sm text-gray-600">Manage product categories</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800 mb-3">
            {categories.length}
          </p>
          <p className="text-sm text-gray-600 mb-4">Total categories</p>
          <button
            onClick={() => {
              const element = document.getElementById("categories-section");
              element?.scrollIntoView({ behavior: "smooth" });
            }}
            className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold"
          >
            Manage Categories
          </button>
        </div>

        <a
          href="/admin_dashboard/kyc"
          className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow block"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-yellow-100 rounded-full p-3">
              <svg
                className="w-8 h-8 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg">
                KYC Verification
              </h3>
              <p className="text-sm text-gray-600">Review user verifications</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800 mb-3">View Requests</p>
          <p className="text-sm text-gray-600 mb-4">
            Manage identity verifications
          </p>
          <div className="w-full bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors font-semibold text-center">
            Review KYC
          </div>
        </a>

        <a
          href="/admin_dashboard/listings"
          className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow block"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-purple-100 rounded-full p-3">
              <svg
                className="w-8 h-8 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg">Listings</h3>
              <p className="text-sm text-gray-600">
                Review & moderate listings
              </p>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800 mb-3">Moderate</p>
          <p className="text-sm text-gray-600 mb-4">
            Approve or reject user listings
          </p>
          <div className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-semibold text-center">
            Review Listings
          </div>
        </a>

        <a
          href="/admin_dashboard/moderation"
          className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow block"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-red-100 rounded-full p-3">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg">
                Reports & Moderation
              </h3>
              <p className="text-sm text-gray-600">Manage user reports</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800 mb-3">Review</p>
          <p className="text-sm text-gray-600 mb-4">
            Handle reports, warnings, suspensions
          </p>
          <div className="w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors font-semibold text-center">
            Open Moderation
          </div>
        </a>

        <a
          href="/admin_dashboard/moderation?tab=users"
          className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow block"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-blue-100 rounded-full p-3">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg">Users</h3>
              <p className="text-sm text-gray-600">User management</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800 mb-3">Manage</p>
          <p className="text-sm text-gray-600 mb-4">Manage platform users</p>
          <div className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-center">
            Manage Users
          </div>
        </a>
      </div>

      <h2
        id="categories-section"
        className="text-3xl font-bold text-gray-800 mb-6"
      >
        Category Management
      </h2>

      <button
        onClick={() => setShowAddModal(true)}
        className="mb-8 w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-red-600 via-yellow-500 to-red-600 text-white font-semibold rounded-lg hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300"
      >
        + Add New Category
      </button>

      {/* Categories Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-gradient-to-r from-red-600 to-yellow-500 text-white">
              <tr>
                <th className="px-6 py-4 text-left">Sort Order</th>
                <th className="px-6 py-4 text-left">Name</th>
                <th className="px-6 py-4 text-left">Slug</th>
                <th className="px-6 py-4 text-left">Description</th>
                <th className="px-6 py-4 text-left">Icon</th>
                <th className="px-6 py-4 text-left">Image</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category, index) => (
                <tr
                  key={category.id}
                  className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
                >
                  <td className="px-6 py-4">{category.sortorder}</td>
                  <td className="px-6 py-4 font-semibold">{category.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {category.slug}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                    {category.description || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm">{category.icon || "-"}</td>
                  <td className="px-6 py-4">
                    {category.imageurl ? (
                      <img
                        src={category.imageurl}
                        alt={category.name}
                        className="h-10 w-10 object-cover rounded"
                      />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => handleEdit(category)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-red-600 via-yellow-500 to-red-600 text-white p-4 sm:p-6 rounded-t-2xl flex justify-between items-center">
              <h2 className="text-2xl font-bold">
                {editingCategory ? "Edit Category" : "Add New Category"}
              </h2>
              <button
                onClick={resetForm}
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

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Electronics"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Slug
                </label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  placeholder="e.g., electronics"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Brief description of the category"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Icon (emoji or icon class)
                </label>
                <input
                  type="text"
                  name="icon"
                  value={formData.icon}
                  onChange={handleInputChange}
                  placeholder="e.g., 📱 or fa-mobile"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category Image
                </label>
                <div className="space-y-3">
                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="relative w-32 h-24 rounded-lg overflow-hidden border-2 border-gray-200">
                      <img
                        src={imagePreview}
                        alt="Category preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImage(null);
                          setImagePreview(null);
                          setFormData((prev) => ({ ...prev, imageurl: "" }));
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <svg
                          className="w-3 h-3"
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
                  )}

                  {/* File Input */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <label className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-500 transition-colors">
                        <svg
                          className="w-5 h-5 text-gray-400 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="text-gray-600">
                          {selectedImage
                            ? selectedImage.name
                            : "Choose image file"}
                        </span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <p className="text-xs text-gray-500">
                    Upload an image (max 5MB). Supports JPG, PNG, GIF, WebP.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Sort Order
                </label>
                <input
                  type="number"
                  name="sortorder"
                  value={formData.sortorder}
                  onChange={handleInputChange}
                  min="0"
                  placeholder="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                />
              </div>

              <div className="flex gap-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 via-yellow-500 to-red-600 text-white font-semibold rounded-lg hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300"
                >
                  {editingCategory ? "Update Category" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
