
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  Users, 
  Server, 
  Activity,
  DollarSign,
  BarChart3,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

// Mock data for performance chart
const performanceData = [
  { time: '00:00', value: 100 },
  { time: '04:00', value: 102.5 },
  { time: '08:00', value: 98.2 },
  { time: '12:00', value: 105.8 },
  { time: '16:00', value: 112.3 },
  { time: '20:00', value: 118.7 },
  { time: '24:00', value: 124.5 },
];

const Dashboard = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do sistema de trading TRADERLAB
        </p>
      </div>

      {/* Stats Cards with Individual Color Borders and Larger Icons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1 - Azul */}
        <Card className="tech-card tech-card-hover border-sky-400/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Accounts</CardTitle>
            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-sky-500/20 to-sky-600/20 flex items-center justify-center flex-shrink-0 border border-sky-500/20">
              <Users className="h-8 w-8 text-sky-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold number-display text-foreground">24</div>
            <p className="text-xs text-emerald-400">
              +2 desde o último mês
            </p>
          </CardContent>
        </Card>

        {/* Card 2 - Roxo */}
        <Card className="tech-card tech-card-hover border-purple-400/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Active VPS</CardTitle>
            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center flex-shrink-0 border border-purple-500/20">
              <Server className="h-8 w-8 text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold number-display text-foreground">8</div>
            <p className="text-xs text-emerald-400">
              100% de uptime
            </p>
          </CardContent>
        </Card>

        {/* Card 3 - Verde */}
        <Card className="tech-card tech-card-hover border-emerald-400/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total P&L</CardTitle>
            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
              <DollarSign className="h-8 w-8 text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold number-display text-emerald-400">+$12,459</div>
            <p className="text-xs text-emerald-400">
              +18.2% desde ontem
            </p>
          </CardContent>
        </Card>

        {/* Card 4 - Amarelo */}
        <Card className="tech-card tech-card-hover border-amber-400/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Active Trades</CardTitle>
            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center flex-shrink-0 border border-amber-500/20">
              <Activity className="h-8 w-8 text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold number-display text-foreground">47</div>
            <p className="text-xs text-muted-foreground">
              Em 15 contas diferentes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card className="performance-chart-container">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            Performance Acumulada (24h)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <XAxis 
                  dataKey="time" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="url(#gradient)" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, stroke: '#10b981', strokeWidth: 2 }}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0ea5e9" />
                    <stop offset="50%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* System Status & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="tech-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Trading Engine</span>
              <span className="text-sm text-emerald-400 font-medium">Online</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Database Connection</span>
              <span className="text-sm text-emerald-400 font-medium">Connected</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">VPS Network</span>
              <span className="text-sm text-emerald-400 font-medium">Stable</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Expert Advisors</span>
              <span className="text-sm text-amber-400 font-medium">15/18 Active</span>
            </div>
          </CardContent>
        </Card>

        <Card className="tech-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <BarChart3 className="h-5 w-5 text-sky-400" />
              Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Win Rate</span>
                <span className="font-medium number-display">73.2%</span>
              </div>
              <div className="w-full bg-muted/30 rounded-full h-2">
                <div className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-2 rounded-full" style={{ width: '73.2%' }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Profit Factor</span>
                <span className="font-medium number-display">2.14</span>
              </div>
              <div className="w-full bg-muted/30 rounded-full h-2">
                <div className="bg-gradient-to-r from-sky-400 to-sky-500 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Max Drawdown</span>
                <span className="font-medium number-display text-rose-400">-8.3%</span>
              </div>
              <div className="w-full bg-muted/30 rounded-full h-2">
                <div className="bg-gradient-to-r from-rose-400 to-rose-500 h-2 rounded-full" style={{ width: '17%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="tech-card">
        <CardHeader>
          <CardTitle className="text-white">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-400 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">New account connected</p>
                <p className="text-xs text-muted-foreground">Account #789123 connected to VPS-3</p>
                <p className="text-xs text-muted-foreground">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">High drawdown alert</p>
                <p className="text-xs text-muted-foreground">Account #456789 reached 7.5% drawdown</p>
                <p className="text-xs text-muted-foreground">15 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-sky-400 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Strategy performance update</p>
                <p className="text-xs text-muted-foreground">EA_Scalper_v2 showing 15% improvement</p>
                <p className="text-xs text-muted-foreground">1 hour ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
