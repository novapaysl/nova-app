-- ===========================================
-- NovaPay Payment Engine Migration
-- ===========================================

-- Add new columns
ALTER TABLE public.deposits
ADD COLUMN IF NOT EXISTS wallet_id UUID REFERENCES public.wallets(id),
ADD COLUMN IF NOT EXISTS payment_provider TEXT,
ADD COLUMN IF NOT EXISTS internal_reference TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS provider_reference TEXT,
ADD COLUMN IF NOT EXISTS checkout_url TEXT,
ADD COLUMN IF NOT EXISTS failure_reason TEXT,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Expand deposit statuses
ALTER TABLE public.deposits
DROP CONSTRAINT IF EXISTS deposits_status_check;

ALTER TABLE public.deposits
ADD CONSTRAINT deposits_status_check
CHECK (
    status IN (
        'pending',
        'processing',
        'completed',
        'failed',
        'cancelled'
    )
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_deposits_wallet
ON public.deposits(wallet_id);

CREATE INDEX IF NOT EXISTS idx_deposits_user
ON public.deposits(user_id);

CREATE INDEX IF NOT EXISTS idx_deposits_status
ON public.deposits(status);

CREATE INDEX IF NOT EXISTS idx_deposits_internal_reference
ON public.deposits(internal_reference);

CREATE INDEX IF NOT EXISTS idx_deposits_provider_reference
ON public.deposits(provider_reference);