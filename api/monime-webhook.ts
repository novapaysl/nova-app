import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Monime sends webhooks as POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const payload = req.body;
    
    // 🚨 Log the incoming webhook to Vercel so we can inspect it later
    console.log("Monime Webhook Received:", JSON.stringify(payload, null, 2));

    // Monime wraps the checkout session object inside their event payload
    const eventType = payload.type || payload.event;
    const sessionData = payload.data || payload; 
    
    // The "reference" is the orderId we passed to them (e.g. NP-LOAD-12345)
    const orderId = sessionData.reference;
    const status = sessionData.status;

    if (!orderId) {
      return res.status(400).json({ error: 'Missing reference/orderId in payload' });
    }

    // We only want to credit the wallet if the payment actually finished
    if (eventType === 'checkout_session.completed' || status === 'completed') {
      
      // Connect to Supabase using the Service Role Key (bypasses RLS)
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      // Call our secure SQL function to credit the user's wallet!
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

    // Acknowledge other random events (like 'payment.created') without processing
    return res.status(200).json({ received: true, note: 'Event ignored' });

  } catch (error) {
    console.error("Webhook processing error:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}