import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from 'react';
import {
  CheckCircle,
  AlertCircle,
  Info,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const ToastContext = createContext(null);
const MAX_TOASTS = 3;

/**
 * 토스트 알림 프로바이더
 * - success / error / info 3종
 * - 최대 3개 동시 표시 (FIFO 자동 해제)
 * - 동일 메시지 중복 방지
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const removeToast = useCallback((id) => {
    setToasts((prev) =>
      prev.filter((t) => t.id !== id)
    );
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const addToast = useCallback(
    (type, message, duration = 3000) => {
      setToasts((prev) => {
        // 중복 메시지 방지
        if (prev.some(
          (t) => t.message === message && t.type === type
        )) {
          return prev;
        }

        const id = Date.now() + Math.random();

        // FIFO: 최대 개수 초과 시 가장 오래된 것 제거
        let next = [...prev, { id, type, message }];
        if (next.length > MAX_TOASTS) {
          const removed = next.shift();
          if (removed) {
            const timer = timers.current.get(removed.id);
            if (timer) {
              clearTimeout(timer);
              timers.current.delete(removed.id);
            }
          }
        }

        // 자동 소멸 타이머
        const timer = setTimeout(() => {
          removeToast(id);
        }, duration);
        timers.current.set(id, timer);

        return next;
      });
    },
    [removeToast]
  );

  const toast = {
    success: (msg) => addToast('success', msg),
    error: (msg) => addToast('error', msg, 5000),
    info: (msg) => addToast('info', msg),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* 토스트 컨테이너 */}
      <div
        className={cn(
          'fixed top-4 right-4 z-[100]',
          'space-y-2 max-w-sm w-full',
          'pointer-events-none'
        )}
      >
        {toasts.map((t) => (
          <ToastItem
            key={t.id}
            {...t}
            onClose={() => removeToast(t.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ type, message, onClose }) {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
  };
  const colors = {
    success:
      'bg-green-50 dark:bg-green-900/30 ' +
      'border-green-200 dark:border-green-800 ' +
      'text-green-800 dark:text-green-200',
    error:
      'bg-red-50 dark:bg-red-900/30 ' +
      'border-red-200 dark:border-red-800 ' +
      'text-red-800 dark:text-red-200',
    info:
      'bg-blue-50 dark:bg-blue-900/30 ' +
      'border-blue-200 dark:border-blue-800 ' +
      'text-blue-800 dark:text-blue-200',
  };

  const Icon = icons[type] || Info;

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4',
        'rounded-lg border shadow-lg',
        'pointer-events-auto',
        'animate-in slide-in-from-right fade-in',
        colors[type] || colors.info
      )}
    >
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <p className="text-sm flex-1">{message}</p>
      <button
        onClick={onClose}
        className={cn(
          'shrink-0 opacity-60 hover:opacity-100',
          'min-w-[32px] min-h-[32px]',
          'flex items-center justify-center'
        )}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

/**
 * 토스트 훅
 * @returns {{ success, error, info }}
 */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error(
      'useToast must be used inside ToastProvider'
    );
  }
  return ctx;
}
