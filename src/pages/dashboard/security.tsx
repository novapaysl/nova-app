import { useMemo, useState } from "react";
import { useGetIdentity, useList } from "@refinedev/core";
import {
  Shield,
  LogIn,
  AlertTriangle,
  Settings,
  KeyRound,
  User,
  ChevronLeft,
  ChevronRight,
  Info,
  ShieldOff,
} from "lucide-react";
import dayjs from "dayjs";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Types ────────────────────────────────────────────────────────────────────

type Identity = { id: string; name?: string; email?: string };

type SecurityLog = {
  id: string;
  user_id: string;
  action: string;
  ip_address: string;
  device: string;
  created_at: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ACTION_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  login_success: {
    label: "Login Successful",
    color: "#16A34A",
    bgColor: "#DCFCE7",
    icon: LogIn,
  },
  login_failed: {
    label: "Login Failed",
    color: "#DC2626",
    bgColor: "#FEE2E2",
    icon: AlertTriangle,
  },
  password_change: {
    label: "Password Changed",
    color: "#D97706",
    bgColor: "#FEF3C7",
    icon: KeyRound,
  },
  profile_update: {
    label: "Profile Updated",
    color: "#2563EB",
    bgColor: "#DBEAFE",
    icon: User,
  },
  logout: {
    label: "Logged Out",
    color: "#6B7280",
    bgColor: "#F3F4F6",
    icon: LogIn,
  },
  suspicious_activity: {
    label: "Suspicious Activity",
    color: "#DC2626",
    bgColor: "#FEE2E2",
    icon: AlertTriangle,
  },
};

function getActionConfig(action?: string) {
  if (!action) return { label: "Unknown", color: "#6B7280", bgColor: "#F3F4F6", icon: Settings };
  const key = action.toLowerCase();
  if (ACTION_CONFIG[key]) return ACTION_CONFIG[key];
  // Fallback: prettify the string
  const label = action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return { label, color: "#6B7280", bgColor: "#F3F4F6", icon: Settings };
}

function ActionCell({ action }: { action?: string }) {
  const cfg = getActionConfig(action);
  const Icon = cfg.icon;
  return (
    <div className="flex items-center gap-2">
      <span
        className="h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: cfg.bgColor }}>
        <Icon size={13} style={{ color: cfg.color }} />
      </span>
      <span className="text-sm font-medium" style={{ color: cfg.color }}>
        {cfg.label}
      </span>
    </div>
  );
}

// ─── Row Skeleton ─────────────────────────────────────────────────────────────

function RowSkeleton() {
  return (
    <tr className="border-b border-gray-100">
      {[140, 110, 160, 120].map((w, i) => (
        <td key={i} className="px-4 py-3.5">
          <Skeleton className="h-4 rounded" style={{ width: w }} />
        </td>
      ))}
    </tr>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 15;

// ─── Main Page ────────────────────────────────────────────────────────────────

export const SecurityPage = () => {
  const { data: identity } = useGetIdentity<Identity>();
  const userId = identity?.id;
  const [currentPage, setCurrentPage] = useState(1);

  const { result, query } = useList<SecurityLog>({
    resource: "security_logs",
    filters: userId ? [{ field: "user_id", operator: "eq", value: userId }] : [],
    sorters: [{ field: "created_at", order: "desc" }],
    pagination: { currentPage, pageSize: PAGE_SIZE },
    queryOptions: { enabled: !!userId },
  });

  const logs = useMemo(() => (result?.data ?? []) as SecurityLog[], [result]);
  const total = result?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const isLoading = query.isLoading || !userId;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Heading */}
      <div className="flex items-center gap-3">
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #1DA1F2, #22C55E)" }}>
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "Poppins, sans-serif" }}>
            Security Activity
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Monitor all login and account activity</p>
        </div>
      </div>

      {/* Info Box */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3.5">
        <Info size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700 leading-relaxed">
          This page shows all login and account activity associated with your NovaPay account. If you notice any
          suspicious activity, please change your password immediately and contact support.
        </p>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70">
                {["Action", "IP Address", "Device / Browser", "Date & Time"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Skeletons */}
              {isLoading && Array.from({ length: 6 }).map((_, i) => <RowSkeleton key={i} />)}

              {/* Empty State */}
              {!isLoading && logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center">
                        <ShieldOff className="h-7 w-7 text-gray-300" />
                      </div>
                      <p className="text-sm font-semibold text-gray-500">No security activity recorded yet</p>
                      <p className="text-xs text-gray-400 max-w-[240px] text-center">
                        Security events like logins and profile changes will appear here.
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {/* Data Rows */}
              {!isLoading &&
                logs.map((log, idx) => (
                  <tr
                    key={log.id}
                    className={`border-b border-gray-50 transition-colors hover:bg-gray-50/60 ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                    }`}>
                    {/* Action */}
                    <td className="px-4 py-3.5">
                      <ActionCell action={log.action} />
                    </td>

                    {/* IP Address */}
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                        {log.ip_address || "—"}
                      </span>
                    </td>

                    {/* Device */}
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-gray-600 max-w-[220px] block truncate" title={log.device}>
                        {log.device || "—"}
                      </span>
                    </td>

                    {/* Date & Time */}
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-gray-700">
                        {log.created_at ? dayjs(log.created_at).format("MMM D, YYYY") : "—"}
                      </span>
                      <div className="text-xs text-gray-400">
                        {log.created_at ? dayjs(log.created_at).format("h:mm A") : ""}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, total)}–{Math.min(currentPage * PAGE_SIZE, total)} of{" "}
              {total} events
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-colors">
                <ChevronLeft size={15} />
              </button>
              <span className="text-xs text-gray-600 font-medium px-2 py-1 rounded bg-gray-100">
                {currentPage} / {pageCount}
              </span>
              <button
                disabled={currentPage >= pageCount}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-colors">
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
