import { Link } from "react-router";
import { Twitter, Facebook, Instagram, Linkedin } from "lucide-react";

export const Footer = () => {
  return (
    <footer style={{ backgroundColor: "#0F172A" }} className="text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <img
                src="/NovaPay Emblem.webp"
                alt="NovaPay"
                className="h-10 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <span className="text-2xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
                <span style={{ color: "#1DA1F2" }}>Nova</span>
                <span style={{ color: "#22C55E" }}>Pay</span>
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">Pay Smart. Live Better.</p>
            <p className="text-gray-500 text-xs mt-2">The future of digital payments in Sierra Leone.</p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: "#1DA1F2" }}>
              Product
            </h4>
            <ul className="space-y-2.5">
              {["Wallet", "Send Money", "Receive", "Transactions"].map((item) => (
                <li key={item}>
                  <Link to="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: "#1DA1F2" }}>
              Company
            </h4>
            <ul className="space-y-2.5">
              {["About", "Careers", "Blog"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: "#1DA1F2" }}>
              Support
            </h4>
            <ul className="space-y-2.5">
              {["Help Center", "Contact", "FAQ"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: "#1DA1F2" }}>
              Legal
            </h4>
            <ul className="space-y-2.5">
              {["Privacy Policy", "Terms of Service"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Social icons */}
        <div className="flex items-center gap-4 mb-8">
          {[
            { icon: Twitter, label: "Twitter/X" },
            { icon: Facebook, label: "Facebook" },
            { icon: Instagram, label: "Instagram" },
            { icon: Linkedin, label: "LinkedIn" },
          ].map(({ icon: Icon, label }) => (
            <a
              key={label}
              href="#"
              aria-label={label}
              className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#1DA1F2] transition-all duration-200"
              style={{ border: "1px solid rgba(255,255,255,0.15)" }}>
              <Icon className="h-4 w-4" />
            </a>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-2"
          style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <p className="text-sm text-gray-500">© 2025 NovaPay. All rights reserved. | Sierra Leone</p>
          <p className="text-xs text-gray-600">Licensed Digital Wallet Provider</p>
        </div>
      </div>
    </footer>
  );
};
