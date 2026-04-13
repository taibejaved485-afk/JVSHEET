/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Receipt, FileText, Users, Calculator, Menu, X, Activity, LogOut } from 'lucide-react';
import { Toaster } from './components/ui/sonner';
import Dashboard from './components/Dashboard';
import VoucherEntry from './components/VoucherEntry';
import LedgerReport from './components/LedgerReport';
import AccountsList from './components/AccountsList';
import { Button } from './components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from './components/ui/sheet';
import { useState, useEffect } from 'react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';

function Navigation({ className, onItemClick }: { className?: string, onItemClick?: () => void }) {
  const location = useLocation();
  
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/vouchers', icon: Receipt, label: 'Voucher Entry' },
    { to: '/ledger', icon: FileText, label: 'Ledger Report' },
    { to: '/accounts', icon: Users, label: 'Accounts' },
  ];

  return (
    <nav className={cn("space-y-1", className)}>
      {navItems.map((item) => {
        const isActive = location.pathname === item.to;
        return (
          <Link 
            key={item.to}
            to={item.to} 
            onClick={onItemClick}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
              isActive 
                ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5",
              isActive ? "text-white" : "text-slate-400 group-hover:text-slate-900"
            )} />
            <span className="font-semibold tracking-wide text-sm">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-600 shadow-sm">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none">Ledger</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">System v4.0.2</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 px-4 py-6 overflow-y-auto">
        <div className="text-[10px] text-black uppercase tracking-[0.2em] font-black mb-4 px-4">Main Menu</div>
        <Navigation onItemClick={onClose} />
      </div>
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <Routes location={location}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/vouchers" element={<VoucherEntry />} />
          <Route path="/ledger" element={<LedgerReport />} />
          <Route path="/accounts" element={<AccountsList />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <Router>
      <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-72 border-r-2 border-black bg-white flex-col sticky top-0 h-screen">
          <SidebarContent />
        </aside>

        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b-2 border-black bg-white text-black sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 border border-black flex items-center justify-center bg-black">
              <Activity className="text-white w-5 h-5" />
            </div>
            <span className="font-black text-lg tracking-tighter uppercase">Ledger</span>
          </div>
          
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger render={
              <Button variant="ghost" size="icon" className="border border-black text-black hover:bg-black hover:text-white">
                <Menu className="w-6 h-6" />
              </Button>
            } />
            <SheetContent side="left" className="p-0 w-72 bg-white border-r-2 border-black">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation Menu</SheetTitle>
              </SheetHeader>
              <SidebarContent onClose={() => setIsMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto relative">
          <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-12">
            <AnimatedRoutes />
          </div>
        </main>
      </div>
      <Toaster position="top-right" theme="dark" richColors />
    </Router>
  );
}
