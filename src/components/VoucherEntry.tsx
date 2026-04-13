/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Label } from './ui/label';
import { Plus, Trash2, Save, AlertCircle, Calendar as CalendarIcon, Upload, FileDown, Info, ShieldCheck, Eraser, PenTool, Package, Globe } from 'lucide-react';
import { getAccounts, saveVoucher, getNextVoucherNumber, getInventory, updateInventoryFromVoucher } from '../lib/store';
import { AccountHead, Voucher, VoucherType, VoucherEntry as IVoucherEntry, InventoryItem, VoucherStockItem } from '../types';
import { toast } from 'sonner';
import { DatePicker } from './ui/date-picker';
import { AccountSearch } from './AccountSearch';
import { cn, formatCurrency } from '../lib/utils';
import Papa from 'papaparse';
import { Tooltip } from 'react-tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

// Signature Pad Component
function SignaturePad({ onSave, onClear }: { onSave: (data: string) => void, onClear: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;
    ctx.moveTo(x, y);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onSave(canvas.toDataURL());
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onClear();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Authorized Signature</Label>
        <Button variant="ghost" size="sm" onClick={clear} className="h-6 px-2 text-[9px] uppercase font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50">
          <Eraser className="w-3 h-3 mr-1" /> Clear
        </Button>
      </div>
      <div className="relative group">
        <canvas
          ref={canvasRef}
          width={400}
          height={120}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseOut={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
          className="w-full h-[120px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl cursor-crosshair transition-all group-hover:border-blue-300"
        />
        {!isDrawing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 group-hover:opacity-10 transition-opacity">
            <PenTool className="w-8 h-8 text-slate-400" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function VoucherEntry() {
  const [accounts, setAccounts] = useState<AccountHead[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<VoucherType>('CRV');
  
  // Form States
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [partyId, setPartyId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank' | 'App'>('Cash');
  const [bankAccountId, setBankAccountId] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [attachment, setAttachment] = useState<string | null>(null);
  
  // Enterprise Features State
  const [currency, setCurrency] = useState<'PKR' | 'USD' | 'AED'>('PKR');
  const [exchangeRate, setExchangeRate] = useState('1');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [itemQuantity, setItemQuantity] = useState('');
  const [signatureData, setSignatureData] = useState<string | null>(null);
  
  // JV specific state
  const [jvEntries, setJvEntries] = useState<IVoucherEntry[]>([
    { accountId: '', debit: 0, credit: 0 },
    { accountId: '', debit: 0, credit: 0 },
  ]);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  useEffect(() => {
    setAccounts(getAccounts());
    setInventory(getInventory());
  }, []);

  const downloadTemplate = () => {
    const csvContent = "date,type,description,account_name,debit,credit\n2026-04-11,JV,Office Rent,Rent Expense,500,0\n2026-04-11,JV,Office Rent,Cash,0,500";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "voucher_template.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCsvUpload = (event: any) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as any[];
        if (rows.length === 0) {
          toast.error("CSV file is empty");
          return;
        }

        // Group rows by date, type, and description to form vouchers
        const voucherGroups: Record<string, any[]> = {};
        rows.forEach((row, index) => {
          const groupKey = `${row.date}-${row.type}-${row.description}`;
          if (!voucherGroups[groupKey]) {
            voucherGroups[groupKey] = [];
          }
          voucherGroups[groupKey].push({ ...row, originalIndex: index + 2 });
        });

        let successCount = 0;
        let errorCount = 0;

        Object.values(voucherGroups).forEach((group) => {
          try {
            const firstRow = group[0];
            const type = firstRow.type as VoucherType;
            const date = firstRow.date;
            const description = firstRow.description;

            if (!['CRV', 'CPV', 'JV'].includes(type)) {
              throw new Error(`Invalid voucher type: ${type}`);
            }

            const entries: IVoucherEntry[] = group.map(row => {
              const account = accounts.find(a => a.name.toLowerCase() === row.account_name.trim().toLowerCase());
              if (!account) {
                throw new Error(`Account not found: ${row.account_name}`);
              }
              return {
                accountId: account.id,
                debit: parseFloat(row.debit) || 0,
                credit: parseFloat(row.credit) || 0
              };
            });

            // Basic validation
            const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
            const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);

            if (Math.abs(totalDebit - totalCredit) > 0.01) {
              throw new Error(`Voucher out of balance: ${description}`);
            }

            const newVoucher: Voucher = {
              id: crypto.randomUUID(),
              type,
              date,
              description,
              entries,
              voucherNumber: getNextVoucherNumber(type),
              currency: 'PKR',
              exchangeRate: 1,
            };

            saveVoucher(newVoucher);
            successCount++;
          } catch (err: any) {
            console.error(err);
            errorCount++;
            toast.error(`Error in group "${group[0].description}": ${err.message}`);
          }
        });

        if (successCount > 0) {
          toast.success(`Successfully imported ${successCount} vouchers`);
          setIsImportDialogOpen(false);
        }
        if (errorCount > 0) {
          toast.error(`Failed to import ${errorCount} vouchers`);
        }
      },
      error: (error) => {
        toast.error(`CSV Parsing Error: ${error.message}`);
      }
    });
  };

  const resetForm = () => {
    setDescription('');
    setPartyId('');
    setAmount('');
    setPaymentMethod('Cash');
    setBankAccountId('');
    setReferenceNumber('');
    setAttachment(null);
    setCurrency('PKR');
    setExchangeRate('1');
    setSelectedItemId('');
    setItemQuantity('');
    setSignatureData(null);
    setJvEntries([
      { accountId: '', debit: 0, credit: 0 },
      { accountId: '', debit: 0, credit: 0 },
    ]);
  };

  const handleSave = () => {
    if (!description.trim()) {
      toast.error('Please enter a valid description');
      return;
    }

    if (!date) {
      toast.error('Please select a transaction date');
      return;
    }

    let entries: IVoucherEntry[] = [];

    if (activeTab === 'CRV' || activeTab === 'CPV') {
      if (!partyId) {
        toast.error('Please select a party/account');
        return;
      }
      
      const val = parseFloat(amount);
      if (isNaN(val) || val <= 0) {
        toast.error('Please enter a valid amount greater than zero');
        return;
      }

      if (paymentMethod !== 'Cash' && !bankAccountId) {
        toast.error('Please select a bank/app account');
        return;
      }

      const settlementAccountId = paymentMethod === 'Cash' ? 'cash-001' : bankAccountId;

      if (activeTab === 'CRV') {
        entries = [
          { accountId: settlementAccountId, debit: val, credit: 0 },
          { accountId: partyId, debit: 0, credit: val },
        ];
      } else {
        entries = [
          { accountId: partyId, debit: val, credit: 0 },
          { accountId: settlementAccountId, debit: 0, credit: val },
        ];
      }
    } else if (activeTab === 'JV') {
      // Filter out empty rows or rows with zero amounts
      const validEntries = jvEntries.filter(e => e.accountId && (Math.abs(e.debit) > 0 || Math.abs(e.credit) > 0));
      
      if (validEntries.length < 2) {
        toast.error('JV must have at least two valid entries');
        return;
      }

      // Check for negative values
      const hasNegative = validEntries.some(e => e.debit < 0 || e.credit < 0);
      if (hasNegative) {
        toast.error('Debit and Credit amounts cannot be negative');
        return;
      }

      const totalDebit = validEntries.reduce((sum, e) => sum + e.debit, 0);
      const totalCredit = validEntries.reduce((sum, e) => sum + e.credit, 0);

      if (totalDebit === 0 || totalCredit === 0) {
        toast.error('Voucher must have both debit and credit entries');
        return;
      }

      // Handle floating point precision issues
      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        toast.error(`Voucher is out of balance by ${formatCurrency(Math.abs(totalDebit - totalCredit))}`);
        return;
      }

      entries = validEntries;
    }

    if (!signatureData) {
      toast.error('Authorized signature is required to save voucher');
      return;
    }

    const rate = parseFloat(exchangeRate) || 1;

    const newVoucher: Voucher = {
      id: crypto.randomUUID(),
      type: activeTab,
      date,
      description,
      entries: entries.map(e => ({ 
        ...e, 
        debit: e.debit * rate, 
        credit: e.credit * rate 
      })),
      voucherNumber: getNextVoucherNumber(activeTab),
      attachment: attachment || undefined,
      bankAccountId: paymentMethod !== 'Cash' ? bankAccountId : undefined,
      referenceNumber: referenceNumber || undefined,
      paymentMethod,
      signatureData,
      currency,
      exchangeRate: rate,
      stockItems: selectedItemId && itemQuantity ? [{ itemId: selectedItemId, quantity: parseFloat(itemQuantity) }] : undefined,
    };

    saveVoucher(newVoucher);
    updateInventoryFromVoucher(newVoucher);
    toast.success(`${activeTab} saved successfully: ${newVoucher.voucherNumber}`);
    toast.info('WhatsApp Alert Sent to Party & Owner', {
      icon: '📱',
      duration: 5000,
    });
    resetForm();
  };

  const addJvRow = () => {
    setJvEntries([...jvEntries, { accountId: '', debit: 0, credit: 0 }]);
  };

  const removeJvRow = (index: number) => {
    if (jvEntries.length <= 2) return;
    const newEntries = [...jvEntries];
    newEntries.splice(index, 1);
    setJvEntries(newEntries);
  };

  const handleFileChange = (e: import('react').ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size too large. Max 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachment(reader.result as string);
        toast.success("Slip attached successfully");
      };
      reader.readAsDataURL(file);
    }
  };

  const updateJvEntry = (index: number, field: keyof IVoucherEntry, value: any) => {
    const newEntries = [...jvEntries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    setJvEntries(newEntries);
  };

  const totalDebit = jvEntries.reduce((sum, e) => sum + e.debit, 0);
  const totalCredit = jvEntries.reduce((sum, e) => sum + e.credit, 0);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  const isFormValid = () => {
    if (!description.trim() || !date) return false;
    if (activeTab === 'JV') return isBalanced;
    return !!partyId && !!amount && (paymentMethod === 'Cash' || !!bankAccountId) && !!signatureData;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">Data Entry</h2>
          <p className="text-sm text-slate-500">Initialize and authorize financial transaction records.</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger
              render={
                <Button variant="outline" className="h-9 px-4 flex items-center gap-2 brutal-btn text-xs font-bold uppercase tracking-wider">
                  <Upload className="w-4 h-4" /> Bulk Import
                </Button>
              }
            />
            <DialogContent className="sm:max-w-[500px] bg-white rounded-none border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <DialogHeader>
                <DialogTitle className="text-xl font-black uppercase tracking-tight">Bulk Voucher Import</DialogTitle>
                <DialogDescription className="text-slate-500 font-medium">
                  Upload a structured CSV file to create multiple vouchers at once.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="bg-blue-50 border-2 border-blue-200 p-4 flex gap-3">
                  <Info className="w-5 h-5 text-blue-600 shrink-0" />
                  <div className="text-xs text-blue-800 space-y-1">
                    <p className="font-bold uppercase tracking-wider">CSV Structure Requirements:</p>
                    <ul className="list-disc list-inside space-y-0.5 opacity-90">
                      <li>Headers: date, type, description, account_name, debit, credit</li>
                      <li>Type: CRV (Receipt), CPV (Payment), JV (Journal)</li>
                      <li>Vouchers are grouped by date, type, and description</li>
                    </ul>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <Button 
                    variant="outline" 
                    onClick={downloadTemplate}
                    className="w-full justify-start gap-3 h-12 border-2 border-black rounded-none hover:bg-slate-50 font-bold uppercase text-xs tracking-widest"
                  >
                    <FileDown className="w-5 h-5" /> Download CSV Template
                  </Button>
                  
                  <div className="relative">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCsvUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <Button className="w-full h-12 brutal-btn-primary gap-3 pointer-events-none">
                      <Upload className="w-5 h-5" /> Select CSV File to Upload
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <div className="px-3 py-1.5 border border-slate-200 bg-white text-xs font-semibold text-slate-600 uppercase tracking-wider rounded-full shadow-sm">
            Mode: Manual Override
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as VoucherType)} className="w-full">
        <TabsList className="w-full justify-start h-auto p-1 bg-slate-100 rounded-xl mb-8 gap-1">
          <TabsTrigger 
            value="CRV" 
            className="px-6 py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm font-semibold uppercase text-xs tracking-wider transition-all cursor-help"
            data-tooltip-id="crv-tooltip"
            data-tooltip-content="Cash Receipt Voucher: Jab paise milte hain."
          >
            Cash Receipt
          </TabsTrigger>
          <TabsTrigger 
            value="CPV" 
            className="px-6 py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm font-semibold uppercase text-xs tracking-wider transition-all"
          >
            Cash Payment
          </TabsTrigger>
          <TabsTrigger 
            value="JV" 
            className="px-6 py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm font-semibold uppercase text-xs tracking-wider transition-all cursor-help"
            data-tooltip-id="jv-tooltip"
            data-tooltip-content="Journal Voucher: Non-cash transactions ke liye."
          >
            General Voucher
          </TabsTrigger>
        </TabsList>

        <div className="mt-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-xs font-semibold uppercase tracking-wider text-slate-500">Transaction Date</Label>
              <DatePicker date={date} setDate={setDate} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc" className="text-xs font-semibold uppercase tracking-wider text-slate-500">Description / Narration</Label>
              <Input id="desc" placeholder="Enter transaction details..." value={description} onChange={(e) => setDescription(e.target.value)} className="bg-white border-slate-200 rounded-lg h-10" />
            </div>
          </div>

          <TabsContent value="CRV" className="mt-0">
            <Card className="glass-card bg-white">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-700">Record Cash Received</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">From Party / Account</Label>
                    <AccountSearch 
                      accounts={accounts.filter(a => !a.isSystem && a.type !== 'Asset')} 
                      value={partyId} 
                      onValueChange={setPartyId} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Amount</Label>
                    <Input 
                      type="number" 
                      step="0.01"
                      min="0.01"
                      placeholder="0.00" 
                      value={amount} 
                      onChange={(e) => setAmount(e.target.value)} 
                      className="bg-white border-slate-200 rounded-lg h-10 font-medium" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="CPV" className="mt-0">
            <Card className="glass-card bg-white">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-700">Record Cash Paid</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">To Party / Account</Label>
                    <AccountSearch 
                      accounts={accounts.filter(a => !a.isSystem && a.type !== 'Asset')} 
                      value={partyId} 
                      onValueChange={setPartyId} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Amount</Label>
                    <Input 
                      type="number" 
                      step="0.01"
                      min="0.01"
                      placeholder="0.00" 
                      value={amount} 
                      onChange={(e) => setAmount(e.target.value)} 
                      className="bg-white border-slate-200 rounded-lg h-10 font-medium" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="JV" className="mt-0">
            <Card className="glass-card bg-white">
              <CardHeader className="border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-700">Journal Voucher Entries</CardTitle>
                <Button variant="outline" size="sm" onClick={addJvRow} className="gap-2 w-full sm:w-auto border border-slate-200 font-bold uppercase text-[10px]">
                  <Plus className="w-4 h-4" /> Add Row
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="hidden sm:grid grid-cols-12 gap-4 mb-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <div className="col-span-6">Account Head</div>
                  <div className="col-span-2">Debit</div>
                  <div className="col-span-2">Credit</div>
                  <div className="col-span-2"></div>
                </div>
                
                <div className="space-y-4 sm:space-y-2">
                  {jvEntries.map((entry, index) => (
                    <div key={index} className="flex flex-col sm:grid sm:grid-cols-12 gap-3 sm:gap-4 items-start sm:items-center p-4 sm:p-0 rounded-xl border border-slate-100 sm:border-none bg-slate-50/50 sm:bg-transparent">
                      <div className="w-full sm:col-span-6">
                        <Label className="sm:hidden mb-1.5 block text-xs font-semibold text-slate-500">Account Head</Label>
                        <AccountSearch 
                          accounts={accounts} 
                          value={entry.accountId} 
                          onValueChange={(v) => updateJvEntry(index, 'accountId', v)} 
                        />
                      </div>
                      <div className="w-full sm:col-span-2">
                        <Label className="sm:hidden mb-1.5 block text-xs font-semibold text-slate-500">Debit</Label>
                        <Input 
                          type="number" 
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={entry.debit || ''} 
                          onChange={(e) => updateJvEntry(index, 'debit', parseFloat(e.target.value) || 0)}
                          className="bg-white border-slate-200 rounded-lg h-10 font-medium"
                        />
                      </div>
                      <div className="w-full sm:col-span-2">
                        <Label className="sm:hidden mb-1.5 block text-xs font-semibold text-slate-500">Credit</Label>
                        <Input 
                          type="number" 
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={entry.credit || ''} 
                          onChange={(e) => updateJvEntry(index, 'credit', parseFloat(e.target.value) || 0)}
                          className="bg-white border-slate-200 rounded-lg h-10 font-medium"
                        />
                      </div>
                      <div className="w-full sm:col-span-2 flex justify-end">
                        <Button variant="ghost" size="sm" onClick={() => removeJvRow(index)} className="text-slate-400 hover:text-rose-600 w-full sm:w-auto gap-2 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                          <span className="sm:hidden">Remove Row</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div className="flex gap-8 w-full sm:w-auto justify-between sm:justify-start">
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Total Debit</p>
                      <p className={`text-xl font-bold tracking-tight ${isBalanced ? 'text-slate-900' : 'text-slate-400'}`}>{formatCurrency(totalDebit)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Total Credit</p>
                      <p className={`text-xl font-bold tracking-tight ${isBalanced ? 'text-slate-900' : 'text-slate-400'}`}>{formatCurrency(totalCredit)}</p>
                    </div>
                  </div>
                  
                  {!isBalanced && totalDebit > 0 && (
                    <div className="flex items-center gap-2 text-rose-600 text-[11px] font-bold uppercase bg-rose-50 px-4 py-2 rounded-lg border border-rose-100 w-full sm:w-auto">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>Balance Error: {formatCurrency(totalDebit - totalCredit)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <div className="mt-6 p-6 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-100">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Globe className="w-4 h-4 text-blue-500" />
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">Multi-Currency Settlement</Label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-400">Currency</Label>
                    <Select value={currency} onValueChange={(v) => setCurrency(v as any)}>
                      <SelectTrigger className="bg-white border-slate-200 rounded-lg h-10 font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PKR">PKR (Base)</SelectItem>
                        <SelectItem value="USD">USD (Dollar)</SelectItem>
                        <SelectItem value="AED">AED (Dirham)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-400">Exchange Rate</Label>
                    <Input 
                      type="number" 
                      value={exchangeRate} 
                      onChange={(e) => setExchangeRate(e.target.value)}
                      disabled={currency === 'PKR'}
                      className="bg-white border-slate-200 rounded-lg h-10 font-medium"
                    />
                  </div>
                </div>
                {currency !== 'PKR' && amount && (
                  <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Equivalent Value</p>
                    <p className="text-lg font-bold text-slate-900 mono-value">
                      {formatCurrency(parseFloat(amount) * (parseFloat(exchangeRate) || 0))}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="w-4 h-4 text-emerald-500" />
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">Inventory Integration</Label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-400">Select Item</Label>
                    <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                      <SelectTrigger className="bg-white border-slate-200 rounded-lg h-10 font-medium">
                        <SelectValue placeholder="Select stock..." />
                      </SelectTrigger>
                      <SelectContent>
                        {inventory.map(item => (
                          <SelectItem key={item.id} value={item.id}>{item.name} ({item.unit})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-400">Quantity</Label>
                    <Input 
                      type="number" 
                      placeholder="0.00"
                      value={itemQuantity} 
                      onChange={(e) => setItemQuantity(e.target.value)}
                      className="bg-white border-slate-200 rounded-lg h-10 font-medium"
                    />
                  </div>
                </div>
                {selectedItemId && (
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                    <Info className="w-3 h-3" />
                    Current Stock: {inventory.find(i => i.id === selectedItemId)?.quantity} {inventory.find(i => i.id === selectedItemId)?.unit}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Received/Paid Via</Label>
                <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'Cash' | 'Bank' | 'App')}>
                  <SelectTrigger className="bg-white border-slate-200 rounded-lg h-10 font-medium">
                    <SelectValue placeholder="Select method..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Bank">Bank</SelectItem>
                    <SelectItem value="App">Mobile App (JazzCash/EasyPaisa)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {paymentMethod !== 'Cash' && (
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Select Bank / App</Label>
                  <AccountSearch 
                    accounts={accounts.filter(a => 
                      (a.name.toLowerCase().includes('bank') || 
                       a.name.toLowerCase().includes('pay') || 
                       a.id.startsWith('wallet-')) &&
                      !a.isSystem
                    )} 
                    value={bankAccountId} 
                    onValueChange={setBankAccountId}
                    placeholder="Search bank or app..."
                    className="rounded-lg border-slate-200 h-10"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Reference # (Cheque/Txn ID)</Label>
                <Input 
                  placeholder="Ref-12345" 
                  value={referenceNumber} 
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="bg-white border-slate-200 rounded-lg h-10 font-medium"
                />
              </div>
            </div>

              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 pt-6 border-t border-slate-100">
                <div className="w-full lg:w-1/2 space-y-4">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Transaction Slip / Attachment</Label>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <input 
                        type="file" 
                        accept="image/*,.pdf" 
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <Button variant="outline" size="sm" className="h-10 gap-2 border-slate-200 text-slate-600 bg-white">
                        <Upload className="w-4 h-4" /> {attachment ? 'Change Slip' : 'Upload Slip'}
                      </Button>
                    </div>
                    {attachment && (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-600 text-[10px] font-bold uppercase">
                          <ShieldCheck className="w-3 h-3" /> Slip Attached
                          <button onClick={() => setAttachment(null)} className="ml-1 hover:text-rose-600">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        {attachment.startsWith('data:image') && (
                          <div 
                            className="w-12 h-12 rounded-lg border border-slate-200 overflow-hidden shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => window.open('', '_blank')?.document.write(`<img src="${attachment}" style="max-width:100%">`)}
                          >
                            <img src={attachment} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="w-full lg:w-1/2">
                  <SignaturePad onSave={setSignatureData} onClear={() => setSignatureData(null)} />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-end gap-3 w-full pt-6 border-t border-slate-100">
                <Button variant="outline" onClick={resetForm} className="w-full sm:w-auto brutal-btn">Clear Form</Button>
                <Button 
                  onClick={handleSave} 
                  className={cn(
                    "w-full sm:w-auto gap-2 brutal-btn-primary transition-all duration-500",
                    isFormValid() 
                      ? "animate-pulse shadow-[0_0_15px_rgba(37,99,235,0.5)]" 
                      : "opacity-50 cursor-not-allowed grayscale"
                  )}
                >
                  <Save className="w-4 h-4" /> Save Voucher
                </Button>
              </div>
          </div>
        </div>
      </Tabs>

      <Tooltip id="crv-tooltip" className="z-[100] !bg-slate-900 !text-white !rounded-lg !text-[10px] !font-bold !uppercase !tracking-widest !px-3 !py-2" />
      <Tooltip id="jv-tooltip" className="z-[100] !bg-slate-900 !text-white !rounded-lg !text-[10px] !font-bold !uppercase !tracking-widest !px-3 !py-2" />
    </div>
  );
}
