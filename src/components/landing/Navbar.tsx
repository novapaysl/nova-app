import { useState } from "react";
import { Link } from "react-router";
import { Menu, X } from "lucide-react";

export const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <img
              src="/NovaPay Emblem.webp"
              alt="NovaPay"
              className="h-10 w-auto object-contain"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = "none";
                const sibling = target.nextElementSibling as HTMLElement;
                if (sibling) sibling.style.display = "flex";
              }}
            />
            <span className="hidden items-center text-2xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
              <span style={{ color: "#1DA1F2" }}>Nova</span>
              <span style={{ color: "#22C55E" }}>Pay</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-gray-600 hover:text-[#1DA1F2] transition-colors">
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-gray-600 hover:text-[#1DA1F2] transition-colors">
              How It Works
            </a>
            <a href="#business" className="text-sm font-medium text-gray-600 hover:text-[#1DA1F2] transition-colors">
              For Business
            </a>
          </nav>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-semibold rounded-lg border-2 border-[#1DA1F2] text-[#1DA1F2] hover:bg-[#1DA1F2] hover:text-white transition-all duration-200">
              Login
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-sm font-semibold rounded-lg text-white transition-all duration-200 shadow-sm hover:shadow-md hover:opacity-90"
              style={{ backgroundColor: "#1DA1F2" }}>
              Create Account
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-[#1DA1F2] hover:bg-gray-100 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 pt-3 pb-5 space-y-3 shadow-lg">
          <a
            href="#features"
            className="block py-2 text-sm font-medium text-gray-600 hover:text-[#1DA1F2]"
            onClick={() => setMenuOpen(false)}>
            Features
          </a>
          <a
            href="#how-it-works"
            className="block py-2 text-sm font-medium text-gray-600 hover:text-[#1DA1F2]"
            onClick={() => setMenuOpen(false)}>
            How It Works
          </a>
          <a
            href="#business"
            className="block py-2 text-sm font-medium text-gray-600 hover:text-[#1DA1F2]"
            onClick={() => setMenuOpen(false)}>
            For Business
          </a>
          <div className="flex flex-col gap-2 pt-2">
            <Link
              to="/login"
              className="w-full text-center py-2.5 text-sm font-semibold rounded-lg border-2 border-[#1DA1F2] text-[#1DA1F2]"
              onClick={() => setMenuOpen(false)}>
              Login
            </Link>
            <Link
              to="/register"
              className="w-full text-center py-2.5 text-sm font-semibold rounded-lg text-white"
              style={{ backgroundColor: "#1DA1F2" }}
              onClick={() => setMenuOpen(false)}>
              Create Account
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
