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
    const { amount, phoneNumber, paymentType, orderId } = req.body;
    
    const spaceId = process.env.MONIME_SPACE_ID;
    const accessToken = process.env.MONIME_ACCESS_TOKEN;

    if (!spaceId || !accessToken) {
      return res.status(500).json({ error: "Server missing Monime credentials." });
    }

    // 2. Call Monime API (Create Checkout Session or Direct Charge)
    const monimeResponse = await fetch("https://api.monime.io/v1/checkout-sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Monime-Space-Id": spaceId,
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        amount: {
          currency: "SLE",
          value: Math.round(amount * 100) // Monime often expects minor units (cents)
        },
        reference: orderId,
        name: "Wallet Deposit",
        // Pass the channel to auto-select Mobile Money
        payment_methods: ["momo"] 
      }),
    });

    const data = await monimeResponse.json();

    if (!monimeResponse.ok) {
      return res.status(monimeResponse.status).json({ 
        error: data.message || "Monime Gateway Rejected the request" 
      });
    }

    // Return the hosted checkout URL or USSD push confirmation
    return res.status(200).json({ 
      checkoutUrl: data.redirectUrl || null,
      message: "Mobile Money prompt initiated!"
    });

  } catch (error) {
    console.error("Monime API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}