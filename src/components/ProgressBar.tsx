/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Circle } from 'lucide-react';

interface ProgressBarProps {
  completedCount: number;
  totalCount: number;
  dateLabel: string;
}

export default function ProgressBar({ completedCount, totalCount, dateLabel }: ProgressBarProps) {
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-slate-100/60 mb-4" id="progress-bar-container">
      <div className="flex justify-between items-center mb-2">
        <div>
          <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">{dateLabel}</span>
          <h2 className="text-sm font-semibold text-slate-800 mt-0.5">
            {totalCount === 0 ? (
              'Thảnh thơi, chưa có việc nào!'
            ) : percentage === 100 ? (
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 inline" /> Đã hoàn thành tất cả việc!
              </span>
            ) : (
              `Đã xong ${completedCount}/${totalCount} công việc`
            )}
          </h2>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold text-slate-800 font-mono">{percentage}%</span>
        </div>
      </div>
      
      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden relative">
        <motion.div
          className="h-full bg-emerald-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          id="progress-bar-fill"
        />
      </div>
    </div>
  );
}
