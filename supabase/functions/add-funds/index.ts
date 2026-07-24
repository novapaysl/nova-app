import crypto from "node:crypto";
import { Buffer } from "node:buffer";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);
function generateVultSignature(
  bodyString: string,
  privateKey: string
): string {
  const formattedKey = privateKey.includes("BEGIN PRIVATE KEY")
    ? privateKey
    : `-----BEGIN PRIVATE KEY-----\n${privateKey
        .match(/.{1,64}/g)
        ?.join("\n")}\n-----END PRIVATE KEY-----`;

  const signer = crypto.createSign("RSA-SHA512");

  signer.update(bodyString);

  return signer.sign(
    {
      key: formattedKey,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
      saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
    },
    "base64"
  );
}
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      amount,
      currency,
      paymentMethod,
      walletId,
    } = await req.json();
const internalReference =
  `NP-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  
  const authHeader = req.headers.get("Authorization");

if (!authHeader) {
  throw new Error("Missing authorization header.");
}

const jwt = authHeader.replace("Bearer ", "");

const userClient = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("NOVAPAY_SUPABASE_ANON_KEY")!,
  {
    global: {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    },
  }
);

const {
  data: { user },
  error: authError,
} = await userClient.auth.getUser();

if (authError || !user) {
  throw new Error("Unauthorized user.");
}
  
    // Validate required fields
    if (!amount) {
      throw new Error("Amount is required.");
    }

    if (!paymentMethod) {
      throw new Error("Payment method is required.");
    }

    // Create pending deposit
const { data: deposit, error: depositError } = await supabase
  .from("deposits")
  .insert({
    amount,
    currency,
    payment_method: paymentMethod,
    wallet_id: walletId ?? null,
    payment_provider:
      paymentMethod === "card"
        ? "vult"
        : paymentMethod === "cash"
        ? "manual"
        : "monime",
    internal_reference: internalReference,
    status: "pending",
  })
  .select()
  .single();

if (depositError) {
  throw depositError;
}

console.log("Deposit Created:", deposit.id);
    const merchantId = Deno.env.get("VULT_MERCHANT_ID")!;
const privateKey = Deno.env.get("VULT_PRIVATE_KEY")!;

const orderPayload = {
  merchantId,
  type: "card",
  payload: {
    orderId: internalReference,
    amount: amount.toString(),
    currency,
  },
};

const bodyString = JSON.stringify(orderPayload);

const signature = generateVultSignature(
  bodyString,
  privateKey
);

const vultResponse = await fetch(
  "https://wallet.vultme.io/api/merchants/private/v1/payment-links",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Vult-Merchant-Signature": signature,
    },
    body: bodyString,
  }
);

const vultData = await vultResponse.json();

if (!vultResponse.ok) {
  throw new Error(
    vultData.message || "Vult rejected request."
  );
}

const checkoutUrl =
  vultData.data?.link ??
  vultData.link;

await supabase
  .from("deposits")
  .update({
    checkout_url: checkoutUrl,
    provider_reference:
      vultData.data?.reference ??
      null,
  })
  .eq("id", deposit.id);
    return new Response(
  JSON.stringify({
    success: true,
    checkoutUrl,
  }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message,
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});