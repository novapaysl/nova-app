import { getUserWallets } from "../../providers/wallet";
import React, { useState, useEffect } from "react";
import { supabaseClient as supabase } from "../../providers/supabase-client";

export const WalletPage = () => {
  const [balances, setBalances] = useState({ SLE: 0.0, USD: 0.0 });
  const [walletNumber, setWalletNumber] = useState("Loading...");
  const [swapFrom, setSwapFrom] = useState<"SLE" | "USD">("SLE");
  const [swapAmount, setSwapAmount] = useState("");
  const [depositLoading, setDepositLoading] = useState(false);
  const [swapLoading, setSwapLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [accountLevel, setAccountLevel] = useState<number>(1);

  // 💰 Deposit Modal States
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositMethod, setDepositMethod] = useState("card");
  const [phoneNumber, setPhoneNumber] = useState("");

  const EXCHANGE_RATE = 22.50;

  useEffect(() => {
    fetchBalances();
  }, []);

  const fetchBalances = async () => {
    setIsFetching(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setWalletNumber("Not Logged In");
        setIsFetching(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("sle_balance, usd_balance, wallet_number, account_level")
        .eq("id", user.id)
        .single();

      try {
        const wallets = await getUserWallets(user.id);
        if (wallets.length > 0) {
          console.log("✅ User Wallets:", wallets);
        }
      } catch (walletError) {
        console.error("❌ Wallet Service Error:", walletError);
      }

      if (error) throw error;

      if (data) {
        setBalances({
          SLE: data.sle_balance || 0.0,
          USD: data.usd_balance || 0.0,
        });
        setWalletNumber(data.wallet_number || "UNASSIGNED");
        setAccountLevel(data.account_level || 1);
      }
    } catch (err) {
      console.error("Failed to fetch balances:", err);
      setWalletNumber("Error Loading");
    } finally {
      setIsFetching(false);
    }
  };

  // 🚀 Deposit Request for Level 1 & Level 2 Users
  const handleDepositRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(depositAmount);

    if (isNaN(amt) || amt <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (depositMethod === "cash") {
      alert("For cash deposits, please visit our nearest agent or office.");
      return;
    }

    setDepositLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const newOrderId = `NP-LOAD-${Date.now()}`;

      const { error: dbError } = await supabase.from('transactions').insert({
        user_id: user.id,
        order_id: newOrderId,
        amount: amt,
        currency: "SLE",
        payment_method: depositMethod,
        status: "pending"
      });

      if (dbError) throw new Error(`Database error: ${dbError.message}`);

      const apiUrl = depositMethod === "card" 
        ? "/api/vult-checkout" 
        : "/api/monime-checkout";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amt,
          currency: "SLE",
          paymentType: depositMethod,
          phoneNumber,
          orderId: newOrderId,
          userId: user.id // 🔥 FIX: Send the user ID to the backend!
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Deposit initiation failed");

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert(data?.message || "Deposit request submitted successfully.");
        setShowDepositModal(false);
        setDepositAmount("");
        setPhoneNumber("");
      }
    } catch (err: any) {
      console.error("Deposit Error:", err);
      alert(err?.message || "Deposit failed. Please try again.");
    } finally {
      setDepositLoading(false);
    }
  };

  // 🔄 Swap Currencies (Restricted to Level 2)
  const handleSwap = async (e: React.FormEvent) => {
    e.preventDefault();

    if (accountLevel < 2) {
      alert("🔒 Level 2 Verification Required!\n\nCurrency conversion is reserved for Level 2 users. Please contact an admin to upgrade your account.");
      return;
    }

    const amt = parseFloat(swapAmount);
    if (isNaN(amt) || amt <= 0) return alert("Please enter a valid amount");

    setSwapLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user found");

      let updatedSLE = balances.SLE;
      let updatedUSD = balances.USD;

      if (swapFrom === "SLE") {
        if (balances.SLE < amt) throw new Error("Insufficient SLE Balance!");
        updatedSLE -= amt;
        updatedUSD += amt / EXCHANGE_RATE;
      } else {
        if (balances.USD < amt) throw new Error("Insufficient USD Balance!");
        updatedUSD -= amt;
        updatedSLE += amt * EXCHANGE_RATE;
      }

      const { error } = await supabase
        .from("profiles")
        .update({ sle_balance: updatedSLE, usd_balance: updatedUSD })
        .eq("id", user.id);

      if (error) throw error;

      alert("🔄 Balances swapped successfully!");
      setSwapAmount("");
      fetchBalances();
    } catch (err: any) {
      alert(`Swap Failed: ${err.message}`);
    } finally {
      setSwapLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 text-slate-900 dark:text-white">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your Wallets</h2>
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
          accountLevel === 2
            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
            : "bg-amber-500/10 text-amber-500 border-amber-500/30"
        }`}>
          Level {accountLevel} Account
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SLE WALLET */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-lg relative overflow-hidden">
          <p className="text-sm opacity-85">Local Currency Balance</p>
          <h2 className="text-4xl font-extrabold my-3">
            SLE {isFetching ? "..." : balances.SLE.toFixed(2)}
          </h2>
          <div className="flex justify-between items-end mt-4">
            <span className="text-xs bg-white/20 px-2 py-1 rounded">Primary Local Wallet</span>
            <div className="text-right">
              <p className="text-xs opacity-70">Wallet ID</p>
              <p className="font-mono text-sm">
                {isFetching ? "Loading..." : walletNumber !== "UNASSIGNED" ? `SLE-${walletNumber}` : walletNumber}
              </p>
            </div>
          </div>
        </div>

        {/* USD WALLET */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white shadow-lg relative overflow-hidden">
          <p className="text-sm opacity-85">Global Currency Balance</p>
          <h2 className="text-4xl font-extrabold my-3">
            ${isFetching ? "..." : balances.USD.toFixed(2)}
          </h2>
          <div className="flex justify-between items-end mt-4">
            <span className="text-xs bg-white/20 px-2 py-1 rounded">Neo-USD Wallet</span>
            <div className="text-right">
              <p className="text-xs opacity-70">Wallet ID</p>
              <p className="font-mono text-sm">
                {isFetching ? "Loading..." : walletNumber !== "UNASSIGNED" ? `USD-${walletNumber}` : walletNumber}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 💰 ADD FUNDS BUTTON (AVAILABLE FOR LEVEL 1 & LEVEL 2) */}
      <div className="flex justify-center pt-2">
        <button
          onClick={() => setShowDepositModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition"
        >
          + Add Funds to Wallet
        </button>
      </div>

      {/* 💰 DEPOSIT MODAL */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl w-full max-w-md shadow-xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-xl font-bold mb-4">Request Deposit</h3>
            <form onSubmit={handleDepositRequest} className="space-y-4">
              <div>
                <label className="text-xs font-semibold block mb-1">Amount (SLE)</label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g. 500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">Mobile Money Number</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g. 077123456"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">Payment Method</label>
                <select
                  value={depositMethod}
                  onChange={(e) => setDepositMethod(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="card">Visa / Mastercard</option>
                  <option value="orange_money">Orange Money</option>
                  <option value="afrimoney">Afrimoney</option>
                  <option value="cash">Cash (In Person)</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="flex-1 py-2 rounded-lg font-bold border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={depositLoading}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold"
                >
                  {depositLoading ? "Redirecting..." : "Confirm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONVERTER SECTION (LOCKED FOR LEVEL 1, UNLOCKED FOR LEVEL 2) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md mx-auto shadow-sm">
        <h3 className="text-lg font-bold">Convert Currencies Instantly</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Transfer money internally between your SLE and USD accounts.
        </p>

        {accountLevel < 2 ? (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl text-center space-y-2">
            <p className="font-bold text-amber-700 dark:text-amber-400 text-sm">🔒 Level 2 Access Required</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Currency conversion is available exclusively to Level 2 verified users. Please contact support or an admin to upgrade your account.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg mb-4 text-sm flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Platform Rate:</span>
              <strong className="text-blue-500">1 USD = {EXCHANGE_RATE} SLE</strong>
            </div>

            <form onSubmit={handleSwap} className="space-y-4">
              <div>
                <label className="text-xs font-semibold block mb-1">Swap Direction</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSwapFrom("SLE")}
                    className={`py-2 text-xs rounded-lg font-medium border transition ${
                      swapFrom === "SLE"
                        ? "border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                        : "bg-transparent text-slate-600 border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    🇸🇱 SLE to 💵 USD
                  </button>
                  <button
                    type="button"
                    onClick={() => setSwapFrom("USD")}
                    className={`py-2 text-xs rounded-lg font-medium border transition ${
                      swapFrom === "USD"
                        ? "border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                        : "bg-transparent text-slate-600 border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    💵 USD to 🇸🇱 SLE
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">Amount ({swapFrom})</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={swapAmount}
                  onChange={(e) => setSwapAmount(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {swapAmount && !isNaN(parseFloat(swapAmount)) && (
                <div className="text-xs bg-blue-50 dark:bg-blue-950/20 p-2 rounded text-blue-600 dark:text-blue-400 font-medium">
                  You will receive:{" "}
                  {swapFrom === "SLE"
                    ? `$${(parseFloat(swapAmount) / EXCHANGE_RATE).toFixed(2)} USD`
                    : `${(parseFloat(swapAmount) * EXCHANGE_RATE).toFixed(2)} SLE`}
                </div>
              )}

              <button
                type="submit"
                disabled={swapLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-bold text-sm transition"
              >
                {swapLoading ? "Converting Balances..." : "Convert Wallets 🔄"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default WalletPage;