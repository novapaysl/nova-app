import { Link } from "react-router";

const recentPayments = [
  { name: "Fatima Koroma", amount: "+SLE 850", time: "2 min ago" },
  { name: "Mohamed Sesay", amount: "+SLE 1,200", time: "15 min ago" },
  { name: "Aminata Bangura", amount: "+SLE 560", time: "1 hr ago" },
];

const barHeights = [40, 65, 50, 80, 60, 90, 70];

export const MerchantSection = () => {
  return (
    <section
      className="py-20 px-6"
      id="business"
      style={{
        background: "linear-gradient(135deg, #1DA1F2 0%, #0ea5e9 40%, #22C55E 100%)",
      }}>
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left — Copy */}
        <div className="flex flex-col gap-6">
          {/* Pill badge */}
          <span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold w-fit"
            style={{
              background: "rgba(255,255,255,0.18)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.3)",
            }}>
            🏪 For Businesses
          </span>

          <h2
            className="text-3xl md:text-4xl font-bold text-white leading-snug"
            style={{ fontFamily: "'Poppins', sans-serif" }}>
            Grow your business with NovaPay
          </h2>

          <p className="text-white/90 text-base md:text-lg leading-relaxed">
            Accept digital payments, manage payroll, and track business transactions — all from your NovaPay merchant
            dashboard.
          </p>

          {/* Benefit bullets */}
          <ul className="flex flex-col gap-3">
            {[
              "Accept instant SLE payments",
              "Business wallet & transaction reports",
              "Easy employee payroll management",
            ].map((benefit) => (
              <li key={benefit} className="flex items-center gap-3 text-white font-medium">
                <span
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: "rgba(255,255,255,0.22)" }}>
                  ✓
                </span>
                {benefit}
              </li>
            ))}
          </ul>

          {/* CTA */}
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-base shadow-lg transition-all duration-200 hover:shadow-xl hover:brightness-105 active:scale-95 w-fit mt-2"
            style={{
              background: "#fff",
              color: "#1DA1F2",
            }}>
            Become a Merchant
          </Link>
        </div>

        {/* Right — Dashboard mockup */}
        <div
          className="rounded-2xl p-6 flex flex-col gap-5 shadow-2xl"
          style={{
            background: "rgba(15, 23, 42, 0.75)",
            border: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(16px)",
          }}>
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/50 uppercase tracking-widest font-medium">Merchant Dashboard</p>
              <p className="text-white font-bold text-lg mt-0.5" style={{ fontFamily: "'Poppins', sans-serif" }}>
                NovaPay Business
              </p>
            </div>
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{ background: "rgba(34,197,94,0.18)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.3)" }}>
              ● Live
            </span>
          </div>

          {/* Revenue stat */}
          <div
            className="rounded-xl p-4"
            style={{ background: "rgba(29,161,242,0.12)", border: "1px solid rgba(29,161,242,0.2)" }}>
            <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Today's Revenue</p>
            <p className="text-white text-2xl font-extrabold" style={{ fontFamily: "'Poppins', sans-serif" }}>
              SLE 4,200
            </p>
            <p className="text-green-400 text-xs mt-1 font-medium">↑ +12.4% vs yesterday</p>
          </div>

          {/* Bar chart placeholder */}
          <div className="flex flex-col gap-2">
            <p className="text-white/50 text-xs uppercase tracking-wider">Weekly Overview</p>
            <div className="flex items-end gap-2 h-16">
              {barHeights.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-md transition-all"
                  style={{
                    height: `${h}%`,
                    background:
                      i === barHeights.length - 1
                        ? "linear-gradient(180deg, #22C55E, #16a34a)"
                        : "linear-gradient(180deg, rgba(29,161,242,0.7), rgba(29,161,242,0.3))",
                  }}
                />
              ))}
            </div>
            <div className="flex justify-between text-white/30 text-xs">
              {["M", "T", "W", "T", "F", "S", "S"].map((d) => (
                <span key={d} className="flex-1 text-center">
                  {d}
                </span>
              ))}
            </div>
          </div>

          {/* Recent payments */}
          <div className="flex flex-col gap-2">
            <p className="text-white/50 text-xs uppercase tracking-wider">Recent Payments</p>
            {recentPayments.map(({ name, amount, time }) => (
              <div
                key={name}
                className="flex items-center justify-between rounded-lg px-3 py-2"
                style={{ background: "rgba(255,255,255,0.05)" }}>
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ background: "rgba(29,161,242,0.2)", color: "#1DA1F2" }}>
                    {name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-white text-xs font-medium leading-none">{name}</p>
                    <p className="text-white/40 text-xs mt-0.5">{time}</p>
                  </div>
                </div>
                <span className="text-green-400 text-sm font-semibold">{amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
