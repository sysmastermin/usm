import { useEffect, useRef, useCallback } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * 삭제 확인 모달
 * - Focus trap: Tab으로 모달 내부만 순회
 * - aria-modal, role="dialog" 접근성
 * - ESC 키 / 외부 클릭으로 닫기
 *
 * @param {object} props
 * @param {boolean} props.open - 모달 표시 여부
 * @param {function} props.onClose - 닫기 콜백
 * @param {function} props.onConfirm - 확인 콜백
 * @param {string} [props.title] - 제목
 * @param {string} [props.message] - 확인 메시지
 * @param {string} [props.confirmText] - 확인 버튼 텍스트
 * @param {boolean} [props.loading] - 로딩 상태
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = '삭제 확인',
  message =
    '정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
  confirmText = '삭제',
  loading = false,
}) {
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);

  // 열릴 때 취소 버튼에 포커스
  useEffect(() => {
    if (open) {
      // RAF로 한 프레임 뒤에 포커스 이동
      requestAnimationFrame(() => {
        cancelRef.current?.focus();
      });
    }
  }, [open]);

  // Focus trap + ESC 닫기
  const handleKeyDown = useCallback(
    (e) => {
      if (!open) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
        return;
      }

      if (e.key !== 'Tab') return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusable = dialog.querySelectorAll(
        'button:not([disabled]), ' +
        '[href], input, select, textarea, ' +
        '[tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [open, onClose]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () =>
      window.removeEventListener(
        'keydown',
        handleKeyDown
      );
  }, [handleKeyDown]);

  // 바깥 클릭 닫기
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  if (!open) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50',
        'flex items-center justify-center p-4',
        'bg-black/50 backdrop-blur-sm'
      )}
      onClick={handleBackdrop}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        className={cn(
          'bg-white dark:bg-gray-800 rounded-xl',
          'w-full max-w-sm p-6 shadow-2xl relative',
          'animate-in fade-in zoom-in-95'
        )}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          aria-label="닫기"
          className={cn(
            'absolute top-4 right-4',
            'text-gray-400 hover:text-gray-600',
            'dark:hover:text-gray-300',
            'min-w-[44px] min-h-[44px]',
            'flex items-center justify-center'
          )}
        >
          <X className="w-5 h-5" />
        </button>

        {/* 아이콘 */}
        <div className="flex justify-center mb-4">
          <div
            className={cn(
              'w-12 h-12 rounded-full',
              'bg-red-100 dark:bg-red-900/30',
              'flex items-center justify-center'
            )}
          >
            <AlertTriangle
              className={cn(
                'w-6 h-6',
                'text-red-600 dark:text-red-400'
              )}
            />
          </div>
        </div>

        {/* 내용 */}
        <h3
          id="confirm-dialog-title"
          className={cn(
            'text-lg font-semibold text-center mb-2',
            'text-gray-900 dark:text-white'
          )}
        >
          {title}
        </h3>
        <p
          id="confirm-dialog-desc"
          className={cn(
            'text-sm text-center mb-6',
            'text-gray-500 dark:text-gray-400'
          )}
        >
          {message}
        </p>

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            ref={cancelRef}
            onClick={onClose}
            disabled={loading}
            className={cn(
              'flex-1 py-2.5 rounded-lg',
              'text-sm font-medium',
              'bg-gray-100 dark:bg-gray-700',
              'text-gray-700 dark:text-gray-300',
              'hover:bg-gray-200 dark:hover:bg-gray-600',
              'transition-colors min-h-[44px]',
              'disabled:opacity-50'
            )}
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'flex-1 py-2.5 rounded-lg',
              'text-sm font-medium',
              'bg-red-600 text-white',
              'hover:bg-red-700',
              'transition-colors min-h-[44px]',
              'disabled:opacity-50'
            )}
          >
            {loading ? '처리 중...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
