/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Plus, Search, Users, ShieldCheck, Trash2, CheckSquare, Square, AlertTriangle, ArrowUpDown, ArrowUp, ArrowDown, Edit3, FileDown } from 'lucide-react';
import { getAccounts, saveAccount, getAccountBalance, deleteAccounts, saveAccounts } from '../lib/store';
import { AccountHead, AccountType } from '../types';
import { toast } from 'sonner';
import { Checkbox } from './ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { cn, formatCurrency } from '../lib/utils';
import { CountUp } from './ui/count-up';

import { ScrollArea } from './ui/scroll-area';

export default function AccountsList() {
  const [accounts, setAccounts] = useState<AccountHead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // New Account Form
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<AccountType>('Asset');
  const [customFields, setCustomFields] = useState<{ key: string, value: string }[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: 'name' | null, direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });
  
  // Batch Edit State
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false);
  const [batchType, setBatchType] = useState<AccountType | 'keep'>('keep');
  const [clearMetadata, setClearMetadata] = useState(false);

  useEffect(() => {
    setAccounts(getAccounts());
  }, []);

  const addCustomField = () => {
    setCustomFields([...customFields, { key: '', value: '' }]);
  };

  const removeCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const updateCustomField = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...customFields];
    updated[index][field] = value;
    setCustomFields(updated);
  };

  const handleAddAccount = () => {
    if (!newName.trim()) {
      toast.error('Please enter a valid account name');
      return;
    }

    // Check for duplicate names
    if (accounts.some(a => a.name.toLowerCase() === newName.trim().toLowerCase())) {
      toast.error('An account with this name already exists');
      return;
    }

    const metadata: Record<string, string> = {};
    customFields.forEach(field => {
      if (field.key.trim()) {
        metadata[field.key.trim()] = field.value.trim();
      }
    });

    const newAccount: AccountHead = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      type: newType,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    };

    saveAccount(newAccount);
    setAccounts(getAccounts());
    setIsDialogOpen(false);
    setNewName('');
    setCustomFields([]);
    toast.success(`Account "${newName}" created successfully`);
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    const selectableAccounts = filteredAccounts.filter(a => !a.isSystem);
    if (selectedIds.length === selectableAccounts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(selectableAccounts.map(a => a.id));
    }
  };

  const handleDeleteSelected = () => {
    const count = selectedIds.length;
    deleteAccounts(selectedIds);
    setAccounts(getAccounts());
    setSelectedIds([]);
    setIsDeleteDialogOpen(false);
    toast.success(`${count} account(s) deleted successfully`);
  };

  const handleDeleteSingle = () => {
    if (deletingAccountId) {
      deleteAccounts([deletingAccountId]);
      setDeletingAccountId(null);
      toast.success('Account deleted successfully');
      setAccounts(getAccounts());
    }
  };

  const handleBatchUpdate = () => {
    const selectedAccounts = accounts.filter(acc => selectedIds.includes(acc.id) && !acc.isSystem);
    
    const updatedAccounts = selectedAccounts.map(acc => ({
      ...acc,
      type: batchType === 'keep' ? acc.type : batchType,
      metadata: clearMetadata ? undefined : acc.metadata
    }));
    
    saveAccounts(updatedAccounts);
    setAccounts(getAccounts());
    setSelectedIds([]);
    setIsBatchDialogOpen(false);
    setBatchType('keep');
    setClearMetadata(false);
    toast.success(`Batch update completed for ${updatedAccounts.length} accounts`);
  };

  const handleExportCSV = () => {
    // Get all unique metadata keys
    const metadataKeys: string[] = Array.from(new Set(
      filteredAccounts.flatMap(acc => acc.metadata ? Object.keys(acc.metadata) : [])
    ));

    const headers = ['ID', 'Name', 'Type', 'Balance', ...metadataKeys];
    const rows = filteredAccounts.map(acc => [
      acc.id,
      acc.name,
      acc.type,
      getAccountBalance(acc.id).toString(),
      ...metadataKeys.map(key => acc.metadata?.[key] || '')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `accounts_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Accounts exported to CSV successfully');
  };

  const handleSort = (key: 'name') => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredAccounts = accounts
    .filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      
      const valA = a[sortConfig.key].toLowerCase();
      const valB = b[sortConfig.key].toLowerCase();
      
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const getAccountCategory = (acc: AccountHead) => {
    const name = acc.name.toLowerCase();
    const isBankOrApp = name.includes('bank') || name.includes('pay') || acc.id.startsWith('wallet-');
    
    if (acc.id === 'cash-001' || isBankOrApp) return 'Cash & Banks';
    if (acc.type === 'Asset') return 'Parties (Receivables)';
    if (acc.type === 'Liability') return 'Liabilities (Payables)';
    return acc.type;
  };

  const groupedAccounts = filteredAccounts.reduce((groups: Record<string, AccountHead[]>, acc) => {
    const category = getAccountCategory(acc);
    if (!groups[category]) groups[category] = [];
    groups[category].push(acc);
    return groups;
  }, {});

  const categories = ['Cash & Banks', 'Parties (Receivables)', 'Liabilities (Payables)', 'Equity', 'Revenue', 'Expense'];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">Chart of Accounts</h2>
          <p className="text-sm text-slate-500">System-wide registry of financial entities and classifications.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleExportCSV} className="h-11 px-6 border-slate-200 text-slate-600 hover:bg-slate-50">
            <FileDown className="w-4 h-4 mr-2" /> Export CSV
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger render={
              <Button variant="outline" className="brutal-btn-primary h-11 px-6">
                <Plus className="w-4 h-4 mr-2" /> Add Account
              </Button>
            } />
          <DialogContent className="p-0 overflow-hidden rounded-xl border-slate-200 shadow-lg">
            <DialogHeader className="p-6 border-b border-slate-100 bg-slate-50/50">
              <DialogTitle className="text-lg font-bold text-slate-900">Create New Account Head</DialogTitle>
            </DialogHeader>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-slate-500">Account Name</Label>
                <Input id="name" placeholder="e.g. Party A, Office Rent..." value={newName} onChange={(e) => setNewName(e.target.value)} className="bg-white border-slate-200 rounded-lg h-10 font-medium" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type" className="text-xs font-semibold uppercase tracking-wider text-slate-500">Account Type</Label>
                <Select value={newType} onValueChange={(v) => setNewType(v as AccountType)}>
                  <SelectTrigger className="bg-white border-slate-200 rounded-lg h-10 font-medium">
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asset">Asset (Receivables, Cash)</SelectItem>
                    <SelectItem value="Liability">Liability (Payables, Loans)</SelectItem>
                    <SelectItem value="Equity">Equity (Capital)</SelectItem>
                    <SelectItem value="Revenue">Revenue (Sales, Income)</SelectItem>
                    <SelectItem value="Expense">Expense (Rent, Salaries)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Custom Fields</Label>
                  <Button variant="ghost" size="sm" onClick={addCustomField} className="h-7 text-[10px] font-bold uppercase gap-1 border border-slate-200 rounded-md">
                    <Plus className="w-3 h-3" /> Add Field
                  </Button>
                </div>
                
                <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
                  {customFields.map((field, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <Input 
                        placeholder="Field Name" 
                        value={field.key} 
                        onChange={(e) => updateCustomField(index, 'key', e.target.value)}
                        className="h-8 text-[10px] bg-white border-slate-200 rounded-md"
                      />
                      <Input 
                        placeholder="Value" 
                        value={field.value} 
                        onChange={(e) => updateCustomField(index, 'value', e.target.value)}
                        className="h-8 text-[10px] bg-white border-slate-200 rounded-md"
                      />
                      <Button variant="ghost" size="icon" onClick={() => removeCustomField(index)} className="h-8 w-8 shrink-0 text-slate-400 hover:text-slate-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              
              <Button className="w-full mt-4 brutal-btn-primary" onClick={handleAddAccount}>Create Account</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>

      <Card className="glass-card bg-white">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search accounts..." 
              className="pl-10 h-10 border-slate-200 rounded-lg focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Dialog open={isBatchDialogOpen} onOpenChange={setIsBatchDialogOpen}>
                <DialogTrigger render={
                  <Button variant="outline" className="gap-2 flex-1 sm:flex-none brutal-btn-primary">
                    <Edit3 className="w-4 h-4" />
                    Batch Edit ({selectedIds.length})
                  </Button>
                } />
                <DialogContent className="p-0 overflow-hidden rounded-xl border-slate-200 shadow-lg">
                  <DialogHeader className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <DialogTitle className="text-lg font-bold text-slate-900">Batch Edit Accounts</DialogTitle>
                  </DialogHeader>
                  <div className="p-6 space-y-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Update Account Type</Label>
                      <Select value={batchType} onValueChange={(v) => setBatchType(v as AccountType | 'keep')}>
                        <SelectTrigger className="bg-white border-slate-200 rounded-lg h-10 font-medium">
                          <SelectValue placeholder="Select type..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="keep">Keep Original Type</SelectItem>
                          <SelectItem value="Asset">Asset (Receivables, Cash)</SelectItem>
                          <SelectItem value="Liability">Liability (Payables, Loans)</SelectItem>
                          <SelectItem value="Equity">Equity (Capital)</SelectItem>
                          <SelectItem value="Revenue">Revenue (Sales, Income)</SelectItem>
                          <SelectItem value="Expense">Expense (Rent, Salaries)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2 p-4 bg-slate-50 rounded-lg border border-slate-100">
                      <Checkbox 
                        id="clear-metadata" 
                        checked={clearMetadata} 
                        onCheckedChange={(checked) => setClearMetadata(!!checked)}
                        className="rounded-md border-slate-300"
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label htmlFor="clear-metadata" className="text-sm font-bold text-slate-900 cursor-pointer">Clear Custom Fields</Label>
                        <p className="text-[10px] text-slate-500 font-medium">Remove all metadata/tags from selected accounts.</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <Button className="w-full brutal-btn-primary" onClick={handleBatchUpdate}>Apply Changes</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogTrigger render={
                  <Button variant="destructive" className="gap-2 flex-1 sm:flex-none brutal-btn-black">
                    <Trash2 className="w-4 h-4" />
                    Delete ({selectedIds.length})
                  </Button>
                } />
              <AlertDialogContent className="p-0 overflow-hidden rounded-xl border-slate-200">
                <AlertDialogHeader className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-3 text-slate-900">
                    <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-rose-600" />
                    </div>
                    <AlertDialogTitle className="text-lg font-bold">Confirm Deletion</AlertDialogTitle>
                  </div>
                </AlertDialogHeader>
                <div className="p-6">
                  <AlertDialogDescription className="text-sm text-slate-600">
                    This will permanently delete <strong>{selectedIds.length}</strong> selected account(s). 
                    This action is <strong>irreversible</strong> and cannot be undone.
                  </AlertDialogDescription>
                </div>
                <AlertDialogFooter className="p-6 border-t border-slate-100 bg-slate-50/50">
                  <AlertDialogCancel variant="outline" size="default" className="bg-white text-slate-900 border border-slate-200 px-4 py-2 font-semibold rounded-lg transition-all hover:bg-slate-50">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteSelected} className="bg-rose-600 text-white hover:bg-rose-700 rounded-lg px-4 py-2 font-semibold transition-all">
                    Delete Accounts
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-hidden">
            <ScrollArea className="w-full">
              <div className="min-w-[800px]">
                <Table>
                  <TableHeader className="bg-slate-50/50 border-b border-slate-100">
                    <TableRow className="hover:bg-transparent border-none">
                      <TableHead className="w-[50px]">
                        <Checkbox 
                          checked={selectedIds.length > 0 && selectedIds.length === filteredAccounts.filter(a => !a.isSystem).length}
                          onCheckedChange={toggleAll}
                          aria-label="Select all"
                          className="rounded-md border-slate-300"
                        />
                      </TableHead>
                      <TableHead 
                        className="text-[11px] font-bold uppercase tracking-wider text-slate-500 cursor-pointer hover:text-slate-900 transition-colors"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center gap-2">
                          Account Name
                          {sortConfig.key === 'name' ? (
                            sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-30" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Type</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">Current Balance</TableHead>
                      <TableHead className="w-[120px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map(category => {
                      const categoryAccounts = groupedAccounts[category];
                      if (!categoryAccounts || categoryAccounts.length === 0) return null;

                      return (
                        <React.Fragment key={category}>
                          <TableRow className="bg-slate-50/30 hover:bg-slate-50/30 border-y border-slate-100">
                            <TableCell colSpan={5} className="py-2 px-6">
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
                                {category}
                              </span>
                            </TableCell>
                          </TableRow>
                          {categoryAccounts.map((acc) => {
                            const balance = getAccountBalance(acc.id);
                            const isSelected = selectedIds.includes(acc.id);
                            return (
                              <TableRow 
                                key={acc.id} 
                                className={cn(
                                  "hover:bg-slate-50 transition-colors group border-b border-slate-100",
                                  isSelected && "bg-blue-50/50"
                                )}
                              >
                                <TableCell>
                                  {!acc.isSystem && (
                                    <Checkbox 
                                      checked={isSelected}
                                      onCheckedChange={() => toggleSelection(acc.id)}
                                      aria-label={`Select ${acc.name}`}
                                      className="rounded-md border-slate-300"
                                    />
                                  )}
                                </TableCell>
                                <TableCell className="font-semibold text-slate-900">
                                  <div className={cn(
                                    "flex items-center gap-2",
                                    balance === 0 && "text-slate-500 font-medium"
                                  )}>
                                    {acc.isSystem && <ShieldCheck className={cn("w-4 h-4", balance === 0 ? "text-slate-400" : "text-blue-600")} />}
                                    {acc.name}
                                    {balance === 0 && (
                                      <span className="text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded border border-slate-200">
                                        No Active Balance
                                      </span>
                                    )}
                                  </div>
                                  {acc.metadata && Object.keys(acc.metadata).length > 0 && (
                                    <div className={cn("flex flex-wrap gap-1 mt-1.5", balance === 0 && "opacity-60")}>
                                      {Object.entries(acc.metadata).map(([key, value]) => (
                                        <span key={key} className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                          {key}: {value}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <span className={cn(
                                    "text-[10px] font-bold uppercase px-2 py-1 rounded-md",
                                    balance === 0 ? "bg-slate-50 text-slate-400 border border-slate-100" : "bg-slate-100 text-slate-600"
                                  )}>
                                    {acc.type}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right font-medium text-slate-900">
                                  <span className={cn(
                                    "tabular-nums mono-value",
                                    balance === 0 && "text-slate-400 font-normal"
                                  )}>
                                    Rs. <CountUp value={Math.abs(balance)} formatter={(v) => new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)} />
                                  </span>
                                  <span className={cn(
                                    "text-[10px] ml-1.5 font-bold px-1.5 py-0.5 rounded",
                                    balance > 0 ? "bg-emerald-50 text-emerald-600" : 
                                    balance < 0 ? "bg-rose-50 text-rose-600" : 
                                    "bg-slate-100 text-slate-400"
                                  )}>
                                    {balance > 0 ? 'DR' : balance < 0 ? 'CR' : 'NIL'}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center justify-end gap-2">
                                    <Button variant="ghost" size="sm" className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg h-8">View Ledger</Button>
                                    {!acc.isSystem && (
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => setDeletingAccountId(acc.id)}
                                        className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg h-8 w-8 p-0"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deletingAccountId} onOpenChange={(open) => !open && setDeletingAccountId(null)}>
        <AlertDialogContent className="p-0 overflow-hidden rounded-xl border-slate-200">
          <AlertDialogHeader className="p-6 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3 text-slate-900">
              <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <AlertDialogTitle className="text-lg font-bold">Confirm Deletion</AlertDialogTitle>
            </div>
          </AlertDialogHeader>
          <div className="p-6">
            <AlertDialogDescription className="text-sm text-slate-600">
              Are you sure you want to delete the account <strong>{accounts.find(a => a.id === deletingAccountId)?.name}</strong>?
              This action is <strong>irreversible</strong> and cannot be undone.
            </AlertDialogDescription>
          </div>
          <AlertDialogFooter className="p-6 border-t border-slate-100 bg-slate-50/50">
            <AlertDialogCancel variant="outline" size="default" className="bg-white text-slate-900 border border-slate-200 px-4 py-2 font-semibold rounded-lg transition-all hover:bg-slate-50">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSingle} className="bg-rose-600 text-white hover:bg-rose-700 rounded-lg px-4 py-2 font-semibold transition-all">
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
