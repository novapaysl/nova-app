import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router";
import {
  LayoutDashboard,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  List,
  User,
  Shield,
  Bell,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { useLogout, useGetIdentity, useList } from "@refinedev/core";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Wallet", icon: Wallet, path: "/dashboard/wallet" },
  { label: "Send Money", icon: ArrowUpRight, path: "/dashboard/send" },
  { label: "Receive", icon: ArrowDownLeft, path: "/dashboard/receive" },
  { label: "Transactions", icon: List, path: "/dashboard/transactions" },
  { label: "Profile", icon: User, path: "/dashboard/profile" },
  { label: "Security", icon: Shield, path: "/dashboard/security" },
  { label: "Notifications", icon: Bell, path: "/dashboard/notifications" },
];

export const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { mutate: logout } = useLogout();
  const { data: identity } = useGetIdentity<{ id?: string; email?: string; name?: string }>();

  const userId = identity?.id;
  const userEmail = identity?.email ?? identity?.name ?? "User";
  const userName = userEmail.split("@")[0] ?? "User";
  const userInitial = userName.charAt(0).toUpperCase();

  // Fetch real unread notification count
  const { result: unreadResult } = useList({
    resource: "notifications",
    filters: userId
      ? [
          { field: "user_id", operator: "eq", value: userId },
          { field: "status", operator: "eq", value: "unread" },
        ]
      : [],
    pagination: { pageSize: 100 },
    queryOptions: { enabled: !!userId },
  });
  const unreadCount = (unreadResult.data ?? []).length;

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(path);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <img
          src="/NovaPay Emblem.webp"
          alt="NovaPay"
          className="h-9 w-auto object-contain"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
        <span className="text-white text-xl font-bold tracking-wide" style={{ fontFamily: "Poppins, sans-serif" }}>
          NovaPay
        </span>
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
                active ? "text-white bg-[#1DA1F2]/20" : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}>
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-[#1DA1F2]" />
              )}
              <Icon className={`h-4.5 w-4.5 flex-shrink-0 ${active ? "text-[#1DA1F2]" : ""}`} size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User & Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg mb-2">
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #1DA1F2, #22C55E)" }}>
            {userInitial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate capitalize">{userName}</p>
            <p className="text-gray-400 text-xs truncate">{userEmail}</p>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-150">
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[260px] flex-shrink-0 h-full" style={{ backgroundColor: "#0F172A" }}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          style={{ backdropFilter: "blur(4px)", backgroundColor: "rgba(0,0,0,0.5)" }}
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
        <header className="flex items-center justify-between h-14 px-4 bg-white border-b border-gray-200 flex-shrink-0">
          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Desktop spacer */}
          <div className="hidden md:block" />

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <Link
              to="/dashboard/notifications"
              className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">
              <Bell size={20} />
              {unreadCount > 0 && (
                <span
                  className="absolute top-1 right-1 h-4 w-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                  style={{ backgroundColor: "#1DA1F2" }}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>

            {/* User Avatar */}
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold text-white cursor-pointer"
              style={{ background: "linear-gradient(135deg, #1DA1F2, #22C55E)" }}>
              {userInitial}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
