"use client";
import { useState, useEffect } from "react";
import Axios from "axios";
import { useLanguage } from "../i18n/LanguageContext";

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
  const [step, setStep] = useState(1);
  const { t } = useLanguage();
  const ob = t("onboarding");

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
      setError(ob.errors.loadFailed);
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
      setError(ob.errors.minCategories);
      return;
    }

    setSaving(true);
    try {
      await Axios.post(
        `${API_BASE}/api/preferences/categories`,
        { categoryIds: selectedCategories },
        {},
      );
      onComplete();
    } catch (error) {
      console.error("Error saving preferences:", error);
      setError(ob.errors.saveFailed);
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-3 pt-3 pb-20 sm:px-4 sm:pt-4 md:pb-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-fadeIn flex flex-col max-h-[calc(100dvh-6rem)] md:max-h-[90vh]">
        {/* Header */}
        <div className="bg-emerald-600 px-4 py-5 text-white sm:px-8 sm:py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.75}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 10h16M4 14h8"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold leading-snug">
                {step === 1 ? ob.welcome : ob.personalizeTitle}
              </h2>
              <p className="text-white/75 text-sm mt-0.5">
                {step === 1
                  ? ob.personalizeSubtitle
                  : `${ob.selectAtLeast} (${selectedCategories.length} selected)`}
              </p>
            </div>
          </div>

          {/* Step progress */}
          <div className="flex gap-2 mt-4">
            <div
              className={`h-0.5 flex-1 rounded-full ${step >= 1 ? "bg-white" : "bg-white/30"}`}
            />
            <div
              className={`h-0.5 flex-1 rounded-full ${step >= 2 ? "bg-white" : "bg-white/30"}`}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-y-auto sm:p-8">
          {step === 1 ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-7 h-7 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.75}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 7h11"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {ob.step1.title}
              </h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto mb-8 leading-relaxed">
                {ob.step1.desc}
              </p>

              <div className="grid grid-cols-3 gap-3 max-w-md mx-auto mb-8">
                <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <svg
                      className="w-4 h-4 text-emerald-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                      />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-500 leading-snug">
                    {ob.step1.feature1}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <svg
                      className="w-4 h-4 text-emerald-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-500 leading-snug">
                    {ob.step1.feature2}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <svg
                      className="w-4 h-4 text-emerald-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-500 leading-snug">
                    {ob.step1.feature3}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                className="px-8 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
              >
                {ob.step1.cta}
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
                        category.id,
                      );
                      return (
                        <button
                          key={category.id}
                          onClick={() => toggleCategory(category.id)}
                          className={`relative px-3 py-3 rounded-lg border text-left transition-colors ${
                            isSelected
                              ? "border-emerald-500 bg-emerald-50"
                              : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                              <svg
                                className="w-2.5 h-2.5 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                          )}
                          <span
                            className={`text-xs font-medium leading-snug pr-4 ${isSelected ? "text-emerald-700" : "text-gray-700"}`}
                          >
                            {category.name}
                          </span>
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
                      className={`text-xs font-medium ${selectedCategories.length >= 5 ? "text-emerald-600" : "text-gray-400"}`}
                    >
                      {selectedCategories.length >= 5
                        ? `${selectedCategories.length} selected`
                        : `${5 - selectedCategories.length} more required`}
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
              {ob.back}
            </button>
          )}
          <div
            className={`flex w-full flex-col gap-3 sm:w-auto sm:flex-row ${
              step === 1 ? "sm:ml-auto" : ""
            }`}
          >
            <button
              onClick={handleSkip}
              disabled={saving}
              className="w-full px-4 py-2 text-gray-500 hover:text-gray-700 font-medium sm:w-auto sm:mr-3"
            >
              {ob.skip}
            </button>
            {step === 2 && (
              <button
                onClick={handleSave}
                disabled={saving || selectedCategories.length < 5}
                className={`w-full px-6 py-2 text-sm rounded-lg font-semibold transition-colors sm:w-auto ${
                  selectedCategories.length >= 5
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {ob.saving}
                  </span>
                ) : (
                  ob.continue
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
            transform: scale(0.97) translateY(12px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
