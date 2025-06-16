
-- Create hedge_simulations table - Consolidated structure for all hedge simulation data
CREATE TABLE public.hedge_simulations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  simulation_name TEXT DEFAULT NULL,
  
  -- ========================================
  -- INPUT PARAMETERS
  -- ========================================
  
  -- Basic PropFirm Parameters
  account_size DECIMAL(12,2) NOT NULL DEFAULT 100000.00,
  test_cost DECIMAL(12,2) NOT NULL DEFAULT 600.00,
  target_pct_f1 DECIMAL(5,2) NOT NULL DEFAULT 8.00,
  target_pct_f2 DECIMAL(5,2) NOT NULL DEFAULT 5.00,
  max_dd_pct DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  profit_division_pct DECIMAL(5,2) NOT NULL DEFAULT 80.00,
  
  -- Extra Hedge Amounts per Phase
  extra_hedge_amount_f1 DECIMAL(12,2) DEFAULT 120.00,
  extra_hedge_amount_f2 DECIMAL(12,2) DEFAULT 140.00,
  extra_hedge_amount_funded DECIMAL(12,2) DEFAULT 800.00,
  
  -- Safety Multipliers
  safety_multiplier_f1 DECIMAL(5,3) DEFAULT 1.300,
  safety_multiplier_f2 DECIMAL(5,3) DEFAULT 1.200,
  safety_multiplier_funded DECIMAL(5,3) DEFAULT 1.150,
  
  -- Funded Account Parameters
  funded_target_amount DECIMAL(12,2) DEFAULT 3400.00,
  test_refund BOOLEAN DEFAULT true,
  
  -- ========================================
  -- CALCULATED RESULTS - PHASE 1
  -- ========================================
  
  recovery_amount_f1 DECIMAL(12,2) DEFAULT NULL,
  ratio_f1 DECIMAL(8,4) DEFAULT NULL,
  phase_cost_f1 DECIMAL(12,2) DEFAULT NULL,
  min_real_deposit_f1 DECIMAL(12,2) DEFAULT NULL,
  final_balance_real_account_f1_fail DECIMAL(12,2) DEFAULT NULL,
  remaining_balance_f1 DECIMAL(12,2) DEFAULT NULL,
  
  -- ========================================
  -- CALCULATED RESULTS - PHASE 2
  -- ========================================
  
  recovery_amount_f2 DECIMAL(12,2) DEFAULT NULL,
  ratio_f2 DECIMAL(8,4) DEFAULT NULL,
  phase_cost_f2 DECIMAL(12,2) DEFAULT NULL,
  min_real_deposit_f2 DECIMAL(12,2) DEFAULT NULL,
  additional_deposit_f2 DECIMAL(12,2) DEFAULT NULL,
  final_balance_real_account_f2_fail DECIMAL(12,2) DEFAULT NULL,
  remaining_balance_f2 DECIMAL(12,2) DEFAULT NULL,
  
  -- ========================================
  -- CALCULATED RESULTS - FUNDED PHASE
  -- ========================================
  
  recovery_amount_funded DECIMAL(12,2) DEFAULT NULL,
  ratio_funded DECIMAL(8,4) DEFAULT NULL,
  phase_cost_funded DECIMAL(12,2) DEFAULT NULL,
  min_real_deposit_funded DECIMAL(12,2) DEFAULT NULL,
  trader_profit_share DECIMAL(12,2) DEFAULT NULL,
  test_refund_amount DECIMAL(12,2) DEFAULT NULL,
  
  -- ========================================
  -- TOTALS AND AGGREGATIONS
  -- ========================================
  
  total_test_cost DECIMAL(12,2) DEFAULT NULL,
  total_used DECIMAL(12,2) DEFAULT NULL,
  total_withdraw DECIMAL(12,2) DEFAULT NULL,
  total_profit DECIMAL(12,2) DEFAULT NULL,
  roi_percentage DECIMAL(5,2) DEFAULT NULL,
  propfirm_breakeven DECIMAL(5,2) DEFAULT NULL,
  
  -- ========================================
  -- PROFIT PROJECTIONS (if fail in each phase)
  -- ========================================
  
  profit_projection_f1 DECIMAL(5,2) DEFAULT NULL,
  profit_projection_f2 DECIMAL(5,2) DEFAULT NULL,
  profit_projection_funded DECIMAL(5,2) DEFAULT NULL,
  
  -- ========================================
  -- OPERATIONAL DATA AND NOTES
  -- ========================================
  
  notes TEXT DEFAULT NULL,
  implementation_status TEXT DEFAULT 'simulated' CHECK (implementation_status IN ('simulated', 'in_progress', 'completed', 'failed')),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Enable Row Level Security
ALTER TABLE public.hedge_simulations ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX idx_hedge_simulations_created_at ON public.hedge_simulations(created_at);
CREATE INDEX idx_hedge_simulations_simulation_name ON public.hedge_simulations(simulation_name);
CREATE INDEX idx_hedge_simulations_implementation_status ON public.hedge_simulations(implementation_status);
CREATE INDEX idx_hedge_simulations_account_size ON public.hedge_simulations(account_size);
CREATE INDEX idx_hedge_simulations_test_cost ON public.hedge_simulations(test_cost);

-- Create RLS policies (for now, making it publicly accessible for testing)
CREATE POLICY "Allow all operations on hedge_simulations" 
  ON public.hedge_simulations 
  FOR ALL 
  USING (true);
