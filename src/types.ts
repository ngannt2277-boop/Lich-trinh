/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TaskPeriod = 'sáng' | 'trưa' | 'chiều' | 'tối' | 'không_gấp';

export interface Task {
  id: string;
  title: string;
  date: string; // Format: YYYY-MM-DD
  period: TaskPeriod;
  timeLabel?: string; // Text display like "~9h", "15:30", "Buổi chiều"
  hour?: number; // Numeric hour (6 - 23) if available, for sorting inside timeline
  minute?: number; // Numeric minute (0 - 59) if available
  completed: boolean;
  createdAt: number;
}

export interface DayProgress {
  date: string;
  total: number;
  completed: number;
}

export interface TimeMarker {
  currentHour: number;
  currentMinute: number;
  timeString: string;
  period: TaskPeriod | null;
}
