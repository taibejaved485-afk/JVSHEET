"use client"

import * as React from "react"
import { format, parseISO } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  date?: string
  setDate: (date: string) => void
  className?: string
}

export function DatePicker({ date, setDate, className }: DatePickerProps) {
  const selectedDate = date ? parseISO(date) : undefined

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-black uppercase text-xs tracking-widest bg-white border-2 border-black h-10 rounded-none",
              !date && "text-muted-foreground",
              className
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
          </Button>
        }
      />
      <PopoverContent className="w-auto p-0 glass-card border-2 border-black rounded-none" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(d) => {
            if (d) {
              // Store as YYYY-MM-DD to maintain compatibility with existing state
              setDate(format(d, "yyyy-MM-dd"))
            }
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
