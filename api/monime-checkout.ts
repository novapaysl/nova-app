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
    // 🔥 FIX 1: Extract userId from the request body sent by the frontend
    const { amount, phoneNumber, paymentType, orderId, userId } = req.body;
    
    // 🔥 SECURITY: Prevent checkout if the frontend forgets to send the userId
    if (!userId) {
      return res.status(400).json({ error: "Missing userId in checkout request." });
    }
    
    const spaceId = process.env.MONIME_SPACE_ID;
    const accessToken = process.env.MONIME_ACCESS_TOKEN;

    if (!spaceId || !accessToken) {
      return res.status(500).json({ error: "Server missing Monime credentials." });
    }

    // Capture the current domain to tell Monime where to redirect back
    const appDomain = req.headers.host ? `https://${req.headers.host}` : "https://nova-app-kappa.vercel.app";

    // 2. Call Monime API
    const monimeResponse = await fetch("https://api.monime.io/v1/checkout-sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Monime-Space-Id": spaceId,
        "Authorization": `Bearer ${accessToken}`,
        "Idempotency-Key": orderId || `NP-LOAD-${Date.now()}`
      },
      body: JSON.stringify({
        name: "Wallet Deposit",
        reference: orderId,
        successUrl: `${appDomain}/dashboard/wallet`, 
        cancelUrl: `${appDomain}/dashboard/wallet`,  
        lineItems: [
          {
            type: "custom",
            name: "Fund SLE Wallet",
            price: {
              currency: "SLE",
              value: Math.round(amount * 100) 
            },
            quantity: 1
          }
        ],
        // 🔥 FIX 2: Attach the metadata so Monime sends it back to the webhook!
        metadata: {
          supabase_user_id: userId
        }
      }),
    });

    const data = await monimeResponse.json();

    if (!monimeResponse.ok) {
      return res.status(monimeResponse.status).json({ 
        error: `Monime Error: ${JSON.stringify(data)}` 
      });
    }

    // 3. Extract the redirect URL correctly
    return res.status(200).json({ 
      checkoutUrl: data?.result?.redirectUrl || data?.redirectUrl || null,
      message: "Mobile Money prompt initiated!"
    });

  } catch (error) {
    console.error("Monime API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}