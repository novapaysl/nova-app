import { useState, useRef } from "react";
import { Link } from "react-router";
import { MapPin, Calendar, User, FileText, Upload, CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import { useGetIdentity } from "@refinedev/core";
import { supabaseClient } from "../../providers/supabase-client"; // Clean relative path mapping

interface PersonalInfo {
  fullName: string;
  dateOfBirth: string;
  address: string;
  city: string;
  country: string;
}

interface IdentityInfo {
  documentType: string;
  documentNumber: string;
  identityDoc: File | null;
  selfieDoc: File | null;
}

const AFRICAN_COUNTRIES = [
  "Sierra Leone",
  "Nigeria",
  "Ghana",
  "Kenya",
  "South Africa",
  "Ethiopia",
  "Tanzania",
  "Uganda",
  "Senegal",
  "Ivory Coast",
  "Cameroon",
  "Guinea",
  "Liberia",
  "Gambia",
  "Mali",
  "Burkina Faso",
  "Niger",
  "Togo",
  "Benin",
  "Rwanda",
  "Zambia",
  "Zimbabwe",
  "Mozambique",
  "Angola",
  "DRC",
  "Egypt",
  "Morocco",
  "Tunisia",
  "Algeria",
  "Libya",
];

const DOCUMENT_TYPES = [
  { value: "National ID", label: "National ID Card" },
  { value: "Passport", label: "Passport" },
  { value: "Drivers License", label: "Driver's License" },
  { value: "Voter ID", label: "Voter ID" },
];

const inputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(29,161,242,0.15)";
};
const inputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.currentTarget.style.boxShadow = "";
};

export const KYCPage = () => {
  const { data: identity } = useGetIdentity<{ id: string }>(); // Get user auth ID
  const [step, setStep] = useState<1 | 2>(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    fullName: "",
    dateOfBirth: "",
    address: "",
    city: "",
    country: "Sierra Leone",
  });

  const [identityInfo, setIdentityInfo] = useState<IdentityInfo>({
    documentType: "",
    documentNumber: "",
    identityDoc: null,
    selfieDoc: null,
  });

  const [identityDocName, setIdentityDocName] = useState<string>("");
  const [selfieDocName, setSelfieDocName] = useState<string>("");
  const [isDraggingId, setIsDraggingId] = useState(false);
  const [isDraggingSelfie, setIsDraggingSelfie] = useState(false);

  const [step1Errors, setStep1Errors] = useState<Partial<PersonalInfo>>({});
  const [step2Errors, setStep2Errors] = useState<Partial<Record<keyof IdentityInfo, string>>>({});

  const identityDocRef = useRef<HTMLInputElement>(null);
  const selfieDocRef = useRef<HTMLInputElement>(null);

  // ── Validation ──────────────────────────────────────────────────────────────

  const validateStep1 = () => {
    const errs: Partial<PersonalInfo> = {};
    if (!personalInfo.fullName.trim()) errs.fullName = "Full name is required.";
    if (!personalInfo.dateOfBirth) errs.dateOfBirth = "Date of birth is required.";
    if (!personalInfo.address.trim()) errs.address = "Residential address is required.";
    if (!personalInfo.city.trim()) errs.city = "City is required.";
    if (!personalInfo.country) errs.country = "Please select a country.";
    return errs;
  };

  const validateStep2 = () => {
    const errs: Partial<Record<keyof IdentityInfo, string>> = {};
    if (!identityInfo.documentType) errs.documentType = "Please select a document type.";
    if (!identityInfo.documentNumber.trim()) errs.documentNumber = "Document number is required.";
    return errs;
  };

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleNextStep = () => {
    const errs = validateStep1();
    if (Object.keys(errs).length > 0) {
      setStep1Errors(errs);
      return;
    }
    setStep1Errors({});
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateStep2();
    if (Object.keys(errs).length > 0) {
      setStep2Errors(errs);
      return;
    }
    setStep2Errors({});

    // UI Document check
    if (!identityInfo.identityDoc) {
      setStep2Errors((prev) => ({ ...prev, identityDoc: "Please upload your identity document." }));
      return;
    }

    if (!identity?.id) {
      setSubmitError("Authentication error. Please log in again.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const userId = identity.id;
      const timestamp = Date.now();

      // 1. Upload Identity Document to Secure Supabase Bucket
      const idFile = identityInfo.identityDoc;
      const idExt = idFile.name.split(".").pop();
      const idPath = `${userId}/id_${timestamp}.${idExt}`;

      const { data: idUploadData, error: idUploadError } = await supabaseClient.storage
        .from("kyc-documents")
        .upload(idPath, idFile, { cacheControl: "3600", upsert: true });

      if (idUploadError) throw idUploadError;

      // 2. Upload Selfie (If provided)
      let selfiePath = null;
      if (identityInfo.selfieDoc) {
        const selfieFile = identityInfo.selfieDoc;
        const selfieExt = selfieFile.name.split(".").pop();
        const sPath = `${userId}/selfie_${timestamp}.${selfieExt}`;

        const { data: selfieUploadData, error: selfieUploadError } = await supabaseClient.storage
          .from("kyc-documents")
          .upload(sPath, selfieFile, { cacheControl: "3600", upsert: true });

        if (selfieUploadError) throw selfieUploadError;
        selfiePath = selfieUploadData.path;
      }

      // 3. Update User Profiles Database Table
      const { error: profileError } = await supabaseClient
        .from("profiles")
        .update({
          full_name: personalInfo.fullName,
          date_of_birth: personalInfo.dateOfBirth,
          address: personalInfo.address,
          city: personalInfo.city,
          country: personalInfo.country,
          verification_status: "submitted", // Moves user banner status instantly!
        })
        .eq("id", userId);

      if (profileError) throw profileError;

      // 4. Record Document meta inside kyc_documents table
      const { error: docError } = await supabaseClient.from("kyc_documents").insert({
        user_id: userId,
        document_type: identityInfo.documentType,
        document_number: identityInfo.documentNumber,
        document_url: idUploadData.path, // Store the private storage reference
        status: "pending",
      });

      if (docError) throw docError;

      // 5. Create compliance entry inside kyc_profiles
      await supabaseClient.from("kyc_profiles").insert({
        user_id: userId,
        status: "under_review",
        review_notes: "Automated upload submission",
      });

      // Show native checkmark screen
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      console.error("KYC Submission error:", err);
      setSubmitError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "identity" | "selfie") => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    if (type === "identity") {
      setIdentityInfo((p) => ({ ...p, identityDoc: file }));
      setIdentityDocName(file.name);
    } else {
      setIdentityInfo((p) => ({ ...p, selfieDoc: file }));
      setSelfieDocName(file.name);
    }
  };

  const handleDrop = (e: React.DragEvent, type: "identity" | "selfie") => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0] ?? null;
    if (!file) return;
    if (type === "identity") {
      setIdentityInfo((p) => ({ ...p, identityDoc: file }));
      setIdentityDocName(file.name);
      setIsDraggingId(false);
    } else {
      setIdentityInfo((p) => ({ ...p, selfieDoc: file }));
      setSelfieDocName(file.name);
      setIsDraggingSelfie(false);
    }
  };

  // ── Confirmation Screen ───────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-green-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-10 flex flex-col items-center text-center">
          <img
            src="/NovaPay Emblem.webp"
            alt="NovaPay"
            className="h-12 w-auto object-contain mb-8"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />

          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
            style={{ backgroundColor: "rgba(34,197,94,0.12)" }}>
            <CheckCircle2 className="w-10 h-10" style={{ color: "#22C55E" }} />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-3" style={{ fontFamily: "Poppins, sans-serif" }}>
            Verification Submitted!
          </h2>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed max-w-sm">
            Thank you, <span className="font-semibold text-gray-700">{personalInfo.fullName || "there"}</span>! Your
            identity verification is under review. We typically verify accounts within{" "}
            <span className="font-semibold">1-2 business days</span>. You'll receive a notification once your account is
            approved.
          </p>

          <div className="w-full rounded-xl bg-amber-50 border border-amber-200 px-5 py-4 mb-8 text-left">
            <p className="text-sm text-amber-700 leading-relaxed">
              ⚠️ While your account is under review, some features may be limited. You can still explore your dashboard.
            </p>
          </div>

          <Link
            to="/dashboard"
            className="w-full py-3 rounded-xl text-sm font-semibold text-white text-center transition-all duration-200 hover:opacity-90 shadow-md mb-3"
            style={{ backgroundColor: "#1DA1F2", display: "block" }}>
            Go to Dashboard
          </Link>

          <Link
            to="/"
            className="w-full py-3 rounded-xl text-sm font-semibold text-center transition-all duration-200 hover:bg-sky-50 border"
            style={{ color: "#1DA1F2", borderColor: "#1DA1F2", display: "block" }}>
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  // ── Main KYC Form ─────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-green-50 py-10 px-4">
      <div className="w-full max-w-[720px] mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* ── Header ── */}
          <div className="px-8 pt-8 pb-6" style={{ borderBottom: "1px solid #f1f5f9" }}>
            <div className="flex justify-center mb-5">
              <img
                src="/NovaPay Emblem.webp"
                alt="NovaPay"
                className="h-12 w-auto object-contain"
                onError={(e) => {
                  const el = e.currentTarget as HTMLImageElement;
                  el.style.display = "none";
                  const fb = el.nextElementSibling as HTMLElement;
                  if (fb) fb.style.display = "flex";
                }}
              />
              <span className="hidden items-center text-xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
                <span style={{ color: "#1DA1F2" }}>Nova</span>
                <span style={{ color: "#22C55E" }}>Pay</span>
              </span>
            </div>

            <h1
              className="text-xl font-bold text-gray-900 text-center mb-1"
              style={{ fontFamily: "Poppins, sans-serif" }}>
              KYC Verification
            </h1>
            <p className="text-gray-500 text-sm text-center mb-6">
              Complete identity verification to unlock your full wallet
            </p>

            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => step === 2 && !submitting && setStep(1)}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 border-none"
                style={
                  step === 1
                    ? { backgroundColor: "#1DA1F2", color: "#fff" }
                    : {
                        backgroundColor: "rgba(29,161,242,0.1)",
                        color: "#1DA1F2",
                        cursor: "pointer",
                      }
                }>
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={
                    step === 1
                      ? { backgroundColor: "rgba(255,255,255,0.3)" }
                      : { backgroundColor: "rgba(29,161,242,0.2)" }
                  }>
                  1
                </span>
                Personal Info
              </button>

              <ChevronRight className="w-4 h-4 text-gray-300" />

              <div
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200"
                style={
                  step === 2
                    ? { backgroundColor: "#1DA1F2", color: "#fff" }
                    : { backgroundColor: "#f1f5f9", color: "#94a3b8" }
                }>
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={step === 2 ? { backgroundColor: "rgba(255,255,255,0.3)" } : { backgroundColor: "#e2e8f0" }}>
                  2
                </span>
                Identity Verification
              </div>
            </div>
          </div>

          {/* ── Step 1: Personal Information ── */}
          {step === 1 && (
            <div className="px-8 py-8">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-xl">📋</span>
                <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: "Poppins, sans-serif" }}>
                  Personal Information
                </h2>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="fullName">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="fullName"
                      type="text"
                      placeholder="e.g. Mohamed Kamara"
                      value={personalInfo.fullName}
                      onChange={(e) => {
                        setPersonalInfo((p) => ({ ...p, fullName: e.target.value }));
                        setStep1Errors((p) => ({ ...p, fullName: "" }));
                      }}
                      onFocus={inputFocus}
                      onBlur={inputBlur}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none transition-all ${
                        step1Errors.fullName ? "border-red-400 bg-red-50" : "border-gray-200"
                      }`}
                    />
                  </div>
                  {step1Errors.fullName && <p className="mt-1 text-xs text-red-500">{step1Errors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="dob">
                    Date of Birth
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="dob"
                      type="date"
                      value={personalInfo.dateOfBirth}
                      onChange={(e) => {
                        setPersonalInfo((p) => ({ ...p, dateOfBirth: e.target.value }));
                        setStep1Errors((p) => ({ ...p, dateOfBirth: "" }));
                      }}
                      onFocus={inputFocus}
                      onBlur={inputBlur}
                      max={new Date().toISOString().split("T")[0]}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none transition-all ${
                        step1Errors.dateOfBirth ? "border-red-400 bg-red-50" : "border-gray-200"
                      }`}
                    />
                  </div>
                  {step1Errors.dateOfBirth && <p className="mt-1 text-xs text-red-500">{step1Errors.dateOfBirth}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="address">
                    Residential Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="address"
                      type="text"
                      placeholder="e.g. 12 Hill Station Road"
                      value={personalInfo.address}
                      onChange={(e) => {
                        setPersonalInfo((p) => ({ ...p, address: e.target.value }));
                        setStep1Errors((p) => ({ ...p, address: "" }));
                      }}
                      onFocus={inputFocus}
                      onBlur={inputBlur}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none transition-all ${
                        step1Errors.address ? "border-red-400 bg-red-50" : "border-gray-200"
                      }`}
                    />
                  </div>
                  {step1Errors.address && <p className="mt-1 text-xs text-red-500">{step1Errors.address}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="city">
                      City
                    </label>
                    <input
                      id="city"
                      type="text"
                      placeholder="e.g. Freetown"
                      value={personalInfo.city}
                      onChange={(e) => {
                        setPersonalInfo((p) => ({ ...p, city: e.target.value }));
                        setStep1Errors((p) => ({ ...p, city: "" }));
                      }}
                      onFocus={inputFocus}
                      onBlur={inputBlur}
                      className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none transition-all ${
                        step1Errors.city ? "border-red-400 bg-red-50" : "border-gray-200"
                      }`}
                    />
                    {step1Errors.city && <p className="mt-1 text-xs text-red-500">{step1Errors.city}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="country">
                      Country
                    </label>
                    <select
                      id="country"
                      value={personalInfo.country}
                      onChange={(e) => {
                        setPersonalInfo((p) => ({ ...p, country: e.target.value }));
                        setStep1Errors((p) => ({ ...p, country: "" }));
                      }}
                      onFocus={inputFocus}
                      onBlur={inputBlur}
                      className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none transition-all appearance-none bg-white ${
                        step1Errors.country ? "border-red-400 bg-red-50" : "border-gray-200"
                      }`}>
                      {AFRICAN_COUNTRIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    {step1Errors.country && <p className="mt-1 text-xs text-red-500">{step1Errors.country}</p>}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleNextStep}
                className="mt-8 w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200 hover:opacity-90 shadow-md border-none"
                style={{ backgroundColor: "#1DA1F2" }}>
                Next Step
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── Step 2: Identity Verification ── */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="px-8 py-8">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-xl">🪪</span>
                <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: "Poppins, sans-serif" }}>
                  Identity Verification
                </h2>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="docType">
                    Document Type
                  </label>
                  <select
                    id="docType"
                    value={identityInfo.documentType}
                    onChange={(e) => {
                      setIdentityInfo((p) => ({ ...p, documentType: e.target.value }));
                      setStep2Errors((p) => ({ ...p, documentType: "" }));
                    }}
                    onFocus={inputFocus}
                    onBlur={inputBlur}
                    className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none transition-all appearance-none bg-white ${
                      step2Errors.documentType ? "border-red-400 bg-red-50" : "border-gray-200"
                    }`}>
                    <option value="">Select document type…</option>
                    {DOCUMENT_TYPES.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                  {step2Errors.documentType && <p className="mt-1 text-xs text-red-500">{step2Errors.documentType}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="docNumber">
                    National ID / Document Number
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="docNumber"
                      type="text"
                      placeholder="e.g. SL-12345678"
                      value={identityInfo.documentNumber}
                      onChange={(e) => {
                        setIdentityInfo((p) => ({ ...p, documentNumber: e.target.value }));
                        setStep2Errors((p) => ({ ...p, documentNumber: "" }));
                      }}
                      onFocus={inputFocus}
                      onBlur={inputBlur}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none transition-all ${
                        step2Errors.documentNumber ? "border-red-400 bg-red-50" : "border-gray-200"
                      }`}
                    />
                  </div>
                  {step2Errors.documentNumber && (
                    <p className="mt-1 text-xs text-red-500">{step2Errors.documentNumber}</p>
                  )}
                </div>

                {/* Upload Identity Document */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Upload Identity Document</label>
                  <div
                    onClick={() => !submitting && identityDocRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (!submitting) setIsDraggingId(true);
                    }}
                    onDragLeave={() => setIsDraggingId(false)}
                    onDrop={(e) => !submitting && handleDrop(e, "identity")}
                    className="relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200"
                    style={{
                      borderColor: isDraggingId ? "#1DA1F2" : identityDocName ? "#22C55E" : "#cbd5e1",
                      backgroundColor: isDraggingId
                        ? "rgba(29,161,242,0.05)"
                        : identityDocName
                          ? "rgba(34,197,94,0.04)"
                          : "#fafafa",
                    }}>
                    <input
                      ref={identityDocRef}
                      type="file"
                      accept="image/*,.pdf"
                      disabled={submitting}
                      className="hidden"
                      onChange={(e) => handleFileChange(e, "identity")}
                    />
                    {identityDocName ? (
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-5 h-5" style={{ color: "#22C55E" }} />
                        <span className="text-sm font-medium text-gray-700 truncate max-w-xs">{identityDocName}</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 font-medium">Click or drag your document here</p>
                        <p className="text-xs text-gray-400 mt-1">Supports JPG, PNG, PDF — max 5MB</p>
                      </>
                    )}
                  </div>
                  {step2Errors.identityDoc && <p className="mt-1 text-xs text-red-500">{step2Errors.identityDoc}</p>}
                </div>

                {/* Upload Selfie */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Upload Selfie</label>
                  <div
                    onClick={() => !submitting && selfieDocRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (!submitting) setIsDraggingSelfie(true);
                    }}
                    onDragLeave={() => setIsDraggingSelfie(false)}
                    onDrop={(e) => !submitting && handleDrop(e, "selfie")}
                    className="relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200"
                    style={{
                      borderColor: isDraggingSelfie ? "#1DA1F2" : selfieDocName ? "#22C55E" : "#cbd5e1",
                      backgroundColor: isDraggingSelfie
                        ? "rgba(29,161,242,0.05)"
                        : selfieDocName
                          ? "rgba(34,197,94,0.04)"
                          : "#fafafa",
                    }}>
                    <input
                      ref={selfieDocRef}
                      type="file"
                      accept="image/*"
                      disabled={submitting}
                      className="hidden"
                      onChange={(e) => handleFileChange(e, "selfie")}
                    />
                    {selfieDocName ? (
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-5 h-5" style={{ color: "#22C55E" }} />
                        <span className="text-sm font-medium text-gray-700 truncate max-w-xs">{selfieDocName}</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 font-medium">Take or upload a clear selfie</p>
                        <p className="text-xs text-gray-400 mt-1">Face must be clearly visible — JPG or PNG only</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Secure warning note */}
                <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                  <span className="text-blue-400 mt-0.5">ℹ️</span>
                  <p className="text-xs text-blue-600 leading-relaxed">
                    Your documents are reviewed by our compliance team and never shared with third parties. All data is
                    encrypted and protected under NovaPay's privacy policy.
                  </p>
                </div>

                {/* Async Submit Error display */}
                {submitError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium text-center">
                    ⚠️ {submitError}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all duration-200 disabled:opacity-55">
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-[2] py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 shadow-md flex items-center justify-center gap-2 border-none"
                  style={{ backgroundColor: "#22C55E" }}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading Securely...
                    </>
                  ) : (
                    "Submit Verification"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          Already verified?{" "}
          <Link to="/dashboard" className="font-medium hover:underline" style={{ color: "#1DA1F2" }}>
            Go to Dashboard
          </Link>
        </p>
      </div>
    </div>
  );
};
