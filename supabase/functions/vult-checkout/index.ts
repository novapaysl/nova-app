import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSign } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { orderId, amount, currency } = await req.json();

    const merchantId = Deno.env.get("VULT_MERCHANT_ID");
    const privateKeyRaw = Deno.env.get("VULT_PRIVATE_KEY");

    if (!merchantId || !privateKeyRaw) {
      throw new Error("Missing VULT credentials in Supabase secrets.");
    }

    // Format PEM key correctly
    const privateKey = privateKeyRaw.replace(/\\n/g, "\n");

    // Construct Canonical Payload for Vult
    const payload = JSON.stringify({
      amount: Number(amount),
      currency: currency || "SLE",
      merchantId: merchantId,
      orderId: String(orderId),
    });

    // Create RSA-SHA512 Signature
    const signer = createSign("RSA-SHA512");
    signer.update(payload);
    signer.end();

    const signature = signer.sign(
      {
        key: privateKey,
        padding: 6, // RSA_PKCS1_PSS_PADDING
      },
      "base64"
    );

    // Call Vult Checkout API (using official vultme.io domain)
    const response = await fetch("https://api.vultme.io/v1/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Vult-Merchant-Id": merchantId,
        "X-Vult-Merchant-Signature": signature,
      },
      body: payload,
    });

    const responseText = await response.text();
    console.log("Vult Status Code:", response.status);
    console.log("Vult Raw Response:", responseText);

    if (!response.ok) {
      throw new Error(`Gateway returned ${response.status}: ${responseText}`);
    }

    const data = JSON.parse(responseText);

    return new Response(JSON.stringify({ checkoutUrl: data.checkoutUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Vult Edge Function Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});