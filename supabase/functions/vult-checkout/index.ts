import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSign, constants } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Official Vult Endpoints
const VULT_STAGE_URL = "https://stage.vultme.io/api/merchants/private/v1/payment-links";
const VULT_PROD_URL = "https://wallet.vultme.io/api/merchants/private/v1/payment-links";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { orderId, amount, currency, paymentType } = await req.json();

    const merchantId = Deno.env.get("VULT_MERCHANT_ID");
    const privateKeyRaw = Deno.env.get("VULT_PRIVATE_KEY");

    if (!merchantId || !privateKeyRaw) {
      throw new Error("Missing VULT_MERCHANT_ID or VULT_PRIVATE_KEY in Supabase secrets.");
    }

    // Standardize PEM key line breaks
    const privateKey = privateKeyRaw.replace(/\\n/g, "\n");

    // Build payload exactly as specified in Vult schema
    const requestBody = {
      merchantId: merchantId,
      type: paymentType || "card", // "card", "vult", "in-app", or "momo"
      payload: {
        orderId: String(orderId || crypto.randomUUID()),
        currency: currency || "SLE",
        amount: String(amount || "10"),
      },
    };

    const bodyString = JSON.stringify(requestBody);

    // Compute RSA-4096 SHA-512 PSS Signature matching Vult signature-gen.js
    const signer = createSign("RSA-SHA512");
    signer.update(bodyString);
    signer.end();

    const signature = signer.sign(
      {
        key: privateKey,
        padding: constants.RSA_PKCS1_PSS_PADDING,
        saltLength: constants.RSA_PSS_SALTLEN_DIGEST,
      },
      "base64"
    );

    // Testing Staging environment first
    const endpoint = VULT_STAGE_URL;

    console.log(`Sending request to Vult (${endpoint})...`);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Vult-Merchant-Signature": signature,
      },
      body: bodyString,
    });

    const responseText = await response.text();
    console.log("Vult Gateway Response Code:", response.status);
    console.log("Vult Gateway Response Body:", responseText);

    if (!response.ok) {
      throw new Error(`Gateway Returned (${response.status}): ${responseText}`);
    }

    const json = JSON.parse(responseText);
    const checkoutUrl = json.data?.link || json.data?.code || json.link;

    if (!checkoutUrl) {
      throw new Error(`Payment link missing in Vult response: ${responseText}`);
    }

    return new Response(JSON.stringify({ checkoutUrl }), {
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