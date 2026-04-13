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
import { FileText, Download, Filter, Calendar, Paperclip, ExternalLink, Eye, X, Search, DollarSign } from 'lucide-react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';

export default function LedgerReport() {
  const [accounts, setAccounts] = useState<AccountHead[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

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
    // Date filter
    let dateMatch = true;
    if (startDate || endDate) {
      const entryDate = parseISO(entry.date);
      const start = startDate ? startOfDay(parseISO(startDate)) : null;
      const end = endDate ? endOfDay(parseISO(endDate)) : null;
      if (start && end) dateMatch = isWithinInterval(entryDate, { start, end });
      else if (start) dateMatch = entryDate >= start;
      else if (end) dateMatch = entryDate <= end;
    }

    // Search filter (Voucher ID, Description)
    const searchMatch = !searchTerm || 
      entry.voucherNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchTerm.toLowerCase());

    // Amount filter
    const amount = Math.max(entry.debit, entry.credit);
    const minMatch = !minAmount || amount >= (parseFloat(minAmount) || 0);
    const maxMatch = !maxAmount || amount <= (parseFloat(maxAmount) || Infinity);

    return dateMatch && searchMatch && minMatch && maxMatch;
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
        <CardHeader className="border-b border-slate-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-y-6 gap-x-4 w-full">
            <div className="space-y-2 xl:col-span-2">
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

            <div className="space-y-2 xl:col-span-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Voucher #..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-slate-200 rounded-lg h-10 text-xs"
                />
              </div>
            </div>

            <div className="space-y-2 xl:col-span-4">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Date Range</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <DatePicker date={startDate} setDate={setStartDate} className="w-full" />
                </div>
                <span className="text-slate-300 shrink-0">/</span>
                <div className="flex-1 min-w-0">
                  <DatePicker date={endDate} setDate={setEndDate} className="w-full" />
                </div>
              </div>
            </div>

            <div className="space-y-2 xl:col-span-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Amount (Min-Max)</Label>
              <div className="flex items-center gap-2">
                <Input 
                  type="number" 
                  placeholder="Min" 
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  className="bg-white border-slate-200 rounded-lg h-10 text-xs w-full"
                />
                <span className="text-slate-300 shrink-0">-</span>
                <Input 
                  type="number" 
                  placeholder="Max" 
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  className="bg-white border-slate-200 rounded-lg h-10 text-xs w-full"
                />
              </div>
            </div>

            <div className="flex items-end gap-2 xl:col-span-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedAccountId('');
                  setStartDate('');
                  setEndDate('');
                  setSearchTerm('');
                  setMinAmount('');
                  setMaxAmount('');
                }}
                className="h-10 px-3 border-slate-200 text-slate-500 hover:text-slate-900 rounded-lg text-xs font-bold uppercase shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
              <Button 
                onClick={handleExportPDF}
                disabled={filteredEntries.length === 0}
                className="h-10 px-4 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-xs font-bold uppercase flex-1"
              >
                <Download className="w-4 h-4 mr-2" /> PDF
              </Button>
            </div>
          </div>

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
                          <TableHead className="w-[80px] text-[11px] font-bold uppercase tracking-wider text-slate-500">Slip</TableHead>
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
                                <div className="flex flex-col gap-1">
                                  <span>{entry.description}</span>
                                  {(entry.referenceNumber || entry.paymentMethod) && (
                                    <div className="flex items-center gap-2">
                                      {entry.paymentMethod && (
                                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">
                                          {entry.paymentMethod}
                                        </span>
                                      )}
                                      {entry.referenceNumber && (
                                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-blue-50 text-blue-500 rounded flex items-center gap-1">
                                          <Paperclip className="w-2 h-2" /> {entry.referenceNumber}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {entry.attachment ? (
                                  <button 
                                    onClick={() => setPreviewImage(entry.attachment)}
                                    className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                    title="View Slip"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <span className="text-slate-300">-</span>
                                )}
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
