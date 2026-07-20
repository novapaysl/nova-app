export default async function handler(req, res) {
  // 1. Only allow POST requests for security
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { amount, provider, phoneNumber } = req.body;

  try {
    // 2. Make the request to Monime securely from the Vercel server
    // Notice we use process.env here because this is a Node.js backend environment!
    const response = await fetch("https://api.monime.io/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.VITE_MONIME_ACCESS_TOKEN}`, 
        "Monime-Space-Id": process.env.VITE_MONIME_SPACE_ID 
      },
      body: JSON.stringify({
        amount: {
          currency: "SLE",
          value: amount // We will convert this to cents on the frontend before sending
        },
        channel: {
          type: "momo",
          provider: provider,
          phoneNumber: phoneNumber
        },
        reference: `DEP-${Date.now()}` // Unique transaction ID
      })
    });

    const paymentData = await response.json();

    // 3. Catch Monime errors and send them back to the frontend
    if (!response.ok) {
      throw new Error(paymentData.messages?.[0] || "Payment request failed from Monime");
    }

    // 4. Send the successful response back to your React app
    return res.status(200).json({ success: true, data: paymentData });
    
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}