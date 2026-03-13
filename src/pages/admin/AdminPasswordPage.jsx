import { useState } from 'react';
import { KeyRound, Eye, EyeOff } from 'lucide-react';
import { changeAdminPassword } from '../../lib/adminApi';
import { useToast } from '../../components/admin/Toast';
import { cn } from '../../lib/utils';

const INITIAL_FORM = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

/**
 * 관리자 비밀번호 변경 페이지
 * - 현재 비밀번호 검증 후 새 비밀번호로 변경
 * - 8자 이상 + 영문/숫자 포함 정책 적용
 */
export default function AdminPasswordPage() {
  const toast = useToast();
  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldError, setFieldError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const validateForm = () => {
    if (
      !form.currentPassword ||
      !form.newPassword ||
      !form.confirmPassword
    ) {
      return '모든 비밀번호 입력값이 필요합니다';
    }

    if (form.newPassword !== form.confirmPassword) {
      return '새 비밀번호 확인이 일치하지 않습니다';
    }

    if (form.newPassword.length < 8) {
      return '새 비밀번호는 8자 이상이어야 합니다';
    }

    if (
      !/[A-Za-z]/.test(form.newPassword) ||
      !/\d/.test(form.newPassword)
    ) {
      return '새 비밀번호는 영문과 숫자를 모두 포함해야 합니다';
    }

    if (form.currentPassword === form.newPassword) {
      return '새 비밀번호는 현재 비밀번호와 달라야 합니다';
    }

    return '';
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldError) {
      setFieldError('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;

    const validationError = validateForm();
    if (validationError) {
      setFieldError(validationError);
      return;
    }

    setLoading(true);
    setFieldError('');

    try {
      const res = await changeAdminPassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });

      toast.success(
        res.message || '관리자 비밀번호가 변경되었습니다'
      );
      setForm(INITIAL_FORM);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        '비밀번호 변경 중 오류가 발생했습니다';
      setFieldError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          관리자 비밀번호 변경
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          로그인 비밀번호를 안전한 값으로 변경합니다.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className={cn(
          'bg-white dark:bg-gray-800 rounded-xl p-5 sm:p-6',
          'border border-gray-200 dark:border-gray-700',
          'space-y-4'
        )}
      >
        <PasswordField
          id="currentPassword"
          name="currentPassword"
          label="현재 비밀번호"
          value={form.currentPassword}
          onChange={handleChange}
          placeholder="현재 비밀번호 입력"
          visible={showCurrent}
          onToggleVisible={() => setShowCurrent((prev) => !prev)}
        />

        <PasswordField
          id="newPassword"
          name="newPassword"
          label="새 비밀번호"
          value={form.newPassword}
          onChange={handleChange}
          placeholder="새 비밀번호 입력"
          visible={showNew}
          onToggleVisible={() => setShowNew((prev) => !prev)}
        />

        <p className="text-xs text-gray-500 dark:text-gray-400">
          영문/숫자 포함 8자 이상
        </p>

        <PasswordField
          id="confirmPassword"
          name="confirmPassword"
          label="새 비밀번호 확인"
          value={form.confirmPassword}
          onChange={handleChange}
          placeholder="새 비밀번호 다시 입력"
          visible={showConfirm}
          onToggleVisible={() => setShowConfirm((prev) => !prev)}
        />

        {fieldError && (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
          >
            {fieldError}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className={cn(
            'w-full sm:w-auto min-w-[160px] min-h-[44px]',
            'px-4 py-2.5 rounded-lg text-sm font-medium',
            'bg-gray-900 dark:bg-white',
            'text-white dark:text-gray-900',
            'hover:bg-gray-800 dark:hover:bg-gray-100',
            'transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {loading ? '변경 중...' : '비밀번호 변경'}
        </button>
      </form>
    </div>
  );
}

function PasswordField({
  id,
  name,
  label,
  value,
  onChange,
  placeholder,
  visible,
  onToggleVisible,
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
      </label>
      <div className="relative">
        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          required
          autoComplete={
            name === 'currentPassword'
              ? 'current-password'
              : 'new-password'
          }
          placeholder={placeholder}
          className={cn(
            'w-full pl-10 pr-12 py-3 min-h-[48px]',
            'text-sm rounded-lg',
            'bg-white dark:bg-gray-700',
            'border border-gray-300 dark:border-gray-600',
            'text-gray-900 dark:text-white',
            'placeholder-gray-400 dark:placeholder-gray-500',
            'focus:outline-none focus:ring-2',
            'focus:ring-gray-900/20 dark:focus:ring-white/20',
            'focus:border-gray-900 dark:focus:border-white'
          )}
        />
        <button
          type="button"
          onClick={onToggleVisible}
          className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 min-w-[44px]"
          aria-label={`${label} 표시 전환`}
        >
          {visible ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
