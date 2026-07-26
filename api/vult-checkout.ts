import crypto from "crypto";

export default async function handler(req, res) {
  // 1. Enable CORS for your frontend
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { orderId, amount, currency, paymentType } = req.body;

    const merchantId = process.env.VULT_MERCHANT_ID;
    const privateKeyRaw = process.env.VULT_PRIVATE_KEY;

    if (!merchantId || !privateKeyRaw) {
      return res.status(500).json({ error: "Server missing Vult credentials." });
    }

    // Node.js easily formats keys with standard string replacement
    const privateKey = privateKeyRaw.replace(/\\n/g, "\n");

    const requestBody = {
      merchantId: merchantId.trim(),
      type: paymentType || "card",
      payload: {
        orderId: String(orderId || `NP-LOAD-${Date.now()}`),
        currency: currency || "SLE",
        amount: String(amount || "10"),
      },
    };

    const bodyString = JSON.stringify(requestBody);

    // Compute Signature (Native Node.js Crypto)
    const signer = crypto.createSign("RSA-SHA512");
    signer.update(bodyString);
    signer.end();

    const signature = signer.sign(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
        saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
      },
      "base64"
    );

    // Call Vult Production API
    const vultResponse = await fetch("https://wallet.vultme.io/api/merchants/private/v1/payment-links", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Vult-Merchant-Signature": signature,
      },
      body: bodyString,
    });

    const responseText = await vultResponse.text();
    let responseData = {};
    
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {}

    if (!vultResponse.ok) {
      return res.status(vultResponse.status).json({ 
        error: responseData.message || responseData.error || `Gateway Rejected: ${responseText}` 
      });
    }

    const checkoutUrl = responseData.data?.link || responseData.data?.code || responseData.link;

    return res.status(200).json({ checkoutUrl });

  } catch (error) {
    console.error("Vercel API Error:", error);
    return res.status(400).json({ error: error.message });
  }
}