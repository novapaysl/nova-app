import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  // 1. Verify Basic Authentication (Required by Vult)
  const authHeader = req.headers.get('authorization') || '';
  // We will set VULT_WEBHOOK_USERNAME and VULT_WEBHOOK_PASSWORD in Supabase later
  const expectedAuth = `Basic ${btoa(`${Deno.env.get('VULT_WEBHOOK_USERNAME')}:${Deno.env.get('VULT_WEBHOOK_PASSWORD')}`)}`;

  if (authHeader !== expectedAuth) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { 
      status: 401, headers: { "Content-Type": "application/json" } 
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? "",
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ""
    );

    // 2. Parse Vult's Webhook Payload
    const { orderId, vultRequestId, status } = await req.json();

    console.log(`Received Vult webhook for Order: ${orderId}, Status: ${status}`);

    if (status === "completed") {
      // NOTE: Here you will call your database RPC to actually credit the user's wallet.
      // Example: await supabase.rpc('credit_wallet', { p_order_id: orderId });
      
      // Acknowledge receipt to Vult
      return new Response(JSON.stringify({ received: true, status: "processed" }), { 
        status: 200, headers: { "Content-Type": "application/json" } 
      });
    } else if (status === "failed") {
      // Leave order as pending or mark as failed in your DB
      return new Response(JSON.stringify({ received: true, status: "ignored_failure" }), { 
        status: 200, headers: { "Content-Type": "application/json" } 
      });
    } else {
      throw new Error(`Unknown status: ${status}`);
    }

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 400, headers: { "Content-Type": "application/json" } 
    });
  }
})