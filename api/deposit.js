export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { amount } = req.body;

  // Get keys from environment variables
  const token = process.env.MONIME_ACCESS_TOKEN || process.env.VITE_MONIME_ACCESS_TOKEN;
  const spaceId = process.env.MONIME_SPACE_ID || process.env.VITE_MONIME_SPACE_ID;

  if (!token || !spaceId) {
    return res.status(500).json({ 
      error: "Missing Monime Credentials. Check MONIME_ACCESS_TOKEN and MONIME_SPACE_ID in Vercel settings." 
    });
  }

  try {
    // Generate a unique idempotency key for safety
    const idempotencyKey = `dep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // Create a Checkout Session with Monime
    const response = await fetch("https://api.monime.io/v1/checkout-sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`, 
        "Monime-Space-Id": spaceId,
        "Idempotency-Key": idempotencyKey
      },
      body: JSON.stringify({
        name: "Wallet Deposit",
        lineItems: [
          {
            name: "NovaPay SLE Deposit",
            price: {
              currency: "SLE",
              value: Number(amount) // value in SLE cents (minor units)
            },
            quantity: 1
          }
        ],
        successUrl: "https://nova-app-kappa.vercel.app/dashboard/wallet?status=success",
        cancelUrl: "https://nova-app-kappa.vercel.app/dashboard/wallet?status=cancelled"
      })
    });

    const paymentData = await response.json();

    if (!response.ok) {
      const errMsg = 
        paymentData.messages?.[0] || 
        paymentData.message || 
        (typeof paymentData.error === 'string' ? paymentData.error : JSON.stringify(paymentData.error || paymentData));

      return res.status(response.status).json({ error: errMsg });
    }

    // Return the checkout session data (contains redirectUrl)
    return res.status(200).json({ success: true, data: paymentData });
    
  } catch (error) {
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}