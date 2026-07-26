import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export default async function handler(req, res) {
  // Monime sends webhooks as POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const payload = req.body;
    const secret = process.env.MONIME_WEBHOOK_SECRET;
    
    // Check for the signature in the headers (Monime usually sends it here)
    const signatureHeader = req.headers['x-monime-signature'] || req.headers['monime-signature'];

    console.log("Monime Webhook Received:", JSON.stringify(payload, null, 2));

    // 🔒 SECURITY CHECK: Verify the HMAC S256 Signature
    if (secret && signatureHeader) {
      // Recreate the hash using our secret
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(payload))
        .digest('hex');

      // Compare our hash with Monime's hash
      if (expectedSignature !== signatureHeader) {
        console.error("🚨 SECURITY ALERT: Invalid webhook signature detected. Potential hacker attempt.");
        return res.status(401).json({ error: 'Unauthorized: Invalid signature' });
      }
      
      console.log("✅ Webhook securely verified! Source is genuinely Monime.");
    } else if (!secret) {
      console.warn("⚠️ Missing MONIME_WEBHOOK_SECRET in environment variables.");
    }

    // Extract the payload details
    const eventType = payload.type || payload.event;
    const sessionData = payload.data || payload; 
    
    const orderId = sessionData.reference;
    const status = sessionData.status;

    if (!orderId) {
      return res.status(400).json({ error: 'Missing reference/orderId in payload' });
    }

    // Process the payment if it is completed
    if (eventType === 'checkout_session.completed' || status === 'completed') {
      
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      const { error } = await supabase.rpc('process_vult_webhook', {
        p_order_id: orderId,
        p_vult_request_id: sessionData.id || 'monime-webhook'
      });

      if (error) {
        console.error("Database Update Error:", error);
        return res.status(500).json({ error: 'Failed to credit wallet' });
      }

      return res.status(200).json({ received: true, status: 'processed' });
    }

    // Acknowledge other events (like cancelled/failed)
    return res.status(200).json({ received: true, note: 'Event ignored' });

  } catch (error) {
    console.error("Webhook processing error:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}