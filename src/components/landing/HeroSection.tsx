import { Link } from "react-router";
import { ArrowRight } from "lucide-react";

export const HeroSection = () => {
  return (
    <section
      className="relative overflow-hidden min-h-[92vh] flex items-center"
      style={{
        background: "linear-gradient(135deg, #0F172A 0%, #0c2340 40%, #0e3a4a 70%, #0F172A 100%)",
      }}>
      {/* Floating background circles */}
      <div
        className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-10 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #1DA1F2 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute top-1/2 -right-40 w-[600px] h-[600px] rounded-full opacity-10 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #22C55E 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full opacity-[0.06] pointer-events-none"
        style={{
          background: "radial-gradient(circle, #1DA1F2 0%, transparent 70%)",
        }}
      />

      {/* Floating animation keyframes */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-18px); }
        }
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
        }
        .float-card {
          animation: float 5s ease-in-out infinite;
        }
        .float-slow {
          animation: floatSlow 7s ease-in-out infinite;
        }
      `}</style>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-20 lg:py-28 flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
        {/* ── Left Column (60%) ── */}
        <div className="flex-1 lg:w-3/5 flex flex-col items-start gap-6 text-left">
          {/* Badge */}
          <span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium border"
            style={{
              borderColor: "#1DA1F2",
              backgroundColor: "rgba(29,161,242,0.1)",
              color: "#7dd3fc",
            }}>
            🇸🇱 Sierra Leone's #1 Digital Wallet
          </span>

          {/* H1 */}
          <h1
            className="text-4xl md:text-5xl xl:text-6xl font-extrabold leading-tight text-white"
            style={{ fontFamily: "'Poppins', sans-serif" }}>
            The Future of{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #1DA1F2, #22C55E)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
              Digital Payments
            </span>{" "}
            in Sierra Leone
          </h1>

          {/* Subtitle */}
          <p
            className="text-base md:text-lg text-gray-300 max-w-xl leading-relaxed"
            style={{ fontFamily: "'Inter', sans-serif" }}>
            Send money instantly, manage your Leone wallet, and grow your business — all from one secure platform.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-white font-semibold text-base shadow-lg transition-all duration-200 hover:brightness-110 hover:shadow-[0_0_24px_rgba(29,161,242,0.5)] active:scale-95"
              style={{ backgroundColor: "#1DA1F2" }}>
              Create Free Account
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-base border-2 border-white text-white transition-all duration-200 hover:bg-white hover:text-[#0F172A] active:scale-95">
              Login to Dashboard
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap gap-4 mt-2">
            {[
              { icon: "🔒", label: "Bank-level Security" },
              { icon: "⚡", label: "Instant Transfers" },
              { icon: "✅", label: "KYC Verified" },
            ].map(({ icon, label }) => (
              <span key={label} className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-300">
                <span>{icon}</span>
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* ── Right Column (40%) — Dashboard Mockup ── */}
        <div className="hidden sm:flex lg:w-2/5 justify-center items-center w-full">
          <div className="float-card relative w-full max-w-sm">
            {/* Glow behind card */}
            <div
              className="absolute inset-0 rounded-3xl blur-3xl opacity-30 -z-10"
              style={{
                background: "linear-gradient(135deg, #1DA1F2, #22C55E)",
              }}
            />

            {/* Glassmorphism card */}
            <div
              className="rounded-3xl p-6 shadow-2xl border border-white/10"
              style={{
                background: "rgba(255,255,255,0.06)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
              }}>
              {/* Wallet balance */}
              <div className="mb-5">
                <p className="text-xs text-gray-400 font-medium mb-1 uppercase tracking-widest">Available Balance</p>
                <p className="text-4xl font-extrabold text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  SLE{" "}
                  <span
                    style={{
                      background: "linear-gradient(90deg, #1DA1F2, #22C55E)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}>
                    12,450.00
                  </span>
                </p>
              </div>

              {/* Action pills */}
              <div className="flex gap-3 mb-6">
                <button
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110"
                  style={{ backgroundColor: "#1DA1F2" }}>
                  <span>↑</span> Send
                </button>
                <button
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110"
                  style={{ backgroundColor: "#22C55E" }}>
                  <span>↓</span> Receive
                </button>
              </div>

              {/* Divider */}
              <div className="h-px bg-white/10 mb-4" />

              {/* Mini transaction list */}
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-3 font-medium">Recent Transactions</p>
              <div className="flex flex-col gap-3">
                {[
                  {
                    label: "Mobile Top-up",
                    sub: "Today, 09:14 AM",
                    amount: "- SLE 25.00",
                    color: "#EF4444",
                    dot: "#EF4444",
                  },
                  {
                    label: "Salary Credit",
                    sub: "Yesterday, 12:00 PM",
                    amount: "+ SLE 3,200.00",
                    color: "#22C55E",
                    dot: "#22C55E",
                  },
                  {
                    label: "Transfer to Amie",
                    sub: "Mon, 08:30 AM",
                    amount: "- SLE 150.00",
                    color: "#EF4444",
                    dot: "#F97316",
                  },
                ].map((tx) => (
                  <div key={tx.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: tx.dot }} />
                      <div>
                        <p className="text-sm font-medium text-white leading-tight">{tx.label}</p>
                        <p className="text-xs text-gray-400">{tx.sub}</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold" style={{ color: tx.color }}>
                      {tx.amount}
                    </span>
                  </div>
                ))}
              </div>

              {/* Bottom badge */}
              <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs text-gray-400">🔒 256-bit Encrypted</span>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: "rgba(34,197,94,0.15)",
                    color: "#22C55E",
                  }}>
                  ● Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
