import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom"; 
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase safely
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const PublicPayPage = () => {
  const { id } = useParams<{ id: string }>(); // Grabs the ID from the URL
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<"mobile" | "card">("card");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!id) {
        setError("Invalid payment link.");
        setLoading(false);
        return;
      }
      
      // Fetch the specific payment link from Supabase
      const { data, error } = await supabase
        .from("payment_links")
        .select("*")
        .eq("id", id)
        .single();
        
      if (error || !data) {
        setError("Payment link not found or has expired.");
      } else {
        setInvoice(data);
      }
      setLoading(false);
    };
    
    fetchInvoice();
  }, [id]);

  const handleProceedToPay = async () => {
    if (selectedMethod === "card") {
      setIsProcessing(true);
      // TODO: This is where we will call the Vult Edge Function in Phase 4!
      alert("This will securely redirect to Vult Card Gateway!");
      setIsProcessing(false);
    } else {
      alert("Mobile Money flow initiated!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin text-4xl">🔄</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-200 shadow-sm">
          <h3 className="font-bold">Error Loading Invoice</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Left Sidebar - Payment Methods */}
      <div className="w-full md:w-1/3 bg-white border-r border-slate-200 p-8 flex flex-col justify-center">
        <h2 className="text-sm font-bold text-slate-500 mb-6 tracking-widest">PAY WITH</h2>
        
        <div className="space-y-4">
          <button 
            onClick={() => setSelectedMethod("card")}
            className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${selectedMethod === "card" ? "bg-blue-50 border border-blue-200 text-blue-700" : "bg-transparent text-slate-600 hover:bg-slate-50"}`}
          >
            <span className="text-xl">💳</span>
            <span className="font-semibold text-sm">Credit / Debit Card</span>
          </button>

          <button 
            onClick={() => setSelectedMethod("mobile")}
            className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${selectedMethod === "mobile" ? "bg-blue-50 border border-blue-200 text-blue-700" : "bg-transparent text-slate-600 hover:bg-slate-50"}`}
          >
            <span className="text-xl">📱</span>
            <span className="font-semibold text-sm">Mobile Money</span>
          </button>
        </div>
      </div>

      {/* Right Content - Invoice Details */}
      <div className="w-full md:w-2/3 p-8 flex items-center justify-center">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-8 border-b pb-6">
            <div>
              <h1 className="text-xl font-bold text-slate-900">NovaPay Secure Checkout</h1>
              <p className="text-sm text-slate-500">{invoice.description || "Payment Request"}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500 mb-1">Amount Due</p>
              <h2 className="text-3xl font-black text-blue-600">{invoice.currency} {invoice.amount.toFixed(2)}</h2>
            </div>
          </div>

          <button 
            onClick={handleProceedToPay}
            disabled={isProcessing}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all disabled:opacity-70"
          >
            {isProcessing ? "Connecting to Gateway..." : `Proceed To Pay ${invoice.currency} ${invoice.amount.toFixed(2)}`}
          </button>
          
          <p className="text-center text-xs text-slate-400 mt-6 flex items-center justify-center gap-1">
            🔒 Secured by NovaPay & Vult
          </p>
        </div>
      </div>
    </div>
  );
};