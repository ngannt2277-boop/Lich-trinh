/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Bell, RefreshCw, Smartphone, AlertCircle, HelpCircle } from 'lucide-react';
import { Task, TaskPeriod } from './types';
import { formatDateStr } from './components/WeekView';

// Import components
import ProgressBar from './components/ProgressBar';
import WeekView from './components/WeekView';
import Timeline from './components/Timeline';
import QuickAddModal from './components/QuickAddModal';
import NotificationToast, { ToastMessage } from './components/NotificationToast';

// Local storage key
const STORAGE_KEY = 'PERSONAL_DAILY_PLANNER_TASKS_V1';
const NOTIFIED_KEY = 'PERSONAL_DAILY_PLANNER_NOTIFIED_TASKS_V1';

// Seed initial tasks if empty
const getInitialTasks = (): Task[] => {
  const todayStr = formatDateStr(new Date());
  
  // Tomorrow and Yesterday helpers for the seed
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = formatDateStr(tomorrow);

  return [
    {
      id: 'seed-1',
      title: '🌅 Ăn sáng & uống cafe khởi đầu ngày mới',
      date: todayStr,
      period: 'sáng',
      timeLabel: '7h',
      hour: 7,
      completed: true,
      createdAt: Date.now() - 40000,
    },
    {
      id: 'seed-2',
      title: '👥 Họp khởi động dự án mới với team',
      date: todayStr,
      period: 'sáng',
      timeLabel: '9h',
      hour: 9,
      completed: false,
      createdAt: Date.now() - 30000,
    },
    {
      id: 'seed-3',
      title: '🍱 Nghỉ trưa & thưởng thức bữa trưa lành mạnh',
      date: todayStr,
      period: 'trưa',
      timeLabel: '12h',
      hour: 12,
      completed: false,
      createdAt: Date.now() - 20000,
    },
    {
      id: 'seed-4',
      title: '🏃‍♂️ Chạy bộ 3km tại công viên gần nhà',
      date: todayStr,
      period: 'chiều',
      timeLabel: '17h',
      hour: 17,
      completed: false,
      createdAt: Date.now() - 10000,
    },
    {
      id: 'seed-5',
      title: '📚 Đọc 10 trang sách kỹ năng sống',
      date: todayStr,
      period: 'tối',
      timeLabel: 'Buổi tối',
      completed: false,
      createdAt: Date.now() - 5000,
    },
    {
      id: 'seed-6',
      title: '🛒 Lên danh sách mua sắm đồ dùng gia đình',
      date: todayStr,
      period: 'không_gấp',
      timeLabel: 'Không có giờ',
      completed: false,
      createdAt: Date.now(),
    },
    {
      id: 'seed-7',
      title: '🌟 Lên kế hoạch công việc cho tuần sau',
      date: tomorrowStr,
      period: 'sáng',
      timeLabel: 'Buổi sáng',
      completed: false,
      createdAt: Date.now() + 10000,
    }
  ];
};

export default function App() {
  // --- STATES ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDateStr, setSelectedDateStr] = useState<string>('');
  
  // Real-time tracking
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeToasts, setActiveToasts] = useState<ToastMessage[]>([]);
  
  // Modal toggle states
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [preselectedHour, setPreselectedHour] = useState<number | undefined>(undefined);
  const [preselectedPeriod, setPreselectedPeriod] = useState<TaskPeriod | undefined>(undefined);

  // Swipe gesture refs
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // --- INITIAL LOAD ---
  useEffect(() => {
    // Set selected date to today initially
    setSelectedDateStr(formatDateStr(new Date()));

    // Load tasks from storage or seed
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setTasks(JSON.parse(stored));
      } catch (e) {
        setTasks(getInitialTasks());
      }
    } else {
      const initial = getInitialTasks();
      setTasks(initial);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    }
  }, []);

  // Sync tasks to LocalStorage on changes
  const saveTasks = (updatedTasks: Task[]) => {
    setTasks(updatedTasks);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTasks));
  };

  // --- REAL-TIME TIMER TICK & NOTIFICATIONS ---
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      // Run reminder checks
      checkReminders(now);
    }, 15000); // Check every 15 seconds

    return () => clearInterval(interval);
  }, [tasks]);

  const checkReminders = (now: Date) => {
    const todayStr = formatDateStr(now);
    const nowHour = now.getHours();
    const nowMinute = now.getMinutes();
    const nowMins = nowHour * 60 + nowMinute;

    // Load already notified tasks from this session or sessionStorage
    const notifiedRaw = sessionStorage.getItem(NOTIFIED_KEY);
    const notifiedIds: string[] = notifiedRaw ? JSON.parse(notifiedRaw) : [];

    // Filter tasks due today that are not completed and have precise times
    const pendingTodayTasks = tasks.filter(
      (t) => t.date === todayStr && !t.completed && t.hour !== undefined
    );

    const newToasts: ToastMessage[] = [];
    let updatedNotified = [...notifiedIds];

    pendingTodayTasks.forEach((task) => {
      if (task.hour === undefined) return;
      if (notifiedIds.includes(task.id)) return;

      const taskMins = task.hour * 60 + (task.minute || 0);
      const diff = taskMins - nowMins;

      // Gentle alert if the task is coming up in 1 to 15 minutes
      if (diff > 0 && diff <= 15) {
        newToasts.push({
          id: `${task.id}-${Date.now()}`,
          task,
          minutesRemaining: diff,
        });
        updatedNotified.push(task.id);
      }
    });

    if (newToasts.length > 0) {
      setActiveToasts((prev) => [...prev, ...newToasts]);
      sessionStorage.setItem(NOTIFIED_KEY, JSON.stringify(updatedNotified));
    }
  };

  // --- ACTIONS ---
  const handleAddTask = (taskData: {
    title: string;
    period: TaskPeriod;
    timeLabel: string;
    hour?: number;
    minute?: number;
    targetDateOffset: number;
  }) => {
    // Calculate final target date based on selected date + offset
    const refDate = new Date(selectedDateStr);
    refDate.setDate(refDate.getDate() + taskData.targetDateOffset);
    const targetDateStr = formatDateStr(refDate);

    const newTask: Task = {
      id: 'task-' + Math.random().toString(36).substr(2, 9),
      title: taskData.title,
      date: targetDateStr,
      period: taskData.period,
      timeLabel: taskData.timeLabel,
      hour: taskData.hour,
      minute: taskData.minute || 0,
      completed: false,
      createdAt: Date.now(),
    };

    const updated = [newTask, ...tasks];
    saveTasks(updated);

    // If task was scheduled at an hour, show brief visual confirmation
    triggerNotificationPermissionRequest();
  };

  const handleToggleComplete = (id: string) => {
    const updated = tasks.map((t) => {
      if (t.id === id) {
        return { ...t, completed: !t.completed };
      }
      return t;
    });
    saveTasks(updated);
  };

  const handleDeleteTask = (id: string) => {
    const updated = tasks.filter((t) => t.id !== id);
    saveTasks(updated);

    // Also clear active toasts for this task
    setActiveToasts((prev) => prev.filter((toast) => toast.task.id !== id));
  };

  const handleCompleteFromToast = (taskId: string) => {
    handleToggleComplete(taskId);
    // Dismiss the corresponding toast
    setActiveToasts((prev) => prev.filter((toast) => toast.task.id !== taskId));
  };

  const handleDismissToast = (toastId: string) => {
    setActiveToasts((prev) => prev.filter((toast) => toast.id !== toastId));
  };

  // Web notifications permission helper as an extra nice feature
  const triggerNotificationPermissionRequest = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  // --- DAY SWIPE NAVIGATION ---
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    const diffY = touchStartY.current - e.changedTouches[0].clientY;

    // Detect horizontal swipe (swipe left = next day, swipe right = prev day)
    // Ensure horizontal motion is stronger than vertical scroll to prevent unwanted jumps
    if (Math.abs(diffX) > 75 && Math.abs(diffY) < 50) {
      const currentRef = new Date(selectedDateStr);
      if (diffX > 0) {
        // Swipe left -> Next day (Ngày mai)
        currentRef.setDate(currentRef.getDate() + 1);
      } else {
        // Swipe right -> Prev day (Hôm qua)
        currentRef.setDate(currentRef.getDate() - 1);
      }
      setSelectedDateStr(formatDateStr(currentRef));
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleQuickAddClick = () => {
    setPreselectedHour(undefined);
    setPreselectedPeriod(undefined);
    setIsQuickAddOpen(true);
  };

  const handleQuickAddAtHour = (hour: number, period: TaskPeriod) => {
    setPreselectedHour(hour);
    setPreselectedPeriod(period);
    setIsQuickAddOpen(true);
  };

  // --- RENDER HELPERS ---
  const todayStr = formatDateStr(new Date());
  
  const getVietnameseFullDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Lịch trình';
      const vnDays = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      return `${vnDays[d.getDay()]}, ${d.getDate()} Tháng ${d.getMonth() + 1}`;
    } catch (e) {
      return 'Lịch trình';
    }
  };

  const getVietnameseGreeting = () => {
    const hr = currentTime.getHours();
    if (hr >= 5 && hr < 11) return 'Chào buổi sáng, ngày mới tốt lành!';
    if (hr >= 11 && hr < 14) return 'Chào buổi trưa, nạp năng lượng thôi!';
    if (hr >= 14 && hr < 18) return 'Chào buổi chiều, cố gắng lên nào!';
    return 'Chào buổi tối, nghỉ ngơi thư giãn nhé!';
  };

  const selectedDateLabel = () => {
    if (selectedDateStr === todayStr) return 'Hôm nay';
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (selectedDateStr === formatDateStr(tomorrow)) return 'Ngày mai';
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (selectedDateStr === formatDateStr(yesterday)) return 'Hôm qua';

    // Format readable Date label (e.g. Thứ Bảy, 04/07)
    const d = new Date(selectedDateStr);
    const vnDays = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    return `${vnDays[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}`;
  };

  // Stats for the active day
  const activeDayTasks = tasks.filter((t) => t.date === selectedDateStr);
  const completedCount = activeDayTasks.filter((t) => t.completed).length;
  const totalCount = activeDayTasks.length;

  // Real-time info
  const nowHour = currentTime.getHours();
  const nowMinute = currentTime.getMinutes();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center font-sans py-0 sm:py-8" id="app-viewport">
      {/* Immersive Mobile Device Frame Wrapper for Desktop */}
      <div className="relative w-full sm:max-w-md bg-white/95 backdrop-blur-xl min-h-screen sm:min-h-[85vh] sm:rounded-[40px] sm:shadow-2xl overflow-hidden border border-slate-200/80 flex flex-col glass">
        
        {/* Device Notch decoration on Desktop */}
        <div className="hidden sm:block absolute top-0 left-1/2 -translate-x-1/2 w-40 h-6 bg-slate-900 rounded-b-2xl z-40 flex items-center justify-center">
          <div className="w-12 h-1 bg-slate-700 rounded-full mb-1" />
          <div className="w-3.5 h-3.5 bg-slate-800 rounded-full absolute right-6 border border-slate-700" />
        </div>

        {/* 1. APP HEADER */}
        <header className="px-5 pt-8 pb-4 border-b border-slate-100 flex items-start justify-between z-10 shrink-0 bg-white/40 backdrop-blur-md">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              {getVietnameseFullDate(selectedDateStr)}
            </h1>
            <p className="text-slate-500 text-[11px] font-medium leading-tight">
              {getVietnameseGreeting()}
            </p>
          </div>
          <div className="flex items-center gap-1.5 pt-1.5">
            {/* Status indicators */}
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">Live</span>
          </div>
        </header>

        {/* 2. MAIN CONTAINER WITH GESTURE LISTENER */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="flex-1 flex flex-col overflow-y-auto px-4 pt-3 pb-24"
          id="main-scrollable-section"
        >
          {/* Week Horizontal strip */}
          <WeekView
            selectedDateStr={selectedDateStr}
            onSelectDate={setSelectedDateStr}
            tasks={tasks}
          />

          {/* Progress Overview */}
          <ProgressBar
            completedCount={completedCount}
            totalCount={totalCount}
            dateLabel={selectedDateLabel()}
          />

          {/* Swipe Tip Alert Banner (Shows briefly) */}
          <div className="flex items-center justify-between px-3 py-2 bg-indigo-50/40 border border-indigo-100/30 rounded-xl mb-4 text-[10px] text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              Tip: Vuốt ngang màn hình để đổi ngày!
            </span>
            <span className="font-mono text-indigo-600 font-bold uppercase">{selectedDateLabel()}</span>
          </div>

          {/* Vertical Time Line Content */}
          <Timeline
            selectedDateStr={selectedDateStr}
            tasks={tasks}
            onToggleComplete={handleToggleComplete}
            onDelete={handleDeleteTask}
            onQuickAddAtHour={handleQuickAddAtHour}
            nowHour={nowHour}
            nowMinute={nowMinute}
          />
        </div>

        {/* 3. FLOATING ACTION BUTTON (FAB) */}
        <div className="absolute bottom-5 right-5 z-20">
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={handleQuickAddClick}
            className="w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-200/80 cursor-pointer focus:outline-none"
            id="fab-quick-add-btn"
            title="Thêm công việc nhanh"
          >
            <Plus className="w-7 h-7 stroke-[2.5]" />
          </motion.button>
        </div>

        {/* 4. MODALS & NOTIFICATIONS */}
        <QuickAddModal
          isOpen={isQuickAddOpen}
          onClose={() => setIsQuickAddOpen(false)}
          onAddTask={handleAddTask}
          preselectedHour={preselectedHour}
          preselectedPeriod={preselectedPeriod}
        />

        <NotificationToast
          activeToasts={activeToasts}
          onDismiss={handleDismissToast}
          onCompleteTask={handleCompleteFromToast}
        />
      </div>
    </div>
  );
}
