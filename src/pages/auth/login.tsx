import { useState } from "react";
import { useLogin } from "@refinedev/core";
import { Link } from "react-router";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

export const LoginPage = () => {
  const { mutate: login, isPending: isLoading } = useLogin<{ email: string; password: string }>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");
    login(
      { email, password },
      {
        onSuccess: (data) => {
          if (!data.success) {
            setErrorMessage(
              (data.error as { message?: string })?.message || "Invalid email or password. Please try again.",
            );
          }
        },
        onError: () => {
          setErrorMessage("Invalid email or password. Please try again.");
        },
      },
    );
  };

  return (
    <div className="min-h-screen flex">
      {/* Left column — gradient panel (hidden on mobile) */}
      <div
        className="hidden lg:flex lg:w-3/5 flex-col items-center justify-center relative overflow-hidden p-12"
        style={{ background: "linear-gradient(135deg, #1DA1F2 0%, #0d8fe0 40%, #22C55E 100%)" }}>
        {/* Decorative circles */}
        <div className="absolute top-[-80px] left-[-80px] w-72 h-72 rounded-full bg-white/10" />
        <div className="absolute bottom-[-60px] right-[-60px] w-56 h-56 rounded-full bg-white/10" />
        <div className="absolute top-1/2 right-[-40px] w-32 h-32 rounded-full bg-white/10" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-md">
          {/* Logo */}
          <img
            src="/NovaPay Emblem.webp"
            alt="NovaPay"
            className="h-28 w-auto object-contain mb-8 drop-shadow-xl"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />

          <h1
            className="text-4xl font-extrabold text-white mb-3 leading-tight"
            style={{ fontFamily: "Poppins, sans-serif" }}>
            Pay Smart. <span className="text-white/90">Live Better.</span>
          </h1>
          <p className="text-white/80 text-lg mb-12">The future of digital payments in Sierra Leone</p>

          {/* Trust bullets */}
          <div className="flex flex-col gap-4 w-full">
            {[
              { icon: "🔒", label: "Bank-level Security", desc: "256-bit encryption keeps your money safe" },
              { icon: "⚡", label: "Instant Transfers", desc: "Send & receive money in seconds" },
              { icon: "✅", label: "KYC Verified", desc: "Fully compliant identity verification" },
            ].map(({ icon, label, desc }) => (
              <div
                key={label}
                className="flex items-center gap-4 bg-white/15 backdrop-blur-sm rounded-2xl px-5 py-4 text-left">
                <span className="text-2xl">{icon}</span>
                <div>
                  <p className="text-white font-semibold text-sm">{label}</p>
                  <p className="text-white/70 text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right column — form */}
      <div className="flex-1 lg:w-2/5 flex items-center justify-center bg-gray-50 p-6 sm:p-10">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 sm:p-10">
          {/* Small logo (mobile + desktop) */}
          <div className="flex justify-center mb-6">
            <img
              src="/NovaPay Emblem.webp"
              alt="NovaPay"
              className="h-14 w-auto object-contain"
              onError={(e) => {
                const el = e.currentTarget as HTMLImageElement;
                el.style.display = "none";
                const fallback = el.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = "flex";
              }}
            />
            <span className="hidden items-center text-2xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
              <span style={{ color: "#1DA1F2" }}>Nova</span>
              <span style={{ color: "#22C55E" }}>Pay</span>
            </span>
          </div>

          <h2
            className="text-2xl font-bold text-gray-900 text-center mb-1"
            style={{ fontFamily: "Poppins, sans-serif" }}>
            Welcome Back
          </h2>
          <p className="text-gray-500 text-sm text-center mb-8">Sign in to your NovaPay account</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                  style={{ "--tw-ring-color": "#1DA1F2" } as React.CSSProperties}
                  onFocus={(e) => (e.currentTarget.style.boxShadow = "0 0 0 3px rgba(29,161,242,0.15)")}
                  onBlur={(e) => (e.currentTarget.style.boxShadow = "")}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none transition-all"
                  onFocus={(e) => (e.currentTarget.style.boxShadow = "0 0 0 3px rgba(29,161,242,0.15)")}
                  onBlur={(e) => (e.currentTarget.style.boxShadow = "")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-xs font-medium hover:underline transition-colors"
                style={{ color: "#1DA1F2" }}>
                Forgot Password?
              </Link>
            </div>

            {/* Error message */}
            {errorMessage && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <span className="text-red-500 text-sm leading-snug">{errorMessage}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
              style={{ backgroundColor: "#1DA1F2" }}>
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Signing in…
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Register link */}
          <p className="text-center text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link
              to="/register"
              className="font-semibold hover:underline transition-colors"
              style={{ color: "#22C55E" }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
