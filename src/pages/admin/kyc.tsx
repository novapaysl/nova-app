import { useState } from "react";
import { useList, useUpdate } from "@refinedev/core";
import { ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react";
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

const TABS = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "active" },
  { label: "Rejected", value: "rejected" },
];

const PAGE_SIZE = 10;

type RejectDialogState = { open: boolean; userId: string | null; userName: string };

export const AdminKycPage = () => {
  const [activeTab, setActiveTab] = useState("pending");
  const [currentPage, setCurrentPage] = useState(1);
  const [rejectDialog, setRejectDialog] = useState<RejectDialogState>({ open: false, userId: null, userName: "" });

  const filters = activeTab !== "all" ? [{ field: "account_status", operator: "eq" as const, value: activeTab }] : [];

  const { result, query } = useList({
    resource: "profiles",
    pagination: { currentPage, pageSize: PAGE_SIZE },
    filters,
    sorters: [{ field: "created_at", order: "desc" }],
  });

  const { mutate: updateProfile, mutation } = useUpdate({ resource: "profiles" });

  const data = result?.data ?? [];
  const total = result?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleApprove = (userId: string) => {
    updateProfile(
      { id: userId, values: { account_status: "active" } },
      {
        onSuccess: () => {
          /* toast handled by Refine notification provider */
        },
      },
    );
  };

  const handleRejectConfirm = () => {
    if (rejectDialog.userId) {
      updateProfile({ id: rejectDialog.userId, values: { account_status: "rejected" } });
    }
    setRejectDialog({ open: false, userId: null, userName: "" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "rgba(34,197,94,0.15)" }}>
          <ShieldCheck size={20} style={{ color: "#22C55E" }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "Poppins, sans-serif" }}>
            KYC Compliance
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#94A3B8" }}>
            Review and manage identity verification applications
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 p-1 rounded-xl w-fit"
        style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => {
                setActiveTab(tab.value);
                setCurrentPage(1);
              }}
              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: isActive ? "#1DA1F2" : "transparent",
                color: isActive ? "#fff" : "#94A3B8",
              }}>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div style={cardStyle} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                style={{
                  backgroundColor: "rgba(255,255,255,0.03)",
                  borderBottom: "1px solid rgba(255,255,255,0.07)",
                }}>
                {["Applicant", "Email", "Phone", "Status", "Submitted", "Actions"].map((h) => (
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
              {!query.isLoading && data.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <ShieldCheck size={36} style={{ color: "#334155" }} />
                      <p className="text-sm font-medium" style={{ color: "#64748B" }}>
                        {activeTab === "pending" ? "No pending KYC applications" : "No applications found"}
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {/* Data rows */}
              {!query.isLoading &&
                data.map((profile: any) => {
                  const color = avatarColor(profile.full_name);
                  const isPending = (profile.account_status ?? "").toLowerCase() === "pending";
                  return (
                    <tr
                      key={profile.id}
                      className="transition-colors"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.02)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}>
                      {/* Applicant */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{
                              backgroundColor: color + "22",
                              color,
                              border: `1.5px solid ${color}44`,
                            }}>
                            {getInitials(profile.full_name)}
                          </div>
                          <span className="font-medium truncate max-w-[120px]" style={{ color: "#E2E8F0" }}>
                            {profile.full_name ?? "—"}
                          </span>
                        </div>
                      </td>
                      {/* Email */}
                      <td className="px-4 py-3.5">
                        <span className="truncate max-w-[160px] block" style={{ color: "#94A3B8" }}>
                          {profile.email ?? "—"}
                        </span>
                      </td>
                      {/* Phone */}
                      <td className="px-4 py-3.5">
                        <span style={{ color: "#94A3B8" }}>{profile.phone_number ?? "—"}</span>
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <StatusBadge status={profile.account_status} />
                      </td>
                      {/* Submitted */}
                      <td className="px-4 py-3.5">
                        <span style={{ color: "#64748B" }}>
                          {profile.created_at ? dayjs(profile.created_at).format("MMM D, YYYY") : "—"}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        {isPending ? (
                          <div className="flex gap-2">
                            {/* Approve */}
                            <button
                              disabled={mutation.isPending}
                              onClick={() => handleApprove(profile.id)}
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
                              Approve
                            </button>
                            {/* Reject */}
                            <button
                              disabled={mutation.isPending}
                              onClick={() =>
                                setRejectDialog({
                                  open: true,
                                  userId: profile.id,
                                  userName: profile.full_name ?? "this applicant",
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
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs" style={{ color: "#475569" }}>
                            —
                          </span>
                        )}
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
              {total} applications
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

      {/* Reject Confirm Dialog */}
      <AlertDialog
        open={rejectDialog.open}
        onOpenChange={(open) => !open && setRejectDialog({ open: false, userId: null, userName: "" })}>
        <AlertDialogContent
          style={{
            backgroundColor: "#1E293B",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#E2E8F0",
          }}>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Reject KYC Application?</AlertDialogTitle>
            <AlertDialogDescription style={{ color: "#94A3B8" }}>
              Reject this KYC application for <strong className="text-white">{rejectDialog.userName}</strong>? This will
              mark their account status as rejected.
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
            <AlertDialogAction onClick={handleRejectConfirm} style={{ backgroundColor: "#EF4444", color: "white" }}>
              Yes, Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
