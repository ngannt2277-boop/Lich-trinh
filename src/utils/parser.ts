/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TaskPeriod } from '../types';

interface ParsedTask {
  title: string;
  period: TaskPeriod;
  timeLabel: string;
  hour?: number;
  minute?: number;
  isNextDay: boolean;
  isYesterday: boolean;
}

export function parseVietnameseTask(input: string): ParsedTask {
  const text = input.trim();
  if (!text) {
    return {
      title: '',
      period: 'không_gấp',
      timeLabel: 'Không có giờ',
      isNextDay: false,
      isYesterday: false,
    };
  }

  let title = text;
  let period: TaskPeriod = 'không_gấp';
  let timeLabel = '';
  let hour: number | undefined = undefined;
  let minute: number | undefined = undefined;
  let isNextDay = false;
  let isYesterday = false;

  // 1. Detect date cues
  const lowerText = text.toLowerCase();
  
  if (/\b(ngày mai|mai)\b/.test(lowerText)) {
    isNextDay = true;
    title = title.replace(/\b(ngày mai|mai)\b/gi, '');
  } else if (/\b(ngày kia|kia)\b/.test(lowerText)) {
    // optional extra date cue
    title = title.replace(/\b(ngày kia|kia)\b/gi, '');
  } else if (/\b(hôm qua|qua)\b/.test(lowerText)) {
    isYesterday = true;
    title = title.replace(/\b(hôm qua|qua)\b/gi, '');
  } else if (/\b(hôm nay|nay)\b/.test(lowerText)) {
    title = title.replace(/\b(hôm nay|nay)\b/gi, '');
  }

  // Helper clean function for regex replacements
  const cleanTitleParts = (regex: RegExp) => {
    title = title.replace(regex, ' ');
  };

  // 2. Detect specific hour patterns: e.g., "15h30", "9h", "14:15", "8 giờ rưỡi", "20g"
  // Pattern 1: HHhMM or HHgMM or HH:MM or HH h or HH g
  const hourMinRegex = /\b(\d{1,2})([h|g|:])[\s]*(\d{1,2})?\b/i;
  // Pattern 2: HH giờ MM or HH giờ rưỡi
  const hourWordRegex = /\b(\d{1,2})\s*(giờ)\s*(\d{1,2}|rưỡi)?\b/i;

  const match1 = title.match(hourMinRegex);
  const match2 = title.match(hourWordRegex);

  if (match1) {
    const rawHour = parseInt(match1[1], 10);
    const separator = match1[2];
    const rawMin = match1[3] ? parseInt(match1[3], 10) : 0;

    if (rawHour >= 0 && rawHour <= 23 && rawMin >= 0 && rawMin <= 59) {
      hour = rawHour;
      minute = rawMin;
      timeLabel = `${rawHour}h${rawMin > 0 ? (rawMin < 10 ? '0' + rawMin : rawMin) : ''}`;
      cleanTitleParts(hourMinRegex);
    }
  } else if (match2) {
    const rawHour = parseInt(match2[1], 10);
    const minWord = match2[3];
    let rawMin = 0;
    if (minWord === 'rưỡi') {
      rawMin = 30;
    } else if (minWord) {
      rawMin = parseInt(minWord, 10);
    }

    if (rawHour >= 0 && rawHour <= 23 && rawMin >= 0 && rawMin <= 59) {
      hour = rawHour;
      minute = rawMin;
      timeLabel = `${rawHour}h${rawMin > 0 ? (rawMin < 10 ? '0' + rawMin : rawMin) : ''}`;
      cleanTitleParts(hourWordRegex);
    }
  }

  // 3. Match general period cues (if specific hour wasn't found, or to map specific hour to period)
  const isSáng = /\b(sáng|buổi sáng)\b/i.test(title);
  const isTrưa = /\b(trưa|buổi trưa)\b/i.test(title);
  const isChiều = /\b(chiều|buổi chiều)\b/i.test(title);
  const isTối = /\b(tối|buổi tối|đêm|khuya)\b/i.test(title);

  // Strip period words from title
  if (isSáng) {
    cleanTitleParts(/\b(sáng|buổi sáng)\b/gi);
    if (hour === undefined) period = 'sáng';
  }
  if (isTrưa) {
    cleanTitleParts(/\b(trưa|buổi trưa)\b/gi);
    if (hour === undefined) period = 'trưa';
  }
  if (isChiều) {
    cleanTitleParts(/\b(chiều|buổi chiều)\b/gi);
    if (hour === undefined) period = 'chiều';
  }
  if (isTối) {
    cleanTitleParts(/\b(tối|buổi tối|đêm|khuya)\b/gi);
    if (hour === undefined) period = 'tối';
  }

  // If specific hour was matched, map it to a period automatically
  if (hour !== undefined) {
    if (hour >= 6 && hour < 11) {
      period = 'sáng';
    } else if (hour >= 11 && hour < 14) {
      period = 'trưa';
    } else if (hour >= 14 && hour < 18) {
      period = 'chiều';
    } else if (hour >= 18 && hour <= 23) {
      period = 'tối';
    } else {
      // Hours outside 6h - 23h (e.g. 24h/0h - 5h)
      if (hour < 6) {
        period = 'sáng'; // Early morning
      } else {
        period = 'tối';
      }
    }
  } else {
    // No exact hour matched, but we have period words
    if (period === 'sáng') {
      timeLabel = 'Buổi sáng';
    } else if (period === 'trưa') {
      timeLabel = 'Buổi trưa';
    } else if (period === 'chiều') {
      timeLabel = 'Buổi chiều';
    } else if (period === 'tối') {
      timeLabel = 'Buổi tối';
    } else {
      period = 'không_gấp';
      timeLabel = 'Không có giờ';
    }
  }

  // 4. Clean up auxiliary words from title (like "vào lúc", "lúc", "vào", "đi", "để", dashes, double spaces)
  // Clean up starting/trailing prepositions or connectives
  title = title
    .replace(/\b(vào lúc|vào|lúc|ở|tại|đi|để|làm)\b/gi, ' ')
    .replace(/[-–—,._+]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Capitalize first letter
  if (title.length > 0) {
    title = title.charAt(0).toUpperCase() + title.slice(1);
  } else {
    title = 'Việc mới';
  }

  return {
    title,
    period,
    timeLabel,
    hour,
    minute,
    isNextDay,
    isYesterday,
  };
}
