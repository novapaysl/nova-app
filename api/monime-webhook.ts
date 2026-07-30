import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const payload = req.body;
    console.log("Webhook hit:", JSON.stringify(payload, null, 2));

    const eventType = payload.type || payload.event;
    const sessionData = payload.data || payload; 
    const status = sessionData.status;

    // Only process successful payments
    if (eventType === 'checkout_session.completed' || status === 'completed') {
      
      const amount = sessionData.amount?.value || sessionData.amount;
      const userId = sessionData.metadata?.supabase_user_id || payload.metadata?.supabase_user_id;
      const orderId = sessionData.reference;

      if (!userId || !amount) {
         console.error("Missing userId or amount");
         return res.status(400).json({ error: 'Missing metadata.supabase_user_id or amount' });
      }

      // Initialize Supabase Admin (Bypasses RLS)
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      // 1. Get the user's current balance from the profiles table
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('sle_balance')
        .eq('id', userId)
        .single();

      if (fetchError) {
        console.error("Error fetching profile:", fetchError);
        return res.status(500).json({ error: 'Profile not found' });
      }

      // 2. Add the new money to their current balance
      const currentBalance = parseFloat(profile.sle_balance || 0);
      const depositAmount = parseFloat(amount);
      const newBalance = currentBalance + depositAmount;

      // 3. Save the new balance back to the profiles table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ sle_balance: newBalance })
        .eq('id', userId);

      if (updateError) {
        console.error("Error updating balance:", updateError);
        return res.status(500).json({ error: 'Failed to credit wallet' });
      }

      // 4. Update the transaction status to completed
      if (orderId) {
        await supabase
          .from('transactions')
          .update({ status: 'completed' })
          .eq('order_id', orderId);
      }

      console.log(`✅ Success! Added ${depositAmount} SLE to user ${userId}`);
      return res.status(200).json({ received: true, status: 'processed' });
    }

    return res.status(200).json({ received: true, note: 'Ignored non-completed event' });

  } catch (error) {
    console.error("Webhook processing error:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}