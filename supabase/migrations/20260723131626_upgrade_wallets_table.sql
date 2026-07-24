-- ===========================================
-- Upgrade Wallets Table for NovaPay
-- ===========================================

-- Remove the SLE-only restriction
ALTER TABLE public.wallets
DROP CONSTRAINT IF EXISTS wallets_currency_check;

-- Allow multiple currencies
ALTER TABLE public.wallets
ADD CONSTRAINT wallets_currency_check
CHECK (
    currency IN (
        'SLE',
        'USD',
        'EUR',
        'GBP'
    )
);

-- New wallet metadata
ALTER TABLE public.wallets
ADD COLUMN IF NOT EXISTS wallet_type TEXT DEFAULT 'personal',
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Wallet type constraint
ALTER TABLE public.wallets
ADD CONSTRAINT wallets_wallet_type_check
CHECK (
    wallet_type IN (
        'personal',
        'merchant',
        'business'
    )
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_wallets_user
ON public.wallets(user_id);

CREATE INDEX IF NOT EXISTS idx_wallets_currency
ON public.wallets(currency);

CREATE INDEX IF NOT EXISTS idx_wallets_status
ON public.wallets(wallet_status);