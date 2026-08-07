"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import Axios from "axios";
import { useLanguage } from "../i18n/LanguageContext";
Axios.defaults.withCredentials = true;

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

type CameraState = "idle" | "requesting" | "active" | "captured" | "error";

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

  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { t } = useLanguage();
  const k = t("kyc");

  const documentTypes = [
    { value: "id_card", label: k.step1.nationalId, requiresBack: true },
    { value: "passport", label: k.step1.passport, requiresBack: false },
    {
      value: "drivers_license",
      label: k.step1.driverLicense,
      requiresBack: true,
    },
  ];

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCameraState("idle");
      setCameraError("");
    }
    return () => stopCamera();
  }, [isOpen, stopCamera]);

  const startCamera = async () => {
    setCameraError("");
    setCameraState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraState("active");
    } catch (err: any) {
      const msg =
        err.name === "NotAllowedError"
          ? "Camera access was denied. Please allow camera access in your browser settings and try again."
          : err.name === "NotFoundError"
            ? "No camera was found on this device. Please use a device with a front-facing camera."
            : "Unable to start camera. Please check your browser permissions and try again.";
      setCameraError(msg);
      setCameraState("error");
    }
  };

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
        setSelfie(file);
        setSelfiePreview(canvas.toDataURL("image/jpeg", 0.92));
        stopCamera();
        setCameraState("captured");
      },
      "image/jpeg",
      0.92,
    );
  }, [stopCamera]);

  const retakePhoto = () => {
    setSelfie(null);
    setSelfiePreview("");
    setCameraState("idle");
  };

  const handleFileChange =
    (setter: (f: File) => void, previewSetter: (s: string) => void) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) {
        setError(k.errors.fileSize);
        return;
      }
      setter(file);
      const reader = new FileReader();
      reader.onloadend = () => previewSetter(reader.result as string);
      reader.readAsDataURL(file);
      setError("");
    };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    const selectedDoc = documentTypes.find((d) => d.value === documentType);
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
    try {
      const fd = new FormData();
      fd.append("userId", userId.toString());
      fd.append("documentType", documentType);
      fd.append("documentFront", documentFront);
      if (documentBack) fd.append("documentBack", documentBack);
      fd.append("selfie", selfie);
      await Axios.post(`${API_BASE}/api/kyc/submit`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onSuccess();
      handleClose();
    } catch (err: any) {
      if (err.response?.status === 401) {
        window.location.href =
          process.env.NEXT_PUBLIC_LOGIN_ENDPOINT || "/login";
      }
      setError(err.response?.data?.error || k.errors.failed);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    setStep(1);
    setDocumentType("");
    setDocumentFront(null);
    setDocumentBack(null);
    setSelfie(null);
    setDocumentFrontPreview("");
    setDocumentBackPreview("");
    setSelfiePreview("");
    setCameraState("idle");
    setCameraError("");
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  const selectedDoc = documentTypes.find((d) => d.value === documentType);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-[60]">
      <canvas ref={canvasRef} className="hidden" />

      <div className="bg-white w-full sm:rounded-2xl shadow-2xl sm:max-w-3xl max-h-[96dvh] overflow-y-auto">
        {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="sticky top-0 z-10 bg-emerald-700 text-white px-5 py-4 sm:rounded-t-2xl">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold">{k.title}</h2>
              <p className="text-xs text-emerald-200 mt-0.5">
                Step {step} of 3 &ndash; {k.verifyIdentity}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${s <= step ? "bg-white" : "bg-white/25"}`}
              />
            ))}
          </div>
        </div>

        {/* â”€â”€ Error â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {error && (
          <div className="mx-5 mt-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            <svg
              className="w-4 h-4 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01M12 2a10 10 0 110 20A10 10 0 0112 2z"
              />
            </svg>
            {error}
          </div>
        )}

        {/* â•â• STEP 1 â€” Document type â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        {step === 1 && (
          <div className="p-5 sm:p-6">
            <h3 className="text-base font-bold text-slate-800 mb-0.5">
              {k.step1.title}
            </h3>
            <p className="text-sm text-slate-500 mb-5">{k.step1.subtitle}</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {documentTypes.map((doc) => (
                <button
                  key={doc.value}
                  onClick={() => {
                    setDocumentType(doc.value);
                    setError("");
                  }}
                  className={`relative p-5 rounded-2xl border-2 text-left transition-all ${
                    documentType === doc.value
                      ? "border-emerald-600 bg-emerald-50"
                      : "border-slate-200 hover:border-emerald-300 bg-white"
                  }`}
                >
                  {documentType === doc.value && (
                    <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  )}
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                    <svg
                      className="w-5 h-5 text-slate-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z"
                      />
                    </svg>
                  </div>
                  <p className="font-semibold text-sm text-slate-800">
                    {doc.label}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {doc.requiresBack ? k.step1.frontBack : k.step1.bioPage}
                  </p>
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                if (!documentType) {
                  setError("Please select a document type to continue.");
                  return;
                }
                setError("");
                setStep(2);
              }}
              className="w-full mt-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors"
            >
              {k.continueBtn}
            </button>
          </div>
        )}

        {/* â•â• STEP 2 â€” Upload documents â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        {step === 2 && (
          <div className="p-5 sm:p-6 space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-800 mb-0.5">
                Upload Your {selectedDoc?.label}
              </h3>
              <p className="text-sm text-slate-500">
                Ensure the document is clear, unobstructed, and fully visible.
              </p>
            </div>

            <DocumentUpload
              id="doc-front"
              label={
                selectedDoc?.requiresBack
                  ? k.step2.frontLabel
                  : k.step2.bioLabel
              }
              required
              preview={documentFrontPreview}
              onFile={handleFileChange(
                setDocumentFront,
                setDocumentFrontPreview,
              )}
              onClear={() => {
                setDocumentFront(null);
                setDocumentFrontPreview("");
              }}
            />

            {selectedDoc?.requiresBack && (
              <DocumentUpload
                id="doc-back"
                label="Back of Document"
                required
                preview={documentBackPreview}
                onFile={handleFileChange(
                  setDocumentBack,
                  setDocumentBackPreview,
                )}
                onClear={() => {
                  setDocumentBack(null);
                  setDocumentBackPreview("");
                }}
              />
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
              <strong>Tips:</strong> {k.step2.tips[0]}. {k.step2.tips[1]}.
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
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
                  setError("");
                  setStep(3);
                }}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* â•â• STEP 3 â€” Live selfie â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        {step === 3 && (
          <div className="flex flex-col">
            {/* Tips strip */}
            <div className="px-5 pt-4 pb-3 flex flex-wrap gap-x-3 gap-y-2">
              {[
                "Look straight at camera",
                "Good lighting",
                "Remove glasses",
                "No face coverings",
              ].map((tip) => (
                <span
                  key={tip}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full"
                >
                  <svg
                    className="w-3 h-3 text-emerald-500 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {tip}
                </span>
              ))}
            </div>

            {/* Camera area – full-width, tall */}
            <div
              className="relative w-full overflow-hidden bg-slate-900"
              style={{ minHeight: "clamp(300px, 58dvh, 520px)" }}
            >
              {/* idle */}
              {cameraState === "idle" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6">
                  <div className="w-20 h-20 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                    <svg
                      className="w-9 h-9 text-white/60"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
                      />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-semibold text-sm">
                      Ready to take your selfie
                    </p>
                    <p className="text-white/50 text-xs mt-1">
                      Allow camera access when prompted
                    </p>
                  </div>
                  <button
                    onClick={startCamera}
                    className="px-7 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm transition-colors shadow-lg"
                  >
                    Open Camera
                  </button>
                </div>
              )}

              {/* requesting */}
              {cameraState === "requesting" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                  <p className="text-white/60 text-sm">
                    Starting camera&hellip;
                  </p>
                </div>
              )}

              {/* active – live feed with oval guide */}
              {cameraState === "active" && (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover [transform:scaleX(-1)]"
                  />
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="xMidYMid slice"
                  >
                    <defs>
                      <mask id="face-oval">
                        <rect width="100" height="100" fill="white" />
                        <ellipse cx="50" cy="46" rx="28" ry="36" fill="black" />
                      </mask>
                    </defs>
                    <rect
                      width="100"
                      height="100"
                      fill="rgba(0,0,0,0.50)"
                      mask="url(#face-oval)"
                    />
                    <ellipse
                      cx="50"
                      cy="46"
                      rx="28"
                      ry="36"
                      fill="none"
                      stroke="white"
                      strokeWidth="0.4"
                      opacity="0.7"
                    />
                    <ellipse
                      cx="50"
                      cy="46"
                      rx="28"
                      ry="36"
                      fill="none"
                      stroke="#34d399"
                      strokeWidth="0.6"
                      strokeDasharray="6 50"
                      opacity="0.9"
                    />
                  </svg>
                  {/* Hint */}
                  <div className="absolute top-4 inset-x-0 flex justify-center pointer-events-none">
                    <span className="bg-black/50 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full">
                      Center your face in the oval
                    </span>
                  </div>
                  {/* Shutter button */}
                  <div className="absolute bottom-0 inset-x-0 flex justify-center pb-6">
                    <button
                      onClick={capturePhoto}
                      aria-label="Take photo"
                      className="rounded-full bg-white ring-4 ring-white/30 hover:scale-105 active:scale-95 transition-transform shadow-xl flex items-center justify-center"
                      style={{ width: 72, height: 72 }}
                    >
                      <div
                        className="rounded-full bg-white border-[5px] border-slate-300"
                        style={{ width: 56, height: 56 }}
                      />
                    </button>
                  </div>
                </>
              )}

              {/* captured – selfie preview */}
              {cameraState === "captured" && selfiePreview && (
                <>
                  <img
                    src={selfiePreview}
                    alt="Your selfie"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center gap-1.5 bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow">
                      <svg
                        className="w-3 h-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Photo captured
                    </span>
                  </div>
                  <div className="absolute bottom-5 inset-x-0 flex justify-center">
                    <button
                      onClick={retakePhoto}
                      className="inline-flex items-center gap-1.5 bg-white/90 hover:bg-white text-slate-800 text-xs font-semibold px-5 py-2.5 rounded-full shadow transition-colors"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                        />
                      </svg>
                      Retake
                    </button>
                  </div>
                </>
              )}

              {/* error */}
              {cameraState === "error" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center">
                  <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-400/30 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-red-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-white/80 leading-relaxed">
                    {cameraError}
                  </p>
                  <button
                    onClick={startCamera}
                    className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>

            {/* Bottom controls */}
            <div className="px-5 py-4 flex gap-3">
              <button
                onClick={() => {
                  stopCamera();
                  setCameraState("idle");
                  setStep(2);
                }}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Back
              </button>
              {cameraState === "captured" && (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {loading && (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  )}
                  {loading ? "Submitting\u2026" : "Submit Verification"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* â”€â”€â”€ Document upload sub-component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function DocumentUpload({
  id,
  label,
  required,
  preview,
  onFile,
  onClear,
}: {
  id: string;
  label: string;
  required?: boolean;
  preview: string;
  onFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-slate-200">
          <img
            src={preview}
            alt={label}
            className="w-full max-h-56 object-cover"
          />
          <button
            onClick={onClear}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      ) : (
        <label
          htmlFor={id}
          className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-xl p-8 cursor-pointer transition-colors group"
        >
          <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-emerald-50 flex items-center justify-center transition-colors">
            <svg
              className="w-6 h-6 text-slate-400 group-hover:text-emerald-500 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700">
              Click to upload
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              JPG, PNG or WEBP &middot; Max 10 MB
            </p>
          </div>
          <input
            id={id}
            type="file"
            accept="image/*"
            onChange={onFile}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
}
