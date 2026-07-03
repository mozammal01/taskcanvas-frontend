"use client";

import { DateSelector } from "@/components/shared/DateSelector";
import { Board } from "@/components/tasks/Board";
import { useTaskStore } from "@/store/useTaskStore";

export default function TasksPage() {
  const selectedDate = useTaskStore((state) => state.selectedDate);
  const setSelectedDate = useTaskStore((state) => state.setSelectedDate);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h1 className="text-lg font-semibold">Tasks</h1>
        <DateSelector value={selectedDate} onChange={setSelectedDate} />
      </div>
      <Board />
    </div>
  );
}