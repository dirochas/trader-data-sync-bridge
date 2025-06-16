
import { HedgeSimulation } from '@/hooks/useHedgeSimulations';

export interface HedgeCalculationParams {
  account_size: number;
  test_cost: number;
  target_pct_f1: number;
  target_pct_f2: number;
  max_dd_pct: number;
  profit_division_pct: number;
  extra_hedge_amount_f1: number;
  extra_hedge_amount_f2: number;
  extra_hedge_amount_funded: number;
  safety_multiplier_f1: number;
  safety_multiplier_f2: number;
  safety_multiplier_funded: number;
  funded_target_amount: number;
  test_refund: boolean;
}

export interface HedgeCalculationResults {
  // Phase 1 Results
  recovery_amount_f1: number;
  ratio_f1: number;
  phase_cost_f1: number;
  min_real_deposit_f1: number;
  final_balance_real_account_f1_fail: number;
  remaining_balance_f1: number;
  
  // Phase 2 Results
  recovery_amount_f2: number;
  ratio_f2: number;
  phase_cost_f2: number;
  min_real_deposit_f2: number;
  additional_deposit_f2: number;
  final_balance_real_account_f2_fail: number;
  remaining_balance_f2: number;
  
  // Funded Phase Results
  recovery_amount_funded: number;
  ratio_funded: number;
  phase_cost_funded: number;
  min_real_deposit_funded: number;
  trader_profit_share: number;
  test_refund_amount: number;
  
  // Totals
  total_test_cost: number;
  total_used: number;
  total_withdraw: number;
  total_profit: number;
  roi_percentage: number;
  propfirm_breakeven: number;
  
  // Profit Projections
  profit_projection_f1: number;
  profit_projection_f2: number;
  profit_projection_funded: number;
}

export class HedgeCalculationService {
  static calculateAll(params: HedgeCalculationParams): HedgeCalculationResults {
    console.log('🧮 Starting hedge calculations with params:', params);
    
    // ========================================
    // PHASE 1 CALCULATIONS
    // ========================================
    
    // 1. Total Recovery Amount for Phase 1
    const recovery_amount_f1 = params.test_cost + params.extra_hedge_amount_f1;
    console.log('F1 Recovery Amount:', recovery_amount_f1);
    
    // 2. Lot Ratio Calculation for Phase 1
    const ratio_f1 = recovery_amount_f1 / (params.max_dd_pct * params.account_size / 100);
    console.log('F1 Ratio:', ratio_f1);
    
    // 3. Real Cost Calculation for Phase 1
    const phase_cost_f1 = ratio_f1 * (params.target_pct_f1 * params.account_size / 100);
    console.log('F1 Phase Cost:', phase_cost_f1);
    
    // 4. Minimum Deposit Calculation for Phase 1
    const min_real_deposit_f1 = phase_cost_f1 * params.safety_multiplier_f1;
    console.log('F1 Min Deposit:', min_real_deposit_f1);
    
    // 5. Phase 1 Test Failure Scenario
    const max_loss_propfirm = params.account_size * (params.max_dd_pct / 100);
    const real_account_gain_f1_fail = max_loss_propfirm * ratio_f1;
    const final_balance_real_account_f1_fail = min_real_deposit_f1 + real_account_gain_f1_fail;
    
    // 6. Phase 1 Test Approval Scenario
    const propfirm_gain_f1 = params.account_size * (params.target_pct_f1 / 100);
    const real_account_loss_f1_pass = -(propfirm_gain_f1 * ratio_f1);
    const remaining_balance_f1 = min_real_deposit_f1 + real_account_loss_f1_pass;
    
    // ========================================
    // PHASE 2 CALCULATIONS
    // ========================================
    
    // 1. Total Recovery Amount for Phase 2
    const recovery_amount_f2 = phase_cost_f1 + params.extra_hedge_amount_f2 + params.test_cost;
    console.log('F2 Recovery Amount:', recovery_amount_f2);
    
    // 2. Lot Ratio Calculation for Phase 2
    const ratio_f2 = recovery_amount_f2 / (params.max_dd_pct * params.account_size / 100);
    console.log('F2 Ratio:', ratio_f2);
    
    // 3. Real Cost Calculation for Phase 2
    const phase_cost_f2 = (params.target_pct_f2 / params.max_dd_pct) * recovery_amount_f2;
    console.log('F2 Phase Cost:', phase_cost_f2);
    
    // 4. Minimum Deposit Calculation for Phase 2
    const min_real_deposit_f2 = phase_cost_f2 * params.safety_multiplier_f2;
    console.log('F2 Min Deposit:', min_real_deposit_f2);
    
    // 5. Additional Deposit Calculation for Phase 2
    const additional_deposit_f2 = min_real_deposit_f2 - remaining_balance_f1;
    console.log('F2 Additional Deposit:', additional_deposit_f2);
    
    // 6. Phase 2 Test Failure Scenario
    const real_account_gain_f2_fail = max_loss_propfirm * ratio_f2;
    const final_balance_real_account_f2_fail = min_real_deposit_f2 + real_account_gain_f2_fail;
    
    // 7. Phase 2 Test Approval Scenario
    const propfirm_gain_f2 = params.account_size * (params.target_pct_f2 / 100);
    const real_account_loss_f2_pass = -(propfirm_gain_f2 * ratio_f2);
    const remaining_balance_f2 = min_real_deposit_f2 + real_account_loss_f2_pass;
    
    // ========================================
    // FUNDED PHASE CALCULATIONS
    // ========================================
    
    // 1. Total Recovery Amount for Funded Phase
    const total_test_cost = phase_cost_f1 + phase_cost_f2 + params.test_cost;
    const recovery_amount_funded = total_test_cost + params.extra_hedge_amount_funded;
    console.log('Funded Recovery Amount:', recovery_amount_funded);
    
    // 2. Lot Ratio Calculation for Funded Phase
    const ratio_funded = recovery_amount_funded / (params.max_dd_pct * params.account_size / 100);
    console.log('Funded Ratio:', ratio_funded);
    
    // 3. Real Cost Calculation for Funded Phase
    const phase_cost_funded = (params.funded_target_amount / params.account_size) * recovery_amount_funded;
    console.log('Funded Phase Cost:', phase_cost_funded);
    
    // 4. Minimum Deposit Calculation for Funded Phase
    const min_real_deposit_funded = phase_cost_funded * params.safety_multiplier_funded;
    console.log('Funded Min Deposit:', min_real_deposit_funded);
    
    // 5. Expected Withdrawal Calculation
    const propfirm_profit = params.funded_target_amount;
    const trader_profit_share = propfirm_profit * (params.profit_division_pct / 100);
    const test_refund_amount = params.test_refund ? params.test_cost : 0;
    const total_withdraw = trader_profit_share + test_refund_amount;
    
    // 6. Total Spent Calculation
    const total_used = total_test_cost + phase_cost_funded;
    
    // 7. Profit on Withdrawal Calculation
    const total_profit = total_withdraw - total_used;
    
    // 8. Return on Investment Calculation
    const roi_percentage = (total_profit / total_used) * 100;
    
    // ========================================
    // PROFIT PROJECTIONS AND BREAKEVEN
    // ========================================
    
    // 1. Profit Projection if Failed in Phase 1
    const profit_projection_f1 = ((recovery_amount_f1 - params.test_cost) / min_real_deposit_f1) * 100;
    
    // 2. Profit Projection if Failed in Phase 2
    const profit_projection_f2 = ((recovery_amount_f2 - (phase_cost_f1 + params.test_cost)) / (min_real_deposit_f1 + additional_deposit_f2)) * 100;
    
    // 3. Profit Projection if Failed in Funded Phase
    const profit_projection_funded = ((recovery_amount_funded - total_test_cost) / min_real_deposit_funded) * 100;
    
    // 4. PropFirm Breakeven Calculation
    const propfirm_breakeven = (total_used / (params.account_size * (params.profit_division_pct / 100))) * 100;
    
    const results = {
      // Phase 1 Results
      recovery_amount_f1,
      ratio_f1,
      phase_cost_f1,
      min_real_deposit_f1,
      final_balance_real_account_f1_fail,
      remaining_balance_f1,
      
      // Phase 2 Results
      recovery_amount_f2,
      ratio_f2,
      phase_cost_f2,
      min_real_deposit_f2,
      additional_deposit_f2,
      final_balance_real_account_f2_fail,
      remaining_balance_f2,
      
      // Funded Phase Results
      recovery_amount_funded,
      ratio_funded,
      phase_cost_funded,
      min_real_deposit_funded,
      trader_profit_share,
      test_refund_amount,
      
      // Totals
      total_test_cost,
      total_used,
      total_withdraw,
      total_profit,
      roi_percentage,
      propfirm_breakeven,
      
      // Profit Projections
      profit_projection_f1,
      profit_projection_f2,
      profit_projection_funded,
    };
    
    console.log('✅ Calculation results:', results);
    return results;
  }
  
  // Função para gerar tabela de lot ratios
  static generateLotRatioTable(ratio: number, phase: string) {
    const sampleLots = phase === 'Phase 1' ? [5.00, 4.00, 3.00, 2.00, 1.00] : 
                      phase === 'Phase 2' ? [0.50, 0.30, 0.15, 0.10, 0.05] :
                      [2.10, 1.00, 0.80, 0.50, 0.40];
    
    return sampleLots.map(propfirmLot => ({
      propfirmLot,
      realAccountLot: parseFloat((propfirmLot * ratio).toFixed(5))
    }));
  }
}
