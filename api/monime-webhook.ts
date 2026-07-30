import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const payload = req.body;
    console.log("Webhook hit. Payload:", JSON.stringify(payload, null, 2));

    const eventType = payload.type || payload.event;
    const sessionData = payload.data || payload; 
    const status = sessionData.status;
    
    // MoniMe sends the orderId back as "reference"
    const orderId = sessionData.reference; 

    if (!orderId) {
        console.error("No reference/orderId found in webhook payload.");
        return res.status(400).json({ error: 'Missing orderId' });
    }

    if (eventType === 'checkout_session.completed' || status === 'completed') {
      
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      // 1. Find the pending transaction securely from OUR database
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .select('user_id, amount, status')
        .eq('order_id', orderId)
        .single();

      if (txError || !transaction) {
        console.error("Transaction not found in DB:", txError);
        return res.status(404).json({ error: 'Transaction not found' });
      }

      // Prevent double-crediting if the webhook fires twice
      if (transaction.status === 'completed') {
         console.log("Transaction already processed.");
         return res.status(200).json({ message: 'Already processed' });
      }

      const userId = transaction.user_id;
      const depositAmount = parseFloat(transaction.amount);

      // 2. Get the user's current balance
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('sle_balance')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error("Profile not found:", profileError);
        return res.status(500).json({ error: 'Profile not found' });
      }

      const newBalance = parseFloat(profile.sle_balance || 0) + depositAmount;

      // 3. Update Profile Balance
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({ sle_balance: newBalance })
        .eq('id', userId);

      if (updateProfileError) throw updateProfileError;

      // 4. Mark Transaction as Completed!
      const { error: updateTxError } = await supabase
        .from('transactions')
        .update({ status: 'completed' })
        .eq('order_id', orderId);

      if (updateTxError) throw updateTxError;

      console.log(`✅ SUCCESS! Added ${depositAmount} SLE to user ${userId}`);
      return res.status(200).json({ received: true, status: 'processed' });
    }

    return res.status(200).json({ received: true, note: 'Ignored non-completed event' });

  } catch (error) {
    console.error("Webhook processing error:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}