/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AccountHead, Voucher, VoucherType } from '../types';

const STORAGE_KEYS = {
  ACCOUNTS: 'accounting_accounts',
  VOUCHERS: 'accounting_vouchers',
};

const DEFAULT_ACCOUNTS: AccountHead[] = [
  { id: 'cash-001', name: 'Cash Account', type: 'Asset', isSystem: true },
  { id: 'rent-001', name: 'Office Rent', type: 'Expense' },
  { id: 'sales-001', name: 'Sales Revenue', type: 'Revenue' },
];

export const getAccounts = (): AccountHead[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(DEFAULT_ACCOUNTS));
    return DEFAULT_ACCOUNTS;
  }
  return JSON.parse(stored);
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
        });
      }
    });
  });

  return ledgerEntries;
};
