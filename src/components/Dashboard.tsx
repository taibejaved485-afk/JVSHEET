/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Wallet, ArrowUpRight, ArrowDownLeft, TrendingUp, Receipt, Activity, BarChart3 } from 'lucide-react';
import { getAccountBalance, getAccounts, getVouchers } from '../lib/store';
import { AccountHead, Voucher } from '../types';
import { format } from 'date-fns';
import { cn, formatCurrency } from '../lib/utils';
import FinancialCharts from './FinancialCharts';
import { CountUp } from './ui/count-up';

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
    
    // Cash in hand
    const cashBalance = getAccountBalance('cash-001');
    
    // Receivables (Assets other than cash)
    let receivables = 0;
    allAccounts.forEach(acc => {
      if (acc.type === 'Asset' && acc.id !== 'cash-001') {
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

    setStats({ cash: cashBalance, receivables, payables });
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
  }, []);

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
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Cash in Hand</CardTitle>
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
                  <div key={v.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-all cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
                        {v.type}
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold text-slate-900 tracking-tight">{v.voucherNumber}</p>
                        <p className="text-xs text-slate-500 line-clamp-1">{v.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-900 mono-value">{format(new Date(v.date), 'MMM dd')}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Verified</p>
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
    </div>
  );
}
