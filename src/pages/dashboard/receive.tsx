import { useGetIdentity, useList } from "@refinedev/core";
import { ArrowDownLeft, Copy, QrCode, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
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

export const ReceiveMoneyPage = () => {
  const { data: identity } = useGetIdentity<Identity>();
  const userId = identity?.id;

  const { query: walletQuery, result: walletResult } = useList<WalletData>({
    resource: "wallets",
    filters: [{ field: "user_id", operator: "eq", value: userId }],
    pagination: { pageSize: 1 },
    queryOptions: { enabled: !!userId },
  });

  const walletLoading = walletQuery.isLoading;
  const wallet = walletResult.data?.[0] as WalletData | undefined;

  const copyWalletNumber = () => {
    if (wallet?.wallet_number) {
      navigator.clipboard.writeText(wallet.wallet_number).then(() => {
        toast.success("Wallet number copied!");
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page Heading */}
      <div className="flex items-center gap-3">
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #1DA1F2, #22C55E)" }}>
          <ArrowDownLeft className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "Poppins, sans-serif" }}>
            Receive Money
          </h1>
          <p className="text-gray-500 text-sm">Share your wallet number to receive SLE payments</p>
        </div>
      </div>

      {/* Wallet Details Card */}
      <div
        className="relative rounded-2xl p-6 text-white shadow-lg overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1DA1F2 0%, #22C55E 100%)" }}>
        {/* Decorative circles */}
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 pointer-events-none"
          style={{ background: "rgba(255,255,255,0.4)", transform: "translate(35%, -35%)" }}
        />
        <div
          className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10 pointer-events-none"
          style={{ background: "rgba(255,255,255,0.25)", transform: "translate(-30%, 30%)" }}
        />

        <div className="relative flex flex-col items-center text-center gap-4">
          <p className="text-white/80 text-sm font-medium uppercase tracking-widest">Your Wallet Number</p>

          {walletLoading ? (
            <Skeleton className="h-10 w-56 bg-white/20" />
          ) : (
            <div className="flex items-center gap-3">
              <span className="font-mono text-3xl font-bold tracking-widest">{wallet?.wallet_number ?? "—"}</span>
              {wallet?.wallet_number && (
                <button
                  onClick={copyWalletNumber}
                  className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
                  title="Copy wallet number">
                  <Copy className="h-5 w-5 text-white" />
                </button>
              )}
            </div>
          )}

          <p className="text-white/70 text-xs font-medium">
            Currency: <span className="text-white font-semibold">SLE — Sierra Leonean Leone</span>
          </p>
        </div>
      </div>

      {/* QR Code Placeholder */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center gap-3">
        <div className="w-[200px] h-[200px] rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center gap-2">
          <QrCode className="h-16 w-16 text-gray-300" />
        </div>
        <p className="text-sm text-gray-400 font-medium">QR Code coming soon</p>
      </div>

      {/* Share Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "Poppins, sans-serif" }}>
          Share your wallet number
        </h2>

        <Button
          onClick={copyWalletNumber}
          disabled={walletLoading || !wallet?.wallet_number}
          className="w-full h-11 font-semibold text-white flex items-center gap-2"
          style={{ background: "linear-gradient(135deg, #1DA1F2, #1a91da)" }}>
          <Copy className="h-4 w-4" />
          Copy Wallet Number
        </Button>

        <p className="text-xs text-gray-400 text-center">
          Share your wallet number with anyone to receive SLE payments instantly
        </p>
      </div>

      {/* How to Receive Info Box */}
      <div className="rounded-xl p-5 space-y-3" style={{ backgroundColor: "#EFF8FF", border: "1px solid #BAE3FD" }}>
        <h3 className="text-sm font-semibold text-[#1DA1F2]">How to receive money</h3>
        <ul className="space-y-2">
          {[
            "Share your wallet number",
            "Sender enters your number in Send Money",
            "Funds arrive instantly in your wallet",
          ].map((step, i) => (
            <li key={i} className="flex items-center gap-2.5 text-sm text-gray-700">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: "#1DA1F2" }} />
              {step}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
