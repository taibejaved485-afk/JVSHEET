/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';

export interface AccountHead {
  id: string;
  name: string;
  type: AccountType;
  isSystem?: boolean; // e.g., Cash Account
  metadata?: Record<string, string>;
}

export type VoucherType = 'CRV' | 'CPV' | 'JV';

export interface VoucherEntry {
  accountId: string;
  debit: number;
  credit: number;
}

export interface Voucher {
  id: string;
  type: VoucherType;
  date: string;
  description: string;
  entries: VoucherEntry[];
  voucherNumber: string;
}

export interface DashboardStats {
  cashInHand: number;
  totalReceivables: number;
  totalPayables: number;
}
