import { useState } from 'react';
import { changeAdminPassword } from '../lib/api';

const INITIAL_FORM = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

export default function AdminPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const response = await changeAdminPassword(form);
      setSuccessMessage(response.message || '비밀번호가 변경되었습니다');
      setForm(INITIAL_FORM);
    } catch (error) {
      setErrorMessage(error.message || '비밀번호 변경에 실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-xl">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          관리자 비밀번호 변경
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          현재 관리자 비밀번호를 확인한 뒤 새 비밀번호로 변경합니다.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="currentPassword"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              현재 비밀번호
            </label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              value={form.currentPassword}
              onChange={handleChange}
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-gray-300"
            />
          </div>

          <div>
            <label
              htmlFor="newPassword"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              새 비밀번호
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              value={form.newPassword}
              onChange={handleChange}
              required
              autoComplete="new-password"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-gray-300"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              영문/숫자 포함 8자 이상
            </p>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              새 비밀번호 확인
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              autoComplete="new-password"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-gray-300"
            />
          </div>

          {successMessage ? (
            <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950/30 dark:text-green-300">
              {successMessage}
            </p>
          ) : null}

          {errorMessage ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-gray-100"
          >
            {isSubmitting ? '변경 중...' : '비밀번호 변경'}
          </button>
        </form>
      </div>
    </section>
  );
}
