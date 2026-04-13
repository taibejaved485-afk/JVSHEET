/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { 
  LayoutDashboard, 
  Receipt, 
  FileText, 
  HelpCircle, 
  Info, 
  CheckCircle2, 
  AlertCircle,
  MessageSquare
} from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function HelpModal({ isOpen, onOpenChange }: HelpModalProps) {
  const helpContent = {
    dashboard: [
      { title: "Real-time Telemetry", desc: "Dashboard par aapko apne karobar ki mukammal financial telemetry milti hai." },
      { title: "Cash Liquidity", desc: "Cash aur Bank accounts ka total balance yahan ek sath nazar aata hai." },
      { title: "Low Stock Alerts", desc: "Agar koi item minimum level se kam ho jaye, toh yahan foran alert show hoga." },
      { title: "Currency Distribution", desc: "Pie chart ke zariye dekhein ke aapka paisa kin currencies (PKR, USD, AED) mein hai." }
    ],
    vouchers: [
      { title: "Voucher Types", desc: "CRV (Receipts), CPV (Payments) aur JV (Journal) entries ke liye alag tabs use karein." },
      { title: "Multi-Currency", desc: "USD ya AED mein entry karte waqt exchange rate lazmi enter karein, system PKR value khud nikal lega." },
      { title: "Inventory Integration", desc: "Items select karein taake stock automatically update ho jaye." },
      { title: "Digital Signature", desc: "Save karne se pehle signature pad par sign karna lazmi hai, warna voucher save nahi hoga." }
    ],
    reports: [
      { title: "Smart Filters", desc: "Ledger report mein Voucher ID, Party Name ya Amount range se search karein." },
      { title: "Date Range", desc: "Specific dates ke darmiyan transactions dekhne ke liye date filter use karein." },
      { title: "PDF Export", desc: "Report ko professional format mein download karne ke liye PDF button click karein." }
    ],
    faq: [
      { q: "Signature kyun zaroori hai?", a: "Security aur accountability ke liye signature lazmi rakha gaya hai." },
      { q: "WhatsApp alert kaise jata hai?", a: "Voucher save hote hi system automatically party aur owner ko alert bhej deta hai." },
      { q: "Stock update nahi ho raha?", a: "Check karein ke aapne Voucher Entry mein 'Items/Stock' dropdown se item select kiya hai ya nahi." },
      { q: "Currency rate kahan se aata hai?", a: "Exchange rate aapko manually enter karna hota hai market ke mutabiq." }
    ]
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white border-2 border-black rounded-none p-0 overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <DialogHeader className="p-6 bg-slate-900 text-white border-b-2 border-black">
          <DialogTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
            <HelpCircle className="w-8 h-8 text-blue-400" />
            NeoLedger Help Guide
          </DialogTitle>
          <DialogDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
            System v4.0.2 - User Manual & Documentation
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="w-full justify-start bg-slate-100 rounded-none border-b-2 border-black h-14 p-0">
            <TabsTrigger value="dashboard" className="flex-1 h-full rounded-none data-[state=active]:bg-white data-[state=active]:border-x-2 data-[state=active]:border-black font-black uppercase text-[10px] tracking-widest gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Basics
            </TabsTrigger>
            <TabsTrigger value="vouchers" className="flex-1 h-full rounded-none data-[state=active]:bg-white data-[state=active]:border-x-2 data-[state=active]:border-black font-black uppercase text-[10px] tracking-widest gap-2">
              <Receipt className="w-4 h-4" />
              Vouchers
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex-1 h-full rounded-none data-[state=active]:bg-white data-[state=active]:border-x-2 data-[state=active]:border-black font-black uppercase text-[10px] tracking-widest gap-2">
              <FileText className="w-4 h-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="faq" className="flex-1 h-full rounded-none data-[state=active]:bg-white data-[state=active]:border-x-2 data-[state=active]:border-black font-black uppercase text-[10px] tracking-widest gap-2">
              <MessageSquare className="w-4 h-4" />
              FAQ
            </TabsTrigger>
          </TabsList>

          <div className="p-6">
            <ScrollArea className="h-[350px] pr-4">
              <TabsContent value="dashboard" className="mt-0 space-y-4">
                {helpContent.dashboard.map((item, i) => (
                  <div key={i} className="p-4 border-2 border-slate-100 hover:border-blue-200 transition-colors group">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 p-1 bg-blue-50 text-blue-600 rounded">
                        <Info className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-black uppercase text-xs tracking-wider text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{item.title}</h4>
                        <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="vouchers" className="mt-0 space-y-4">
                {helpContent.vouchers.map((item, i) => (
                  <div key={i} className="p-4 border-2 border-slate-100 hover:border-emerald-200 transition-colors group">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 p-1 bg-emerald-50 text-emerald-600 rounded">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-black uppercase text-xs tracking-wider text-slate-900 mb-1 group-hover:text-emerald-600 transition-colors">{item.title}</h4>
                        <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="reports" className="mt-0 space-y-4">
                {helpContent.reports.map((item, i) => (
                  <div key={i} className="p-4 border-2 border-slate-100 hover:border-purple-200 transition-colors group">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 p-1 bg-purple-50 text-purple-600 rounded">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-black uppercase text-xs tracking-wider text-slate-900 mb-1 group-hover:text-purple-600 transition-colors">{item.title}</h4>
                        <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="faq" className="mt-0 space-y-4">
                {helpContent.faq.map((item, i) => (
                  <div key={i} className="p-4 border-2 border-slate-100 hover:border-amber-200 transition-colors group">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 p-1 bg-amber-50 text-amber-600 rounded">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-black uppercase text-xs tracking-wider text-slate-900 mb-1 group-hover:text-amber-600 transition-colors">Q: {item.q}</h4>
                        <p className="text-sm text-slate-500 leading-relaxed"><span className="font-bold text-slate-900">A:</span> {item.a}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </TabsContent>
            </ScrollArea>
          </div>
        </Tabs>

        <div className="p-4 bg-slate-50 border-t-2 border-black flex justify-between items-center">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">NeoLedger Enterprise Support</p>
          <Button 
            onClick={() => onOpenChange(false)}
            className="bg-black text-white hover:bg-slate-800 rounded-none font-black uppercase text-[10px] tracking-widest px-6 h-9"
          >
            Samajh Gaya
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
