export type Profile = {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  avatar_url?: string;
  account_status?: string;
  created_at?: string;
  updated_at?: string;
};

export type Notification = {
  id: string;
  user_id?: string;
  title?: string;
  message?: string;
  notification_type?: string;
  status?: string;
  created_at?: string;
};

export type SecurityLog = {
  id: string;
  user_id?: string;
  action?: string;
  ip_address?: string;
  device?: string;
  created_at?: string;
};

export type Wallet = {
  id: string;
  user_id?: string;
  wallet_number: string;
  currency?: string;
  balance?: number;
  wallet_status?: string;
  created_at?: string;
};

export type Transfer = {
  id: string;
  sender_wallet?: string;
  receiver_wallet?: string;
  amount: number;
  reference: string;
  status?: string;
  created_at?: string;
};

export type WalletTransaction = {
  id: string;
  wallet_id?: string;
  transaction_reference: string;
  transaction_type?: string;
  amount: number;
  direction?: string;
  description?: string;
  status?: string;
  created_at?: string;
};