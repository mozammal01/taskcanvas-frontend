"use client";

import { format, addDays, isSameDay } from "date-fns";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateSelectorProps {
  value: Date;
  onChange: (date: Date) => void;
  className?: string;
}

export function DateSelector({ value, onChange, className }: DateSelectorProps) {
  const today = new Date();

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        variant="outline"
        size="icon"
        aria-label="Previous day"
        onClick={() => onChange(addDays(value, -1))}
      >
        <ChevronLeftIcon />
      </Button>

      <Popover>
        <PopoverTrigger
          render={<Button variant="outline" className="min-w-40 justify-start gap-2" />}
        >
          <CalendarIcon className="size-4" />
          {isSameDay(value, today) ? "Today" : format(value, "EEE, MMM d yyyy")}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(date) => date && onChange(date)}
            autoFocus
          />
        </PopoverContent>
      </Popover>

      <Button
        variant="outline"
        size="icon"
        aria-label="Next day"
        onClick={() => onChange(addDays(value, 1))}
      >
        <ChevronRightIcon />
      </Button>
    </div>
  );
}