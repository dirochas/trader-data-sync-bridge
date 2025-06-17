
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calculator, Save, Trash2, TrendingUp, DollarSign } from 'lucide-react';
import { useCreateHedgeSimulation, useUpdateHedgeSimulation } from '@/hooks/useHedgeSimulations';
import { HedgeCalculationService, HedgeCalculationParams } from '@/services/hedgeCalculations';
import { toast } from 'sonner';

interface HedgeSimulatorProps {
  existingSimulation?: any;
  onSave?: (simulation: any) => void;
}

export function HedgeSimulator({ existingSimulation, onSave }: HedgeSimulatorProps) {
  const [simulationName, setSimulationName] = useState(existingSimulation?.simulation_name || '');
  const [notes, setNotes] = useState(existingSimulation?.notes || '');
  
  // Input Parameters State
  const [params, setParams] = useState<HedgeCalculationParams>({
    account_size: existingSimulation?.account_size || 100000,
    test_cost: existingSimulation?.test_cost || 600,
    target_pct_f1: existingSimulation?.target_pct_f1 || 8,
    target_pct_f2: existingSimulation?.target_pct_f2 || 5,
    max_dd_pct: existingSimulation?.max_dd_pct || 10,
    profit_division_pct: existingSimulation?.profit_division_pct || 80,
    extra_hedge_amount_f1: existingSimulation?.extra_hedge_amount_f1 || 120,
    extra_hedge_amount_f2: existingSimulation?.extra_hedge_amount_f2 || 140,
    extra_hedge_amount_funded: existingSimulation?.extra_hedge_amount_funded || 800,
    safety_multiplier_f1: existingSimulation?.safety_multiplier_f1 || 1.3,
    safety_multiplier_f2: existingSimulation?.safety_multiplier_f2 || 1.2,
    safety_multiplier_funded: existingSimulation?.safety_multiplier_funded || 1.15,
    funded_target_amount: existingSimulation?.funded_target_amount || 3400,
    test_refund: existingSimulation?.test_refund ?? true,
  });
  
  const [results, setResults] = useState<any>(null);
  
  const createMutation = useCreateHedgeSimulation();
  const updateMutation = useUpdateHedgeSimulation();
  
  // Calculate results in real-time
  useEffect(() => {
    try {
      const calculatedResults = HedgeCalculationService.calculateAll(params);
      setResults(calculatedResults);
    } catch (error) {
      console.error('Error calculating results:', error);
    }
  }, [params]);
  
  const handleParamChange = (key: keyof HedgeCalculationParams, value: number | boolean) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };
  
  const handleSave = async () => {
    if (!results) {
      toast.error('Calculate results first');
      return;
    }
    
    const simulationData = {
      simulation_name: simulationName || `Simulation ${new Date().toLocaleDateString()}`,
      notes,
      ...params,
      ...results,
    };
    
    try {
      if (existingSimulation) {
        await updateMutation.mutateAsync({ id: existingSimulation.id, ...simulationData });
        toast.success('Simulation updated successfully!');
      } else {
        const newSimulation = await createMutation.mutateAsync(simulationData);
        toast.success('Simulation saved successfully!');
        onSave?.(newSimulation);
      }
    } catch (error) {
      console.error('Error saving simulation:', error);
      toast.error('Error saving simulation');
    }
  };
  
  const formatCurrency = (value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatPercentage = (value: number) => `${value.toFixed(2)}%`;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="tech-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Hedge Simulator
            </CardTitle>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {existingSimulation ? 'Update' : 'Save'} Simulation
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="simulationName">Simulation Name</Label>
              <Input
                id="simulationName"
                value={simulationName}
                onChange={(e) => setSimulationName(e.target.value)}
                placeholder="Enter simulation name"
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="parameters" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="parameters">Parameters</TabsTrigger>
          <TabsTrigger value="phase1-2">Phase 1 & 2</TabsTrigger>
          <TabsTrigger value="funded">Funded Phase</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>
        
        {/* Parameters Tab */}
        <TabsContent value="parameters">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Basic PropFirm Parameters */}
            <Card className="tech-card">
              <CardHeader>
                <CardTitle className="text-lg">PropFirm Parameters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Account Size ($)</Label>
                  <Input
                    type="number"
                    value={params.account_size}
                    onChange={(e) => handleParamChange('account_size', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label>Test Cost ($)</Label>
                  <Input
                    type="number"
                    value={params.test_cost}
                    onChange={(e) => handleParamChange('test_cost', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label>Target Phase 1 (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={params.target_pct_f1}
                    onChange={(e) => handleParamChange('target_pct_f1', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label>Target Phase 2 (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={params.target_pct_f2}
                    onChange={(e) => handleParamChange('target_pct_f2', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label>Max Drawdown (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={params.max_dd_pct}
                    onChange={(e) => handleParamChange('max_dd_pct', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label>Profit Division (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={params.profit_division_pct}
                    onChange={(e) => handleParamChange('profit_division_pct', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Extra Hedge Amounts */}
            <Card className="tech-card">
              <CardHeader>
                <CardTitle className="text-lg">Extra Hedge Amounts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Phase 1 Extra ($)</Label>
                  <Input
                    type="number"
                    value={params.extra_hedge_amount_f1}
                    onChange={(e) => handleParamChange('extra_hedge_amount_f1', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label>Phase 2 Extra ($)</Label>
                  <Input
                    type="number"
                    value={params.extra_hedge_amount_f2}
                    onChange={(e) => handleParamChange('extra_hedge_amount_f2', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label>Funded Extra ($)</Label>
                  <Input
                    type="number"
                    value={params.extra_hedge_amount_funded}
                    onChange={(e) => handleParamChange('extra_hedge_amount_funded', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label>Funded Target ($)</Label>
                  <Input
                    type="number"
                    value={params.funded_target_amount}
                    onChange={(e) => handleParamChange('funded_target_amount', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={params.test_refund}
                    onCheckedChange={(checked) => handleParamChange('test_refund', checked)}
                  />
                  <Label>Test Refund</Label>
                </div>
              </CardContent>
            </Card>
            
            {/* Safety Multipliers */}
            <Card className="tech-card">
              <CardHeader>
                <CardTitle className="text-lg">Safety Multipliers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Phase 1 Multiplier</Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={params.safety_multiplier_f1}
                    onChange={(e) => handleParamChange('safety_multiplier_f1', parseFloat(e.target.value) || 1)}
                  />
                </div>
                <div>
                  <Label>Phase 2 Multiplier</Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={params.safety_multiplier_f2}
                    onChange={(e) => handleParamChange('safety_multiplier_f2', parseFloat(e.target.value) || 1)}
                  />
                </div>
                <div>
                  <Label>Funded Multiplier</Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={params.safety_multiplier_funded}
                    onChange={(e) => handleParamChange('safety_multiplier_funded', parseFloat(e.target.value) || 1)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Phase 1 & 2 Results */}
        <TabsContent value="phase1-2">
          {results && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Phase 1 Results */}
              <Card className="tech-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge variant="secondary">Phase 1</Badge>
                    Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Recovery Amount</Label>
                      <p className="font-semibold">{formatCurrency(results.recovery_amount_f1)}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Lot Ratio</Label>
                      <p className="font-semibold">{(results.ratio_f1 * 100).toFixed(2)}%</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Phase Cost</Label>
                      <p className="font-semibold">{formatCurrency(results.phase_cost_f1)}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Min Deposit</Label>
                      <p className="font-semibold text-blue-600">{formatCurrency(results.min_real_deposit_f1)}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">If Fail Balance</Label>
                      <p className="font-semibold text-green-600">{formatCurrency(results.final_balance_real_account_f1_fail)}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">If Pass Remaining</Label>
                      <p className="font-semibold">{formatCurrency(results.remaining_balance_f1)}</p>
                    </div>
                  </div>
                  <div className="pt-2">
                    <Label className="text-sm text-muted-foreground">Profit if Fail</Label>
                    <p className="font-bold text-green-600">{formatPercentage(results.profit_projection_f1)}</p>
                  </div>
                </CardContent>
              </Card>
              
              {/* Phase 2 Results */}
              <Card className="tech-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge variant="secondary">Phase 2</Badge>
                    Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Recovery Amount</Label>
                      <p className="font-semibold">{formatCurrency(results.recovery_amount_f2)}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Lot Ratio</Label>
                      <p className="font-semibold">{(results.ratio_f2 * 100).toFixed(2)}%</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Phase Cost</Label>
                      <p className="font-semibold">{formatCurrency(results.phase_cost_f2)}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Min Deposit</Label>
                      <p className="font-semibold text-blue-600">{formatCurrency(results.min_real_deposit_f2)}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Additional Deposit</Label>
                      <p className="font-semibold text-orange-600">{formatCurrency(results.additional_deposit_f2)}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">If Fail Balance</Label>
                      <p className="font-semibold text-green-600">{formatCurrency(results.final_balance_real_account_f2_fail)}</p>
                    </div>
                  </div>
                  <div className="pt-2">
                    <Label className="text-sm text-muted-foreground">Profit if Fail</Label>
                    <p className="font-bold text-green-600">{formatPercentage(results.profit_projection_f2)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
        
        {/* Funded Phase Results */}
        <TabsContent value="funded">
          {results && (
            <div className="space-y-6">
              <Card className="tech-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge variant="default">Funded Phase</Badge>
                    Payback & Breakeven
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Recovery Amount</Label>
                      <p className="font-semibold">{formatCurrency(results.recovery_amount_funded)}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Lot Ratio</Label>
                      <p className="font-semibold">{(results.ratio_funded * 100).toFixed(2)}%</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Phase Cost</Label>
                      <p className="font-semibold">{formatCurrency(results.phase_cost_funded)}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Min Deposit</Label>
                      <p className="font-semibold text-blue-600">{formatCurrency(results.min_real_deposit_funded)}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Trader Profit Share</Label>
                      <p className="font-semibold text-green-600">{formatCurrency(results.trader_profit_share)}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Test Refund</Label>
                      <p className="font-semibold">{formatCurrency(results.test_refund_amount)}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Total Withdraw</Label>
                      <p className="font-bold text-green-600 text-lg">{formatCurrency(results.total_withdraw)}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">PropFirm Breakeven</Label>
                      <p className="font-semibold">{formatPercentage(results.propfirm_breakeven)}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Profit if Fail</Label>
                      <p className="font-bold text-green-600">{formatPercentage(results.profit_projection_funded)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
        
        {/* Summary Tab */}
        <TabsContent value="summary">
          {results && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="tech-card card-blue">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Test Cost</p>
                        <p className="text-2xl font-bold">{formatCurrency(results.total_test_cost)}</p>
                      </div>
                      <DollarSign className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="tech-card card-purple">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Used</p>
                        <p className="text-2xl font-bold text-red-600">{formatCurrency(results.total_used)}</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="tech-card card-green">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Withdraw</p>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(results.total_withdraw)}</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="tech-card card-yellow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Net Profit</p>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(results.total_profit)}</p>
                        <p className="text-sm text-muted-foreground">ROI: {formatPercentage(results.roi_percentage)}</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Investment Flow */}
              <Card className="tech-card">
                <CardHeader>
                  <CardTitle>Investment Flow</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 investment-flow-card blue rounded-lg">
                      <span>Phase 1 Minimum Deposit</span>
                      <span className="font-semibold">{formatCurrency(results.min_real_deposit_f1)}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 investment-flow-card orange rounded-lg">
                      <span>Phase 2 Additional Deposit</span>
                      <span className="font-semibold">{formatCurrency(results.additional_deposit_f2)}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 investment-flow-card purple rounded-lg">
                      <span>Funded Phase Deposit</span>
                      <span className="font-semibold">{formatCurrency(results.min_real_deposit_funded)}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 investment-flow-card green rounded-lg border-2 border-green-200 dark:border-green-800/50">
                      <span className="font-semibold">Expected Withdrawal</span>
                      <span className="font-bold text-green-600 text-lg">{formatCurrency(results.total_withdraw)}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 investment-flow-card gray rounded-lg border-2 border-gray-200 dark:border-gray-800/50">
                      <span className="font-semibold">Net Profit</span>
                      <span className="font-bold text-green-600 text-lg">{formatCurrency(results.total_profit)} ({formatPercentage(results.roi_percentage)})</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
