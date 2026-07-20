export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let { amount, provider, phoneNumber } = req.body;

  // 🇸🇱 Format phone number (Monime requires digits without '+')
  let cleanPhone = String(phoneNumber || '').replace(/\D/g, ''); 
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '232' + cleanPhone.substring(1);
  } else if (!cleanPhone.startsWith('232')) {
    cleanPhone = '232' + cleanPhone;
  }

  // Get keys from Vercel environment
  const token = process.env.MONIME_ACCESS_TOKEN || process.env.VITE_MONIME_ACCESS_TOKEN;
  const spaceId = process.env.MONIME_SPACE_ID || process.env.VITE_MONIME_SPACE_ID;

  if (!token || !spaceId) {
    return res.status(500).json({ 
      error: "Missing Monime Credentials. Please check MONIME_ACCESS_TOKEN and MONIME_SPACE_ID in Vercel settings." 
    });
  }

  try {
    const response = await fetch("https://api.monime.io/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`, 
        "Monime-Space-Id": spaceId 
      },
      body: JSON.stringify({
        amount: {
          currency: "SLE",
          value: Number(amount)
        },
        channel: {
          type: "momo",
          provider: provider,
          phoneNumber: cleanPhone
        },
        reference: `DEP-${Date.now()}`
      })
    });

    const paymentData = await response.json();

    if (!response.ok) {
      // Extract specific error message string from Monime response
      const errMsg = 
        paymentData.messages?.[0] || 
        paymentData.message || 
        (typeof paymentData.error === 'string' ? paymentData.error : JSON.stringify(paymentData.error || paymentData));

      return res.status(response.status).json({ error: errMsg });
    }

    return res.status(200).json({ success: true, data: paymentData });
    
  } catch (error) {
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}