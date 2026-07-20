export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let { amount, provider, phoneNumber } = req.body;

  // 🇸🇱 Clean & Format Phone Number to International Format (232...)
  let cleanPhone = phoneNumber.replace(/\D/g, ''); // strip spaces/dashes
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '232' + cleanPhone.substring(1);
  } else if (!cleanPhone.startsWith('232')) {
    cleanPhone = '232' + cleanPhone;
  }

  // Support both VITE_ and standard keys from process.env
  const token = process.env.MONIME_ACCESS_TOKEN || process.env.VITE_MONIME_ACCESS_TOKEN;
  const spaceId = process.env.MONIME_SPACE_ID || process.env.VITE_MONIME_SPACE_ID;

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
          value: amount
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
      console.error("Monime API Error Detail:", paymentData);
      throw new Error(
        paymentData.messages?.[0] || 
        paymentData.message || 
        paymentData.error || 
        "Payment request rejected by Monime"
      );
    }

    return res.status(200).json({ success: true, data: paymentData });
    
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}