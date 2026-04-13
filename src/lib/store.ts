/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AccountHead, Voucher, VoucherType, InventoryItem } from '../types';

const STORAGE_KEYS = {
  ACCOUNTS: 'accounting_accounts',
  VOUCHERS: 'accounting_vouchers',
  INVENTORY: 'accounting_inventory',
};

const DEFAULT_INVENTORY: InventoryItem[] = [
  { id: 'item-001', name: 'Raw Material A', quantity: 500, unit: 'kg', minStock: 100 },
  { id: 'item-002', name: 'Finished Product X', quantity: 50, unit: 'pcs', minStock: 20 },
  { id: 'item-003', name: 'Packaging Box', quantity: 1000, unit: 'units', minStock: 200 },
];

const DEFAULT_ACCOUNTS: AccountHead[] = [
  { id: 'cash-001', name: 'Cash Account', type: 'Asset', isSystem: true, logo: '💵' },
  // Major Banks
  { id: 'bank-hbl', name: 'HBL (Habib Bank)', type: 'Asset', logo: '🏦' },
  { id: 'bank-meezan', name: 'Meezan Bank', type: 'Asset', logo: '🌙' },
  { id: 'bank-alfalah', name: 'Bank Alfalah', type: 'Asset', logo: '🔴' },
  { id: 'bank-ubl', name: 'UBL', type: 'Asset', logo: '🔵' },
  { id: 'bank-mcb', name: 'MCB Bank', type: 'Asset', logo: '🟢' },
  { id: 'bank-abl', name: 'Allied Bank', type: 'Asset', logo: '🏦' },
  { id: 'bank-faysal', name: 'Faysal Bank', type: 'Asset', logo: '🏦' },
  { id: 'bank-askari', name: 'Askari Bank', type: 'Asset', logo: '🏦' },
  { id: 'bank-sc', name: 'Standard Chartered', type: 'Asset', logo: '🏦' },
  { id: 'bank-alhabib', name: 'Bank AL Habib', type: 'Asset', logo: '🏦' },
  { id: 'bank-habibmetro', name: 'Habib Metro', type: 'Asset', logo: '🏦' },
  { id: 'bank-js', name: 'JS Bank', type: 'Asset', logo: '🏦' },
  { id: 'bank-soneri', name: 'Soneri Bank', type: 'Asset', logo: '🏦' },
  { id: 'bank-bop', name: 'Bank of Punjab', type: 'Asset', logo: '🏦' },
  { id: 'bank-bok', name: 'Bank of Khyber', type: 'Asset', logo: '🏦' },
  { id: 'bank-nbp', name: 'National Bank (NBP)', type: 'Asset', logo: '🇵🇰' },
  { id: 'bank-albaraka', name: 'Al Baraka Bank', type: 'Asset', logo: '🏦' },
  { id: 'bank-dib', name: 'Dubai Islamic Bank', type: 'Asset', logo: '🏦' },
  { id: 'bank-samba', name: 'Samba Bank', type: 'Asset', logo: '🏦' },
  { id: 'bank-silk', name: 'Silkbank', type: 'Asset', logo: '🏦' },
  { id: 'bank-summit', name: 'Summit Bank', type: 'Asset', logo: '🏦' },
  // Digital Wallets & Apps
  { id: 'wallet-easypaisa', name: 'Easypaisa', type: 'Asset', logo: '📱' },
  { id: 'wallet-jazzcash', name: 'JazzCash', type: 'Asset', logo: '📱' },
  { id: 'wallet-sadapay', name: 'SadaPay', type: 'Asset', logo: '💳' },
  { id: 'wallet-nayapay', name: 'NayaPay', type: 'Asset', logo: '💳' },
  { id: 'wallet-finja', name: 'Finja', type: 'Asset', logo: '📱' },
  
  { id: 'rent-001', name: 'Office Rent', type: 'Expense' },
  { id: 'sales-001', name: 'Sales Revenue', type: 'Revenue' },
];

export const getAccounts = (): AccountHead[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(DEFAULT_ACCOUNTS));
    return DEFAULT_ACCOUNTS;
  }
  
  const accounts: AccountHead[] = JSON.parse(stored);
  
  // Ensure all default accounts are present (useful for updates)
  let hasChanges = false;
  DEFAULT_ACCOUNTS.forEach(def => {
    const existingIndex = accounts.findIndex(a => a.id === def.id);
    if (existingIndex === -1) {
      accounts.push(def);
      hasChanges = true;
    } else if (def.logo && accounts[existingIndex].logo !== def.logo) {
      // Update logo if it's missing or different in existing account
      accounts[existingIndex].logo = def.logo;
      hasChanges = true;
    }
  });
  
  if (hasChanges) {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  }
  
  return accounts;
};

export const saveAccount = (account: AccountHead) => {
  const accounts = getAccounts();
  const index = accounts.findIndex((a) => a.id === account.id);
  if (index >= 0) {
    accounts[index] = account;
  } else {
    accounts.push(account);
  }
  localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
};

export const saveAccounts = (updatedAccounts: AccountHead[]) => {
  const accounts = getAccounts();
  const newAccounts = [...accounts];
  
  updatedAccounts.forEach(updated => {
    const index = newAccounts.findIndex(a => a.id === updated.id);
    if (index >= 0) {
      newAccounts[index] = updated;
    } else {
      newAccounts.push(updated);
    }
  });
  
  localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(newAccounts));
};

export const deleteAccounts = (ids: string[]) => {
  const accounts = getAccounts();
  const filtered = accounts.filter(a => !ids.includes(a.id) || a.isSystem);
  localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(filtered));
};

export const getVouchers = (): Voucher[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.VOUCHERS);
  return stored ? JSON.parse(stored) : [];
};

export const saveVoucher = (voucher: Voucher) => {
  const vouchers = getVouchers();
  vouchers.push(voucher);
  localStorage.setItem(STORAGE_KEYS.VOUCHERS, JSON.stringify(vouchers));
};

export const getNextVoucherNumber = (type: VoucherType): string => {
  const vouchers = getVouchers();
  const typeVouchers = vouchers.filter((v) => v.type === type);
  const nextNum = typeVouchers.length + 1;
  return `${type}-${nextNum.toString().padStart(4, '0')}`;
};

export const getAccountBalance = (accountId: string): number => {
  const vouchers = getVouchers();
  let balance = 0;
  vouchers.forEach((v) => {
    v.entries.forEach((e) => {
      if (e.accountId === accountId) {
        balance += e.debit - e.credit;
      }
    });
  });
  return balance;
};

export const getLedger = (accountId: string) => {
  const vouchers = getVouchers();
  const ledgerEntries: any[] = [];
  let runningBalance = 0;

  // Sort vouchers by date
  const sortedVouchers = [...vouchers].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  sortedVouchers.forEach((v) => {
    v.entries.forEach((e) => {
      if (e.accountId === accountId) {
        runningBalance += e.debit - e.credit;
        ledgerEntries.push({
          date: v.date,
          voucherNumber: v.voucherNumber,
          type: v.type,
          description: v.description,
          debit: e.debit,
          credit: e.credit,
          balance: runningBalance,
          attachment: v.attachment,
          referenceNumber: v.referenceNumber,
          paymentMethod: v.paymentMethod,
        });
      }
    });
  });

  return ledgerEntries;
};

export const getInventory = (): InventoryItem[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.INVENTORY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(DEFAULT_INVENTORY));
    return DEFAULT_INVENTORY;
  }
  return JSON.parse(stored);
};

export const saveInventory = (inventory: InventoryItem[]) => {
  localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
};

export const updateInventoryFromVoucher = (voucher: Voucher) => {
  if (!voucher.stockItems || voucher.stockItems.length === 0) return;

  const inventory = getInventory();
  voucher.stockItems.forEach(stockItem => {
    const itemIndex = inventory.findIndex(i => i.id === stockItem.itemId);
    if (itemIndex !== -1) {
      // In CRV (Cash Received), we assume we sold something, so stock decreases
      // In CPV (Cash Paid), we assume we bought something, so stock increases
      if (voucher.type === 'CRV') {
        inventory[itemIndex].quantity -= stockItem.quantity;
      } else if (voucher.type === 'CPV') {
        inventory[itemIndex].quantity += stockItem.quantity;
      }
    }
  });
  saveInventory(inventory);
};
