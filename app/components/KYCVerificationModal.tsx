"use client";
import { useState } from "react";
import Axios from "axios";
import { useLanguage } from "../i18n/LanguageContext";
Axios.defaults.withCredentials = true;

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

interface KYCModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  onSuccess: () => void;
}

export default function KYCVerificationModal({
  isOpen,
  onClose,
  userId,
  onSuccess,
}: KYCModalProps) {
  const [step, setStep] = useState(1);
  const [documentType, setDocumentType] = useState("");
  const [documentFront, setDocumentFront] = useState<File | null>(null);
  const [documentBack, setDocumentBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [documentFrontPreview, setDocumentFrontPreview] = useState("");
  const [documentBackPreview, setDocumentBackPreview] = useState("");
  const [selfiePreview, setSelfiePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { t } = useLanguage();
  const k = t("kyc");

  const documentTypes = [
    {
      value: "id_card",
      label: k.step1.nationalId,
      icon: "🪭",
      requiresBack: true,
    },
    {
      value: "passport",
      label: k.step1.passport,
      icon: "📘",
      requiresBack: false,
    },
    {
      value: "drivers_license",
      label: k.step1.driverLicense,
      icon: "🚗",
      requiresBack: true,
    },
  ];

  const handleDocumentFrontChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError(k.errors.fileSize);
        return;
      }
      setDocumentFront(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setDocumentFrontPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError("");
    }
  };

  const handleDocumentBackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError(k.errors.fileSize);
        return;
      }
      setDocumentBack(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setDocumentBackPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError("");
    }
  };

  const handleSelfieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError(k.errors.fileSize);
        return;
      }
      setSelfie(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelfiePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError("");
    }
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      const selectedDoc = documentTypes.find((dt) => dt.value === documentType);

      if (!documentFront) {
        setError(k.errors.frontRequired);
        setLoading(false);
        return;
      }

      if (selectedDoc?.requiresBack && !documentBack) {
        setError(k.errors.backRequired);
        setLoading(false);
        return;
      }

      if (!selfie) {
        setError(k.errors.selfieRequired);
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("userId", userId.toString());
      formData.append("documentType", documentType);
      formData.append("documentFront", documentFront);
      if (documentBack) {
        formData.append("documentBack", documentBack);
      }
      formData.append("selfie", selfie);

      const response = await Axios.post(
        `${API_BASE}/api/kyc/submit`,
        formData,

        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      onSuccess();
      handleClose();
    } catch (error: any) {
      if (error.response?.status === 401) {
        window.location.href =
          process.env.NEXT_PUBLIC_LOGIN_ENDPOINT || "/login";
      }
      console.error("Error submitting KYC:", error);
      setError(error.response?.data?.error || k.errors.failed);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setDocumentType("");
    setDocumentFront(null);
    setDocumentBack(null);
    setSelfie(null);
    setDocumentFrontPreview("");
    setDocumentBackPreview("");
    setSelfiePreview("");
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  const selectedDoc = documentTypes.find((dt) => dt.value === documentType);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] px-3 pt-3 pb-20 sm:px-4 sm:pt-4 md:pb-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[calc(100dvh-6rem)] md:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-emerald-600 text-white p-4 sm:p-6 rounded-t-2xl flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">{k.title}</h2>
            <p className="text-sm opacity-90">
              {k.stepOf} {step} {k.of} 3 - {k.verifyIdentity}
            </p>
          </div>
          <button
            onClick={handleClose}
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

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Step 1: Document Type Selection */}
        {step === 1 && (
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {k.step1.title}
            </h3>
            <p className="text-gray-600 mb-6">{k.step1.subtitle}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {documentTypes.map((doc) => (
                <button
                  key={doc.value}
                  onClick={() => setDocumentType(doc.value)}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    documentType === doc.value
                      ? "border-green-600 bg-green-50 scale-105"
                      : "border-gray-200 hover:border-green-400"
                  }`}
                >
                  <div className="text-4xl mb-3">{doc.icon}</div>
                  <h4 className="font-bold text-gray-800 mb-2">{doc.label}</h4>
                  <p className="text-xs text-gray-600">
                    {doc.requiresBack ? k.step1.frontBack : k.step1.bioPage}
                  </p>
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                if (documentType) setStep(2);
                else setError("Please select a document type");
              }}
              disabled={!documentType}
              className="w-full mt-6 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {k.continueBtn}
            </button>
          </div>
        )}

        {/* Step 2: Document Upload */}
        {step === 2 && (
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Upload Your {selectedDoc?.label}
            </h3>

            {/* Document Front */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {selectedDoc?.requiresBack
                  ? k.step2.frontLabel
                  : k.step2.bioLabel}{" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition-colors">
                {documentFrontPreview ? (
                  <div className="relative">
                    <img
                      src={documentFrontPreview}
                      alt="Document Front"
                      className="max-h-64 mx-auto rounded-lg"
                    />
                    <button
                      onClick={() => {
                        setDocumentFront(null);
                        setDocumentFrontPreview("");
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
                    >
                      <svg
                        className="w-4 h-4"
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
                ) : (
                  <label htmlFor="documentFront" className="cursor-pointer">
                    <svg
                      className="w-16 h-16 text-gray-400 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="text-gray-700 font-semibold">
                      {k.step2.clickUpload}
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      {k.step2.format}
                    </p>
                    <input
                      type="file"
                      id="documentFront"
                      accept="image/*"
                      onChange={handleDocumentFrontChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                ✓ {k.step2.tips[0]}
                <br />✓ {k.step2.tips[1]}
              </p>
            </div>

            {/* Document Back (if required) */}
            {selectedDoc?.requiresBack && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Back of Document <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition-colors">
                  {documentBackPreview ? (
                    <div className="relative">
                      <img
                        src={documentBackPreview}
                        alt="Document Back"
                        className="max-h-64 mx-auto rounded-lg"
                      />
                      <button
                        onClick={() => {
                          setDocumentBack(null);
                          setDocumentBackPreview("");
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
                      >
                        <svg
                          className="w-4 h-4"
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
                  ) : (
                    <label htmlFor="documentBack" className="cursor-pointer">
                      <svg
                        className="w-16 h-16 text-gray-400 mx-auto mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <p className="text-gray-700 font-semibold">
                        {k.step2.clickUpload}
                      </p>
                      <p className="text-gray-500 text-sm mt-1">
                        {k.step2.format}
                      </p>
                      <input
                        type="file"
                        id="documentBack"
                        accept="image/*"
                        onChange={handleDocumentBackChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
              >
                Back
              </button>
              <button
                onClick={() => {
                  if (!documentFront) {
                    setError(k.errors.frontRequired);
                    return;
                  }
                  if (selectedDoc?.requiresBack && !documentBack) {
                    setError(k.errors.backRequired);
                    return;
                  }
                  setStep(3);
                }}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Selfie Upload */}
        {step === 3 && (
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {k.step3.title}
            </h3>
            <p className="text-gray-600 mb-6">{k.step3.subtitle}</p>

            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition-colors">
                {selfiePreview ? (
                  <div className="relative">
                    <img
                      src={selfiePreview}
                      alt="Selfie"
                      className="max-h-80 mx-auto rounded-lg"
                    />
                    <button
                      onClick={() => {
                        setSelfie(null);
                        setSelfiePreview("");
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
                    >
                      <svg
                        className="w-4 h-4"
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
                ) : (
                  <label htmlFor="selfie" className="cursor-pointer">
                    <svg
                      className="w-20 h-20 text-gray-400 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <p className="text-gray-700 font-semibold">
                      {k.step3.clickUpload}
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      {k.step3.format}
                    </p>
                    <input
                      type="file"
                      id="selfie"
                      accept="image/*"
                      onChange={handleSelfieChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 font-semibold mb-2">
                  📸 {k.step3.reqTitle}
                </p>
                <ul className="text-xs text-blue-700 space-y-1">
                  {k.step3.reqs.map((req, i) => (
                    <li key={i}>✓ {req}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !selfie}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
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
                    Submitting...
                  </>
                ) : (
                  "Submit for Verification"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
