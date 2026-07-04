/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Trash2, Clock, CalendarDays } from 'lucide-react';
import { Task } from '../types';
import { getTaskVisualState, getStateColors } from '../utils/status';

interface TaskCardProps {
  key?: string;
  task: Task;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  currentDateStr: string;
  nowHour: number;
  nowMinute: number;
}

export default function TaskCard({
  task,
  onToggleComplete,
  onDelete,
  currentDateStr,
  nowHour,
  nowMinute,
}: TaskCardProps) {
  const visualState = getTaskVisualState(task, currentDateStr, nowHour, nowMinute);
  const colors = getStateColors(visualState);

  // Friendly Vietnamese status label
  const getStatusLabel = () => {
    if (task.completed) return 'Hoàn thành';
    if (visualState === 'active') return 'Đang diễn ra';
    if (visualState === 'overdue') return 'Đã trễ';
    return 'Chưa diễn ra';
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`group flex items-center justify-between p-3.5 rounded-xl border ${colors.bg} ${colors.border} transition-all duration-300 shadow-sm`}
      id={`task-card-${task.id}`}
    >
      <div className="flex items-center gap-3.5 flex-1 min-w-0">
        {/* Custom Circular Checkbox */}
        <button
          onClick={() => onToggleComplete(task.id)}
          className={`w-6 h-6 rounded-full flex items-center justify-center border-2 shrink-0 transition-all duration-300 focus:outline-none ${
            task.completed
              ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-100'
              : visualState === 'overdue'
              ? 'border-rose-400 hover:border-rose-600 bg-rose-50/20'
              : visualState === 'active'
              ? 'border-amber-400 hover:border-amber-600 bg-amber-50/20'
              : 'border-slate-300 hover:border-slate-400 bg-white'
          }`}
          id={`task-checkbox-${task.id}`}
        >
          {task.completed && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </motion.div>
          )}
        </button>

        {/* Task Title & Details */}
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm leading-relaxed break-words transition-colors duration-300 ${colors.text}`}
          >
            {task.title}
          </p>

          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1 text-xs">
            {/* Time label */}
            {task.timeLabel && task.timeLabel !== 'Không có giờ' && (
              <span className="flex items-center gap-1 text-slate-400 font-medium font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {task.timeLabel}
              </span>
            )}

            {/* Visual State Tag */}
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase font-mono ${colors.badge}`}
            >
              {getStatusLabel()}
            </span>
          </div>
        </div>
      </div>

      {/* Action buttons (Delete) */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 ml-2">
        <button
          onClick={() => onDelete(task.id)}
          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors duration-200"
          title="Xóa công việc"
          id={`task-delete-${task.id}`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
export { getTaskVisualState };
