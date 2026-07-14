import { useGetIdentity, useList } from "@refinedev/core";
import { Link } from "react-router";
import { ArrowUpRight, ArrowDownLeft, Plus } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

type Identity = {
  id: string;
  name?: string;
  email?: string;
};

type Wallet = {
  id: string;
  user_id: string;
  wallet_number: string;
  currency: string;
  balance: number;
  wallet_status: string;
};

type Profile = {
  id: string;
  full_name: string;
  account_status: string;
};

type Transaction = {
  id: string;
  transaction_reference: string;
  transaction_type: string;
  amount: number;
  direction: string;
  description: string;
  status: string;
  created_at: string;
};

function formatBalance(balance: number | undefined): string {
  if (balance === undefined || balance === null) return "SLE 0.00";
  return `SLE ${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function KycBadge({ status }: { status?: string }) {
  if (!status) return null;
  const s = status.toLowerCase();
  if (s === "approved" || s === "active") {
    return (
      <Badge className="bg-green-500/20 text-green-300 border-green-500/30 hover:bg-green-500/20 text-xs font-semibold">
        ✅ {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  }
  if (s === "pending") {
    return (
      <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/20 text-xs font-semibold">
        ⚠️ Pending
      </Badge>
    );
  }
  if (s === "suspended") {
    return (
      <Badge className="bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/20 text-xs font-semibold">
        🚫 Suspended
      </Badge>
    );
  }
  return (
    <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30 hover:bg-gray-500/20 text-xs">{status}</Badge>
  );
}

function StatusBadge({ status }: { status?: string }) {
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
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
      {status ?? "—"}
    </span>
  );
}

export const DashboardPage = () => {
  const { data: identity } = useGetIdentity<Identity>();

  const userId = identity?.id;
  const userName = identity?.name
    ? identity.name.includes("@")
      ? identity.name.split("@")[0]
      : identity.name
    : "there";

  // Fetch wallet
  const { query: walletQuery, result: walletResult } = useList<Wallet>({
    resource: "wallets",
    filters: [{ field: "user_id", operator: "eq", value: userId }],
    pagination: { pageSize: 1 },
    queryOptions: { enabled: !!userId },
  });

  const walletLoading = walletQuery.isLoading;
  const wallet = walletResult.data?.[0];

  // Fetch profile (for KYC status)
  const { query: profileQuery, result: profileResult } = useList<Profile>({
    resource: "profiles",
    filters: [{ field: "id", operator: "eq", value: userId }],
    pagination: { pageSize: 1 },
    queryOptions: { enabled: !!userId },
  });

  const profileLoading = profileQuery.isLoading;
  const profile = profileResult.data?.[0];

  // Fetch recent transactions (by wallet_id)
  const { query: txQuery, result: txResult } = useList<Transaction>({
    resource: "wallet_transactions",
    filters: wallet?.id ? [{ field: "wallet_id", operator: "eq", value: wallet.id }] : [],
    pagination: { pageSize: 5 },
    sorters: [{ field: "created_at", order: "desc" }],
    queryOptions: { enabled: !!wallet?.id },
  });

  const txLoading = txQuery.isLoading;
  const transactions: Transaction[] = txResult.data ?? [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "Poppins, sans-serif" }}>
          {getGreeting()}, {userName} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">Here's what's happening with your NovaPay account today.</p>
      </div>

      {/* Wallet Balance Card */}
      <div
        className="relative rounded-2xl p-6 text-white shadow-lg overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1DA1F2 0%, #22C55E 100%)" }}>
        {/* Background decoration */}
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
          style={{ background: "rgba(255,255,255,0.3)", transform: "translate(30%, -30%)" }}
        />
        <div
          className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10"
          style={{ background: "rgba(255,255,255,0.2)", transform: "translate(-30%, 30%)" }}
        />

        {/* KYC Badge top-right */}
        <div className="absolute top-4 right-4">
          {profileLoading ? (
            <Skeleton className="h-6 w-20 bg-white/20" />
          ) : (
            <KycBadge status={profile?.account_status} />
          )}
        </div>

        <div className="relative">
          <p className="text-white/80 text-sm font-medium mb-1">Available Balance</p>
          {walletLoading ? (
            <Skeleton className="h-10 w-48 bg-white/20 mb-1" />
          ) : (
            <p className="text-4xl font-bold tracking-tight mb-1">{formatBalance(wallet?.balance)}</p>
          )}
          {walletLoading ? (
            <Skeleton className="h-4 w-36 bg-white/20" />
          ) : (
            <p className="text-white/70 text-sm font-mono">
              {wallet?.wallet_number ? `Wallet: ${wallet.wallet_number}` : "No wallet found"}
            </p>
          )}
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-3 gap-4">
        {/* Send Money */}
        <Link to="/dashboard/send" className="group">
          <div className="bg-white rounded-xl p-4 flex flex-col items-center gap-3 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer">
            <div
              className="h-12 w-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#EFF6FF" }}>
              <ArrowUpRight className="h-6 w-6" style={{ color: "#1DA1F2" }} />
            </div>
            <span className="text-sm font-semibold text-gray-700">Send Money</span>
          </div>
        </Link>

        {/* Receive Money */}
        <Link to="/dashboard/receive" className="group">
          <div className="bg-white rounded-xl p-4 flex flex-col items-center gap-3 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer">
            <div
              className="h-12 w-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#F0FDF4" }}>
              <ArrowDownLeft className="h-6 w-6" style={{ color: "#22C55E" }} />
            </div>
            <span className="text-sm font-semibold text-gray-700">Receive Money</span>
          </div>
        </Link>

        {/* Add Funds */}
        <div
          className="bg-white rounded-xl p-4 flex flex-col items-center gap-3 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer"
          onClick={() => toast("Coming soon!", { description: "Add Funds feature is coming soon." })}>
          <div
            className="h-12 w-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#F5F3FF" }}>
            <Plus className="h-6 w-6" style={{ color: "#7C3AED" }} />
          </div>
          <span className="text-sm font-semibold text-gray-700">Add Funds</span>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "Poppins, sans-serif" }}>
            Recent Transactions
          </h2>
          <Link
            to="/dashboard/transactions"
            className="text-sm font-medium hover:underline"
            style={{ color: "#1DA1F2" }}>
            View All →
          </Link>
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
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Date
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {txLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="px-5 py-3">
                      <Skeleton className="h-4 w-28" />
                    </td>
                    <td className="px-5 py-3">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="px-5 py-3">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="px-5 py-3">
                      <Skeleton className="h-4 w-14" />
                    </td>
                    <td className="px-5 py-3">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-5 py-3">
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </td>
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-400 text-sm">
                    No transactions yet
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-gray-600 max-w-[140px] truncate">
                      {tx.transaction_reference}
                    </td>
                    <td className="px-5 py-3 text-gray-700 capitalize">{tx.transaction_type ?? "—"}</td>
                    <td className="px-5 py-3 font-semibold text-gray-900">{formatBalance(tx.amount)}</td>
                    <td className="px-5 py-3 font-semibold capitalize">
                      <span
                        style={{
                          color: (tx.direction ?? "").toLowerCase() === "credit" ? "#22C55E" : "#EF4444",
                        }}>
                        {tx.direction ?? "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {tx.created_at
                        ? new Date(tx.created_at).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={tx.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
