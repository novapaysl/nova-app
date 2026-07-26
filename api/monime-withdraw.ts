import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const { userId, amount, phoneNumber, provider } = req.body;
    
    // 1. Connect to Supabase
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 2. Safely deduct funds FIRST using our new SQL function
    const { data: dbResult, error: dbError } = await supabase.rpc('request_withdrawal', {
      p_user_id: userId,
      p_amount: amount,
      p_provider: provider,
      p_phone: phoneNumber
    });

    if (dbError || !dbResult.success) {
      return res.status(400).json({ error: dbResult?.error || 'Insufficient funds or database error.' });
    }

    const transactionId = dbResult.transaction_id;

    // 3. Call Monime to send the money (Payout/Disbursement)
    const spaceId = process.env.MONIME_SPACE_ID;
    const accessToken = process.env.MONIME_ACCESS_TOKEN;

    const monimeResponse = await fetch("https://api.monime.io/v1/payouts", { 
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Monime-Space-Id": spaceId,
        "Authorization": `Bearer ${accessToken}`,
        "Idempotency-Key": transactionId // Prevents double-sending the cash!
      },
      body: JSON.stringify({
        amount: {
          currency: "SLE",
          value: Math.round(amount * 100) // Cents
        },
        recipient: {
          type: "mobile_money",
          phone: phoneNumber,
          network: provider.toUpperCase() // e.g., 'AFRIMONEY' or 'ORANGE'
        },
        reference: transactionId,
        description: "NovaPay Wallet Withdrawal"
      })
    });

    const monimeData = await monimeResponse.json();

    if (!monimeResponse.ok) {
       console.error("Monime Payout Error:", monimeData);
       // We pass the exact Monime error back to the frontend so we can debug it if needed
       return res.status(monimeResponse.status).json({ 
         error: `Monime Error: ${JSON.stringify(monimeData)}` 
       });
    }

    return res.status(200).json({ 
      success: true, 
      message: "Withdrawal initiated! Funds will arrive shortly." 
    });

  } catch (error) {
    console.error("Withdrawal Error:", error);
    return res.status(500).json({ error: error.message });
  }
}