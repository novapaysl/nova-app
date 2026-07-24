import { supabaseClient } from "./supabase-client";

export interface Wallet {
  id: string;
  user_id: string;
  wallet_number: string;
  currency: string;
  balance: number;
  available_balance: number;
  locked_balance: number;
  wallet_status: string;
}

export async function getUserWallets(userId: string): Promise<Wallet[]> {
  const { data, error } = await supabaseClient
    .from("wallets")
    .select("*")
    .eq("user_id", userId)
    .order("currency");

  if (error) {
    throw error;
  }

  return (data ?? []) as Wallet[];
}

export async function getWalletByCurrency(
  userId: string,
  currency: string
): Promise<Wallet | null> {
  const { data, error } = await supabaseClient
    .from("wallets")
    .select("*")
    .eq("user_id", userId)
    .eq("currency", currency)
    .single();

  if (error) {
    return null;
  }

  return data as Wallet;
}