import { Link } from "react-router";
import { UserPlus, ShieldCheck, Zap, ArrowRight } from "lucide-react";

const steps = [
  {
    number: 1,
    icon: UserPlus,
    title: "Create Account",
    description: "Sign up with your name, email, and phone number in under 2 minutes",
  },
  {
    number: 2,
    icon: ShieldCheck,
    title: "Verify Identity",
    description: "Complete KYC with your national ID — fast, secure, and paperless",
  },
  {
    number: 3,
    icon: Zap,
    title: "Start Transacting",
    description: "Send money, receive payments, and manage your Leone wallet instantly",
  },
];

export const HowItWorksSection = () => {
  return (
    <section className="py-20 px-6" id="how-it-works" style={{ backgroundColor: "#F8FAFC" }}>
      <div className="max-w-6xl mx-auto flex flex-col items-center gap-14">
        {/* Headings */}
        <div className="text-center max-w-xl">
          <h2
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            style={{ fontFamily: "'Poppins', sans-serif" }}>
            How NovaPay Works
          </h2>
          <p className="text-gray-500 text-base md:text-lg leading-relaxed">
            Get started in minutes. No bank account required.
          </p>
        </div>

        {/* Steps row */}
        <div className="relative w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-10">
          {/* Dashed connecting line — desktop only */}
          <div
            className="hidden md:block absolute top-[38px] left-[calc(16.66%+28px)] right-[calc(16.66%+28px)] h-px z-0"
            style={{
              borderTop: "2px dashed #BAE6FD",
            }}
          />

          {steps.map(({ number, icon: Icon, title, description }) => (
            <div
              key={number}
              className="relative z-10 flex flex-col items-center text-center gap-4 flex-1 max-w-xs mx-auto">
              {/* Number circle */}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center shadow-md text-white font-extrabold text-xl"
                style={{
                  background: "linear-gradient(135deg, #1DA1F2 0%, #0ea5e9 50%, #22C55E 100%)",
                  fontFamily: "'Poppins', sans-serif",
                }}>
                {number}
              </div>

              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, rgba(29,161,242,0.1), rgba(34,197,94,0.08))",
                  border: "1px solid rgba(29,161,242,0.18)",
                }}>
                <Icon className="w-6 h-6" style={{ color: "#1DA1F2" }} />
              </div>

              {/* Step label */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#1DA1F2" }}>
                  Step {number}
                </p>
                <h3 className="text-lg font-bold text-gray-900 mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  {title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link
          to="/register"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-white font-semibold text-base shadow-lg transition-all duration-200 hover:brightness-110 hover:shadow-[0_0_28px_rgba(29,161,242,0.45)] active:scale-95"
          style={{
            background: "linear-gradient(135deg, #1DA1F2, #22C55E)",
          }}>
          Get Started Free
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </section>
  );
};
