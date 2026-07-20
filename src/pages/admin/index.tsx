import React, { useState, useEffect } from "react";
import { useList } from "@refinedev/core";
import { Users, Wallet, ArrowLeftRight, ShieldCheck, TrendingUp, CheckCircle } from "lucide-react";
import { Link } from "react-router";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { createClient } from "@supabase/supabase-js";

dayjs.extend(relativeTime);

// 🔐 Supabase initialization for direct Admin Actions
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const cardStyle = { backgroundColor: "#1E293B", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.07)" };

const statusColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: "rgba(245,158,11,0.15)", text: "#F59E0B" },
  approved: { bg: "rgba(34,197,94,0.15)", text: "#22C55E" },
  active: { bg: "rgba(34,197,94,0.15)", text: "#22C55E" },
  suspended: { bg: "rgba(239,68,68,0.15)", text: "#EF4444" },
  rejected: { bg: "rgba(239,68,68,0.15)", text: "#EF4444" },
  completed: { bg: "rgba(34,197,94,0.15)", text: "#22C55E" },
  failed: { bg: "rgba(239,68,68,0.15)", text: "#EF4444" },
  processing: { bg: "rgba(29,161,242,0.15)", text: "#1DA1F2" },
};

function StatusBadge({ status }: { status?: string }) {
  const s = (status ?? "").toLowerCase();
  const colors = statusColors[s] ?? { bg: "rgba(100,116,139,0.2)", text: "#94A3B8" };
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
      style={{ backgroundColor: colors.bg, color: colors.text }}>
      {status ?? "—"}
    </span>
  );
}

function getInitials(name?: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_COLORS = ["#1DA1F2", "#22C55E", "#A855F7", "#F59E0B", "#EF4444"];
function avatarColor(str?: string) {
  if (!str) return AVATAR_COLORS[0];
  const idx = str.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

export const AdminOverviewPage = () => {
  // ── Stat counts (Your existing Refine logic) ──────────────────
  const { result: totalUsersResult } = useList({
    resource: "profiles",
    pagination: { pageSize: 1 },
  });

  const { result: activeWalletsResult } = useList({
    resource: "wallets",
    pagination: { pageSize: 1 },
  });

  const { result: totalTxResult } = useList({
    resource: "wallet_transactions",
    pagination: { pageSize: 1 },
  });

  const { result: pendingKycResult } = useList({
    resource: "profiles",
    pagination: { pageSize: 1 },
    filters: [{ field: "account_status", operator: "eq", value: "pending" }],
  });

  // ── Recent data ───────────────────────────────────────────────
  const { result: recentUsersResult } = useList({
    resource: "profiles",
    pagination: { pageSize: 5 },
    sorters: [{ field: "created_at", order: "desc" }],
  });

  const { result: recentTransfersResult } = useList({
    resource: "transfers",
    pagination: { pageSize: 5 },
    sorters: [{ field: "created_at", order: "desc" }],
  });

  // ── 👑 NEW: Custom Admin Wallet Approval Logic ──────────────────
  const [pendingWalletUsers, setPendingWalletUsers] = useState<any[]>([]);
  const [loadingApprovals, setLoadingApprovals] = useState(true);

  useEffect(() => {
    fetchPendingWallets();
  }, []);

  const fetchPendingWallets = async () => {
    setLoadingApprovals(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("wallet_approved", false);

    if (!error && data) {
      setPendingWalletUsers(data);
    }
    setLoadingApprovals(false);
  };

  const approveWallet = async (userId: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ wallet_approved: true })
      .eq("id", userId);

    if (!error) {
      alert("✅ User Wallet Approved Successfully!");
      fetchPendingWallets(); // Refresh the list automatically
    } else {
      alert("Error approving user: " + error.message);
    }
  };

  const statCards = [
    {
      label: "Total Users",
      value: totalUsersResult?.total ?? "—",
      icon: Users,
      iconBg: "rgba(29,161,242,0.15)",
      iconColor: "#1DA1F2",
      trend: "+12 this week",
    },
    {
      label: "Active Wallets",
      value: activeWalletsResult?.total ?? "—",
      icon: Wallet,
      iconBg: "rgba(34,197,94,0.15)",
      iconColor: "#22C55E",
      trend: "+8 this week",
    },
    {
      label: "Total Transactions",
      value: totalTxResult?.total ?? "—",
      icon: ArrowLeftRight,
      iconBg: "rgba(168,85,247,0.15)",
      iconColor: "#A855F7",
      trend: "+47 this week",
    },
    {
      label: "Pending KYC",
      value: pendingKycResult?.total ?? "—",
      icon: ShieldCheck,
      iconBg: "rgba(245,158,11,0.15)",
      iconColor: "#F59E0B",
      trend: "Requires review",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "Poppins, sans-serif" }}>
          Platform Overview
        </h1>
        <p className="text-sm mt-1" style={{ color: "#94A3B8" }}>
          Real-time NovaPay platform statistics
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, iconBg, iconColor, trend }) => (
          <div key={label} style={cardStyle} className="p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div
                className="h-11 w-11 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: iconBg }}>
                <Icon size={22} style={{ color: iconColor }} />
              </div>
              <div className="flex items-center gap-1 text-xs font-medium" style={{ color: "#22C55E" }}>
                <TrendingUp size={12} />
                <span>{trend}</span>
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold leading-tight" style={{ color: "#F1F5F9" }}>
                {typeof value === "number" ? value.toLocaleString() : value}
              </p>
              <p className="text-sm mt-0.5" style={{ color: "#94A3B8" }}>
                {label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 🚀 NEW ACTION SECTION: Pending Wallet Approvals */}
      <div style={cardStyle} className="p-5 flex flex-col gap-4 border-l-4 border-l-orange-500">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <ShieldCheck size={18} className="text-orange-400" /> Action Required: Pending Wallet Approvals
          </h2>
        </div>
        
        {loadingApprovals ? (
          <p className="text-sm text-slate-400 py-2">Scanning for pending wallets...</p>
        ) : pendingWalletUsers.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center bg-slate-800/30 rounded-lg border border-slate-700/50">
            🎉 All caught up! No users are currently waiting for wallet approval.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingWalletUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 bg-slate-800 rounded-lg border border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    {getInitials(user.full_name)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{user.full_name || "Unnamed User"}</p>
                    <p className="text-xs text-slate-400">{user.email}</p>
                  </div>
                </div>
                <button 
                  onClick={() => approveWallet(user.id)}
                  className="flex items-center gap-1 bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-md text-xs font-bold transition-colors"
                >
                  <CheckCircle size={14} /> Approve
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Users */}
        <div style={cardStyle} className="p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Recent Users</h2>
            <Link
              to="/admin/users"
              className="text-xs font-medium transition-colors hover:underline"
              style={{ color: "#1DA1F2" }}>
              View All Users →
            </Link>
          </div>
          <div className="space-y-3">
            {(recentUsersResult?.data ?? []).length === 0 && (
              <p className="text-sm text-center py-4" style={{ color: "#64748B" }}>
                No users found
              </p>
            )}
            {(recentUsersResult?.data ?? []).map((user: any) => (
              <div
                key={user.id}
                className="flex items-center gap-3 py-2"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                {/* Avatar */}
                <div
                  className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{
                    backgroundColor: avatarColor(user.full_name) + "22",
                    color: avatarColor(user.full_name),
                    border: `1.5px solid ${avatarColor(user.full_name)}44`,
                  }}>
                  {getInitials(user.full_name)}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "#E2E8F0" }}>
                    {user.full_name ?? "—"}
                  </p>
                  <p className="text-xs truncate" style={{ color: "#64748B" }}>
                    {user.email ?? "—"}
                  </p>
                </div>
                {/* Right */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <StatusBadge status={user.account_status} />
                  <span className="text-[10px]" style={{ color: "#475569" }}>
                    {user.created_at ? dayjs(user.created_at).fromNow() : "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transfers */}
        <div style={cardStyle} className="p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Recent Transfers</h2>
            <Link
              to="/admin/transactions"
              className="text-xs font-medium transition-colors hover:underline"
              style={{ color: "#1DA1F2" }}>
              View All Transactions →
            </Link>
          </div>
          <div className="space-y-3">
            {(recentTransfersResult?.data ?? []).length === 0 && (
              <p className="text-sm text-center py-4" style={{ color: "#64748B" }}>
                No transfers found
              </p>
            )}
            {(recentTransfersResult?.data ?? []).map((transfer: any) => (
              <div
                key={transfer.id}
                className="flex items-center gap-3 py-2"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                {/* Icon */}
                <div
                  className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "rgba(168,85,247,0.12)" }}>
                  <ArrowLeftRight size={16} style={{ color: "#A855F7" }} />
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono truncate" style={{ color: "#94A3B8" }}>
                    {transfer.reference ?? "—"}
                  </p>
                  <p className="text-[11px] truncate mt-0.5" style={{ color: "#475569" }}>
                    {transfer.sender_wallet ? String(transfer.sender_wallet).slice(0, 8) + "…" : "—"} →{" "}
                    {transfer.receiver_wallet ? String(transfer.receiver_wallet).slice(0, 8) + "…" : "—"}
                  </p>
                </div>
                {/* Right */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-sm font-semibold" style={{ color: "#22C55E" }}>
                    SLE {Number(transfer.amount ?? 0).toLocaleString("en-SL", { minimumFractionDigits: 2 })}
                  </span>
                  <StatusBadge status={transfer.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};