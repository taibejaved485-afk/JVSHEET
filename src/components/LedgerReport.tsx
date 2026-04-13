/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { FileText, Download, Filter, Calendar } from 'lucide-react';
import { getAccounts, getLedger } from '../lib/store';
import { AccountHead } from '../types';
import { format, isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { cn, formatCurrency } from '../lib/utils';

import { ScrollArea } from './ui/scroll-area';
import { DatePicker } from './ui/date-picker';
import { Label } from './ui/label';
import { CountUp } from './ui/count-up';

export default function LedgerReport() {
  const [accounts, setAccounts] = useState<AccountHead[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    setAccounts(getAccounts());
  }, []);

  useEffect(() => {
    if (selectedAccountId) {
      setLedgerEntries(getLedger(selectedAccountId));
    } else {
      setLedgerEntries([]);
    }
  }, [selectedAccountId]);

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  const filteredEntries = ledgerEntries.filter(entry => {
    if (!startDate && !endDate) return true;
    
    const entryDate = parseISO(entry.date);
    const start = startDate ? startOfDay(parseISO(startDate)) : null;
    const end = endDate ? endOfDay(parseISO(endDate)) : null;

    if (start && end) {
      return isWithinInterval(entryDate, { start, end });
    } else if (start) {
      return entryDate >= start;
    } else if (end) {
      return entryDate <= end;
    }
    return true;
  });
  
  const handleExportPDF = () => {
    if (!selectedAccountId || filteredEntries.length === 0) {
      toast.error('No data to export. Please select an account with transactions in the selected range.');
      return;
    }

    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Ledger Report', 14, 22);
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Account: ${selectedAccount?.name}`, 14, 32);
    doc.text(`Date Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 38);
    
    if (startDate || endDate) {
      const range = `Period: ${startDate ? format(parseISO(startDate), 'dd/MM/yyyy') : 'Beginning'} to ${endDate ? format(parseISO(endDate), 'dd/MM/yyyy') : 'Present'}`;
      doc.text(range, 14, 44);
    }
    
    const balance = filteredEntries.length > 0 ? filteredEntries[filteredEntries.length - 1].balance : 0;
    const balanceStr = `${formatCurrency(Math.abs(balance))} ${balance >= 0 ? 'DR' : 'CR'}`;
    doc.text(`Closing Balance: ${balanceStr}`, 14, 50);

    // Table
    const tableData = filteredEntries.map(entry => [
      format(new Date(entry.date), 'dd/MM/yyyy'),
      entry.voucherNumber,
      entry.description,
      entry.debit > 0 ? formatCurrency(entry.debit) : '-',
      entry.credit > 0 ? formatCurrency(entry.credit) : '-',
      `${formatCurrency(Math.abs(entry.balance))} ${entry.balance >= 0 ? 'DR' : 'CR'}`
    ]);

    autoTable(doc, {
      startY: 56,
      head: [['Date', 'Voucher #', 'Description', 'Debit', 'Credit', 'Balance']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }, // Primary color
      columnStyles: {
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right', fontStyle: 'bold' }
      }
    });

    doc.save(`Ledger_${selectedAccount?.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`);
    toast.success('PDF exported successfully');
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">Ledger Telemetry</h2>
          <p className="text-sm text-slate-500">Detailed audit trail and historical data for specific account heads.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button 
            onClick={handleExportPDF}
            className="brutal-btn-secondary h-11 px-6 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export Audit Log
          </button>
        </div>
      </div>

      <Card className="glass-card bg-white">
        <CardHeader className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 border-b border-slate-100 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full lg:w-auto">
            <div className="w-full sm:w-64 space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Account Head</Label>
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger className="bg-white border border-slate-200 rounded-lg h-10 font-medium text-sm">
                  <SelectValue placeholder="Select account..." />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name} ({acc.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <div className="w-full sm:w-40 space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">From Date</Label>
                <DatePicker date={startDate} setDate={setStartDate} />
              </div>
              <div className="w-full sm:w-40 space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">To Date</Label>
                <DatePicker date={endDate} setDate={setEndDate} />
              </div>
            </div>
          </div>

          {(startDate || endDate) && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => { setStartDate(''); setEndDate(''); }}
              className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-900"
            >
              Reset Filters
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {selectedAccountId ? (
            <div className="space-y-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 bg-slate-50/50 border-b border-slate-100 gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-sm">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Account Head</p>
                    <p className="text-xl font-bold tracking-tight text-slate-900">{selectedAccount?.name}</p>
                  </div>
                </div>
                <div className="text-left sm:text-right w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-none border-slate-200">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                    {startDate || endDate ? 'Closing Balance (Period)' : 'Current Balance'}
                  </p>
                  <p className="text-2xl font-bold tracking-tight text-slate-900">
                    Rs. <CountUp 
                      value={filteredEntries.length > 0 ? Math.abs(filteredEntries[filteredEntries.length - 1].balance) : 0} 
                      formatter={(v) => new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)} 
                    />
                    <span className={cn(
                      "text-xs ml-2 font-bold px-2 py-0.5 rounded",
                      filteredEntries.length > 0 && filteredEntries[filteredEntries.length - 1].balance >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    )}>
                      {filteredEntries.length > 0 && filteredEntries[filteredEntries.length - 1].balance >= 0 ? 'DR' : 'CR'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="overflow-hidden">
                <div className="overflow-x-auto">
                  <div className="min-w-[800px]">
                    <Table>
                      <TableHeader className="bg-slate-50/50 border-b border-slate-100">
                        <TableRow className="hover:bg-transparent border-none">
                          <TableHead className="w-[120px] text-[11px] font-bold uppercase tracking-wider text-slate-500">Date</TableHead>
                          <TableHead className="w-[150px] text-[11px] font-bold uppercase tracking-wider text-slate-500">Voucher #</TableHead>
                          <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Description</TableHead>
                          <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">Debit</TableHead>
                          <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">Credit</TableHead>
                          <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEntries.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-12 text-xs font-medium text-slate-400 uppercase">
                              No transactions found in this period
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredEntries.map((entry, idx) => (
                            <TableRow key={idx} className="hover:bg-slate-50 transition-colors border-b border-slate-100">
                              <TableCell className="font-medium text-xs text-slate-600">{format(new Date(entry.date), 'dd/MM/yyyy')}</TableCell>
                              <TableCell>
                                <span className="font-bold text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{entry.voucherNumber}</span>
                              </TableCell>
                              <TableCell className="text-xs font-medium text-slate-700">
                                {entry.description}
                              </TableCell>
                              <TableCell className="text-right text-xs font-medium text-slate-600">{entry.debit > 0 ? formatCurrency(entry.debit) : '-'}</TableCell>
                              <TableCell className="text-right text-xs font-medium text-slate-600">{entry.credit > 0 ? formatCurrency(entry.credit) : '-'}</TableCell>
                              <TableCell className="text-right font-semibold text-sm tabular-nums text-slate-900">
                                {formatCurrency(Math.abs(entry.balance))}
                                <span className={cn(
                                  "text-[10px] ml-1.5 font-bold px-1.5 py-0.5 rounded",
                                  entry.balance >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                )}>
                                  {entry.balance >= 0 ? 'DR' : 'CR'}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
                <Filter className="w-8 h-8 opacity-20" />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest">Select an account head above</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
