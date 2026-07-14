import { useState, useMemo } from "react";
import { useGetIdentity, useList } from "@refinedev/core";
import {
  List,
  TrendingUp,
  TrendingDown,
  Eye,
  Copy,
  Filter,
  Search,
  X,
  ReceiptText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

// ─── Types ────────────────────────────────────────────────────────────────────

type Identity = { id: string; name?: string; email?: string };

type Transaction = {
  id: string;
  wallet_id: string;
  transaction_reference: string;
  transaction_type: string;
  amount: number;
  direction: string;
  description: string;
  status: string;
  created_at: string;
};

type WalletData = { id: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatAmount(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return "SLE 0.00";
  return `SLE ${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return (
    d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) +
    " · " +
    d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TxStatusBadge({ status }: { status?: string }) {
  const s = (status ?? "").toLowerCase();
  if (s === "completed")
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
        Completed
      </span>
    );
  if (s === "pending")
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
        Pending
      </span>
    );
  if (s === "failed")
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
        Failed
      </span>
    );
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
      {status ?? "—"}
    </span>
  );
}

function DirectionCell({ direction }: { direction?: string }) {
  const isCredit = (direction ?? "").toLowerCase() === "credit";
  return isCredit ? (
    <span className="inline-flex items-center gap-1 font-semibold text-green-600 text-sm">
      <TrendingUp className="h-4 w-4" />
      Credit
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 font-semibold text-red-500 text-sm">
      <TrendingDown className="h-4 w-4" />
      Debit
    </span>
  );
}

// ─── Transaction Detail Modal ─────────────────────────────────────────────────

function TransactionDetailModal({ tx, onClose }: { tx: Transaction | null; onClose: () => void }) {
  if (!tx) return null;

  const isCredit = (tx.direction ?? "").toLowerCase() === "credit";

  const copyRef = () => {
    navigator.clipboard.writeText(tx.transaction_reference ?? "").then(() => {
      toast.success("Copied!", { description: "Reference number copied to clipboard." });
    });
  };

  return (
    <Dialog
      open={!!tx}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900" style={{ fontFamily: "Poppins, sans-serif" }}>
            <ReceiptText className="h-5 w-5" style={{ color: "#1DA1F2" }} />
            Transaction Details
          </DialogTitle>
        </DialogHeader>

        {/* Amount hero */}
        <div
          className="rounded-xl px-5 py-4 text-center my-1"
          style={{
            background: isCredit
              ? "linear-gradient(135deg, #f0fdf4, #dcfce7)"
              : "linear-gradient(135deg, #fff1f2, #ffe4e6)",
          }}>
          <p className="text-xs font-medium mb-1" style={{ color: isCredit ? "#16a34a" : "#dc2626" }}>
            {isCredit ? "Credit" : "Debit"} Transaction
          </p>
          <p className="text-3xl font-bold" style={{ color: isCredit ? "#16a34a" : "#dc2626" }}>
            {isCredit ? "+" : "−"}
            {formatAmount(tx.amount)}
          </p>
          <div className="mt-2">
            <TxStatusBadge status={tx.status} />
          </div>
        </div>

        {/* Details grid */}
        <div className="space-y-3 text-sm">
          {/* Reference */}
          <div className="flex items-start justify-between gap-3 py-2 border-b border-gray-100">
            <span className="text-gray-500 font-medium shrink-0">Reference</span>
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-xs text-gray-700 truncate">{tx.transaction_reference ?? "—"}</span>
              {tx.transaction_reference && (
                <button
                  onClick={copyRef}
                  className="p-1 rounded hover:bg-gray-100 transition-colors shrink-0"
                  title="Copy reference">
                  <Copy className="h-3.5 w-3.5 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Type */}
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500 font-medium">Type</span>
            <span className="text-gray-800 capitalize font-semibold">{tx.transaction_type ?? "—"}</span>
          </div>

          {/* Direction */}
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500 font-medium">Direction</span>
            <DirectionCell direction={tx.direction} />
          </div>

          {/* Wallet */}
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500 font-medium">Wallet ID</span>
            <span className="font-mono text-xs text-gray-600 truncate max-w-[180px]">{tx.wallet_id ?? "—"}</span>
          </div>

          {/* Description */}
          {tx.description && (
            <div className="flex items-start justify-between gap-3 py-2 border-b border-gray-100">
              <span className="text-gray-500 font-medium shrink-0">Description</span>
              <span className="text-gray-700 text-right">{tx.description}</span>
            </div>
          )}

          {/* Date & Time */}
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-500 font-medium">Date & Time</span>
            <span className="text-gray-700 text-xs text-right">{formatDate(tx.created_at)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="w-full font-semibold">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page constants ───────────────────────────────────────────────────────────

const PAGE_SIZE = 15;

// ─── Main Page ────────────────────────────────────────────────────────────────

export const TransactionsPage = () => {
  const { data: identity } = useGetIdentity<Identity>();
  const userId = identity?.id;

  // Filter state
  const [search, setSearch] = useState("");
  const [directionFilter, setDirectionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Selected transaction for modal
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Fetch wallet
  const { query: walletQuery, result: walletListResult } = useList<WalletData>({
    resource: "wallets",
    filters: [{ field: "user_id", operator: "eq", value: userId }],
    pagination: { pageSize: 1 },
    queryOptions: { enabled: !!userId },
  });

  const walletLoading = walletQuery.isLoading;
  const wallet = walletListResult.data?.[0];

  // Fetch transactions
  const { query: txQuery, result: txListResult } = useList<Transaction>({
    resource: "wallet_transactions",
    filters: wallet?.id
      ? [{ field: "wallet_id", operator: "eq", value: wallet.id }]
      : [{ field: "wallet_id", operator: "eq", value: "none" }],
    sorters: [{ field: "created_at", order: "desc" }],
    pagination: { pageSize: 500 },
    queryOptions: { enabled: !!wallet?.id },
  });

  const allTransactions = (txListResult.data ?? []) as Transaction[];
  const isLoading = walletLoading || txQuery.isLoading;

  // Are any filters active?
  const filtersActive =
    search.trim() !== "" || directionFilter !== "all" || statusFilter !== "all" || typeFilter !== "all";

  // Client-side filtering
  const filtered = useMemo(() => {
    let rows = allTransactions;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(
        (t) =>
          (t.transaction_reference ?? "").toLowerCase().includes(q) || (t.description ?? "").toLowerCase().includes(q),
      );
    }

    if (directionFilter !== "all") {
      rows = rows.filter((t) => (t.direction ?? "").toLowerCase() === directionFilter.toLowerCase());
    }

    if (statusFilter !== "all") {
      rows = rows.filter((t) => (t.status ?? "").toLowerCase() === statusFilter.toLowerCase());
    }

    if (typeFilter !== "all") {
      rows = rows.filter((t) => (t.transaction_type ?? "").toLowerCase() === typeFilter.toLowerCase());
    }

    return rows;
  }, [allTransactions, search, directionFilter, statusFilter, typeFilter]);

  // Reset to page 1 when filters change
  const handleFilterChange = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setCurrentPage(1);
  };

  // Pagination
  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const paginated = filtered.slice(startIdx, startIdx + PAGE_SIZE);

  const goToPage = (p: number) => setCurrentPage(Math.min(Math.max(1, p), pageCount));

  const visiblePages: number[] = [];
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  const endPage = Math.min(pageCount, startPage + maxVisible - 1);
  if (endPage - startPage < maxVisible - 1) startPage = Math.max(1, endPage - maxVisible + 1);
  for (let i = startPage; i <= endPage; i++) visiblePages.push(i);

  const clearFilters = () => {
    setSearch("");
    setDirectionFilter("all");
    setStatusFilter("all");
    setTypeFilter("all");
    setCurrentPage(1);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Heading */}
      <div className="flex items-center gap-3">
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #1DA1F2, #22C55E)" }}>
          <List className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "Poppins, sans-serif" }}>
            Transaction History
          </h1>
          <p className="text-gray-500 text-sm">All your NovaPay transactions in one place</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by reference or description..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 h-9 text-sm border-gray-200"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Direction */}
          <Select value={directionFilter} onValueChange={handleFilterChange(setDirectionFilter)}>
            <SelectTrigger className="h-9 w-[130px] text-sm border-gray-200">
              <SelectValue placeholder="Direction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Directions</SelectItem>
              <SelectItem value="credit">Credit</SelectItem>
              <SelectItem value="debit">Debit</SelectItem>
            </SelectContent>
          </Select>

          {/* Status */}
          <Select value={statusFilter} onValueChange={handleFilterChange(setStatusFilter)}>
            <SelectTrigger className="h-9 w-[130px] text-sm border-gray-200">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>

          {/* Type */}
          <Select value={typeFilter} onValueChange={handleFilterChange(setTypeFilter)}>
            <SelectTrigger className="h-9 w-[130px] text-sm border-gray-200">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
              <SelectItem value="deposit">Deposit</SelectItem>
              <SelectItem value="withdrawal">Withdrawal</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          {filtersActive && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="h-9 text-sm font-medium border-gray-300 text-gray-600 hover:bg-gray-50 flex items-center gap-1.5">
              <X className="h-3.5 w-3.5" />
              Clear Filters
            </Button>
          )}
        </div>

        {/* Active filter summary */}
        {!isLoading && filtersActive && (
          <p className="text-xs text-gray-400 mt-2 pl-0.5">
            Showing {total} {total === 1 ? "result" : "results"} matching your filters
          </p>
        )}
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ReceiptText className="h-5 w-5 text-gray-400" />
            <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "Poppins, sans-serif" }}>
              All Transactions
            </h2>
            {!isLoading && total > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">
                {total}
              </span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Reference
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Type
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Amount
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Direction
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">
                  Description
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">
                  Date
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Loading skeletons */}
              {isLoading &&
                Array.from({ length: 7 }).map((_, i) => (
                  <tr key={i} className={`border-b border-gray-50 ${i % 2 === 1 ? "bg-gray-50/40" : ""}`}>
                    <td className="px-5 py-3.5">
                      <Skeleton className="h-4 w-28" />
                    </td>
                    <td className="px-5 py-3.5">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="px-5 py-3.5">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="px-5 py-3.5">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <Skeleton className="h-4 w-28" />
                    </td>
                    <td className="px-5 py-3.5">
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </td>
                    <td className="px-5 py-3.5">
                      <Skeleton className="h-7 w-24 rounded-lg" />
                    </td>
                  </tr>
                ))}

              {/* Empty state */}
              {!isLoading && paginated.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center">
                        <Filter className="h-7 w-7 text-gray-300" />
                      </div>
                      <p className="text-gray-500 text-sm font-semibold">No transactions found</p>
                      <p className="text-gray-400 text-xs">
                        {filtersActive
                          ? "Try adjusting your filters or clearing the search."
                          : "Your transaction history will appear here."}
                      </p>
                      {filtersActive && (
                        <Button variant="outline" size="sm" onClick={clearFilters} className="mt-1 text-xs h-8 gap-1.5">
                          <X className="h-3 w-3" />
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {/* Transaction rows */}
              {!isLoading &&
                paginated.map((tx, idx) => {
                  const isCredit = (tx.direction ?? "").toLowerCase() === "credit";
                  const isEven = idx % 2 === 1;
                  return (
                    <tr
                      key={tx.id}
                      className={`border-b border-gray-50 transition-colors hover:bg-blue-50/30 cursor-default ${
                        isEven ? "bg-gray-50/30" : ""
                      }`}>
                      {/* Reference */}
                      <td className="px-5 py-3.5">
                        <span
                          className="font-mono text-xs text-gray-600 max-w-[120px] block truncate"
                          title={tx.transaction_reference}>
                          {tx.transaction_reference ?? "—"}
                        </span>
                      </td>

                      {/* Type */}
                      <td className="px-5 py-3.5 text-gray-700 capitalize">{tx.transaction_type ?? "—"}</td>

                      {/* Amount */}
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-sm" style={{ color: isCredit ? "#16a34a" : "#dc2626" }}>
                          {isCredit ? "+" : "−"}
                          {formatAmount(tx.amount)}
                        </span>
                      </td>

                      {/* Direction */}
                      <td className="px-5 py-3.5">
                        <DirectionCell direction={tx.direction} />
                      </td>

                      {/* Description */}
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <span className="text-gray-500 text-xs max-w-[160px] block truncate" title={tx.description}>
                          {tx.description || "—"}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className="text-gray-500 text-xs whitespace-nowrap">{formatDate(tx.created_at)}</span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <TxStatusBadge status={tx.status} />
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedTx(tx)}
                          className="h-7 px-2.5 text-xs font-medium border-gray-200 hover:border-[#1DA1F2] hover:text-[#1DA1F2] transition-colors gap-1.5">
                          <Eye className="h-3.5 w-3.5" />
                          View Details
                        </Button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && total > PAGE_SIZE && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex-wrap gap-2">
            <p className="text-xs text-gray-500">
              Showing {startIdx + 1}–{Math.min(startIdx + PAGE_SIZE, total)} of {total} transactions
            </p>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-gray-500"
                disabled={currentPage <= 1}
                onClick={() => goToPage(1)}>
                <ChevronLeft className="h-4 w-4" />
                <ChevronLeft className="h-4 w-4 -ml-2.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-gray-500"
                disabled={currentPage <= 1}
                onClick={() => goToPage(currentPage - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {visiblePages.map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "ghost"}
                  size="sm"
                  className={`h-7 w-7 p-0 text-xs ${currentPage === page ? "text-white" : "text-gray-600"}`}
                  style={currentPage === page ? { backgroundColor: "#1DA1F2" } : {}}
                  onClick={() => goToPage(page)}>
                  {page}
                </Button>
              ))}

              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-gray-500"
                disabled={currentPage >= pageCount}
                onClick={() => goToPage(currentPage + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-gray-500"
                disabled={currentPage >= pageCount}
                onClick={() => goToPage(pageCount)}>
                <ChevronRight className="h-4 w-4" />
                <ChevronRight className="h-4 w-4 -ml-2.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Summary line when results fit one page */}
        {!isLoading && total > 0 && total <= PAGE_SIZE && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/30">
            <p className="text-xs text-gray-400">Showing all {total} transactions</p>
          </div>
        )}
      </div>

      {/* Transaction Detail Modal */}
      <TransactionDetailModal tx={selectedTx} onClose={() => setSelectedTx(null)} />
    </div>
  );
};
