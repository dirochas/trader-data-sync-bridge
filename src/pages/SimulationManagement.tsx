
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Calculator, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  TrendingUp, 
  DollarSign,
  Calendar,
  FileText
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useHedgeSimulations, useDeleteHedgeSimulation } from '@/hooks/useHedgeSimulations';
import { HedgeSimulator } from '@/components/HedgeSimulator';
import { toast } from 'sonner';

export default function SimulationManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSimulation, setSelectedSimulation] = useState<any>(null);
  const [isNewSimulationOpen, setIsNewSimulationOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  const { data: simulations, isLoading, error } = useHedgeSimulations();
  const deleteMutation = useDeleteHedgeSimulation();
  
  const filteredSimulations = simulations?.filter(sim => 
    sim.simulation_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sim.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];
  
  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Simulation deleted successfully');
    } catch (error) {
      console.error('Error deleting simulation:', error);
      toast.error('Error deleting simulation');
    }
  };
  
  const handleEdit = (simulation: any) => {
    setSelectedSimulation(simulation);
    setIsEditOpen(true);
  };
  
  const formatCurrency = (value?: number) => 
    value ? `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00';
  
  const formatPercentage = (value?: number) => 
    value ? `${value.toFixed(2)}%` : '0.00%';
  
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'simulated':
        return <Badge variant="secondary">Simulated</Badge>;
      case 'in_progress':
        return <Badge variant="default">In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="border-green-500 text-green-600">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Calculator className="w-8 h-8 animate-pulse mx-auto mb-2" />
          <p>Loading simulations...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-600">
          <p>Error loading simulations</p>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Simulation Management</h1>
          <p className="text-muted-foreground">Manage your hedge trading simulations</p>
        </div>
        
        <Dialog open={isNewSimulationOpen} onOpenChange={setIsNewSimulationOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Simulation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Hedge Simulation</DialogTitle>
            </DialogHeader>
            <HedgeSimulator 
              onSave={() => setIsNewSimulationOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Search */}
      <Card className="tech-card">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search simulations by name or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Statistics - Following Dashboard Pattern */}
      {simulations && simulations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="tech-card tech-card-hover border-sky-400/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Simulations</CardTitle>
              <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-sky-500/20 to-sky-600/20 flex items-center justify-center flex-shrink-0 border border-sky-500/20">
                <Calculator className="h-8 w-8 text-sky-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold number-display text-foreground">{simulations.length}</div>
              <p className="text-xs text-muted-foreground">Simulações criadas</p>
            </CardContent>
          </Card>
          
          <Card className="tech-card tech-card-hover border-emerald-400/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Avg Account Size</CardTitle>
              <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
                <DollarSign className="h-8 w-8 text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold number-display text-foreground">
                {formatCurrency(simulations.reduce((sum, sim) => sum + (sim.account_size || 0), 0) / simulations.length)}
              </div>
              <p className="text-xs text-muted-foreground">Valor médio das contas</p>
            </CardContent>
          </Card>
          
          <Card className="tech-card tech-card-hover border-purple-400/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Avg ROI</CardTitle>
              <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center flex-shrink-0 border border-purple-500/20">
                <TrendingUp className="h-8 w-8 text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold number-display text-purple-400">
                {formatPercentage(
                  simulations
                    .filter(sim => sim.roi_percentage)
                    .reduce((sum, sim) => sum + (sim.roi_percentage || 0), 0) / 
                  simulations.filter(sim => sim.roi_percentage).length
                )}
              </div>
              <p className="text-xs text-muted-foreground">Retorno médio</p>
            </CardContent>
          </Card>
          
          <Card className="tech-card tech-card-hover border-amber-400/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">In Progress</CardTitle>
              <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center flex-shrink-0 border border-amber-500/20">
                <FileText className="h-8 w-8 text-amber-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold number-display text-foreground">
                {simulations.filter(sim => sim.implementation_status === 'in_progress').length}
              </div>
              <p className="text-xs text-muted-foreground">Simulações ativas</p>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Simulations List */}
      <div className="space-y-4">
        {filteredSimulations.length === 0 ? (
          <Card className="tech-card">
            <CardContent className="p-12 text-center">
              <Calculator className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2 text-white">No simulations found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Try adjusting your search terms' : 'Create your first hedge simulation to get started'}
              </p>
              {!searchTerm && (
                <Dialog open={isNewSimulationOpen} onOpenChange={setIsNewSimulationOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Simulation
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Hedge Simulation</DialogTitle>
                    </DialogHeader>
                    <HedgeSimulator 
                      onSave={() => setIsNewSimulationOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredSimulations.map((simulation) => (
              <Card key={simulation.id} className="tech-card tech-card-hover">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-lg truncate text-white">
                        {simulation.simulation_name || 'Unnamed Simulation'}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(simulation.implementation_status)}
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(simulation.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(simulation)}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Simulation</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{simulation.simulation_name || 'this simulation'}"? 
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(simulation.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Account Size</p>
                      <p className="font-semibold text-white">{formatCurrency(simulation.account_size)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Test Cost</p>
                      <p className="font-semibold text-white">{formatCurrency(simulation.test_cost)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Used</p>
                      <p className="font-semibold text-red-400">{formatCurrency(simulation.total_used)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Net Profit</p>
                      <p className="font-semibold text-emerald-400">{formatCurrency(simulation.total_profit)}</p>
                    </div>
                  </div>
                  
                  {/* ROI Badge */}
                  {simulation.roi_percentage && (
                    <div className="flex justify-center">
                      <Badge variant="outline" className="border-green-500 text-green-600">
                        ROI: {formatPercentage(simulation.roi_percentage)}
                      </Badge>
                    </div>
                  )}
                  
                  {/* Notes Preview */}
                  {simulation.notes && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground truncate">
                        {simulation.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Simulation</DialogTitle>
          </DialogHeader>
          {selectedSimulation && (
            <HedgeSimulator 
              existingSimulation={selectedSimulation}
              onSave={() => {
                setIsEditOpen(false);
                setSelectedSimulation(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
