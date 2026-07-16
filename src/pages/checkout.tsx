import React, { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export const CheckoutPage = () => {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  
  // Use a ref to prevent double-firing in React Strict Mode
  const hasFetched = useRef(false);

  const toMerchant = searchParams.get("to") || "";
  const invoiceAmount = searchParams.get("amount") || "0.00";
  const currency = searchParams.get("currency") || "USD";

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const initiateRedirect = async () => {
      if (!toMerchant) {
        setError("Error: Merchant configuration missing from URL.");
        return;
      }

      try {
        // Automatically request the Vult payment link from your backend
        const { data, apiError } = await supabaseClient.functions.invoke("payment-processor", {
          body: {
            amount: parseFloat(invoiceAmount),
            currency,
            paymentMethod: "card",
            merchant_wallet: toMerchant
          },
        });

        if (apiError) throw apiError;
        const result = typeof data === "string" ? JSON.parse(data) : data;

        if (result?.success === false) {
          throw new Error(result.error || "Gateway rejected order request.");
        }

        if (result?.data?.checkoutUrl) {
          // 🚀 INSTANT REDIRECT TO VULT
          window.location.href = result.data.checkoutUrl;
        } else {
          throw new Error("No checkout URL returned from Vult.");
        }
      } catch (err: any) {
        setError(err.message);
      }
    };

    initiateRedirect();
  }, [toMerchant, invoiceAmount, currency]);

  // If there is an error (like the base64 issue), it shows it clearly on screen
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-200 shadow-sm max-w-md w-full text-center">
          <h3 className="font-bold mb-2">Payment Processing Failed</h3>
          <p className="text-sm font-mono">{error}</p>
        </div>
      </div>
    );
  }

  // The instant loading screen the user sees for 1 second before teleporting
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
       <div className="animate-spin text-4xl mb-6">🔄</div>
       <h2 className="text-xl font-bold">Connecting to Secure Gateway...</h2>
       <p className="text-sm text-slate-500 mt-2">You are being redirected to complete your payment.</p>
    </div>
  );
};