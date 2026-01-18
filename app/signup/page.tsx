"use client";
import { useState } from "react";
import Axios from "axios";
Axios.defaults.withCredentials = true;

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export default function Signup() {
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImage(file); // Store the actual File object
      setImagePreview(URL.createObjectURL(file)); // For preview
    }
  };

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    country: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const [showPopup, setShowPopup] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordChecks = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /\d/.test(formData.password),
    symbol: /[^A-Za-z0-9]/.test(formData.password),
  };

  const passwordScore = Object.values(passwordChecks).filter(Boolean).length;
  const passwordStrength = Math.round((passwordScore / 5) * 100);
  const passwordsMatch =
    formData.password.length > 0 &&
    formData.confirmPassword.length > 0 &&
    formData.password === formData.confirmPassword;
  const canSubmit =
    passwordScore === 5 &&
    formData.password === formData.confirmPassword &&
    formData.terms;

  const popUp = () => {
    setShowPopup("Registeration Succesful");

    setTimeout(() => {
      setShowPopup("");
    }, 7000);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      setError(
        "Password must meet all requirements and match the confirmation."
      );
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);
    // Handle form submission logic here
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("username", formData.username);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("phone", formData.phone);
      formDataToSend.append("country", formData.country);
      formDataToSend.append("password", formData.password);
      if (image) {
        formDataToSend.append("profileImage", image);
      }

      await Axios.post(`${API_BASE}/register/signup`, formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      popUp();
      window.scrollTo(0, 0);
      window.location.href = process.env.NEXT_PUBLIC_LOGIN_ENDPOINT || "/login";
      console.log(formData);
    } catch (error) {
      setError("Error registering user");

      setTimeout(() => {
        setError("");
      }, 7000);

      console.error("Error during registration:", error);
    } finally {
      setIsSubmitting(false);
    }

    setFormData({
      name: "",
      username: "",
      email: "",
      phone: "",
      country: "",
      password: "",
      confirmPassword: "",
      terms: false,
    });
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      {showPopup && (
        <div className="fixed top-5 right-5 z-50 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-lg shadow-xl animate-bounce-in flex items-center gap-3">
          <svg
            className="w-6 h-6 animate-check-draw"
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
          <span className="font-medium">{showPopup}</span>
        </div>
      )}
      {error && (
        <div className="fixed top-5 right-5 z-50 bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-4 rounded-lg shadow-xl animate-shake flex items-center gap-3">
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
          <span className="font-medium">{error}</span>
        </div>
      )}
      {error && (
        <div className="fixed top-5 right-5 z-50 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg animate-slide-in flex items-center gap-3">
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
          <span className="font-medium">{error}</span>
        </div>
      )}

      <div className="max-w-2xl mx-auto relative z-10">
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex justify-center mb-4 relative">
            <div className="absolute -top-2 -left-8 text-yellow-400 animate-bounce">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <div className="absolute -top-2 -right-8 text-yellow-400 animate-bounce animation-delay-500">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 via-yellow-500 to-red-500 rounded-full flex items-center justify-center shadow-xl animate-pulse-slow relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white to-transparent opacity-20 animate-shimmer"></div>
              <svg
                className="w-8 h-8 text-white relative z-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2 animate-slide-up">
            Create Your Account
          </h1>
          <p className="text-lg text-gray-600 animate-slide-up animation-delay-200">
            Join {process.env.NEXT_PUBLIC_SITENAME || "our marketplace"} and
            connect with thousands of buyers and sellers
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 md:p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">
                Personal Information
              </h2>

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  onChange={handleInputChange}
                  value={formData.name}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200 outline-none hover:border-green-300"
                />
              </div>

              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  required
                  onChange={handleInputChange}
                  value={formData.username}
                  placeholder="Choose a unique username"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200 outline-none hover:border-green-300"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    onChange={handleInputChange}
                    value={formData.email}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200 outline-none hover:border-green-300"
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    required
                    onChange={handleInputChange}
                    value={formData.phone}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200 outline-none hover:border-green-300"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="country"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Country <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  required
                  onChange={handleInputChange}
                  value={formData.country}
                  placeholder="Enter your country"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200 outline-none hover:border-green-300"
                />
              </div>
            </div>
            {/* Security Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">
                Security
              </h2>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    required
                    onChange={handleInputChange}
                    value={formData.password}
                    placeholder="Create a strong password"
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200 outline-none hover:border-green-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
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
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
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
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="mt-2">
                  <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        passwordStrength >= 80
                          ? "bg-green-500"
                          : passwordStrength >= 60
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${passwordStrength}%` }}
                    />
                  </div>
                  <div className="mt-2 grid gap-1 text-xs">
                    <p className="font-medium text-gray-600">
                      Password must include:
                    </p>
                    <p
                      className={
                        passwordChecks.length
                          ? "text-green-600"
                          : "text-red-500"
                      }
                    >
                      • At least 8 characters
                    </p>
                    <p
                      className={
                        passwordChecks.uppercase
                          ? "text-green-600"
                          : "text-red-500"
                      }
                    >
                      • One uppercase letter
                    </p>
                    <p
                      className={
                        passwordChecks.lowercase
                          ? "text-green-600"
                          : "text-red-500"
                      }
                    >
                      • One lowercase letter
                    </p>
                    <p
                      className={
                        passwordChecks.number
                          ? "text-green-600"
                          : "text-red-500"
                      }
                    >
                      • One number
                    </p>
                    <p
                      className={
                        passwordChecks.symbol
                          ? "text-green-600"
                          : "text-red-500"
                      }
                    >
                      • One symbol
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    required
                    onChange={handleInputChange}
                    value={formData.confirmPassword}
                    placeholder="Re-enter your password"
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200 outline-none hover:border-green-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? (
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
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
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
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                {formData.confirmPassword.length > 0 && (
                  <p
                    className={`mt-2 text-xs font-medium ${
                      passwordsMatch ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {passwordsMatch
                      ? "Passwords match"
                      : "Passwords do not match"}
                  </p>
                )}
              </div>
            </div>
            {/* Profile Picture Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">
                Profile Picture
              </h2>

              <div>
                <label
                  htmlFor="profileImage"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Upload Profile Picture{" "}
                  <span className="text-gray-500 text-xs">(Optional)</span>
                </label>
                <div className="flex items-center gap-4">
                  <label
                    htmlFor="profileImage"
                    className="flex-1 cursor-pointer"
                  >
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition duration-200">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <p className="mt-2 text-sm text-gray-600">
                        <span className="font-medium text-green-600">
                          Click to upload
                        </span>{" "}
                        or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG, GIF up to 5MB
                      </p>
                    </div>
                    <input
                      type="file"
                      id="profileImage"
                      name="profileImage"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  {imagePreview && (
                    <div className="flex-shrink-0">
                      <img
                        src={imagePreview}
                        alt="Profile Preview"
                        className="w-24 h-24 object-cover rounded-full border-4 border-green-500 shadow-lg animate-scale-in"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Terms and Conditions */}
            <div className="pt-4">
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="terms"
                  name="terms"
                  required
                  onChange={handleInputChange}
                  checked={formData.terms}
                  className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="terms" className="text-sm text-gray-700">
                  I agree to the{" "}
                  <a
                    href="#"
                    className="text-green-600 hover:text-yellow-600 hover:underline font-medium transition-colors"
                  >
                    Terms and Conditions
                  </a>{" "}
                  and{" "}
                  <a
                    href="#"
                    className="text-green-600 hover:text-yellow-600 hover:underline font-medium transition-colors"
                  >
                    Privacy Policy
                  </a>
                  . I understand that my information will be processed according
                  to these policies.
                </label>
              </div>
            </div>
            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !canSubmit}
              className={`w-full bg-gradient-to-r from-green-600 via-yellow-500 to-green-600 text-white font-semibold py-4 px-6 rounded-lg hover:shadow-xl hover:from-green-700 hover:via-yellow-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transform transition-all duration-300 hover:scale-[1.02] shadow-lg relative overflow-hidden group ${
                isSubmitting || !canSubmit
                  ? "opacity-80 cursor-not-allowed"
                  : ""
              }`}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <span className="w-5 h-5 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                ) : (
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
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                )}
                {isSubmitting ? "Creating account..." : "Create Account"}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-red-400 to-yellow-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </button>{" "}
            <p className="text-center text-sm text-gray-600 mt-6">
              Already have an account?{" "}
              <a
                href="/login"
                className="text-green-600 hover:text-yellow-600 hover:underline font-medium transition-colors"
              >
                Sign in here
              </a>
            </p>
          </form>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          By signing up, you're joining a trusted community of marketplace users
          worldwide.
        </p>
      </div>
    </div>
  );
}
