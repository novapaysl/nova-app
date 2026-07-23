import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import crypto from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Official Production Vult Gateway Endpoint
const VULT_PROD_URL = "https://wallet.vultme.io/api/merchants/private/v1/payment-links";

/**
 * Normalizes raw private keys, string escaped newlines, and missing PEM headers
 */
function normalizePrivateKey(rawKey: string): string {
  let key = rawKey.trim();

  // Strip wrapping outer quotes if present
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }

  // Convert literal '\n' and carriage returns to actual Unix newlines
  key = key.replace(/\\n/g, "\n").replace(/\r/g, "").trim();

  // Return if headers already exist
  if (key.includes("BEGIN PRIVATE KEY") || key.includes("BEGIN RSA PRIVATE KEY")) {
    return key;
  }

  // Auto-format raw base64 strings into PKCS#8 standard
  const cleanBase64 = key.replace(/\s+/g, "");
  const chunked = cleanBase64.match(/.{1,64}/g)?.join("\n") || cleanBase64;
  return `-----BEGIN PRIVATE KEY-----\n${chunked}\n-----END PRIVATE KEY-----`;
}

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

    const formattedPrivateKey = normalizePrivateKey(privateKeyRaw);
    const targetMerchantId = (walletId || envMerchantId || "").trim();

    if (!targetMerchantId) {
      throw new Error("Missing VULT_MERCHANT_ID in Supabase secrets or request.");
    }

    // Vult Payload Specification
    const requestBody = {
      merchantId: targetMerchantId,
      type: paymentType || "card",
      payload: {
        orderId: String(orderId || `TOPUP-${crypto.randomUUID().slice(0, 8)}`),
        currency: currency || "SLE",
        amount: String(amount || "10"),
      },
    };

    const bodyString = JSON.stringify(requestBody);

// DEBUG: Log exactly what is being signed
console.log("========= REQUEST BODY =========");
console.log(bodyString);
console.log("================================");

// Signature Computation (RSA-SHA512 + PSS Padding)
const signer = crypto.createSign("RSA-SHA512");
    signer.update(bodyString);

    const signature = signer.sign(
      {
        key: formattedPrivateKey,
        padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
        saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
      },
      "base64"
    );

    console.log(`[VULT EDGE FUNCTION] Requesting Payment Link...`);

    const response = await fetch(VULT_PROD_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Vult-Merchant-Signature": signature,
      },
      body: bodyString,
    });

    const responseText = await response.text();

console.log("========== VULT RESPONSE ==========");
console.log("Status:", response.status);

console.log("Headers:");
response.headers.forEach((value, key) => {
  console.log(`${key}: ${value}`);
});

console.log("Body:");
console.log(responseText);

console.log("==================================");

let responseData: any = {};

if (responseText) {
  try {
    responseData = JSON.parse(responseText);
  } catch (_) {
    // Ignore JSON parsing failure
  }
}

if (!response.ok) {
  throw new Error(`Gateway Rejected (${response.status}): ${responseText}`);
}

    if (!response.ok) {
      throw new Error(
        responseData.message || responseData.error || `Gateway Rejected (${response.status}): ${responseText}`
      );
    }

    const checkoutUrl = responseData.data?.link || responseData.data?.code || responseData.link;

    if (!checkoutUrl) {
      throw new Error(`Checkout URL missing in response: ${responseText}`);
    }

    return new Response(JSON.stringify({ checkoutUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("[VULT EDGE FUNCTION ERROR]:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});