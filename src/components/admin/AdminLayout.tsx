import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router";
import { LayoutDashboard, Users, ShieldCheck, ArrowLeftRight, Lock, Bell, Menu, X, Power } from "lucide-react";

const navItems = [
  { label: "Overview", icon: LayoutDashboard, path: "/admin" },
  { label: "Users", icon: Users, path: "/admin/users" },
  { label: "KYC Compliance", icon: ShieldCheck, path: "/admin/kyc" },
  { label: "Transactions", icon: ArrowLeftRight, path: "/admin/transactions" },
  { label: "Security Logs", icon: Lock, path: "/admin/security" },
];

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(path);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <img
          src="/NovaPay Emblem.webp"
          alt="NovaPay"
          className="h-9 w-auto object-contain flex-shrink-0"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
        <div className="flex flex-col min-w-0">
          <span
            className="text-white text-base font-bold tracking-wide leading-tight"
            style={{ fontFamily: "Poppins, sans-serif" }}>
            NovaPay Admin
          </span>
          <span
            className="text-[10px] font-bold tracking-widest px-1.5 py-0.5 rounded self-start mt-0.5"
            style={{ backgroundColor: "#F59E0B", color: "#0F172A" }}>
            ADMIN
          </span>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ label, icon: Icon, path }) => {
          const active = isActive(path);
          return (
            <Link
              key={path}
              to={path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative ${
                active ? "text-white" : "text-gray-400 hover:text-white"
              }`}
              style={active ? { backgroundColor: "rgba(29, 161, 242, 0.15)" } : undefined}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.06)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "";
                }
              }}>
              {active && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full"
                  style={{ backgroundColor: "#1DA1F2" }}
                />
              )}
              <Icon size={18} className="flex-shrink-0" style={{ color: active ? "#1DA1F2" : undefined }} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: Admin Panel label + logout */}
      <div className="px-3 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg mb-1">
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{ backgroundColor: "#1E293B", color: "#1DA1F2", border: "1px solid rgba(29,161,242,0.3)" }}>
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold">Admin Panel</p>
            <p className="text-gray-500 text-xs">System Administrator</p>
          </div>
        </div>
        <button
          onClick={() => {
            window.location.href = "/";
          }}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-all duration-150"
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.06)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "")}>
          <Power size={18} />
          Exit Admin
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#0F172A" }}>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[260px] flex-shrink-0 h-full" style={{ backgroundColor: "#0F172A" }}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          style={{ backdropFilter: "blur(4px)", backgroundColor: "rgba(0,0,0,0.6)" }}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-[260px] flex flex-col md:hidden transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ backgroundColor: "#0F172A" }}>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top Header */}
        <header
          className="flex items-center justify-between h-14 px-4 flex-shrink-0"
          style={{
            backgroundColor: "#1E293B",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}>
          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg transition-colors text-gray-400 hover:text-white"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
            style={{ backgroundColor: "transparent" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.08)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "")}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Title */}
          <div className="flex items-center gap-2">
            <h1
              className="text-white font-semibold text-base tracking-wide hidden md:block"
              style={{ fontFamily: "Poppins, sans-serif" }}>
              Admin Dashboard
            </h1>
            {/* Mobile title */}
            <h1
              className="text-white font-semibold text-base tracking-wide md:hidden"
              style={{ fontFamily: "Poppins, sans-serif" }}>
              Admin
            </h1>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <button
              className="relative p-2 rounded-lg text-gray-400 hover:text-white transition-colors"
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.08)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "")}>
              <Bell size={20} />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full" style={{ backgroundColor: "#1DA1F2" }} />
            </button>

            {/* Admin Avatar */}
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold cursor-pointer select-none"
              style={{
                background: "linear-gradient(135deg, #1DA1F2, #0EA5E9)",
                color: "#fff",
              }}>
              A
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6" style={{ backgroundColor: "#0F172A", color: "#E2E8F0" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
