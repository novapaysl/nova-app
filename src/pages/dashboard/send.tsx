import React, { useState } from "react";
import { createClient } from "@supabase/supabase-js";

// 🔐 Failsafe initialization
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return alert("Please enter a valid amount");

    if (destType === "momo" && sourceWallet === "USD") {
      alert("❌ Mobile Money payouts can only be processed from your SLE Wallet. Please swap USD to SLE first!");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-transfer", {
        body: {
          source: sourceWallet,
          destination: destType,
          recipient: recipient,
          amount: amt,
          operator: destType === "momo" ? operator : null
        }
      });

      if (error) throw error;
      alert("🎉 Transfer successfully initiated!");
      setAmount("");
      setRecipient("");
    } catch (err: any) {
      alert(`Transfer Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto text-slate-900 dark:text-white">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold">Send Money</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Transfer locally to Mobile Money or globally to other NovaPay users.</p>

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
                  <option value="mtn">MTN MoMo (SLE)</option>
                  <option value="africell">Africell Money (SLE)</option>
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
      </div>
    </div>
  );
};