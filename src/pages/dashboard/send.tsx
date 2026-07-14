import { useGetIdentity, useList, useCreate } from "@refinedev/core";
import { Link } from "react-router";
import { useState } from "react";
import { ArrowUpRight, ArrowLeft, CheckCircle2, Loader2, Info, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

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
};

type TransferResponse = {
  id: string;
  reference: string;
  amount: number;
  status: string;
  receiver_wallet: string;
  sender_wallet: string;
};

type Step = "form" | "confirm" | "success";

type FormValues = {
  recipientWallet: string;
  amount: string;
  description: string;
};

function formatBalance(amount: number | string | undefined): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (num === undefined || num === null || isNaN(num as number)) return "SLE 0.00";
  return `SLE ${(num as number).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export const SendMoneyPage = () => {
  const { data: identity } = useGetIdentity<Identity>();
  const userId = identity?.id;

  const [step, setStep] = useState<Step>("form");
  const [formValues, setFormValues] = useState<FormValues>({
    recipientWallet: "",
    amount: "",
    description: "",
  });
  const [errors, setErrors] = useState<Partial<FormValues>>({});
  const [successData, setSuccessData] = useState<TransferResponse | null>(null);

  // Fetch sender's wallet
  const { query: walletQuery, result: walletResult } = useList<WalletData>({
    resource: "wallets",
    filters: [{ field: "user_id", operator: "eq", value: userId }],
    pagination: { pageSize: 1 },
    queryOptions: { enabled: !!userId },
  });

  const walletLoading = walletQuery.isLoading;
  const wallet = walletResult.data?.[0] as WalletData | undefined;

  // useCreate for transfers
  const { mutate: createTransfer, mutation } = useCreate<TransferResponse>();
  const isSubmitting = mutation.isPending;

  // ---- Handlers ----

  const handleFieldChange = (field: keyof FormValues, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormValues> = {};

    if (!formValues.recipientWallet.trim()) {
      newErrors.recipientWallet = "Recipient wallet number is required";
    } else if (wallet?.wallet_number && formValues.recipientWallet.trim() === wallet.wallet_number) {
      newErrors.recipientWallet = "You cannot send money to your own wallet";
    }

    const amountNum = parseFloat(formValues.amount);
    if (!formValues.amount) {
      newErrors.amount = "Amount is required";
    } else if (isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateForm()) {
      setStep("confirm");
    }
  };

  const handleConfirmSend = () => {
    if (!wallet?.id) return;

    createTransfer(
      {
        resource: "transfers",
        values: {
          sender_wallet: wallet.id,
          receiver_wallet: formValues.recipientWallet.trim(),
          amount: parseFloat(formValues.amount),
          description: formValues.description || undefined,
        },
      },
      {
        onSuccess: (data) => {
          setSuccessData(data.data as unknown as TransferResponse);
          setStep("success");
        },
        onError: () => {
          // Error handled by notification provider
        },
      },
    );
  };

  const handleSendAnother = () => {
    setStep("form");
    setFormValues({ recipientWallet: "", amount: "", description: "" });
    setErrors({});
    setSuccessData(null);
  };

  // ---- Render ----

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page Heading */}
      <div className="flex items-center gap-3">
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #1DA1F2, #22C55E)" }}>
          <ArrowUpRight className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "Poppins, sans-serif" }}>
            Send Money
          </h1>
          <p className="text-gray-500 text-sm">Transfer SLE to any NovaPay wallet</p>
        </div>
      </div>

      {/* Step 1 — Transfer Form */}
      {step === "form" && (
        <div className="bg-white rounded-2xl shadow p-6 space-y-5">
          {/* Sender wallet info box */}
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE]">
            <Info className="h-4 w-4 shrink-0" style={{ color: "#1DA1F2" }} />
            <span className="text-sm text-[#1D4ED8]">
              <span className="font-medium">Your wallet: </span>
              {walletLoading ? (
                <Skeleton className="inline-block h-4 w-28 align-middle" />
              ) : (
                <span className="font-mono font-semibold">{wallet?.wallet_number ?? "—"}</span>
              )}
            </span>
          </div>

          {/* Recipient Wallet Number */}
          <div className="space-y-2">
            <Label htmlFor="recipientWallet" className="text-sm font-semibold text-gray-700">
              Recipient Wallet Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="recipientWallet"
              placeholder="Enter wallet number"
              value={formValues.recipientWallet}
              onChange={(e) => handleFieldChange("recipientWallet", e.target.value)}
              className={`rounded-xl font-mono ${
                errors.recipientWallet ? "border-red-400 focus-visible:ring-red-300" : ""
              }`}
            />
            {errors.recipientWallet && (
              <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3" />
                {errors.recipientWallet}
              </p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-semibold text-gray-700">
              Amount (SLE) <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold select-none">
                SLE
              </span>
              <Input
                id="amount"
                type="number"
                min={1}
                step="0.01"
                placeholder="0.00"
                value={formValues.amount}
                onChange={(e) => handleFieldChange("amount", e.target.value)}
                className={`pl-12 rounded-xl ${errors.amount ? "border-red-400 focus-visible:ring-red-300" : ""}`}
              />
            </div>
            {errors.amount && (
              <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3" />
                {errors.amount}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold text-gray-700">
              Description / Note <span className="text-gray-400 font-normal">(optional)</span>
            </Label>
            <Textarea
              id="description"
              placeholder="What's this for?"
              value={formValues.description}
              onChange={(e) => handleFieldChange("description", e.target.value)}
              rows={3}
              className="rounded-xl resize-none"
            />
          </div>

          {/* Continue Button */}
          <Button
            onClick={handleContinue}
            className="w-full h-12 rounded-xl text-white font-semibold text-base transition-all duration-200 hover:opacity-90"
            style={{ backgroundColor: "#1DA1F2" }}>
            Continue
            <ArrowUpRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Step 2 — Confirmation Preview */}
      {step === "confirm" && (
        <div className="bg-white rounded-2xl shadow p-6 space-y-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1" style={{ fontFamily: "Poppins, sans-serif" }}>
              Confirm Transfer
            </h2>
            <p className="text-gray-500 text-sm">Please review the details before confirming.</p>
          </div>

          {/* Summary card */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 divide-y divide-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-sm text-gray-500 font-medium">From Wallet</span>
              <span className="font-mono text-sm font-semibold text-gray-800">{wallet?.wallet_number ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-sm text-gray-500 font-medium">To Wallet</span>
              <span className="font-mono text-sm font-semibold text-gray-800">{formValues.recipientWallet}</span>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-sm text-gray-500 font-medium">Amount</span>
              <span className="text-lg font-bold" style={{ color: "#1DA1F2" }}>
                {formatBalance(formValues.amount)}
              </span>
            </div>
            {formValues.description && (
              <div className="flex items-start justify-between px-5 py-4">
                <span className="text-sm text-gray-500 font-medium">Description</span>
                <span className="text-sm text-gray-700 text-right max-w-[60%]">{formValues.description}</span>
              </div>
            )}
          </div>

          <Separator />

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => setStep("form")}
              className="flex-1 h-12 rounded-xl font-semibold"
              disabled={isSubmitting}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={handleConfirmSend}
              disabled={isSubmitting}
              className="flex-1 h-12 rounded-xl text-white font-semibold text-base transition-all duration-200 hover:opacity-90"
              style={{ backgroundColor: "#22C55E" }}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirm &amp; Send
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3 — Success Screen */}
      {step === "success" && (
        <div className="bg-white rounded-2xl shadow p-8 flex flex-col items-center text-center space-y-5">
          {/* Green checkmark */}
          <div
            className="h-20 w-20 rounded-full flex items-center justify-center shadow-lg"
            style={{ background: "linear-gradient(135deg, #22C55E, #16A34A)" }}>
            <CheckCircle2 className="h-10 w-10 text-white" strokeWidth={2.5} />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "Poppins, sans-serif" }}>
              Transfer Successful!
            </h2>
            <p className="text-gray-500 text-sm">Your money has been sent successfully.</p>
          </div>

          {/* Transfer details */}
          <div className="w-full rounded-xl border border-gray-100 bg-gray-50 divide-y divide-gray-100 text-left overflow-hidden">
            {successData?.reference && (
              <div className="flex items-center justify-between px-5 py-3.5">
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Reference</span>
                <span className="font-mono text-sm font-semibold text-gray-800">{successData.reference}</span>
              </div>
            )}
            <div className="flex items-center justify-between px-5 py-3.5">
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Amount Sent</span>
              <span className="text-base font-bold" style={{ color: "#22C55E" }}>
                {formatBalance(formValues.amount)}
              </span>
            </div>
            <div className="flex items-center justify-between px-5 py-3.5">
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Recipient</span>
              <span className="font-mono text-sm font-semibold text-gray-800">{formValues.recipientWallet}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
            <Button
              variant="outline"
              onClick={handleSendAnother}
              className="flex-1 h-11 rounded-xl font-semibold border-2"
              style={{ borderColor: "#1DA1F2", color: "#1DA1F2" }}>
              Send Another
            </Button>
            <Link to="/dashboard/transactions" className="flex-1">
              <Button
                className="w-full h-11 rounded-xl text-white font-semibold"
                style={{ backgroundColor: "#1DA1F2" }}>
                View Transactions
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
