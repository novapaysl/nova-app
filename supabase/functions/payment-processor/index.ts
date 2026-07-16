import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import crypto from "node:crypto"
import { Buffer } from "node:buffer"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Strictly mimicking Vult's official NodeJS documentation
function generateVultSignature(bodyString: string, privateKey: string): string {
  const formattedKey = privateKey.includes("BEGIN PRIVATE KEY") 
    ? privateKey 
    : `-----BEGIN PRIVATE KEY-----\n${privateKey.match(/.{1,64}/g)?.join('\n')}\n-----END PRIVATE KEY-----`;

  const signer = crypto.createSign('RSA-SHA512');
  signer.update(bodyString);
  
  return signer.sign({
    key: formattedKey,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST, // Matched perfectly to Vult's constant
  }, 'base64');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { amount, currency } = await req.json()

    // 🚀 FIXED: Name matches your Supabase Dashboard perfectly
    const merchantId = Deno.env.get('VULT_MERCHANT_ID')
    const privateKeyRaw = Deno.env.get('VULT_PRIVATE_KEY') 

    if (!merchantId || !privateKeyRaw) {
      throw new Error("Vult credentials missing on server.")
    }

    // 🚀 ALIGNED TO VULT'S EXACT OPENAPI SPECIFICATION
    const orderPayload = {
      merchantId: merchantId,
      type: "card", // Required payment type enum
      payload: {
        orderId: `NP-LOAD-${Date.now()}`,
        amount: amount.toString(), // Converted back to a String as required
        currency: currency
      }
    };

    const bodyString = JSON.stringify(orderPayload);
    const xVultSignature = generateVultSignature(bodyString, privateKeyRaw);

    // 🚀 PRODUCTION VULT ENDPOINT
    const response = await fetch("https://wallet.vultme.io/api/merchants/private/v1/payment-links", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "X-Vult-Merchant-Signature": xVultSignature 
      },
      body: bodyString
    })

    const responseText = await response.text();
    let responseData: any = {};
    
    if (responseText) {
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Vult API Error (${response.status}): ${responseText}`);
      }
    }

    if (!response.ok) {
      throw new Error(responseData.message || `Vult Gateway Rejected: HTTP ${response.status} - ${responseText}`);
    }
    
    // According to their spec, the URL is inside the 'link' property
    return new Response(JSON.stringify({ 
      success: true, 
      data: { checkoutUrl: responseData.data?.link || responseData.link } 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }
})