import { createClient } from "@supabase/supabase-js";

// 🔐 Central Failsafe Initialization
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://failsafe-placeholder.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "failsafe-placeholder-key";

if (supabaseUrl === "https://failsafe-placeholder.supabase.co") {
    console.error("🚨 CRITICAL: Vite could not read VITE_SUPABASE_URL from your .env file!");
}

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);