import { ShieldCheck, BadgeCheck, CreditCard } from "lucide-react";

const cards = [
  {
    icon: ShieldCheck,
    title: "Secure Payments",
    description: "256-bit SSL encryption protects every transaction you make",
    emoji: "🔐",
  },
  {
    icon: BadgeCheck,
    title: "KYC Verified Identity",
    description: "Identity verification ensures only real people use NovaPay",
    emoji: "🪪",
  },
  {
    icon: CreditCard,
    title: "Digital Leone Wallet",
    description: "Your SLE wallet is insured and accessible 24/7 from anywhere",
    emoji: "💳",
  },
];

export const TrustSection = () => {
  return (
    <section className="bg-white py-20 px-6">
      <div className="max-w-6xl mx-auto flex flex-col items-center gap-12">
        {/* Headings */}
        <div className="text-center max-w-2xl">
          <h2
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            style={{ fontFamily: "'Poppins', sans-serif" }}>
            Your money. Your identity.{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #1DA1F2, #22C55E)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
              Protected.
            </span>
          </h2>
          <p className="text-gray-500 text-base md:text-lg leading-relaxed">
            NovaPay uses bank-level encryption and identity verification to keep you safe.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {cards.map(({ icon: Icon, title, description, emoji }) => (
            <div
              key={title}
              className="group flex flex-col items-center text-center gap-4 p-8 rounded-2xl border border-blue-100 shadow-lg bg-white/60 backdrop-blur transition-transform duration-300 hover:scale-105"
              style={{
                background: "rgba(255,255,255,0.6)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
              }}>
              {/* Icon circle */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm"
                style={{
                  background: "linear-gradient(135deg, rgba(29,161,242,0.12), rgba(34,197,94,0.1))",
                  border: "1px solid rgba(29,161,242,0.2)",
                }}>
                <Icon className="w-7 h-7" style={{ color: "#1DA1F2" }} />
              </div>

              <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                {emoji} {title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
