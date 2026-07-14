import { useMemo, useState } from "react";
import { useList } from "@refinedev/core";
import {
  Lock,
  LogIn,
  AlertTriangle,
  Settings,
  KeyRound,
  User,
  ChevronLeft,
  ChevronRight,
  Search,
  ShieldOff,
  X,
} from "lucide-react";
import dayjs from "dayjs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ─── Types ────────────────────────────────────────────────────────────────────

type SecurityLog = {
  id: string;
  user_id: string;
  action: string;
  ip_address: string;
  device: string;
  created_at: string;
};

// ─── Style constants ──────────────────────────────────────────────────────────

const cardStyle = {
  backgroundColor: "#1E293B",
  borderRadius: "0.75rem",
  border: "1px solid rgba(255,255,255,0.07)",
};

// ─── Action Config ────────────────────────────────────────────────────────────

const ACTION_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string; icon: React.ElementType; rowTint?: string }
> = {
  login_success: {
    label: "Login Successful",
    color: "#22C55E",
    bgColor: "rgba(34,197,94,0.15)",
    icon: LogIn,
  },
  login_failed: {
    label: "Login Failed",
    color: "#EF4444",
    bgColor: "rgba(239,68,68,0.15)",
    icon: AlertTriangle,
    rowTint: "rgba(239,68,68,0.05)",
  },
  password_change: {
    label: "Password Changed",
    color: "#F59E0B",
    bgColor: "rgba(245,158,11,0.15)",
    icon: KeyRound,
  },
  profile_update: {
    label: "Profile Updated",
    color: "#1DA1F2",
    bgColor: "rgba(29,161,242,0.15)",
    icon: User,
  },
  logout: {
    label: "Logged Out",
    color: "#94A3B8",
    bgColor: "rgba(148,163,184,0.12)",
    icon: LogIn,
  },
  suspicious_activity: {
    label: "Suspicious Activity",
    color: "#F59E0B",
    bgColor: "rgba(245,158,11,0.15)",
    icon: AlertTriangle,
    rowTint: "rgba(245,158,11,0.07)",
  },
};

function getActionConfig(action?: string) {
  if (!action) return { label: "Unknown", color: "#64748B", bgColor: "rgba(100,116,139,0.12)", icon: Settings };
  const key = action.toLowerCase();
  if (ACTION_CONFIG[key]) return ACTION_CONFIG[key];
  const label = action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return { label, color: "#64748B", bgColor: "rgba(100,116,139,0.12)", icon: Settings };
}

function ActionCell({ action }: { action?: string }) {
  const cfg = getActionConfig(action);
  const Icon = cfg.icon;
  return (
    <div className="flex items-center gap-2">
      <span
        className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: cfg.bgColor }}>
        <Icon size={12} style={{ color: cfg.color }} />
      </span>
      <span className="text-xs font-semibold" style={{ color: cfg.color }}>
        {cfg.label}
      </span>
    </div>
  );
}

function UserCell({ userId }: { userId?: string }) {
  if (!userId) return <span style={{ color: "#475569" }}>—</span>;
  // Show avatar initials placeholder + truncated ID
  const short = userId.slice(0, 8).toUpperCase();
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
        style={{ backgroundColor: "rgba(29,161,242,0.15)", color: "#1DA1F2" }}>
        {short.slice(0, 2)}
      </div>
      <span className="font-mono text-xs" style={{ color: "#94A3B8" }} title={userId}>
        {userId.slice(0, 8)}…
      </span>
    </div>
  );
}

// ─── Skeleton Row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      {[100, 140, 110, 160, 100].map((w, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-4 rounded animate-pulse" style={{ backgroundColor: "rgba(255,255,255,0.07)", width: w }} />
        </td>
      ))}
    </tr>
  );
}

// ─── Filter options ───────────────────────────────────────────────────────────

const ACTION_FILTER_OPTIONS = [
  { value: "all", label: "All Actions" },
  { value: "login_success", label: "Login Success" },
  { value: "login_failed", label: "Login Failed" },
  { value: "password_change", label: "Password Change" },
  { value: "profile_update", label: "Profile Update" },
  { value: "suspicious_activity", label: "Suspicious Activity" },
];

const PAGE_SIZE = 20;

// ─── Main Page ────────────────────────────────────────────────────────────────

export const AdminSecurityPage = () => {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const serverFilters = useMemo(() => {
    if (actionFilter !== "all") {
      return [{ field: "action", operator: "eq" as const, value: actionFilter }];
    }
    return [];
  }, [actionFilter]);

  const { result, query } = useList<SecurityLog>({
    resource: "security_logs",
    filters: serverFilters,
    sorters: [{ field: "created_at", order: "desc" }],
    pagination: { currentPage, pageSize: PAGE_SIZE },
  });

  const allLogs = useMemo(() => (result?.data ?? []) as SecurityLog[], [result]);
  const total = result?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Client-side search across user_id, action, ip_address, device
  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allLogs;
    return allLogs.filter(
      (log) =>
        (log.user_id ?? "").toLowerCase().includes(q) ||
        (log.action ?? "").toLowerCase().includes(q) ||
        (log.ip_address ?? "").toLowerCase().includes(q) ||
        (log.device ?? "").toLowerCase().includes(q),
    );
  }, [allLogs, search]);

  const handleFilterChange = (val: string) => {
    setActionFilter(val);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "rgba(29,161,242,0.15)" }}>
          <Lock size={20} style={{ color: "#1DA1F2" }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "Poppins, sans-serif" }}>
            Security Logs
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#94A3B8" }}>
            All platform security events across users
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={cardStyle} className="p-4 flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#64748B" }} />
          <input
            type="text"
            placeholder="Search by user ID, action, IP, or device…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-9 py-2 rounded-lg text-sm outline-none focus:ring-1"
            style={{
              backgroundColor: "#0F172A",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#E2E8F0",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: "#64748B" }}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Action Filter */}
        <div className="w-full sm:w-52">
          <Select value={actionFilter} onValueChange={handleFilterChange}>
            <SelectTrigger
              className="w-full text-sm"
              style={{
                backgroundColor: "#0F172A",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#E2E8F0",
              }}>
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent style={{ backgroundColor: "#1E293B", border: "1px solid rgba(255,255,255,0.1)" }}>
              {ACTION_FILTER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-gray-200">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div style={cardStyle} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr
                style={{
                  backgroundColor: "rgba(255,255,255,0.03)",
                  borderBottom: "1px solid rgba(255,255,255,0.07)",
                }}>
                {["User", "Action", "IP Address", "Device / Browser", "Date & Time"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "#64748B" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Loading */}
              {query.isLoading && Array.from({ length: 7 }).map((_, i) => <SkeletonRow key={i} />)}

              {/* Empty */}
              {!query.isLoading && filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div
                        className="h-14 w-14 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: "rgba(29,161,242,0.08)" }}>
                        <ShieldOff size={26} style={{ color: "#334155" }} />
                      </div>
                      <p className="text-sm font-medium" style={{ color: "#64748B" }}>
                        No security logs found
                      </p>
                      {(search || actionFilter !== "all") && (
                        <button
                          onClick={() => {
                            setSearch("");
                            setActionFilter("all");
                          }}
                          className="text-xs underline"
                          style={{ color: "#1DA1F2" }}>
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {/* Data Rows */}
              {!query.isLoading &&
                filteredLogs.map((log, idx) => {
                  const cfg = getActionConfig(log.action);
                  const rowTint = (cfg as { rowTint?: string }).rowTint;
                  const defaultBg = idx % 2 === 0 ? "#1E293B" : "rgba(15,23,42,0.5)";
                  return (
                    <tr
                      key={log.id}
                      className="transition-colors"
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                        backgroundColor: rowTint ?? defaultBg,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(29,161,242,0.06)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = rowTint ?? defaultBg)}>
                      {/* User */}
                      <td className="px-4 py-3.5">
                        <UserCell userId={log.user_id} />
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5">
                        <ActionCell action={log.action} />
                      </td>

                      {/* IP Address */}
                      <td className="px-4 py-3.5">
                        <span
                          className="font-mono text-xs px-2 py-0.5 rounded"
                          style={{
                            backgroundColor: "rgba(255,255,255,0.05)",
                            color: "#94A3B8",
                          }}>
                          {log.ip_address || "—"}
                        </span>
                      </td>

                      {/* Device */}
                      <td className="px-4 py-3.5">
                        <span
                          className="text-xs max-w-[200px] block truncate"
                          style={{ color: "#94A3B8" }}
                          title={log.device}>
                          {log.device || "—"}
                        </span>
                      </td>

                      {/* Date & Time */}
                      <td className="px-4 py-3.5">
                        <span className="text-xs" style={{ color: "#CBD5E1" }}>
                          {log.created_at ? dayjs(log.created_at).format("MMM D, YYYY") : "—"}
                        </span>
                        <div className="text-xs" style={{ color: "#475569" }}>
                          {log.created_at ? dayjs(log.created_at).format("h:mm A") : ""}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!query.isLoading && total > 0 && (
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-xs" style={{ color: "#64748B" }}>
              Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, total)}–{Math.min(currentPage * PAGE_SIZE, total)} of{" "}
              {total} events
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="p-1.5 rounded-lg transition-colors disabled:opacity-30"
                style={{ color: "#94A3B8" }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.08)")
                }
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "")}>
                <ChevronLeft size={16} />
              </button>
              <span
                className="text-xs px-2 py-1 rounded"
                style={{ color: "#E2E8F0", backgroundColor: "rgba(255,255,255,0.07)" }}>
                {currentPage} / {pageCount}
              </span>
              <button
                disabled={currentPage >= pageCount}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="p-1.5 rounded-lg transition-colors disabled:opacity-30"
                style={{ color: "#94A3B8" }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.08)")
                }
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "")}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
