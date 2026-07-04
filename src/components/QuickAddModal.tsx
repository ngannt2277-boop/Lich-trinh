/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Clock, Calendar, Check, AlertCircle } from 'lucide-react';
import { Task, TaskPeriod } from '../types';
import { parseVietnameseTask } from '../utils/parser';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (taskData: {
    title: string;
    period: TaskPeriod;
    timeLabel: string;
    hour?: number;
    minute?: number;
    targetDateOffset: number; // 0 for today, 1 for tomorrow, -1 for yesterday
  }) => void;
  preselectedHour?: number;
  preselectedPeriod?: TaskPeriod;
}

const QUICK_TEMPLATES = [
  { text: 'Họp team', emoji: '👥' },
  { text: 'Ăn trưa', emoji: '🍱' },
  { text: 'Tập thể dục', emoji: '🏃‍♂️' },
  { text: 'Đi chợ mua đồ', emoji: '🛒' },
  { text: 'Đọc sách', emoji: '📚' },
  { text: 'Uống nước', emoji: '💧' },
  { text: 'Học bài', emoji: '✏️' },
  { text: 'Đi ngủ', emoji: '😴' },
];

const PERIODS: { value: TaskPeriod; label: string; icon: string }[] = [
  { value: 'sáng', label: 'Sáng', icon: '🌅' },
  { value: 'trưa', label: 'Trưa', icon: '☀️' },
  { value: 'chiều', label: 'Chiều', icon: '🌇' },
  { value: 'tối', label: 'Tối', icon: '🌙' },
  { value: 'không_gấp', label: 'Không gấp', icon: '📌' },
];

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6h to 23h

export default function QuickAddModal({
  isOpen,
  onClose,
  onAddTask,
  preselectedHour,
  preselectedPeriod,
}: QuickAddModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // States
  const [nlpInput, setNlpInput] = useState('');
  const [title, setTitle] = useState('');
  const [period, setPeriod] = useState<TaskPeriod>('không_gấp');
  const [hour, setHour] = useState<number | undefined>(undefined);
  const [timeLabel, setTimeLabel] = useState('Không có giờ');
  const [dateOffset, setDateOffset] = useState<number>(0); // 0 = Hôm nay, 1 = Ngày mai
  
  // Real-time parsing info
  const [parsingFeedback, setParsingFeedback] = useState<string>('');

  // Reset fields on open or when preselected changes
  useEffect(() => {
    if (isOpen) {
      setNlpInput('');
      setTitle('');
      setDateOffset(0);

      if (preselectedHour !== undefined) {
        setHour(preselectedHour);
        setPeriod(preselectedPeriod || 'sáng');
        setTimeLabel(`${preselectedHour}h`);
        setTitle('');
      } else if (preselectedPeriod !== undefined) {
        setHour(undefined);
        setPeriod(preselectedPeriod);
        setTimeLabel(preselectedPeriod === 'không_gấp' ? 'Không có giờ' : `Buổi ${preselectedPeriod}`);
        setTitle('');
      } else {
        setHour(undefined);
        setPeriod('không_gấp');
        setTimeLabel('Không có giờ');
      }

      // Auto focus input
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen, preselectedHour, preselectedPeriod]);

  // Handle live typing and natural language processing
  const handleNlpChange = (val: string) => {
    setNlpInput(val);
    if (!val.trim()) {
      setTitle('');
      setParsingFeedback('');
      return;
    }

    const parsed = parseVietnameseTask(val);
    setTitle(parsed.title);
    setPeriod(parsed.period);
    setHour(parsed.hour);
    setTimeLabel(parsed.timeLabel);
    
    if (parsed.isNextDay) {
      setDateOffset(1);
    } else if (parsed.isYesterday) {
      setDateOffset(-1);
    } else {
      setDateOffset(0);
    }

    // Build user-friendly live feedback
    const dateText = parsed.isNextDay ? 'Ngày mai' : parsed.isYesterday ? 'Hôm qua' : 'Hôm nay';
    const timeText = parsed.hour !== undefined ? `${parsed.hour}h` : parsed.period === 'không_gấp' ? 'Chưa xếp lịch' : `Buổi ${parsed.period}`;
    setParsingFeedback(`👉 Nhận diện: "${parsed.title}" vào ${timeText} (${dateText})`);
  };

  // Quick tap template inserts
  const handleTapTemplate = (template: string) => {
    // If there is already text, we can append, otherwise replace
    if (!nlpInput.trim()) {
      handleNlpChange(template);
    } else {
      handleNlpChange(`${nlpInput} ${template}`);
    }
    inputRef.current?.focus();
  };

  // Direct manual overrides
  const handleManualPeriodChange = (p: TaskPeriod) => {
    setPeriod(p);
    if (p === 'không_gấp') {
      setHour(undefined);
      setTimeLabel('Không có giờ');
    } else {
      if (hour !== undefined) {
        // Adjust hour to match the period bounds if needed
        const currentPeriodOfHour = getPeriodForHour(hour);
        if (currentPeriodOfHour !== p) {
          // prefill default hour for period
          const defaultHour = getDefaultHourForPeriod(p);
          setHour(defaultHour);
          setTimeLabel(`${defaultHour}h`);
        }
      } else {
        setTimeLabel(`Buổi ${p}`);
      }
    }
  };

  const handleManualHourChange = (hVal: string) => {
    if (hVal === 'none') {
      setHour(undefined);
      setTimeLabel(period === 'không_gấp' ? 'Không có giờ' : `Buổi ${period}`);
    } else {
      const hNum = parseInt(hVal, 10);
      setHour(hNum);
      setTimeLabel(`${hNum}h`);
      // Update period based on hour row
      const p = getPeriodForHour(hNum);
      setPeriod(p);
    }
  };

  const getPeriodForHour = (h: number): TaskPeriod => {
    if (h >= 6 && h < 11) return 'sáng';
    if (h >= 11 && h < 14) return 'trưa';
    if (h >= 14 && h < 18) return 'chiều';
    return 'tối';
  };

  const getDefaultHourForPeriod = (p: TaskPeriod): number => {
    if (p === 'sáng') return 8;
    if (p === 'trưa') return 12;
    if (p === 'chiều') return 15;
    return 19;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = title.trim() || nlpInput.trim();
    if (!finalTitle) return;

    onAddTask({
      title: finalTitle,
      period,
      timeLabel,
      hour,
      targetDateOffset: dateOffset,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 select-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0.5 }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
            className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-xl border border-slate-100 max-h-[92vh] overflow-y-auto"
            id="quick-add-modal-panel"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                </div>
                <h3 className="font-bold text-lg text-slate-800 tracking-tight">Thêm việc nhanh</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all duration-200"
                id="close-modal-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* NLP Natural Input Field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Gõ việc tự nhiên hoặc chọn form nhanh
                </label>
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={nlpInput}
                    onChange={(e) => handleNlpChange(e.target.value)}
                    placeholder="ví dụ: 9h họp team, chiều mai mua rau..."
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white text-sm font-medium text-slate-800 px-4 py-3 rounded-xl outline-none transition-all duration-200"
                    id="nlp-task-input"
                  />
                  {nlpInput && (
                    <button
                      type="button"
                      onClick={() => handleNlpChange('')}
                      className="absolute right-3 top-3.5 text-xs text-slate-400 hover:text-slate-600"
                    >
                      Xóa
                    </button>
                  )}
                </div>

                {/* NLP Live Preview Panel */}
                <AnimatePresence>
                  {parsingFeedback && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-2.5 flex items-center gap-2 text-xs text-indigo-700 font-medium"
                      id="parsing-feedback-banner"
                    >
                      <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="truncate">{parsingFeedback}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Quick Suggestion Tags */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Gợi ý nhanh (chạm để điền)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_TEMPLATES.map((item) => (
                    <button
                      type="button"
                      key={item.text}
                      onClick={() => handleTapTemplate(item.text)}
                      className="flex items-center gap-1 text-xs font-medium bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200/60 rounded-lg px-2.5 py-1.5 text-slate-600 transition-colors duration-200 focus:outline-none"
                    >
                      <span>{item.emoji}</span>
                      <span>{item.text}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-slate-100 my-1" />

              {/* MANUAL CONTROLS FORM */}
              {/* 1. Date offset selector */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Ngày thực hiện
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDateOffset(0)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all duration-200 focus:outline-none border ${
                      dateOffset === 0
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-100'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    📅 Hôm nay
                  </button>
                  <button
                    type="button"
                    onClick={() => setDateOffset(1)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all duration-200 focus:outline-none border ${
                      dateOffset === 1
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-100'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    🌅 Ngày mai
                  </button>
                </div>
              </div>

              {/* 2. Period Taps */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Khung giờ ước lượng
                </span>
                <div className="grid grid-cols-5 gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200/60">
                  {PERIODS.map((p) => (
                    <button
                      type="button"
                      key={p.value}
                      onClick={() => handleManualPeriodChange(p.value)}
                      className={`flex flex-col items-center py-1.5 rounded-lg text-[10px] font-bold transition-all duration-200 focus:outline-none ${
                        period === p.value
                          ? 'bg-white text-slate-800 shadow-xs border border-slate-200/50'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <span className="text-base mb-0.5 leading-none">{p.icon}</span>
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Specific Hour Selector Dropdown */}
              {period !== 'không_gấp' && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Giờ cụ thể (Tùy chọn)
                  </span>
                  <select
                    value={hour === undefined ? 'none' : hour}
                    onChange={(e) => handleManualHourChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700 px-3 py-2.5 rounded-xl outline-none focus:border-indigo-400 focus:bg-white transition-all duration-200"
                    id="manual-hour-dropdown"
                  >
                    <option value="none">Không chọn giờ chính xác (chỉ chọn buổi)</option>
                    {HOURS.map((hr) => {
                      const hrPeriod = getPeriodForHour(hr);
                      // Only allow selecting hour matching current period
                      if (hrPeriod !== period) return null;
                      return (
                        <option key={hr} value={hr}>
                          {hr < 10 ? `0${hr}` : hr}:00 ({hrPeriod.toUpperCase()})
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* Custom manual title field override if needed */}
              {nlpInput && title && title !== nlpInput && (
                <div className="flex flex-col gap-1 text-[11px] text-slate-400 bg-slate-50 p-2.5 rounded-xl">
                  <div className="flex items-center gap-1 text-slate-500 font-semibold">
                    <Check className="w-3.5 h-3.5 text-emerald-500" /> Tên việc đã tách:
                  </div>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-transparent border-b border-indigo-200 focus:border-indigo-500 text-xs font-bold text-slate-700 outline-none mt-0.5 py-0.5"
                  />
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-bold transition-colors duration-200 focus:outline-none"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!(title.trim() || nlpInput.trim())}
                  className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-100 transition-colors duration-200 focus:outline-none flex items-center justify-center gap-1.5"
                  id="add-task-submit-btn"
                >
                  <Check className="w-4 h-4 stroke-[3]" /> Thêm Lịch Trình
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
