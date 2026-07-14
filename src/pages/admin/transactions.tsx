import { useState, useMemo } from "react";
import { useList } from "@refinedev/core";
import { ArrowLeftRight, Search, Eye, Copy, Check, ChevronLeft, ChevronRight, Calendar, X } from "lucide-react";
import dayjs from "dayjs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const cardStyle = { backgroundColor: "#1E293B", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.07)" };

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  completed: { bg: "rgba(34,197,94,0.15)", text: "#22C55E" },
  pending: { bg: "rgba(245,158,11,0.15)", text: "#F59E0B" },
  failed: { bg: "rgba(239,68,68,0.15)", text: "#EF4444" },
};

function StatusBadge({ status }: { status?: string }) {
  const s = (status ?? "").toLowerCase();
  const colors = STATUS_COLORS[s] ?? { bg: "rgba(100,116,139,0.2)", text: "#94A3B8" };
  return (
    <span
      className="px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize"
      style={{ backgroundColor: colors.bg, color: colors.text }}>
      {status ?? "—"}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <button
      onClick={handleCopy}
      title="Copy"
      className="ml-1.5 p-1 rounded transition-colors flex-shrink-0"
      style={{ color: copied ? "#22C55E" : "#64748B" }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.08)")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "")}>
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

type Transfer = {
  id: string;
  reference: string;
  sender_wallet: string;
  receiver_wallet: string;
  amount: number;
  status: string;
  description?: string;
  created_at: string;
};

function TransferDetailModal({ transfer, onClose }: { transfer: Transfer | null; onClose: () => void }) {
  if (!transfer) return null;

  return (
    <Dialog open={!!transfer} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-md"
        style={{
          backgroundColor: "#1E293B",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "#E2E8F0",
        }}>
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <ArrowLeftRight size={18} style={{ color: "#1DA1F2" }} />
            Transfer Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Amount — hero */}
          <div
            className="rounded-xl p-4 text-center"
            style={{ backgroundColor: "rgba(29,161,242,0.08)", border: "1px solid rgba(29,161,242,0.15)" }}>
            <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: "#64748B" }}>
              Transfer Amount
            </p>
            <p className="text-3xl font-bold" style={{ color: "#1DA1F2" }}>
              SLE {Number(transfer.amount ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* Detail rows */}
          {[
            {
              label: "Reference",
              value: (
                <div className="flex items-center">
                  <span className="font-mono text-xs truncate max-w-[180px]" style={{ color: "#E2E8F0" }}>
                    {transfer.reference ?? "—"}
                  </span>
                  {transfer.reference && <CopyButton text={transfer.reference} />}
                </div>
              ),
            },
            {
              label: "Sender Wallet",
              value: (
                <div className="flex items-center">
                  <span className="font-mono text-xs truncate max-w-[180px]" style={{ color: "#E2E8F0" }}>
                    {transfer.sender_wallet ?? "—"}
                  </span>
                  {transfer.sender_wallet && <CopyButton text={transfer.sender_wallet} />}
                </div>
              ),
            },
            {
              label: "Receiver Wallet",
              value: (
                <div className="flex items-center">
                  <span className="font-mono text-xs truncate max-w-[180px]" style={{ color: "#E2E8F0" }}>
                    {transfer.receiver_wallet ?? "—"}
                  </span>
                  {transfer.receiver_wallet && <CopyButton text={transfer.receiver_wallet} />}
                </div>
              ),
            },
            {
              label: "Status",
              value: <StatusBadge status={transfer.status} />,
            },
            {
              label: "Description",
              value: <span style={{ color: "#94A3B8" }}>{transfer.description ?? "No description"}</span>,
            },
            {
              label: "Created At",
              value: (
                <span style={{ color: "#94A3B8" }}>
                  {transfer.created_at ? dayjs(transfer.created_at).format("MMM D, YYYY [at] h:mm A") : "—"}
                </span>
              ),
            },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex items-start justify-between gap-4 py-2"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <span className="text-xs font-medium flex-shrink-0 pt-0.5" style={{ color: "#64748B", width: "120px" }}>
                {label}
              </span>
              <div className="text-sm text-right flex justify-end flex-1">{value}</div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#E2E8F0",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.14)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.08)")}>
            Close
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const PAGE_SIZE = 15;

export const AdminTransactionsPage = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);

  const filters = useMemo(() => {
    const f: { field: string; operator: "eq"; value: string }[] = [];
    if (statusFilter !== "all") f.push({ field: "status", operator: "eq" as const, value: statusFilter });
    return f;
  }, [statusFilter]);

  const { result, query } = useList<Transfer>({
    resource: "transfers",
    pagination: { currentPage, pageSize: PAGE_SIZE },
    filters,
    sorters: [{ field: "created_at", order: "desc" }],
  });

  const allData = result?.data ?? [];
  const total = result?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Client-side search
  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allData;
    return allData.filter((t: Transfer) => {
      return (
        (t.reference ?? "").toLowerCase().includes(q) ||
        (t.sender_wallet ?? "").toLowerCase().includes(q) ||
        (t.receiver_wallet ?? "").toLowerCase().includes(q)
      );
    });
  }, [allData, search]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "rgba(29,161,242,0.15)" }}>
          <ArrowLeftRight size={20} style={{ color: "#1DA1F2" }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "Poppins, sans-serif" }}>
            Transaction Monitoring
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#94A3B8" }}>
            Monitor and inspect all platform transfers
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={cardStyle} className="p-4 flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#64748B" }} />
          <input
            type="text"
            placeholder="Search by reference, wallet…"
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
                All Statuses
              </SelectItem>
              <SelectItem value="completed" className="text-gray-200">
                Completed
              </SelectItem>
              <SelectItem value="pending" className="text-gray-200">
                Pending
              </SelectItem>
              <SelectItem value="failed" className="text-gray-200">
                Failed
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date filter placeholder */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm flex-shrink-0"
          style={{
            backgroundColor: "#0F172A",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#475569",
          }}>
          <Calendar size={15} />
          <span className="text-xs">Date filter coming soon</span>
        </div>
      </div>

      {/* Table */}
      <div style={cardStyle} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr
                style={{ backgroundColor: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {["Reference", "Sender Wallet", "Receiver Wallet", "Amount (SLE)", "Status", "Date", "Actions"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: "#64748B" }}>
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {/* Loading Skeletons */}
              {query.isLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr
                    key={i}
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                      backgroundColor: i % 2 === 0 ? "#1E293B" : "rgba(30,41,59,0.6)",
                    }}>
                    {[160, 130, 130, 90, 80, 100, 60].map((w, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <div
                          className="h-4 rounded animate-pulse"
                          style={{ backgroundColor: "rgba(255,255,255,0.07)", width: `${w}px` }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}

              {/* Empty State */}
              {!query.isLoading && filteredData.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div
                        className="h-14 w-14 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: "rgba(29,161,242,0.08)" }}>
                        <ArrowLeftRight size={26} style={{ color: "#334155" }} />
                      </div>
                      <p className="text-sm font-medium" style={{ color: "#64748B" }}>
                        No transfers found
                      </p>
                      {(search || statusFilter !== "all") && (
                        <button
                          onClick={() => {
                            setSearch("");
                            setStatusFilter("all");
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
                filteredData.map((transfer: Transfer, idx: number) => (
                  <tr
                    key={transfer.id}
                    className="transition-colors"
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                      backgroundColor: idx % 2 === 0 ? "#1E293B" : "rgba(15,23,42,0.5)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(29,161,242,0.05)")}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = idx % 2 === 0 ? "#1E293B" : "rgba(15,23,42,0.5)")
                    }>
                    {/* Reference */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center">
                        <span
                          className="font-mono text-xs truncate max-w-[140px]"
                          style={{ color: "#CBD5E1" }}
                          title={transfer.reference}>
                          {transfer.reference ?? "—"}
                        </span>
                        {transfer.reference && <CopyButton text={transfer.reference} />}
                      </div>
                    </td>

                    {/* Sender Wallet */}
                    <td className="px-4 py-3.5">
                      <span
                        className="font-mono text-xs truncate max-w-[120px] block"
                        style={{ color: "#94A3B8" }}
                        title={transfer.sender_wallet}>
                        {transfer.sender_wallet ?? "—"}
                      </span>
                    </td>

                    {/* Receiver Wallet */}
                    <td className="px-4 py-3.5">
                      <span
                        className="font-mono text-xs truncate max-w-[120px] block"
                        style={{ color: "#94A3B8" }}
                        title={transfer.receiver_wallet}>
                        {transfer.receiver_wallet ?? "—"}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3.5">
                      <span className="font-bold" style={{ color: "#E2E8F0" }}>
                        SLE {Number(transfer.amount ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <StatusBadge status={transfer.status} />
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3.5">
                      <span className="text-xs" style={{ color: "#64748B" }}>
                        {transfer.created_at ? dayjs(transfer.created_at).format("MMM D, YYYY") : "—"}
                      </span>
                      <div className="text-xs" style={{ color: "#475569" }}>
                        {transfer.created_at ? dayjs(transfer.created_at).format("h:mm A") : ""}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => setSelectedTransfer(transfer)}
                        title="View Details"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{
                          backgroundColor: "rgba(29,161,242,0.1)",
                          border: "1px solid rgba(29,161,242,0.2)",
                          color: "#1DA1F2",
                        }}
                        onMouseEnter={(e) =>
                          ((e.currentTarget as HTMLElement).style.backgroundColor = "rgba(29,161,242,0.2)")
                        }
                        onMouseLeave={(e) =>
                          ((e.currentTarget as HTMLElement).style.backgroundColor = "rgba(29,161,242,0.1)")
                        }>
                        <Eye size={13} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
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
              {total} transfers
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => handlePageChange(currentPage - 1)}
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
                onClick={() => handlePageChange(currentPage + 1)}
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

      {/* Detail Modal */}
      <TransferDetailModal transfer={selectedTransfer} onClose={() => setSelectedTransfer(null)} />
    </div>
  );
};
