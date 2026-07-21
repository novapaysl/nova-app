import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// 🔐 Failsafe initialization
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      auth: { getUser: async () => ({ data: { user: null } }) },
      from: () => ({
        select: () => ({ eq: () => ({ single: async () => ({ data: null }) }) })
      })
    } as any;

export const ReceiveMoneyPage = () => {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<"SLE" | "USD">("SLE");
  const [description, setDescription] = useState("");
  const [merchantWallet, setMerchantWallet] = useState("");
  const [secureLink, setSecureLink] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }: any) => {
      if (user) {
        supabase
          .from("profiles")
          .select("wallet_number")
          .eq("id", user.id)
          .single()
          .then(({ data }: any) => data && setMerchantWallet(data.wallet_number));
      }
    });
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return alert("Please enter a valid amount");
    if (!merchantWallet) return alert("Error: Your merchant wallet has not loaded yet.");

    setIsGenerating(true);

    try {
      // 1. Ensure user is logged in
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("You must be logged in to create a link.");

      // 2. Save the invoice to the payment_links table
      const { data, error } = await supabase
        .from("payment_links")
        .insert({
          merchant_id: user.id,
          merchant_wallet: merchantWallet,
          amount: amt,
          currency: currency,
          description: description || "Payment for services"
        })
        .select("id")
        .single();

      if (error) throw error;

      // 3. Generate the clean URL using the secure database ID
      const baseUrl = window.location.origin;
      const generatedUrl = `${baseUrl}/pay/${data.id}`;
      setSecureLink(generatedUrl);

    } catch (err: any) {
      alert("Failed to generate link: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto text-slate-900 dark:text-white">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold">Request Money</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Create invoice link. Users can pay with credit cards, mobile money, or NovaPay.</p>

        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="text-xs font-semibold block mb-1">Target Credit Wallet</label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                type="button" 
                onClick={() => setCurrency("SLE")}
                className={`py-2 text-xs rounded-lg font-medium border transition ${currency === 'SLE' ? 'border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400' : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-600'}`}
              >
                🇸🇱 SLE Wallet
              </button>
              <button 
                type="button" 
                onClick={() => setCurrency("USD")}
                className={`py-2 text-xs rounded-lg font-medium border transition ${currency === 'USD' ? 'border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400' : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-600'}`}
              >
                💵 USD Wallet
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1">Requested Invoice Amount</label>
            <input 
              type="number" 
              placeholder="0.00" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800 outline-none" 
              required 
            />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1">Description (Optional)</label>
            <textarea 
              placeholder="Enter your text here" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={127}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg bg-transparent border-slate-200 dark:border-slate-800 outline-none resize-none" 
            />
            <p className="text-[10px] text-slate-400 mt-1">Description can't exceed 127 characters</p>
          </div>

          <button 
            type="submit" 
            disabled={isGenerating}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-bold text-sm transition disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isGenerating ? "Generating..." : "Generate Secure Payment Link"}
          </button>
        </form>

        {secureLink && (
          <div className="mt-6 p-4 rounded-xl border border-dashed border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/10 space-y-3">
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400">🔗 Checkout Link Ready:</p>
            <input type="text" readOnly value={secureLink} className="w-full text-[10px] p-2 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded outline-none" />
            <button 
              onClick={() => { navigator.clipboard.writeText(secureLink); alert("Copied to clipboard!"); }}
              className="w-full py-1.5 text-xs border border-blue-500 dark:border-blue-700 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/20 font-semibold transition"
            >
              Copy Link 📋
            </button>
          </div>
        )}
      </div>
    </div>
  );
};