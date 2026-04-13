"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { AccountHead, AccountType } from "../types"
import { getAccountBalance } from "../lib/store"
import { formatCurrency } from "../lib/utils"

interface AccountSearchProps {
  accounts: AccountHead[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function AccountSearch({
  accounts,
  value,
  onValueChange,
  placeholder = "Select account...",
  className,
}: AccountSearchProps) {
  const [open, setOpen] = React.useState(false)

  const selectedAccount = accounts.find((account) => account.id === value)

  // Group accounts by type
  const groupedAccounts = accounts.reduce((acc, account) => {
    if (!acc[account.type]) {
      acc[account.type] = []
    }
    acc[account.type].push(account)
    return acc
  }, {} as Record<AccountType, AccountHead[]>)

  const accountTypes: AccountType[] = ["Asset", "Liability", "Equity", "Revenue", "Expense"]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between bg-white border-2 border-black h-10 font-black uppercase text-xs tracking-widest rounded-none", className)}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              {selectedAccount?.logo ? (
                <span className="text-lg shrink-0">{selectedAccount.logo}</span>
              ) : (
                <Search className="h-3 w-3 shrink-0 opacity-50" />
              )}
              <span className="truncate">
                {selectedAccount ? selectedAccount.name : placeholder}
              </span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        }
      />
      <PopoverContent className="min-w-[--radix-popover-trigger-width] w-[450px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search accounts by name or type..." />
          <CommandList className="max-h-[400px]">
            <CommandEmpty>No account found.</CommandEmpty>
            {accountTypes.map((type) => {
              const typeAccounts = groupedAccounts[type]
              if (!typeAccounts || typeAccounts.length === 0) return null

              return (
                <CommandGroup key={type} heading={type}>
                  {typeAccounts.map((account) => {
                    const balance = getAccountBalance(account.id)
                    return (
                      <CommandItem
                        key={account.id}
                        value={`${account.name} ${account.type}`}
                        onSelect={() => {
                          onValueChange(account.id)
                          setOpen(false)
                        }}
                      >
                          <div className="flex flex-1 items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              {account.logo && (
                                <span className="text-xl w-8 h-8 flex items-center justify-center bg-slate-50 rounded-lg shrink-0">
                                  {account.logo}
                                </span>
                              )}
                              <div className="flex flex-col">
                                <span className="font-black uppercase text-xs">{account.name}</span>
                                <span className="text-[10px] font-black text-black/60 uppercase tracking-widest">{account.type}</span>
                              </div>
                            </div>
                            <div className="text-right">
                            <span className="text-[10px] font-black block uppercase tracking-tighter">Balance</span>
                            <span className={cn(
                              "text-xs font-bold tabular-nums",
                              balance > 0 ? "text-emerald-600" : 
                              balance < 0 ? "text-rose-600" : 
                              "text-slate-400"
                            )}>
                              {formatCurrency(Math.abs(balance))} {balance > 0 ? 'DR' : balance < 0 ? 'CR' : 'NIL'}
                            </span>
                          </div>
                        </div>
                        <Check
                          className={cn(
                            "ml-2 h-4 w-4 shrink-0",
                            value === account.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              )
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
