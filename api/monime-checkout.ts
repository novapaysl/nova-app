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

   // 2. Call Monime API
    const monimeResponse = await fetch("https://api.monime.io/v1/checkout-sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Monime-Space-Id": spaceId,
        "Authorization": `Bearer ${accessToken}`,
        "Idempotency-Key": orderId
      },
      // 👇 THIS IS THE UPDATED PAYLOAD
      body: JSON.stringify({
        name: "Wallet Deposit",
        reference: orderId,
        lineItems: [
          {
            type: "custom",
            name: "Fund SLE Wallet",
            price: {
              currency: "SLE",
              value: Math.round(amount * 100) // Monime expects cents
            },
            quantity: 1
          }
        ]
      }),
    });

    const data = await monimeResponse.json();

    // 🚨 LOG THE EXACT REASON FOR THE 400 ERROR
    console.log("RAW MONIME REJECTION:", data);

    if (!monimeResponse.ok) {
      // 🚨 SEND THE EXACT REASON TO THE FRONTEND ALERT BOX
      return res.status(monimeResponse.status).json({ 
        error: `Monime Error: ${JSON.stringify(data)}` 
      });
    }

    return res.status(200).json({ 
      checkoutUrl: data.redirectUrl || null,
      message: "Mobile Money prompt initiated!"
    });

  } catch (error) {
    console.error("Monime API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}