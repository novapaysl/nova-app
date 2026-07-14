const features = [
  {
    emoji: "💰",
    title: "Digital Wallet",
    description: "Store and manage your Leone (SLE) balance securely in your NovaPay wallet",
  },
  {
    emoji: "📤",
    title: "Send Money",
    description: "Transfer money to any NovaPay wallet instantly with zero hidden fees",
  },
  {
    emoji: "📥",
    title: "Receive Payments",
    description: "Share your wallet number or QR code to receive money from anyone",
  },
  {
    emoji: "📊",
    title: "Transaction History",
    description: "Track every debit and credit with detailed records and downloadable statements",
  },
  {
    emoji: "🛡️",
    title: "Security Monitoring",
    description: "Real-time alerts and security logs keep your account protected 24/7",
  },
];

export const FeaturesSection = () => {
  return (
    <section className="py-20 px-6 bg-white" id="features">
      <div className="max-w-6xl mx-auto flex flex-col items-center gap-12">
        {/* Headings */}
        <div className="text-center max-w-2xl">
          <h2
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            style={{ fontFamily: "'Poppins', sans-serif" }}>
            Everything you need to manage money in Sierra Leone
          </h2>
          <p className="text-gray-500 text-base md:text-lg leading-relaxed">
            A complete financial toolkit built for individuals and businesses
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {features.map(({ emoji, title, description }) => (
            <div
              key={title}
              className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 p-7 flex flex-col gap-4">
              {/* Icon bubble */}
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                style={{
                  background: "linear-gradient(135deg, rgba(29,161,242,0.12), rgba(34,197,94,0.08))",
                  border: "1px solid rgba(29,161,242,0.15)",
                }}>
                {emoji}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  {title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
              </div>
            </div>
          ))}

          {/* 5th card centers itself on a 3-col grid by spanning center on large screens */}
          {/* handled naturally by flex/grid flow — 5 cards: row of 3, row of 2 */}
        </div>
      </div>
    </section>
  );
};
