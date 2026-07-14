import { useGetIdentity, useList } from "@refinedev/core";
import { Link } from "react-router";
import { useState } from "react";
import {
  Wallet,
  Copy,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  TrendingDown,
  ReceiptText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Identity = {
  id: string;
  name?: string;
  email?: string;
};

type WalletData = {
  id: string;
  user_id: string;
  wallet_number: string;
  currency: string;
  balance: number;
  wallet_status: string;
  created_at: string;
};

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

function formatBalance(balance: number | undefined | null): string {
  if (balance === undefined || balance === null) return "SLE 0.00";
  return `SLE ${balance.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function WalletStatusBadge({ status }: { status?: string }) {
  const s = (status ?? "").toLowerCase();
  if (s === "active") {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-200 border border-green-400/30">
        ● Active
      </span>
    );
  }
  if (s === "suspended") {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-200 border border-red-400/30">
        ● Suspended
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-500/20 text-gray-200 border border-gray-400/30">
      ● {status ?? "Inactive"}
    </span>
  );
}

function TxStatusBadge({ status }: { status?: string }) {
  const s = (status ?? "").toLowerCase();
  if (s === "completed") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
        Completed
      </span>
    );
  }
  if (s === "pending") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
        Pending
      </span>
    );
  }
  if (s === "failed") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
        Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
      {status ?? "—"}
    </span>
  );
}

function DirectionCell({ direction }: { direction?: string }) {
  const isCredit = (direction ?? "").toLowerCase() === "credit";
  if (isCredit) {
    return (
      <span className="inline-flex items-center gap-1 font-semibold text-green-600 text-sm">
        <TrendingUp className="h-4 w-4" />
        Credit
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 font-semibold text-red-500 text-sm">
      <TrendingDown className="h-4 w-4" />
      Debit
    </span>
  );
}

const PAGE_SIZE = 10;

export const WalletPage = () => {
  const { data: identity } = useGetIdentity<Identity>();
  const userId = identity?.id;

  const [currentPage, setCurrentPage] = useState(1);

  // Fetch wallet
  const { query: walletQuery, result: walletResult } = useList<WalletData>({
    resource: "wallets",
    filters: [{ field: "user_id", operator: "eq", value: userId }],
    pagination: { pageSize: 1 },
    queryOptions: { enabled: !!userId },
  });

  const walletLoading = walletQuery.isLoading;
  const wallet = walletResult.data?.[0] as WalletData | undefined;

  // Fetch all transactions for this wallet (client-side pagination)
  const { query: txQuery, result: txResult } = useList<Transaction>({
    resource: "wallet_transactions",
    filters: wallet?.id
      ? [{ field: "wallet_id", operator: "eq", value: wallet.id }]
      : [{ field: "wallet_id", operator: "eq", value: "none" }],
    sorters: [{ field: "created_at", order: "desc" }],
    pagination: { pageSize: 100 },
    queryOptions: { enabled: !!wallet?.id },
  });

  const txLoading = txQuery.isLoading;
  const allTransactions = (txResult.data ?? []) as Transaction[];

  // Client-side pagination
  const totalTx = allTransactions.length;
  const pageCount = Math.max(1, Math.ceil(totalTx / PAGE_SIZE));
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const transactions = allTransactions.slice(startIdx, startIdx + PAGE_SIZE);

  const copyWalletNumber = () => {
    if (wallet?.wallet_number) {
      navigator.clipboard.writeText(wallet.wallet_number).then(() => {
        toast.success("Copied!", { description: "Wallet number copied to clipboard." });
      });
    }
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), pageCount));
  };

  // visible page numbers
  const visiblePages: number[] = [];
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  const endPage = Math.min(pageCount, startPage + maxVisible - 1);
  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }
  for (let i = startPage; i <= endPage; i++) {
    visiblePages.push(i);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Heading */}
      <div className="flex items-center gap-3">
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #1DA1F2, #22C55E)" }}>
          <Wallet className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "Poppins, sans-serif" }}>
            My Wallet
          </h1>
          <p className="text-gray-500 text-sm">Manage your digital wallet and transactions</p>
        </div>
      </div>

      {/* Wallet Details Card */}
      <div
        className="relative rounded-2xl p-6 text-white shadow-lg overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1DA1F2 0%, #22C55E 100%)" }}>
        {/* Decorative circles */}
        <div
          className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-10 pointer-events-none"
          style={{ background: "rgba(255,255,255,0.4)", transform: "translate(35%, -35%)" }}
        />
        <div
          className="absolute bottom-0 left-0 w-56 h-56 rounded-full opacity-10 pointer-events-none"
          style={{ background: "rgba(255,255,255,0.25)", transform: "translate(-30%, 30%)" }}
        />

        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Balance */}
          <div>
            <p className="text-white/75 text-sm font-medium mb-1">Available Balance</p>
            {walletLoading ? (
              <Skeleton className="h-10 w-52 bg-white/20 mb-2" />
            ) : (
              <p className="text-4xl font-bold tracking-tight mb-2">{formatBalance(wallet?.balance)}</p>
            )}
            <p className="text-white/60 text-xs font-medium uppercase tracking-widest">Sierra Leonean Leone (SLE)</p>
          </div>

          {/* Right: Wallet details */}
          <div className="flex flex-col gap-3">
            {/* Wallet Number */}
            <div>
              <p className="text-white/75 text-xs font-medium mb-1">Wallet Number</p>
              {walletLoading ? (
                <Skeleton className="h-7 w-40 bg-white/20" />
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-semibold tracking-wider">{wallet?.wallet_number ?? "—"}</span>
                  {wallet?.wallet_number && (
                    <button
                      onClick={copyWalletNumber}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                      title="Copy wallet number">
                      <Copy className="h-3.5 w-3.5 text-white" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Status */}
            <div>
              <p className="text-white/75 text-xs font-medium mb-1">Wallet Status</p>
              {walletLoading ? (
                <Skeleton className="h-6 w-20 bg-white/20" />
              ) : (
                <WalletStatusBadge status={wallet?.wallet_status} />
              )}
            </div>

            {/* Currency */}
            <div>
              <p className="text-white/75 text-xs font-medium mb-0.5">Currency</p>
              <p className="text-white/90 text-sm font-medium">Sierra Leonean Leone (SLE)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 flex-wrap">
        <Link to="/dashboard/send">
          <Button
            variant="outline"
            className="flex items-center gap-2 border-2 font-semibold hover:bg-[#1DA1F2]/5 transition-colors"
            style={{ borderColor: "#1DA1F2", color: "#1DA1F2" }}>
            <ArrowUpRight className="h-4 w-4" />
            Send Money
          </Button>
        </Link>
        <Link to="/dashboard/receive">
          <Button
            variant="outline"
            className="flex items-center gap-2 border-2 font-semibold hover:bg-[#22C55E]/5 transition-colors"
            style={{ borderColor: "#22C55E", color: "#22C55E" }}>
            <ArrowDownLeft className="h-4 w-4" />
            Receive
          </Button>
        </Link>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ReceiptText className="h-5 w-5 text-gray-400" />
            <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "Poppins, sans-serif" }}>
              Transaction History
            </h2>
            {!txLoading && totalTx > 0 && (
              <Badge variant="secondary" className="text-xs">
                {totalTx} total
              </Badge>
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
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">
                  Description
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Date
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Loading skeletons */}
              {(walletLoading || txLoading) &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
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
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="px-5 py-3.5">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-5 py-3.5">
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </td>
                  </tr>
                ))}

              {/* Empty state */}
              {!walletLoading && !txLoading && allTransactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center">
                        <ReceiptText className="h-7 w-7 text-gray-300" />
                      </div>
                      <p className="text-gray-400 text-sm font-medium">No transactions found</p>
                      <p className="text-gray-300 text-xs">Your transaction history will appear here</p>
                    </div>
                  </td>
                </tr>
              )}

              {/* Transaction rows */}
              {!walletLoading &&
                !txLoading &&
                transactions.map((tx) => {
                  const isCredit = (tx.direction ?? "").toLowerCase() === "credit";
                  return (
                    <tr
                      key={tx.id}
                      className={`border-b border-gray-50 transition-colors ${
                        isCredit ? "hover:bg-green-50/40" : "hover:bg-red-50/20"
                      }`}>
                      {/* Reference */}
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs text-gray-600 max-w-[130px] block truncate">
                          {tx.transaction_reference ?? "—"}
                        </span>
                      </td>

                      {/* Type */}
                      <td className="px-5 py-3.5 text-gray-700 capitalize text-sm">{tx.transaction_type ?? "—"}</td>

                      {/* Amount */}
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-sm" style={{ color: isCredit ? "#22C55E" : "#EF4444" }}>
                          {isCredit ? "+" : "-"}
                          {formatBalance(tx.amount)}
                        </span>
                      </td>

                      {/* Direction */}
                      <td className="px-5 py-3.5">
                        <DirectionCell direction={tx.direction} />
                      </td>

                      {/* Description */}
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className="text-gray-500 text-sm max-w-[160px] block truncate">
                          {tx.description || "—"}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                        {tx.created_at
                          ? new Date(tx.created_at).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <TxStatusBadge status={tx.status} />
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!walletLoading && !txLoading && totalTx > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex-wrap gap-2">
            <p className="text-xs text-gray-500">
              Showing {startIdx + 1}–{Math.min(startIdx + PAGE_SIZE, totalTx)} of {totalTx} transactions
            </p>

            {pageCount > 1 && (
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
            )}
          </div>
        )}
      </div>
    </div>
  );
};
