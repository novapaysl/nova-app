import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// 🔐 Failsafe initialization
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      auth: { getUser: async () => ({ data: { user: null } }) },
      functions: {
        invoke: async () => ({ data: null, error: new Error("Client uninitialized. Check .env file.") })
      }
    } as any;

export const SendMoneyPage = () => {
  const [sourceWallet, setSourceWallet] = useState<"SLE" | "USD">("SLE");
  const [destType, setDestType] = useState<"novapay" | "momo">("novapay");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [operator, setOperator] = useState("orange");
  const [loading, setLoading] = useState(false);
  const [accountLevel, setAccountLevel] = useState<number>(1);
  const [isFetchingLevel, setIsFetchingLevel] = useState(true);

  useEffect(() => {
    fetchAccountLevel();
  }, []);

  const fetchAccountLevel = async () => {
    setIsFetchingLevel(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("account_level")
          .eq("id", user.id)
          .single();

        if (!error && data) {
          setAccountLevel(data.account_level || 1);
        }
      }
    } catch (err) {
      console.error("Error fetching account level:", err);
    } finally {
      setIsFetchingLevel(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    // 🔒 LEVEL 1 RESTRICTION
    if (accountLevel < 2) {
      alert("🔒 Level 2 Verification Required!\n\nSending transfers and Mobile Money cashouts are reserved for Level 2 users. Please contact a NovaPay admin to approve your account.");
      return;
    }

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return alert("Please enter a valid amount");

    if (destType === "momo" && sourceWallet === "USD") {
      alert("❌ Mobile Money payouts can only be processed from your SLE Wallet. Please swap USD to SLE first!");
      return;
    }

    setLoading(true);

    try {
      // 1. Get current logged in user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert("Session expired or user not logged in. Please log in again.");
        setLoading(false);
        return;
      }

      // 📱 MOBILE MONEY WITHDRAWAL (Via Vercel + Monime)
      if (destType === "momo") {
        const response = await fetch("https://nova-app-kappa.vercel.app/api/monime-withdraw", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
            amount: amt,
            phoneNumber: recipient,
            provider: operator === "africell" ? "afrimoney" : operator, // Maps 'africell' to 'afrimoney'
          }),
        });

        const resData = await response.json();

        if (!response.ok) {
          throw new Error(resData.error || "Failed to process withdrawal");
        }

        alert("🎉 Withdrawal successfully initiated! Funds will arrive shortly.");
        setAmount("");
        setRecipient("");
      } 
      
      // 🔄 NOVAPAY TO NOVAPAY P2P (Via Supabase Edge Function)
      else {
        const { error } = await supabase.functions.invoke("process-transfer", {
          body: {
            source: sourceWallet,
            destination: destType,
            recipient: recipient,
            amount: amt,
            operator: null
          }
        });

        if (error) throw error;
        alert("🎉 NovaPay Transfer successful!");
        setAmount("");
        setRecipient("");
      }

    } catch (err: any) {
      console.error("Transfer Error:", err);
      alert(`Transfer Failed: ${err.message || "An error occurred"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto text-slate-900 dark:text-white">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold">Send Money</h2>
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
            accountLevel === 2
              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
              : "bg-amber-500/10 text-amber-500 border-amber-500/30"
          }`}>
            Level {accountLevel} Account
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Transfer locally to Mobile Money or globally to other NovaPay users.</p>

        {accountLevel < 2 && !isFetchingLevel ? (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl text-center space-y-2">
            <p className="font-bold text-amber-700 dark:text-amber-400 text-sm">🔒 Level 2 Verification Required</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Sending transfers and Mobile Money cashouts are reserved for Level 2 approved accounts. Please contact a NovaPay admin to approve your account.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="text-xs font-semibold block mb-1">Transfer Network</label>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  type="button" 
                  onClick={() => { setDestType("novapay"); setSourceWallet("SLE"); }}
                  className={`py-2 text-xs rounded-lg font-medium border transition ${destType === 'novapay' ? 'border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400' : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-600'}`}
                >
                  🔄 NovaPay to NovaPay
                </button>
                <button 
                  type="button" 
                  onClick={() => { setDestType("momo"); setSourceWallet("SLE"); }}
                  className={`py-2 text-xs rounded-lg font-medium border transition ${destType === 'momo' ? 'border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400' : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-600'}`}
                >
                  📱 Mobile Money Account
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">Source Debit Wallet</label>
              <select 
                value={sourceWallet} 
                onChange={(e) => setSourceWallet(e.target.value as "SLE" | "USD")} 
                className="w-full px-3 py-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500"
                disabled={destType === "momo"}
              >
                <option value="SLE">SLE Wallet</option>
                <option value="USD">USD Wallet</option>
              </select>
            </div>

            {destType === "novapay" ? (
              <div>
                <label className="text-xs font-semibold block mb-1">Recipient's 9-Digit Wallet ID *</label>
                <input 
                  type="text" 
                  placeholder="e.g. 232111222" 
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-blue-500" 
                  required 
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="text-xs font-semibold block mb-1">Select Network Operator *</label>
                  <select value={operator} onChange={(e) => setOperator(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800">
                    <option value="orange">Orange Money (SLE)</option>
                    <option value="africell">Africell / Afrimoney (SLE)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1">Recipient Phone Number *</label>
                  <input 
                    type="tel" 
                    placeholder="e.g. 076123456" 
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-blue-500" 
                    required 
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-xs font-semibold block mb-1">Amount to Transfer</label>
              <input 
                type="number" 
                placeholder="0.00" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-blue-500" 
                required 
              />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-bold text-sm transition">
              {loading ? "Initiating Payout..." : "Send Transfer ↗"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};