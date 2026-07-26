import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Vult webhook must be a POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 1. Verify Basic Authentication
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).json({ error: 'Missing or Invalid Authorization header' });
  }

  // Decode the base64 credentials from the header
  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');

  // Check against your Vercel Environment Variables
  if (username !== process.env.VULT_WEBHOOK_USER || password !== process.env.VULT_WEBHOOK_PASS) {
    return res.status(401).json({ error: 'Unauthorized credentials' });
  }

  try {
    // 2. Parse the Vult Payload
    const { orderId, vultRequestId, status } = req.body;

    if (!orderId || !status) {
      return res.status(400).json({ error: 'Missing required payload fields' });
    }

    // If the payment failed, Vult says to leave it pending for retries. 
    // We just return 200 so Vult knows we received the message.
    if (status === 'failed') {
      return res.status(200).json({ received: true, note: 'Ignored failed status' });
    }

    // 3. Process Completed Payment
    if (status === 'completed') {
      // Connect to Supabase using the Service Role Key (bypasses RLS for backend operations)
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      // Call our secure SQL function to update the transaction and credit the wallet
      const { error } = await supabase.rpc('process_vult_webhook', {
        p_order_id: orderId,
        p_vult_request_id: vultRequestId || 'N/A'
      });

      if (error) {
        console.error("Database Update Error:", error);
        return res.status(500).json({ error: 'Failed to process database update' });
      }

      // Vult expects a fast success response
      return res.status(200).json({ received: true, status: 'processed' });
    }

    // Fallback for any unknown statuses
    return res.status(200).json({ received: true });

  } catch (error) {
    console.error("Webhook processing error:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}