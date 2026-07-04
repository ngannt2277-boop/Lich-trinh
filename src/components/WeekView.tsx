/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Task } from '../types';

interface WeekViewProps {
  selectedDateStr: string; // YYYY-MM-DD
  onSelectDate: (dateStr: string) => void;
  tasks: Task[];
}

// Helpers for dates
const getWeekDays = (referenceDateStr: string) => {
  let refDate = new Date(referenceDateStr);
  if (!referenceDateStr || isNaN(refDate.getTime())) {
    refDate = new Date();
  }
  const day = refDate.getDay();
  // Adjust so Monday is index 0, Sunday is index 6
  const diff = refDate.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(refDate.setDate(diff));

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
};

const formatDateStr = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const VIETNAMESE_DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export default function WeekView({ selectedDateStr, onSelectDate, tasks }: WeekViewProps) {
  const weekDays = getWeekDays(selectedDateStr);
  const todayStr = formatDateStr(new Date());

  // Group tasks by date string for the dots
  const getTaskStatsForDate = (dateStr: string) => {
    const dayTasks = tasks.filter((t) => t.date === dateStr);
    const completed = dayTasks.filter((t) => t.completed).length;
    return {
      total: dayTasks.length,
      completed,
      pending: dayTasks.length - completed,
    };
  };

  // Month-Year label for the header
  const currentMonthYearLabel = () => {
    let currentRef = new Date(selectedDateStr);
    if (!selectedDateStr || isNaN(currentRef.getTime())) {
      currentRef = new Date();
    }
    const month = currentRef.getMonth() + 1;
    const year = currentRef.getFullYear();
    return `Tháng ${month}, ${year}`;
  };

  const navigateWeek = (weeksOffset: number) => {
    let currentRef = new Date(selectedDateStr);
    if (!selectedDateStr || isNaN(currentRef.getTime())) {
      currentRef = new Date();
    }
    currentRef.setDate(currentRef.getDate() + weeksOffset * 7);
    onSelectDate(formatDateStr(currentRef));
  };

  const handleGoToday = () => {
    onSelectDate(todayStr);
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100/60 mb-4" id="week-view-container">
      {/* Header controls */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-1.5 text-slate-800">
          <Calendar className="w-5 h-5 text-indigo-500" />
          <span className="font-bold text-base tracking-tight">{currentMonthYearLabel()}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Today quick action button */}
          {selectedDateStr !== todayStr && (
            <button
              onClick={handleGoToday}
              className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-full transition-colors duration-200"
              id="today-btn"
            >
              Hôm nay
            </button>
          )}

          {/* Navigation chevrons */}
          <div className="flex items-center bg-slate-50 border border-slate-100 rounded-full p-0.5">
            <button
              onClick={() => navigateWeek(-1)}
              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-white rounded-full transition-all duration-200"
              title="Tuần trước"
              id="prev-week-btn"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigateWeek(1)}
              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-white rounded-full transition-all duration-200"
              title="Tuần sau"
              id="next-week-btn"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Week Grid (7 columns) */}
      <div className="grid grid-cols-7 gap-1 bg-slate-100/60 p-1 rounded-2xl">
        {weekDays.map((date, index) => {
          const dateStr = formatDateStr(date);
          const isSelected = dateStr === selectedDateStr;
          const isToday = dateStr === todayStr;
          const stats = getTaskStatsForDate(dateStr);
          const vnDayLabel = VIETNAMESE_DAYS[date.getDay()];

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={`flex flex-col items-center py-2 rounded-xl transition-all duration-200 relative focus:outline-none ${
                isSelected
                  ? 'bg-white text-blue-600 shadow-sm'
                  : isToday
                  ? 'bg-blue-50/50 text-blue-600 font-semibold'
                  : 'text-slate-500 hover:bg-white/50'
              }`}
              id={`week-day-cell-${dateStr}`}
            >
              {/* Day label (T2, T3...) */}
              <span
                className={`text-[10px] font-bold uppercase mb-1 ${
                  isSelected ? 'text-blue-600' : 'text-slate-400'
                }`}
              >
                {vnDayLabel}
              </span>

              {/* Day Number */}
              <span className="text-lg font-semibold leading-none mb-2">
                {date.getDate()}
              </span>

              {/* Activity Dots */}
              <div className="flex justify-center gap-0.5 h-1 w-full px-1">
                {stats.total > 0 ? (
                  // Display up to 3 indicator dots
                  Array.from({ length: Math.min(stats.total, 3) }).map((_, dIdx) => {
                    // Decide if dot represents completed or pending
                    const isDotCompleted = dIdx < stats.completed;
                    return (
                      <span
                        key={dIdx}
                        className={`w-1 h-1 rounded-full ${
                          isSelected
                            ? 'bg-blue-600'
                            : isDotCompleted
                            ? 'bg-emerald-500'
                            : 'bg-slate-300'
                        }`}
                      />
                    );
                  })
                ) : (
                  <span className="w-1 h-1 opacity-0" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
export { formatDateStr };
