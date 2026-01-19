"use client";
import { useState, useEffect } from "react";
import Axios from "axios";

interface Category {
  id: number;
  name: string;
  icon: string;
  slug: string;
  description?: string;
}

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export default function OnboardingModal({
  isOpen,
  onComplete,
  onSkip,
}: OnboardingModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1); // 1 = welcome, 2 = select categories

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const response = await Axios.get(`${API_BASE}/api/categories`);
      setCategories(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setError("Failed to load categories");
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: number) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
    setError("");
  };

  const handleSave = async () => {
    if (selectedCategories.length < 5) {
      setError("Please select at least 5 categories to continue");
      return;
    }

    setSaving(true);
    try {
      await Axios.post(
        `${API_BASE}/api/preferences/categories`,
        { categoryIds: selectedCategories },
        {}
      );
      onComplete();
    } catch (error) {
      console.error("Error saving preferences:", error);
      setError("Failed to save preferences. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    setSaving(true);
    try {
      await Axios.post(`${API_BASE}/api/preferences/skip-onboarding`, {}, {});
      onSkip();
    } catch (error) {
      console.error("Error skipping onboarding:", error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-fadeIn flex flex-col max-h-[90vh]">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-green-600 via-green-500 to-yellow-500 px-4 py-5 text-white sm:px-8 sm:py-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {step === 1
                  ? "Welcome to Marketplace!"
                  : "Personalize Your Feed"}
              </h2>
              <p className="text-white/80 text-sm mt-1">
                {step === 1
                  ? "Let's set up your personalized experience"
                  : `Select at least 5 categories you're interested in (${selectedCategories.length} selected)`}
              </p>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="flex gap-2 mt-4">
            <div
              className={`h-1 flex-1 rounded-full ${
                step >= 1 ? "bg-white" : "bg-white/30"
              }`}
            />
            <div
              className={`h-1 flex-1 rounded-full ${
                step >= 2 ? "bg-white" : "bg-white/30"
              }`}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-y-auto sm:p-8">
          {step === 1 ? (
            // Welcome Step
            <div className="text-center py-8">
              <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-5xl">🛍️</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Find What You Love
              </h3>
              <p className="text-gray-600 max-w-lg mx-auto mb-8 leading-relaxed">
                To give you the best experience, we&apos;d like to know what
                categories interest you. This helps us show you relevant
                listings and recommendations tailored just for you.
              </p>

              <div className="grid grid-cols-1 gap-4 max-w-md mx-auto mb-8 sm:grid-cols-3">
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <div className="text-2xl mb-2">🎯</div>
                  <p className="text-sm text-gray-600">Personalized Feed</p>
                </div>
                <div className="bg-yellow-50 rounded-xl p-4 text-center">
                  <div className="text-2xl mb-2">🔔</div>
                  <p className="text-sm text-gray-600">Smart Alerts</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <div className="text-2xl mb-2">⚡</div>
                  <p className="text-sm text-gray-600">Quick Discovery</p>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full px-8 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all sm:w-auto"
              >
                Let&apos;s Get Started
              </button>
            </div>
          ) : (
            // Category Selection Step
            <>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent" />
                </div>
              ) : (
                <>
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {categories.map((category) => {
                      const isSelected = selectedCategories.includes(
                        category.id
                      );
                      return (
                        <button
                          key={category.id}
                          onClick={() => toggleCategory(category.id)}
                          className={`relative p-4 min-h-[96px] rounded-xl border-2 transition-all transform hover:scale-102 text-left ${
                            isSelected
                              ? "border-green-500 bg-green-50 shadow-md"
                              : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {/* Selection indicator */}
                          {isSelected && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                              <svg
                                className="w-4 h-4 text-white"
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
                            </div>
                          )}

                          <div className="text-3xl mb-2">
                            {category.icon || "📦"}
                          </div>
                          <div
                            className={`text-sm font-medium break-words ${
                              isSelected ? "text-green-700" : "text-gray-700"
                            }`}
                          >
                            {category.name}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Selection counter */}
                  <div className="mt-6 flex items-center justify-center gap-2">
                    <div
                      className={`flex gap-1 ${
                        selectedCategories.length >= 5
                          ? "text-green-600"
                          : "text-gray-400"
                      }`}
                    >
                      {[1, 2, 3, 4, 5].map((num) => (
                        <div
                          key={num}
                          className={`w-3 h-3 rounded-full transition-all ${
                            selectedCategories.length >= num
                              ? "bg-green-500"
                              : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        selectedCategories.length >= 5
                          ? "text-green-600"
                          : "text-gray-500"
                      }`}
                    >
                      {selectedCategories.length >= 5
                        ? "Great! You can select more if you'd like"
                        : `Select ${5 - selectedCategories.length} more`}
                    </span>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-4 bg-gray-50 border-t flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          {step === 2 && (
            <button
              onClick={() => setStep(1)}
              className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 font-medium sm:w-auto"
            >
              ← Back
            </button>
          )}
          <div className={`flex w-full flex-col gap-3 sm:w-auto sm:flex-row ${step === 1 ? "sm:ml-auto" : ""}`}>
            <button
              onClick={handleSkip}
              disabled={saving}
              className="w-full px-4 py-2 text-gray-500 hover:text-gray-700 font-medium sm:w-auto sm:mr-3"
            >
              Skip for now
            </button>
            {step === 2 && (
              <button
                onClick={handleSave}
                disabled={saving || selectedCategories.length < 5}
                className={`w-full px-6 py-2 rounded-xl font-semibold transition-all sm:w-auto ${
                  selectedCategories.length >= 5
                    ? "bg-gradient-to-r from-green-600 to-green-500 text-white hover:shadow-lg"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  "Continue →"
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
}
