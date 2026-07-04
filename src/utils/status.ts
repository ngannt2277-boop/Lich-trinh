/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Task, TaskPeriod } from '../types';

export type TaskVisualState = 'upcoming' | 'active' | 'overdue' | 'completed';

const PERIOD_ORDER: TaskPeriod[] = ['sáng', 'trưa', 'chiều', 'tối', 'không_gấp'];

export function getTaskVisualState(
  task: Task,
  currentDateStr: string, // YYYY-MM-DD (e.g., today)
  nowHour: number,
  nowMinute: number
): TaskVisualState {
  if (task.completed) {
    return 'completed';
  }

  // Task is in the future relative to currently viewed date
  if (task.date > currentDateStr) {
    return 'upcoming';
  }

  // Task is in the past relative to currently viewed date
  if (task.date < currentDateStr) {
    return 'overdue';
  }

  // Task is on the currently viewed date (which matches today)
  // 1. If task has a specific hour
  if (task.hour !== undefined) {
    const taskMins = task.hour * 60 + (task.minute || 0);
    const nowMins = nowHour * 60 + nowMinute;

    // Red: Overdue by more than 30 minutes
    if (nowMins > taskMins + 30) {
      return 'overdue';
    }
    // Yellow: Active range (30 minutes before up to 30 minutes after scheduled hour)
    if (nowMins >= taskMins - 30 && nowMins <= taskMins + 30) {
      return 'active';
    }
    // Gray: More than 30 minutes in the future
    return 'upcoming';
  }

  // 2. If task does not have a specific hour, but has a broad period
  if (task.period !== 'không_gấp') {
    // Resolve current period based on real-time hour
    let currentPeriod: TaskPeriod = 'không_gấp';
    if (nowHour >= 6 && nowHour < 11) {
      currentPeriod = 'sáng';
    } else if (nowHour >= 11 && nowHour < 14) {
      currentPeriod = 'trưa';
    } else if (nowHour >= 14 && nowHour < 18) {
      currentPeriod = 'chiều';
    } else if (nowHour >= 18 && nowHour <= 23) {
      currentPeriod = 'tối';
    } else {
      currentPeriod = 'tối'; // Early morning (before 6 AM) or late night is grouped into dark/night hours
    }

    if (task.period === currentPeriod) {
      return 'active';
    }

    const taskPeriodIndex = PERIOD_ORDER.indexOf(task.period);
    const currentPeriodIndex = PERIOD_ORDER.indexOf(currentPeriod);

    if (taskPeriodIndex < currentPeriodIndex) {
      // Period has already passed today
      return 'overdue';
    } else {
      // Period is in the future today
      return 'upcoming';
    }
  }

  // 3. For tasks without a fixed time ('không_gấp')
  // They are never overdue or active based on current time. They stay upcoming until completed.
  return 'upcoming';
}

export function getStateColors(state: TaskVisualState) {
  switch (state) {
    case 'completed':
      return {
        bg: 'bg-emerald-50/50 hover:bg-emerald-50/80 border-emerald-100/60',
        border: 'border-l-4 border-l-emerald-500',
        text: 'text-slate-400 line-through',
        badge: 'bg-emerald-100 text-emerald-700',
        bullet: 'bg-emerald-500',
      };
    case 'active':
      return {
        bg: 'bg-amber-50/60 hover:bg-amber-50/90 border-amber-100/70 shadow-sm shadow-amber-50/50',
        border: 'border-l-4 border-l-amber-500',
        text: 'text-slate-800 font-medium',
        badge: 'bg-amber-100 text-amber-800 animate-pulse',
        bullet: 'bg-amber-500',
      };
    case 'overdue':
      return {
        bg: 'bg-rose-50/60 hover:bg-rose-50/90 border-rose-100/70 shadow-sm shadow-rose-50/50',
        border: 'border-l-4 border-l-rose-500',
        text: 'text-rose-950 font-medium',
        badge: 'bg-rose-100 text-rose-700',
        bullet: 'bg-rose-500',
      };
    case 'upcoming':
    default:
      return {
        bg: 'bg-slate-50/50 hover:bg-slate-50/80 border-slate-100/60',
        border: 'border-l-4 border-l-slate-300',
        text: 'text-slate-700',
        badge: 'bg-slate-100 text-slate-600',
        bullet: 'bg-slate-400',
      };
  }
}
