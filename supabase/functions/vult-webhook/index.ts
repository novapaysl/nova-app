import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSign, constants } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Official Vult Gateway Endpoints
const VULT_PROD_URL = "https://wallet.vultme.io/api/merchants/private/v1/payment-links";
const VULT_STAGE_URL = "https://stage.vultme.io/api/merchants/private/v1/payment-links";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { orderId, amount, currency, walletId, paymentType } = await req.json();

    const envMerchantId = Deno.env.get("VULT_MERCHANT_ID");
    const privateKeyRaw = Deno.env.get("VULT_PRIVATE_KEY");

    if (!privateKeyRaw) {
      throw new Error("Missing VULT_PRIVATE_KEY in Supabase secrets.");
    }

    // Clean up PEM key line breaks and quotes
    let privateKey = privateKeyRaw.trim();
    privateKey = privateKey.replace(/\\n/g, "\n").replace(/\r/g, "");
    if (
      (privateKey.startsWith('"') && privateKey.endsWith('"')) ||
      (privateKey.startsWith("'") && privateKey.endsWith("'"))
    ) {
      privateKey = privateKey.slice(1, -1);
    }

    // Use incoming walletId if passed, otherwise fall back to VULT_MERCHANT_ID
    const targetMerchantId = (walletId || envMerchantId || "").trim();

    if (!targetMerchantId) {
      throw new Error("No Merchant ID or Wallet ID provided.");
    }

    // Construct request body according to Vult spec
    const requestBody = {
      merchantId: targetMerchantId,
      type: paymentType || "card", // "card" triggers Visa/Mastercard direct top-up page
      payload: {
        orderId: String(orderId || `TOPUP-${crypto.randomUUID().slice(0, 8)}`),
        currency: currency || "SLE",
        amount: String(amount || "10"),
      },
    };

    const bodyString = JSON.stringify(requestBody);

    // RSA-4096 SHA-512 PSS signature calculation
    const signer = createSign("RSA-SHA512");
    signer.update(bodyString);

    const signature = signer.sign(
      {
        key: privateKey,
        padding: constants.RSA_PKCS1_PSS_PADDING,
        saltLength: constants.RSA_PSS_SALTLEN_DIGEST,
      },
      "base64"
    );

    const endpoint = VULT_PROD_URL;

    console.log(`[VULT TOP-UP] Sending request to ${endpoint}:`, bodyString);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Vult-Merchant-Signature": signature,
      },
      body: bodyString,
    });

    const responseText = await response.text();
    console.log("[VULT TOP-UP] Status:", response.status);
    console.log("[VULT TOP-UP] Response:", responseText);

    if (!response.ok) {
      throw new Error(`Gateway returned status (${response.status}): ${responseText}`);
    }

    const json = JSON.parse(responseText);
    const checkoutUrl = json.data?.link || json.data?.code || json.link;

    if (!checkoutUrl) {
      throw new Error(`Checkout URL missing in response: ${responseText}`);
    }

    return new Response(JSON.stringify({ checkoutUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("[VULT TOP-UP Error]:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});