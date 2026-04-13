/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Wallet, ArrowUpRight, ArrowDownLeft, TrendingUp, Receipt, Activity, BarChart3, Eye, FileText, ShieldCheck, Package, AlertTriangle, Globe } from 'lucide-react';
import { getAccountBalance, getAccounts, getVouchers, getInventory } from '../lib/store';
import { AccountHead, Voucher, InventoryItem } from '../types';
import { format } from 'date-fns';
import { cn, formatCurrency } from '../lib/utils';
import FinancialCharts from './FinancialCharts';
import { CountUp } from './ui/count-up';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState({
    cash: 0,
    receivables: 0,
    payables: 0,
  });
  const [recentVouchers, setRecentVouchers] = useState<Voucher[]>([]);
  const [accounts, setAccounts] = useState<AccountHead[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [chartData, setChartData] = useState<{ name: string; value: number }[]>([]);
  const [now, setNow] = useState(new Date());
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [currencyData, setCurrencyData] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const allAccounts = getAccounts();
    const allVouchers = getVouchers();
    setAccounts(allAccounts);
    setVouchers(allVouchers);
    
    // Cash in hand (Combined Cash + Bank)
    const cashBalance = getAccountBalance('cash-001');
    let bankBalance = 0;
    allAccounts.forEach(acc => {
      const isBankOrApp = (acc.name.toLowerCase().includes('bank') || acc.name.toLowerCase().includes('pay') || acc.id.startsWith('wallet-')) && !acc.isSystem;
      if (acc.type === 'Asset' && isBankOrApp) {
        bankBalance += getAccountBalance(acc.id);
      }
    });
    
    // Receivables (Assets other than cash and bank)
    let receivables = 0;
    allAccounts.forEach(acc => {
      const isBankOrApp = (acc.name.toLowerCase().includes('bank') || acc.name.toLowerCase().includes('pay') || acc.id.startsWith('wallet-')) && !acc.isSystem;
      if (acc.type === 'Asset' && acc.id !== 'cash-001' && !isBankOrApp) {
        const bal = getAccountBalance(acc.id);
        if (bal > 0) receivables += bal;
      }
    });

    // Payables (Liabilities)
    let payables = 0;
    allAccounts.forEach(acc => {
      if (acc.type === 'Liability') {
        const bal = getAccountBalance(acc.id);
        if (bal < 0) payables += Math.abs(bal);
      }
    });

    setStats({ cash: cashBalance + bankBalance, receivables, payables });
    setRecentVouchers(allVouchers.slice(-5).reverse());

    // Prepare chart data
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return format(d, 'yyyy-MM-dd');
    }).reverse();

    const dailyData = last7Days.map(date => {
      const dayVouchers = allVouchers.filter(v => v.date === date);
      const total = dayVouchers.reduce((sum, v) => {
        const amount = v.entries.reduce((s, e) => s + (e.debit || 0), 0);
        return sum + amount;
      }, 0);
      return { name: format(new Date(date), 'EEE'), value: total };
    });
    setChartData(dailyData);

    const allInventory = getInventory();
    setInventory(allInventory);

    // Currency distribution
    const distribution = allVouchers.reduce((acc: any, v) => {
      const curr = v.currency || 'PKR';
      const amount = v.entries.reduce((sum, e) => sum + Math.max(e.debit, e.credit), 0);
      acc[curr] = (acc[curr] || 0) + amount;
      return acc;
    }, {});

    setCurrencyData(Object.entries(distribution).map(([name, value]) => ({ name, value: value as number })));
  }, []);

  const lowStockItems = inventory.filter(i => i.quantity <= i.minStock);
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">Mission Control</h2>
          <p className="text-sm text-slate-500">Real-time financial telemetry for your enterprise.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 bg-white rounded-full shadow-sm">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">System Live</span>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase text-slate-400">Current Status</p>
            <p className="text-sm font-semibold text-slate-900 tracking-wide">
              <span className="text-blue-600">{format(now, 'EEEE')}</span>, {format(now, 'dd MMMM yyyy')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="glass-card group">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Cash Liquidity (Cash + Bank)</CardTitle>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Wallet className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold tracking-tight text-slate-900 mono-value">
              Rs. <CountUp value={stats.cash} formatter={(v) => new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)} />
            </div>
            <div className="flex items-center gap-1 mt-2 text-[11px] text-emerald-600 font-bold uppercase">
              <Activity className="w-3 h-3" />
              <span>Telemetry: Active</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card group">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Accounts Receivable</CardTitle>
            <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold tracking-tight text-slate-900 mono-value">
              Rs. <CountUp value={stats.receivables} formatter={(v) => new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)} />
            </div>
            <p className="text-xs text-slate-500 mt-2">External assets pending reconciliation.</p>
          </CardContent>
        </Card>

        <Card className="glass-card group sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Accounts Payable</CardTitle>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold tracking-tight text-slate-900 mono-value">
              Rs. <CountUp value={stats.payables} formatter={(v) => new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)} />
            </div>
            <p className="text-xs text-slate-500 mt-2">Outstanding liabilities for settlement.</p>
          </CardContent>
        </Card>
      </div>

      {lowStockItems.length > 0 && (
        <Card className="border-rose-200 bg-rose-50/30 shadow-sm overflow-hidden">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-rose-600">Critical Stock Alert</p>
                <p className="text-sm font-medium text-slate-700">
                  {lowStockItems.length} items are below minimum threshold: {lowStockItems.map(i => i.name).join(', ')}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="border-rose-200 text-rose-600 hover:bg-rose-100">Restock Now</Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="glass-card lg:col-span-2 overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-slate-700">
              <BarChart3 className="w-4 h-4" />
              Transaction Velocity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <FinancialCharts data={chartData} />
          </CardContent>
        </Card>

        <Card className="glass-card overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-slate-700">
              <Globe className="w-4 h-4" />
              Currency Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={currencyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {currencyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card overflow-hidden lg:col-span-3">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-slate-700">
              <Activity className="w-4 h-4" />
              Recent Telemetry
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {recentVouchers.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
                    <Receipt className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-xs font-medium text-slate-400 uppercase">No data detected</p>
                </div>
              ) : (
                recentVouchers.map((v) => (
                  <div 
                    key={v.id} 
                    className="flex items-center justify-between p-4 hover:bg-slate-50 transition-all cursor-pointer group"
                    onClick={() => v.attachment && setPreviewImage(v.attachment)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
                        {v.type}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-900 tracking-tight">{v.voucherNumber}</p>
                          {v.paymentMethod && (
                            <span className={cn(
                              "text-[8px] font-black uppercase px-1.5 py-0.5 rounded tracking-tighter",
                              v.paymentMethod === 'Cash' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                            )}>
                              {v.paymentMethod}
                            </span>
                          )}
                          {v.attachment && <Eye className="w-3 h-3 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1">{v.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-900 mono-value">{format(new Date(v.date), 'MMM dd')}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 flex items-center justify-end gap-1">
                        <ShieldCheck className="w-2.5 h-2.5" /> Verified
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <button className="p-8 glass-card text-left group cursor-pointer hover:border-blue-200 hover:bg-blue-50/30">
          <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Receipt className="w-7 h-7 text-blue-600" />
          </div>
          <p className="font-bold text-lg text-slate-900 uppercase tracking-tight">Initialize Receipt</p>
          <p className="text-sm text-slate-500 mt-2">Record incoming financial data streams into the ledger.</p>
        </button>
        <button className="p-8 glass-card text-left group cursor-pointer hover:border-emerald-200 hover:bg-emerald-50/30">
          <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <ArrowDownLeft className="w-7 h-7 text-emerald-600" />
          </div>
          <p className="font-bold text-lg text-slate-900 uppercase tracking-tight">Execute Payment</p>
          <p className="text-sm text-slate-500 mt-2">Authorize outgoing financial obligations for settlement.</p>
        </button>
      </div>

      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-3xl bg-white p-0 overflow-hidden border-none glass-card">
          <DialogHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
            <DialogTitle className="text-sm font-bold uppercase tracking-wider text-slate-700">Transaction Slip Preview</DialogTitle>
          </DialogHeader>
          <div className="p-6 flex items-center justify-center bg-slate-50 min-h-[400px]">
            {previewImage?.startsWith('data:image') ? (
              <img 
                src={previewImage} 
                alt="Transaction Slip" 
                className="max-w-full max-h-[70vh] rounded-lg shadow-2xl border-4 border-white"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex flex-col items-center gap-4 text-slate-400">
                <FileText className="w-16 h-16 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest">Document Preview Not Available</p>
                <Button variant="outline" size="sm" asChild>
                  <a href={previewImage || ''} target="_blank" rel="noopener noreferrer">Open in New Tab</a>
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
