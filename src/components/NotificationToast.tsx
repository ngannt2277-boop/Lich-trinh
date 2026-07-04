/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Check, X, Clock } from 'lucide-react';
import { Task } from '../types';

interface ToastMessage {
  id: string;
  task: Task;
  minutesRemaining: number;
}

interface NotificationToastProps {
  activeToasts: ToastMessage[];
  onDismiss: (id: string) => void;
  onCompleteTask: (taskId: string) => void;
}

export default function NotificationToast({
  activeToasts,
  onDismiss,
  onCompleteTask,
}: NotificationToastProps) {
  return (
    <div className="fixed top-4 left-4 right-4 z-50 flex flex-col gap-3 max-w-sm mx-auto pointer-events-none select-none" id="notification-toast-container">
      <AnimatePresence>
        {activeToasts.map((toast) => {
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl border border-slate-800/80 pointer-events-auto flex gap-3.5 items-start"
              id={`toast-banner-${toast.id}`}
            >
              {/* Icon Container */}
              <div className="w-9 h-9 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 animate-bounce" />
              </div>

              {/* Message Details */}
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3" /> Nhắc nhở lịch trình
                </h4>
                <p className="text-sm font-semibold text-white mt-1 break-words">
                  {toast.task.title}
                </p>
                <p className="text-xs text-slate-300 mt-0.5">
                  Sẽ diễn ra trong <span className="text-amber-400 font-bold font-mono">{toast.minutesRemaining} phút</span> nữa.
                </p>

                {/* Toast actions */}
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => onCompleteTask(toast.task.id)}
                    className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors duration-200"
                    id={`toast-complete-${toast.task.id}`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" /> Xong ngay
                  </button>
                  <button
                    onClick={() => onDismiss(toast.id)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors duration-200"
                  >
                    Để sau
                  </button>
                </div>
              </div>

              {/* Dismiss close button */}
              <button
                onClick={() => onDismiss(toast.id)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
export type { ToastMessage };
