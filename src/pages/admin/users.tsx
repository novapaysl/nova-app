import { useState } from "react";
import { useList, useUpdate } from "@refinedev/core";
import { Users, Search, ChevronLeft, ChevronRight } from "lucide-react";
import dayjs from "dayjs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const cardStyle = { backgroundColor: "#1E293B", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.07)" };

const statusColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: "rgba(245,158,11,0.15)", text: "#F59E0B" },
  approved: { bg: "rgba(34,197,94,0.15)", text: "#22C55E" },
  active: { bg: "rgba(34,197,94,0.15)", text: "#22C55E" },
  suspended: { bg: "rgba(239,68,68,0.15)", text: "#EF4444" },
  rejected: { bg: "rgba(239,68,68,0.15)", text: "#EF4444" },
};

function StatusBadge({ status }: { status?: string }) {
  const s = (status ?? "").toLowerCase();
  const colors = statusColors[s] ?? { bg: "rgba(100,116,139,0.2)", text: "#94A3B8" };
  return (
    <span
      className="px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize"
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
  return AVATAR_COLORS[str.charCodeAt(0) % AVATAR_COLORS.length];
}

const PAGE_SIZE = 10;

type SuspendDialogState = { open: boolean; userId: string | null; userName: string };

export const AdminUsersPage = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [suspendDialog, setSuspendDialog] = useState<SuspendDialogState>({ open: false, userId: null, userName: "" });

  const filters =
    statusFilter !== "all" ? [{ field: "account_status", operator: "eq" as const, value: statusFilter }] : [];

  const { result, query } = useList({
    resource: "profiles",
    pagination: { currentPage, pageSize: PAGE_SIZE },
    filters,
    sorters: [{ field: "created_at", order: "desc" }],
  });

  const { mutate: updateUser, mutation } = useUpdate({ resource: "profiles" });

  const allData = result?.data ?? [];
  const total = result?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Client-side search filter
  const filteredData = search.trim()
    ? allData.filter((u: any) => {
        const q = search.toLowerCase();
        return (u.full_name ?? "").toLowerCase().includes(q) || (u.email ?? "").toLowerCase().includes(q);
      })
    : allData;

  const handleStatusChange = (userId: string, newStatus: string) => {
    updateUser({ id: userId, values: { account_status: newStatus } });
  };

  const handleSuspendConfirm = () => {
    if (suspendDialog.userId) {
      handleStatusChange(suspendDialog.userId, "suspended");
    }
    setSuspendDialog({ open: false, userId: null, userName: "" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "rgba(29,161,242,0.15)" }}>
          <Users size={20} style={{ color: "#1DA1F2" }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "Poppins, sans-serif" }}>
            User Management
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#94A3B8" }}>
            Manage and monitor all platform users
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={cardStyle} className="p-4 flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#64748B" }} />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 rounded-lg text-sm outline-none focus:ring-2"
            style={{
              backgroundColor: "#0F172A",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#E2E8F0",
              // @ts-ignore
              "--tw-ring-color": "#1DA1F2",
            }}
          />
        </div>
        {/* Status Filter */}
        <div className="w-full sm:w-44">
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setCurrentPage(1);
            }}>
            <SelectTrigger
              className="w-full text-sm"
              style={{ backgroundColor: "#0F172A", border: "1px solid rgba(255,255,255,0.1)", color: "#E2E8F0" }}>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent style={{ backgroundColor: "#1E293B", border: "1px solid rgba(255,255,255,0.1)" }}>
              <SelectItem value="all" className="text-gray-200">
                All Users
              </SelectItem>
              <SelectItem value="active" className="text-gray-200">
                Active
              </SelectItem>
              <SelectItem value="pending" className="text-gray-200">
                Pending
              </SelectItem>
              <SelectItem value="suspended" className="text-gray-200">
                Suspended
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div style={cardStyle} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                style={{ backgroundColor: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {["User", "Email", "Phone", "Status", "Joined", "Actions"].map((h) => (
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
              {/* Loading skeletons */}
              {query.isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <div
                          className="h-4 rounded animate-pulse"
                          style={{
                            backgroundColor: "rgba(255,255,255,0.07)",
                            width: j === 0 ? "140px" : j === 4 ? "90px" : "110px",
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}

              {/* Empty state */}
              {!query.isLoading && filteredData.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Users size={32} style={{ color: "#334155" }} />
                      <p className="text-sm font-medium" style={{ color: "#64748B" }}>
                        No users found
                      </p>
                      {search && (
                        <p className="text-xs" style={{ color: "#475569" }}>
                          Try a different search term
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {/* Data rows */}
              {!query.isLoading &&
                filteredData.map((user: any) => {
                  const color = avatarColor(user.full_name);
                  const isActive = (user.account_status ?? "").toLowerCase() === "active";
                  const isSuspended = (user.account_status ?? "").toLowerCase() === "suspended";
                  return (
                    <tr
                      key={user.id}
                      className="transition-colors"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.02)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}>
                      {/* User */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ backgroundColor: color + "22", color, border: `1.5px solid ${color}44` }}>
                            {getInitials(user.full_name)}
                          </div>
                          <span className="font-medium truncate max-w-[120px]" style={{ color: "#E2E8F0" }}>
                            {user.full_name ?? "—"}
                          </span>
                        </div>
                      </td>
                      {/* Email */}
                      <td className="px-4 py-3.5">
                        <span className="truncate max-w-[160px] block" style={{ color: "#94A3B8" }}>
                          {user.email ?? "—"}
                        </span>
                      </td>
                      {/* Phone */}
                      <td className="px-4 py-3.5">
                        <span style={{ color: "#94A3B8" }}>{user.phone_number ?? "—"}</span>
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <StatusBadge status={user.account_status} />
                      </td>
                      {/* Joined */}
                      <td className="px-4 py-3.5">
                        <span style={{ color: "#64748B" }}>
                          {user.created_at ? dayjs(user.created_at).format("MMM D, YYYY") : "—"}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex gap-2">
                          {isActive && (
                            <button
                              disabled={mutation.isPending}
                              onClick={() =>
                                setSuspendDialog({
                                  open: true,
                                  userId: user.id,
                                  userName: user.full_name ?? "this user",
                                })
                              }
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                              style={{
                                border: "1px solid rgba(239,68,68,0.4)",
                                color: "#EF4444",
                                backgroundColor: "rgba(239,68,68,0.06)",
                              }}
                              onMouseEnter={(e) =>
                                ((e.currentTarget as HTMLElement).style.backgroundColor = "rgba(239,68,68,0.15)")
                              }
                              onMouseLeave={(e) =>
                                ((e.currentTarget as HTMLElement).style.backgroundColor = "rgba(239,68,68,0.06)")
                              }>
                              Suspend
                            </button>
                          )}
                          {isSuspended && (
                            <button
                              disabled={mutation.isPending}
                              onClick={() => handleStatusChange(user.id, "active")}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                              style={{
                                border: "1px solid rgba(34,197,94,0.4)",
                                color: "#22C55E",
                                backgroundColor: "rgba(34,197,94,0.06)",
                              }}
                              onMouseEnter={(e) =>
                                ((e.currentTarget as HTMLElement).style.backgroundColor = "rgba(34,197,94,0.15)")
                              }
                              onMouseLeave={(e) =>
                                ((e.currentTarget as HTMLElement).style.backgroundColor = "rgba(34,197,94,0.06)")
                              }>
                              Activate
                            </button>
                          )}
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
              {total} users
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

      {/* Suspend Confirm Dialog */}
      <AlertDialog
        open={suspendDialog.open}
        onOpenChange={(open) => !open && setSuspendDialog({ open: false, userId: null, userName: "" })}>
        <AlertDialogContent
          style={{ backgroundColor: "#1E293B", border: "1px solid rgba(255,255,255,0.1)", color: "#E2E8F0" }}>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Suspend User?</AlertDialogTitle>
            <AlertDialogDescription style={{ color: "#94A3B8" }}>
              Are you sure you want to suspend <strong className="text-white">{suspendDialog.userName}</strong>? They
              will lose access to their account until reactivated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              style={{
                backgroundColor: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#E2E8F0",
              }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSuspendConfirm} style={{ backgroundColor: "#EF4444", color: "white" }}>
              Yes, Suspend
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
