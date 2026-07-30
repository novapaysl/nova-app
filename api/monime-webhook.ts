import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export default async function handler(req, res) {
  // MoniMe sends webhooks as POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const payload = req.body;
    const secret = process.env.MONIME_WEBHOOK_SECRET;
    
    // Check for the signature in the headers
    const signatureHeader = req.headers['x-monime-signature'] || req.headers['monime-signature'];

    console.log("MoniMe Webhook Received:", JSON.stringify(payload, null, 2));

    // 🔒 SECURITY CHECK: Verify the HMAC S256 Signature
    if (secret && signatureHeader) {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(payload))
        .digest('hex');

      if (expectedSignature !== signatureHeader) {
        console.error("🚨 SECURITY ALERT: Invalid webhook signature detected.");
        return res.status(401).json({ error: 'Unauthorized: Invalid signature' });
      }
      console.log("✅ Webhook securely verified! Source is genuinely MoniMe.");
    } else if (!secret) {
      console.warn("⚠️ Missing MONIME_WEBHOOK_SECRET in environment variables.");
    }

    // Extract the payload details
    const eventType = payload.type || payload.event;
    const sessionData = payload.data || payload; 
    const status = sessionData.status;

    // Process the payment if it is completed
    if (eventType === 'checkout_session.completed' || status === 'completed') {
      
      // 1. Extract the amount and the User ID from the payload
      // MoniMe sometimes nests amount in an object, so we handle both cases safely
      const amount = sessionData.amount?.value || sessionData.amount;
      const userId = sessionData.metadata?.supabase_user_id || payload.metadata?.supabase_user_id;

      if (!userId || !amount) {
         console.error("Missing userId or amount in payload");
         return res.status(400).json({ error: 'Missing metadata.supabase_user_id or amount' });
      }

      // 2. Initialize Supabase Admin Client
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      // 3. Call the safe wallet increment function we created!
      const { error } = await supabase.rpc('increment_wallet_balance', {
        p_user_id: userId,
        p_amount: amount
      });

      if (error) {
        console.error("Database Update Error:", error);
        return res.status(500).json({ error: 'Failed to credit wallet' });
      }

      console.log(`✅ Successfully credited ${amount} to user ${userId}`);
      return res.status(200).json({ received: true, status: 'processed' });
    }

    // Acknowledge other events (like cancelled/failed)
    return res.status(200).json({ received: true, note: 'Event ignored' });

  } catch (error) {
    console.error("Webhook processing error:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}