/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Sun, Sunset, Sunrise, Moon, Navigation, Plus, Inbox } from 'lucide-react';
import { Task, TaskPeriod } from '../types';
import TaskCard from './TaskCard';

interface TimelineProps {
  selectedDateStr: string;
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onQuickAddAtHour: (hour: number, period: TaskPeriod) => void;
  nowHour: number;
  nowMinute: number;
}

const getTodayStr = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6h to 23h

export default function Timeline({
  selectedDateStr,
  tasks,
  onToggleComplete,
  onDelete,
  onQuickAddAtHour,
  nowHour,
  nowMinute,
}: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [markerTop, setMarkerTop] = useState<number | null>(null);

  // Group tasks for today
  const todayTasks = tasks.filter((t) => t.date === selectedDateStr);

  // Calculate the vertical marker top position relative to the timeline container
  useEffect(() => {
    const updateMarkerPosition = () => {
      // Only show marker if viewing today
      const todayStr = getTodayStr();
      if (selectedDateStr !== todayStr) {
        setMarkerTop(null);
        return;
      }

      if (nowHour < 6 || nowHour > 23) {
        setMarkerTop(null);
        return;
      }

      const activeRow = document.getElementById(`hour-row-${nowHour}`);
      const container = containerRef.current;

      if (activeRow && container) {
        const rowTop = activeRow.offsetTop;
        const rowHeight = activeRow.offsetHeight;
        const relativeOffset = (nowMinute / 60) * rowHeight;
        setMarkerTop(rowTop + relativeOffset);
      }
    };

    // Update position on mount and whenever times change
    updateMarkerPosition();
    
    // Fallback: search and update after a tiny delay to allow cards to render
    const timer = setTimeout(updateMarkerPosition, 100);

    return () => clearTimeout(timer);
  }, [selectedDateStr, nowHour, nowMinute, todayTasks.length]);

  // Scroll to current hour on load (if viewing today)
  const handleScrollToCurrentTime = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (selectedDateStr === todayStr && nowHour >= 6 && nowHour <= 23) {
      const activeRow = document.getElementById(`hour-row-${nowHour}`);
      if (activeRow) {
        activeRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  useEffect(() => {
    // Auto scroll once on load if it's today
    const timer = setTimeout(() => {
      const todayStr = new Date().toISOString().split('T')[0];
      if (selectedDateStr === todayStr) {
        handleScrollToCurrentTime();
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [selectedDateStr]);

  // Helpers to get period from hour
  const getPeriodForHour = (hour: number): TaskPeriod => {
    if (hour >= 6 && hour < 11) return 'sáng';
    if (hour >= 11 && hour < 14) return 'trưa';
    if (hour >= 14 && hour < 18) return 'chiều';
    return 'tối';
  };

  // Get period general title and styling
  const getPeriodMeta = (period: TaskPeriod) => {
    switch (period) {
      case 'sáng':
        return {
          title: 'Khung Giờ Sáng',
          timeRange: '06:00 - 11:00',
          icon: <Sunrise className="w-5 h-5 text-sky-500" />,
          colorClass: 'time-block-morning border-blue-100/50',
          badgeClass: 'bg-blue-100/60 text-blue-800',
        };
      case 'trưa':
        return {
          title: 'Khung Giờ Trưa',
          timeRange: '11:00 - 14:00',
          icon: <Sun className="w-5 h-5 text-yellow-500" />,
          colorClass: 'time-block-noon border-yellow-100/50',
          badgeClass: 'bg-yellow-100/60 text-yellow-800',
        };
      case 'chiều':
        return {
          title: 'Khung Giờ Chiều',
          timeRange: '14:00 - 18:00',
          icon: <Sunset className="w-5 h-5 text-orange-500" />,
          colorClass: 'time-block-afternoon border-orange-100/50',
          badgeClass: 'bg-orange-100/50 text-orange-800',
        };
      case 'tối':
      default:
        return {
          title: 'Khung Giờ Tối',
          timeRange: '18:00 - 23:00',
          icon: <Moon className="w-5 h-5 text-purple-500" />,
          colorClass: 'time-block-evening border-purple-100/50',
          badgeClass: 'bg-purple-100/50 text-purple-800',
        };
    }
  };

  // Render a specific hour row
  const renderHourRow = (hour: number) => {
    const period = getPeriodForHour(hour);
    // Find tasks specifically scheduled at this hour
    const hourTasks = todayTasks.filter((t) => t.hour === hour);
    
    // Sort tasks: incomplete first, then complete, then by creation date
    const sortedTasks = [...hourTasks].sort((a, b) => {
      if (a.completed && !b.completed) return 1;
      if (!a.completed && b.completed) return -1;
      return a.createdAt - b.createdAt;
    });

    return (
      <div
        key={hour}
        id={`hour-row-${hour}`}
        className="flex border-b border-slate-100/70 min-h-[72px] relative group/row"
      >
        {/* Hour indicator on the left */}
        <div className="w-14 shrink-0 flex flex-col justify-start pt-3 pr-2.5 items-end select-none">
          <span className="text-xs font-bold font-mono text-slate-400">
            {hour < 10 ? `0${hour}` : hour}:00
          </span>
          <button
            onClick={() => onQuickAddAtHour(hour, period)}
            className="mt-1 opacity-0 group-hover/row:opacity-100 p-1 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 transition-all duration-200"
            title={`Thêm việc lúc ${hour}h`}
            id={`quick-add-hour-btn-${hour}`}
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {/* Hour contents container on the right */}
        <div className="flex-1 pl-4 pr-1 py-2.5 flex flex-col gap-2 relative">
          {sortedTasks.length > 0 ? (
            <div className="flex flex-col gap-2">
              {sortedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggleComplete={onToggleComplete}
                  onDelete={onDelete}
                  currentDateStr={selectedDateStr}
                  nowHour={nowHour}
                  nowMinute={nowMinute}
                />
              ))}
            </div>
          ) : (
            // Tiny prompt to add task on empty row (shows on hover)
            <button
              onClick={() => onQuickAddAtHour(hour, period)}
              className="hidden group-hover/row:flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-600 font-medium py-1.5 transition-colors duration-200"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm việc lúc {hour}h
            </button>
          )}
        </div>
      </div>
    );
  };

  // Render a section for tasks assigned to a period but without specific hours (e.g. "Buổi sáng")
  const renderPeriodGeneralTasks = (period: TaskPeriod) => {
    const periodGeneralTasks = todayTasks.filter(
      (t) => t.period === period && t.hour === undefined
    );

    if (periodGeneralTasks.length === 0) return null;

    const sortedTasks = [...periodGeneralTasks].sort((a, b) => {
      if (a.completed && !b.completed) return 1;
      if (!a.completed && b.completed) return -1;
      return a.createdAt - b.createdAt;
    });

    const meta = getPeriodMeta(period);

    return (
      <div className="flex border-b border-dashed border-slate-100 p-3 bg-slate-50/20" id={`general-tasks-${period}`}>
        <div className="w-14 shrink-0 flex flex-col items-end justify-center pr-2.5 select-none">
          <span className="text-[10px] font-bold text-slate-400 text-right leading-tight">Việc Chung</span>
        </div>
        <div className="flex-1 pl-4 pr-1 flex flex-col gap-2">
          {sortedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggleComplete={onToggleComplete}
              onDelete={onDelete}
              currentDateStr={selectedDateStr}
              nowHour={nowHour}
              nowMinute={nowMinute}
            />
          ))}
        </div>
      </div>
    );
  };

  // Render the 4 periods chronologically
  const renderPeriodBlock = (period: TaskPeriod, hoursRange: number[]) => {
    const meta = getPeriodMeta(period);

    return (
      <div className={`rounded-2xl border border-slate-100/80 mb-6 overflow-hidden ${meta.colorClass}`} id={`period-block-${period}`}>
        {/* Block Header */}
        <div className="flex justify-between items-center px-4 py-3 bg-white/75 backdrop-blur-sm border-b border-slate-100/50">
          <div className="flex items-center gap-2">
            {meta.icon}
            <span className="font-bold text-sm text-slate-800 tracking-tight">{meta.title}</span>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${meta.badgeClass}`}>
            {meta.timeRange}
          </span>
        </div>

        {/* Period general tasks (if any) */}
        {renderPeriodGeneralTasks(period)}

        {/* Period hourly rows */}
        <div className="flex flex-col bg-white/20">
          {hoursRange.map((hr) => renderHourRow(hr))}
        </div>
      </div>
    );
  };

  // Filter tasks that have no fixed time ('không_gấp')
  const noTimeTasks = todayTasks.filter((t) => t.period === 'không_gấp');
  const sortedNoTimeTasks = [...noTimeTasks].sort((a, b) => {
    if (a.completed && !b.completed) return 1;
    if (!a.completed && b.completed) return -1;
    return a.createdAt - b.createdAt;
  });

  const isToday = selectedDateStr === getTodayStr();

  return (
    <div className="relative flex flex-col flex-1" id="timeline-container">
      {/* Scroll to current time button */}
      {isToday && nowHour >= 6 && nowHour <= 23 && (
        <button
          onClick={handleScrollToCurrentTime}
          className="absolute top-2 right-4 z-10 flex items-center gap-1 bg-white hover:bg-slate-50 text-indigo-600 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm border border-slate-100 transition-all duration-200"
          id="scroll-to-now-btn"
        >
          <Navigation className="w-3 h-3 rotate-45 text-indigo-500 fill-indigo-100" /> Giờ hiện tại
        </button>
      )}

      {/* 1. SECTION: Việc không có giờ cố định (Separate at the top/bottom as requested) */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100/60 mb-5" id="unplanned-tasks-box">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <Inbox className="w-5 h-5 text-slate-400" />
            <h3 className="font-bold text-sm text-slate-700 tracking-tight">Việc chưa xếp lịch (Không gấp)</h3>
          </div>
          <span className="text-xs font-bold font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">
            {noTimeTasks.length} việc
          </span>
        </div>

        {noTimeTasks.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {sortedNoTimeTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggleComplete={onToggleComplete}
                onDelete={onDelete}
                currentDateStr={selectedDateStr}
                nowHour={nowHour}
                nowMinute={nowMinute}
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic py-1">
            Không có công việc chưa xếp lịch.
          </p>
        )}
      </div>

      {/* 2. THE TIMELINE GRAPHIC CONTAINER */}
      <div ref={containerRef} className="relative select-none flex-1 pb-20">
        {/* Dynamic Real-time horizontal line marker */}
        {markerTop !== null && (
          <div
            className="absolute left-0 right-0 z-10 flex items-center pointer-events-none transition-all duration-500"
            style={{ top: `${markerTop}px` }}
            id="realtime-timeline-marker"
          >
            {/* The line */}
            <div className="w-14 shrink-0 flex justify-end pr-1.5">
              <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-100/60 shadow-sm leading-none font-mono">
                {nowHour < 10 ? `0${nowHour}` : nowHour}:{nowMinute < 10 ? `0${nowMinute}` : nowMinute}
              </span>
            </div>
            {/* Pulsing red dot */}
            <div className="relative flex items-center justify-center">
              <span className="absolute inline-flex h-3 w-3 rounded-full bg-rose-400 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
            </div>
            <div className="flex-1 h-0.5 border-t-2 border-dashed border-rose-400 ml-1.5" />
          </div>
        )}

        {/* Render 4 blocks */}
        {renderPeriodBlock('sáng', [6, 7, 8, 9, 10])}
        {renderPeriodBlock('trưa', [11, 12, 13])}
        {renderPeriodBlock('chiều', [14, 15, 16, 17])}
        {renderPeriodBlock('tối', [18, 19, 20, 21, 22, 23])}
      </div>
    </div>
  );
}
