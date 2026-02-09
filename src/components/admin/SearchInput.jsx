import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * 디바운스 검색 입력
 * @param {object} props
 * @param {string} props.value - 외부 제어 값
 * @param {function} props.onChange - 디바운스된 값 변경 콜백
 * @param {string} [props.placeholder]
 * @param {number} [props.debounce=300] - 디바운스 지연 (ms)
 */
export default function SearchInput({
  value = '',
  onChange,
  placeholder = '검색...',
  debounce = 300,
  className,
}) {
  const [local, setLocal] = useState(value);
  const timerRef = useRef(null);

  // 외부 값이 바뀌면 동기화
  useEffect(() => {
    setLocal(value);
  }, [value]);

  const handleChange = (e) => {
    const val = e.target.value;
    setLocal(val);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      onChange?.(val);
    }, debounce);
  };

  const handleClear = () => {
    setLocal('');
    onChange?.('');
  };

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        value={local}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(
          'w-full pl-10 pr-9 py-2.5',
          'text-sm rounded-lg',
          'bg-white dark:bg-gray-800',
          'border border-gray-300 dark:border-gray-600',
          'text-gray-900 dark:text-white',
          'placeholder-gray-400 dark:placeholder-gray-500',
          'focus:outline-none focus:ring-2',
          'focus:ring-gray-900/20 dark:focus:ring-white/20',
          'focus:border-gray-900 dark:focus:border-white',
          'min-h-[44px]'
        )}
      />
      {local && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 min-w-[44px] min-h-[44px] flex items-center justify-center -mr-3"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
